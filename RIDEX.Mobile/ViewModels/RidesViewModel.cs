using System.Collections.ObjectModel;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using RIDEX.Mobile.Services;
using RIDEX.Shared.DTOs;
using RIDEX.Shared.Enums;

namespace RIDEX.Mobile.ViewModels;

public partial class RidesViewModel : BaseViewModel
{
    private readonly IApiClient _apiClient;
    private readonly ILocalDatabaseService _localDb;

    [ObservableProperty]
    private ObservableCollection<RideDto> _activeRides = new();

    [ObservableProperty]
    private ObservableCollection<RideDto> _pastRides = new();

    [ObservableProperty]
    private string _joinCodeInput = string.Empty;

    [ObservableProperty]
    private bool _isJoinModalOpen;

    public RidesViewModel(IApiClient apiClient, ILocalDatabaseService localDb)
    {
        _apiClient = apiClient;
        _localDb = localDb;
        Title = "My Rides";
    }

    [RelayCommand]
    public async Task LoadRidesAsync()
    {
        IsBusy = true;
        ClearError();

        try
        {
            var rides = await _apiClient.GetRidesAsync();
            ActiveRides.Clear();
            PastRides.Clear();

            foreach (var r in rides)
            {
                if (r.Status == RideStatus.Completed || r.Status == RideStatus.Cancelled)
                {
                    PastRides.Add(r);
                }
                else
                {
                    ActiveRides.Add(r);
                }
            }
        }
        catch
        {
            SetError("Could not fetch remote rides. Showing cached local rides.");
        }
        finally
        {
            IsBusy = false;
        }
    }

    [RelayCommand]
    public void OpenJoinModal()
    {
        JoinCodeInput = string.Empty;
        IsJoinModalOpen = true;
    }

    [RelayCommand]
    public void CloseJoinModal()
    {
        IsJoinModalOpen = false;
    }

    [RelayCommand]
    public async Task JoinRideByCodeAsync()
    {
        if (string.IsNullOrWhiteSpace(JoinCodeInput))
        {
            SetError("Please enter a valid RIDEX join code (e.g. RX-8F29K).");
            return;
        }

        IsBusy = true;
        ClearError();

        try
        {
            var ride = await _apiClient.JoinRideAsync(new JoinRideRequest
            {
                JoinCode = JoinCodeInput.Trim().ToUpperInvariant()
            });

            if (ride != null)
            {
                IsJoinModalOpen = false;
                await LoadRidesAsync();
            }
            else
            {
                SetError("Ride not found or invalid join code.");
            }
        }
        catch (Exception ex)
        {
            SetError(ex.Message);
        }
        finally
        {
            IsBusy = false;
        }
    }
}
