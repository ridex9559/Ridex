namespace RIDEX.Mobile.Services;

public interface IMobileNotificationService
{
    Task ShowNotificationAsync(string title, string message, string? category = null);
    event Action<string, string>? OnNotificationReceived;
}

public class MobileNotificationService : IMobileNotificationService
{
    public event Action<string, string>? OnNotificationReceived;

    public Task ShowNotificationAsync(string title, string message, string? category = null)
    {
        OnNotificationReceived?.Invoke(title, message);
        return Task.CompletedTask;
    }
}
