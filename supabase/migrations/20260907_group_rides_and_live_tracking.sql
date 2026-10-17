-- ============================================================================
-- RIDEX — MIGRATION: GROUP RIDES, PARTICIPATION & REALTIME LIVE GROUP SESSIONS
-- Migration: 20260907_group_rides_and_live_tracking.sql
-- ============================================================================

-- 1. ENHANCE RIDES TABLE (FOR GROUP RIDES AND EVENT MANAGEMENT)
CREATE TABLE IF NOT EXISTS public.rides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    motorcycle_id UUID,
    title VARCHAR(120) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL DEFAULT 'CASUAL',
    difficulty VARCHAR(30) NOT NULL DEFAULT 'BEGINNER',
    start_location_name VARCHAR(150) NOT NULL,
    start_latitude DOUBLE PRECISION NOT NULL,
    start_longitude DOUBLE PRECISION NOT NULL,
    destination_name VARCHAR(150) NOT NULL,
    destination_latitude DOUBLE PRECISION NOT NULL,
    destination_longitude DOUBLE PRECISION NOT NULL,
    scheduled_at TIMESTAMPTZ NOT NULL,
    estimated_distance_km NUMERIC(8,2) DEFAULT 0,
    estimated_duration_minutes INTEGER DEFAULT 0,
    max_participants INTEGER DEFAULT NULL, -- NULL = Unlimited
    visibility VARCHAR(20) NOT NULL DEFAULT 'PUBLIC', -- 'PUBLIC' | 'PRIVATE'
    status VARCHAR(30) NOT NULL DEFAULT 'PUBLISHED', -- 'DRAFT' | 'PUBLISHED' | 'LIVE' | 'COMPLETED' | 'CANCELLED'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. CREATE RIDE PARTICIPANTS TABLE
CREATE TABLE IF NOT EXISTS public.ride_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ride_id UUID NOT NULL REFERENCES public.rides(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(30) NOT NULL DEFAULT 'PARTICIPANT', -- 'ORGANIZER' | 'ROAD_CAPTAIN' | 'SWEEPER' | 'PARTICIPANT'
    status VARCHAR(30) NOT NULL DEFAULT 'JOINED', -- 'JOINED' | 'LEFT' | 'REMOVED'
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_ride_user UNIQUE(ride_id, user_id)
);

-- 3. CREATE RIDE LIVE SESSIONS TABLE
CREATE TABLE IF NOT EXISTS public.ride_live_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ride_id UUID NOT NULL REFERENCES public.rides(id) ON DELETE CASCADE,
    status VARCHAR(30) NOT NULL DEFAULT 'LIVE', -- 'WAITING' | 'LIVE' | 'ENDED'
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_active_session_per_ride UNIQUE(ride_id)
);

-- 4. CREATE RIDE LIVE LOCATIONS TABLE (LATEST POSITION PER PARTICIPANT PER SESSION)
CREATE TABLE IF NOT EXISTS public.ride_live_locations (
    session_id UUID NOT NULL REFERENCES public.ride_live_sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    heading DOUBLE PRECISION,
    speed DOUBLE PRECISION DEFAULT 0,
    accuracy DOUBLE PRECISION,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (session_id, user_id)
);

-- 5. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_rides_status ON public.rides(status);
CREATE INDEX IF NOT EXISTS idx_rides_scheduled_at ON public.rides(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_rides_visibility ON public.rides(visibility);
CREATE INDEX IF NOT EXISTS idx_rides_category ON public.rides(category);
CREATE INDEX IF NOT EXISTS idx_rides_organizer_id ON public.rides(organizer_id);

CREATE INDEX IF NOT EXISTS idx_ride_participants_ride_id ON public.ride_participants(ride_id);
CREATE INDEX IF NOT EXISTS idx_ride_participants_user_id ON public.ride_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_ride_participants_status ON public.ride_participants(status);

CREATE INDEX IF NOT EXISTS idx_ride_live_sessions_ride_id ON public.ride_live_sessions(ride_id);
CREATE INDEX IF NOT EXISTS idx_ride_live_sessions_status ON public.ride_live_sessions(status);

CREATE INDEX IF NOT EXISTS idx_ride_live_locations_session_id ON public.ride_live_locations(session_id);
CREATE INDEX IF NOT EXISTS idx_ride_live_locations_updated_at ON public.ride_live_locations(updated_at);

-- 6. ATOMIC DATABASE FUNCTIONS / RPCs

-- Atomic Join Ride with Capacity Lock
CREATE OR REPLACE FUNCTION public.join_ride(
    p_ride_id UUID,
    p_user_id UUID,
    p_role TEXT DEFAULT 'PARTICIPANT'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_ride public.rides%ROWTYPE;
    v_current_count INTEGER;
    v_existing public.ride_participants%ROWTYPE;
BEGIN
    -- 1. Check & Lock Ride Record
    SELECT * INTO v_ride FROM public.rides WHERE id = p_ride_id FOR UPDATE;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'RIDE_NOT_FOUND', 'message', 'Ride does not exist');
    END IF;

    -- 2. Validate Status & Visibility
    IF v_ride.status NOT IN ('PUBLISHED', 'LIVE') THEN
        RETURN jsonb_build_object('success', false, 'error', 'RIDE_NOT_JOINABLE', 'message', 'Ride is not currently open for joining');
    END IF;

    -- 3. Check Existing Participation
    SELECT * INTO v_existing FROM public.ride_participants WHERE ride_id = p_ride_id AND user_id = p_user_id;
    IF FOUND THEN
        IF v_existing.status = 'JOINED' THEN
            RETURN jsonb_build_object('success', true, 'message', 'Already joined this ride', 'participant_id', v_existing.id);
        ELSE
            -- Reactivate participation
            UPDATE public.ride_participants
            SET status = 'JOINED', updated_at = NOW()
            WHERE id = v_existing.id;
            RETURN jsonb_build_object('success', true, 'message', 'Rejoined ride', 'participant_id', v_existing.id);
        END IF;
    END IF;

    -- 4. Check Maximum Participant Capacity
    IF v_ride.max_participants IS NOT NULL THEN
        SELECT COUNT(*) INTO v_current_count
        FROM public.ride_participants
        WHERE ride_id = p_ride_id AND status = 'JOINED';

        IF v_current_count >= v_ride.max_participants THEN
            RETURN jsonb_build_object('success', false, 'error', 'RIDE_FULL', 'message', 'This ride has reached maximum rider capacity');
        END IF;
    END IF;

    -- 5. Insert New Participant
    INSERT INTO public.ride_participants (ride_id, user_id, role, status, joined_at, updated_at)
    VALUES (p_ride_id, p_user_id, p_role, 'JOINED', NOW(), NOW())
    RETURNING id INTO v_existing.id;

    RETURN jsonb_build_object('success', true, 'message', 'Successfully joined ride', 'participant_id', v_existing.id);
END;
$$;

-- Atomic Leave Ride
CREATE OR REPLACE FUNCTION public.leave_ride(
    p_ride_id UUID,
    p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_participant public.ride_participants%ROWTYPE;
BEGIN
    SELECT * INTO v_participant FROM public.ride_participants WHERE ride_id = p_ride_id AND user_id = p_user_id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'NOT_JOINED', 'message', 'You are not a participant in this ride');
    END IF;

    IF v_participant.role = 'ORGANIZER' THEN
        RETURN jsonb_build_object('success', false, 'error', 'ORGANIZER_CANNOT_LEAVE', 'message', 'Organizers cannot leave the ride. Cancel the ride instead.');
    END IF;

    UPDATE public.ride_participants
    SET status = 'LEFT', updated_at = NOW()
    WHERE id = v_participant.id;

    RETURN jsonb_build_object('success', true, 'message', 'Successfully left the ride');
END;
$$;

-- Atomic Start Live Ride Session (Organizer Only)
CREATE OR REPLACE FUNCTION public.start_live_ride(
    p_ride_id UUID,
    p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_ride public.rides%ROWTYPE;
    v_session_id UUID;
BEGIN
    SELECT * INTO v_ride FROM public.rides WHERE id = p_ride_id FOR UPDATE;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'RIDE_NOT_FOUND', 'message', 'Ride not found');
    END IF;

    IF v_ride.organizer_id <> p_user_id THEN
        RETURN jsonb_build_object('success', false, 'error', 'NOT_ORGANIZER', 'message', 'Only the ride organizer can launch the live ride session');
    END IF;

    -- Update Ride Status
    UPDATE public.rides SET status = 'LIVE', updated_at = NOW() WHERE id = p_ride_id;

    -- Create or Activate Live Session
    INSERT INTO public.ride_live_sessions (ride_id, status, started_at, created_at)
    VALUES (p_ride_id, 'LIVE', NOW(), NOW())
    ON CONFLICT (ride_id) DO UPDATE SET status = 'LIVE', started_at = NOW()
    RETURNING id INTO v_session_id;

    RETURN jsonb_build_object('success', true, 'session_id', v_session_id, 'message', 'Live ride session started');
END;
$$;

-- Atomic End Live Ride Session (Organizer Only)
CREATE OR REPLACE FUNCTION public.end_live_ride(
    p_ride_id UUID,
    p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_ride public.rides%ROWTYPE;
    v_session public.ride_live_sessions%ROWTYPE;
BEGIN
    SELECT * INTO v_ride FROM public.rides WHERE id = p_ride_id FOR UPDATE;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'RIDE_NOT_FOUND', 'message', 'Ride not found');
    END IF;

    IF v_ride.organizer_id <> p_user_id THEN
        RETURN jsonb_build_object('success', false, 'error', 'NOT_ORGANIZER', 'message', 'Only the ride organizer can complete the ride');
    END IF;

    -- Complete Ride & Session
    UPDATE public.rides SET status = 'COMPLETED', updated_at = NOW() WHERE id = p_ride_id;
    UPDATE public.ride_live_sessions SET status = 'ENDED', ended_at = NOW() WHERE ride_id = p_ride_id RETURNING * INTO v_session;

    -- Clean up live locations for privacy & storage optimization
    IF v_session.id IS NOT NULL THEN
        DELETE FROM public.ride_live_locations WHERE session_id = v_session.id;
    END IF;

    RETURN jsonb_build_object('success', true, 'message', 'Live ride completed and cleaned up successfully');
END;
$$;

-- Atomic Throttled Live Location Upsert
CREATE OR REPLACE FUNCTION public.upsert_live_location(
    p_session_id UUID,
    p_user_id UUID,
    p_latitude DOUBLE PRECISION,
    p_longitude DOUBLE PRECISION,
    p_heading DOUBLE PRECISION DEFAULT NULL,
    p_speed DOUBLE PRECISION DEFAULT 0,
    p_accuracy DOUBLE PRECISION DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.ride_live_locations (
        session_id, user_id, latitude, longitude, heading, speed, accuracy, updated_at
    )
    VALUES (
        p_session_id, p_user_id, p_latitude, p_longitude, p_heading, p_speed, p_accuracy, NOW()
    )
    ON CONFLICT (session_id, user_id) DO UPDATE SET
        latitude = EXCLUDED.latitude,
        longitude = EXCLUDED.longitude,
        heading = EXCLUDED.heading,
        speed = EXCLUDED.speed,
        accuracy = EXCLUDED.accuracy,
        updated_at = NOW();
END;
$$;

-- 7. ROW LEVEL SECURITY (RLS) POLICIES

ALTER TABLE public.rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ride_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ride_live_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ride_live_locations ENABLE ROW LEVEL SECURITY;

-- Rides RLS
CREATE POLICY "Public rides visible to everyone" ON public.rides
    FOR SELECT USING (visibility = 'PUBLIC' OR organizer_id = auth.uid() OR id IN (
        SELECT ride_id FROM public.ride_participants WHERE user_id = auth.uid() AND status = 'JOINED'
    ));

CREATE POLICY "Authenticated users can create rides" ON public.rides
    FOR INSERT WITH CHECK (auth.uid() = organizer_id);

CREATE POLICY "Organizers can update their own rides" ON public.rides
    FOR UPDATE USING (auth.uid() = organizer_id);

-- Ride Participants RLS
CREATE POLICY "Participants can view roster of their rides" ON public.rides_participants
    FOR SELECT USING (true);

CREATE POLICY "Users can manage their own participation" ON public.ride_participants
    FOR ALL USING (auth.uid() = user_id);

-- Live Sessions RLS
CREATE POLICY "Participants can view active live session" ON public.ride_live_sessions
    FOR SELECT USING (ride_id IN (
        SELECT id FROM public.rides WHERE visibility = 'PUBLIC' OR organizer_id = auth.uid() OR id IN (
            SELECT ride_id FROM public.ride_participants WHERE user_id = auth.uid() AND status = 'JOINED'
        )
    ));

-- Live Locations RLS
CREATE POLICY "Participants can view peer locations in session" ON public.ride_live_locations
    FOR SELECT USING (session_id IN (
        SELECT s.id FROM public.ride_live_sessions s
        JOIN public.ride_participants p ON p.ride_id = s.ride_id
        WHERE p.user_id = auth.uid() AND p.status = 'JOINED'
    ));

CREATE POLICY "Users can only write their own live location" ON public.ride_live_locations
    FOR ALL USING (auth.uid() = user_id);

-- 8. SUPABASE REALTIME CONFIGURATION
ALTER PUBLICATION supabase_realtime ADD TABLE public.ride_live_locations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ride_live_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ride_participants;
