export const CREATE_INDEXES = `
CREATE INDEX IF NOT EXISTS idx_rides_user_id ON rides(user_id);
CREATE INDEX IF NOT EXISTS idx_rides_start_time ON rides(start_time DESC);
CREATE INDEX IF NOT EXISTS idx_rides_updated_at ON rides(updated_at);
CREATE INDEX IF NOT EXISTS idx_rides_sync_status ON rides(sync_status);

CREATE INDEX IF NOT EXISTS idx_ride_locations_ride_id ON ride_locations(ride_id);
CREATE INDEX IF NOT EXISTS idx_ride_locations_recorded_at ON ride_locations(recorded_at ASC);

CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON sync_queue(status);
CREATE INDEX IF NOT EXISTS idx_sync_queue_created_at ON sync_queue(created_at ASC);

CREATE INDEX IF NOT EXISTS idx_motorcycles_user_id ON motorcycles(user_id);
CREATE INDEX IF NOT EXISTS idx_motorcycles_sync_status ON motorcycles(sync_status);
`;
