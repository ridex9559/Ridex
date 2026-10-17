namespace RIDEX.Shared.Enums;

public enum RideRole
{
    Owner = 0,
    CoLeader = 1,
    Member = 2
}

public enum RideStatus
{
    Draft = 0,
    Upcoming = 1,
    InProgress = 2,
    Paused = 3,
    Completed = 4,
    Cancelled = 5
}

public enum ServiceType
{
    EngineOil = 0,
    ChainLubrication = 1,
    ChainReplacement = 2,
    BrakePads = 3,
    AirFilter = 4,
    Tyres = 5,
    Battery = 6,
    Insurance = 7,
    PUC = 8,
    GeneralService = 9,
    Other = 10
}

public enum ExpenseCategory
{
    Fuel = 0,
    Hotel = 1,
    Food = 2,
    Toll = 3,
    Parking = 4,
    Repair = 5,
    Spares = 6,
    Other = 7
}

public enum SyncStatus
{
    Pending = 0,
    Syncing = 1,
    Synced = 2,
    Failed = 3
}

public enum SyncOperationType
{
    Create = 0,
    Update = 1,
    Delete = 2
}

public enum RiderOnlineStatus
{
    Offline = 0,
    Online = 1,
    Disconnected = 2,
    Emergency = 3
}

public enum RoutePreference
{
    Fastest = 0,
    Shortest = 1,
    Scenic = 2,
    AvoidTolls = 3,
    AvoidHighways = 4,
    MotorcycleFriendly = 5
}

public enum EmergencyStatus
{
    Active = 0,
    Resolved = 1,
    Cancelled = 2
}

public enum UserRole
{
    User = 0,
    Admin = 1
}
