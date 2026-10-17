export const CREATE_RIDE_LOCATIONS_TABLE = `
CREATE TABLE IF NOT EXISTS ride_locations (
  id TEXT PRIMARY KEY NOT NULL,
  ride_id TEXT NOT NULL,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  altitude REAL,
  speed REAL,
  accuracy REAL,
  heading REAL,
  recorded_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  sync_status TEXT NOT NULL DEFAULT 'LOCAL' CHECK (sync_status IN ('LOCAL', 'PENDING', 'SYNCING', 'SYNCED', 'FAILED'))
);
`;
