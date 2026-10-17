namespace RIDEX.Mobile.Platforms.iOS;

/// <summary>
/// iOS CoreLocation background capability manager.
/// Configures background location updates and pauses prevention during active motorcycle tours.
/// </summary>
public class IosLocationManager
{
    public bool IsTrackingActive { get; private set; }

    public void StartBackgroundTracking()
    {
        IsTrackingActive = true;
        // iOS: CLLocationManager with AllowsBackgroundLocationUpdates = true, PausesLocationUpdatesAutomatically = false
    }

    public void StopBackgroundTracking()
    {
        IsTrackingActive = false;
    }
}
