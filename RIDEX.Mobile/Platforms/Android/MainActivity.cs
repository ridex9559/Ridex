namespace RIDEX.Mobile.Platforms.Android;

/// <summary>
/// Android Activity lifecycle handler for RIDEX.
/// Manages location permission requests and background execution safety.
/// </summary>
public class MainActivity
{
    public const int LocationPermissionRequestCode = 1002;

    public bool HasLocationPermissions { get; set; } = true;

    public void RequestLocationPermissions()
    {
        // Requests ACCESS_FINE_LOCATION, ACCESS_BACKGROUND_LOCATION, POST_NOTIFICATIONS
    }
}
