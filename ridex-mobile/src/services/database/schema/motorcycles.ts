export const CREATE_MOTORCYCLES_TABLE = `
CREATE TABLE IF NOT EXISTS motorcycles (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  manufacturer TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  displacement_cc INTEGER NOT NULL DEFAULT 500,
  horsepower INTEGER,
  registration_number TEXT,
  odometer_km REAL NOT NULL DEFAULT 0.0,
  category TEXT NOT NULL DEFAULT 'ADVENTURE',
  nickname TEXT,
  image_url TEXT,
  is_primary INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at TEXT,
  sync_status TEXT NOT NULL DEFAULT 'LOCAL' CHECK (sync_status IN ('LOCAL', 'PENDING', 'SYNCING', 'SYNCED', 'FAILED')),
  synced_at TEXT
);
`;
