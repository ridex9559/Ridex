# 🏍️ RIDEX — Offline-First SQLite Architecture & Synchronization Engine

> **Version:** 1.0.0  
> **Status:** Production-Ready  
> **Philosophy:** *Local First. Cloud Second.*

---

## 1. Executive Summary & Core Philosophy

RIDEX follows a strict **LOCAL FIRST, CLOUD SECOND** mobile data philosophy:
* The mobile device is the primary operational store for telemetry, rides, motorcycle configurations, and user preferences.
* The cloud (Supabase PostgreSQL) is an eventual consistency, backup, multi-device synchronization, and community sharing layer.
* Normal user operations (starting rides, recording GPS telemetry points, modifying garage bikes, updating profile data) **never block or wait for network connectivity or server responses**.
* Writes complete instantly in local SQLite, persist safely, and queue deterministic synchronization operations that sync automatically when connectivity is available.

```text
┌──────────────────────────────────────────────────────────────┐
│                    RIDEX LOCAL-FIRST FLOW                    │
└──────────────────────────────────────────────────────────────┘
                          USER ACTION
                               ↓
                 LOCAL SQLITE DATABASE (ridex.db)
                               ↓
                        INSTANT UI UPDATE (0ms)
                               ↓
                    ENQUEUE SYNC OPERATION
                               ↓
                TWO-WAY SYNC (AUTOMATIC / RETRY)
                               ↓
                 REMOTE CLOUD STORE (Supabase)
```

---

## 2. Technology Stack & Database Architecture

* **Database Engine:** `expo-sqlite` (SDK 52 asynchronous API: `openDatabaseAsync`, `execAsync`, `runAsync`, `getAllAsync`, `getFirstAsync`, `withTransactionAsync`).
* **Database File:** `ridex.db` (Single centralized database instance with WAL journal mode and foreign key enforcement enabled).
* **Cross-Platform Compatibility:** Web fallback database adapter ensuring web development builds and mobile devices run unified data code with zero runtime exceptions.
* **Network Detection:** `expo-network` + web navigator event listeners for seamless online/offline event propagation.
* **State Management:** Zustand reactive stores (`useSyncStatusStore`, `useAuthStore`, `useBikeStore`) + TanStack Query async state caching.
* **Client Identifiers:** RFC4122 v4 cryptographically secure client-generated UUIDs before synchronization, preventing race conditions or duplicate entities on retries.

---

## 3. Database Schema & Tables

### 3.1. `app_metadata`
Stores internal database state and schema versioning.
```sql
CREATE TABLE IF NOT EXISTS app_metadata (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

### 3.2. `profiles`
Cached profile information for authenticated riders.
```sql
CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY NOT NULL,
  username TEXT NOT NULL,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  city TEXT,
  country TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  synced_at TEXT,
  sync_status TEXT NOT NULL DEFAULT 'LOCAL' CHECK (sync_status IN ('LOCAL', 'PENDING', 'SYNCING', 'SYNCED', 'FAILED'))
);
```

### 3.3. `motorcycles`
Local digital garage and motorcycle fleet.
```sql
CREATE TABLE IF NOT EXISTS motorcycles (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  manufacturer TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  displacement_cc INTEGER NOT NULL DEFAULT 500,
  horsepower INTEGER,
  registration_number TEXT,
  odometer_km REAL NOT NULL DEFAULT 0.0,
  category TEXT NOT NULL DEFAULT 'ADVENTURE',
  nickname TEXT,
  image_url TEXT,
  is_primary INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at TEXT,
  sync_status TEXT NOT NULL DEFAULT 'LOCAL' CHECK (sync_status IN ('LOCAL', 'PENDING', 'SYNCING', 'SYNCED', 'FAILED')),
  synced_at TEXT
);
```

### 3.4. `rides`
Primary operational storage for all personal ride logs and metrics.
```sql
CREATE TABLE IF NOT EXISTS rides (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  motorcycle_id TEXT,
  name TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT,
  distance_meters REAL NOT NULL DEFAULT 0.0,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  average_speed REAL NOT NULL DEFAULT 0.0,
  max_speed REAL NOT NULL DEFAULT 0.0,
  elevation_gain REAL NOT NULL DEFAULT 0.0,
  max_lean_angle REAL,
  start_latitude REAL,
  start_longitude REAL,
  end_latitude REAL,
  end_longitude REAL,
  status TEXT NOT NULL DEFAULT 'COMPLETED' CHECK (status IN ('IN_PROGRESS', 'COMPLETED', 'PAUSED')),
  visibility TEXT NOT NULL DEFAULT 'PUBLIC' CHECK (visibility IN ('PUBLIC', 'PRIVATE', 'UNLISTED')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at TEXT,
  sync_status TEXT NOT NULL DEFAULT 'LOCAL' CHECK (sync_status IN ('LOCAL', 'PENDING', 'SYNCING', 'SYNCED', 'FAILED')),
  synced_at TEXT,
  version INTEGER NOT NULL DEFAULT 1
);
```

### 3.5. `ride_locations`
GPS telemetry coordinate points recorded during active rides.
```sql
CREATE TABLE IF NOT EXISTS ride_locations (
  id TEXT PRIMARY KEY NOT NULL,
  ride_id TEXT NOT NULL,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  altitude REAL,
  speed REAL,
  accuracy REAL,
  heading REAL,
  recorded_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  sync_status TEXT NOT NULL DEFAULT 'LOCAL' CHECK (sync_status IN ('LOCAL', 'PENDING', 'SYNCING', 'SYNCED', 'FAILED'))
);
```

### 3.6. `sync_queue`
Guaranteed mutation queue for pending local operations.
```sql
CREATE TABLE IF NOT EXISTS sync_queue (
  id TEXT PRIMARY KEY NOT NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('profile', 'motorcycle', 'ride', 'ride_location')),
  entity_id TEXT NOT NULL,
  operation TEXT NOT NULL CHECK (operation IN ('CREATE', 'UPDATE', 'DELETE')),
  payload TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SYNCING', 'COMPLETED', 'FAILED')),
  retry_count INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_attempt_at TEXT
);
```

### 3.7. `sync_metadata`
Tracks incremental synchronization timestamps and cursor offsets.
```sql
CREATE TABLE IF NOT EXISTS sync_metadata (
  entity_type TEXT PRIMARY KEY NOT NULL,
  last_sync_at TEXT,
  last_successful_sync_at TEXT,
  sync_cursor TEXT
);
```

### 3.8. Performance Indexes
Targeted indexing designed for rapid queries and user isolation:
* `idx_rides_user_id` on `rides(user_id)`
* `idx_rides_start_time` on `rides(start_time DESC)`
* `idx_rides_updated_at` on `rides(updated_at)`
* `idx_rides_sync_status` on `rides(sync_status)`
* `idx_ride_locations_ride_id` on `ride_locations(ride_id)`
* `idx_ride_locations_recorded_at` on `ride_locations(recorded_at ASC)`
* `idx_sync_queue_status` on `sync_queue(status)`
* `idx_sync_queue_created_at` on `sync_queue(created_at ASC)`
* `idx_motorcycles_user_id` on `motorcycles(user_id)`

---

## 4. Deterministic Database Migration System

* Implemented in `DatabaseMigration.ts`.
* Tracks the schema version integer in `app_metadata` (`database_version`).
* Each migration is deterministic, runs in sequential order, and executes exactly once.
* Preserves user data across app updates and version migrations.

---

## 5. Synchronization Engine & Data Flow

### 5.1. Atomic Sync Lock
Only a single synchronization cycle runs at any given moment. Concurrent calls to `syncNow()` immediately return without generating duplicate network requests or race conditions.

### 5.2. Queue Coalescing
Multiple rapid offline updates to the same entity are automatically merged in the local SQLite queue:
* `CREATE` + `UPDATE` $\rightarrow$ `CREATE` (with latest payload)
* `UPDATE` + `UPDATE` $\rightarrow$ `UPDATE` (with latest payload)
* `CREATE` + `DELETE` $\rightarrow$ Operation cancelled and removed (never sent to server)
* `UPDATE` + `DELETE` $\rightarrow$ `DELETE`

### 5.3. Dependency-Ordered Push
Pending mutations are dispatched in strict relational dependency order:
1. `profile`
2. `motorcycle`
3. `ride`
4. `ride_location`

### 5.4. Exponential Backoff & Error Classification
Sync failures are categorized into:
* `NETWORK_ERROR`: Retryable with exponential backoff (1s, 2s, 4s, 8s, 16s with random jitter).
* `AUTH_ERROR`: Non-retryable without session refresh.
* `PERMISSION_ERROR`: Non-retryable without user intervention.
* `SERVER_ERROR`: Retryable with backoff up to 5 attempts before marking as `FAILED`.

Failed operations remain safe and recoverable in SQLite; user data is **never silently deleted**.

---

## 6. Conflict Resolution Strategy

* **Profiles & Motorcycles:** Version and timestamp comparison (`updated_at`). For garage motorcycles, the highest odometer reading is always preserved to avoid odometer rollbacks.
* **Rides:** Version number comparison (`version`) followed by `updated_at`.
* **GPS Telemetry Breadcrumbs (`ride_locations`):** Strictly **APPEND-ORIENTED**. Coordinate points are merged non-destructively by timestamp and GPS coordinates. GPS breadcrumbs are never discarded due to ride version increments.

---

## 7. User Data Isolation & Security

* **User Scoping:** All local queries on `rides` and `motorcycles` filter strictly on `user_id`.
* **Logout Behavior:** On user logout, active sync processes stop, in-memory caches are cleared, and private cached data is inaccessible to subsequent users.
* **No Secrets in SQLite:** No passwords, access tokens, or sensitive API secrets are ever stored in SQLite. Tokens remain secured in encrypted storage.

---

## 8. Reactive UI & Connectivity Indicators

* `SyncStatusBar` widget provides subtle, non-intrusive feedback:
  * **Offline Mode:** Displays amber connectivity badge with offline item count.
  * **Syncing:** Cyan animated spinner showing upload progress.
  * **Failed/Pending:** Tap-to-retry manual sync button.
  * **Synced & Online:** Silent and unobtrusive for a clean cockpit experience.
