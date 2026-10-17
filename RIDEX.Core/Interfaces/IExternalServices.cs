using RIDEX.Shared.DTOs;

namespace RIDEX.Core.Interfaces;

public interface IRoutingService
{
    Task<RouteDto> CalculateRouteAsync(RoutePlanRequest request, CancellationToken cancellationToken = default);
}

public interface IWeatherService
{
    Task<WeatherForecastDto> GetWeatherForecastAsync(double latitude, double longitude, string? locationName = null, CancellationToken cancellationToken = default);
    Task<List<RouteWeatherCheckpointDto>> GetRouteWeatherAsync(IReadOnlyList<(string Name, double Lat, double Lon)> checkpoints, CancellationToken cancellationToken = default);
}

public interface IGeocodingService
{
    Task<List<WaypointDto>> SearchLocationsAsync(string query, CancellationToken cancellationToken = default);
    Task<WaypointDto?> ReverseGeocodeAsync(double latitude, double longitude, CancellationToken cancellationToken = default);
}

public interface INotificationService
{
    Task SendLocalNotificationAsync(string title, string message, int notificationId = 0, CancellationToken cancellationToken = default);
}

public interface IFileStorageService
{
    Task<string> SaveFileAsync(Stream fileStream, string fileName, string contentType, CancellationToken cancellationToken = default);
    Task<Stream?> GetFileAsync(string filePath, CancellationToken cancellationToken = default);
    Task<bool> DeleteFileAsync(string filePath, CancellationToken cancellationToken = default);
}
