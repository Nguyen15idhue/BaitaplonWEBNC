namespace Travela.Api.DTOs.Tour;

public class DestinationBriefDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string RegionName { get; set; } = string.Empty;
}

public class TourListDto
{
    public int Id { get; set; }
    public string TourName { get; set; } = string.Empty;
    public string Thumbnail { get; set; } = string.Empty;
    public decimal PriceFrom { get; set; }
    public DestinationBriefDto? Destination { get; set; }
    public string Status { get; set; } = string.Empty;
}

public class PriceDto
{
    public int Id { get; set; }
    public string SourceName { get; set; } = string.Empty;
    public decimal PriceValue { get; set; }
    public DateTime EffectiveDate { get; set; }
}

public class ImageDto
{
    public int Id { get; set; }
    public string ImageUrl { get; set; } = string.Empty;
    public string Caption { get; set; } = string.Empty;
    public int SortOrder { get; set; }
}

public class TourDetailDto : TourListDto
{
    public string Description { get; set; } = string.Empty;
    public int MaxSeats { get; set; }
    public int DestinationId { get; set; }
    public List<ImageDto> Images { get; set; } = new();
    public List<PriceDto> Prices { get; set; } = new();
}

public class CreateTourRequest
{
    public string TourName { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int DestinationId { get; set; }
    public int MaxSeats { get; set; }
    public string Status { get; set; } = "Draft";
}

public class UpdateTourRequest : CreateTourRequest
{
}

public class CreatePriceRequest
{
    public string SourceName { get; set; } = string.Empty;
    public decimal PriceValue { get; set; }
    public DateTime EffectiveDate { get; set; }
}

public class UpdatePriceRequest : CreatePriceRequest
{
}

public class CreateImageRequest
{
    public string ImageUrl { get; set; } = string.Empty;
    public string Caption { get; set; } = string.Empty;
    public int SortOrder { get; set; }
}
