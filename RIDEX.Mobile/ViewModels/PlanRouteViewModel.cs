using System.Collections.ObjectModel;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using RIDEX.Mobile.Services;
using RIDEX.Shared.DTOs;
using RIDEX.Shared.Enums;

namespace RIDEX.Mobile.ViewModels;

public partial class PlanRouteViewModel : BaseViewModel
{
    private readonly IApiClient _apiClient;

    [ObservableProperty]
    private string _originName = "Nashik (Gangapur Road)";

    [ObservableProperty]
    private double _originLatitude = 19.9975;

    [ObservableProperty]
    private double _originLongitude = 73.7898;

    [ObservableProperty]
    private string _destinationName = "Pune (Shivaji Nagar)";

    [ObservableProperty]
    private double _destinationLatitude = 18.5204;

    [ObservableProperty]
    private double _destinationLongitude = 73.8567;

    [ObservableProperty]
    private RoutePreference _selectedPreference = RoutePreference.Scenic;

    [ObservableProperty]
    private ObservableCollection<WaypointDto> _waypoints = new();

    [ObservableProperty]
    private RouteDto? _calculatedRoute;

    [ObservableProperty]
    private string _newWaypointName = string.Empty;

    public PlanRouteViewModel(IApiClient apiClient)
    {
        _apiClient = apiClient;
        Title = "Plan Route";

        // Initial default scenic waypoints
        Waypoints.Add(new WaypointDto { Id = Guid.NewGuid(), Name = "Trimbakeshwar", Latitude = 19.9328, Longitude = 73.5307, Order = 1 });
        Waypoints.Add(new WaypointDto { Id = Guid.NewGuid(), Name = "Bhandardara Lake", Latitude = 19.5447, Longitude = 73.7663, Order = 2, IsFuelStop = true });
        Waypoints.Add(new WaypointDto { Id = Guid.NewGuid(), Name = "Malshej Ghat Waterfall", Latitude = 19.3400, Longitude = 73.7740, Order = 3 });
    }

    [RelayCommand]
    public void AddWaypoint()
    {
        if (string.IsNullOrWhiteSpace(NewWaypointName))
            return;

        Waypoints.Add(new WaypointDto
        {
            Id = Guid.NewGuid(),
            Name = NewWaypointName.Trim(),
            Latitude = 19.4500,
            Longitude = 73.7200,
            Order = Waypoints.Count + 1
        });

        NewWaypointName = string.Empty;
    }

    [RelayCommand]
    public void RemoveWaypoint(WaypointDto wp)
    {
        Waypoints.Remove(wp);
        for (int i = 0; i < Waypoints.Count; i++)
            Waypoints[i].Order = i + 1;
    }

    [RelayCommand]
    public async Task CalculateRouteAsync()
    {
        IsBusy = true;
        ClearError();

        try
        {
            var req = new RoutePlanRequest
            {
                OriginName = OriginName,
                OriginLatitude = OriginLatitude,
                OriginLongitude = OriginLongitude,
                DestinationName = DestinationName,
                DestinationLatitude = DestinationLatitude,
                DestinationLongitude = DestinationLongitude,
                Preference = SelectedPreference,
                Waypoints = Waypoints.ToList(),
                MotorcycleMileageKmpl = 24.5,
                FuelTankCapacityLiters = 17.0
            };

            CalculatedRoute = await _apiClient.PlanRouteAsync(req);
        }
        catch (Exception ex)
        {
            SetError("Using synthesized offline route: " + ex.Message);
        }
        finally
        {
            IsBusy = false;
        }
    }
}
