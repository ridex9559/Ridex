# 🛡️ RIDEX Offline-First & Sync Engine Architecture

## Overview
Motorcycle touring often passes through remote mountain passes, dense forests, and cellular dead zones. RIDEX is built from the ground up to be **100% resilient without active internet connectivity**.

```text
               ┌───────────────────────────────┐
               │    Online Telemetry Stream    │
               │   (SignalR Live Group Hub)    │
               └───────────────▲───────────────┘
                               │ (Internet Connected)
               ┌───────────────┴───────────────┐
               │   LocationTrackingService     │
               └───────────────┬───────────────┘
                               │ (Internet Lost / Disconnected)
                               ▼
               ┌───────────────────────────────┐
               │      Local SQLite Database    │
               │   (LocalGpsQueue / SyncQueue) │
               └───────────────┬───────────────┘
                               │ (Connectivity Restored)
                               ▼
               ┌───────────────────────────────┐
               │     SyncService Engine        │
               │ (Deduplication + Batch Batch) │
               └───────────────────────────────┘
```

---

## 1. Local SQLite Storage (`sqlite-net-pcl`)
The mobile device stores all core touring entities locally:
- **Rider Profile & Motorcycles**: Authenticated credentials, token cache, bike odometer, tank specs.
- **Downloaded Routes & Waypoints**: Full GeoJSON polyline geometry, turn instructions, fuel stop pins.
- **Queued GPS Points (`LocalGpsQueueItem`)**: Time-stamped coordinates recorded during dead zones.
- **Offline Sync Queue (`SyncQueueItem`)**: Fuel logs, expenses, maintenance reminders created offline.
- **Emergency Contacts**: Emergency dialer and SMS templates available with 0 network dependency.

---

## 2. Sync Operation Model
Every entity mutation created while disconnected is queued with an idempotent operation item:

```csharp
public class SyncQueueItem
{
    public Guid OperationId { get; set; }       // Client-generated UUID for deduplication
    public string EntityType { get; set; }      // "Expense", "FuelLog", "Motorcycle", etc.
    public Guid EntityId { get; set; }          // Entity UUID
    public int OperationType { get; set; }      // Create = 0, Update = 1, Delete = 2
    public string PayloadJson { get; set; }     // Serialized DTO payload
    public DateTime CreatedAt { get; set; }     // Offline creation timestamp
    public int RetryCount { get; set; }         // Exponential backoff counter
    public int Status { get; set; }             // Pending, Syncing, Synced, Failed
}
```

---

## 3. Sync Flow & Reconnection Lifecycle
1. **Connectivity Listener**: `IConnectivityService` detects transition from `Offline` to `Online`.
2. **Batch Ingestion**: `MobileSyncService` drains up to 200 queued operations and GPS points into a single `POST /api/v1/sync/batch` request.
3. **Idempotent Server Processing**: `SyncEngine` verifies `EntityId` and `OperationId` against the database to prevent duplicate writes if a retry occurs.
4. **Mark Synced & Pruning**: Succeeded IDs are acknowledged and removed from the local `SyncQueue`.
5. **Conflict Resolution**: Last-Write-Wins (LWW) based on `CreatedAt` timestamp is applied for profile/motorcycle updates.

---

## 4. Offline SOS Guarantee
If a rider presses the SOS button while offline:
1. RIDEX displays immediate **one-tap emergency phone call buttons** (`112 Police`, `108 Ambulance`, primary family contact).
2. Calculates exact current GPS coordinates from the device hardware.
3. Pre-populates a ready-to-send SMS with an OpenStreetMap clickable pin link:
   ```text
   EMERGENCY ALERT: I need immediate assistance while riding.
   My current coordinates are: https://www.openstreetmap.org/?mlat=19.5447&mlon=73.7663#map=16/19.5447/73.7663
   ```
4. Displays a clear message: *"Internet unavailable. Emergency message could not be sent online. Use Call/SMS options below."*
