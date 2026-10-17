using System.Collections.ObjectModel;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using RIDEX.Mobile.Services;
using RIDEX.Shared.DTOs;

namespace RIDEX.Mobile.ViewModels;

public partial class FuelViewModel : BaseViewModel
{
    private readonly IApiClient _apiClient;
    private readonly ILocalDatabaseService _localDb;

    [ObservableProperty]
    private ObservableCollection<FuelLogDto> _fuelLogs = new();

    [ObservableProperty]
    private double _averageMileageKmpl = 24.5;

    [ObservableProperty]
    private decimal _totalFuelSpent = 1503.38m;

    [ObservableProperty]
    private double _totalLitersFilled = 14.25;

    // Form inputs
    [ObservableProperty] private double _inputLiters = 14.25;
    [ObservableProperty] private decimal _inputPricePerLiter = 105.5m;
    [ObservableProperty] private double _inputOdometer = 18450.0;
    [ObservableProperty] private string _inputStationName = "Indian Oil Swagat, Igatpuri";
    [ObservableProperty] private bool _isAddLogModalOpen;

    public FuelViewModel(IApiClient apiClient, ILocalDatabaseService localDb)
    {
        _apiClient = apiClient;
        _localDb = localDb;
        Title = "Fuel Tracker";
    }

    [RelayCommand]
    public async Task LoadFuelLogsAsync()
    {
        IsBusy = true;
        ClearError();

        try
        {
            var logs = await _apiClient.GetFuelLogsAsync();
            FuelLogs.Clear();
            foreach (var l in logs)
                FuelLogs.Add(l);

            if (FuelLogs.Count > 0)
            {
                TotalFuelSpent = FuelLogs.Sum(f => f.TotalCost);
                TotalLitersFilled = FuelLogs.Sum(f => f.Liters);
                var avg = FuelLogs.Where(f => f.CalculatedMileageKmpl.HasValue).Select(f => f.CalculatedMileageKmpl!.Value).ToList();
                if (avg.Count > 0)
                    AverageMileageKmpl = Math.Round(avg.Average(), 1);
            }
        }
        catch (Exception ex)
        {
            SetError("Loaded offline fuel records: " + ex.Message);
        }
        finally
        {
            IsBusy = false;
        }
    }

    [RelayCommand]
    public async Task AddFuelLogAsync()
    {
        IsBusy = true;
        ClearError();

        try
        {
            var newLog = await _apiClient.CreateFuelLogAsync(new CreateFuelLogRequest
            {
                Liters = InputLiters,
                PricePerLiter = InputPricePerLiter,
                OdometerKm = InputOdometer,
                FuelStationName = InputStationName,
                LoggedAt = DateTime.UtcNow
            });

            if (newLog != null)
            {
                FuelLogs.Insert(0, newLog);
                TotalFuelSpent += newLog.TotalCost;
                TotalLitersFilled += newLog.Liters;
                IsAddLogModalOpen = false;
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
