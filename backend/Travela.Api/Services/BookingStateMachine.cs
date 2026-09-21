using System.Text.Json;
using Microsoft.Extensions.Logging;
using Travela.Api.DTOs.Booking;
using Travela.Api.Models;

namespace Travela.Api.Services;

// State machine + tracking dùng chung cho BookingService và BookingLifecycleService (auto).
public static class BookingStateMachine
{
    public static readonly Dictionary<string, string[]> Transitions = new()
    {
        ["PendingPayment"] = ["Paid", "Cancelled"],
        ["Paid"] = ["Confirmed", "Cancelled"],
        ["Confirmed"] = ["Ongoing", "Cancelled"],
        ["Ongoing"] = ["Completed", "Cancelled"],
        ["Completed"] = [],
        ["Cancelled"] = [],
    };

    private static readonly JsonSerializerOptions JsonOpts = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        PropertyNameCaseInsensitive = true
    };

    public static bool CanTransition(string from, string to)
        => Transitions.TryGetValue(from, out var allowed) && allowed.Contains(to);

    public static void AppendStep(Booking b, string status, string by, string note, ILogger? logger = null)
    {
        var steps = ParseSteps(b.TrackingTrace, logger);
        steps.Add(new TrackingStepDto { Status = status, At = DateTime.UtcNow, By = by, Note = note });
        b.TrackingTrace = JsonSerializer.Serialize(steps, JsonOpts);
    }

    public static List<TrackingStepDto> ParseSteps(string? trace, ILogger? logger = null)
    {
        if (string.IsNullOrWhiteSpace(trace)) return new();
        try
        {
            return JsonSerializer.Deserialize<List<TrackingStepDto>>(trace, JsonOpts) ?? new();
        }
        catch (JsonException ex)
        {
            // M07: không nuốt lỗi parse tracking — log warning để phát hiện corrupt.
            logger?.LogWarning(ex, "TrackingTrace corrupt ở booking");
            return new();
        }
    }
}
