import { databaseManager } from '../DatabaseManager';
import { LocalProfile, SyncStatus } from '../databaseTypes';
import { logger } from '@/utils/logger';

export class LocalProfileRepository {
  async getProfile(id: string): Promise<LocalProfile | null> {
    try {
      const db = await databaseManager.getDatabase();
      const row = await db.getFirstAsync<LocalProfile>(
        'SELECT * FROM profiles WHERE id = ?',
        [id]
      );
      return row || null;
    } catch (error) {
      logger.error('[LocalProfileRepository] getProfile error:', error);
      return null;
    }
  }

  async saveProfile(profile: LocalProfile): Promise<void> {
    try {
      const db = await databaseManager.getDatabase();
      await db.runAsync(
        `INSERT INTO profiles (
          id, username, full_name, avatar_url, bio, city, country,
          created_at, updated_at, synced_at, sync_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          username = excluded.username,
          full_name = excluded.full_name,
          avatar_url = excluded.avatar_url,
          bio = excluded.bio,
          city = excluded.city,
          country = excluded.country,
          updated_at = excluded.updated_at,
          synced_at = excluded.synced_at,
          sync_status = excluded.sync_status`,
        [
          profile.id,
          profile.username,
          profile.full_name,
          profile.avatar_url,
          profile.bio,
          profile.city,
          profile.country,
          profile.created_at,
          profile.updated_at,
          profile.synced_at,
          profile.sync_status,
        ]
      );
    } catch (error) {
      logger.error('[LocalProfileRepository] saveProfile error:', error);
      throw error;
    }
  }

  async updateSyncStatus(id: string, status: SyncStatus, syncedAt?: string): Promise<void> {
    try {
      const db = await databaseManager.getDatabase();
      await db.runAsync(
        'UPDATE profiles SET sync_status = ?, synced_at = ? WHERE id = ?',
        [status, syncedAt || new Date().toISOString(), id]
      );
    } catch (error) {
      logger.error('[LocalProfileRepository] updateSyncStatus error:', error);
    }
  }

  async deleteProfile(id: string): Promise<void> {
    try {
      const db = await databaseManager.getDatabase();
      await db.runAsync('DELETE FROM profiles WHERE id = ?', [id]);
    } catch (error) {
      logger.error('[LocalProfileRepository] deleteProfile error:', error);
    }
  }
}

export const localProfileRepository = new LocalProfileRepository();
