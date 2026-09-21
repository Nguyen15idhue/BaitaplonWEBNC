using System.Text;
using System.Text.Json;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using Travela.Api.Data;
using Travela.Api.Helpers;
using Travela.Api.Middleware;
using Travela.Api.Services;

var builder = WebApplication.CreateBuilder(args);

// B1: EF Core + Pomelo MySQL.
// H14: dùng server version cố định thay ServerVersion.AutoDetect — AutoDetect mở
// kết nối ngay khi tạo DbContext (ngoài vòng retry) nên container crash khi MySQL chưa
// sẵn sàng lúc fresh up. MySQL 8.4 theo stack.
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<TravelaDbContext>(options =>
    options.UseMySql(connectionString, new MySqlServerVersion(new Version(8, 4, 0))));

// B2: Services.
builder.Services.AddSingleton<JwtHelper>();
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<UserService>();
builder.Services.AddScoped<AuditLogService>();
builder.Services.AddScoped<TourService>();
builder.Services.AddScoped<DestinationService>();
builder.Services.AddScoped<BookingService>();
builder.Services.AddScoped<CheckoutService>();
builder.Services.AddScoped<AdminStatsService>();
builder.Services.AddScoped<SupportService>();
// BE-03: job nền dọn refresh token hết hạn/đã thu hồi quá lâu.
builder.Services.AddHostedService<RefreshTokenCleanupService>();

// Fail-fast JWT ở Production (H13): thiếu/ngắn secret thì không cho chạy prod.
var jwtSecret = builder.Configuration["JWT_SECRET"]
    ?? builder.Configuration["Jwt:Secret"]
    ?? "dev-only-secret-change-me-min-32-chars!!";
var isProd = builder.Environment.IsProduction();
if (isProd && (string.IsNullOrWhiteSpace(jwtSecret) || jwtSecret.StartsWith("dev-only") || jwtSecret.Length < 32))
    throw new InvalidOperationException("JWT_SECRET production không hợp lệ (tối thiểu 32 ký tự, không dùng fallback dev).");

var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? JwtHelper.Issuer;
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? JwtHelper.Audience;

static async Task WriteError(HttpContext ctx, int status, string code, string message)
{
    ctx.Response.StatusCode = status;
    ctx.Response.ContentType = "application/json";
    await ctx.Response.WriteAsync(JsonSerializer.Serialize(new { error = code, message }));
}

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidIssuer = jwtIssuer,
            ValidAudience = jwtAudience,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
            ClockSkew = TimeSpan.Zero // N01: hết hạn là 401 ngay, không nới 1 phút.
        };
        // C01: 401/403 theo error contract {error,message}.
        options.Events = new JwtBearerEvents
        {
            OnChallenge = async ctx =>
            {
                ctx.HandleResponse();
                await WriteError(ctx.HttpContext, 401, "UNAUTHORIZED", "Thiếu hoặc phiên đăng nhập không hợp lệ.");
            },
            OnForbidden = async ctx =>
            {
                await WriteError(ctx.HttpContext, 403, "FORBIDDEN", "Bạn không có quyền thực hiện.");
            }
        };
    });
builder.Services.AddAuthorization();

// C3: rate-limit cụm auth (fixed-window theo IP, không cần Redis).
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = 429;
    options.AddPolicy("auth-login", ctx =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: ctx.Connection.RemoteIpAddress?.ToString() ?? "anon",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 10, Window = TimeSpan.FromMinutes(1), QueueLimit = 0
            }));
    options.AddPolicy("auth-register", ctx =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: ctx.Connection.RemoteIpAddress?.ToString() ?? "anon",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 5, Window = TimeSpan.FromMinutes(1), QueueLimit = 0
            }));
    options.OnRejected = async (ctx, _) =>
    {
        ctx.HttpContext.Response.ContentType = "application/json";
        await ctx.HttpContext.Response.WriteAsync(JsonSerializer.Serialize(
            new { error = "TOO_MANY_REQUESTS", message = "Thao tác quá nhanh, thử lại sau 1 phút." }));
    };
});

// B5: JSON camelCase + C01 model-validation theo contract.
builder.Services.AddControllers(options =>
{
    var policy = new AuthorizationPolicyBuilder(JwtBearerDefaults.AuthenticationScheme)
        .RequireAuthenticatedUser().Build();
    options.Filters.Add(new AuthorizeFilter(policy));
}).AddJsonOptions(o =>
{
    o.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
    o.JsonSerializerOptions.DictionaryKeyPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
});
builder.Services.Configure<ApiBehaviorOptions>(o =>
{
    o.InvalidModelStateResponseFactory = ctx =>
    {
        var msg = string.Join("; ", ctx.ModelState.Values
            .SelectMany(v => v.Errors).Select(e => e.ErrorMessage).Take(3));
        return new BadRequestObjectResult(new
        {
            error = "VALIDATION_ERROR",
            message = string.IsNullOrWhiteSpace(msg) ? "Dữ liệu không hợp lệ." : msg
        });
    };
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
        policy.WithOrigins("http://localhost:3000", "http://localhost:3001", "http://localhost:5173", "http://localhost:5174", "http://localhost:5175")
              .AllowAnyHeader()
              .AllowAnyMethod());
});

var app = builder.Build();

// H14: migrate có retry/backoff, không crash khi MySQL chưa ready. Prod nên chạy job riêng.
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<TravelaDbContext>();
    var logger = scope.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("Startup");
    const int maxTry = 40;
    for (var i = 1; i <= maxTry; i++)
    {
        try
        {
            db.Database.Migrate();
            DbSeeder.Seed(db);
            break;
        }
        catch (Exception ex) when (i < maxTry)
        {
            logger.LogWarning(ex, "DB chưa sẵn sàng (lần {Try}/{Max}), thử lại sau 3s...", i, maxTry);
            Thread.Sleep(3000);
        }
    }
}

app.UseMiddleware<ExceptionMiddleware>();

// Ảnh tour upload lưu ở wwwroot/uploads, phục vụ public (không cần đăng nhập).
var webRoot = Path.Combine(AppContext.BaseDirectory, "wwwroot");
Directory.CreateDirectory(webRoot);
builder.Environment.WebRootPath = webRoot;
app.UseStaticFiles();

// C5: Swagger chỉ ngoài Production.
if (!app.Environment.IsProduction())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("Frontend");
app.UseRateLimiter();
app.UseAuthentication();

// C02: lock có hiệu lực ngay — access token của user Locked bị chặn tại đây (+1 query).
app.Use(async (ctx, next) =>
{
    if (ctx.User.Identity?.IsAuthenticated == true)
    {
        var sub = ctx.User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value
            ?? ctx.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (int.TryParse(sub, out var uid))
        {
            var db = ctx.RequestServices.GetRequiredService<TravelaDbContext>();
            var status = await db.Users.AsNoTracking()
                .Where(u => u.Id == uid).Select(u => u.Status).FirstOrDefaultAsync();
            if (status == "Locked")
            {
                await WriteError(ctx, 401, "ACCOUNT_LOCKED", "Tài khoản đã bị khóa.");
                return;
            }
        }
    }
    await next();
});

app.UseAuthorization();

// Không UseHttpsRedirection trong container (chỉ có HTTP 8080).
app.MapControllers();

// M04: readiness trả 503 khi DB down (liveness vẫn qua /health/live).
app.MapGet("/health/live", () => Results.Ok(new { status = "ok", time = DateTime.UtcNow })).AllowAnonymous();
app.MapGet("/health", async (TravelaDbContext db) =>
{
    var ok = await db.Database.CanConnectAsync();
    if (!ok) return Results.Json(new { status = "degraded", db = "down", time = DateTime.UtcNow }, statusCode: 503);
    return Results.Ok(new { status = "ok", db = "up", time = DateTime.UtcNow });
}).AllowAnonymous();

app.Run();
