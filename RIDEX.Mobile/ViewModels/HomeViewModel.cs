using System.Collections.ObjectModel;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using RIDEX.Mobile.Services;
using RIDEX.Shared.DTOs;
using RIDEX.Shared.Enums;

namespace RIDEX.Mobile.ViewModels;

public partial class HomeViewModel : BaseViewModel
{
    private readonly IApiClient _apiClient;
    private readonly ILocalDatabaseService _localDb;
    private readonly IConnectivityService _connectivity;

    [ObservableProperty]
    private string _riderGreeting = "Good morning, Rider 👋";

    [ObservableProperty]
    private string _riderName = "Aryan Deshmukh";

    [ObservableProperty]
    private MotorcycleDto? _primaryMotorcycle;

    [ObservableProperty]
    private double _serviceDueKm = 280;

    [ObservableProperty]
    private string _serviceDueTitle = "Engine Oil & Filter";

    [ObservableProperty]
    private RideDto? _upcomingRide;

    [ObservableProperty]
    private WeatherForecastDto? _currentWeather;

    [ObservableProperty]
    private ObservableCollection<ServiceReminderDto> _activeReminders = new();

    public HomeViewModel(
        IApiClient apiClient,
        ILocalDatabaseService localDb,
        IConnectivityService connectivity)
    {
        _apiClient = apiClient;
        _localDb = localDb;
        _connectivity = connectivity;

        Title = "Home";
        NetworkState = _connectivity.CurrentState;
        _connectivity.StateChanged += (s, state) => NetworkState = state;
    }

    [RelayCommand]
    public async Task LoadDashboardAsync()
    {
        IsBusy = true;
        ClearError();

        try
        {
            var hour = DateTime.Now.Hour;
            var greetingWord = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

            var user = await _localDb.GetCurrentUserAsync();
            if (user != null)
            {
                RiderName = user.FullName;
                RiderGreeting = $"{greetingWord}, {user.FullName.Split(' ').FirstOrDefault()} 👋";
            }

            // 1. Fetch Primary Motorcycle & Reminders
            var bikes = await _apiClient.GetMotorcyclesAsync();
            PrimaryMotorcycle = bikes.FirstOrDefault(b => b.IsPrimary) ?? bikes.FirstOrDefault();

            if (PrimaryMotorcycle != null)
            {
                ServiceDueKm = 280; // Himalayan 450 default seed metric
                ServiceDueTitle = "Engine Oil & Filter";
            }

            // 2. Fetch Upcoming Ride
            var rides = await _apiClient.GetRidesAsync();
            UpcomingRide = rides.FirstOrDefault(r => r.Status == RideStatus.Upcoming || r.Status == RideStatus.InProgress);

            // 3. Fetch Weather for Current/Ride Origin Location (Nashik/Current)
            var lat = UpcomingRide?.Route?.OriginLatitude ?? 19.9975;
            var lon = UpcomingRide?.Route?.OriginLongitude ?? 73.7898;
            CurrentWeather = await _apiClient.GetWeatherForecastAsync(lat, lon, UpcomingRide?.Route?.OriginName ?? "Nashik");
        }
        catch
        {
            SetError("Running in offline mode. Local ride and bike telemetry active.");
        }
        finally
        {
            IsBusy = false;
        }
    }
}
