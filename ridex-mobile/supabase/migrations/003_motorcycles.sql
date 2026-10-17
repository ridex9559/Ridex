-- ============================================================================
-- 003_motorcycles.sql: Digital Garage Fleet Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.motorcycles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  manufacturer TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL CHECK (year >= 1900 AND year <= EXTRACT(YEAR FROM NOW()) + 2),
  displacement_cc INTEGER NOT NULL DEFAULT 500 CHECK (displacement_cc > 0 AND displacement_cc <= 3000),
  horsepower INTEGER CHECK (horsepower IS NULL OR (horsepower > 0 AND horsepower <= 500)),
  registration_number TEXT,
  odometer_km NUMERIC(10, 2) NOT NULL DEFAULT 0.0 CHECK (odometer_km >= 0),
  category TEXT NOT NULL DEFAULT 'ADVENTURE' CHECK (category IN ('ADVENTURE', 'SPORT', 'NAKED', 'TOURING', 'CRUISER', 'SUPERMOTO', 'CAFE_RACER', 'OFF_ROAD')),
  nickname TEXT,
  image_url TEXT,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_motorcycles_updated_at
  BEFORE UPDATE ON public.motorcycles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
