# 🏍️ RIDEX Real-Time Telemetry & Group Ride Architecture

## Overview
RIDEX provides high-performance, low-latency live telemetry, rider separation alerts, and group coordination for motorcycle touring using ASP.NET Core SignalR and an in-memory live state engine (`InMemoryLiveRideStateStore`).

```text
  [ Mobile Rider A ]      [ Mobile Rider B ]      [ Mobile Leader ]
          │                       │                       │
          └───────────────┬───────┴───────────────────────┘
                          │ (SignalR WebSocket)
                          ▼
                   [ ASP.NET Core ]
                   [   RideHub    ]
                          │
            ┌─────────────┴─────────────┐
            ▼                           ▼
[ InMemoryLiveRideStateStore ]   [ Periodic DB Worker ]
(Concurrent live telemetry,      (Drains historical GPS
 separation detection, alerts)   traces in batches)
```

---

## 1. Zero-Cost Real-Time State Engine
- Instead of requiring paid cloud Redis or Azure SignalR instances, the backend uses `ILiveRideStateStore` implemented with thread-safe `ConcurrentDictionary` storage.
- Active rides maintain an in-memory dictionary of joined riders (`RiderLiveStateDto`), computing separation distances and centroids in sub-millisecond memory lookups.
- Raw high-frequency GPS points are queued in a concurrent buffer and periodically persisted to PostgreSQL/SQLite in batches, reducing database I/O by >90%.

---

## 2. Adaptive GPS Tracking Strategy
To maximize battery life and minimize cellular bandwidth consumption during long touring days (8–12 hours), the client adjusts transmission frequency based on velocity and distance moved:

| Velocity Range | Speed State | Tracking Interval | Trigger Condition |
| :--- | :--- | :--- | :--- |
| `< 5 km/h` | Stationary / Halt | **30 seconds** | Or movement `> 25m` |
| `5 – 30 km/h` | City / Low Speed | **10 seconds** | Or movement `> 25m` |
| `30 – 70 km/h` | Ghats / Touring | **5 seconds** | Or movement `> 25m` |
| `> 70 km/h` | Highway / Fast | **3 seconds** | Or movement `> 25m` |

---

## 3. Rider Separation Detection Algorithm
1. The leader configures a separation threshold (e.g. 1.0 km, 2.0 km, 5.0 km, 10.0 km).
2. On each location update, the Haversine distance between the rider and the leader is calculated:
   $$d = 2R \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta\phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta\lambda}{2}\right)}\right)$$
3. If $d > \text{threshold}$, the rider's state is flagged `IsSeparated = true`.
4. A smart cooldown timer (5 minutes per rider) prevents notification spam while broadcasting warning banners to the entire group.

---

## 4. SignalR Hub Events Reference

### Client-to-Server Methods
- `JoinRideGroup(Guid rideId)`: Handshakes with JWT validation and joins the SignalR channel `Ride_{rideId}`.
- `LeaveRideGroup(Guid rideId)`: Sets status to disconnected and notifies remaining riders.
- `SendLocationUpdate(LocationUpdateDto location)`: Pushes live coordinates, speed, heading, and battery level.
- `StartRide(Guid rideId)`: Owner transitions status to `InProgress`.
- `EndRide(Guid rideId)`: Owner concludes ride, computes final `RideSummaryDto`, and dispatches summary.
- `TriggerEmergency(SosTriggerRequest sos)`: Broadcasts high-priority SOS alert with live map coordinates to active group members.

### Server-to-Client Broadcast Events
- `LocationUpdated(RiderLiveStateDto)`: Pushes real-time coordinates and speed of moving riders.
- `SeparationAlert(string alertMessage, Guid userId, double distanceFromLeaderKm)`: Alerts group of stranded rider.
- `EmergencyTriggered(EmergencyAlertDto)`: Flashes SOS alarm on all rider dashboards.
- `RideEnded(Guid rideId, RideSummaryDto)`: Triggers ride completion card and analytics update.
