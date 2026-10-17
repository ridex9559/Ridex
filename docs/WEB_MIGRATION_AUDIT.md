# RIDEX — WEB MIGRATION AUDIT & BASELINE VERIFICATION REPORT

**Document Identifier:** `RIDEX-ENG-DOC-010`  
**Date:** October 2026  
**Status:** COMPLETE AUDIT BASELINE  
**Author:** RIDEX Senior Software Architecture & Engineering Team  
**Workspace:** `d:/RideX`

---

## 1. Executive Summary

This audit establishes the baseline of the existing RIDEX repository prior to creating the new, standalone mobile-first web frontend (`ridex-web`). 
The audit inspects the existing codebase structure, dependencies, data ownership, service contracts, and known historical defects to guarantee that:
1. The existing mobile application (`ridex-mobile` / Expo SDK 57) remains 100% intact, operational, and unregressed.
2. The existing backend services (.NET Web API / SignalR / Supabase PostgreSQL) are preserved as the authoritative sources of truth with zero conflicting schemas or duplicate databases.
3. The new web application (`ridex-web`) is built in an isolated directory (`ridex-web/`) utilizing React 19 + TypeScript + Vite + React Router + TanStack Query + Zustand, tailored specifically for mobile browsers (Android Chrome, iPhone Safari) and desktop browsers.

---

## 2. Workspace & Codebase Topology

The repository contains three primary application tiers:

```
d:/RideX/
├── ridex-mobile/                # React Native / Expo SDK 57 Mobile App
│   ├── app/                     # Expo Router file-based screens
│   ├── src/                     # Core services, repositories, hooks, components
│   ├── supabase/                # PostgreSQL schema migrations (001 - 011)
│   └── package.json             # Expo 57, React Native 0.86.3, React 19.2.3
│
├── RIDEX.sln                    # .NET 8 Backend Solution
│   ├── RIDEX.API/               # ASP.NET Core 8 Web API + SignalR RideHub
│   ├── RIDEX.Core/              # Domain entities (User, Motorcycle, Ride, Route, etc.)
│   ├── RIDEX.Infrastructure/    # EF Core (SQLite / PostgreSQL), Providers (OSRM, OpenMeteo)
│   ├── RIDEX.Shared/            # DTOs, Enums, Join Code Generator, GeoMath
│   ├── RIDEX.Tests/             # xUnit test suite
│   └── RIDEX.Admin/             # Admin Web Dashboard (vanilla HTML/JS)
│
├── supabase/
│   └── migrations/              # Authoritative Supabase Cloud SQL migrations
│
├── docs/                        # Architectural specifications & audits
└── scratch/                     # Automated regression verification test suites
```

---

## 3. Data Ownership & Authoritative Source of Truth

| Domain / Operation | Authoritative Source | Protocol / Transport | Database Entity / Policy |
| :--- | :--- | :--- | :--- |
| **User Authentication** | Supabase Auth | HTTPS / REST / JWT | `auth.users` -> `public.profiles` via trigger |
| **Rider Profile & Settings** | Supabase PostgreSQL | PostgREST / JWT | `public.profiles`, `public.user_settings` (RLS Owner) |
| **Motorcycle Garage** | Supabase PostgreSQL | PostgREST / JWT | `public.motorcycles` (RLS Owner write, Public read) |
| **Ride Lifecycle & Planning** | Supabase PostgreSQL | PostgREST / JWT | `public.rides` (RLS Organizer write, Authenticated read) |
| **Ride Join & Membership** | Supabase PostgreSQL | PostgREST / RPC | `public.ride_participants` (Pending -> Approved) |
| **Route Waypoints/Stops** | Supabase PostgreSQL | PostgREST / JWT | `public.ride_checkpoints` (Sequence `order_index`) |
| **Live GPS Telemetry** | Supabase PostgreSQL / Realtime | WebSockets / Channels | `public.ride_locations` & Realtime `ride:{rideId}` |
| **Secondary Group Hub** | RIDEX.API (.NET) | SignalR / WebSockets | `RideHub` (`/hubs/rides`) with SQLite persistence |
| **Turn-by-Turn Routing** | OSRM / OpenStreetMap | HTTPS / JSON | Zero-cost open routing API (`router.project-osrm.org`) |
| **Weather Telemetry** | Open-Meteo | HTTPS / JSON | Zero-cost open forecast API (`api.open-meteo.com`) |
| **Geocoding & Search** | OSM Nominatim | HTTPS / JSON | Zero-cost open geocoding (`nominatim.openstreetmap.org`) |

---

## 4. API & Real-Time Event Contracts

### A. Supabase Realtime Channels (`ride:{rideId}`)
- **Channel Name:** `ride:${rideId}`
- **Broadcast Events:**
  - `join_request`: Emitted when an authenticated rider enters the Ride ID.
    - Payload: `{ rideId, userId, riderName, username, avatarUrl, motorcycleName, motorcycleCc, requestedAt }`
  - `approval_status`: Emitted when the organizer approves or rejects a rider.
    - Payload: `{ rideId, userId, status: 'APPROVED' | 'REJECTED', updatedAt }`
  - `ride_status`: Emitted when the ride state changes.
    - Payload: `{ rideId, status: 'UPCOMING' | 'LIVE' | 'COMPLETED' | 'CANCELLED', timestamp }`
  - `location_update`: Emitted when a participating rider broadcasts GPS coordinates.
    - Payload: `{ userId, riderName, motorcycleName, avatarUrl, role, latitude, longitude, heading, speed, updatedAt }`
  - `sos_alert`: Emitted during an active emergency.
    - Payload: `{ rideId, userId, riderName, motorcycleName, latitude, longitude, emergencyType, timestamp }`

### B. SignalR Real-Time Hub (`/hubs/rides`)
- **Hub Endpoint:** `ws://localhost:5000/hubs/rides` (or `/ridehub`)
- **Server Methods:**
  - `JoinRideGroup(Guid rideId)`
  - `LeaveRideGroup(Guid rideId)`
  - `SendLocationUpdate(LocationUpdateDto update)`
  - `StartRide(Guid rideId)`
  - `PauseRide(Guid rideId)`
  - `ResumeRide(Guid rideId)`
  - `EndRide(Guid rideId)`
- **Client Receivers:**
  - `LocationUpdated(RiderLiveStateDto riderState)`
  - `MemberJoined(RideMemberDto member)`
  - `MemberLeft(Guid userId, string userName)`
  - `SeparationAlert(string alertMessage, Guid userId, double distanceFromLeaderKm)`
  - `RideStarted(Guid rideId, DateTime startTime)`
  - `RideEnded(Guid rideId, RideSummaryDto summary)`

---

## 5. Audit of Known Historical Defects & Current Status

| Target / Defect | Historical Symptom | Current Verified State | Root Cause & Resolution |
| :--- | :--- | :--- | :--- |
| **Expo SDK Mismatch** | App crashed on boot with SDK 52 vs 57 mismatch | 🟢 Resolved in `ridex-mobile` | Upgraded to Expo SDK 57, React Native 0.86.3. `npm run typecheck` passes with 0 errors. |
| **`ExponentAV` Native Module** | Crash upon evaluating `import { Audio } from 'expo-av'` | 🟢 Resolved in `ridex-mobile` | Replaced with dynamic lazy loader and capability checks. Web uses Web Audio / MediaRecorder. |
| **iOS Map Regression** | Custom native map render glitch | 🟢 Isolated | `ridex-mobile` native map code preserved. Web version uses Leaflet / OSM canvas decoupled from native. |
| **Waypoint Persistence** | Route stops lost or hardcoded demo stops rendered | 🟢 Resolved in data layer | `CheckpointService` strictly writes to `ride_checkpoints` table; never injects fake stops. |
| **Supabase Login / RLS 42501** | PostgREST permission denied on mutations | 🟢 Verified & Fixed | Master schema `20260908_ridex_v2_master_schema.sql` defines non-recursive RLS policies with `SECURITY DEFINER` helpers. |
| **Motorcycles `deleted_at`** | `PGRST204: Could not find 'deleted_at' column` | 🟢 Verified & Fixed | Migration `011_add_motorcycles_deleted_at.sql` added the column; mapper omits it during unsynced payload serialization. |

---

## 6. Shared vs. Platform-Specific Boundaries

| Layer / Component | Strategy for Web (`ridex-web`) |
| :--- | :--- |
| **Authentication & Tokens** | Web-native: `@supabase/supabase-js` using standard browser `localStorage` / cookies. No native SecureStore. |
| **UI Components** | Web-native: HTML5 semantic tags, Tailwind / modern CSS, responsive touch-first design. No `react-native` imports. |
| **Maps & Route Visualization** | Web-native: Leaflet / OpenStreetMap Dark Matter raster tiles. Fast, responsive, gesture-friendly. |
| **GPS Tracking Engine** | Web-native: `navigator.geolocation.watchPosition` with foreground focus. Honest reporting of browser background throttling. |
| **Mathematical Calculators** | Shared logic: Haversine distance, Great-Circle bearing, Douglas-Peucker reduction, hysteresis separation engine. |
| **Database Contracts** | Identical schemas: Direct parity with `profiles`, `motorcycles`, `rides`, `ride_participants`, `ride_checkpoints`. |
