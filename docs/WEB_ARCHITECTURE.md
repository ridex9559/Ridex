# RIDEX — WEB APPLICATION ARCHITECTURE SPECIFICATION

**Document Identifier:** `RIDEX-ENG-DOC-011`  
**Date:** October 2026  
**Status:** AUTHORITATIVE WEB ARCHITECTURE  
**Application Target:** Mobile-First Web & Progressive Web App (`ridex-web`)  
**Supported Platforms:** Android Chrome, iPhone Safari, Desktop Chromium/Safari/Firefox  

---

## 1. Architectural Principles & System Goals

1. **True Mobile-First Web Experience**: Tailored specifically for 375px to 430px smartphone viewports (iPhone notch, dynamic island, Android navigation bars), yet fully responsive up to 4K ultra-wide monitors.
2. **Zero Dependency on Native Mobile Bundles**: Completely decoupled from Expo, React Native bridges, Hermes bytecode, and native Android/iOS compilation.
3. **Unified Backend Integration**: Connects to the exact same Supabase PostgreSQL instance and .NET API endpoints without duplicate databases or conflicting schemas.
4. **Resilient Geospatial Cockpit**: Interactive dark-themed maps using OpenStreetMap / CARTO Dark tiles with client-side polyline simplification and geodesic separation monitoring.
5. **Honest Browser Capabilities**: Explicit handling of browser geolocation security (HTTPS requirements), foreground/background throttling, and battery conservation.

---

## 2. Technology Stack

```text
┌─────────────────────────────────────────────────────────────┐
│                       RIDEX-WEB                             │
│                                                             │
│  UI Framework:      React 19 + TypeScript (Strict Mode)     │
│  Build Tool:        Vite 6 (Fast HMR, optimized rollups)    │
│  Routing:           React Router v7                         │
│  Remote State:      TanStack Query v5                       │
│  Client State:      Zustand v5                              │
│  Maps & GIS:        Leaflet + OpenStreetMap / CARTO Dark    │
│  Styling:           TailwindCSS v3 (Graphite/Stealth Theme) │
│  Realtime Sync:     @supabase/supabase-js Realtime Channel  │
│  Routing Provider:  OSRM (Open Source Routing Machine)      │
│  Geocoding:         OSM Nominatim Search                    │
│  Testing:           Vitest + React Testing Library          │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Directory Layout (`ridex-web/`)

```text
ridex-web/
├── public/
│   ├── manifest.json            # PWA manifest (standalone display, icons)
│   ├── favicon.svg              # RIDEX brand icon
│   └── sw.js                    # Conservative static-asset service worker
├── src/
│   ├── assets/                  # High-contrast motorcycle badges & icons
│   ├── components/              # Composable modular UI widgets
│   │   ├── common/              # Button, Input, Modal, Badge, Toast, Loader
│   │   ├── layout/              # MobileHeader, BottomNav, SafeContainer
│   │   ├── maps/                # LeafletMap, PolylineLayer, RiderMarker, WaypointList
│   │   ├── rides/               # RideCard, ParticipantBadge, WaypointEditor
│   │   └── live/                # RadarHUD, SeparationBanner, TelemetryPills
│   ├── config/                  # Supabase config, map providers, constants
│   ├── hooks/                   # useAuth, useRides, useRideDetails, useLiveRide, useGeolocation
│   ├── pages/                   # Top-level screen views (14 core workflows)
│   │   ├── LandingPage.tsx
│   │   ├── LoginPage.tsx
│   │   ├── RegisterPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── GaragePage.tsx
│   │   ├── HostRidePage.tsx
│   │   ├── RideDetailsPage.tsx
│   │   ├── ConnectRidePage.tsx
│   │   ├── RideLobbyPage.tsx
│   │   ├── LiveRideCockpitPage.tsx
│   │   ├── SettingsPage.tsx
│   │   └── NotFoundPage.tsx
│   ├── services/                # Typed domain services
│   │   ├── api/                 # Supabase client & REST integration
│   │   ├── auth/                # Session lifecycle, signin/signup/signout
│   │   ├── rides/               # Ride CRUD, join request, approval engine
│   │   ├── garage/              # Motorcycle operations & specs
│   │   ├── maps/                # Leaflet tile provider, OSRM routing, geocoding
│   │   └── realtime/            # Realtime channel broadcast & presence
│   ├── stores/                  # Zustand stores (authStore, activeRideStore, uiStore)
│   ├── types/                   # TypeScript interfaces matching backend models
│   ├── utils/                   # Haversine, bearing, formatting, validators
│   ├── App.tsx                  # Root component with routing and providers
│   ├── main.tsx                 # Application entry point
│   └── index.css                # Stealth dark theme and safe-area variables
├── index.html                   # Mobile-optimized HTML5 shell with viewport-fit=cover
├── package.json                 # Web dependencies
├── tsconfig.json                # Strict TypeScript configuration
└── vite.config.ts               # Vite build configuration with PWA optimization
```

---

## 4. State Management Matrix

| Category | Tool | Scope / Responsibility |
| :--- | :--- | :--- |
| **Server State** | **TanStack Query** | Querying profiles, garage motorcycles, rides list, ride details, waypoints, participants. Automatic background refetching and caching. |
| **Auth Session** | **Zustand (`useAuthStore`)** | Active authenticated user, profile, JWT token, session status. Synced with Supabase `onAuthStateChange`. |
| **Active Ride HUD** | **Zustand (`useActiveRideStore`)**| Active live ride session ID, tracking toggle (Start/Stop Tracking), current rider coordinates, peer rider locations, separation status, speed/heading. |
| **UI Ephemeral** | **React `useState` / Zustand**| Modal states, active waypoint drawer, filter tabs, toast notifications. |

---

## 5. Security & Authorization Posture

1. **Zero Secret Leakage**: Browser code bundles ONLY `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Supabase `service_role` keys, database passwords, and JWT signing keys are NEVER referenced or bundled.
2. **PostgreSQL RLS Enforcement**: Every database request passes through Supabase PostgREST with the caller's JWT Bearer token:
   - Riders can only update their own profiles (`auth.uid() = id`).
   - Riders can only mutate their own motorcycles (`auth.uid() = user_id`).
   - Only ride organizers can approve participants (`public.is_ride_organizer(ride_id, auth.uid())`).
   - Riders can only insert locations for themselves (`auth.uid() = user_id`).
3. **CORS Compliance**: The .NET API and Supabase endpoints permit requests from standard web origins with credential support.

---

## 6. Browser Geolocation & Capability Model

### A. Android Chrome
- Full support for `navigator.geolocation.watchPosition` with high accuracy.
- While the tab is active, updates occur every 1 to 5 seconds depending on velocity.
- When backgrounded or the screen locks, Chrome may throttle location callbacks to save power. RIDEX displays a clear warning: *"Keep screen awake for continuous live telemetry."*

### B. iPhone Safari (iOS)
- Requires explicit user permission prompt.
- Secure origin (`https://` or `http://localhost`) strictly required.
- iOS Safari pauses JavaScript timers and location callbacks when minimized or switched to another tab. The cockpit dynamically marks peer beacons as `STALE` (>30s) or `OFFLINE` (>90s) to prevent misleading information.
