export const CREATE_SYNC_QUEUE_TABLE = `
CREATE TABLE IF NOT EXISTS sync_queue (
  id TEXT PRIMARY KEY NOT NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('profile', 'motorcycle', 'ride', 'ride_location')),
  entity_id TEXT NOT NULL,
  operation TEXT NOT NULL CHECK (operation IN ('CREATE', 'UPDATE', 'DELETE')),
  payload TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SYNCING', 'COMPLETED', 'FAILED')),
  retry_count INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_attempt_at TEXT
);
`;
