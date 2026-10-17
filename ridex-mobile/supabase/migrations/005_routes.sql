-- ============================================================================
-- 005_routes.sql: Curated Routes & Waypoints Tables
-- ============================================================================

-- ROUTES TABLE
CREATE TABLE IF NOT EXISTS public.routes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  distance_meters NUMERIC(10, 2) NOT NULL CHECK (distance_meters >= 0),
  estimated_duration_seconds INTEGER NOT NULL CHECK (estimated_duration_seconds > 0),
  difficulty TEXT NOT NULL DEFAULT 'moderate' CHECK (difficulty IN ('easy', 'moderate', 'advanced', 'expert')),
  curvature_index NUMERIC(3, 1) CHECK (curvature_index IS NULL OR (curvature_index >= 1.0 AND curvature_index <= 10.0)),
  start_latitude NUMERIC(9, 6) NOT NULL CHECK (start_latitude >= -90 AND start_latitude <= 90),
  start_longitude NUMERIC(9, 6) NOT NULL CHECK (start_longitude >= -180 AND start_longitude <= 180),
  end_latitude NUMERIC(9, 6) NOT NULL CHECK (end_latitude >= -90 AND end_latitude <= 90),
  end_longitude NUMERIC(9, 6) NOT NULL CHECK (end_longitude >= -180 AND end_longitude <= 180),
  start_location_name TEXT NOT NULL,
  end_location_name TEXT NOT NULL,
  cover_image_url TEXT,
  visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('private', 'public')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_routes_updated_at
  BEFORE UPDATE ON public.routes
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ROUTE_LOCATIONS TABLE (Waypoints & Polylines)
CREATE TABLE IF NOT EXISTS public.route_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  route_id UUID NOT NULL REFERENCES public.routes(id) ON DELETE CASCADE,
  latitude NUMERIC(9, 6) NOT NULL CHECK (latitude >= -90 AND latitude <= 90),
  longitude NUMERIC(9, 6) NOT NULL CHECK (longitude >= -180 AND longitude <= 180),
  sequence_number INTEGER NOT NULL CHECK (sequence_number >= 0)
);
