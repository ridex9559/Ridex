export const CREATE_PROFILES_TABLE = `
CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY NOT NULL,
  username TEXT NOT NULL,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  city TEXT,
  country TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  synced_at TEXT,
  sync_status TEXT NOT NULL DEFAULT 'LOCAL' CHECK (sync_status IN ('LOCAL', 'PENDING', 'SYNCING', 'SYNCED', 'FAILED'))
);
`;
