using Microsoft.EntityFrameworkCore;
using Travela.Api.Data;
using Travela.Api.Middleware;

var builder = WebApplication.CreateBuilder(args);

// B1: EF Core + Pomelo MySQL. Connection lấy từ appsettings, Docker override bằng
// biến môi trường ConnectionStrings__DefaultConnection (Server=mysql).
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<TravelaDbContext>(options =>
    options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString)));

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
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
