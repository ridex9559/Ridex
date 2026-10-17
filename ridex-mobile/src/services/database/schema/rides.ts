export const CREATE_RIDES_TABLE = `
CREATE TABLE IF NOT EXISTS rides (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  motorcycle_id TEXT,
  name TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT,
  distance_meters REAL NOT NULL DEFAULT 0.0,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  average_speed REAL NOT NULL DEFAULT 0.0,
  max_speed REAL NOT NULL DEFAULT 0.0,
  elevation_gain REAL NOT NULL DEFAULT 0.0,
  max_lean_angle REAL,
  start_latitude REAL,
  start_longitude REAL,
  end_latitude REAL,
  end_longitude REAL,
  status TEXT NOT NULL DEFAULT 'COMPLETED' CHECK (status IN ('IN_PROGRESS', 'COMPLETED', 'PAUSED')),
  visibility TEXT NOT NULL DEFAULT 'PUBLIC' CHECK (visibility IN ('PUBLIC', 'PRIVATE', 'UNLISTED')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at TEXT,
  sync_status TEXT NOT NULL DEFAULT 'LOCAL' CHECK (sync_status IN ('LOCAL', 'PENDING', 'SYNCING', 'SYNCED', 'FAILED')),
  synced_at TEXT,
  version INTEGER NOT NULL DEFAULT 1
);
`;
