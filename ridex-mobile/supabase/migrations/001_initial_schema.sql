-- ============================================================================
-- 001_initial_schema.sql: Core Extensions & Automated Timestamp Trigger
-- RIDEX Motorcycle Adventure Platform
-- ============================================================================

-- Enable UUID extension for cryptographic primary keys
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable PostGIS for spatial queries if available in environment
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Reusable timestamp trigger function to automatically update updated_at columns
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
