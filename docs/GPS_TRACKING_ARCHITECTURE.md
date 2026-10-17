# 🏍️ RIDEX — GPS Ride Tracking Architecture & Telemetry Engine

> **Version:** 1.0.0  
> **Status:** Production-Ready  
> **Philosophy:** *GPS → Local Storage → UI → Cloud Later*

---

## 1. Executive Summary & GPS Tracking Philosophy

The RIDEX GPS Ride Tracking Foundation is engineered to reliably record motorcycle journeys with **zero dependency on active internet connectivity**.

Key Principles:
* **Zero Per-Point Network Requests**: The hardware GPS stream flows directly through validation and an in-memory buffer into local SQLite (`ride_locations`).
* **Multi-Stage Telemetry Filtering**: GPS noise, horizontal drift, cell-tower jumps, and sensor jitter are filtered out before distance or speed calculations occur.
* **Pure Geodesic Calculations**: All internal distance computations use the **Haversine formula in meters**; velocity is tracked internally in **meters per second ($m/s$)** and converted to $km/h$ for display.
* **Crash & Reboot Resilience**: Unfinished rides are automatically detected on app startup and can be resumed or finalized without losing recorded telemetry.
* **Separation of Concerns**: Personal ride recording (System A) is strictly decoupled from future real-time multi-rider live location sharing (System B).

```text
┌────────────────────────────────────────────────────────────────────────┐
│                   RIDEX GPS TELEMETRY DATA FLOW                        │
└────────────────────────────────────────────────────────────────────────┘
                      GPS HARDWARE (expo-location)
                                   ↓
                       LocationPermissionService
                                   ↓
                            LocationService
                                   ↓
                       Multi-Stage LocationFilter
             (Bounds, Timestamp, Accuracy, Noise, Drift)
                                   ↓
                         Distance & Speed Units
                                   ↓
                        RideTrackingEngine (Buffer)
                                   ↓
            ┌──────────────────────┴──────────────────────┐
            ↓                                             ↓
   Local SQLite Storage                          Zustand HUD State
(rides, ride_locations)                         (rideTrackingStore)
            ↓                                             ↓
       SyncService                                Cockpit Screen HUD
   (on ride completion)                          (Speed, Dist, Timer)
```

---

## 2. Location Permissions & Contextual Flow

* **Contextual Access**: Permissions are requested only when the rider initiates a ride or navigates to the tracking cockpit, never randomly during cold launch.
* **Supported States**:
  - `GRANTED`: Hardware location tracking enabled.
  - `DENIED`: User declined; guidance is provided explaining why GPS is required.
  - `BLOCKED`: User permanently denied; an inline button opens native device settings via `Linking.openSettings()`.
  - `SERVICES_DISABLED`: Device-level location toggle is off; user is prompted to turn on GPS.

---

## 3. Multi-Stage GPS Filtering Pipeline

Incoming coordinates pass through five validation filters before updating distance or speed:

1. **Coordinate Integrity & Bounds**: Verifies non-null finite numbers within $[-90, 90]$ latitude and $[-180, 180]$ longitude, explicitly rejecting $(0, 0)$ "Null Island" artifacts.
2. **Timestamp Sanity**: Discards packets with future timestamps or timestamps older than the previous baseline.
3. **Accuracy Threshold**: Rejects points with an accuracy radius $> 30$ meters (configurable via `LOCATION_CONFIGS`).
4. **Stationary Jitter Filter**: If the calculated distance from the previous baseline is $< 2.5$ meters, the coordinate is accepted as a valid position snapshot but **accumulates $0$ distance**, preventing odometer creep while stopped at traffic lights.
5. **GPS Drift & Teleportation Protection**: Calculates the derived velocity between consecutive points. If speed exceeds $85$ m/s ($\approx 306$ km/h), the point is rejected as an impossible GPS jump.

---

## 4. Distance & Speed Mathematical Model

### 4.1. Geodesic Distance (Haversine Formula)
Implemented in [haversine.ts](file:///c:/Users/prati/OneDrive/Desktop/RideX/ridex-mobile/src/utils/geo/haversine.ts):
$$\Delta\sigma = 2 \arcsin\left( \sqrt{ \sin^2\left(\frac{\Delta\phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta\lambda}{2}\right) } \right)$$
$$d = R \cdot \Delta\sigma \quad (R = 6,371,008.8\text{ m})$$

### 4.2. Velocity & Speeds
* **Sensor Speed**: Evaluates hardware-reported `coords.speed` if valid and non-negative.
* **Derived Speed**: Fallback velocity calculated from geodesic distance and timestamp delta:
  $$v = \frac{\Delta d}{\Delta t}$$
* **Average Speed**: Calculated strictly as $\frac{\text{Total Distance}}{\text{Moving Duration}}$ (excluding paused time).

---

## 5. Ride Lifecycle & State Machine

```text
       ┌───────────┐
       │   IDLE    │
       └─────┬─────┘
             │ startRide()
             ▼
       ┌───────────┐
       │  ACTIVE   │◄───────────┐
       └─────┬─────┘           │
             │                 │ resumeRide()
pauseRide()  │                 │
             ▼                 │
       ┌───────────┐           │
       │  PAUSED   │───────────┘
       └─────┬─────┘
             │ stopRide()
             ▼
       ┌───────────┐
       │ COMPLETED │
       └───────────┘
```

### Pause/Resume Baseline Invariant
When a ride is paused, `previousPoint` is cleared. Upon resumption, the first new GPS coordinate establishes a **fresh baseline** without calculating distance across the paused time gap (e.g. walking into a roadside cafe).

---

## 6. SQLite Batch Buffering & Persistence

To maintain 60 FPS UI performance and avoid excessive disk I/O:
* GPS breadcrumbs are buffered in-memory (`locationBuffer`).
* The buffer automatically flushes to SQLite table `ride_locations` within an atomic transaction when:
  - Batch reaches **10 points** ($bufferBatchSize$).
  - Elapsed time reaches **5,000 ms** ($bufferFlushIntervalMs$).
  - Ride status changes to `PAUSED` or `COMPLETED`.
  - App transitions to the background.

---

## 7. Crash & App-Kill Recovery

Implemented in [RideRecoveryService.ts](file:///c:/Users/prati/OneDrive/Desktop/RideX/ridex-mobile/src/services/location/RideRecoveryService.ts):
* On launch, RIDEX checks for rides in `IN_PROGRESS` or `PAUSED` state.
* If found, the Cockpit UI renders a prominent recovery banner:
  - **Resume Ride**: Restores accumulated distance, timer, and max speed, restarting the GPS tracking engine.
  - **Finish & Save**: Finalizes the ride up to the last recorded breadcrumb and queues cloud synchronization.
  - **Discard**: Purges the incomplete ride.

---

## 8. Decoupling from Future Live Group Rides

| Feature | System A: Ride Recording *(Current)* | System B: Live Group Radar *(Future Step 7)* |
| :--- | :--- | :--- |
| **Purpose** | Personal tour tracking & route history | Real-time rider proximity & map markers |
| **Storage** | High-precision SQLite breadcrumbs | Ephemeral SignalR / WebSocket presence stream |
| **Network** | 100% Offline (batched sync upon finish) | Real-time peer broadcasts when online |
| **Rate** | 1 Hz continuous recording | 0.2 Hz – 0.05 Hz adaptive location packets |
