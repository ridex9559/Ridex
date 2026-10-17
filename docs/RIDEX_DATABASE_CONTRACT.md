# RIDEX V3 — DATABASE CONTRACT & SCHEMA SPECIFICATION

**Document Identifier:** `RIDEX-ENG-DOC-004`  
**Version:** `3.0.0-PROD`  
**Date:** September 2026  
**Status:** AUTHORITATIVE DATABASE CONTRACT  
**Author:** RIDEX Senior Database Architect & Supabase Engineer

---

## 1. Core Database Entity Definitions

The authoritative PostgreSQL 15 schema powering RIDEX is documented below. All tables utilize UUID primary keys generated via `gen_random_uuid()` and ISO-8601 UTC timestamps.

### Table 1: `public.profiles`
Stores rider identity, bio, and visual avatar metadata.

| Column Name | Data Type | Constraints | Description |
|:---|:---|:---|:---|
| `id` | `UUID` | `PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE` | Matches Supabase Auth user ID |
| `full_name` | `TEXT` | `NOT NULL DEFAULT 'Rider'` | Rider display name |
| `username` | `TEXT` | `UNIQUE` | Unique rider handle |
| `email` | `TEXT` | `DEFAULT ''` | Contact email |
| `avatar_url` | `TEXT` | `DEFAULT 'https://...'` | Public URL for profile picture |
| `city` | `TEXT` | `DEFAULT 'Pune'` | Home base / city |
| `state` | `TEXT` | `DEFAULT 'Maharashtra'` | State or province |
| `bio` | `TEXT` | `DEFAULT 'Motorcycle enthusiast & group rider.'` | Rider description |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | Creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | Last update timestamp |

---

### Table 2: `public.motorcycles`
Stores personal motorcycle garage information.

| Column Name | Data Type | Constraints | Description |
|:---|:---|:---|:---|
| `id` | `UUID` | `PRIMARY KEY DEFAULT gen_random_uuid()` | Motorcycle entity ID |
| `user_id` | `UUID` | `REFERENCES public.profiles(id) ON DELETE CASCADE` | Owner rider profile ID |
| `manufacturer` | `TEXT` | `NOT NULL DEFAULT 'Yamaha'` | Brand (e.g. KTM, BMW, Triumph, Yamaha) |
| `model` | `TEXT` | `NOT NULL DEFAULT 'MT-03'` | Model name (e.g. Duke 390, Tiger 900) |
| `year` | `INTEGER` | `NOT NULL DEFAULT 2024` | Manufacturing year |
| `color` | `TEXT` | `NOT NULL DEFAULT 'Black'` | Motorcycle color |
| `displacement_cc` | `INTEGER` | `DEFAULT 400` | Engine displacement in cc |
| `registration_number` | `TEXT` | `NULLABLE` | License plate / registration code |
| `fuel_tank_capacity_l` | `NUMERIC(5,2)` | `DEFAULT 15.0` | Total fuel tank volume in liters |
| `avg_mileage_kmpl` | `NUMERIC(5,2)` | `DEFAULT 28.0` | Average fuel efficiency (km/l) |
| `is_primary` | `BOOLEAN` | `NOT NULL DEFAULT false` | Primary ride flag |
| `image_url` | `TEXT` | `NULLABLE` | Photo of motorcycle |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | Record created timestamp |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | Record modified timestamp |

---

### Table 3: `public.rides`
Authoritative motorcycle ride events, route endpoints, and settings.

| Column Name | Data Type | Constraints | Description |
|:---|:---|:---|:---|
| `id` | `UUID` | `PRIMARY KEY DEFAULT gen_random_uuid()` | Unique Ride identifier |
| `organizer_id` | `UUID` | `REFERENCES public.profiles(id) ON DELETE CASCADE` | Host rider profile ID |
| `title` | `TEXT` | `NOT NULL DEFAULT 'Group Ride'` | Ride title / name |
| `description` | `TEXT` | `NULLABLE` | Detailed tour description |
| `join_code` | `VARCHAR(30)` | `UNIQUE` | Unique 8-char squad code (e.g. `RIDEX-7X92K`) |
| `ride_code` | `VARCHAR(30)` | `NULLABLE` | Alias code for join search |
| `status` | `VARCHAR(30)` | `NOT NULL DEFAULT 'published'` | Lifecycle: `draft`, `published`, `active`, `completed`, `cancelled` |
| `visibility` | `VARCHAR(20)` | `NOT NULL DEFAULT 'public'` | `public`, `group_only`, `private` |
| `join_method` | `VARCHAR(30)` | `NOT NULL DEFAULT 'REQUEST_APPROVAL'` | `REQUEST_APPROVAL` or `INSTANT_JOIN` |
| `start_location_name` | `TEXT` | `NOT NULL DEFAULT 'Starting Point'` | Starting address/landmark |
| `start_latitude` | `DOUBLE PRECISION` | `NOT NULL DEFAULT 18.5204` | Start latitude coordinate |
| `start_longitude` | `DOUBLE PRECISION` | `NOT NULL DEFAULT 73.8567` | Start longitude coordinate |
| `destination_name` | `TEXT` | `NOT NULL DEFAULT 'Destination Point'` | Destination landmark |
| `destination_latitude` | `DOUBLE PRECISION` | `NOT NULL DEFAULT 18.7557` | Destination latitude coordinate |
| `destination_longitude` | `DOUBLE PRECISION` | `NOT NULL DEFAULT 73.4091` | Destination longitude coordinate |
| `distance_km` | `NUMERIC(8,2)` | `DEFAULT 0` | Total route distance |
| `estimated_duration` | `INTEGER` | `DEFAULT 0` | Estimated duration in minutes |
| `ride_date` | `DATE` | `DEFAULT CURRENT_DATE` | Scheduled tour date |
| `meetup_time` | `VARCHAR(20)` | `DEFAULT '05:30 AM'` | Rider rendezvous time |
| `departure_time` | `VARCHAR(20)` | `DEFAULT '06:00 AM'` | Kickstands-up departure time |
| `max_riders` | `INTEGER` | `DEFAULT 20` | Maximum participant capacity |
| `ride_type` | `VARCHAR(50)` | `DEFAULT 'WEEKEND'` | `WEEKEND`, `TOURING`, `ADVENTURE`, `TWISTIES` |
| `difficulty` | `VARCHAR(30)` | `DEFAULT 'MODERATE'` | `EASY`, `MODERATE`, `ADVANCED`, `EXPERT` |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | Creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | Last modification timestamp |

---

### Table 4: `public.ride_participants`
Participant roster, approval status, and squad roles.

| Column Name | Data Type | Constraints | Description |
|:---|:---|:---|:---|
| `id` | `UUID` | `PRIMARY KEY DEFAULT gen_random_uuid()` | Participation record ID |
| `ride_id` | `UUID` | `NOT NULL REFERENCES public.rides(id) ON DELETE CASCADE` | Associated ride event |
| `user_id` | `UUID` | `NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE` | Participant rider profile |
| `role` | `VARCHAR(20)` | `NOT NULL DEFAULT 'rider'` | `organizer`, `leader`, `road_captain`, `sweeper`, `rider` |
| `status` | `VARCHAR(20)` | `NOT NULL DEFAULT 'pending'` | `pending`, `approved`, `rejected`, `left`, `removed` |
| `joined_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | Initial join request time |
| `approved_at` | `TIMESTAMPTZ` | `NULLABLE` | Organizer approval timestamp |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | Status update timestamp |

---

### Table 5: `public.ride_locations`
Realtime GPS position beacons per user per active ride.

| Column Name | Data Type | Constraints | Description |
|:---|:---|:---|:---|
| `id` | `UUID` | `PRIMARY KEY DEFAULT gen_random_uuid()` | Location record ID |
| `ride_id` | `UUID` | `NOT NULL REFERENCES public.rides(id) ON DELETE CASCADE` | Active ride event ID |
| `user_id` | `UUID` | `NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE` | Broadcasting rider ID |
| `latitude` | `DOUBLE PRECISION` | `NOT NULL` | Latitude coordinate |
| `longitude` | `DOUBLE PRECISION` | `NOT NULL` | Longitude coordinate |
| `heading` | `DOUBLE PRECISION` | `DEFAULT 0` | Compass heading degrees ($0-360^\circ$) |
| `speed` | `DOUBLE PRECISION` | `DEFAULT 0` | Current speed in km/h |
| `accuracy` | `DOUBLE PRECISION` | `DEFAULT 0` | GPS horizontal accuracy (meters) |
| `is_sharing` | `BOOLEAN` | `NOT NULL DEFAULT true` | Active broadcasting toggle |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | Beacon timestamp |

---

### Table 6: `public.ride_checkpoints`
Intermediate route waypoints, stops, scenic viewpoints, and fuel stops.

| Column Name | Data Type | Constraints | Description |
|:---|:---|:---|:---|
| `id` | `UUID` | `PRIMARY KEY DEFAULT gen_random_uuid()` | Checkpoint ID |
| `ride_id` | `UUID` | `NOT NULL REFERENCES public.rides(id) ON DELETE CASCADE` | Associated ride event |
| `name` | `TEXT` | `NOT NULL` | Checkpoint name (e.g. "Lonavala Viewpoint") |
| `type` | `TEXT` | `NOT NULL DEFAULT 'REGROUP'` | `START`, `BREAKFAST`, `FUEL`, `VIEWPOINT`, `REGROUP`, `DESTINATION` |
| `latitude` | `DOUBLE PRECISION` | `NOT NULL` | Latitude coordinate |
| `longitude` | `DOUBLE PRECISION` | `NOT NULL` | Longitude coordinate |
| `order_index` | `INTEGER` | `NOT NULL DEFAULT 0` | Strict sequence index ($0, 1, 2, \dots$) |
| `estimated_stop_minutes` | `INTEGER` | `DEFAULT 15` | Planned duration of stop |
| `is_reached` | `BOOLEAN` | `DEFAULT false` | Reached status |
| `reached_at` | `TIMESTAMPTZ` | `NULLABLE` | Arrival timestamp |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | Creation timestamp |

---

### Table 7: `public.ride_sos_alerts`
Emergency assistance alerts with GPS coordinates and issue classification.

| Column Name | Data Type | Constraints | Description |
|:---|:---|:---|:---|
| `id` | `UUID` | `PRIMARY KEY DEFAULT gen_random_uuid()` | Alert ID |
| `session_id` | `UUID` | `NULLABLE` | Live session ID |
| `ride_id` | `UUID` | `NOT NULL REFERENCES public.rides(id) ON DELETE CASCADE` | Ride ID |
| `user_id` | `UUID` | `NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE` | Distressed rider ID |
| `issue_type` | `TEXT` | `NOT NULL` | `FLAT_TYRE`, `MECHANICAL`, `OUT_OF_FUEL`, `MEDICAL`, `LOST` |
| `latitude` | `DOUBLE PRECISION` | `NOT NULL` | Incident latitude coordinate |
| `longitude` | `DOUBLE PRECISION` | `NOT NULL` | Incident longitude coordinate |
| `note` | `TEXT` | `NULLABLE` | Additional rider comments |
| `status` | `TEXT` | `NOT NULL DEFAULT 'ACTIVE'` | `ACTIVE`, `RESOLVED`, `CANCELLED` |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | Trigger timestamp |
| `resolved_at` | `TIMESTAMPTZ` | `NULLABLE` | Resolution timestamp |
