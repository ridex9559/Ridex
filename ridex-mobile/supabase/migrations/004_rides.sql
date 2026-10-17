-- ============================================================================
-- 004_rides.sql: Ride Tracking & GPS Telemetry Tables
-- ============================================================================

-- RIDES TABLE
CREATE TABLE IF NOT EXISTS public.rides (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  motorcycle_id UUID NOT NULL REFERENCES public.motorcycles(id) ON DELETE RESTRICT,
  name TEXT NOT NULL DEFAULT 'Motorcycle Ride',
  start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_time TIMESTAMPTZ,
  distance_meters NUMERIC(10, 2) NOT NULL DEFAULT 0.0 CHECK (distance_meters >= 0),
  duration_seconds INTEGER NOT NULL DEFAULT 0 CHECK (duration_seconds >= 0),
  average_speed_kmh NUMERIC(5, 2) NOT NULL DEFAULT 0.0 CHECK (average_speed_kmh >= 0),
  max_speed_kmh NUMERIC(5, 2) NOT NULL DEFAULT 0.0 CHECK (max_speed_kmh >= 0),
  elevation_gain_meters NUMERIC(8, 2) NOT NULL DEFAULT 0.0 CHECK (elevation_gain_meters >= 0),
  max_lean_angle_degrees NUMERIC(4, 1) CHECK (max_lean_angle_degrees IS NULL OR (max_lean_angle_degrees >= 0 AND max_lean_angle_degrees <= 90)),
  start_latitude NUMERIC(9, 6) CHECK (start_latitude IS NULL OR (start_latitude >= -90 AND start_latitude <= 90)),
  start_longitude NUMERIC(9, 6) CHECK (start_longitude IS NULL OR (start_longitude >= -180 AND start_longitude <= 180)),
  end_latitude NUMERIC(9, 6) CHECK (end_latitude IS NULL OR (end_latitude >= -90 AND end_latitude <= 90)),
  end_longitude NUMERIC(9, 6) CHECK (end_longitude IS NULL OR (end_longitude >= -180 AND end_longitude <= 180)),
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('draft', 'active', 'completed', 'cancelled')),
  visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('private', 'followers', 'public')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_rides_updated_at
  BEFORE UPDATE ON public.rides
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- RIDE_LOCATIONS TABLE (High-volume GPS breadcrumbs)
CREATE TABLE IF NOT EXISTS public.ride_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ride_id UUID NOT NULL REFERENCES public.rides(id) ON DELETE CASCADE,
  latitude NUMERIC(9, 6) NOT NULL CHECK (latitude >= -90 AND latitude <= 90),
  longitude NUMERIC(9, 6) NOT NULL CHECK (longitude >= -180 AND longitude <= 180),
  altitude NUMERIC(8, 2) NOT NULL DEFAULT 0.0,
  speed_kmh NUMERIC(5, 2) NOT NULL DEFAULT 0.0 CHECK (speed_kmh >= 0),
  accuracy_meters NUMERIC(6, 2),
  heading_degrees NUMERIC(5, 2) CHECK (heading_degrees IS NULL OR (heading_degrees >= 0 AND heading_degrees <= 360)),
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
