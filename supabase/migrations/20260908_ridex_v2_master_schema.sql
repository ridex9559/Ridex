-- ============================================================================
-- RIDEX V2 MASTER SCHEMA & ROW LEVEL SECURITY (RLS) POLICIES
-- Production-grade, 100% idempotent migration for PostgreSQL & Supabase.
-- Unifies rides, ride_participants, ride_locations, and realtime channels.
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. PROFILES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT 'Rider',
  username TEXT UNIQUE,
  email TEXT DEFAULT '',
  avatar_url TEXT DEFAULT 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=400&q=80',
  city TEXT DEFAULT 'Pune',
  state TEXT DEFAULT 'Maharashtra',
  bio TEXT DEFAULT 'Motorcycle enthusiast & group rider.',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT NOT NULL DEFAULT 'Rider';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT DEFAULT 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=400&q=80';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS city TEXT DEFAULT 'Pune';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS state TEXT DEFAULT 'Maharashtra';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio TEXT DEFAULT 'Motorcycle enthusiast & group rider.';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- ============================================================================
-- 2. MOTORCYCLES TABLE (Garage)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.motorcycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  manufacturer TEXT NOT NULL DEFAULT 'Yamaha',
  model TEXT NOT NULL DEFAULT 'MT-03',
  year INTEGER NOT NULL DEFAULT 2024,
  color TEXT NOT NULL DEFAULT 'Black',
  engine_cc INTEGER NOT NULL DEFAULT 400,
  displacement_cc INTEGER DEFAULT 400,
  registration_number TEXT,
  fuel_tank_capacity_l NUMERIC(5,2) DEFAULT 15.0,
  avg_mileage_kmpl NUMERIC(5,2) DEFAULT 28.0,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.motorcycles ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.motorcycles ADD COLUMN IF NOT EXISTS manufacturer TEXT NOT NULL DEFAULT 'Yamaha';
ALTER TABLE public.motorcycles ADD COLUMN IF NOT EXISTS model TEXT NOT NULL DEFAULT 'MT-03';
ALTER TABLE public.motorcycles ADD COLUMN IF NOT EXISTS year INTEGER NOT NULL DEFAULT 2024;
ALTER TABLE public.motorcycles ADD COLUMN IF NOT EXISTS color TEXT NOT NULL DEFAULT 'Black';
ALTER TABLE public.motorcycles ADD COLUMN IF NOT EXISTS engine_cc INTEGER NOT NULL DEFAULT 400;
ALTER TABLE public.motorcycles ADD COLUMN IF NOT EXISTS displacement_cc INTEGER DEFAULT 400;
ALTER TABLE public.motorcycles ADD COLUMN IF NOT EXISTS registration_number TEXT;
ALTER TABLE public.motorcycles ADD COLUMN IF NOT EXISTS fuel_tank_capacity_l NUMERIC(5,2) DEFAULT 15.0;
ALTER TABLE public.motorcycles ADD COLUMN IF NOT EXISTS avg_mileage_kmpl NUMERIC(5,2) DEFAULT 28.0;
ALTER TABLE public.motorcycles ADD COLUMN IF NOT EXISTS is_primary BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.motorcycles ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.motorcycles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE public.motorcycles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- ============================================================================
-- 3. RIDES TABLE (Core Motorcycle Rides)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.rides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Group Ride',
  description TEXT,
  join_code VARCHAR(30) UNIQUE,
  ride_code VARCHAR(30),
  status VARCHAR(30) NOT NULL DEFAULT 'published',
  visibility VARCHAR(20) NOT NULL DEFAULT 'public',
  join_method VARCHAR(30) NOT NULL DEFAULT 'REQUEST_APPROVAL',
  start_location_name TEXT NOT NULL DEFAULT 'Starting Point',
  start_latitude DOUBLE PRECISION NOT NULL DEFAULT 18.5204,
  start_longitude DOUBLE PRECISION NOT NULL DEFAULT 73.8567,
  meetup_location_name TEXT,
  meetup_latitude DOUBLE PRECISION,
  meetup_longitude DOUBLE PRECISION,
  destination_name TEXT NOT NULL DEFAULT 'Destination Point',
  destination_latitude DOUBLE PRECISION NOT NULL DEFAULT 18.7557,
  destination_longitude DOUBLE PRECISION NOT NULL DEFAULT 73.4091,
  distance_km NUMERIC(8,2) DEFAULT 0,
  estimated_duration INTEGER DEFAULT 0,
  ride_date DATE DEFAULT CURRENT_DATE,
  meetup_time VARCHAR(20) DEFAULT '05:30 AM',
  departure_time VARCHAR(20) DEFAULT '06:00 AM',
  max_riders INTEGER DEFAULT 20,
  ride_type VARCHAR(50) DEFAULT 'WEEKEND',
  difficulty VARCHAR(30) DEFAULT 'MODERATE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure all columns exist on public.rides
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS organizer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS title TEXT DEFAULT 'Group Ride';
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS join_code VARCHAR(30);
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS ride_code VARCHAR(30);
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS status VARCHAR(30) DEFAULT 'published';
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS visibility VARCHAR(20) DEFAULT 'public';
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS join_method VARCHAR(30) DEFAULT 'REQUEST_APPROVAL';
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS start_location_name TEXT DEFAULT 'Starting Point';
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS start_latitude DOUBLE PRECISION DEFAULT 18.5204;
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS start_longitude DOUBLE PRECISION DEFAULT 73.8567;
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS meetup_location_name TEXT;
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS meetup_latitude DOUBLE PRECISION;
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS meetup_longitude DOUBLE PRECISION;
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS destination_name TEXT DEFAULT 'Destination Point';
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS destination_latitude DOUBLE PRECISION DEFAULT 18.7557;
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS destination_longitude DOUBLE PRECISION DEFAULT 73.4091;
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS distance_km NUMERIC(8,2) DEFAULT 0;
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS estimated_duration INTEGER DEFAULT 0;
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS ride_date DATE DEFAULT CURRENT_DATE;
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS meetup_time VARCHAR(20) DEFAULT '05:30 AM';
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS departure_time VARCHAR(20) DEFAULT '06:00 AM';
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS max_riders INTEGER DEFAULT 20;
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS ride_type VARCHAR(50) DEFAULT 'WEEKEND';
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS difficulty VARCHAR(30) DEFAULT 'MODERATE';
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Relax legacy NOT NULL constraints
DO $$
BEGIN
  ALTER TABLE public.rides ALTER COLUMN motorcycle_id DROP NOT NULL;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
DO $$
BEGIN
  ALTER TABLE public.rides ALTER COLUMN user_id DROP NOT NULL;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
DO $$
BEGIN
  ALTER TABLE public.rides ALTER COLUMN name DROP NOT NULL;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
DO $$
BEGIN
  ALTER TABLE public.rides ALTER COLUMN start_time DROP NOT NULL;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Drop obsolete CHECK constraints on rides
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT conname FROM pg_constraint WHERE conrelid = 'public.rides'::regclass AND contype = 'c'
  ) LOOP
    EXECUTE 'ALTER TABLE public.rides DROP CONSTRAINT IF EXISTS ' || quote_ident(r.conname);
  END LOOP;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Backfill join_code & ride_code
UPDATE public.rides 
SET join_code = COALESCE(join_code, ride_code, 'RIDEX-' || UPPER(SUBSTRING(MD5(id::text || clock_timestamp()::text) FROM 1 FOR 5))),
    ride_code = COALESCE(ride_code, join_code, 'RIDEX-' || UPPER(SUBSTRING(MD5(id::text || clock_timestamp()::text) FROM 1 FOR 5)))
WHERE join_code IS NULL OR ride_code IS NULL;

-- Backfill legacy organizer_id from user_id if null
DO $$
BEGIN
  UPDATE public.rides SET organizer_id = user_id WHERE organizer_id IS NULL AND user_id IS NOT NULL;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Backfill legacy title from name if null
DO $$
BEGIN
  UPDATE public.rides SET title = name WHERE title IS NULL AND name IS NOT NULL;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Ensure foreign key rides_organizer_id_fkey exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'rides_organizer_id_fkey') THEN
    ALTER TABLE public.rides 
      ADD CONSTRAINT rides_organizer_id_fkey 
      FOREIGN KEY (organizer_id) 
      REFERENCES public.profiles(id) 
      ON DELETE CASCADE;
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Ensure unique constraint on join_code
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'rides_join_code_key') THEN
    ALTER TABLE public.rides ADD CONSTRAINT rides_join_code_key UNIQUE (join_code);
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ============================================================================
-- 4. RIDE_PARTICIPANTS TABLE (Authoritative Unified Roster)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.ride_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID NOT NULL REFERENCES public.rides(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL DEFAULT 'rider',
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_ride_user UNIQUE(ride_id, user_id)
);

ALTER TABLE public.ride_participants ADD COLUMN IF NOT EXISTS ride_id UUID REFERENCES public.rides(id) ON DELETE CASCADE;
ALTER TABLE public.ride_participants ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.ride_participants ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'rider';
ALTER TABLE public.ride_participants ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending';
ALTER TABLE public.ride_participants ADD COLUMN IF NOT EXISTS joined_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.ride_participants ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE public.ride_participants ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Backfill approved_at for existing approved rows
UPDATE public.ride_participants 
SET approved_at = joined_at 
WHERE status IN ('approved', 'APPROVED', 'JOINED') AND approved_at IS NULL;

-- Also maintain ride_members as a synchronized compatibility table/view
CREATE TABLE IF NOT EXISTS public.ride_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID NOT NULL REFERENCES public.rides(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL DEFAULT 'RIDER',
  status VARCHAR(20) NOT NULL DEFAULT 'APPROVED',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_ride_member UNIQUE(ride_id, user_id)
);

-- ============================================================================
-- 5. RIDE_LOCATIONS TABLE (Latest GPS Position per User per Ride)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.ride_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID NOT NULL REFERENCES public.rides(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  heading DOUBLE PRECISION DEFAULT 0,
  speed DOUBLE PRECISION DEFAULT 0,
  accuracy DOUBLE PRECISION DEFAULT 0,
  is_sharing BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_ride_location_user UNIQUE(ride_id, user_id)
);

ALTER TABLE public.ride_locations ADD COLUMN IF NOT EXISTS ride_id UUID REFERENCES public.rides(id) ON DELETE CASCADE;
ALTER TABLE public.ride_locations ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.ride_locations ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
ALTER TABLE public.ride_locations ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;
ALTER TABLE public.ride_locations ADD COLUMN IF NOT EXISTS heading DOUBLE PRECISION DEFAULT 0;
ALTER TABLE public.ride_locations ADD COLUMN IF NOT EXISTS speed DOUBLE PRECISION DEFAULT 0;
ALTER TABLE public.ride_locations ADD COLUMN IF NOT EXISTS accuracy DOUBLE PRECISION DEFAULT 0;
ALTER TABLE public.ride_locations ADD COLUMN IF NOT EXISTS is_sharing BOOLEAN DEFAULT true;
ALTER TABLE public.ride_locations ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Maintain rider_locations compatibility table
CREATE TABLE IF NOT EXISTS public.rider_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID NOT NULL REFERENCES public.rides(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  heading DOUBLE PRECISION DEFAULT 0,
  speed DOUBLE PRECISION DEFAULT 0,
  accuracy DOUBLE PRECISION DEFAULT 0,
  is_sharing BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_rider_location_per_ride UNIQUE(ride_id, user_id)
);

-- ============================================================================
-- 6. MESSAGES TABLE (Ride Squad Chat)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID NOT NULL REFERENCES public.rides(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_system BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS ride_id UUID REFERENCES public.rides(id) ON DELETE CASCADE;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS message TEXT;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS is_system BOOLEAN DEFAULT false;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- ============================================================================
-- 7. NOTIFICATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  type VARCHAR(50) NOT NULL DEFAULT 'GENERAL',
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 8. PERFORMANCE INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_rides_join_code ON public.rides(join_code);
CREATE INDEX IF NOT EXISTS idx_rides_ride_code ON public.rides(ride_code);
CREATE INDEX IF NOT EXISTS idx_rides_organizer ON public.rides(organizer_id);
CREATE INDEX IF NOT EXISTS idx_rides_status ON public.rides(status);
CREATE INDEX IF NOT EXISTS idx_rides_visibility ON public.rides(visibility);

CREATE INDEX IF NOT EXISTS idx_ride_participants_ride ON public.ride_participants(ride_id);
CREATE INDEX IF NOT EXISTS idx_ride_participants_user ON public.ride_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_ride_participants_status ON public.ride_participants(status);

CREATE INDEX IF NOT EXISTS idx_ride_locations_ride ON public.ride_locations(ride_id);
CREATE INDEX IF NOT EXISTS idx_ride_locations_user ON public.ride_locations(user_id);

CREATE INDEX IF NOT EXISTS idx_messages_ride ON public.messages(ride_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);

-- ============================================================================
-- 9. SECURITY DEFINER HELPER FUNCTIONS (Zero Recursion Guarantee)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.is_ride_organizer(p_ride_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.rides WHERE id = p_ride_id AND organizer_id = p_user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.is_ride_participant(p_ride_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.ride_participants 
    WHERE ride_id = p_ride_id AND user_id = p_user_id AND status IN ('approved', 'APPROVED', 'active', 'ACTIVE', 'JOINED')
  );
$$;

-- Automatic handle_new_user trigger on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, email, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Rider'),
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=400&q=80')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- 10. ROW LEVEL SECURITY (RLS) POLICIES (No Circular Queries)
-- ============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.motorcycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ride_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ride_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ride_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rider_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
DROP POLICY IF EXISTS "Profiles are readable by everyone" ON public.profiles;
CREATE POLICY "Profiles are readable by everyone" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Motorcycles Policies
DROP POLICY IF EXISTS "Motorcycles are readable by authenticated users" ON public.motorcycles;
CREATE POLICY "Motorcycles are readable by authenticated users" ON public.motorcycles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own motorcycles" ON public.motorcycles;
CREATE POLICY "Users can insert their own motorcycles" ON public.motorcycles FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own motorcycles" ON public.motorcycles;
CREATE POLICY "Users can update their own motorcycles" ON public.motorcycles FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own motorcycles" ON public.motorcycles;
CREATE POLICY "Users can delete their own motorcycles" ON public.motorcycles FOR DELETE USING (auth.uid() = user_id);

-- Rides Policies (Direct non-recursive rules)
DROP POLICY IF EXISTS "Rides are readable by all authenticated users" ON public.rides;
DROP POLICY IF EXISTS "Public rides visible to everyone" ON public.rides;
CREATE POLICY "Rides are readable by all authenticated users" ON public.rides
  FOR SELECT USING (
    auth.role() = 'authenticated'
    OR visibility IN ('public', 'PUBLIC')
    OR organizer_id = auth.uid()
  );

DROP POLICY IF EXISTS "Authenticated users can create rides" ON public.rides;
CREATE POLICY "Authenticated users can create rides" ON public.rides
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL 
    AND (auth.uid() = organizer_id OR organizer_id IS NULL)
  );

DROP POLICY IF EXISTS "Organizers can update their own rides" ON public.rides;
CREATE POLICY "Organizers can update their own rides" ON public.rides
  FOR UPDATE USING (auth.uid() = organizer_id);

DROP POLICY IF EXISTS "Organizers can delete their own rides" ON public.rides;
CREATE POLICY "Organizers can delete their own rides" ON public.rides
  FOR DELETE USING (auth.uid() = organizer_id);

-- Ride Participants Policies (Direct non-recursive rules)
DROP POLICY IF EXISTS "Participants can view roster of their rides" ON public.ride_participants;
DROP POLICY IF EXISTS "Ride participants are readable" ON public.ride_participants;
CREATE POLICY "Ride participants are readable" ON public.ride_participants
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own participation" ON public.ride_participants;
CREATE POLICY "Users can insert their own participation" ON public.ride_participants
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users or organizers can update participation" ON public.ride_participants;
CREATE POLICY "Users or organizers can update participation" ON public.ride_participants
  FOR UPDATE USING (
    auth.uid() = user_id 
    OR public.is_ride_organizer(ride_id, auth.uid())
  );

DROP POLICY IF EXISTS "Users or organizers can delete participation" ON public.ride_participants;
CREATE POLICY "Users or organizers can delete participation" ON public.ride_participants
  FOR DELETE USING (
    auth.uid() = user_id 
    OR public.is_ride_organizer(ride_id, auth.uid())
  );

-- Ride Members Compatibility Policies
DROP POLICY IF EXISTS "Ride members are readable" ON public.ride_members;
CREATE POLICY "Ride members are readable" ON public.ride_members FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users or organizers can manage ride members" ON public.ride_members;
CREATE POLICY "Users or organizers can manage ride members" ON public.ride_members FOR ALL USING (true);

-- Ride Locations Policies (Live GPS)
DROP POLICY IF EXISTS "Ride locations viewable by everyone" ON public.ride_locations;
DROP POLICY IF EXISTS "Participants can view peer locations" ON public.ride_locations;
CREATE POLICY "Ride locations viewable by everyone" ON public.ride_locations
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Riders can upsert their own live location" ON public.ride_locations;
CREATE POLICY "Riders can upsert their own live location" ON public.ride_locations
  FOR ALL USING (auth.uid() = user_id);

-- Rider Locations Compatibility Policies
DROP POLICY IF EXISTS "Rider locations viewable by squad members" ON public.rider_locations;
CREATE POLICY "Rider locations viewable by squad members" ON public.rider_locations FOR SELECT USING (true);
DROP POLICY IF EXISTS "Riders can upsert their own live location" ON public.rider_locations;
CREATE POLICY "Riders can upsert their own live location" ON public.rider_locations FOR ALL USING (auth.uid() = user_id);

-- Messages Policies (Ride Chat)
DROP POLICY IF EXISTS "Messages readable by squad members" ON public.messages;
CREATE POLICY "Messages readable by squad members" ON public.messages FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can post messages" ON public.messages;
DROP POLICY IF EXISTS "Messages insertable by squad members" ON public.messages;
CREATE POLICY "Authenticated users can post messages" ON public.messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Notifications Policies
DROP POLICY IF EXISTS "Users can view their notifications" ON public.notifications;
CREATE POLICY "Users can view their notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their notifications" ON public.notifications;
CREATE POLICY "Users can update their notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================================
-- 11. SUPABASE REALTIME REPLICATION CONFIGURATION (SAFE IDEMPOTENT BLOCK)
-- ============================================================================
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.rides;
  EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.ride_participants;
  EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.ride_members;
  EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.ride_locations;
  EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.rider_locations;
  EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL;
  END;
END $$;
