# RIDEX V3 — ENGINEERING BASELINE & ARCHITECTURAL AUDIT

**Document Identifier:** `RIDEX-ENG-DOC-001`  
**Version:** `3.0.0-PROD`  
**Date:** September 2026  
**Status:** AUTHORITATIVE BASELINE  
**Author:** RIDEX Senior Engineering & Architecture Team

---

## 1. Executive Summary

RIDEX is a motorcycle touring and connected group-riding platform engineered for high-reliability mobile coordination across Android, iOS, and Web. The platform empowers riders to organize group rides, discover twisty mountain passes, track peer squad members live on an interactive map cockpit, receive automatic separation warnings when riders fall behind, coordinate stops at checkpoints, and communicate via integrated push-to-talk voice intercom and squad chat.

---

## 2. Full-Stack System Architecture

RIDEX employs a resilient hybrid architecture combining direct Supabase Cloud backend integration for real-time mobile agility with a comprehensive .NET 8 Web API and SignalR Hub for enterprise-grade backend processing and synchronization.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        RIDEX MOBILE / CLIENT LAYER                      │
│                                                                         │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │                     React Native + Expo v52                     │   │
│   │  (Expo Router v4, Zustand 5, TanStack Query v5, Lucide Icons)  │   │
│   └───────────────┬─────────────────────────────┬───────────────────┘   │
│                   │                             │                       │
│        REST / Realtime / Auth            REST / SignalR Hub             │
└───────────────────┼─────────────────────────────┼───────────────────────┘
                    ▼                             ▼
┌──────────────────────────────────────┐  ┌───────────────────────────────┐
│           SUPABASE CLOUD             │  │       .NET 8 WEB API          │
│                                      │  │                               │
│  • PostgreSQL 15 + PostGIS           │  │  • ASP.NET Core 8 Web API     │
│  • GoTrue Authentication             │  │  • SignalR RideHub (/hubs)    │
│  • Realtime Broadcast Channels       │  │  • EF Core + SQLite/Postgres  │
│  • Row-Level Security (RLS)          │  │  • OSRM Routing Engine        │
│  • Atomic PL/pgSQL Stored Procedures │  │  • Open-Meteo Weather Service │
│  • Storage Buckets (Avatars, Bikes)  │  │  • Nominatim Geocoding        │
└──────────────────────────────────────┘  └───────────────────────────────┘
                    ▲                             ▲
                    └──────────────┬──────────────┘
                                   │
                      ┌────────────────────────┐
                      │ LOCAL OFFLINE STORAGE  │
                      │                        │
                      │ • Expo SQLite 15       │
                      │ • AsyncStorage         │
                      │ • SecureStore          │
                      └────────────────────────┘
```

---

## 3. Tier Responsibilities & Separation of Concerns

### A. React Native Mobile Application (`ridex-mobile/`)

- **Framework:** React Native `0.76.9` / Expo `~52.0.0` with New Architecture support.
- **Routing:** File-based navigation via `expo-router ~4.0.6`.
- **State Management:**
  - `authStore`: Authentication session, active rider profile, tokens.
  - `bikeStore`: Personal motorcycle garage, primary bike selector, specs.
  - `rideStore`: Active ride data, discovery filters, drafts, participant roster.
  - `rideTrackingStore`: Hardware GPS location stream, trip distance, heading, speed.
- **Map & Geospatial Cockpit:**
  - `react-native-maps` on Android/iOS native targets with custom dark style.
  - Fallback Web/Leaflet tile matrix renderer with dynamic container layout bounds.
- **Local Persistence & Offline:** `expo-sqlite`, `@react-native-async-storage/async-storage`, `expo-secure-store`.

### B. Supabase Cloud Backend

- **Database:** PostgreSQL 15 with UUID extensions and row-level security.
- **Authentication:** Supabase Auth (JWT bearer sessions, user metadata sync).
- **Realtime Pub/Sub:** Broadcast channels (`ride:{rideId}`) for sub-second location beacons, join requests, approvals, and emergency SOS alerts.
- **Authoritative Tables:** `profiles`, `motorcycles`, `rides`, `ride_participants`, `ride_locations`, `ride_checkpoints`, `ride_sos_alerts`, `messages`, `notifications`.

### C. .NET 8 Web API & SignalR (`RIDEX.API/`)

- **API Controllers:** Authentication, Ride Management, Motorcycle Management, Expenses, Fuel Logs, Weather, Emergency.
- **SignalR Hub (`RideHub.cs`):** WebSocket group streaming for multi-device synchronization, heartbeat presence, and route notifications.
- **Routing Engine (`OSRMRoutingService.cs`):** OpenStreetMap road snapping, multi-stop distance matrix, turn-by-turn geometry.
- **Security:** JWT authentication with role policies (`RiderOnly`, `AdminOnly`), Bcrypt password hashing.

---

## 4. Current Build & Compilation Baseline

| Component | Target / Environment | Status | Verification Evidence |
| :--- | :--- | :--- | :--- |
| **TypeScript Typecheck** | `ridex-mobile/` | ✅ **PASS** | `npx tsc --noEmit` exited with 0 errors |
| **Expo Web Build** | `ridex-mobile/` | ✅ **PASS** | `npx expo export -p web` compiled to `dist/` |
| **Supabase Cloud Sync** | `rsmgifwhlvlgkpmfeqdj.supabase.co` | ✅ **PASS** | Live schema verified, RLS policies operational |
| **Metro Development Server** | Port `8081` (LAN) | ✅ **PASS** | Serving active bundles to Expo Go & Web |
| **Web Application Server** | Port `5000` (LAN) | ✅ **PASS** | HTTP server active with CORS enabled |

---

## 5. Identified Baseline Gaps & Verified Defects

1. **Live Ride Separation HUD Hardcoding:**
   - *Defect:* `LiveGroupRideScreen` had hardcoded squad proximity state (`return 'TOGETHER'`) and static distance spread values instead of dynamic evaluation from `SeparationEngine`.
   - *Resolution:* Connect live GPS coordinates of all squad members directly to the upgraded `SeparationEngine` with hysteresis and reference modes.

2. **Map Coordinate Property Asymmetry:**
   - *Defect:* Certain services emitted `{ latitude, longitude }` directly while others wrapped them inside `{ coordinate: { latitude, longitude } }`.
   - *Resolution:* Implement universal coordinate accessor across `LiveRideMap`, `RiderMarker`, and `SeparationEngine`.

3. **Multi-Stop Waypoint Sequence Integrity:**
   - *Defect:* Waypoints added during ride creation could lose strict sequence ordering or omit stop duration properties when saved.
   - *Resolution:* Enforce unified `RideCheckpoint` / `Waypoint` model with mandatory `orderIndex`, `sequence`, `latitude`, `longitude`, and `category`.

4. **Offline Location Queue Stale Overwrite Protection:**
   - *Defect:* Queued offline location packets lacked timestamp monotonic guards on replay.
   - *Resolution:* Add strict timestamp validation to discard any replayed packet older than the receiver's current state.

---

## 6. Safety & Non-Destructive Operation Rules

- **Zero Data Loss:** All existing profiles, motorcycle entries, and ride records must remain intact.
- **No Direct Destructive DDL:** Schema updates must use idempotent `ADD COLUMN IF NOT EXISTS` and non-destructive constraint modifications.
- **Key Safety:** Client code must never contain Supabase `service_role` secrets or private backend signing keys.
- **Type Safety Guarantee:** Zero TypeScript errors allowed on any commit.
