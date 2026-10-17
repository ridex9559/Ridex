import { IMotorcycleRepository } from '../interfaces/IMotorcycleRepository';
import { Motorcycle, CreateMotorcycleDto } from '@/types/motorcycle';
import { localMotorcycleRepository } from '@/services/database/repositories/LocalMotorcycleRepository';
import { localSyncRepository } from '@/services/database/repositories/LocalSyncRepository';
import { syncService } from '@/services/offline/SyncService';
import { networkService } from '@/services/offline/NetworkService';
import {
  mapLocalMotorcycleToDomain,
  mapDomainMotorcycleToLocal,
} from '@/services/database/mappers';
import { SupabaseMotorcycleRepository } from '../supabase/SupabaseMotorcycleRepository';
import { generateUUID } from '@/utils/uuid';
import { logger } from '@/utils/logger';

export class OfflineFirstMotorcycleRepository implements IMotorcycleRepository {
  private fallbackCloudRepo = new SupabaseMotorcycleRepository();

  async getMotorcycles(userId: string): Promise<Motorcycle[]> {
    try {
      // 1. Read SQLite first
      const localMotos = await localMotorcycleRepository.getMotorcyclesByUserId(userId);

      if (localMotos.length > 0) {
        logger.info(`[OfflineFirstMotorcycleRepository] Returning ${localMotos.length} motorcycles from SQLite.`);
        return localMotos.map((lm) => mapLocalMotorcycleToDomain(lm));
      }

      // 2. Fetch from cloud if empty and online
      if (await networkService.isOnline()) {
        logger.info('[OfflineFirstMotorcycleRepository] Local garage empty. Fetching from Supabase...');
        const cloudMotos = await this.fallbackCloudRepo.getMotorcycles(userId);
        
        for (const cm of cloudMotos) {
          const local = mapDomainMotorcycleToLocal(cm, userId, 'SYNCED');
          await localMotorcycleRepository.saveMotorcycle(local);
        }
        return cloudMotos;
      }

      return [];
    } catch (error) {
      logger.error('[OfflineFirstMotorcycleRepository] getMotorcycles error:', error);
      return this.fallbackCloudRepo.getMotorcycles(userId);
    }
  }

  async getMotorcycleById(id: string): Promise<Motorcycle | null> {
    try {
      const local = await localMotorcycleRepository.getMotorcycleById(id, '');
      if (local) {
        return mapLocalMotorcycleToDomain(local);
      }

      if (await networkService.isOnline()) {
        return this.fallbackCloudRepo.getMotorcycleById(id);
      }

      return null;
    } catch (error) {
      logger.error('[OfflineFirstMotorcycleRepository] getMotorcycleById error:', error);
      return this.fallbackCloudRepo.getMotorcycleById(id);
    }
  }

  async createMotorcycle(userId: string, data: CreateMotorcycleDto): Promise<Motorcycle> {
    const motoId = generateUUID();
    const localMoto = mapDomainMotorcycleToLocal({ ...data, id: motoId }, userId, 'LOCAL');

    // 1. Save to SQLite immediately
    await localMotorcycleRepository.saveMotorcycle(localMoto);

    // 2. Enqueue Sync
    await localSyncRepository.enqueue('motorcycle', motoId, 'CREATE', localMoto);

    // 3. Trigger sync asynchronously
    syncService.syncNow().catch((err) => logger.warn('[OfflineFirstMotorcycleRepository] Async sync error:', err));

    logger.info(`[OfflineFirstMotorcycleRepository] Motorcycle created locally: ${motoId}`);
    return mapLocalMotorcycleToDomain(localMoto);
  }

  async updateMotorcycle(id: string, data: Partial<Motorcycle>): Promise<Motorcycle> {
    const existing = await localMotorcycleRepository.getMotorcycleById(id, data.userId || '');
    const userId = data.userId || existing?.user_id || 'local-user';

    const localMoto = mapDomainMotorcycleToLocal({ ...data, id }, userId, 'PENDING');

    // 1. Update SQLite
    await localMotorcycleRepository.saveMotorcycle(localMoto);

    // 2. Enqueue Sync
    await localSyncRepository.enqueue('motorcycle', id, 'UPDATE', localMoto);

    // 3. Trigger sync asynchronously
    syncService.syncNow().catch((err) => logger.warn('[OfflineFirstMotorcycleRepository] Async sync error:', err));

    return mapLocalMotorcycleToDomain(localMoto);
  }

  async deleteMotorcycle(id: string): Promise<void> {
    // 1. Soft delete in SQLite
    await localMotorcycleRepository.softDeleteMotorcycle(id, '');

    // 2. Enqueue Sync
    await localSyncRepository.enqueue('motorcycle', id, 'DELETE', { id });

    // 3. Trigger sync asynchronously
    syncService.syncNow().catch((err) => logger.warn('[OfflineFirstMotorcycleRepository] Async sync error:', err));
  }

  async setPrimaryMotorcycle(userId: string, id: string): Promise<void> {
    await localMotorcycleRepository.setPrimaryMotorcycle(id, userId);

    // Enqueue update sync
    const bike = await localMotorcycleRepository.getMotorcycleById(id, userId);
    if (bike) {
      await localSyncRepository.enqueue('motorcycle', id, 'UPDATE', bike);
      syncService.syncNow().catch((err) => logger.warn('[OfflineFirstMotorcycleRepository] Async sync error:', err));
    }
  }
}
