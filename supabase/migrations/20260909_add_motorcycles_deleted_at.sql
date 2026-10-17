-- ============================================================================
-- 20260909_add_motorcycles_deleted_at.sql: Soft-Delete Support for Fleet Tables
-- Forward-only migration to ensure PostgreSQL/Supabase schema consistency.
-- ============================================================================

-- Add deleted_at column to motorcycles table if it doesn't already exist
ALTER TABLE public.motorcycles 
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Index for filtering out soft-deleted records efficiently
CREATE INDEX IF NOT EXISTS idx_motorcycles_deleted_at 
  ON public.motorcycles(deleted_at);

-- Add deleted_at column to rides table if it doesn't already exist
ALTER TABLE public.rides 
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_rides_deleted_at 
  ON public.rides(deleted_at);

-- Refresh PostgREST schema cache notification
NOTIFY pgrst, 'reload schema';
