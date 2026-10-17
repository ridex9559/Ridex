import { IRideRepository } from '../interfaces/IRideRepository';
import { Ride, RideLocation } from '@/types/ride';
import { localRideRepository } from '@/services/database/repositories/LocalRideRepository';
import { localRideLocationRepository } from '@/services/database/repositories/LocalRideLocationRepository';
import { localSyncRepository } from '@/services/database/repositories/LocalSyncRepository';
import { syncService } from '@/services/offline/SyncService';
import { networkService } from '@/services/offline/NetworkService';
import {
  mapLocalRideToDomain,
  mapDomainRideToLocal,
  mapDomainRideLocationToLocal,
  mapLocalRideLocationToDomain,
} from '@/services/database/mappers';
import { SupabaseRideRepository } from '../supabase/SupabaseRideRepository';
import { generateUUID } from '@/utils/uuid';
import { logger } from '@/utils/logger';

export class OfflineFirstRideRepository implements IRideRepository {
  private fallbackCloudRepo = new SupabaseRideRepository();

  async getRides(userId: string, limit = 20, offset = 0): Promise<Ride[]> {
    try {
      // 1. Read Local SQLite first
      const localRides = await localRideRepository.getRidesByUserId(userId, limit, offset);

      if (localRides.length > 0) {
        logger.info(`[OfflineFirstRideRepository] Returning ${localRides.length} rides from local SQLite.`);
        
        // Trigger non-blocking cloud sync in background if online
        if (await networkService.isOnline()) {
          syncService.syncNow().catch((err) => logger.warn('[OfflineFirstRideRepository] Background sync error:', err));
        }

        return localRides.map((lr) => mapLocalRideToDomain(lr));
      }

      // 2. If no local rides and device is online, fetch from Supabase and cache locally
      if (await networkService.isOnline()) {
        logger.info('[OfflineFirstRideRepository] Local store empty. Fetching initial rides from Supabase...');
        const cloudRides = await this.fallbackCloudRepo.getRides(userId, limit, offset);
        
        for (const cr of cloudRides) {
          const local = mapDomainRideToLocal(cr, userId, 'SYNCED');
          await localRideRepository.saveRide(local);
        }
        return cloudRides;
      }

      return [];
    } catch (error) {
      logger.error('[OfflineFirstRideRepository] getRides error, fallback to cloud:', error);
      return this.fallbackCloudRepo.getRides(userId, limit, offset);
    }
  }

  async getRideById(id: string): Promise<Ride | null> {
    try {
      // Find ride in local store
      const allMatching = await localRideRepository.getRideById(id, '');
      const local = allMatching;
      if (local) {
        const locations = await localRideLocationRepository.getLocationsByRideId(id);
        return mapLocalRideToDomain(local, locations);
      }

      // Fallback to cloud if online
      if (await networkService.isOnline()) {
        return this.fallbackCloudRepo.getRideById(id);
      }

      return null;
    } catch (error) {
      logger.error('[OfflineFirstRideRepository] getRideById error:', error);
      return this.fallbackCloudRepo.getRideById(id);
    }
  }

  async createRide(ride: Partial<Ride>): Promise<Ride> {
    const rideId = ride.id || generateUUID();
    const userId = ride.userId || 'local-user';

    const localRide = mapDomainRideToLocal({ ...ride, id: rideId }, userId, 'LOCAL');
    
    // 1. Save to SQLite immediately
    await localRideRepository.saveRide(localRide);

    // 2. Enqueue Sync Operation
    await localSyncRepository.enqueue('ride', rideId, 'CREATE', localRide);

    // 3. Save telemetry if coordinates provided
    if (ride.coordinates && ride.coordinates.length > 0) {
      const localLocations = ride.coordinates.map((c) => mapDomainRideLocationToLocal(c, rideId, 'LOCAL'));
      await localRideLocationRepository.saveBatchLocations(localLocations);
      await localSyncRepository.enqueue('ride_location', rideId, 'CREATE', localLocations);
    }

    // 4. Trigger sync asynchronously without awaiting
    syncService.syncNow().catch((err) => logger.warn('[OfflineFirstRideRepository] Async sync error:', err));

    logger.info(`[OfflineFirstRideRepository] Ride created locally: ${rideId}`);
    return mapLocalRideToDomain(localRide);
  }

  async updateRide(id: string, ride: Partial<Ride>): Promise<Ride> {
    const existing = await localRideRepository.getRideById(id, ride.userId || '');
    const currentVersion = existing ? (existing.version || 1) + 1 : 1;
    const userId = ride.userId || existing?.user_id || 'local-user';

    const updatedLocal = mapDomainRideToLocal({ ...ride, id }, userId, 'PENDING');
    updatedLocal.version = currentVersion;

    // 1. Update SQLite
    await localRideRepository.saveRide(updatedLocal);

    // 2. Enqueue Sync Operation
    await localSyncRepository.enqueue('ride', id, 'UPDATE', updatedLocal);

    // 3. Trigger sync asynchronously
    syncService.syncNow().catch((err) => logger.warn('[OfflineFirstRideRepository] Async sync error:', err));

    return mapLocalRideToDomain(updatedLocal);
  }

  async deleteRide(id: string): Promise<void> {
    // 1. Soft delete in SQLite
    await localRideRepository.softDeleteRide(id, '');

    // 2. Enqueue Sync Operation
    await localSyncRepository.enqueue('ride', id, 'DELETE', { id });

    // 3. Trigger sync asynchronously
    syncService.syncNow().catch((err) => logger.warn('[OfflineFirstRideRepository] Async sync error:', err));
  }

  async saveRideTelemetry(rideId: string, locations: RideLocation[]): Promise<void> {
    if (!locations || locations.length === 0) return;

    // 1. Save to SQLite in high-performance batch
    const localLocations = locations.map((loc) => mapDomainRideLocationToLocal(loc, rideId, 'LOCAL'));
    await localRideLocationRepository.saveBatchLocations(localLocations);

    // 2. Enqueue telemetry sync
    await localSyncRepository.enqueue('ride_location', rideId, 'CREATE', localLocations);

    // 3. Trigger sync asynchronously
    syncService.syncNow().catch((err) => logger.warn('[OfflineFirstRideRepository] Async telemetry sync error:', err));
  }

  async getRideTelemetry(rideId: string): Promise<RideLocation[]> {
    const localLocs = await localRideLocationRepository.getLocationsByRideId(rideId);
    if (localLocs.length > 0) {
      return localLocs.map(mapLocalRideLocationToDomain);
    }

    if (await networkService.isOnline()) {
      return this.fallbackCloudRepo.getRideTelemetry(rideId);
    }

    return [];
  }
}
