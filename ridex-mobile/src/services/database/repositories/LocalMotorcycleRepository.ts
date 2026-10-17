import { databaseManager } from '../DatabaseManager';
import { LocalMotorcycle, SyncStatus } from '../databaseTypes';
import { logger } from '@/utils/logger';

export class LocalMotorcycleRepository {
  async getMotorcyclesByUserId(userId: string): Promise<LocalMotorcycle[]> {
    try {
      const db = await databaseManager.getDatabase();
      const rows = await db.getAllAsync<LocalMotorcycle>(
        'SELECT * FROM motorcycles WHERE user_id = ? AND deleted_at IS NULL ORDER BY is_primary DESC, created_at DESC',
        [userId]
      );
      return rows;
    } catch (error) {
      logger.error('[LocalMotorcycleRepository] getMotorcyclesByUserId error:', error);
      return [];
    }
  }

  async getMotorcycleById(id: string, userId: string): Promise<LocalMotorcycle | null> {
    try {
      const db = await databaseManager.getDatabase();
      const row = await db.getFirstAsync<LocalMotorcycle>(
        'SELECT * FROM motorcycles WHERE id = ? AND user_id = ?',
        [id, userId]
      );
      return row || null;
    } catch (error) {
      logger.error('[LocalMotorcycleRepository] getMotorcycleById error:', error);
      return null;
    }
  }

  async saveMotorcycle(motorcycle: LocalMotorcycle): Promise<void> {
    try {
      const db = await databaseManager.getDatabase();
      await db.runAsync(
        `INSERT INTO motorcycles (
          id, user_id, manufacturer, model, year, displacement_cc, horsepower,
          registration_number, odometer_km, category, nickname, image_url,
          is_primary, created_at, updated_at, deleted_at, sync_status, synced_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          manufacturer = excluded.manufacturer,
          model = excluded.model,
          year = excluded.year,
          displacement_cc = excluded.displacement_cc,
          horsepower = excluded.horsepower,
          registration_number = excluded.registration_number,
          odometer_km = excluded.odometer_km,
          category = excluded.category,
          nickname = excluded.nickname,
          image_url = excluded.image_url,
          is_primary = excluded.is_primary,
          updated_at = excluded.updated_at,
          deleted_at = excluded.deleted_at,
          sync_status = excluded.sync_status,
          synced_at = excluded.synced_at`,
        [
          motorcycle.id,
          motorcycle.user_id,
          motorcycle.manufacturer,
          motorcycle.model,
          motorcycle.year,
          motorcycle.displacement_cc,
          motorcycle.horsepower,
          motorcycle.registration_number,
          motorcycle.odometer_km,
          motorcycle.category,
          motorcycle.nickname,
          motorcycle.image_url,
          motorcycle.is_primary,
          motorcycle.created_at,
          motorcycle.updated_at,
          motorcycle.deleted_at,
          motorcycle.sync_status,
          motorcycle.synced_at,
        ]
      );
    } catch (error) {
      logger.error('[LocalMotorcycleRepository] saveMotorcycle error:', error);
      throw error;
    }
  }

  async setPrimaryMotorcycle(id: string, userId: string): Promise<void> {
    try {
      const db = await databaseManager.getDatabase();
      await db.withTransactionAsync(async () => {
        // Reset all primary flags for user
        await db.runAsync('UPDATE motorcycles SET is_primary = 0 WHERE user_id = ?', [userId]);
        // Set new primary
        await db.runAsync('UPDATE motorcycles SET is_primary = 1 WHERE id = ? AND user_id = ?', [id, userId]);
      });
    } catch (error) {
      logger.error('[LocalMotorcycleRepository] setPrimaryMotorcycle error:', error);
    }
  }

  async softDeleteMotorcycle(id: string, userId: string): Promise<void> {
    try {
      const db = await databaseManager.getDatabase();
      await db.runAsync(
        'UPDATE motorcycles SET deleted_at = ?, sync_status = ? WHERE id = ? AND user_id = ?',
        [new Date().toISOString(), 'PENDING', id, userId]
      );
    } catch (error) {
      logger.error('[LocalMotorcycleRepository] softDeleteMotorcycle error:', error);
      throw error;
    }
  }

  async updateSyncStatus(id: string, status: SyncStatus, syncedAt?: string): Promise<void> {
    try {
      const db = await databaseManager.getDatabase();
      await db.runAsync(
        'UPDATE motorcycles SET sync_status = ?, synced_at = ? WHERE id = ?',
        [status, syncedAt || new Date().toISOString(), id]
      );
    } catch (error) {
      logger.error('[LocalMotorcycleRepository] updateSyncStatus error:', error);
    }
  }

  async hardDeleteMotorcycle(id: string): Promise<void> {
    try {
      const db = await databaseManager.getDatabase();
      await db.runAsync('DELETE FROM motorcycles WHERE id = ?', [id]);
    } catch (error) {
      logger.error('[LocalMotorcycleRepository] hardDeleteMotorcycle error:', error);
    }
  }
}

export const localMotorcycleRepository = new LocalMotorcycleRepository();
