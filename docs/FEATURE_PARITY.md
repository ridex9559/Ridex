# RIDEX — FEATURE PARITY & EXPO MIGRATION AUDIT

**Document Identifier:** `RIDEX-ENG-DOC-014`  
**Date:** October 2026  
**Status:** ACTIVE AUDIT & RESTORATION ROADMAP  
**Reference App:** React Native + Expo (`d:/RideX/ridex-mobile`)  
**Target Web App:** React 19 + TypeScript + Vite (`d:/RideX/ridex-web`)  

---

## 1. Executive Summary & Audit Scope

This document provides a screen-by-screen, service-by-service comparison between the authoritative React Native + Expo reference application (`ridex-mobile`) and the standalone mobile-first web application (`ridex-web`).

The primary purpose is to:
1. Identify all screens, features, data models, and backend contracts in the original Expo app.
2. Catalog the current web implementation state (Present, Partial, Missing, or Degraded).
3. Establish a prioritized, non-destructive restoration plan that brings full feature parity, rich dark-cockpit aesthetics, and garage-first onboarding to the web application.

---

## 2. Screen-by-Screen Parity Matrix

| Expo Screen (`ridex-mobile/app/`) | Web Equivalent (`ridex-web/src/pages/`) | Status | Parity Assessment & Action Required |
| :--- | :--- | :--- | :--- |
| **`index.tsx`** (Startup / Root) | **`LandingPage.tsx`** | ✅ **Complete** | Cinematic startup screen with official RIDEX helmet-and-mountain logo, "Get Started", Sign In, and auto-redirect to `/garage` for authenticated riders. |
| **`auth/login.tsx`** | **`LoginPage.tsx`** | ✅ **Complete** | Supabase Auth login, session restore, 16px touch inputs, auto-redirect. Needs post-login destination set to `/garage`. |
| **`auth/signup.tsx`** | **`RegisterPage.tsx`** | ✅ **Complete** | Full registration with profile generation. Needs post-registration destination set to `/garage`. |
| **`(tabs)/garage.tsx`** | **`GaragePage.tsx`** | 🟡 **Needs Enhancement** | Currently simple cards. Needs: Garage-first onboarding flow with "Add My Motorcycle" vs "I Don't Have a Bike" paths, rich specs grid (displacement, tank, mileage, odometer), and active bike selection. |
| **`garage/add-bike.tsx`** | **`GaragePage.tsx` (Add Modal / View)** | 🟡 **Needs Enhancement** | Brand picker chips (Royal Enfield, KTM, BMW, etc.), category picker (ADVENTURE, TOURING, SPORT, etc.), tank capacity, mileage, and registration number. |
| **`garage/[id].tsx`** | **`GaragePage.tsx` (Details / Edit)** | 🟡 **Partial** | Edit motorcycle specs, delete, or change primary machine. |
| **`(tabs)/home.tsx`** | **`DashboardPage.tsx`** | 🟡 **Partial** | Has tour list and quick actions. Needs rider stats summary (tours count, distance, quick bike widget, weather preview). |
| **`rides/create.tsx`** | **`HostRidePage.tsx`** | ✅ **Complete** | Multi-stop routing with origin, destination, 3+ checkpoints, distance calculation, unique `RIDEX-XXXXX` Ride ID generation. |
| **`rides/created-success.tsx`** | **`HostRidePage.tsx` (Step 4 Modal)** | ✅ **Complete** | Shows generated Ride ID with 1-click clipboard copy and direct link to ride overview. |
| **`rides/[id].tsx`** | **`RideDetailsPage.tsx`** | ✅ **Complete** | Leaflet route preview, waypoint order sequence, participant approval/rejection, start tracking CTA, and direct Safety Center navigation. |
| **`(tabs)/ride.tsx` & `rides/live/[id].tsx`** | **`LiveRideCockpitPage.tsx`** | ✅ **Complete** | Fullscreen radar map (zero-watermark OSM dark), HUD speedometer, heading, cluster spread, geodesic hysteresis alerts, 2-step SOS modal, Safety Center link. |
| **`safety/` (Safety Center)** | **`SafetyCenterPage.tsx`** | ✅ **Complete** | Tracking telemetry, GPS freshness, geodesic separation status, active SOS resolution, emergency dial links (112, 108), PTT walkie-talkie audio. |
| **`community/` & `(tabs)/community.tsx`** | **`CommunityPage.tsx`** | ✅ **Complete** | Tabbed touring feed, motorcycle squad chapters, and verified rider achievements from authentic ride logs. |
| **`rides/history.tsx` & `summary.tsx`** | **`RideHistoryPage.tsx`** | ✅ **Complete** | Full tour history logbook, filterable (Completed, Active, Hosted as Captain), planned vs recorded km, genuine aggregate statistics. |
| **`(tabs)/profile.tsx` & `settings/index.tsx`** | **`ProfilePage.tsx`** | ✅ **Complete** | Authenticated rider credentials, callsign, bio, primary motorcycle telemetry, verified tour distance stats, and in-place profile editor. |
| **`notifications/`** | **`NotificationCenterPage.tsx`** | ✅ **Complete** | In-app notification center with real-time Supabase subscription (`postgres_changes`), unread counter badge, mark-read actions, and honest browser delivery notes. |
| **`auth/forgot-password.tsx`** | Missing | 🟡 **Low Priority** | Supabase Auth password reset request. |

---

## 3. Data Models & Backend Contracts

### 3.1. Motorcycles Table (`public.motorcycles`)
```sql
CREATE TABLE public.motorcycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  manufacturer TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL DEFAULT 2024,
  color TEXT DEFAULT 'Black',
  engine_cc INTEGER DEFAULT 450,
  displacement_cc INTEGER DEFAULT 450,
  registration_number TEXT,
  fuel_tank_capacity_l NUMERIC(5,2) DEFAULT 15.0,
  avg_mileage_kmpl NUMERIC(5,2) DEFAULT 25.0,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  image_url TEXT,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 3.2. Rider Onboarding Persistence ("I Don't Have a Bike")
To persist the "I Don't Have a Bike" choice without altering the database schema:
1. **Primary Persistence:** Stored in Supabase Auth `raw_user_meta_data` via `supabase.auth.updateUser({ data: { has_bike: false, onboarding_choice: 'no_bike' } })`.
2. **Local Client Fallback:** Synced to `localStorage.getItem('ridex_onboarding_' + userId)` for zero-latency instant rendering on page refresh.
3. **Behavioral Contract:**
   - If user has $\ge 1$ motorcycles in `public.motorcycles` $\rightarrow$ Show full garage with saved bike(s).
   - If user has $0$ motorcycles and `onboarding_choice === 'no_bike'` $\rightarrow$ Show garage in empty/non-owner state ("Exploring as Pillion / Navigator"), allowing bike addition at any time.
   - If user has $0$ motorcycles and `!onboarding_choice` $\rightarrow$ Display the interactive Onboarding Choice Card ("Add My Motorcycle" vs "I Don't Have a Bike").

---

## 4. UI/UX Analysis & "Blank Black" Elimination

### Why previous screens appeared "mostly blank black":
1. **Excessive Empty Space:** When a new user logged in with 0 motorcycles or 0 rides, previous views rendered a small text snippet in the center with vast margins of `#080A0F`.
2. **Lack of Contrast Surfaces:** Missing elevated card backgrounds (`#121722`, `#1A2234`) and visual telemetry cards.
3. **Missing Quick Actions & Telemetry Gauges:** The mobile app features rich stat badges, brand chips, category chips, and odometer blocks that make the screen feel alive.

### Visual Enhancement System:
- **Card Surfaces:** Styled with obsidian glassmorphic gradient `linear-gradient(180deg, rgba(26, 34, 52, 0.8) 0%, rgba(18, 23, 34, 0.95) 100%)`.
- **Telemetry Indicators:** Cyan (`#00E5FF`) for radar & navigation, Racing Orange (`#FF6B00`) for primary brand actions, Gold (`#FFB020`) for fuel tank specs.
- **Brand Consistency:** Official RIDEX helmet-and-mountain logo integrated in headers, modals, and empty states.

---

## 5. Prioritized Restoration Plan

1. **Phase 1 — Post-Login Routing & Session Handshake:**
   - Update `LoginPage.tsx`, `RegisterPage.tsx`, and `LandingPage.tsx` so successful authentication immediately directs to `/garage`.
   - Update `BottomNav.tsx` order: Garage, Rides, Host Ride, Connect, Profile.

2. **Phase 2 — Garage Onboarding & "No Bike" State:**
   - Implement the interactive Onboarding Welcome Banner in `GaragePage.tsx`.
   - Add the "Add My Motorcycle" rich form with popular brand chips and category selector.
   - Add the "I Don't Have a Bike" persistent bypass path.

3. **Phase 3 — Complete Garage Design & Telemetry:**
   - Spec grid: Displacement cc, Fuel tank L, Average Mileage km/L, Calculated Safe Range km.
   - Active bike switcher and soft-delete confirmation.
   - Welcoming empty state for riders who chose "I don't have a bike" with direct CTAs to "Host Ride" and "Browse Tours".

4. **Phase 4 — Dashboard & Explore Tab Restoration:**
   - Restore Discover Rides / Explore search filter.
   - Quick Rider Stats (Total Tours, Active Machine, Safety Status).

5. **Phase 5 — Profile & Settings Parity:**
   - Rider callsign, bio, emergency contact, motorcycle summary.

6. **Phase 6 — Full Verification:**
   - Automated tests for onboarding choices, typecheck, Vitest, and production build.
