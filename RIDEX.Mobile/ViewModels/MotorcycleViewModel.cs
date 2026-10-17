using System.Collections.ObjectModel;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using RIDEX.Mobile.Services;
using RIDEX.Shared.DTOs;
using RIDEX.Shared.Enums;

namespace RIDEX.Mobile.ViewModels;

public partial class MotorcycleViewModel : BaseViewModel
{
    private readonly IApiClient _apiClient;
    private readonly ILocalDatabaseService _localDb;

    [ObservableProperty]
    private ObservableCollection<MotorcycleDto> _motorcycles = new();

    [ObservableProperty]
    private MotorcycleDto? _selectedMotorcycle;

    [ObservableProperty]
    private ObservableCollection<ServiceReminderDto> _reminders = new();

    [ObservableProperty]
    private bool _isAddBikeModalOpen;

    // Add bike form inputs
    [ObservableProperty] private string _brand = "Royal Enfield";
    [ObservableProperty] private string _model = "Himalayan 450";
    [ObservableProperty] private int _year = 2024;
    [ObservableProperty] private string _registrationNumber = "MH-15-GH-4500";
    [ObservableProperty] private double _tankCapacity = 17.0;
    [ObservableProperty] private double _averageMileage = 24.5;
    [ObservableProperty] private double _odometer = 18450.0;

    public MotorcycleViewModel(IApiClient apiClient, ILocalDatabaseService localDb)
    {
        _apiClient = apiClient;
        _localDb = localDb;
        Title = "My Garage";
    }

    [RelayCommand]
    public async Task LoadMotorcyclesAsync()
    {
        IsBusy = true;
        ClearError();

        try
        {
            var bikes = await _apiClient.GetMotorcyclesAsync();
            Motorcycles.Clear();
            foreach (var b in bikes)
                Motorcycles.Add(b);

            SelectedMotorcycle = Motorcycles.FirstOrDefault(b => b.IsPrimary) ?? Motorcycles.FirstOrDefault();

            // Load reminders
            Reminders.Clear();
            Reminders.Add(new ServiceReminderDto
            {
                Id = Guid.NewGuid(),
                MotorcycleName = SelectedMotorcycle != null ? $"{SelectedMotorcycle.Brand} {SelectedMotorcycle.Model}" : "Himalayan 450",
                ServiceType = ServiceType.EngineOil,
                Title = "Engine Oil & Filter",
                DueOdometerKm = (SelectedMotorcycle?.CurrentOdometerKm ?? 18450) + 280,
                RemainingKm = 280,
                RemainingDays = 14
            });
            Reminders.Add(new ServiceReminderDto
            {
                Id = Guid.NewGuid(),
                MotorcycleName = SelectedMotorcycle != null ? $"{SelectedMotorcycle.Brand} {SelectedMotorcycle.Model}" : "Himalayan 450",
                ServiceType = ServiceType.ChainLubrication,
                Title = "Chain Clean & Lube",
                DueOdometerKm = (SelectedMotorcycle?.CurrentOdometerKm ?? 18450) + 50,
                RemainingKm = 50,
                RemainingDays = 2
            });
        }
        catch
        {
            SetError("Loaded local offline motorcycle records.");
        }
        finally
        {
            IsBusy = false;
        }
    }

    [RelayCommand]
    public async Task SaveNewMotorcycleAsync()
    {
        IsBusy = true;
        ClearError();

        try
        {
            var newBike = await _apiClient.CreateMotorcycleAsync(new CreateMotorcycleRequest
            {
                Brand = Brand,
                Model = Model,
                Year = Year,
                RegistrationNumber = RegistrationNumber,
                FuelTankCapacityLiters = TankCapacity,
                AverageMileageKmpl = AverageMileage,
                CurrentOdometerKm = Odometer,
                IsPrimary = true
            });

            if (newBike != null)
            {
                Motorcycles.Add(newBike);
                SelectedMotorcycle = newBike;
                IsAddBikeModalOpen = false;
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
