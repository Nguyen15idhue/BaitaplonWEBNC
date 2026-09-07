namespace Travela.Api.Models;

// destinations: điểm đến có sẵn theo vùng Bắc|Trung|Nam, tour gán vào đây.
public class Destination
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string RegionName { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;

    public ICollection<Tour> Tours { get; set; } = new List<Tour>();
}
