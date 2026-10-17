-- =====================================================================
-- RIDEX — Connect Ride: Checkpoints, Separation, SOS & Announcements
-- =====================================================================

-- 1. RIDE CHECKPOINTS (Waypoints for Fuel, Food, Scenic Stops)
CREATE TABLE IF NOT EXISTS ride_checkpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'REGROUP', -- 'START', 'BREAKFAST', 'FUEL', 'VIEWPOINT', 'REGROUP', 'DESTINATION'
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  estimated_stop_minutes INTEGER DEFAULT 15,
  is_reached BOOLEAN DEFAULT false,
  reached_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ride_checkpoints_ride ON ride_checkpoints(ride_id, order_index);

-- 2. RIDE SOS ALERTS (Emergency assistance requests)
CREATE TABLE IF NOT EXISTS ride_sos_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES ride_live_sessions(id) ON DELETE CASCADE,
  ride_id UUID NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  issue_type TEXT NOT NULL, -- 'FLAT_TYRE', 'MECHANICAL', 'OUT_OF_FUEL', 'MEDICAL', 'LOST'
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  note TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE', -- 'ACTIVE', 'RESOLVED', 'CANCELLED'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_ride_sos_session ON ride_sos_alerts(session_id, status);

-- 3. RIDE ANNOUNCEMENTS (Road captain broadcasts during live ride)
CREATE TABLE IF NOT EXISTS ride_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES ride_live_sessions(id) ON DELETE CASCADE,
  ride_id UUID NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'GENERAL', -- 'STOP', 'ROUTE_CHANGE', 'HAZARD', 'GENERAL'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ride_announcements_session ON ride_announcements(session_id, created_at DESC);

-- 4. ATOMIC FUNCTION: TRIGGER SOS ALERT
CREATE OR REPLACE FUNCTION trigger_sos_alert(
  p_session_id UUID,
  p_ride_id UUID,
  p_user_id UUID,
  p_issue_type TEXT,
  p_latitude DOUBLE PRECISION,
  p_longitude DOUBLE PRECISION,
  p_note TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_alert_id UUID;
BEGIN
  INSERT INTO ride_sos_alerts (
    session_id,
    ride_id,
    user_id,
    issue_type,
    latitude,
    longitude,
    note,
    status,
    created_at
  ) VALUES (
    p_session_id,
    p_ride_id,
    p_user_id,
    p_issue_type,
    p_latitude,
    p_longitude,
    p_note,
    'ACTIVE',
    NOW()
  ) RETURNING id INTO v_alert_id;

  RETURN jsonb_build_object(
    'success', true,
    'alert_id', v_alert_id,
    'message', 'SOS alert broadcast to squad'
  );
END;
$$;

-- 5. ATOMIC FUNCTION: RESOLVE SOS ALERT
CREATE OR REPLACE FUNCTION resolve_sos_alert(
  p_alert_id UUID,
  p_user_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE ride_sos_alerts
  SET status = 'RESOLVED', resolved_at = NOW()
  WHERE id = p_alert_id AND (user_id = p_user_id OR EXISTS (
    SELECT 1 FROM rides r WHERE r.id = ride_sos_alerts.ride_id AND r.organizer_id = p_user_id
  ));

  RETURN jsonb_build_object('success', true);
END;
$$;

-- 6. ATOMIC FUNCTION: BROADCAST ANNOUNCEMENT
CREATE OR REPLACE FUNCTION broadcast_ride_announcement(
  p_session_id UUID,
  p_ride_id UUID,
  p_author_id UUID,
  p_message TEXT,
  p_type TEXT DEFAULT 'GENERAL'
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_announcement_id UUID;
BEGIN
  INSERT INTO ride_announcements (
    session_id,
    ride_id,
    author_id,
    message,
    type,
    created_at
  ) VALUES (
    p_session_id,
    p_ride_id,
    p_author_id,
    p_message,
    p_type,
    NOW()
  ) RETURNING id INTO v_announcement_id;

  RETURN jsonb_build_object(
    'success', true,
    'announcement_id', v_announcement_id
  );
END;
$$;

-- 7. ENABLE REALTIME PUBLICATION
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE ride_sos_alerts;
  ALTER PUBLICATION supabase_realtime ADD TABLE ride_announcements;
  ALTER PUBLICATION supabase_realtime ADD TABLE ride_checkpoints;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
