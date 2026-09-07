var builder = WebApplication.CreateBuilder(args);

// Skeleton M1: controllers + swagger + CORS cho FE. B1-B2 sẽ thêm EF, JWT, middleware lỗi chuẩn.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
        policy.WithOrigins("http://localhost:3000")
              .AllowAnyHeader()
              .AllowAnyMethod());
});

var app = builder.Build();

// Bật Swagger luôn ở skeleton để B0 demo được trong Docker (B5 có thể giới hạn lại).
app.UseSwagger();
app.UseSwaggerUI();

app.UseCors("Frontend");

// Không UseHttpsRedirection trong container skeleton (chỉ có HTTP 8080).
app.MapControllers();

// Health check skeleton: B2/B5 sẽ bổ sung kiểm tra DB thật.
app.MapGet("/health", () => Results.Ok(new
{
    status = "ok",
    db = "not-configured",
    time = DateTime.UtcNow
})).AllowAnonymous();

app.Run();
