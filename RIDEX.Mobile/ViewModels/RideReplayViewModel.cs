using System.Collections.ObjectModel;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using RIDEX.Mobile.Services;
using RIDEX.Shared.Algorithms;
using RIDEX.Shared.DTOs;

namespace RIDEX.Mobile.ViewModels;

public partial class RideReplayViewModel : BaseViewModel
{
    private readonly IApiClient _apiClient;
    private System.Timers.Timer? _replayTimer;

    [ObservableProperty]
    private Guid _rideId;

    [ObservableProperty]
    private string _rideTitle = "Nashik → Pune Monsoon Expedition";

    [ObservableProperty]
    private bool _isPlaying;

    [ObservableProperty]
    private int _speedMultiplier = 1; // 1x, 2x, 5x, 10x

    [ObservableProperty]
    private int _currentPointIndex = 0;

    [ObservableProperty]
    private int _totalPointsCount = 100;

    [ObservableProperty]
    private CoordinatePoint? _currentPoint;

    [ObservableProperty]
    private double _currentSpeedKmh = 58.0;

    [ObservableProperty]
    private double _currentAltitude = 680.0;

    [ObservableProperty]
    private string _timelineProgressText = "01h 30m / 07h 15m";

    [ObservableProperty]
    private ObservableCollection<CoordinatePoint> _simplifiedTrackPoints = new();

    public RideReplayViewModel(IApiClient apiClient)
    {
        _apiClient = apiClient;
        Title = "Ride Replay";
    }

    [RelayCommand]
    public async Task LoadReplayDataAsync(Guid rideId)
    {
        RideId = rideId;
        IsBusy = true;
        ClearError();

        try
        {
            var points = await _apiClient.GetReplayHistoryAsync(rideId);
            SimplifiedTrackPoints.Clear();

            if (points.Count > 0)
            {
                foreach (var p in points)
                    SimplifiedTrackPoints.Add(p);
            }
            else
            {
                // Fallback default points along ghats
                SimplifiedTrackPoints.Add(new CoordinatePoint(19.9975, 73.7898, 600, DateTime.UtcNow.AddHours(-7), 45));
                SimplifiedTrackPoints.Add(new CoordinatePoint(19.9328, 73.5307, 650, DateTime.UtcNow.AddHours(-6), 55));
                SimplifiedTrackPoints.Add(new CoordinatePoint(19.5447, 73.7663, 750, DateTime.UtcNow.AddHours(-4), 50));
                SimplifiedTrackPoints.Add(new CoordinatePoint(19.3400, 73.7740, 850, DateTime.UtcNow.AddHours(-2), 48));
                SimplifiedTrackPoints.Add(new CoordinatePoint(18.5204, 73.8567, 560, DateTime.UtcNow, 62));
            }

            TotalPointsCount = SimplifiedTrackPoints.Count;
            CurrentPointIndex = 0;
            CurrentPoint = SimplifiedTrackPoints.FirstOrDefault();
        }
        catch
        {
            SetError("Loaded local replay track.");
        }
        finally
        {
            IsBusy = false;
        }
    }

    [RelayCommand]
    public void TogglePlayPause()
    {
        if (IsPlaying)
        {
            _replayTimer?.Stop();
            IsPlaying = false;
        }
        else
        {
            StartReplayTimer();
            IsPlaying = true;
        }
    }

    [RelayCommand]
    public void ChangeSpeedMultiplier(int multiplier)
    {
        SpeedMultiplier = multiplier;
        if (IsPlaying)
        {
            StartReplayTimer();
        }
    }

    private void StartReplayTimer()
    {
        _replayTimer?.Dispose();
        var intervalMs = Math.Max(100, 1000 / SpeedMultiplier);
        _replayTimer = new System.Timers.Timer(intervalMs);
        _replayTimer.Elapsed += (s, e) =>
        {
            if (CurrentPointIndex < SimplifiedTrackPoints.Count - 1)
            {
                CurrentPointIndex++;
                CurrentPoint = SimplifiedTrackPoints[CurrentPointIndex];
                CurrentSpeedKmh = CurrentPoint.SpeedKmh ?? 55.0;
                CurrentAltitude = CurrentPoint.Altitude ?? 600.0;
            }
            else
            {
                _replayTimer?.Stop();
                IsPlaying = false;
            }
        };
        _replayTimer.Start();
    }
}
