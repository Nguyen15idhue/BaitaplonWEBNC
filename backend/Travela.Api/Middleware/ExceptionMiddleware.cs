using System.Net;
using System.Text.Json;

namespace Travela.Api.Middleware;

// Lỗi chuẩn mọi API: { error: CODE, message }. Không trả stack trace.
// B2-B4 ném AppException với mã đã chốt (SELF_ACTION_DENIED, NOT_ENOUGH_SEATS...).
public class AppException : Exception
{
    public HttpStatusCode StatusCode { get; }
    public string ErrorCode { get; }

    public AppException(HttpStatusCode statusCode, string errorCode, string message)
        : base(message)
    {
        StatusCode = statusCode;
        ErrorCode = errorCode;
    }
}

public class ExceptionMiddleware
{
    private readonly RequestDelegate _next;

    public ExceptionMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (AppException ex)
        {
            context.Response.StatusCode = (int)ex.StatusCode;
            context.Response.ContentType = "application/json";
            await context.Response.WriteAsync(JsonSerializer.Serialize(new
            {
                error = ex.ErrorCode,
                message = ex.Message
            }));
        }
        catch (Exception)
        {
            context.Response.StatusCode = 500;
            context.Response.ContentType = "application/json";
            await context.Response.WriteAsync(JsonSerializer.Serialize(new
            {
                error = "INTERNAL_ERROR",
                message = "Đã có lỗi xảy ra."
            }));
        }
    }
}
