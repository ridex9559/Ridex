-- ============================================================================
-- 007_achievements.sql: Trophies & Gamification Tables
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'milestone' CHECK (category IN ('milestone', 'speed', 'lean', 'elevation', 'distance', 'social')),
  requirement_value NUMERIC(10, 2) NOT NULL CHECK (requirement_value > 0),
  unit TEXT NOT NULL DEFAULT 'KM',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  progress NUMERIC(10, 2) NOT NULL DEFAULT 0.0 CHECK (progress >= 0),
  is_completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_user_achievement UNIQUE (user_id, achievement_id)
);

CREATE TRIGGER set_user_achievements_updated_at
  BEFORE UPDATE ON public.user_achievements
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
