using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using RIDEX.Mobile.Services;
using RIDEX.Shared.DTOs;

namespace RIDEX.Mobile.ViewModels;

public partial class LoginViewModel : BaseViewModel
{
    private readonly IApiClient _apiClient;

    [ObservableProperty]
    private string _email = "rider@ridex.local";

    [ObservableProperty]
    private string _password = "Rider@123";

    public event Action? OnLoginSuccessful;

    public LoginViewModel(IApiClient apiClient)
    {
        _apiClient = apiClient;
        Title = "Rider Login";
    }

    [RelayCommand]
    public async Task LoginAsync()
    {
        if (string.IsNullOrWhiteSpace(Email) || string.IsNullOrWhiteSpace(Password))
        {
            SetError("Please enter email and password.");
            return;
        }

        IsBusy = true;
        ClearError();

        try
        {
            var auth = await _apiClient.LoginAsync(new LoginRequest
            {
                Email = Email.Trim(),
                Password = Password
            });

            if (auth != null)
            {
                OnLoginSuccessful?.Invoke();
            }
            else
            {
                SetError("Invalid credentials.");
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

public partial class RegisterViewModel : BaseViewModel
{
    private readonly IApiClient _apiClient;

    [ObservableProperty] private string _fullName = "Aryan Deshmukh";
    [ObservableProperty] private string _email = "rider@ridex.local";
    [ObservableProperty] private string _password = "Rider@123";
    [ObservableProperty] private string _phoneNumber = "+919822011223";
    [ObservableProperty] private string _city = "Nashik";

    public event Action? OnRegisterSuccessful;

    public RegisterViewModel(IApiClient apiClient)
    {
        _apiClient = apiClient;
        Title = "Create Rider Account";
    }

    [RelayCommand]
    public async Task RegisterAsync()
    {
        IsBusy = true;
        ClearError();

        try
        {
            var auth = await _apiClient.RegisterAsync(new RegisterRequest
            {
                FullName = FullName.Trim(),
                Email = Email.Trim(),
                Password = Password,
                PhoneNumber = PhoneNumber.Trim(),
                City = City.Trim()
            });

            if (auth != null)
            {
                OnRegisterSuccessful?.Invoke();
            }
            else
            {
                SetError("Registration failed.");
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

public partial class OnboardingViewModel : BaseViewModel
{
    [ObservableProperty]
    private int _currentSlideIndex = 0;

    public event Action? OnOnboardingCompleted;

    public OnboardingViewModel()
    {
        Title = "Welcome to RIDEX";
    }

    [RelayCommand]
    public void NextSlide()
    {
        if (CurrentSlideIndex < 2)
            CurrentSlideIndex++;
        else
            OnOnboardingCompleted?.Invoke();
    }
}
