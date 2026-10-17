using Microsoft.AspNetCore.SignalR.Client;
using RIDEX.Shared.DTOs;
using RIDEX.Shared.Enums;

namespace RIDEX.Mobile.Services;

public interface ISignalRClientService
{
    bool IsConnected { get; }
    Task ConnectAsync(string hubUrl, string accessToken);
    Task DisconnectAsync();
    Task JoinRideAsync(Guid rideId);
    Task LeaveRideAsync(Guid rideId);
    Task SendLocationAsync(LocationUpdateDto location);
    Task StartRideAsync(Guid rideId);
    Task PauseRideAsync(Guid rideId);
    Task ResumeRideAsync(Guid rideId);
    Task EndRideAsync(Guid rideId);
    Task TriggerEmergencyAsync(SosTriggerRequest sos);

    event Action<RiderLiveStateDto>? OnLocationUpdated;
    event Action<RideMemberDto>? OnMemberJoined;
    event Action<Guid, string>? OnMemberLeft;
    event Action<Guid, RiderOnlineStatus>? OnRiderStatusChanged;
    event Action<Guid, DateTime>? OnRideStarted;
    event Action<Guid>? OnRidePaused;
    event Action<Guid>? OnRideResumed;
    event Action<Guid, RideSummaryDto>? OnRideEnded;
    event Action<string, Guid, double>? OnSeparationAlert;
    event Action<EmergencyAlertDto>? OnEmergencyTriggered;
    event Action<LiveRideStateDto>? OnInitialLiveState;
}

public class SignalRClientService : ISignalRClientService
{
    private HubConnection? _hubConnection;

    public bool IsConnected => _hubConnection?.State == HubConnectionState.Connected;

    public event Action<RiderLiveStateDto>? OnLocationUpdated;
    public event Action<RideMemberDto>? OnMemberJoined;
    public event Action<Guid, string>? OnMemberLeft;
    public event Action<Guid, RiderOnlineStatus>? OnRiderStatusChanged;
    public event Action<Guid, DateTime>? OnRideStarted;
    public event Action<Guid>? OnRidePaused;
    public event Action<Guid>? OnRideResumed;
    public event Action<Guid, RideSummaryDto>? OnRideEnded;
    public event Action<string, Guid, double>? OnSeparationAlert;
    public event Action<EmergencyAlertDto>? OnEmergencyTriggered;
    public event Action<LiveRideStateDto>? OnInitialLiveState;

    public async Task ConnectAsync(string hubUrl, string accessToken)
    {
        if (_hubConnection != null && _hubConnection.State == HubConnectionState.Connected)
            return;

        _hubConnection = new HubConnectionBuilder()
            .WithUrl(hubUrl, options =>
            {
                options.AccessTokenProvider = () => Task.FromResult<string?>(accessToken);
            })
            .WithAutomaticReconnect(new[] { TimeSpan.FromSeconds(0), TimeSpan.FromSeconds(2), TimeSpan.FromSeconds(5), TimeSpan.FromSeconds(10) })
            .Build();

        _hubConnection.On<RiderLiveStateDto>("LocationUpdated", state => OnLocationUpdated?.Invoke(state));
        _hubConnection.On<RideMemberDto>("MemberJoined", member => OnMemberJoined?.Invoke(member));
        _hubConnection.On<Guid, string>("MemberLeft", (uid, name) => OnMemberLeft?.Invoke(uid, name));
        _hubConnection.On<Guid, RiderOnlineStatus>("RiderStatusChanged", (uid, st) => OnRiderStatusChanged?.Invoke(uid, st));
        _hubConnection.On<Guid, DateTime>("RideStarted", (rid, st) => OnRideStarted?.Invoke(rid, st));
        _hubConnection.On<Guid>("RidePaused", rid => OnRidePaused?.Invoke(rid));
        _hubConnection.On<Guid>("RideResumed", rid => OnRideResumed?.Invoke(rid));
        _hubConnection.On<Guid, RideSummaryDto>("RideEnded", (rid, sum) => OnRideEnded?.Invoke(rid, sum));
        _hubConnection.On<string, Guid, double>("SeparationAlert", (msg, uid, dist) => OnSeparationAlert?.Invoke(msg, uid, dist));
        _hubConnection.On<EmergencyAlertDto>("EmergencyTriggered", alert => OnEmergencyTriggered?.Invoke(alert));
        _hubConnection.On<LiveRideStateDto>("InitialLiveState", state => OnInitialLiveState?.Invoke(state));

        await _hubConnection.StartAsync();
    }

    public async Task DisconnectAsync()
    {
        if (_hubConnection != null)
        {
            await _hubConnection.StopAsync();
            await _hubConnection.DisposeAsync();
            _hubConnection = null;
        }
    }

    public async Task JoinRideAsync(Guid rideId)
    {
        if (_hubConnection != null && _hubConnection.State == HubConnectionState.Connected)
        {
            await _hubConnection.InvokeAsync("JoinRideGroup", rideId);
        }
    }

    public async Task LeaveRideAsync(Guid rideId)
    {
        if (_hubConnection != null && _hubConnection.State == HubConnectionState.Connected)
        {
            await _hubConnection.InvokeAsync("LeaveRideGroup", rideId);
        }
    }

    public async Task SendLocationAsync(LocationUpdateDto location)
    {
        if (_hubConnection != null && _hubConnection.State == HubConnectionState.Connected)
        {
            await _hubConnection.InvokeAsync("SendLocationUpdate", location);
        }
    }

    public async Task StartRideAsync(Guid rideId)
    {
        if (_hubConnection != null && _hubConnection.State == HubConnectionState.Connected)
        {
            await _hubConnection.InvokeAsync("StartRide", rideId);
        }
    }

    public async Task PauseRideAsync(Guid rideId)
    {
        if (_hubConnection != null && _hubConnection.State == HubConnectionState.Connected)
        {
            await _hubConnection.InvokeAsync("PauseRide", rideId);
        }
    }

    public async Task ResumeRideAsync(Guid rideId)
    {
        if (_hubConnection != null && _hubConnection.State == HubConnectionState.Connected)
        {
            await _hubConnection.InvokeAsync("ResumeRide", rideId);
        }
    }

    public async Task EndRideAsync(Guid rideId)
    {
        if (_hubConnection != null && _hubConnection.State == HubConnectionState.Connected)
        {
            await _hubConnection.InvokeAsync("EndRide", rideId);
        }
    }

    public async Task TriggerEmergencyAsync(SosTriggerRequest sos)
    {
        if (_hubConnection != null && _hubConnection.State == HubConnectionState.Connected)
        {
            await _hubConnection.InvokeAsync("TriggerEmergency", sos);
        }
    }
}
