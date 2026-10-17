# 🏍️ RIDEX — Group Rides Architecture & Implementation Guide
## Steps 7 & 8: Create, Publish, Discover, & Atomic Join

---

## 1. Architectural Philosophy & Overview
RIDEX connects motorcycle riders worldwide through community squad rides. Unlike basic fitness apps, RIDEX provides a Tesla/Strava/Airbnb inspired experience for group touring, adventures, track days, and weekend twisties.

### Key Capabilities:
- **Multi-step Creation Wizard**: Step-by-step ride definition with interactive map-based waypoint pinning for rendezvous and destination coordinates.
- **Atomic Concurrency Protection**: PostgreSQL stored procedure (`join_ride`) executing row-level locks (`SELECT ... FOR UPDATE`) to prevent oversubscribing squad participant limits.
- **Search & Filter Radar**: Category filtering (`TOURING`, `ADVENTURE`, `MOUNTAIN_PASS`, `HIGHWAY`, `TRACK`, `OFF_ROAD`, `CASUAL`), difficulty ratings (`BEGINNER`, `INTERMEDIATE`, `ADVANCED`, `EXPERT`), and full-text location search.
- **Dual-Mode Exploration**: Seamless segment switcher between Community Squad Rides and Curated Scenic Twisties.

---

## 2. Database Schema & Stored Procedures

### `rides` Table Extension:
```sql
CREATE TABLE IF NOT EXISTS rides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  motorcycle_id UUID REFERENCES motorcycles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'CASUAL',
  difficulty TEXT NOT NULL DEFAULT 'BEGINNER',
  start_location_name TEXT NOT NULL,
  start_latitude DOUBLE PRECISION NOT NULL,
  start_longitude DOUBLE PRECISION NOT NULL,
  destination_name TEXT NOT NULL,
  destination_latitude DOUBLE PRECISION NOT NULL,
  destination_longitude DOUBLE PRECISION NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  estimated_distance_km DOUBLE PRECISION DEFAULT 0.0,
  estimated_duration_minutes INTEGER DEFAULT 0,
  max_participants INTEGER, -- NULL = Unlimited
  visibility TEXT NOT NULL DEFAULT 'PUBLIC',
  status TEXT NOT NULL DEFAULT 'PUBLISHED',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `ride_participants` Table:
```sql
CREATE TABLE IF NOT EXISTS ride_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  motorcycle_id UUID REFERENCES motorcycles(id) ON DELETE SET NULL,
  role TEXT NOT NULL DEFAULT 'PARTICIPANT', -- 'ORGANIZER', 'ROAD_CAPTAIN', 'SWEEPER', 'PARTICIPANT'
  status TEXT NOT NULL DEFAULT 'JOINED', -- 'JOINED', 'LEFT', 'REMOVED'
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(ride_id, user_id)
);
```

### Atomic Join Function (`join_ride`):
```sql
CREATE OR REPLACE FUNCTION join_ride(
  p_ride_id UUID,
  p_user_id UUID,
  p_role TEXT DEFAULT 'PARTICIPANT'
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_max_participants INTEGER;
  v_current_count INTEGER;
  v_participant_id UUID;
BEGIN
  -- 1. Lock ride record to prevent race conditions
  SELECT max_participants INTO v_max_participants
  FROM rides WHERE id = p_ride_id FOR UPDATE;

  -- 2. Count current confirmed participants
  SELECT COUNT(*) INTO v_current_count
  FROM ride_participants WHERE ride_id = p_ride_id AND status = 'JOINED';

  -- 3. Check capacity limit
  IF v_max_participants IS NOT NULL AND v_current_count >= v_max_participants THEN
    RETURN jsonb_build_object('success', false, 'error', 'Ride is already at maximum capacity');
  END IF;

  -- 4. Upsert membership
  INSERT INTO ride_participants (ride_id, user_id, role, status, updated_at)
  VALUES (p_ride_id, p_user_id, p_role, 'JOINED', NOW())
  ON CONFLICT (ride_id, user_id)
  DO UPDATE SET status = 'JOINED', role = p_role, updated_at = NOW()
  RETURNING id INTO v_participant_id;

  RETURN jsonb_build_object('success', true, 'participant_id', v_participant_id);
END;
$$;
```

---

## 3. Client Architecture & Integration

```
app/(tabs)/explore.tsx (Dual Tab Feed)
  ├── useRideDiscovery()
  │     └── RideDiscoveryService.ts
  │           └── SupabaseRideRepository.getUpcomingGroupRides()
  └── RideCard.tsx

app/rides/create.tsx (4-Step Wizard)
  ├── useCreateRide()
  │     ├── LocationPickerModal.tsx -> Interactive Map Pinning
  │     └── RideService.publishRide() -> Enrolls Organizer automatically
  └── RidexMap (Preview Route)

app/rides/[id].tsx (Squad Briefing)
  ├── useRideDetails()
  ├── useJoinRide() -> Calls join_ride / leave_ride RPC
  ├── RideParticipantList.tsx -> Role badges & avatars
  └── Action Footer -> Starts or Enters Live Session
```
