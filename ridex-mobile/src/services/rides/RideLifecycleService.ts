import { LocalRide } from '../database/databaseTypes';
import { Ride } from '@/types/ride';
import { localRideRepository } from '../database/repositories/LocalRideRepository';
import { localRideLocationRepository } from '../database/repositories/LocalRideLocationRepository';
import { localSyncRepository } from '../database/repositories/LocalSyncRepository';
import { rideTrackingEngine } from '../location/RideTrackingEngine';
import { locationService } from '../location/LocationService';
import { syncService } from '../offline/SyncService';
import { mapLocalRideToDomain } from '../database/mappers';
import { useAuthStore } from '@/store/authStore';
import { generateUUID } from '@/utils/uuid';
import { mpsToKmh, metersToKm } from '@/utils/geo';
import { logger } from '@/utils/logger';

export interface StartRideParams {
  motorcycleId?: string | null;
  name?: string;
  visibility?: 'PUBLIC' | 'PRIVATE' | 'UNLISTED';
}

export class RideLifecycleService {
  private static instance: RideLifecycleService | null = null;

  private constructor() {}

  public static getInstance(): RideLifecycleService {
    if (!RideLifecycleService.instance) {
      RideLifecycleService.instance = new RideLifecycleService();
    }
    return RideLifecycleService.instance;
  }

  /**
   * Initiates a new ride session locally first.
   */
  public async startRide(params: StartRideParams = {}): Promise<Ride | null> {
    const user = useAuthStore.getState().user;
    const userId = user?.id || 'local-rider';

    const rideId = generateUUID();
    const startTimeIso = new Date().toISOString();
    const startTimeMs = Date.now();

    logger.info(`[RideLifecycleService] Starting ride ${rideId} for user ${userId}...`);

    // Capture initial location snapshot if available
    const initialPos = await locationService.getCurrentPosition();

    // 1. Create ride in local SQLite store
    const localRide: LocalRide = {
      id: rideId,
      user_id: userId,
      motorcycle_id: params.motorcycleId || null,
      name: params.name || 'Motorcycle Ride',
      start_time: startTimeIso,
      end_time: null,
      distance_meters: 0,
      duration_seconds: 0,
      average_speed: 0,
      max_speed: 0,
      elevation_gain: 0,
      max_lean_angle: null,
      start_latitude: initialPos?.latitude || null,
      start_longitude: initialPos?.longitude || null,
      end_latitude: null,
      end_longitude: null,
      status: 'IN_PROGRESS',
      visibility: params.visibility || 'PUBLIC',
      created_at: startTimeIso,
      updated_at: startTimeIso,
      deleted_at: null,
      sync_status: 'LOCAL',
      synced_at: null,
      version: 1,
    };

    await localRideRepository.saveRide(localRide);

    // 2. Start GPS Tracking Engine
    const started = await rideTrackingEngine.start(rideId, startTimeMs);
    if (!started) {
      logger.error('[RideLifecycleService] Failed to initialize GPS tracking engine.');
      return null;
    }

    logger.info(`[RideLifecycleService] Ride ${rideId} successfully created and active.`);
    return mapLocalRideToDomain(localRide);
  }

  /**
   * Pauses the active ride.
   */
  public async pauseRide(): Promise<void> {
    const activeRideId = rideTrackingEngine.getActiveRideId();
    if (!activeRideId) return;

    await rideTrackingEngine.pause();

    const existing = await localRideRepository.getRideById(activeRideId, '');
    if (existing) {
      await localRideRepository.saveRide({
        ...existing,
        status: 'PAUSED',
        updated_at: new Date().toISOString(),
      });
    }
    logger.info(`[RideLifecycleService] Ride ${activeRideId} paused.`);
  }

  /**
   * Resumes a paused ride.
   */
  public async resumeRide(): Promise<void> {
    const activeRideId = rideTrackingEngine.getActiveRideId();
    if (!activeRideId) return;

    await rideTrackingEngine.resume();

    const existing = await localRideRepository.getRideById(activeRideId, '');
    if (existing) {
      await localRideRepository.saveRide({
        ...existing,
        status: 'IN_PROGRESS',
        updated_at: new Date().toISOString(),
      });
    }
    logger.info(`[RideLifecycleService] Ride ${activeRideId} resumed.`);
  }

  /**
   * Completes and finalizes the ride, committing all statistics to SQLite and queuing sync.
   */
  public async stopRide(): Promise<Ride | null> {
    const activeRideId = rideTrackingEngine.getActiveRideId();
    if (!activeRideId) return null;

    logger.info(`[RideLifecycleService] Finalizing ride ${activeRideId}...`);

    // 1. Stop engine and retrieve final computed statistics
    const finalStats = await rideTrackingEngine.stop();

    // 2. Load existing record and locations
    const existingRide = await localRideRepository.getRideById(activeRideId, '');
    const locations = await localRideLocationRepository.getLocationsByRideId(activeRideId);

    const endTimeIso = new Date().toISOString();
    const lastLoc = locations.length > 0 ? locations[locations.length - 1] : null;
    const firstLoc = locations.length > 0 ? locations[0] : null;

    const finalizedLocalRide: LocalRide = {
      id: activeRideId,
      user_id: existingRide?.user_id || 'local-rider',
      motorcycle_id: existingRide?.motorcycle_id || null,
      name: existingRide?.name || 'Completed Motorcycle Tour',
      start_time: existingRide?.start_time || new Date().toISOString(),
      end_time: endTimeIso,
      distance_meters: finalStats.totalDistanceMeters,
      duration_seconds: finalStats.totalDurationSeconds,
      average_speed: mpsToKmh(finalStats.averageSpeedMps),
      max_speed: mpsToKmh(finalStats.maxSpeedMps),
      elevation_gain: finalStats.elevationGainMeters,
      max_lean_angle: finalStats.maxLeanAngleDegrees || null,
      start_latitude: firstLoc?.latitude || existingRide?.start_latitude || null,
      start_longitude: firstLoc?.longitude || existingRide?.start_longitude || null,
      end_latitude: lastLoc?.latitude || null,
      end_longitude: lastLoc?.longitude || null,
      status: 'COMPLETED',
      visibility: existingRide?.visibility || 'PUBLIC',
      created_at: existingRide?.created_at || new Date().toISOString(),
      updated_at: endTimeIso,
      deleted_at: null,
      sync_status: 'PENDING',
      synced_at: null,
      version: 1,
    };

    // 3. Save finalized state to SQLite
    await localRideRepository.saveRide(finalizedLocalRide);

    // 4. Enqueue Sync Operation
    await localSyncRepository.enqueue('ride', activeRideId, 'CREATE', finalizedLocalRide);

    if (locations.length > 0) {
      await localSyncRepository.enqueue('ride_location', activeRideId, 'CREATE', locations);
    }

    // 5. Asynchronously trigger background sync if online
    syncService.syncNow().catch((err) =>
      logger.warn('[RideLifecycleService] Background cloud sync skipped:', err)
    );

    logger.info(`[RideLifecycleService] Ride ${activeRideId} saved locally with ${locations.length} GPS breadcrumbs.`);
    return mapLocalRideToDomain(finalizedLocalRide, locations);
  }
}

export const rideLifecycleService = RideLifecycleService.getInstance();
