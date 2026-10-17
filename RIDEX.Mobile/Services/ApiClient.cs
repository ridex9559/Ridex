using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using RIDEX.Mobile.Models;
using RIDEX.Shared.Algorithms;
using RIDEX.Shared.DTOs;

namespace RIDEX.Mobile.Services;

public interface IApiClient
{
    string BaseUrl { get; set; }
    void SetAuthToken(string? token);

    Task<AuthResponse?> LoginAsync(LoginRequest request);
    Task<AuthResponse?> RegisterAsync(RegisterRequest request);
    Task<UserProfileDto?> GetProfileAsync();

    Task<List<MotorcycleDto>> GetMotorcyclesAsync();
    Task<MotorcycleDto?> CreateMotorcycleAsync(CreateMotorcycleRequest request);

    Task<List<RideDto>> GetRidesAsync();
    Task<RideDto?> GetRideByIdAsync(Guid id);
    Task<RideDto?> CreateRideAsync(CreateRideRequest request);
    Task<RideDto?> JoinRideAsync(JoinRideRequest request);
    Task<LiveRideStateDto?> GetLiveStateAsync(Guid rideId);
    Task<List<CoordinatePoint>> GetReplayHistoryAsync(Guid rideId);

    Task<RouteDto?> PlanRouteAsync(RoutePlanRequest request);
    Task<List<WaypointDto>> SearchPlacesAsync(string query);

    Task<List<ExpenseDto>> GetExpensesAsync(Guid rideId);
    Task<ExpenseDto?> CreateExpenseAsync(CreateExpenseRequest request);
    Task<ExpenseSummaryDto?> GetExpenseSummaryAsync(Guid rideId);

    Task<List<FuelLogDto>> GetFuelLogsAsync(Guid? motorcycleId = null);
    Task<FuelLogDto?> CreateFuelLogAsync(CreateFuelLogRequest request);

    Task<WeatherForecastDto?> GetWeatherForecastAsync(double lat, double lon, string? name = null);
    Task<List<EmergencyContactDto>> GetEmergencyContactsAsync();
    Task<EmergencyAlertDto?> TriggerSosAsync(SosTriggerRequest request);

    Task<SyncBatchResponse?> ProcessSyncBatchAsync(SyncBatchRequest batch);
}

public class ApiClient : IApiClient
{
    private readonly HttpClient _httpClient;
    private readonly IConnectivityService _connectivity;
    private readonly ILocalDatabaseService _localDb;
    private string? _authToken;

    public string BaseUrl { get; set; } = "http://localhost:5000";

    public ApiClient(HttpClient httpClient, IConnectivityService connectivity, ILocalDatabaseService localDb)
    {
        _httpClient = httpClient;
        _connectivity = connectivity;
        _localDb = localDb;
    }

    public void SetAuthToken(string? token)
    {
        _authToken = token;
        if (!string.IsNullOrEmpty(token))
        {
            _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        }
        else
        {
            _httpClient.DefaultRequestHeaders.Authorization = null;
        }
    }

    private async Task EnsureAuthTokenAsync()
    {
        if (string.IsNullOrEmpty(_authToken))
        {
            var user = await _localDb.GetCurrentUserAsync();
            if (!string.IsNullOrEmpty(user?.AccessToken))
            {
                SetAuthToken(user.AccessToken);
            }
        }
    }

    public async Task<AuthResponse?> LoginAsync(LoginRequest request)
    {
        try
        {
            var response = await _httpClient.PostAsJsonAsync($"{BaseUrl}/api/v1/auth/login", request);
            if (response.IsSuccessStatusCode)
            {
                var auth = await response.Content.ReadFromJsonAsync<AuthResponse>();
                if (auth != null)
                {
                    SetAuthToken(auth.Token);
                    await _localDb.SaveCurrentUserAsync(new LocalUser
                    {
                        Id = auth.User.Id,
                        Email = auth.User.Email,
                        FullName = auth.User.FullName,
                        PhoneNumber = auth.User.PhoneNumber,
                        City = auth.User.City,
                        RidingExperience = auth.User.RidingExperience,
                        Role = auth.User.Role.ToString(),
                        AccessToken = auth.Token,
                        RefreshToken = auth.RefreshToken,
                        TokenExpiresAt = auth.ExpiresAt
                    });
                }
                return auth;
            }
        }
        catch
        {
            _connectivity.SetState(NetworkState.Offline);
        }

        // Demo fallback if backend is offline
        if (request.Email.Contains("rider", StringComparison.OrdinalIgnoreCase))
        {
            var demoAuth = new AuthResponse
            {
                Token = "DEMO_OFFLINE_JWT_TOKEN",
                RefreshToken = "DEMO_REFRESH_TOKEN",
                ExpiresAt = DateTime.UtcNow.AddDays(7),
                User = new UserProfileDto
                {
                    Id = Guid.Parse("11111111-1111-1111-1111-111111111111"),
                    Email = request.Email,
                    FullName = "Aryan Deshmukh",
                    City = "Nashik",
                    RidingExperience = "Adventure Touring (6 Years)",
                    Role = Shared.Enums.UserRole.User,
                    CreatedAt = DateTime.UtcNow
                }
            };
            SetAuthToken(demoAuth.Token);
            return demoAuth;
        }

        return null;
    }

    public async Task<AuthResponse?> RegisterAsync(RegisterRequest request)
    {
        try
        {
            var response = await _httpClient.PostAsJsonAsync($"{BaseUrl}/api/v1/auth/register", request);
            if (response.IsSuccessStatusCode)
            {
                var auth = await response.Content.ReadFromJsonAsync<AuthResponse>();
                if (auth != null)
                {
                    SetAuthToken(auth.Token);
                    await _localDb.SaveCurrentUserAsync(new LocalUser
                    {
                        Id = auth.User.Id,
                        Email = auth.User.Email,
                        FullName = auth.User.FullName,
                        PhoneNumber = auth.User.PhoneNumber,
                        City = auth.User.City,
                        AccessToken = auth.Token,
                        RefreshToken = auth.RefreshToken
                    });
                }
                return auth;
            }
        }
        catch
        {
            _connectivity.SetState(NetworkState.Offline);
        }
        return null;
    }

    public async Task<UserProfileDto?> GetProfileAsync()
    {
        await EnsureAuthTokenAsync();
        try
        {
            return await _httpClient.GetFromJsonAsync<UserProfileDto>($"{BaseUrl}/api/v1/auth/profile");
        }
        catch
        {
            var local = await _localDb.GetCurrentUserAsync();
            if (local != null)
            {
                return new UserProfileDto
                {
                    Id = local.Id,
                    Email = local.Email,
                    FullName = local.FullName,
                    PhoneNumber = local.PhoneNumber,
                    City = local.City,
                    RidingExperience = local.RidingExperience
                };
            }
            return null;
        }
    }

    public async Task<List<MotorcycleDto>> GetMotorcyclesAsync()
    {
        await EnsureAuthTokenAsync();
        try
        {
            var list = await _httpClient.GetFromJsonAsync<List<MotorcycleDto>>($"{BaseUrl}/api/v1/motorcycles");
            if (list != null)
            {
                foreach (var b in list)
                {
                    await _localDb.SaveMotorcycleAsync(new LocalMotorcycle
                    {
                        Id = b.Id,
                        UserId = b.UserId,
                        Brand = b.Brand,
                        Model = b.Model,
                        Year = b.Year,
                        RegistrationNumber = b.RegistrationNumber,
                        FuelTankCapacityLiters = b.FuelTankCapacityLiters,
                        AverageMileageKmpl = b.AverageMileageKmpl,
                        CurrentOdometerKm = b.CurrentOdometerKm,
                        IsPrimary = b.IsPrimary,
                        ImageUrl = b.ImageUrl
                    });
                }
                return list;
            }
        }
        catch
        {
            _connectivity.SetState(NetworkState.Offline);
        }

        var localBikes = await _localDb.GetMotorcyclesAsync();
        return localBikes.Select(b => new MotorcycleDto
        {
            Id = b.Id,
            UserId = b.UserId,
            Brand = b.Brand,
            Model = b.Model,
            Year = b.Year,
            RegistrationNumber = b.RegistrationNumber,
            FuelTankCapacityLiters = b.FuelTankCapacityLiters,
            AverageMileageKmpl = b.AverageMileageKmpl,
            CurrentOdometerKm = b.CurrentOdometerKm,
            IsPrimary = b.IsPrimary,
            ImageUrl = b.ImageUrl
        }).ToList();
    }

    public async Task<MotorcycleDto?> CreateMotorcycleAsync(CreateMotorcycleRequest request)
    {
        await EnsureAuthTokenAsync();
        try
        {
            var response = await _httpClient.PostAsJsonAsync($"{BaseUrl}/api/v1/motorcycles", request);
            if (response.IsSuccessStatusCode)
                return await response.Content.ReadFromJsonAsync<MotorcycleDto>();
        }
        catch
        {
            _connectivity.SetState(NetworkState.Offline);
        }

        // Offline local creation
        var bikeId = Guid.NewGuid();
        var user = await _localDb.GetCurrentUserAsync();
        var localBike = new LocalMotorcycle
        {
            Id = bikeId,
            UserId = user?.Id ?? Guid.Empty,
            Brand = request.Brand,
            Model = request.Model,
            Year = request.Year,
            RegistrationNumber = request.RegistrationNumber,
            FuelTankCapacityLiters = request.FuelTankCapacityLiters,
            AverageMileageKmpl = request.AverageMileageKmpl,
            CurrentOdometerKm = request.CurrentOdometerKm,
            IsPrimary = request.IsPrimary,
            ImageUrl = request.ImageUrl
        };
        await _localDb.SaveMotorcycleAsync(localBike);

        // Queue offline sync
        await _localDb.QueueSyncOperationAsync(new SyncQueueItem
        {
            OperationId = Guid.NewGuid(),
            EntityType = "Motorcycle",
            EntityId = bikeId,
            PayloadJson = JsonSerializer.Serialize(request)
        });

        return new MotorcycleDto
        {
            Id = bikeId,
            UserId = localBike.UserId,
            Brand = localBike.Brand,
            Model = localBike.Model,
            Year = localBike.Year,
            RegistrationNumber = localBike.RegistrationNumber,
            FuelTankCapacityLiters = localBike.FuelTankCapacityLiters,
            AverageMileageKmpl = localBike.AverageMileageKmpl,
            CurrentOdometerKm = localBike.CurrentOdometerKm,
            IsPrimary = localBike.IsPrimary
        };
    }

    public async Task<List<RideDto>> GetRidesAsync()
    {
        await EnsureAuthTokenAsync();
        try
        {
            var list = await _httpClient.GetFromJsonAsync<List<RideDto>>($"{BaseUrl}/api/v1/rides");
            if (list != null)
                return list;
        }
        catch
        {
            _connectivity.SetState(NetworkState.Offline);
        }

        var localRides = await _localDb.GetLocalRidesAsync();
        return localRides.Select(r => new RideDto
        {
            Id = r.Id,
            Title = r.Title,
            Description = r.Description,
            JoinCode = r.JoinCode,
            Status = (Shared.Enums.RideStatus)r.Status,
            ScheduledStartTime = r.ScheduledStartTime,
            MaxRiders = r.MaxRiders,
            SeparationThresholdKm = r.SeparationThresholdKm,
            OwnerId = r.OwnerId,
            OwnerName = r.OwnerName
        }).ToList();
    }

    public async Task<RideDto?> GetRideByIdAsync(Guid id)
    {
        await EnsureAuthTokenAsync();
        try
        {
            return await _httpClient.GetFromJsonAsync<RideDto>($"{BaseUrl}/api/v1/rides/{id}");
        }
        catch
        {
            var r = await _localDb.GetRideByIdAsync(id);
            if (r != null)
            {
                return new RideDto
                {
                    Id = r.Id,
                    Title = r.Title,
                    Description = r.Description,
                    JoinCode = r.JoinCode,
                    Status = (Shared.Enums.RideStatus)r.Status,
                    ScheduledStartTime = r.ScheduledStartTime,
                    OwnerId = r.OwnerId,
                    OwnerName = r.OwnerName
                };
            }
            return null;
        }
    }

    public async Task<RideDto?> CreateRideAsync(CreateRideRequest request)
    {
        await EnsureAuthTokenAsync();
        var response = await _httpClient.PostAsJsonAsync($"{BaseUrl}/api/v1/rides", request);
        if (response.IsSuccessStatusCode)
            return await response.Content.ReadFromJsonAsync<RideDto>();
        return null;
    }

    public async Task<RideDto?> JoinRideAsync(JoinRideRequest request)
    {
        await EnsureAuthTokenAsync();
        var response = await _httpClient.PostAsJsonAsync($"{BaseUrl}/api/v1/rides/join", request);
        if (response.IsSuccessStatusCode)
            return await response.Content.ReadFromJsonAsync<RideDto>();
        return null;
    }

    public async Task<LiveRideStateDto?> GetLiveStateAsync(Guid rideId)
    {
        await EnsureAuthTokenAsync();
        return await _httpClient.GetFromJsonAsync<LiveRideStateDto>($"{BaseUrl}/api/v1/rides/{rideId}/live-state");
    }

    public async Task<List<CoordinatePoint>> GetReplayHistoryAsync(Guid rideId)
    {
        await EnsureAuthTokenAsync();
        return await _httpClient.GetFromJsonAsync<List<CoordinatePoint>>($"{BaseUrl}/api/v1/rides/{rideId}/replay") ?? new();
    }

    public async Task<RouteDto?> PlanRouteAsync(RoutePlanRequest request)
    {
        await EnsureAuthTokenAsync();
        var response = await _httpClient.PostAsJsonAsync($"{BaseUrl}/api/v1/routes/plan", request);
        if (response.IsSuccessStatusCode)
            return await response.Content.ReadFromJsonAsync<RouteDto>();
        return null;
    }

    public async Task<List<WaypointDto>> SearchPlacesAsync(string query)
    {
        await EnsureAuthTokenAsync();
        return await _httpClient.GetFromJsonAsync<List<WaypointDto>>($"{BaseUrl}/api/v1/routes/search?query={Uri.EscapeDataString(query)}") ?? new();
    }

    public async Task<List<ExpenseDto>> GetExpensesAsync(Guid rideId)
    {
        await EnsureAuthTokenAsync();
        return await _httpClient.GetFromJsonAsync<List<ExpenseDto>>($"{BaseUrl}/api/v1/expenses/ride/{rideId}") ?? new();
    }

    public async Task<ExpenseDto?> CreateExpenseAsync(CreateExpenseRequest request)
    {
        await EnsureAuthTokenAsync();
        var response = await _httpClient.PostAsJsonAsync($"{BaseUrl}/api/v1/expenses", request);
        if (response.IsSuccessStatusCode)
            return await response.Content.ReadFromJsonAsync<ExpenseDto>();
        return null;
    }

    public async Task<ExpenseSummaryDto?> GetExpenseSummaryAsync(Guid rideId)
    {
        await EnsureAuthTokenAsync();
        return await _httpClient.GetFromJsonAsync<ExpenseSummaryDto>($"{BaseUrl}/api/v1/expenses/ride/{rideId}/summary");
    }

    public async Task<List<FuelLogDto>> GetFuelLogsAsync(Guid? motorcycleId = null)
    {
        await EnsureAuthTokenAsync();
        var url = motorcycleId.HasValue
            ? $"{BaseUrl}/api/v1/fuellogs?motorcycleId={motorcycleId}"
            : $"{BaseUrl}/api/v1/fuellogs";
        return await _httpClient.GetFromJsonAsync<List<FuelLogDto>>(url) ?? new();
    }

    public async Task<FuelLogDto?> CreateFuelLogAsync(CreateFuelLogRequest request)
    {
        await EnsureAuthTokenAsync();
        var response = await _httpClient.PostAsJsonAsync($"{BaseUrl}/api/v1/fuellogs", request);
        if (response.IsSuccessStatusCode)
            return await response.Content.ReadFromJsonAsync<FuelLogDto>();
        return null;
    }

    public async Task<WeatherForecastDto?> GetWeatherForecastAsync(double lat, double lon, string? name = null)
    {
        await EnsureAuthTokenAsync();
        var url = $"{BaseUrl}/api/v1/weather/forecast?latitude={lat}&longitude={lon}&name={Uri.EscapeDataString(name ?? "")}";
        return await _httpClient.GetFromJsonAsync<WeatherForecastDto>(url);
    }

    public async Task<List<EmergencyContactDto>> GetEmergencyContactsAsync()
    {
        await EnsureAuthTokenAsync();
        return await _httpClient.GetFromJsonAsync<List<EmergencyContactDto>>($"{BaseUrl}/api/v1/emergency/contacts") ?? new();
    }

    public async Task<EmergencyAlertDto?> TriggerSosAsync(SosTriggerRequest request)
    {
        await EnsureAuthTokenAsync();
        var response = await _httpClient.PostAsJsonAsync($"{BaseUrl}/api/v1/emergency/sos", request);
        if (response.IsSuccessStatusCode)
            return await response.Content.ReadFromJsonAsync<EmergencyAlertDto>();
        return null;
    }

    public async Task<SyncBatchResponse?> ProcessSyncBatchAsync(SyncBatchRequest batch)
    {
        await EnsureAuthTokenAsync();
        var response = await _httpClient.PostAsJsonAsync($"{BaseUrl}/api/v1/sync/batch", batch);
        if (response.IsSuccessStatusCode)
            return await response.Content.ReadFromJsonAsync<SyncBatchResponse>();
        return null;
    }
}
