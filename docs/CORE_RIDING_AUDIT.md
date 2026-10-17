# RIDEX CORE RIDING ENGINE — COMPREHENSIVE AUDIT & ROOT-CAUSE ANALYSIS

**Document:** `docs/CORE_RIDING_AUDIT.md`  
**Date:** October 2026  
**Subject:** Full Technical Audit of Group Ride Creation, Join Lifecycle, Real-time Synchronization, Road-Following Mapping, Telemetry, and Emergency Protocol.

---

## 1. Actual Source Files Responsible for Each Workflow

| Workflow | Primary Web Source Files | Mobile / Backend Source Files | Database Tables & Channels |
| :--- | :--- | :--- | :--- |
| **Ride Creation & Host Services** | `src/pages/HostRidePage.tsx`<br/>`src/services/rideService.ts`<br/>`src/components/rides/WaypointEditor.tsx` | `ridex-mobile/src/services/rides/RideService.ts` | `public.rides`<br/>`public.ride_checkpoints`<br/>`public.ride_participants` |
| **Ride ID Generation & Lookup** | `src/services/rideService.ts` (`generateUniqueRideCode`, `getRideByCode`)<br/>`src/pages/ConnectRidePage.tsx` | `ridex-mobile/src/utils/codeGenerator.ts` | `rides.join_code`, `rides.ride_code` |
| **Join Request & Approval Flow** | `src/pages/ConnectRidePage.tsx`<br/>`src/pages/RideDetailsPage.tsx`<br/>`src/services/rideService.ts`<br/>`src/services/realtimeService.ts` | `ridex-mobile/src/screens/RideLobbyScreen.tsx` | `public.ride_participants`<br/>Channel: `ride:${rideId}`<br/>Events: `join_request`, `approval_status` |
| **Membership & Roles** | `src/services/rideService.ts`<br/>`src/types/index.ts` | `ridex-mobile/src/types/ride.ts` | `ride_participants.role` (`organizer`, `lead`, `sweeper`, `rider`)<br/>`status` (`pending`, `approved`, `rejected`) |
| **Shared Live Map & Routing** | `src/components/maps/LeafletMap.tsx`<br/>`src/services/mapService.ts`<br/>`src/pages/RideDetailsPage.tsx`<br/>`src/pages/LiveRideCockpitPage.tsx` | `ridex-mobile/src/components/map/LiveRideMap.tsx` | OSRM Driving API (`router.project-osrm.org`) |
| **Participant Locations & Radar** | `src/pages/LiveRideCockpitPage.tsx`<br/>`src/services/realtimeService.ts`<br/>`src/stores/useActiveRideStore.ts`<br/>`src/utils/geo.ts` | `ridex-mobile/src/services/location/RideTrackingEngine.ts` | `public.ride_locations`<br/>Channel: `ride:${rideId}`<br/>Event: `location_update` |
| **Separation Engine** | `src/utils/geo.ts` (`evaluateGroupSeparation`)<br/>`src/components/live/SeparationBanner.tsx` | `ridex-mobile/src/services/safety/SeparationMonitor.ts` | Geodesic Haversine calculation with hysteresis |
| **SOS Activation & Safety** | `src/components/safety/SosModal.tsx`<br/>`src/pages/SafetyCenterPage.tsx`<br/>`src/services/safetyService.ts`<br/>`src/stores/useActiveRideStore.ts` | `ridex-mobile/src/services/safety/SosService.ts` | `public.ride_sos_alerts`<br/>Channel: `ride:${rideId}`<br/>Event: `sos_alert` |

---

## 2. The Exact Cause of the Join Loop and Failed Joining

### Root Cause 1: Missing Real-Time Approval Listener in `ConnectRidePage.tsx`
In `ConnectRidePage.tsx`:
- When Rider B enters the Ride ID (e.g. `RIDEX-7X92K`) and clicks "Submit Join Request", `handleJoin` calls `rideService.requestToJoinRide` and broadcasts `join_request`.
- The page state sets `requestStatus = 'submitted'` and renders static text: `"✓ Join request is pending approval from Road Captain."`
- **Crucial defect:** `ConnectRidePage.tsx` did **not** subscribe to channel `ride:${foundRide.id}` for the `approval_status` event!
- When Rider A (Road Captain) approved Rider B in `RideDetailsPage.tsx`, Rider B’s client never heard the approval event. Rider B was trapped on the Connect screen waiting indefinitely unless they performed a manual search or hard page reload.

### Root Cause 2: Squad Lobby Gating on Ride Status
In `RideDetailsPage.tsx`:
- The button to enter the live cockpit was gated strictly by `isLive = ride.status === 'active'`.
- If the ride was in `'published'` status (the normal pre-ride meetup/briefing state), approved participants were blocked from entering the live lobby/cockpit to await the tour start together.

### Root Cause 3: Cold Start Absence of Peer Locations
When Rider B enters `LiveRideCockpitPage.tsx`, `peerLocations` in Zustand initialized to `{}`. The page only listened to future `location_update` broadcast packets. If Rider A had already started GPS tracking 5 minutes earlier and was stationary or moving, Rider B did not see Rider A on the map until a new broadcast packet arrived.
`LiveRideCockpitPage` failed to execute an initial `SELECT` from `public.ride_locations` on mount.

---

## 3. Route Data Structure and Why the Map Renders a Straight Line

### Root Cause: Omission of `routeCoordinates` in Consumer Pages
In `LeafletMap.tsx`:
```tsx
if (routeCoordinates && routeCoordinates.length > 1) {
  // Road-following polyline
  const polyline = L.polyline(routeCoordinates, { color: '#FF6B00', weight: 5, ... }).addTo(map);
} else if (boundsPoints.length >= 2) {
  // Direct segment connecting line (STRAIGHT LINE FALLBACK!)
  const polyline = L.polyline(boundsPoints, { color: '#FF6B00', weight: 3, dashArray: '8, 8', ... }).addTo(map);
}
```
- In `RideDetailsPage.tsx` (line 355) and `LiveRideCockpitPage.tsx` (line 208), `<LeafletMap />` was invoked **without the `routeCoordinates` prop**:
  ```tsx
  <LeafletMap
    start={{ name: ride.startLocationName, ... }}
    destination={{ name: ride.destinationName, ... }}
    waypoints={waypoints}
    height="320px"
  />
  ```
- Because `routeCoordinates` was undefined or empty, `LeafletMap.tsx` consistently fell back to connecting `start`, `waypoints`, and `destination` directly using straight geometric segments!
- In `mapService.ts`, the OSRM routing request had `steps=false`, omitting turn-by-turn maneuver instructions.

---

## 4. Current Implementation or Absence of the Shared Rider Bubble

### Audit Finding:
- Individual rider markers were rendered as separate Leaflet `divIcon` elements with pulsing radar rings.
- However, there was **no Group Pack Radar bubble/cluster visualization** connecting riders in close proximity.
- When multiple squad members ride together in pack formation, riders need to see a cohesive squad perimeter/envelope that distinguishes riders within the pack from riders who are trailing behind or detached.

---

## 5. Existing Source of Participant Locations and Real-time Updates

1. **Client Acquisition:**
   `LiveRideCockpitPage.tsx` uses `navigator.geolocation.watchPosition` with high accuracy.
2. **Database Persistence:**
   `realtimeService.broadcastLocation(rideId, location)` upserts the position into `public.ride_locations` (`ride_id`, `user_id`, `latitude`, `longitude`, `heading`, `speed`, `accuracy`, `is_sharing`, `updated_at`).
3. **Real-time Channel Broadcast:**
   Broadcasts `location_update` on Supabase Realtime channel `ride:${rideId}`.
4. **Initial Fetch Missing:**
   The client omitted the initial REST fetch from `public.ride_locations` upon page entry.

---

## 6. Cause of SOS Appearing or Activating When a Ride Starts

### Root Cause 1: Persistent Unscoped Zustand State
In `useActiveRideStore.ts`:
- `activeSos` is a persistent in-memory Zustand state.
- When an SOS alert was triggered previously during testing, `activeSos` was never cleared when the user exited the cockpit or opened a different ride.
- When `LiveRideCockpitPage.tsx` or `Header.tsx` loaded, it inspected `activeSos` from global Zustand state. If non-null, it immediately showed the red flashing Emergency SOS banner!

### Root Cause 2: Lack of Initialization Guard on Mount
In `LiveRideCockpitPage.tsx`, on mount, there was no reset of `activeSos: null` or check against `public.ride_sos_alerts` for active alerts belonging strictly to the current `rideId`.

---

## 7. Minimal Verified Fixes

1. **Connect Ride Synchronization:**
   - In `ConnectRidePage.tsx`, subscribe to `ride:${rideId}` for `approval_status`. When `userId === currentUserId && status === 'APPROVED'`, automatically set approved status and navigate to `/rides/${rideId}`.
   - Add a 3-second polling verification check as a network fallback for dropped WebSockets.
2. **Squad Lobby Access:**
   - In `RideDetailsPage.tsx`, allow approved riders and organizers to access the live lobby/cockpit in `'published'` status.
3. **Road-Following Polyline & Maneuver HUD:**
   - In `mapService.ts`, request `steps=true` from OSRM to receive road geometry and turn-by-turn maneuver instructions (`RouteManeuver[]`).
   - In `RideDetailsPage.tsx` and `LiveRideCockpitPage.tsx`, calculate and pass `routeCoordinates` into `LeafletMap`.
   - Remove straight-line fallback when road route is computing.
4. **Group Pack Radar Bubble:**
   - In `LeafletMap.tsx`, render a squad proximity convex hull / proximity bubble around riders within safe group proximity (< 1.5 km), visually distinguishing the squad formation from detached riders.
5. **Cold-Start Participant Locations:**
   - In `rideService.ts`, add `getRideLiveLocations(rideId)`.
   - In `LiveRideCockpitPage.tsx`, load existing active locations on mount.
6. **Optional Manual SOS & Clean Startup:**
   - Reset `activeSos: null` on ride mount.
   - Only populate `activeSos` if an active emergency exists in `ride_sos_alerts` for this specific `rideId`.
   - Keep SOS strictly 2-step manual confirmation via `SosModal`.

---

## 8. Existing Behavior That Must Be Preserved

- Original database schema: `rides`, `ride_participants`, `ride_locations`, `ride_checkpoints`, `ride_sos_alerts`.
- Supabase authentication, JWT sessions, RLS security policies.
- 8-character Ride ID format: `RIDEX-XXXXX`.
- Checkpoints persistence with `order_index` sequence.
- Independent rider tracking: One rider stopping GPS never terminates another rider's session.
- Mobile Expo app (`ridex-mobile/`) and backend contracts remain 100% intact.
