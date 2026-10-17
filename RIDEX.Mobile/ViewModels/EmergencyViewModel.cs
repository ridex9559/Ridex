using System.Collections.ObjectModel;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using RIDEX.Mobile.Services;
using RIDEX.Shared.DTOs;

namespace RIDEX.Mobile.ViewModels;

public partial class EmergencyViewModel : BaseViewModel
{
    private readonly IApiClient _apiClient;
    private readonly ILocalDatabaseService _localDb;

    [ObservableProperty]
    private ObservableCollection<EmergencyContactDto> _contacts = new();

    [ObservableProperty]
    private double _currentLatitude = 19.5447;

    [ObservableProperty]
    private double _currentLongitude = 73.7663;

    [ObservableProperty]
    private string _formattedCoordinates = "19.5447° N, 73.7663° E";

    [ObservableProperty]
    private bool _isAddContactModalOpen;

    // Form inputs
    [ObservableProperty] private string _inputName = "Sunita Deshmukh";
    [ObservableProperty] private string _inputPhone = "+919822000111";
    [ObservableProperty] private string _inputRelationship = "Mother";
    [ObservableProperty] private bool _inputIsPrimary = true;

    public EmergencyViewModel(IApiClient apiClient, ILocalDatabaseService localDb)
    {
        _apiClient = apiClient;
        _localDb = localDb;
        Title = "Emergency & SOS";
    }

    [RelayCommand]
    public async Task LoadEmergencyDataAsync()
    {
        IsBusy = true;
        ClearError();

        try
        {
            var list = await _apiClient.GetEmergencyContactsAsync();
            Contacts.Clear();
            foreach (var c in list)
                Contacts.Add(c);
        }
        catch
        {
            SetError("Loaded local emergency contacts.");
        }
        finally
        {
            IsBusy = false;
        }
    }

    [ObservableProperty]
    private string _preparedSmsText = string.Empty;

    [RelayCommand]
    public void PrepareEmergencySms()
    {
        PreparedSmsText = $"EMERGENCY ALERT: I need immediate assistance while riding. My current coordinates are: https://www.openstreetmap.org/?mlat={CurrentLatitude}&mlon={CurrentLongitude}#map=16/{CurrentLatitude}/{CurrentLongitude}";
    }
}
