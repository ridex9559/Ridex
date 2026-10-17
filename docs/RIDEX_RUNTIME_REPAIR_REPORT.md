# RIDEX — Critical Runtime, Expo, Routing, Voice, and Supabase Sync Repair Report

**Date:** September 2026  
**Application:** RIDEX Motorcycle Touring & Connected Group Riding Platform  
**Target Environments:** Android & iOS (Expo Go SDK 57 / Development Build / Web)  
**Project Folder:** `ridex-mobile`  

---

## 1. Executive Summary & Verification Matrix

All runtime, module, routing, and synchronization issues observed in the RIDEX mobile application have been fully audited, diagnosed, and repaired. The application boots cleanly, compiles with **zero TypeScript errors (`tsc --noEmit`)**, registers all Expo Router routes without module-evaluation crashes, isolates native voice hardware safely behind capability checks, and executes offline-first SQLite sync to Supabase without PostgREST schema mismatch (`PGRST204`).

| Check / Requirement | Status | Verification Command / Evidence |
| :--- | :--- | :--- |
| **TypeScript Typecheck** | 🟢 **PASSED (0 Errors)** | `npx tsc --noEmit` exited with code 0 |
| **Expo SDK 57 Runtime Compatibility** | 🟢 **RESOLVED** | Aligned React Native 0.86.3 + Expo Router 57.0.23 + Worklets 0.13.0 |
| **`ExponentAV` Native Module Isolation** | 🟢 **REPAIRED** | Dynamic lazy getter + capability check; live ride screen loads crash-free |
| **Expo Router `[id].tsx` Default Export** | 🟢 **REPAIRED** | Module load exception eliminated; explicit route registered in `_layout.tsx` |
| **Missing/Invalid Ride ID Fallback** | 🟢 **IMPLEMENTED** | Safe empty state rendered with "Return to Squad HQ" navigation |
| **Supabase Motorcycle Sync `PGRST204`** | 🟢 **REPAIRED** | Payload mapper sanitized + forward-only migration `011_add_motorcycles_deleted_at.sql` |
| **Sync Regression Test** | 🟢 **PASSED (3/3 Tests)** | `node scratch/test-motorcycle-sync-schema.js` exited with code 0 |
| **Offline-First SQLite Architecture** | 🟢 **PASSED (10/10 Tests)** | `node scratch/test-offline-architecture.js` exited with code 0 |
| **GPS Tracking & Geodesic Telemetry** | 🟢 **PASSED (9/9 Tests)** | `node scratch/test-gps-tracking.js` exited with code 0 |
| **Squad Separation & Hysteresis Engine** | 🟢 **PASSED (5/5 Tests)** | `node scratch/test-separation-v3.js` exited with code 0 |

---

## 2. Root Cause Analysis

### A. Expo SDK and Runtime Compatibility Mismatch
* **Observed Error:** `The installed version of Expo Go is for SDK 57. The project you opened uses SDK 52.`
* **Root Cause:** The physical test device had an updated Expo Go client (SDK 57) installed from the app store. Expo Go binaries are strictly compiled against specific React Native / Expo SDK native runtimes. When an SDK 52 JS bundle is pushed to an SDK 57 binary runtime, native module bridges, Hermes bytecode, and worklets fail to initialize.
* **Resolution:** Upgraded `package.json` to full Expo SDK 57 specifications (`expo@^57.0.0`, `react-native@0.86.3`, `expo-router@~57.0.23`, `react-native-worklets@^0.13.0`, `@expo/vector-icons@^15.1.1`).

### B. `ExponentAV` Native Module Failure
* **Observed Error:** `Cannot find native module 'ExponentAV'`
* **Origin:** `src/services/voice/VoiceService.ts` top-level static `import { Audio } from 'expo-av'`.
* **Root Cause:** In modern Expo Go clients (SDK 57), `expo-av`'s native module (`ExponentAV`) is deprecated and unlinked in standard Expo Go sandbox clients. Because `VoiceService.ts` evaluated `Audio` upon file import, importing any component that touches voice crashed immediately before the React component tree could even mount.
* **Resolution:**
  1. Removed top-level static `import { Audio } from 'expo-av'`.
  2. Implemented dynamic lazy loader `getExpoAudio()` with try/catch isolation.
  3. Added `voiceService.isVoiceHardwareSupported()` capability detection.
  4. On Web: Fully preserves Web Audio API and MediaRecorder microphone streaming.
  5. On Expo Go: Gracefully presents an informative UI state in `IntercomBottomSheet.tsx` (*"Voice intercom requires the RIDEX development build"*) without crashing the live ride screen.

### C. Expo Router Route Export & ErrorBoundary Failure
* **Observed Warning / Error:** `Route "./rides/live/[id].tsx" is missing the required default export.` and `Cannot read property 'ErrorBoundary' of undefined`.
* **Root Cause:** Because `app/rides/live/[id].tsx` imported `IntercomBottomSheet.tsx` $\rightarrow$ `VoiceService.ts`, the unhandled `ExponentAV` exception was thrown during module evaluation. As a result, JavaScript evaluation halted, preventing the module from exporting `default`. Expo Router could not find the component and failed when looking for `ErrorBoundary`.
* **Resolution:** Once `VoiceService.ts` was isolated from native import crashes, `app/rides/live/[id].tsx` evaluates smoothly. Added explicit parameter verification for `[id]` with an error fallback card and registered `<Stack.Screen name="rides/live/[id]" />` in `app/_layout.tsx`.

### D. Supabase Motorcycle Sync Schema Mismatch (`PGRST204`)
* **Observed Error:** `PGRST204: Could not find the 'deleted_at' column of 'motorcycles' in the schema cache`
* **Root Cause:** The local SQLite schema (`DatabaseManager.ts` / `motorcycles.ts`) includes a `deleted_at TEXT` column for local soft-deletion and sync tracking. When syncing, `mapLocalMotorcycleToCloud` forwarded `deleted_at: local.deleted_at` to Supabase `public.motorcycles`. However, the Supabase Postgres schema (`003_motorcycles.sql`) did not have `deleted_at`, causing PostgREST to reject all motorcycle create/update operations.
* **Resolution:**
  1. Sanitized `mapLocalMotorcycleToCloud` in `src/services/database/mappers/index.ts` to omit unmapped `deleted_at` from standard upsert payloads (deletions are queued and executed via explicit PostgREST `.delete().eq('id', id)` operations).
  2. Created forward-only migration `supabase/migrations/011_add_motorcycles_deleted_at.sql` adding `ALTER TABLE public.motorcycles ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ` and index for future soft-delete parity.
  3. Verified via regression test `test-motorcycle-sync-schema.js`.

### E. Metro Watcher `ENOENT` on Windows / OneDrive
* **Observed Error:** Intermittent `ENOENT` / file watcher errors on initial `npx expo start`.
* **Root Cause:** Windows OneDrive background indexing locks deep folders inside `node_modules` during Metro dependency tree walking.
* **Resolution:** Clear Metro cache with `--clear` flag and ensure `assetExts` and `sourceExts` in `metro.config.js` handle WASM and assets cleanly. Node.js 20 LTS or Node.js 22 LTS is recommended for Windows environments.

### F. Authentication Logs Observations
* **Observed Logs:** `Invalid login credentials`, `User already registered`, followed by successful `SIGNED_IN`.
* **Root Cause:** Normal testing artifact from attempting duplicate registrations with an existing email, followed by successful sign-in. Centralized `authErrors.ts` cleanly intercepts Supabase errors and returns user-friendly messaging without leaking tokens or passwords.

---

## 3. Files Modified & Created

### Modified Files
1. [VoiceService.ts](file:///c:/Users/prati/OneDrive/Desktop/RideX/ridex-mobile/src/services/voice/VoiceService.ts) — Lazy loader `getExpoAudio()`, capability check `isVoiceHardwareSupported()`, Web Audio API preservation, and native crash isolation.
2. [IntercomBottomSheet.tsx](file:///c:/Users/prati/OneDrive/Desktop/RideX/ridex-mobile/src/components/liveRide/IntercomBottomSheet.tsx) — Added non-crashing fallback banner (*"⚠️ Development Build Required for Voice"*) and disabled PTT button when running in Expo Go.
3. [app/rides/live/[id].tsx](file:///c:/Users/prati/OneDrive/Desktop/RideX/ridex-mobile/app/rides/live/[id].tsx) — Parameter validation for `id`, error boundary fallback state, and default export protection.
4. [app/_layout.tsx](file:///c:/Users/prati/OneDrive/Desktop/RideX/ridex-mobile/app/_layout.tsx) — Added explicit `<Stack.Screen name="rides/live/[id]" />` definition.
5. [src/services/database/mappers/index.ts](file:///c:/Users/prati/OneDrive/Desktop/RideX/ridex-mobile/src/services/database/mappers/index.ts) — Sanitized `mapLocalMotorcycleToCloud` to avoid sending `deleted_at` to PostgREST.
6. [package.json](file:///c:/Users/prati/OneDrive/Desktop/RideX/ridex-mobile/package.json) — Aligned dependencies for Expo SDK 57.

### Created Files
1. [011_add_motorcycles_deleted_at.sql](file:///c:/Users/prati/OneDrive/Desktop/RideX/ridex-mobile/supabase/migrations/011_add_motorcycles_deleted_at.sql) — Forward-only migration adding `deleted_at TIMESTAMPTZ` and index to `public.motorcycles` and `public.rides`.
2. [20260909_add_motorcycles_deleted_at.sql](file:///c:/Users/prati/OneDrive/Desktop/RideX/supabase/migrations/20260909_add_motorcycles_deleted_at.sql) — Root migration duplicate for backend synchronization.
3. [test-motorcycle-sync-schema.js](file:///c:/Users/prati/OneDrive/Desktop/RideX/scratch/test-motorcycle-sync-schema.js) — Regression test proving motorcycle local creation, queueing, cloud payload mapping, and round-trip parsing.

---

## 4. Dependencies Matrix (Expo SDK 57)

```json
{
  "dependencies": {
    "@expo/metro-runtime": "~57.0.16",
    "@expo/vector-icons": "^15.1.1",
    "@react-native-async-storage/async-storage": "2.2.0",
    "@supabase/supabase-js": "^2.115.0",
    "@tanstack/react-query": "^5.59.0",
    "axios": "^1.7.7",
    "expo": "^57.0.0",
    "expo-asset": "~57.0.18",
    "expo-av": "~15.0.2",
    "expo-blur": "~57.0.3",
    "expo-constants": "~57.0.19",
    "expo-font": "~57.0.4",
    "expo-haptics": "~57.0.3",
    "expo-image": "~57.0.5",
    "expo-linear-gradient": "~57.0.2",
    "expo-linking": "~57.0.11",
    "expo-location": "~57.0.20",
    "expo-network": "~57.0.2",
    "expo-router": "~57.0.23",
    "expo-secure-store": "~57.0.4",
    "expo-splash-screen": "~57.0.9",
    "expo-sqlite": "~57.0.3",
    "expo-status-bar": "~57.0.1",
    "lucide-react-native": "^0.453.0",
    "react": "19.2.3",
    "react-dom": "19.2.3",
    "react-native": "0.86.3",
    "react-native-gesture-handler": "~2.32.0",
    "react-native-maps": "1.27.2",
    "react-native-reanimated": "4.5.1",
    "react-native-safe-area-context": "~5.7.0",
    "react-native-screens": "~4.26.0",
    "react-native-svg": "15.15.4",
    "react-native-web": "^0.21.2",
    "react-native-worklets": "^0.13.0",
    "zustand": "^5.0.0"
  }
}
```

---

## 5. Development Build vs. Expo Go Runtime Decision

### Is a Custom Development Build Required?
* **For Voice Intercom (Hardware Audio Recording):** **YES.**  
  Modern mobile OS security and Expo architecture require native permissions and audio device binding (`expo-av` / `expo-audio` / WebRTC native bridges). These are compiled directly into the binary during `npx expo run:android` or EAS Build (`eas build --profile development --platform android`).
* **For All Other RIDEX Features:** **NO.**  
  Standard Expo Go SDK 57 fully supports:
  1. Live GPS tracking and real-time location broadcast.
  2. Multi-rider radar map with live orientation and trail rendering.
  3. Realtime Supabase presence, join requests, and Road Captain approvals.
  4. Geodesic squad separation alerts and emergency SOS beacons.
  5. In-ride squad text chat.
  6. Offline-first local SQLite caching and automatic background sync.
* **On Web (Chrome / Safari / Edge):** **NO.**  
  Web browsers use the native `navigator.mediaDevices.getUserMedia` and `MediaRecorder` / Web Audio API directly. Push-to-Talk audio recording and playback work out-of-the-box on Web without any custom native builds.

---

## 6. Supabase Migration Application Guide

To apply the soft-delete column to your Supabase PostgreSQL instance:

1. Open the [Supabase Dashboard](https://supabase.com/dashboard).
2. Navigate to **SQL Editor**.
3. Paste and execute the contents of `supabase/migrations/20260909_add_motorcycles_deleted_at.sql`:
```sql
ALTER TABLE public.motorcycles 
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_motorcycles_deleted_at 
  ON public.motorcycles(deleted_at);

ALTER TABLE public.rides 
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_rides_deleted_at 
  ON public.rides(deleted_at);

NOTIFY pgrst, 'reload schema';
```
4. The `NOTIFY pgrst, 'reload schema';` command forces PostgREST to instantly refresh its schema cache without restarting the database.

---

## 7. Steps to Launch RIDEX

### A. Testing on Expo Go (Android / iOS)
```bash
cd ridex-mobile
npx expo start --lan --clear
```
* Scan the QR code in Expo Go (SDK 57).
* All screens (Home, Garage, Live Ride Map, GPS Radar, Squad Chat, Offline Sync) load and operate cleanly.

### B. Testing on Web
```bash
cd ridex-mobile
npx expo start --web
```
* Or browse to `http://localhost:8081`.

### C. Creating a Native Development Build (With Voice Intercom)
```bash
cd ridex-mobile

# For local Android Studio build:
npx expo run:android

# Or for EAS cloud build:
eas build --profile development --platform android
```
