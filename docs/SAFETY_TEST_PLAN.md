# RIDEX Safety & Community Verification Test Plan

## 1. Safety Center & Telemetry Test Cases

### TC-SAF-01: Emergency SOS 2-Step Confirmation
- **Precondition**: User is authenticated and active in a live ride session.
- **Action**: Click "SOS" button in Live Ride Cockpit or Safety Center.
- **Expected Result**:
  - Modal appears displaying 5 issue types (`MECHANICAL`, `FLAT_TYRE`, `OUT_OF_FUEL`, `LOST`, `MEDICAL`).
  - Clicking "Cancel" dismisses modal with zero side effects.
  - Selecting an issue and clicking "Broadcast Emergency SOS" opens a critical confirmation alert.
  - On final confirmation, alert is persisted to `public.ride_sos_alerts` and broadcast to squad via Supabase Realtime.

### TC-SAF-02: SOS Alert Resolution
- **Precondition**: Active SOS alert exists for ride.
- **Action**: Road Captain or triggering rider clicks "Mark as Resolved".
- **Expected Result**:
  - `safetyService.resolveSos` updates status to `'RESOLVED'` in database.
  - `sos_resolved` event is broadcast across Realtime channel.
  - Emergency banner clears from all participant cockpits.

### TC-SAF-03: GPS Signal Freshness & Staleness Detection
- **Precondition**: Location tracking active.
- **Action**: Test timestamp age intervals:
  - Age < 15s: Display green "Live" badge.
  - Age 15s - 45s: Display "Recent" badge.
  - Age 45s - 120s: Display amber "Signal Degraded" badge.
  - Age > 120s: Display red "Signal Lost" badge with honest offline guidance.
- **Automated Test**: Verified in `src/test/safety.test.ts`.

### TC-SAF-04: Geodesic Separation Warnings
- **Precondition**: Live ride with 2+ riders.
- **Action**: Simulate peer distance separation:
  - Distance < 2.0 km: Normal radar display.
  - Distance 2.0 - 5.0 km: Display amber `SEPARATION_WARNING` banner identifying affected rider.
  - Distance > 5.0 km: Display critical red lost-rider alert.
  - Stale locations (> 120s) must NOT trigger false separation alerts.

### TC-SAF-05: Push-to-Talk (PTT) Audio Intercom
- **Precondition**: Modern browser with Web Audio API support.
- **Action**:
  - Click "Join Squad Voice Channel".
  - Verify microphone permission prompt and state transition to `CONNECTED`.
  - Press and hold PTT button -> verify transmission state and active speaker display.
  - Release PTT button -> verify transmission ceases and stream resources are cleanly released.
  - Route navigation away from Safety Center -> verify audio stream tracks and AudioContext are cleanly stopped.

---

## 2. Community & Rider Profiles Test Cases

### TC-COM-01: Profile Telemetry & In-Place Editing
- **Action**: Navigate to `/profile`. Click "Edit Profile", update Name, Handle, Bio, and City, then save.
- **Expected Result**:
  - Validates inputs, saves to `public.profiles` via `authService.updateProfile`.
  - Displays instant success feedback and refreshes rider credentials.

### TC-COM-02: Authentic Milestone Verification
- **Action**: Compare rendered badges on `/profile` and `/community` against user's actual database records.
- **Expected Result**:
  - `FIRST_EXPEDITION` is earned only if user has >= 1 hosted or completed ride.
  - `CENTURY_RIDER` is earned only if user has logged >= 100 km.
  - `FLEET_COMMANDER` is earned only if user has >= 1 bike in garage.
  - Zero fabricated badges or fake statistics are shown.
- **Automated Test**: Verified in `src/test/community.test.ts`.

### TC-COM-03: Squad Enlistment & Formation
- **Action**: Navigate to `/community` -> Squads tab. Click "Enlist" on a touring squad.
- **Expected Result**:
  - Inserts membership into `public.group_members`.
  - Increments member count and toggles button to "Joined".
  - Clicking again leaves the squad safely.

### TC-COM-04: Feed Posts, Likes & Comments
- **Action**: Publish post in `/community` -> Feed tab. Toggle like and post a comment.
- **Expected Result**:
  - Persists post to `public.posts`, like to `public.post_likes`, comment to `public.comments`.
  - Real-time optimistic update reflects count immediately.

### TC-COM-05: Real-time Notification Delivery
- **Action**: Receive a squad join approval or SOS event while on `/notifications` or any page.
- **Expected Result**:
  - Real-time listener (`postgres_changes`) appends notification to list.
  - Header bell badge increments.
  - Clicking notification marks it as read in `public.notifications` and navigates to the target route.

---

## 3. Regression Testing Matrix

| Feature | Expo Mobile App | Web Application | Status |
|---|---|---|---|
| Supabase Authentication & Session | Untouched | Fully Functional | Verified |
| Garage & "I don't have a bike" | Untouched | Fully Functional | Verified |
| Host Ride with Checkpoints | Untouched | Fully Functional | Verified |
| Connect Ride via Join Code | Untouched | Fully Functional | Verified |
| Live GPS Radar & Speedometer | Untouched | Fully Functional | Verified |
| Emergency SOS & Resolution | Untouched | Fully Functional | Verified |
| PTT Intercom Interface | Untouched | Fully Functional | Verified |
| Touring Squads & Social Feed | Untouched | Fully Functional | Verified |
| Ride History & Statistics | Untouched | Fully Functional | Verified |
| Notification Center | Untouched | Fully Functional | Verified |
