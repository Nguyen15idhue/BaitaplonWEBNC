using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using Travela.Api.Data;
using Travela.Api.Helpers;
using Travela.Api.Middleware;
using Travela.Api.Services;

var builder = WebApplication.CreateBuilder(args);

// B1: EF Core + Pomelo MySQL. Connection lấy từ appsettings, Docker override bằng
// biến môi trường ConnectionStrings__DefaultConnection (Server=mysql).
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<TravelaDbContext>(options =>
    options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString)));

// B2: Services.
builder.Services.AddSingleton<JwtHelper>();
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<UserService>();
builder.Services.AddScoped<AuditLogService>();

// B2: JWT access. Secret từ JWT_SECRET env (xem docker-compose), fallback dev trong code.
var jwtSecret = builder.Configuration["JWT_SECRET"]
    ?? builder.Configuration["Jwt:Secret"]
    ?? "dev-only-secret-change-me-min-32-chars!!";
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = false,
            ValidateAudience = false,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
            ClockSkew = TimeSpan.FromMinutes(1)
        };
    });
builder.Services.AddAuthorization();

// B2: Default Deny — mọi controller yêu cầu đăng nhập trừ khi gắn [AllowAnonymous].
builder.Services.AddControllers(options =>
{
    var policy = new AuthorizationPolicyBuilder(JwtBearerDefaults.AuthenticationScheme)
        .RequireAuthenticatedUser().Build();
    options.Filters.Add(new AuthorizeFilter(policy));
});
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "Nhập access token: Bearer {token}",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT"
    });
    c.AddSecurityRequirement(document => new OpenApiSecurityRequirement
    {
        { new OpenApiSecuritySchemeReference("Bearer", document, null!), [] }
    });
});
builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
        policy.WithOrigins("http://localhost:3000", "http://localhost:3001")
              .AllowAnyHeader()
              .AllowAnyMethod());
});

var app = builder.Build();

// Auto-migrate + seed khi dev (ghi rõ theo B1.6). Production/Docker dev cũng chạy.
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<TravelaDbContext>();
    db.Database.Migrate();
    DbSeeder.Seed(db);
}

app.UseMiddleware<ExceptionMiddleware>();

// Bật Swagger luôn ở skeleton để B0 demo được trong Docker (B5 có thể giới hạn lại).
app.UseSwagger();
app.UseSwaggerUI();

app.UseCors("Frontend");
app.UseAuthentication();
app.UseAuthorization();

// Không UseHttpsRedirection trong container (chỉ có HTTP 8080).
app.MapControllers();

// Health check: kiểm tra kết nối DB thật (B1 nâng cấp từ skeleton not-configured).
app.MapGet("/health", async (TravelaDbContext db) =>
{
    var ok = await db.Database.CanConnectAsync();
    return Results.Ok(new
    {
        status = ok ? "ok" : "degraded",
        db = ok ? "up" : "down",
        time = DateTime.UtcNow
    });
}).AllowAnonymous();

app.Run();
