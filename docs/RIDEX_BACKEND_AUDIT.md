# RIDEX V3 — BACKEND AUDIT & REALTIME INTEGRATION

**Document Identifier:** `RIDEX-ENG-DOC-003`  
**Version:** `3.0.0-PROD`  
**Date:** September 2026  
**Status:** AUTHORITATIVE AUDIT  
**Author:** RIDEX Senior Backend & Cloud Architecture Team

---

## 1. Backend Architecture Overview

RIDEX operates a high-availability dual-backend pipeline:
1. **Supabase Cloud Managed Services:** PostgreSQL 15 database, GoTrue JWT authentication, Storage buckets, and Realtime pub/sub replication.
2. **.NET 8 Enterprise Web API (`RIDEX.API`):** ASP.NET Core 8 Web API providing C# business controllers, Entity Framework Core ORM, SignalR WebSocket Hubs (`/hubs/rides`), Open-Meteo weather integration, and OSRM turn-by-turn routing calculations.

```
                  ┌─────────────────────────────────────┐
                  │          MOBILE CLIENT (EXPO)       │
                  └──────────┬────────────────┬─────────┘
                             │                │
             Direct Supabase │                │ .NET 8 REST
             Auth & Realtime │                │ & SignalR
                             ▼                ▼
           ┌───────────────────────┐   ┌───────────────────────┐
           │     SUPABASE CLOUD    │   │      .NET 8 API       │
           │                       │   │                       │
           │  • PostgreSQL 15 DB   │   │  • ASP.NET Core 8     │
           │  • Realtime Broadcast │   │  • SignalR RideHub    │
           │  • Row-Level Security │   │  • EF Core ORM        │
           │  • Stored Functions   │   │  • OSRM Routing Engine│
           └───────────────────────┘   └───────────────────────┘
```

---

## 2. Supabase Integration Audit

### A. Authentication & Session Management
- GoTrue handles rider registration, email/password login, password resets, and JWT issuance.
- Database trigger `on_auth_user_created` invokes `public.handle_new_user()` to automatically populate the `public.profiles` table upon user registration.
- Sessions are persisted securely via `expo-secure-store` on native targets and `localStorage` on web.

### B. Row-Level Security (RLS) Policy Audit
- **Zero-Recursion Verification:** All policies utilize direct indexed column comparisons (`auth.uid() = user_id` or `auth.uid() = organizer_id`) or `SECURITY DEFINER` helper functions (`is_ride_organizer`, `is_ride_participant`) to eliminate circular subquery locks.
- **Roster Privacy:** Ride participants can view active squad rosters and location beacons only for authorized rides.
- **Motorcycle Ownership:** Riders have exclusive `INSERT`, `UPDATE`, and `DELETE` permissions on their personal garage entries in `public.motorcycles`.

### C. Realtime Replication Publication
The `supabase_realtime` publication actively replicates state changes on:
- `public.rides` (status transitions: `DRAFT` $\rightarrow$ `PUBLISHED` $\rightarrow$ `ACTIVE` $\rightarrow$ `COMPLETED`)
- `public.ride_participants` (join requests, approvals, removals)
- `public.ride_locations` & `public.rider_locations` (latest GPS telemetry)
- `public.messages` (squad in-ride chat)
- `public.ride_sos_alerts` (emergency panic broadcasts)

---

## 3. .NET 8 Web API & SignalR Audit

### A. Controller Endpoints
| Controller | Primary Routes | Functionality |
|:---|:---|:---|
| **AuthController** | `POST /api/v1/auth/register`, `POST /api/v1/auth/login`, `POST /api/v1/auth/refresh` | Identity verification, JWT token issuance with role claims. |
| **RidesController** | `GET /api/v1/rides`, `POST /api/v1/rides`, `POST /api/v1/rides/{id}/join`, `POST /api/v1/rides/{id}/start` | Ride creation, join approval lifecycle, multi-stop route queries. |
| **MotorcyclesController** | `GET /api/v1/motorcycles`, `POST /api/v1/motorcycles`, `PUT /api/v1/motorcycles/{id}` | Personal garage CRUD, primary motorcycle selection, odometer tracking. |
| **ExpensesController** | `GET /api/v1/expenses/ride/{rideId}`, `POST /api/v1/expenses`, `POST /api/v1/expenses/{id}/settle` | Touring expense logging, fuel split calculations, payment status. |
| **FuelLogsController** | `GET /api/v1/fuellogs/bike/{bikeId}`, `POST /api/v1/fuellogs` | Fuel consumption logs, mileage estimation, tank range warnings. |
| **WeatherController** | `GET /api/v1/weather?lat={lat}&lon={lon}` | Open-Meteo integration for real-time temperature, precipitation, and wind speeds. |
| **RoutesController** | `GET /api/v1/routes`, `POST /api/v1/routes/calculate` | OSRM routing matrix, turn-by-turn road geometry, curvature metrics. |

### B. SignalR Real-Time Hub (`RideHub.cs`)
- **Endpoint:** `/hubs/rides` (WebSocket with Long Polling fallback).
- **Authentication:** JWT Bearer passed via query string parameter `access_token`.
- **Hub Methods:**
  - `JoinRideGroup(string rideId)`: Adds connection to SignalR group `ride_{rideId}`.
  - `SendLocationUpdate(RideLocationPacket packet)`: Validates timestamp, publishes position to all group participants.
  - `SendSquadAnnouncement(AnnouncementDto announcement)`: Road captain broadcast message.
  - `TriggerEmergencySOS(SosAlertDto sos)`: High-priority emergency broadcast across all connected devices.
  - `LeaveRideGroup(string rideId)`: Removes connection from group.

---

## 4. Architectural Coherence & Synchronization

To avoid dual competing backends:
1. **Primary Operational Backend:** Mobile clients use Supabase Cloud directly for zero-latency operations, live database queries, and broadcast channels.
2. **Supplemental Services:** The .NET API provides compute-heavy backend services (e.g. OSRM routing calculations, historical data export, administrative portal access) without conflicting with Supabase state.
3. **Data Agreement:** Both backends agree on field names, ISO-8601 UTC date formats, Double Precision latitude/longitude, and standardized ride lifecycle enums.
