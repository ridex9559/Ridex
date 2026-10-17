# 🏍️ RIDEX — Live Group Ride & Real-Time Radar Architecture
## Step 9: Live Group Rides, Real-Time Location Radar, & Compass Heading

---

## 1. Primary Design Constraints & Principles

1. **Zero Paid API Keys**: Uses Supabase Realtime Channels for WebSocket message distribution and PostgreSQL RPCs. No Ably, Pusher, Google Maps billing, or Mapbox accounts required.
2. **Single GPS Stream Reuse**: The app NEVER spawns duplicate GPS hardware location watchers. `useLiveLocations` consumes `currentLocation` directly from the Step 5 `useRideTrackingStore` engine, preserving phone battery and system stability.
3. **Throttled Broadcast Engine**: Writes are filtered before network transmission to prevent database write saturation:
   - Minimum interval: $4.5\text{ seconds}$
   - Minimum displacement: $6.0\text{ meters}$
   - Accuracy threshold: $\le 35\text{ meters}$
   - Heartbeat: Every $15\text{ seconds}$ if stopped
4. **Single Row Per Rider Table**: Real-time locations are maintained in `ride_live_locations` with `PRIMARY KEY(session_id, user_id)` (upsert only, never an unbounded log table).

---

## 2. Telemetry Throttling & Presence State Machine

```
               [GPS Hardware Location Stream]
                              │
                              ▼
                 [Accuracy <= 35m Filter]
                              │
                              ▼
            [Time >= 4.5s OR Distance >= 6.0m?]
                       │             │
                    NO │             │ YES
                       ▼             ▼
                   [Drop]    [Atomic Upsert RPC]
                                     │
                                     ▼
                        [Supabase Realtime Channel]
                                     │
                                     ▼
                          [Peer LiveRadar Updates]
```

### Rider Presence States:
| State | Condition | Visual Indicator |
| :--- | :--- | :--- |
| **LIVE** | Updated $\le 25\text{s}$ ago | Emerald Green Ring (`#10B981`) + Pulsing Radar Glow + Heading Chevron |
| **STALE** | Updated $> 25\text{s}$ and $\le 75\text{s}$ ago | Amber Ring (`#F59E0B`) |
| **OFFLINE** | Updated $> 75\text{s}$ ago | Slate Grey Ring (`#64748B`) |

---

## 3. Real-Time Radar Cockpit Components

- **`LiveRideMap.tsx`**: Fullscreen tactical dark map showing self marker, start & destination pins, and all peer rider markers with $0-360^\circ$ compass rotation chevrons.
- **`RiderMarker.tsx`**: High-contrast radar marker with user avatar/initials, speed pill (`82 km/h` or `PAUSED`), rotating direction arrow, and status ring.
- **`LiveRideControls.tsx`**: Floating tactical cockpit controls:
  - Toggle Follow Mode (Compass Lock / Free Pan)
  - Recenter Camera
  - Beacon Active / Muted Switch
  - End Live Ride (Organizer) / Leave Live Ride (Participant)
- **`LiveRidersDrawer.tsx`**: Bottom sheet drawer displaying live squad roster, active count, group peak speed, and tap-to-focus on any squad member.
- **`app/rides/live/[id].tsx`**: Fullscreen cockpit HUD route integrating telemetry and controls.
