using System.Collections.ObjectModel;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using RIDEX.Mobile.Services;
using RIDEX.Shared.DTOs;
using RIDEX.Shared.Enums;

namespace RIDEX.Mobile.ViewModels;

public partial class LiveRideViewModel : BaseViewModel
{
    private readonly ISignalRClientService _signalRClient;
    private readonly ILocationTrackingService _trackingService;
    private readonly IApiClient _apiClient;
    private readonly IDemoSimulationService _demoSimulation;
    private readonly IMobileNotificationService _notificationService;

    [ObservableProperty]
    private Guid _rideId;

    [ObservableProperty]
    private string _rideTitle = "Monsoon Ghats Expedition";

    [ObservableProperty]
    private string _originDestination = "Nashik → Pune";

    [ObservableProperty]
    private RideStatus _rideStatus = RideStatus.InProgress;

    [ObservableProperty]
    private double _currentSpeedKmh = 54.0;

    [ObservableProperty]
    private double _totalDistanceKm = 342.0;

    [ObservableProperty]
    private double _completedDistanceKm = 128.5;

    [ObservableProperty]
    private double _remainingDistanceKm = 213.5;

    [ObservableProperty]
    private string _movingTimeFormatted = "02h 45m";

    [ObservableProperty]
    private double _estimatedFuelLiters = 14.2;

    [ObservableProperty]
    private double _batteryLevel = 88.0;

    [ObservableProperty]
    private ObservableCollection<RiderLiveStateDto> _riders = new();

    [ObservableProperty]
    private string? _activeSeparationAlert;

    [ObservableProperty]
    private bool _hasSeparationAlert;

    [ObservableProperty]
    private bool _isSosCountdownActive;

    [ObservableProperty]
    private int _sosCountdownSeconds = 5;

    [ObservableProperty]
    private bool _isSimulationActive;

    [ObservableProperty]
    private bool _isRiderPanelExpanded;

    private System.Timers.Timer? _sosTimer;

    public LiveRideViewModel(
        ISignalRClientService signalRClient,
        ILocationTrackingService trackingService,
        IApiClient apiClient,
        IDemoSimulationService demoSimulation,
        IMobileNotificationService notificationService)
    {
        _signalRClient = signalRClient;
        _trackingService = trackingService;
        _apiClient = apiClient;
        _demoSimulation = demoSimulation;
        _notificationService = notificationService;

        Title = "Live Ride";
        SetupSignalREvents();
    }

    private void SetupSignalREvents()
    {
        _signalRClient.OnLocationUpdated += OnRiderLocationUpdated;
        _signalRClient.OnSeparationAlert += (alert, uid, dist) =>
        {
            ActiveSeparationAlert = alert;
            HasSeparationAlert = true;
            _notificationService.ShowNotificationAsync("⚠️ Separation Warning", alert);
        };
        _signalRClient.OnEmergencyTriggered += alert =>
        {
            ActiveSeparationAlert = $"🚨 SOS Alert from {alert.UserName}: {alert.Message}";
            HasSeparationAlert = true;
        };
    }

    private void OnRiderLocationUpdated(RiderLiveStateDto state)
    {
        var existing = Riders.FirstOrDefault(r => r.UserId == state.UserId);
        if (existing != null)
        {
            existing.Latitude = state.Latitude;
            existing.Longitude = state.Longitude;
            existing.SpeedKmh = state.SpeedKmh;
            existing.Heading = state.Heading;
            existing.DistanceFromLeaderKm = state.DistanceFromLeaderKm;
            existing.OnlineStatus = state.OnlineStatus;
            existing.LastUpdatedAt = state.LastUpdatedAt;
            existing.IsSeparated = state.IsSeparated;
        }
        else
        {
            Riders.Add(state);
        }

        // If update is current user, update dashboard telemetry
        if (state.Role == RideRole.Owner || state.UserName.Contains("Aryan", StringComparison.OrdinalIgnoreCase))
        {
            CurrentSpeedKmh = state.SpeedKmh;
        }
    }

    [RelayCommand]
    public async Task InitializeRideAsync(Guid rideId)
    {
        RideId = rideId;
        IsBusy = true;

        try
        {
            var ride = await _apiClient.GetRideByIdAsync(rideId);
            if (ride != null)
            {
                RideTitle = ride.Title;
                RideStatus = ride.Status;
                TotalDistanceKm = ride.Route?.TotalDistanceKm ?? 342.0;
                OriginDestination = $"{ride.Route?.OriginName ?? "Nashik"} → {ride.Route?.DestinationName ?? "Pune"}";
            }

            var live = await _apiClient.GetLiveStateAsync(rideId);
            if (live != null)
            {
                Riders.Clear();
                foreach (var r in live.Riders)
                    Riders.Add(r);
            }

            await _trackingService.StartTrackingAsync(rideId);
            await _signalRClient.JoinRideAsync(rideId);
        }
        catch
        {
            // Seed demo riders if backend offline
            PopulateDemoRiders();
        }
        finally
        {
            IsBusy = false;
        }
    }

    private void PopulateDemoRiders()
    {
        Riders.Clear();
        Riders.Add(new RiderLiveStateDto { UserId = Guid.NewGuid(), UserName = "Aryan (You)", Role = RideRole.Owner, SpeedKmh = 58, DistanceFromLeaderKm = 0, OnlineStatus = RiderOnlineStatus.Online, Latitude = 19.5447, Longitude = 73.7663 });
        Riders.Add(new RiderLiveStateDto { UserId = Guid.NewGuid(), UserName = "Vikram Patil", Role = RideRole.CoLeader, SpeedKmh = 56, DistanceFromLeaderKm = 0.3, OnlineStatus = RiderOnlineStatus.Online, Latitude = 19.5420, Longitude = 73.7640 });
        Riders.Add(new RiderLiveStateDto { UserId = Guid.NewGuid(), UserName = "Neha Sharma", Role = RideRole.Member, SpeedKmh = 52, DistanceFromLeaderKm = 0.8, OnlineStatus = RiderOnlineStatus.Online, Latitude = 19.5380, Longitude = 73.7600 });
        Riders.Add(new RiderLiveStateDto { UserId = Guid.NewGuid(), UserName = "Rohan Mehta", Role = RideRole.Member, SpeedKmh = 42, DistanceFromLeaderKm = 2.4, OnlineStatus = RiderOnlineStatus.Online, IsSeparated = true, Latitude = 19.5200, Longitude = 73.7400 });
    }

    [RelayCommand]
    public void ToggleDemoSimulation()
    {
        if (IsSimulationActive)
        {
            _demoSimulation.StopSimulation();
            IsSimulationActive = false;
        }
        else
        {
            _demoSimulation.StartSimulation(RideId == Guid.Empty ? Guid.Parse("99999999-9999-9999-9999-999999999999") : RideId);
            IsSimulationActive = true;
        }
    }

    [RelayCommand]
    public void StartSosCountdown()
    {
        IsSosCountdownActive = true;
        SosCountdownSeconds = 5;

        _sosTimer?.Dispose();
        _sosTimer = new System.Timers.Timer(1000);
        _sosTimer.Elapsed += async (s, e) =>
        {
            SosCountdownSeconds--;
            if (SosCountdownSeconds <= 0)
            {
                _sosTimer?.Stop();
                IsSosCountdownActive = false;
                await TriggerSosConfirmedAsync();
            }
        };
        _sosTimer.Start();
    }

    [RelayCommand]
    public void CancelSos()
    {
        _sosTimer?.Stop();
        _sosTimer?.Dispose();
        IsSosCountdownActive = false;
        SosCountdownSeconds = 5;
    }

    private async Task TriggerSosConfirmedAsync()
    {
        var sosReq = new SosTriggerRequest
        {
            RideId = RideId,
            Latitude = 19.5447,
            Longitude = 73.7663,
            Altitude = 650,
            Message = "🚨 Immediate SOS Assistance Requested!"
        };

        try
        {
            await _signalRClient.TriggerEmergencyAsync(sosReq);
            await _apiClient.TriggerSosAsync(sosReq);
        }
        catch
        {
            await _notificationService.ShowNotificationAsync("🚨 Emergency Triggered Offline", "Call 112 / Emergency contact details displayed.");
        }
    }

    [RelayCommand]
    public void DismissSeparationAlert()
    {
        HasSeparationAlert = false;
        ActiveSeparationAlert = null;
    }
}
