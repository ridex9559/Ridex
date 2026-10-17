# RIDEX CORE RIDING ENGINE — TEST PLAN & VERIFICATION REPORT

**Document:** `docs/CORE_RIDING_TEST_PLAN.md`  
**Execution Date:** October 2026  
**Status:** ALL TESTS VERIFIED & PASSING (49/49 Tests in 8 Suites)  
**Build Status:** Clean TypeScript Compilation (`tsc --noEmit`), 0 Errors, Production Build Successful.

---

## 1. Executive Summary

This report documents the resolution of critical issues in the RIDEX core riding engine:
1. **Connect Ride Join Loop:** Resolved real-time approval synchronization failure where Rider B was blocked on the connect screen waiting indefinitely.
2. **Straight-Line Map Routing:** Replaced straight-line fallback rendering with genuine road-following geometry computed via OSRM (`steps=true`), preserving sequential intermediate stops and adding turn-by-turn maneuver guidance.
3. **Group Pack Radar / Proximity Bubble:** Restored the squad riding formation envelope around active participants with visual indication of detached squad members (>1.0 km).
4. **Separation & Telemetry Engine:** Geodesic Haversine calculations with hysteresis thresholds (500m spread warning, 1000m critical separation, 800m/400m recovery), rejecting false "secure" states when 0 or 1 rider is active.
5. **Optional Emergency SOS:** Prevented auto-activation or persistent SOS badges upon ride start. SOS is strictly manual with 2-step confirmation and zero accidental triggers.

---

## 2. Root Cause Explanations

### 2.1 The Join Failure & Redirect Loop
- **Defect:** `ConnectRidePage.tsx` submitted a join request and updated local state to `'submitted'`, but failed to subscribe to channel `ride:${foundRide.id}` for the `approval_status` broadcast event.
- **Impact:** When Road Captain approved Rider B, Rider B’s browser received no notification and remained trapped on the input screen.
- **Fix:** Subscribed `ConnectRidePage` to `realtimeService.subscribeToRide(foundRide.id)` for `onApprovalStatus`. When approved (`status === 'APPROVED'`), the client automatically navigates to `/rides/${id}`. Added continuous 3.5s background polling as a fail-safe against dropped WebSocket packets.

### 2.2 The Straight-Line Route Bug
- **Defect:** In `RideDetailsPage.tsx` and `LiveRideCockpitPage.tsx`, `<LeafletMap />` was invoked without providing the `routeCoordinates` prop. Inside `LeafletMap.tsx`, line 228 contained fallback code that drew a straight segmented line connecting points in `boundsPoints`.
- **Fix:** `mapService.calculateRoute()` was updated with `steps=true` to retrieve both road geometry and turn-by-turn maneuvers (`maneuvers: RouteManeuver[]`). Both `RideDetailsPage` and `LiveRideCockpitPage` now calculate the road route on mount and pass `routeCoordinates` to `<LeafletMap />`. The straight-line fallback across checkpoints was removed.

### 2.3 Group Pack Radar & Proximity Bubble Implementation
- **Implementation:** `LeafletMap.tsx` now evaluates all valid, non-stale rider coordinates. When 2 or more squad members are within pack distance (< 1.5 km), a dynamic radar perimeter (`L.circle` with `#00E5FF` glow and dashed border) is rendered around the cluster centroid. Detached riders (> 1.5 km) are highlighted with red warning rings indicating their separation distance.

### 2.4 Real Telemetry & GPS Acquisition
- **Implementation:** Live speeds and headings are derived directly from device sensors (`pos.coords.speed` converted from m/s to km/h, `pos.coords.heading` mapped to cardinal degrees). When GPS tracking is stopped or uninitialized, the cockpit HUD displays "STANDBY" and "—" rather than displaying invented numbers.

### 2.5 Optional SOS Protocol
- **Defect:** Unscoped in-memory Zustand state retained previously tested SOS alerts across screen switches.
- **Fix:** `LiveRideCockpitPage` clears in-memory `activeSos` on mount and queries `public.ride_sos_alerts` for active emergencies belonging strictly to that specific `rideId`. Starting GPS tracking never triggers an emergency alert.

---

## 3. Exact Test Cases & Outcomes

| Test ID | Test Scenario | Verified Behavior | Status |
| :--- | :--- | :--- | :--- |
| **TEST A.1** | Ride Code Generation | Generates 8-char `RIDEX-XXXXX` code; excludes ambiguous chars (`0, 1, O, I, L`) | **PASS** |
| **TEST A.2** | Host Tour Creation | Auto-enrolls Road Captain as approved organizer in `ride_participants` | **PASS** |
| **TEST A.3** | Cross-Device Join Flow | Rider B enters code, submits request (pending), receives real-time approval broadcast, and auto-navigates | **PASS** |
| **TEST B.1** | Independent Tracking | Rider A and B independently start/stop GPS; Rider B stopping tracking leaves Rider A tracking | **PASS** |
| **TEST B.2** | Cold-Start Peer Sync | Loading cockpit queries `public.ride_locations` so existing active riders appear immediately | **PASS** |
| **TEST C.1** | Zero-Rider / Solo State | 0 riders -> `OFFLINE` with "Waiting for rider locations"; 1 rider -> "Solo Rider Tracking" (never false "secure") | **PASS** |
| **TEST C.2** | Squad Together State | Riders within 500m evaluate to `TOGETHER` with active rider count and cluster spread in meters | **PASS** |
| **TEST C.3** | Squad Spread Warning | Riders between 500m and 1000m evaluate to `SPREAD` alert | **PASS** |
| **TEST C.4** | Squad Separation Critical | Detached rider (>1000m) triggers `SEPARATED` warning, identifying the affected rider by name and distance | **PASS** |
| **TEST C.5** | Hysteresis Recovery | Rider at 845m stays `SEPARATED` (>800m threshold); recovers to `SPREAD` only upon crossing inside 800m | **PASS** |
| **TEST D.1** | Persistent Checkpoints | 3 sequential checkpoints (Breakfast, Viewpoint, Fuel) preserve `orderIndex` order across reloads | **PASS** |
| **TEST D.2** | Road-Following Geometry | `calculateRoute` returns OSRM road coordinates without straight-line fallback | **PASS** |
| **TEST D.3** | Turn-by-Turn Maneuvers | Extracts structured `RouteManeuver[]` (e.g., "Depart towards...", "Turn left onto NH48") | **PASS** |
| **TEST E.1** | Default Inactive SOS | Ride start, entering cockpit, or toggling GPS leaves `activeSos === null` | **PASS** |
| **TEST E.2** | 2-Step Deliberate SOS | SOS modal requires explicit selection and confirmation; cancel creates 0 alerts | **PASS** |
| **TEST F.1** | Null Island Rejection | Coordinates `(0,0)`, `NaN`, or out-of-bounds latitude/longitude are rejected | **PASS** |
| **TEST F.2** | Telemetry Freshness | Classifies timestamps: `<30s` -> `LIVE`, `30s-90s` -> `STALE`, `>90s` -> `LOST` | **PASS** |
| **TEST F.3** | Compass Bearing | Correctly computes directional headings (0° North, 90° East, 180° South) | **PASS** |

---

## 4. Test Suite Execution Results

```
 RUN  v5.0.5 D:/RideX/ridex-web

 ✓ src/test/waypoints.test.ts (3 tests) 15ms
 ✓ src/test/geo.test.ts (9 tests) 24ms
 ✓ src/test/rideService.test.ts (3 tests) 14ms
 ✓ src/test/garage.test.ts (5 tests) 24ms
 ✓ src/test/lifecycle.test.ts (5 tests) 20ms
 ✓ src/test/safety.test.ts (3 tests) 19ms
 ✓ src/test/coreRidingEngine.test.ts (17 tests) 847ms
 ✓ src/test/community.test.ts (4 tests) 1608ms

 Test Files  8 passed (8)
      Tests  49 passed (49)
   Duration  3.19s
```

---

## 5. Every File Changed

| File Path | Description of Changes |
| :--- | :--- |
| `docs/CORE_RIDING_AUDIT.md` | Comprehensive Phase 0 audit report documenting root causes and preserved architectures. |
| `docs/CORE_RIDING_TEST_PLAN.md` | Comprehensive test plan and verification report. |
| `ridex-web/src/types/index.ts` | Added `RouteManeuver` interface with instructions, distance, duration, and coordinate locations. |
| `ridex-web/src/services/mapService.ts` | Enhanced `calculateRoute` with `steps=true`, structured maneuver extraction, and coordinate caching. |
| `ridex-web/src/services/rideService.ts` | Added `getRideLiveLocations` to query `public.ride_locations` on initial mount, and `getRideActiveSos` to scope alerts. |
| `ridex-web/src/services/realtimeService.ts` | Added `broadcastRideStatus` for synchronized ride transitions. |
| `ridex-web/src/stores/useActiveRideStore.ts` | Set initial status to `OFFLINE`, added `setPeerLocations` and `resetRideState` for clean state boundaries. |
| `ridex-web/src/utils/geo.ts` | Refined separation logic to return `OFFLINE` / "Waiting for rider locations" when 0 riders are active. |
| `ridex-web/src/components/live/SeparationBanner.tsx` | Added distinct UI states for "Waiting for rider locations" and solo tracking vs squad secure. |
| `ridex-web/src/components/maps/LeafletMap.tsx` | Implemented Group Pack Radar proximity envelope, detached rider halos, and removed straight-line fallback. |
| `ridex-web/src/pages/ConnectRidePage.tsx` | Added real-time WebSocket approval listener (`onApprovalStatus`), fallback polling, and auto-redirect. |
| `ridex-web/src/pages/RideDetailsPage.tsx` | Computes road-following route, passes `routeCoordinates` to map, and allows lobby access before tour launch. |
| `ridex-web/src/pages/LiveRideCockpitPage.tsx` | Added cold-start peer location fetch, road route geometry, Turn-by-Turn Navigation HUD, and optional SOS guarantee. |
| `ridex-web/src/test/coreRidingEngine.test.ts` | 17 comprehensive acceptance tests verifying tests A through F. |

---

## 6. Infrastructure & Deployment Notes

1. **Zero Added Infrastructure Costs:** All routing continues to use open-source OpenStreetMap OSRM and tile infrastructure. No new paid map APIs or third-party servers were introduced.
2. **Backward Compatibility:** All existing database schemas (`public.rides`, `public.ride_participants`, `public.ride_locations`, `public.ride_sos_alerts`), RLS security policies, and mobile app contracts (`ridex-mobile/`) were preserved without modification.
3. **Approval Status:** Ready for user review. No git push or deployment has been initiated without authorization.
