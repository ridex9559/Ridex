/**
 * GPS Location Hardware & Sensor Configurations
 * Centralized settings for accuracy, intervals, thresholds, and power modes.
 */

export interface LocationConfig {
  /** Desired location accuracy level (Expo LocationAccuracy enum value) */
  accuracy: number;
  /** Minimum time interval between updates in milliseconds */
  timeIntervalMs: number;
  /** Minimum distance in meters before an update is emitted by hardware */
  distanceIntervalMeters: number;
  /** Maximum acceptable accuracy radius in meters before a point is rejected */
  maxAcceptableAccuracyMeters: number;
  /** Minimum distance in meters between consecutive points to filter stationary jitter */
  minMovementThresholdMeters: number;
  /** Maximum realistic speed for a motorcycle in m/s (~306 km/h) to filter GPS teleportation jumps */
  maxReasonableSpeedMps: number;
}

export const LOCATION_CONFIGS = {
  /** High accuracy configuration optimized for winding mountain tours and precise route mapping */
  HIGH_ACCURACY: {
    accuracy: 5, // LocationAccuracy.High
    timeIntervalMs: 1000, // 1 second
    distanceIntervalMeters: 2, // 2 meters
    maxAcceptableAccuracyMeters: 30, // 30 meters
    minMovementThresholdMeters: 2.5, // 2.5 meters
    maxReasonableSpeedMps: 85, // ~306 km/h
  },

  /** Balanced configuration for all-day touring battery longevity */
  BALANCED: {
    accuracy: 4, // LocationAccuracy.Balanced
    timeIntervalMs: 2500, // 2.5 seconds
    distanceIntervalMeters: 5, // 5 meters
    maxAcceptableAccuracyMeters: 45, // 45 meters
    minMovementThresholdMeters: 4.0,
    maxReasonableSpeedMps: 85,
  },

  /** Battery saver mode for long straight highway corridors */
  POWER_SAVING: {
    accuracy: 3, // LocationAccuracy.Low
    timeIntervalMs: 5000, // 5 seconds
    distanceIntervalMeters: 10,
    maxAcceptableAccuracyMeters: 60,
    minMovementThresholdMeters: 8.0,
    maxReasonableSpeedMps: 85,
  },
} as const;

export const DEFAULT_LOCATION_CONFIG: LocationConfig = LOCATION_CONFIGS.HIGH_ACCURACY;
