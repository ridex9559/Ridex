using SQLite;
using RIDEX.Mobile.Models;

namespace RIDEX.Mobile.Services;

public interface ILocalDatabaseService
{
    Task InitializeAsync();
    Task<LocalUser?> GetCurrentUserAsync();
    Task SaveCurrentUserAsync(LocalUser user);
    Task ClearCurrentUserAsync();

    Task<List<LocalMotorcycle>> GetMotorcyclesAsync();
    Task<LocalMotorcycle?> GetPrimaryMotorcycleAsync();
    Task SaveMotorcycleAsync(LocalMotorcycle bike);
    Task DeleteMotorcycleAsync(Guid id);

    Task<List<LocalRide>> GetLocalRidesAsync();
    Task<LocalRide?> GetRideByIdAsync(Guid id);
    Task SaveRideAsync(LocalRide ride);

    Task QueueGpsPointAsync(LocalGpsQueueItem point);
    Task<List<LocalGpsQueueItem>> GetUnsyncedGpsPointsAsync(int limit = 100);
    Task MarkGpsPointsSyncedAsync(IEnumerable<int> localIds);

    Task QueueSyncOperationAsync(SyncQueueItem item);
    Task<List<SyncQueueItem>> GetPendingSyncOperationsAsync();
    Task MarkSyncOperationCompletedAsync(Guid operationId);
    Task IncrementSyncOperationRetryAsync(Guid operationId);

    Task<List<LocalFuelLog>> GetFuelLogsAsync();
    Task SaveFuelLogAsync(LocalFuelLog log);

    Task<List<LocalExpense>> GetExpensesAsync(Guid rideId);
    Task SaveExpenseAsync(LocalExpense expense);

    Task<List<LocalServiceReminder>> GetServiceRemindersAsync();
    Task SaveServiceReminderAsync(LocalServiceReminder reminder);

    Task<List<LocalEmergencyContact>> GetEmergencyContactsAsync();
    Task SaveEmergencyContactAsync(LocalEmergencyContact contact);
}

public class LocalDatabaseService : ILocalDatabaseService
{
    private SQLiteAsyncConnection? _database;
    private readonly string _dbPath;

    public LocalDatabaseService(string? customDbPath = null)
    {
        _dbPath = customDbPath ?? Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
            "ridex_local.db3");
    }

    public async Task InitializeAsync()
    {
        if (_database != null)
            return;

        var flags = SQLiteOpenFlags.ReadWrite | SQLiteOpenFlags.Create | SQLiteOpenFlags.SharedCache;
        _database = new SQLiteAsyncConnection(_dbPath, flags);

        await _database.CreateTableAsync<LocalUser>();
        await _database.CreateTableAsync<LocalMotorcycle>();
        await _database.CreateTableAsync<LocalRide>();
        await _database.CreateTableAsync<LocalGpsQueueItem>();
        await _database.CreateTableAsync<SyncQueueItem>();
        await _database.CreateTableAsync<LocalFuelLog>();
        await _database.CreateTableAsync<LocalExpense>();
        await _database.CreateTableAsync<LocalServiceReminder>();
        await _database.CreateTableAsync<LocalEmergencyContact>();
    }

    public async Task<LocalUser?> GetCurrentUserAsync()
    {
        await InitializeAsync();
        return await _database!.Table<LocalUser>().FirstOrDefaultAsync();
    }

    public async Task SaveCurrentUserAsync(LocalUser user)
    {
        await InitializeAsync();
        await _database!.InsertOrReplaceAsync(user);
    }

    public async Task ClearCurrentUserAsync()
    {
        await InitializeAsync();
        await _database!.DeleteAllAsync<LocalUser>();
    }

    public async Task<List<LocalMotorcycle>> GetMotorcyclesAsync()
    {
        await InitializeAsync();
        return await _database!.Table<LocalMotorcycle>().ToListAsync();
    }

    public async Task<LocalMotorcycle?> GetPrimaryMotorcycleAsync()
    {
        await InitializeAsync();
        return await _database!.Table<LocalMotorcycle>().Where(m => m.IsPrimary).FirstOrDefaultAsync()
            ?? await _database!.Table<LocalMotorcycle>().FirstOrDefaultAsync();
    }

    public async Task SaveMotorcycleAsync(LocalMotorcycle bike)
    {
        await InitializeAsync();
        await _database!.InsertOrReplaceAsync(bike);
    }

    public async Task DeleteMotorcycleAsync(Guid id)
    {
        await InitializeAsync();
        await _database!.DeleteAsync<LocalMotorcycle>(id);
    }

    public async Task<List<LocalRide>> GetLocalRidesAsync()
    {
        await InitializeAsync();
        return await _database!.Table<LocalRide>().OrderByDescending(r => r.ScheduledStartTime).ToListAsync();
    }

    public async Task<LocalRide?> GetRideByIdAsync(Guid id)
    {
        await InitializeAsync();
        return await _database!.Table<LocalRide>().Where(r => r.Id == id).FirstOrDefaultAsync();
    }

    public async Task SaveRideAsync(LocalRide ride)
    {
        await InitializeAsync();
        await _database!.InsertOrReplaceAsync(ride);
    }

    public async Task QueueGpsPointAsync(LocalGpsQueueItem point)
    {
        await InitializeAsync();
        await _database!.InsertAsync(point);
    }

    public async Task<List<LocalGpsQueueItem>> GetUnsyncedGpsPointsAsync(int limit = 100)
    {
        await InitializeAsync();
        return await _database!.Table<LocalGpsQueueItem>()
            .Where(p => !p.IsSynced)
            .OrderBy(p => p.Timestamp)
            .Take(limit)
            .ToListAsync();
    }

    public async Task MarkGpsPointsSyncedAsync(IEnumerable<int> localIds)
    {
        await InitializeAsync();
        foreach (var id in localIds)
        {
            var item = await _database!.Table<LocalGpsQueueItem>().Where(p => p.LocalId == id).FirstOrDefaultAsync();
            if (item != null)
            {
                item.IsSynced = true;
                await _database!.UpdateAsync(item);
            }
        }
    }

    public async Task QueueSyncOperationAsync(SyncQueueItem item)
    {
        await InitializeAsync();
        await _database!.InsertOrReplaceAsync(item);
    }

    public async Task<List<SyncQueueItem>> GetPendingSyncOperationsAsync()
    {
        await InitializeAsync();
        return await _database!.Table<SyncQueueItem>()
            .Where(s => s.Status == 0 || s.Status == 3) // Pending or Failed
            .OrderBy(s => s.CreatedAt)
            .ToListAsync();
    }

    public async Task MarkSyncOperationCompletedAsync(Guid operationId)
    {
        await InitializeAsync();
        await _database!.Table<SyncQueueItem>().DeleteAsync(s => s.OperationId == operationId);
    }

    public async Task IncrementSyncOperationRetryAsync(Guid operationId)
    {
        await InitializeAsync();
        var item = await _database!.Table<SyncQueueItem>().Where(s => s.OperationId == operationId).FirstOrDefaultAsync();
        if (item != null)
        {
            item.RetryCount++;
            item.Status = 3; // Failed, to retry on next cycle
            await _database!.UpdateAsync(item);
        }
    }

    public async Task<List<LocalFuelLog>> GetFuelLogsAsync()
    {
        await InitializeAsync();
        return await _database!.Table<LocalFuelLog>().OrderByDescending(f => f.LoggedAt).ToListAsync();
    }

    public async Task SaveFuelLogAsync(LocalFuelLog log)
    {
        await InitializeAsync();
        await _database!.InsertOrReplaceAsync(log);
    }

    public async Task<List<LocalExpense>> GetExpensesAsync(Guid rideId)
    {
        await InitializeAsync();
        return await _database!.Table<LocalExpense>().Where(e => e.RideId == rideId).OrderByDescending(e => e.IncurredAt).ToListAsync();
    }

    public async Task SaveExpenseAsync(LocalExpense expense)
    {
        await InitializeAsync();
        await _database!.InsertOrReplaceAsync(expense);
    }

    public async Task<List<LocalServiceReminder>> GetServiceRemindersAsync()
    {
        await InitializeAsync();
        return await _database!.Table<LocalServiceReminder>().Where(r => !r.IsDismissed).ToListAsync();
    }

    public async Task SaveServiceReminderAsync(LocalServiceReminder reminder)
    {
        await InitializeAsync();
        await _database!.InsertOrReplaceAsync(reminder);
    }

    public async Task<List<LocalEmergencyContact>> GetEmergencyContactsAsync()
    {
        await InitializeAsync();
        return await _database!.Table<LocalEmergencyContact>().OrderByDescending(c => c.IsPrimary).ToListAsync();
    }

    public async Task SaveEmergencyContactAsync(LocalEmergencyContact contact)
    {
        await InitializeAsync();
        await _database!.InsertOrReplaceAsync(contact);
    }
}
