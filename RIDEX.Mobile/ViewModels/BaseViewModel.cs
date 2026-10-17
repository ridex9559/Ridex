using CommunityToolkit.Mvvm.ComponentModel;
using RIDEX.Mobile.Services;

namespace RIDEX.Mobile.ViewModels;

public abstract partial class BaseViewModel : ObservableObject
{
    [ObservableProperty]
    private bool _isBusy;

    [ObservableProperty]
    private string _title = string.Empty;

    [ObservableProperty]
    private string? _errorMessage;

    [ObservableProperty]
    private bool _hasError;

    [ObservableProperty]
    private NetworkState _networkState = NetworkState.Online;

    public bool IsOnline => NetworkState == NetworkState.Online || NetworkState == NetworkState.Syncing;

    protected void SetError(string message)
    {
        ErrorMessage = message;
        HasError = !string.IsNullOrEmpty(message);
    }

    protected void ClearError()
    {
        ErrorMessage = null;
        HasError = false;
    }
}
