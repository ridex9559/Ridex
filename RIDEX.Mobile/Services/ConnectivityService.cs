namespace RIDEX.Mobile.Services;

public enum NetworkState
{
    Online,
    Offline,
    Syncing
}

public interface IConnectivityService
{
    NetworkState CurrentState { get; }
    bool IsOnline { get; }
    event EventHandler<NetworkState>? StateChanged;
    void SetState(NetworkState state);
    Task<bool> CheckInternetAccessAsync();
}

public class ConnectivityService : IConnectivityService
{
    private NetworkState _currentState = NetworkState.Online;

    public NetworkState CurrentState => _currentState;
    public bool IsOnline => _currentState == NetworkState.Online || _currentState == NetworkState.Syncing;

    public event EventHandler<NetworkState>? StateChanged;

    public void SetState(NetworkState state)
    {
        if (_currentState != state)
        {
            _currentState = state;
            StateChanged?.Invoke(this, state);
        }
    }

    public async Task<bool> CheckInternetAccessAsync()
    {
        try
        {
            using var client = new HttpClient { Timeout = TimeSpan.FromSeconds(3) };
            var response = await client.GetAsync("https://api.open-meteo.com/v1/forecast?latitude=0&longitude=0&current=temperature_2m");
            var online = response.IsSuccessStatusCode;
            SetState(online ? NetworkState.Online : NetworkState.Offline);
            return online;
        }
        catch
        {
            SetState(NetworkState.Offline);
            return false;
        }
    }
}
