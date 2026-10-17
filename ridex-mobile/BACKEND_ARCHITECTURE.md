# 🏍️ RIDEX — Backend & Database Architecture Documentation

## 1. Architectural Philosophy: Local-First, Cloud-Sync Second

RIDEX is architected for extreme reliability during motorcycle touring across high-altitude mountain passes, remote canyons, and areas with intermittent or zero cellular connectivity.

```
+-----------------------------------------------------------------------------------+
|                                  RIDEX CLIENT                                      |
|                                                                                   |
|  [ UI Screens & Modals ]                                                          |
|         |                                                                         |
|         v                                                                         |
|  [ Domain Custom Hooks ] (useRides, useMotorcycles, useCommunity, useOfflineSync) |
|         |                                                                         |
|         v                                                                         |
|  [ Domain Services ] (RideService, MotorcycleService, UserService, etc.)           |
|         |                                                                         |
|         v                                                                         |
|  [ Repository Factory Provider ] (Dynamic switch: Mock vs Supabase)               |
|         |                                                                         |
|         +----------------------------------+----------------------------------+   |
|         |                                  |                                  |   |
|         v                                  v                                  v   |
|  [ Mock Repositories ]           [ Offline Action Queue ]          [ Supabase Repos ]
|  (In-Memory / Local CRUD)        (Guaranteed Persistence)          (PostgreSQL / RLS)
+--------------------------------------------|----------------------------------+---|
                                             | (When Online)                    |
                                             v                                  v
                               +----------------------------------------------------+
                               |                SUPABASE / POSTGRESQL               |
                               |                                                    |
                               |  - PostGIS Spatial Extensions                      |
                               |  - Row Level Security (RLS) on all 16 Tables       |
                               |  - Automated Updated-At Triggers                   |
                               |  - High-Volume Telemetry Ingestion                 |
                               +----------------------------------------------------+
```

---

## 2. Layered Decoupling & Provider Abstraction

RIDEX strictly forbids direct database calls from UI components. The system enforces 5 distinct layers:

1. **Presentation Layer (`app/` & `src/components/`)**:
   - Consumes domain custom hooks.
   - Never references database libraries or SQL queries directly.

2. **Custom Hooks Layer (`src/hooks/`)**:
   - Reactive state management with optimistic UI updates (e.g., likes, group joins).
   - Manages loading, error states, and automatic queue status updates.

3. **Domain Services Layer (`src/services/`)**:
   - Orchestrates multi-entity business workflows (e.g., saving a ride automatically updates motorcycle mileage and recalculates user statistics).

4. **Repository Abstraction Layer (`src/repositories/interfaces/`)**:
   - Interface contracts (`IUserRepository`, `IMotorcycleRepository`, `IRideRepository`, `IRouteRepository`, `IPostRepository`, `ICommentRepository`, `IGroupRepository`, `IAchievementRepository`).
   - Implementation-agnostic data shapes.

5. **Data Mappers Layer (`src/repositories/mappers/`)**:
   - Converts PostgreSQL `snake_case` database schemas to TypeScript `camelCase` domain models.

6. **Storage Providers (`src/repositories/mock/` & `src/repositories/supabase/`)**:
   - **Mock**: Instant out-of-the-box operation with zero external dependencies or API keys.
   - **Supabase**: PostgreSQL backend with automated session persistence via AsyncStorage and JWT-authenticated RPCs.

---

## 3. Database Schema Overview (16 Tables)

| Domain | Table | Purpose | RLS Policy Summary |
| :--- | :--- | :--- | :--- |
| **Auth & User** | `profiles` | User profiles, bio, aggregate ride stats | Public read, Owner write |
| | `user_settings` | Units (km/mi), GPS precision, theme, SOS contacts | Owner read/write only |
| **Garage** | `motorcycles` | Rider digital garage with specs, TPMS, health | Public read, Owner write |
| **Rides & GPS** | `rides` | Logged journeys, stats (distance, duration, lean angle) | Public/Private toggle, Owner write |
| | `ride_locations` | High-frequency GPS breadcrumbs & telemetry | Public/Private inherited from ride, Owner insert |
| **Routes** | `routes` | Curated passes & community routes with waypoints | Public read, Creator write, Admin curate |
| | `route_locations` | Coordinate geometry points for route tracing | Public read, Creator write |
| **Community** | `posts` | Feed posts, captions, ride telemetry links | Public read, Author write |
| | `post_media` | Multi-image attachments | Public read, Author write |
| | `post_likes` | Post likes with duplicate protection | Public read, User write |
| | `comments` | Post discussion comments | Public read, Author write |
| | `follows` | Rider social graph (followers / following) | Public read, User write |
| | `groups` | Regional clubs and riding chapters | Public read, Founder manage |
| | `group_members` | Group membership with role hierarchy | Public read, User join/leave |
| **Gamification** | `achievements` | Badges, criteria, points, unlock thresholds | Public read, Admin manage |
| | `user_achievements`| User milestone progress and unlocks | Public read, Owner/System upsert |

---

## 4. Row Level Security (RLS) & Security Posture

Every table has Row Level Security enabled (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`).

- **Anonymous reads** are permitted for public profiles, curated routes, public rides, and public community posts.
- **Mutations** require `auth.uid() = user_id` verification.
- **Private Rides & Settings** are strictly locked to the owning user (`auth.uid() = user_id`).
- **Telemetry ingestion** verifies the authenticated user owns the parent ride before bulk inserting location points.

---

## 5. Offline Resiliency & Data Sync Engine

1. When offline, all mutating operations are enqueued in `OfflineQueue` with unique IDs, action types, and serialized payloads.
2. `NetworkService` detects connectivity changes across Web and Native.
3. Upon network reconnection, `SyncService` drains the queue, executing each action against the active repository.
4. If an action fails due to a server constraint, it increments `retryCount` and logs the error without blocking subsequent queued items.
