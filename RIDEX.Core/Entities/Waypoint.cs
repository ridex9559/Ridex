namespace RIDEX.Core.Entities;

public class Waypoint : BaseEntity
{
    public Guid RouteId { get; set; }
    public Route Route { get; set; } = null!;

    public string Name { get; set; } = string.Empty;
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public int Order { get; set; }
    public string? Address { get; set; }
    public bool IsFuelStop { get; set; }
}
