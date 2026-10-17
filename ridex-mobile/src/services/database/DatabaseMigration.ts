import { logger } from '@/utils/logger';
import {
  CREATE_APP_METADATA_TABLE,
  CREATE_PROFILES_TABLE,
  CREATE_MOTORCYCLES_TABLE,
  CREATE_RIDES_TABLE,
  CREATE_RIDE_LOCATIONS_TABLE,
  CREATE_SYNC_QUEUE_TABLE,
  CREATE_SYNC_METADATA_TABLE,
  CREATE_INDEXES,
} from './schema';

export interface Migration {
  version: number;
  name: string;
  up: (db: any) => Promise<void>;
}

export const MIGRATIONS: Migration[] = [
  {
    version: 1,
    name: '001_initial_schema',
    up: async (db) => {
      logger.info('[MIGRATION] Running 001_initial_schema...');
      await db.execAsync(CREATE_APP_METADATA_TABLE);
      await db.execAsync(CREATE_PROFILES_TABLE);
      await db.execAsync(CREATE_MOTORCYCLES_TABLE);
      await db.execAsync(CREATE_RIDES_TABLE);
      await db.execAsync(CREATE_RIDE_LOCATIONS_TABLE);
      await db.execAsync(CREATE_SYNC_QUEUE_TABLE);
      await db.execAsync(CREATE_SYNC_METADATA_TABLE);
      await db.execAsync(CREATE_INDEXES);
    },
  },
];

export class DatabaseMigrationRunner {
  static async runMigrations(db: any): Promise<void> {
    logger.info('[DATABASE] Checking and running schema migrations...');
    
    // Ensure app_metadata exists first so we can check database_version
    await db.execAsync(CREATE_APP_METADATA_TABLE);

    // Get current version
    const versionRow = await db.getFirstAsync(
      'SELECT value FROM app_metadata WHERE key = ?',
      ['database_version']
    );

    const currentVersion = versionRow ? parseInt(versionRow.value, 10) : 0;
    logger.info(`[DATABASE] Current schema version: ${currentVersion}`);

    for (const migration of MIGRATIONS) {
      if (migration.version > currentVersion) {
        logger.info(`[DATABASE] Applying migration v${migration.version}: ${migration.name}`);
        await migration.up(db);
        
        await db.runAsync(
          `INSERT INTO app_metadata (key, value, updated_at) 
           VALUES ('database_version', ?, datetime('now'))
           ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
          [migration.version.toString()]
        );
        logger.info(`[DATABASE] Successfully applied migration v${migration.version}`);
      }
    }

    logger.info('[DATABASE] All database migrations are up to date.');
  }
}
