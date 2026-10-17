# RIDEX — WEB APPLICATION TEST PLAN & VERIFICATION MATRIX

**Document Identifier:** `RIDEX-ENG-DOC-012`  
**Date:** October 2026  
**Status:** AUTHORITATIVE TEST PLAN  
**Scope:** `ridex-web` Frontend, Realtime Integration, Cross-Browser Compatibility  

---

## 1. Quality Objectives

The test plan validates that the web application functions seamlessly on Android Chrome, iPhone Safari, and desktop browsers, integrating cleanly with the authoritative Supabase backend while preserving existing mobile app behavior.

---

## 2. Test Suites & Verification Levels

```text
┌─────────────────────────────────────────────────────────────┐
│ 1. Unit & Algorithmic Tests (Vitest)                        │
│    - Haversine distance & bearing                           │
│    - Separation hysteresis engine (500m/400m, 1000m/800m)   │
│    - Waypoint reordering & route sequence integrity         │
│    - DTO mappers & form validation                          │
├─────────────────────────────────────────────────────────────┤
│ 2. Service & Integration Tests                              │
│    - Supabase Auth: sign-up, sign-in, session restore       │
│    - Ride Creation: title, date, start, waypoints, dest     │
│    - Checkpoint Persistence: order_index strictly retained  │
│    - Participant Lifecycle: join request, approve, reject   │
│    - Realtime Channel: broadcast reception & deduplication │
├─────────────────────────────────────────────────────────────┤
│ 3. UI & Responsive Component Tests                          │
│    - Safe-area spacing & mobile navigation                  │
│    - Empty, loading, error, and offline fallback states     │
│    - Touch controls on 375px - 430px smartphone viewports   │
├─────────────────────────────────────────────────────────────┤
│ 4. End-to-End Core Lifecycle Acceptance                     │
│    - Multi-rider workflow with 2 authenticated accounts     │
│    - CRITICAL WAYPOINT PERSISTENCE TEST                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Critical Waypoint Acceptance Test

### Test Objective
Verify that intermediate stops and their strict order persist accurately across creation, review, browser refresh, multi-account sharing, and reordering.

### Execution Procedure:
1. **Account A (Organizer):**
   - Sign in to `ridex-web`.
   - Open **Host Ride**.
   - Enter Title: *"Sahyadri Ghats Tour"*.
   - Set Origin: *Pune (18.5204, 73.8567)*.
   - Set Destination: *Mahabaleshwar (17.9237, 73.6586)*.
   - Add Stop 1: *Wai (17.9497, 73.8927)* — Type: `BREAKFAST` (Stop 15m).
   - Add Stop 2: *Pasarni Ghat (17.9350, 73.8050)* — Type: `VIEWPOINT` (Stop 10m).
   - Add Stop 3: *Panchgani (17.9250, 73.7250)* — Type: `FUEL` (Stop 10m).
   - Review route and click **Publish Ride**.
   - Receive Unique Ride ID (e.g. `RIDEX-7X92K`).
2. **Persistence & Refresh Verification:**
   - Reload page (`F5` / swipe refresh).
   - Verify all 3 stops render in the exact sequence ($1 \rightarrow 2 \rightarrow 3$) with exact coordinates.
3. **Account B (Participant Rider):**
   - Sign in on a second browser session / device.
   - Enter Ride ID `RIDEX-7X92K` in **Connect Ride**.
   - Submit **Join Request**.
4. **Host Approval:**
   - Account A sees pending request from Account B and clicks **Approve**.
   - Account B instantly sees status update to **Approved**.
   - Account B views the ride and confirms the exact same route geometry, 3 stops, and stop order.
5. **Reorder Verification:**
   - Account A reorders Stop 2 and Stop 3.
   - Saves changes.
   - Refresh both Account A and Account B screens.
   - Verify that the new stop order is reflected in both sessions.

---

## 4. Automated Regression Matrix

| Test Case ID | Test Description | Expected Result | Pass Criteria |
| :--- | :--- | :--- | :--- |
| `TC-AUTH-01` | Sign up with valid credentials | Profile created in `public.profiles` | Session active, redirected to dashboard |
| `TC-AUTH-02` | Sign in with invalid password | Clear error message displayed | No token leaked, form remains editable |
| `TC-AUTH-03` | Session restoration on reload | Active session restored from storage | User remains logged in without re-entering credentials |
| `TC-RIDE-01` | Create ride with 0 stops | Valid direct route created | Saved in `public.rides` with unique `join_code` |
| `TC-RIDE-02` | Create ride with 3+ stops | All stops saved in `public.ride_checkpoints` | Each stop has correct `order_index` (0, 1, 2) |
| `TC-JOIN-01` | Non-host rider joins via Ride ID | Participant record created as `pending` | Organizer receives real-time notification |
| `TC-JOIN-02` | Organizer approves participant | Participant status updated to `approved` | Participant sees updated status immediately |
| `TC-REAL-01` | Live location update broadcast | Peer rider marker updates on map canvas | Lat/Lng, speed, heading reflected within 1s |
| `TC-SEP-01` | Rider moves >1,000m from squad | Separation warning triggered | Red alert banner displayed with distance |
| `TC-SEP-02` | Rider returns to <800m | Separation warning cleared via hysteresis | Status reverts to `TOGETHER` |
| `TC-GPS-01` | User denies location permission | Graceful warning presented | Map falls back to route center without crash |
| `TC-RESP-01` | View on 375px screen (iPhone SE) | No horizontal scroll, touch targets >=44px | Clean header, bottom navigation accessible |
