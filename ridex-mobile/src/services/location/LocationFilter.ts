import { RideLocationPoint, LocationValidationResult } from './locationTypes';
import { LocationConfig, DEFAULT_LOCATION_CONFIG } from '@/config/location';
import { calculateHaversineDistance, isValidCoordinate } from '@/utils/geo';
import { logger } from '@/utils/logger';

export class LocationFilter {
  private config: LocationConfig;

  constructor(config: LocationConfig = DEFAULT_LOCATION_CONFIG) {
    this.config = config;
  }

  public setConfig(config: LocationConfig) {
    this.config = config;
  }

  /**
   * Evaluates a raw incoming GPS coordinate point against the multi-stage filter pipeline.
   *
   * @param point The newly received GPS point
   * @param previousPoint The previous valid baseline GPS point
   */
  public filterPoint(
    point: RideLocationPoint,
    previousPoint: RideLocationPoint | null
  ): LocationValidationResult {
    // -------------------------------------------------------------
    // STAGE 1: COORDINATE INTEGRITY & BOUNDS CHECK
    // -------------------------------------------------------------
    if (!isValidCoordinate(point.latitude, point.longitude)) {
      return {
        isValid: false,
        reason: `Invalid coordinate bounds or Null Island detected: (${point.latitude}, ${point.longitude})`,
      };
    }

    // -------------------------------------------------------------
    // STAGE 2: TIMESTAMP SANITY CHECK
    // -------------------------------------------------------------
    const now = Date.now();
    if (!point.timestamp || point.timestamp <= 0 || point.timestamp > now + 60000) {
      return {
        isValid: false,
        reason: `Invalid or future timestamp: ${point.timestamp} (current: ${now})`,
      };
    }

    if (previousPoint && point.timestamp < previousPoint.timestamp) {
      return {
        isValid: false,
        reason: `Out-of-order GPS packet: point timestamp (${point.timestamp}) < previous (${previousPoint.timestamp})`,
      };
    }

    // -------------------------------------------------------------
    // STAGE 3: GPS ACCURACY THRESHOLD CHECK
    // -------------------------------------------------------------
    if (
      point.accuracy !== null &&
      point.accuracy > this.config.maxAcceptableAccuracyMeters
    ) {
      return {
        isValid: false,
        reason: `GPS accuracy too poor: ${point.accuracy.toFixed(1)}m (max acceptable: ${this.config.maxAcceptableAccuracyMeters}m)`,
      };
    }

    // If this is the very first point of the ride or after baseline reset
    if (!previousPoint) {
      return {
        isValid: true,
        distanceFromPrevMeters: 0,
        calculatedSpeedMps: point.speed || 0,
        timeDeltaSeconds: 0,
      };
    }

    // -------------------------------------------------------------
    // STAGE 4: DISTANCE & TIME DELTA CALCULATIONS
    // -------------------------------------------------------------
    const distanceMeters = calculateHaversineDistance(
      previousPoint.latitude,
      previousPoint.longitude,
      point.latitude,
      point.longitude
    );

    const timeDeltaMs = point.timestamp - previousPoint.timestamp;
    const timeDeltaSeconds = timeDeltaMs > 0 ? timeDeltaMs / 1000 : 0.001;

    // Derived velocity between points
    const calculatedSpeedMps = distanceMeters / timeDeltaSeconds;

    // -------------------------------------------------------------
    // STAGE 5: GPS DRIFT & IMPOSSIBLE JUMP CHECK
    // -------------------------------------------------------------
    if (calculatedSpeedMps > this.config.maxReasonableSpeedMps) {
      logger.warn(
        `[LocationFilter] Rejected GPS teleportation jump! Distance: ${distanceMeters.toFixed(1)}m in ${timeDeltaSeconds.toFixed(1)}s (Speed: ${(calculatedSpeedMps * 3.6).toFixed(1)} km/h)`
      );
      return {
        isValid: false,
        reason: `Impossible speed/jump detected: ${(calculatedSpeedMps * 3.6).toFixed(1)} km/h exceeds limit of ${(this.config.maxReasonableSpeedMps * 3.6).toFixed(1)} km/h`,
        distanceFromPrevMeters: distanceMeters,
        calculatedSpeedMps,
        timeDeltaSeconds,
      };
    }

    // -------------------------------------------------------------
    // STAGE 6: STATIONARY JITTER / SMALL NOISE FILTER
    // -------------------------------------------------------------
    if (distanceMeters < this.config.minMovementThresholdMeters) {
      // Coordinate is legitimate, but motorcycle is stationary; accumulate 0 distance to avoid odometer creep
      return {
        isValid: true,
        distanceFromPrevMeters: 0,
        calculatedSpeedMps: 0,
        timeDeltaSeconds,
      };
    }

    // -------------------------------------------------------------
    // ALL CHECKS PASSED: VALID ACTIVE MOVEMENT POINT
    // -------------------------------------------------------------
    return {
      isValid: true,
      distanceFromPrevMeters: distanceMeters,
      calculatedSpeedMps,
      timeDeltaSeconds,
    };
  }
}

export const locationFilter = new LocationFilter();
