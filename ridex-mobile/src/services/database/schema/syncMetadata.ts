export const CREATE_SYNC_METADATA_TABLE = `
CREATE TABLE IF NOT EXISTS sync_metadata (
  entity_type TEXT PRIMARY KEY NOT NULL,
  last_sync_at TEXT,
  last_successful_sync_at TEXT,
  sync_cursor TEXT
);
`;
