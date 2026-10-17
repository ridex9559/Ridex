# RIDEX V3 — FRONTEND AUDIT & SCREEN INVENTORY

**Document Identifier:** `RIDEX-ENG-DOC-002`  
**Version:** `3.0.0-PROD`  
**Date:** September 2026  
**Status:** COMPREHENSIVE SCREEN AUDIT  
**Author:** RIDEX Senior Frontend & Mobile Engineering Team

---

## 1. Audit Classification Taxonomy

Every screen and route in `ridex-mobile/` is classified into one of five rigorous engineering states:

- 🟢 **FUNCTIONAL:** Screen is fully connected to live backend/store, handles loading/error/empty states, interactive controls execute actual business logic, and UI conforms to Adventure Cockpit standards.
- 🟡 **PARTIALLY FUNCTIONAL:** Screen renders and connects to real data, but has edge-case limitations, incomplete offline fallback, or requires design token harmonization.
- 🔵 **UI ONLY:** Screen provides visual layout with static or mock data; needs backend integration.
- 🔴 **BROKEN:** Screen crashes, fails compilation, has fatal runtime exceptions, or missing critical imports.
- ⚪ **NOT VERIFIED:** Screen has not undergone multi-device or hardware GPS regression testing.

---

## 2. Complete Screen Inventory & Audit Matrix

| # | Screen / Route Path | Route Identifier | Classification | Primary Data Sources | Key Components | Audit Findings & Redesign Requirements |
|:---|:---|:---|:---|:---|:---|:---|
| **01** | `app/index.tsx` | `/` | 🟢 **FUNCTIONAL** | `authStore`, `SecureStore` | Splash Screen, Redirect Router | Restores user auth session from `SecureStore`. Directs authenticated riders to `/(tabs)/home` and unauthenticated users to `/auth/login`. |
| **02** | `app/_layout.tsx` | Root Stack | 🟢 **FUNCTIONAL** | `QueryClientProvider`, `NetworkStatus` | App Stack, StatusBar, Offline Banner | Wraps application in TanStack Query, React Native Gesture Handler, Safe Area, and dark theme background. |
| **03** | `app/(tabs)/_layout.tsx` | Tab Bar | 🟢 **FUNCTIONAL** | `authStore`, `useRouter` | BottomNavigation, TabBarIcons | 5-tab adventure cockpit: Home, Ride, Explore, Community, Profile. Custom racing orange `#FF6B00` active indicator. |
| **04** | `app/(tabs)/home.tsx` | `/(tabs)/home` | 🟢 **FUNCTIONAL** | `RideService`, `BikeService`, `authStore` | Cockpit Header, ActiveRideCard, QuickActions, UpcomingRides | Real rider greeting, primary motorcycle card, quick actions (Create Ride, Connect Ride, Garage), active ride radar prompt, and weather HUD. |
| **05** | `app/(tabs)/ride.tsx` | `/(tabs)/ride` | 🟢 **FUNCTIONAL** | `RideService`, `RideRealtimeService` | RideLobby, JoinRideModal, LiveRadarPrompt | Hub for active rides, join code entry (`RIDEX-XXXXX`), pending approvals list, and direct link to live group cockpit. |
| **06** | `app/(tabs)/explore.tsx` | `/(tabs)/explore` | 🟢 **FUNCTIONAL** | `RouteService`, `OSRM` | FilterBar, RouteCard, ElevationChart, MapPreview | Curated motorcycle routes (Twisties, Mountain Passes, Coastal, Off-road), difficulty ratings, curvature indices, and GPX download. |
| **07** | `app/(tabs)/community.tsx` | `/(tabs)/community` | 🟢 **FUNCTIONAL** | `CommunityService`, Supabase | FeedPostCard, SquadRoster, GroupList | Motorcycle clubs, group announcements, photo feeds, and ride stories. |
| **08** | `app/(tabs)/profile.tsx` | `/(tabs)/profile` | 🟢 **FUNCTIONAL** | `UserService`, `authStore`, `BikeService` | ProfileHeader, StatsGrid, GaragePreview, SettingsLink | Rider bio, total touring distance, emergency contacts, primary bike display, and profile editing. |
| **09** | `app/auth/login.tsx` | `/auth/login` | 🟢 **FUNCTIONAL** | Supabase Auth, `authStore` | LoginForm, PrimaryButton, OAuthOptions | Email/password sign-in, credential validation, error feedback toasts, and session persistence. |
| **10** | `app/auth/signup.tsx` | `/auth/signup` | 🟢 **FUNCTIONAL** | Supabase Auth, `authStore` | SignupForm, PasswordStrength, TermsModal | Rider registration, auto-creation of `profiles` row via database trigger, and navigation to Profile Setup. |
| **11** | `app/auth/forgot-password.tsx` | `/auth/forgot-password` | 🟢 **FUNCTIONAL** | Supabase Auth | ResetEmailInput, BackButton | Password reset email trigger with user-friendly confirmation alert. |
| **12** | `app/auth/profile-setup.tsx` | `/auth/profile-setup` | 🟢 **FUNCTIONAL** | Supabase Profiles, Storage | AvatarPicker, RiderBioInput, CitySelector | First-time rider onboarding to complete display name, riding experience level, and default motorcycle. |
| **13** | `app/garage/index.tsx` | `/garage` | 🟢 **FUNCTIONAL** | `BikeService`, `bikeStore` | MotorcycleCard, AddBikeFab, EmptyState | Personal motorcycle garage list, primary bike badge, fuel economy, displacement (cc), and maintenance status. |
| **14** | `app/garage/add-bike.tsx` | `/garage/add-bike` | 🟢 **FUNCTIONAL** | `BikeService`, Supabase | BikeSpecForm, FuelTankInput, ImagePicker | Multi-field motorcycle entry (Brand, Model, Year, Engine CC, Fuel Capacity, Registration Number). |
| **15** | `app/garage/[id].tsx` | `/garage/[id]` | 🟢 **FUNCTIONAL** | `BikeService`, `bikeStore` | BikeDetailHeader, SpecGrid, EditModal, DeleteDialog | Detailed bike diagnostics, primary toggle, delete confirmation with cascade safety. |
| **16** | `app/rides/create.tsx` | `/rides/create` | 🟢 **FUNCTIONAL** | `RideService`, `OSRM`, Mapbox/OSM | 4-Step Wizard, WaypointPicker, RoutePreviewMap | Step 1: Info $\rightarrow$ Step 2: Route & Stops $\rightarrow$ Step 3: Squad & Bike $\rightarrow$ Step 4: Summary & Publish. Generates unique Ride Code. |
| **17** | `app/rides/[id].tsx` | `/rides/[id]` | 🟢 **FUNCTIONAL** | `RideService`, `RideRealtimeService` | RideDetailHeader, WaypointTimeline, ParticipantList, HostControls | Authoritative ride detail view, start ride button (host), request to join (rider), approve/reject member cards, and live route map. |
| **18** | `app/rides/live/[id].tsx` | `/rides/live/[id]` | 🟢 **FUNCTIONAL** | GPS Engine, Supabase Realtime, `SeparationEngine` | LiveRideMap, RiderMarker, GroupStatusHUD, IntercomSheet, SOSModal | Core real-time group tracking cockpit. Renders live rider bubbles, calculates geodesic separation, triggers alerts, and supports voice intercom. |
| **19** | `app/rides/summary.tsx` | `/rides/summary` | 🟢 **FUNCTIONAL** | `RideTrackingStore`, `RideService` | TripMetricsGrid, ElevationProfile, ShareButton | Post-ride telemetry review: distance, max speed, lean angles, duration, and participant roster. |
| **20** | `app/rides/history.tsx` | `/rides/history` | 🟢 **FUNCTIONAL** | `RideService`, `authStore` | HistoryList, DateRangeFilter, EmptyHistory | Past completed motorcycle tours, filter by date/bike, and GPX export. |
| **21** | `app/rides/analytics.tsx` | `/rides/analytics` | 🟢 **FUNCTIONAL** | `RideStatisticsService` | SpeedChart, MileageBarChart, SafetyScore | Aggregated riding telemetry, monthly distance trends, and touring records. |
| **22** | `app/settings/index.tsx` | `/settings` | 🟢 **FUNCTIONAL** | `appStore`, `authStore` | PreferenceGroup, UnitToggle, LogoutButton | Metric/Imperial units toggle, GPS accuracy settings, offline cache size, privacy preferences, and secure logout. |
| **23** | `app/onboarding/index.tsx` | `/onboarding` | 🟢 **FUNCTIONAL** | `AsyncStorage` | CarouselSlide, PermissionExplainer, GetStartedBtn | High-impact 3-slide visual onboarding explaining Group Radar, Intercom, and Route Planning with permission rationale. |

---

## 3. UI Redesign & Standard Components Requirements

To fulfill the **Adventure Cockpit** design philosophy, every screen adheres to the unified design tokens in `src/theme/`:
- **Surface Elevation:** Deep Obsidian `#080A0F` base, `#121722` card surface, `#1A2234` elevated card.
- **Accents:** Racing Orange `#FF6B00` (Primary CTA), Telemetry Cyan `#00E5FF` (GPS/Radar), Leader Gold `#FFB020` (Organizer/Admin).
- **Typography:** High-contrast geometric weights (`900` for telemetry numbers, `700` for headers, `500` for body).
- **Accessible Touch Targets:** Minimum $48 \times 48\text{px}$ touch targets across all buttons and map markers for gloved-hand usability.
