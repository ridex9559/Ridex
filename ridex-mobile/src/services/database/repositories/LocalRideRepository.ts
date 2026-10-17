import { databaseManager } from '../DatabaseManager';
import { LocalRide, SyncStatus } from '../databaseTypes';
import { logger } from '@/utils/logger';

export class LocalRideRepository {
  async getRidesByUserId(userId: string, limit: number = 50, offset: number = 0): Promise<LocalRide[]> {
    try {
      const db = await databaseManager.getDatabase();
      const rows = await db.getAllAsync<LocalRide>(
        `SELECT * FROM rides 
         WHERE user_id = ? AND deleted_at IS NULL 
         ORDER BY start_time DESC 
         LIMIT ? OFFSET ?`,
        [userId, limit, offset]
      );
      return rows;
    } catch (error) {
      logger.error('[LocalRideRepository] getRidesByUserId error:', error);
      return [];
    }
  }

  async getRideById(id: string, userId: string): Promise<LocalRide | null> {
    try {
      const db = await databaseManager.getDatabase();
      const row = await db.getFirstAsync<LocalRide>(
        'SELECT * FROM rides WHERE id = ? AND user_id = ?',
        [id, userId]
      );
      return row || null;
    } catch (error) {
      logger.error('[LocalRideRepository] getRideById error:', error);
      return null;
    }
  }

  async getActiveRide(userId: string): Promise<LocalRide | null> {
    try {
      const db = await databaseManager.getDatabase();
      const row = await db.getFirstAsync<LocalRide>(
        "SELECT * FROM rides WHERE user_id = ? AND status IN ('IN_PROGRESS', 'PAUSED') AND deleted_at IS NULL ORDER BY start_time DESC",
        [userId]
      );
      return row || null;
    } catch (error) {
      logger.error('[LocalRideRepository] getActiveRide error:', error);
      return null;
    }
  }

  async saveRide(ride: LocalRide): Promise<void> {
    try {
      const db = await databaseManager.getDatabase();
      await db.runAsync(
        `INSERT INTO rides (
          id, user_id, motorcycle_id, name, start_time, end_time,
          distance_meters, duration_seconds, average_speed, max_speed,
          elevation_gain, max_lean_angle, start_latitude, start_longitude,
          end_latitude, end_longitude, status, visibility,
          created_at, updated_at, deleted_at, sync_status, synced_at, version
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          motorcycle_id = excluded.motorcycle_id,
          name = excluded.name,
          start_time = excluded.start_time,
          end_time = excluded.end_time,
          distance_meters = excluded.distance_meters,
          duration_seconds = excluded.duration_seconds,
          average_speed = excluded.average_speed,
          max_speed = excluded.max_speed,
          elevation_gain = excluded.elevation_gain,
          max_lean_angle = excluded.max_lean_angle,
          start_latitude = excluded.start_latitude,
          start_longitude = excluded.start_longitude,
          end_latitude = excluded.end_latitude,
          end_longitude = excluded.end_longitude,
          status = excluded.status,
          visibility = excluded.visibility,
          updated_at = excluded.updated_at,
          deleted_at = excluded.deleted_at,
          sync_status = excluded.sync_status,
          synced_at = excluded.synced_at,
          version = excluded.version`,
        [
          ride.id,
          ride.user_id,
          ride.motorcycle_id,
          ride.name,
          ride.start_time,
          ride.end_time,
          ride.distance_meters,
          ride.duration_seconds,
          ride.average_speed,
          ride.max_speed,
          ride.elevation_gain,
          ride.max_lean_angle,
          ride.start_latitude,
          ride.start_longitude,
          ride.end_latitude,
          ride.end_longitude,
          ride.status,
          ride.visibility,
          ride.created_at,
          ride.updated_at,
          ride.deleted_at,
          ride.sync_status,
          ride.synced_at,
          ride.version || 1,
        ]
      );
    } catch (error) {
      logger.error('[LocalRideRepository] saveRide error:', error);
      throw error;
    }
  }

  async softDeleteRide(id: string, userId: string): Promise<void> {
    try {
      const db = await databaseManager.getDatabase();
      await db.runAsync(
        'UPDATE rides SET deleted_at = ?, sync_status = ? WHERE id = ? AND user_id = ?',
        [new Date().toISOString(), 'PENDING', id, userId]
      );
    } catch (error) {
      logger.error('[LocalRideRepository] softDeleteRide error:', error);
      throw error;
    }
  }

  async updateSyncStatus(id: string, status: SyncStatus, syncedAt?: string, version?: number): Promise<void> {
    try {
      const db = await databaseManager.getDatabase();
      if (version !== undefined) {
        await db.runAsync(
          'UPDATE rides SET sync_status = ?, synced_at = ?, version = ? WHERE id = ?',
          [status, syncedAt || new Date().toISOString(), version, id]
        );
      } else {
        await db.runAsync(
          'UPDATE rides SET sync_status = ?, synced_at = ? WHERE id = ?',
          [status, syncedAt || new Date().toISOString(), id]
        );
      }
    } catch (error) {
      logger.error('[LocalRideRepository] updateSyncStatus error:', error);
    }
  }

  async hardDeleteRide(id: string): Promise<void> {
    try {
      const db = await databaseManager.getDatabase();
      await db.withTransactionAsync(async () => {
        await db.runAsync('DELETE FROM ride_locations WHERE ride_id = ?', [id]);
        await db.runAsync('DELETE FROM rides WHERE id = ?', [id]);
      });
    } catch (error) {
      logger.error('[LocalRideRepository] hardDeleteRide error:', error);
    }
  }
}

export const localRideRepository = new LocalRideRepository();
