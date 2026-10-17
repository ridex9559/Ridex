import { LocalRide } from '../database/databaseTypes';
import { localRideRepository } from '../database/repositories/LocalRideRepository';
import { localRideLocationRepository } from '../database/repositories/LocalRideLocationRepository';
import { localSyncRepository } from '../database/repositories/LocalSyncRepository';
import { rideTrackingEngine } from './RideTrackingEngine';
import { syncService } from '../offline/SyncService';
import { useRideTrackingStore } from '@/store/rideTrackingStore';
import { metersToKm } from '@/utils/geo';
import { logger } from '@/utils/logger';

export class RideRecoveryService {
  private static instance: RideRecoveryService | null = null;

  private constructor() {}

  public static getInstance(): RideRecoveryService {
    if (!RideRecoveryService.instance) {
      RideRecoveryService.instance = new RideRecoveryService();
    }
    return RideRecoveryService.instance;
  }

  /**
   * Checks if there is an unfinished active ride that survived an unexpected app termination.
   */
  public async checkForActiveRide(userId: string): Promise<LocalRide | null> {
    try {
      const activeRide = await localRideRepository.getActiveRide(userId);
      if (activeRide) {
        logger.info(`[RideRecoveryService] Detected recoverable unfinished ride: ${activeRide.id}`);
        return activeRide;
      }
      return null;
    } catch (error) {
      logger.error('[RideRecoveryService] Error checking for active ride:', error);
      return null;
    }
  }

  /**
   * Resumes an interrupted ride session and restarts the tracking engine.
   */
  public async resumeRecoveredRide(ride: LocalRide): Promise<boolean> {
    logger.info(`[RideRecoveryService] Resuming recovered ride: ${ride.id}`);

    const locations = await localRideLocationRepository.getLocationsByRideId(ride.id);
    const lastLoc = locations.length > 0 ? locations[locations.length - 1] : null;

    useRideTrackingStore.getState().setTrackingState({
      activeRideId: ride.id,
      status: 'ACTIVE',
      isTracking: true,
      isPaused: false,
      startTimeMs: new Date(ride.start_time).getTime(),
      distanceMeters: ride.distance_meters,
      distanceKm: metersToKm(ride.distance_meters),
      durationSeconds: ride.duration_seconds,
      currentSpeedKmh: 0,
      maxSpeedKmh: ride.max_speed,
      avgSpeedKmh: ride.average_speed,
      elevationGainMeters: ride.elevation_gain,
      currentLocation: lastLoc
        ? {
            id: lastLoc.id,
            rideId: ride.id,
            latitude: lastLoc.latitude,
            longitude: lastLoc.longitude,
            altitude: lastLoc.altitude,
            speed: lastLoc.speed,
            accuracy: lastLoc.accuracy,
            heading: lastLoc.heading,
            recordedAt: lastLoc.recorded_at,
            timestamp: new Date(lastLoc.recorded_at).getTime(),
          }
        : null,
      error: null,
    });

    return await rideTrackingEngine.start(ride.id, new Date(ride.start_time).getTime());
  }

  /**
   * Finishes an interrupted ride without resuming tracking.
   */
  public async finishRecoveredRide(ride: LocalRide): Promise<void> {
    logger.info(`[RideRecoveryService] Finalizing recovered ride: ${ride.id}`);
    const endTime = new Date().toISOString();

    const finalized: LocalRide = {
      ...ride,
      status: 'COMPLETED',
      end_time: endTime,
      updated_at: endTime,
      sync_status: 'PENDING',
    };

    await localRideRepository.saveRide(finalized);
    await localSyncRepository.enqueue('ride', ride.id, 'CREATE', finalized);

    syncService.syncNow().catch(() => {});
    useRideTrackingStore.getState().resetTracking();
  }

  /**
   * Discards an accidental or incomplete ghost ride.
   */
  public async discardRecoveredRide(rideId: string): Promise<void> {
    logger.info(`[RideRecoveryService] Discarding recovered ride: ${rideId}`);
    await localRideRepository.hardDeleteRide(rideId);
    useRideTrackingStore.getState().resetTracking();
  }
}

export const rideRecoveryService = RideRecoveryService.getInstance();
