import { LocalRide, LocalMotorcycle, LocalProfile, LocalRideLocation } from '../database/databaseTypes';
import { logger } from '@/utils/logger';

export type ConflictResolutionType = 'LOCAL_WINS' | 'REMOTE_WINS' | 'MERGED';

export interface ConflictResolutionResult<T> {
  resolution: ConflictResolutionType;
  resolvedData: T;
  reason: string;
}

export class ConflictResolver {
  /**
   * Resolve conflict between local profile and cloud profile.
   * Compares ISO updated_at timestamps (Last-Write-Wins for basic profile attributes).
   */
  static resolveProfile(
    local: LocalProfile,
    remote: LocalProfile
  ): ConflictResolutionResult<LocalProfile> {
    const localTime = new Date(local.updated_at).getTime();
    const remoteTime = new Date(remote.updated_at).getTime();

    if (localTime >= remoteTime) {
      logger.info(`[ConflictResolver] Profile ${local.id}: Local is newer or equal. LOCAL_WINS.`);
      return {
        resolution: 'LOCAL_WINS',
        resolvedData: local,
        reason: 'Local timestamp is more recent than cloud record.',
      };
    }

    logger.info(`[ConflictResolver] Profile ${local.id}: Remote is newer. REMOTE_WINS.`);
    return {
      resolution: 'REMOTE_WINS',
      resolvedData: remote,
      reason: 'Cloud timestamp is more recent than local record.',
    };
  }

  /**
   * Resolve conflict between local motorcycle and cloud motorcycle.
   */
  static resolveMotorcycle(
    local: LocalMotorcycle,
    remote: LocalMotorcycle
  ): ConflictResolutionResult<LocalMotorcycle> {
    // If one is deleted, respect the deletion
    if (local.deleted_at || remote.deleted_at) {
      const deletedAt = local.deleted_at || remote.deleted_at;
      return {
        resolution: 'MERGED',
        resolvedData: {
          ...(local.updated_at > remote.updated_at ? local : remote),
          deleted_at: deletedAt,
        },
        reason: 'Preserved deletion across sync.',
      };
    }

    const localTime = new Date(local.updated_at).getTime();
    const remoteTime = new Date(remote.updated_at).getTime();

    // Preserve the highest odometer reading to prevent mileage rollback
    const maxOdometer = Math.max(local.odometer_km, remote.odometer_km);

    if (localTime >= remoteTime) {
      return {
        resolution: 'LOCAL_WINS',
        resolvedData: { ...local, odometer_km: maxOdometer },
        reason: 'Local timestamp is newer; preserved max odometer.',
      };
    }

    return {
      resolution: 'REMOTE_WINS',
      resolvedData: { ...remote, odometer_km: maxOdometer },
      reason: 'Remote timestamp is newer; preserved max odometer.',
    };
  }

  /**
   * Resolve conflict between local ride and cloud ride.
   * Compares versions and timestamps, while guaranteeing no data truncation.
   */
  static resolveRide(
    local: LocalRide,
    remote: LocalRide
  ): ConflictResolutionResult<LocalRide> {
    // Highest version takes precedence
    if ((local.version || 1) > (remote.version || 1)) {
      return {
        resolution: 'LOCAL_WINS',
        resolvedData: local,
        reason: `Local version (${local.version}) is higher than remote (${remote.version}).`,
      };
    }

    if ((remote.version || 1) > (local.version || 1)) {
      return {
        resolution: 'REMOTE_WINS',
        resolvedData: remote,
        reason: `Remote version (${remote.version}) is higher than local (${local.version}).`,
      };
    }

    // If versions are identical, compare timestamps
    const localTime = new Date(local.updated_at).getTime();
    const remoteTime = new Date(remote.updated_at).getTime();

    if (localTime >= remoteTime) {
      return {
        resolution: 'LOCAL_WINS',
        resolvedData: local,
        reason: 'Equal versions, local timestamp is newer.',
      };
    }

    return {
      resolution: 'REMOTE_WINS',
      resolvedData: remote,
      reason: 'Equal versions, remote timestamp is newer.',
    };
  }

  /**
   * GPS Conflict Rule: Never overwrite GPS location breadcrumbs destructively.
   * Merges location points by timestamp and unique coordinates, maintaining strict chronological order.
   */
  static mergeRideLocations(
    localLocations: LocalRideLocation[],
    remoteLocations: LocalRideLocation[]
  ): LocalRideLocation[] {
    const locationMap = new Map<string, LocalRideLocation>();

    // Add all local locations
    for (const loc of localLocations) {
      const key = `${loc.latitude.toFixed(6)}_${loc.longitude.toFixed(6)}_${loc.recorded_at}`;
      locationMap.set(key, loc);
    }

    // Merge remote locations non-destructively
    for (const loc of remoteLocations) {
      const key = `${loc.latitude.toFixed(6)}_${loc.longitude.toFixed(6)}_${loc.recorded_at}`;
      if (!locationMap.has(key)) {
        locationMap.set(key, loc);
      }
    }

    // Sort strictly chronologically
    return Array.from(locationMap.values()).sort(
      (a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime()
    );
  }
}
