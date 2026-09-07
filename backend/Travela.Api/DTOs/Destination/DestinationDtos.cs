namespace Travela.Api.DTOs.Destination;

public class DestinationDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string RegionName { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
}

public class CreateDestinationRequest
{
    public string Name { get; set; } = string.Empty;
    public string RegionName { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
}
