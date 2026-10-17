/**
 * Ride Tracking Engine Configurations
 * Buffering, batch persistence, and state management rules.
 */

export interface RideTrackingConfig {
  /** Maximum number of GPS location points buffered in memory before flushing to SQLite */
  bufferBatchSize: number;
  /** Maximum duration in milliseconds to hold unpersisted points in memory before forcing a flush */
  bufferFlushIntervalMs: number;
  /** UI HUD update throttle in milliseconds (to ensure smooth rendering without frame drops) */
  uiUpdateThrottleMs: number;
  /** Maximum allowable pause gap before prompting the rider */
  autoPauseDetectionThresholdSpeedMps: number;
  /** Minimum duration in seconds required for a ride to be saved (prevents accidental 0-second ghost rides) */
  minRideDurationSeconds: number;
  /** Minimum distance in meters required for a ride to be saved */
  minRideDistanceMeters: number;
}

export const DEFAULT_RIDE_TRACKING_CONFIG: RideTrackingConfig = {
  bufferBatchSize: 10, // Batch write every 10 GPS breadcrumbs
  bufferFlushIntervalMs: 5000, // Or at least every 5 seconds
  uiUpdateThrottleMs: 250, // 4 FPS HUD refresh rate for battery & smooth animations
  autoPauseDetectionThresholdSpeedMps: 0.5, // Below ~1.8 km/h considered stationary
  minRideDurationSeconds: 10, // At least 10 seconds
  minRideDistanceMeters: 50, // At least 50 meters
};
