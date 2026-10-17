/**
 * Strictly typed definitions for GPS Hardware, Permissions, Tracking Engine, and Telemetry
 */

export type LocationPermissionStatus =
  | 'UNKNOWN'
  | 'NOT_REQUESTED'
  | 'GRANTED'
  | 'DENIED'
  | 'BLOCKED';

export type RideTrackingStatus =
  | 'IDLE'
  | 'STARTING'
  | 'ACTIVE'
  | 'PAUSED'
  | 'STOPPING'
  | 'COMPLETED'
  | 'ERROR';

export interface RideLocationPoint {
  id: string;
  rideId: string;
  latitude: number;
  longitude: number;
  altitude: number | null; // meters
  speed: number | null; // meters per second (m/s)
  accuracy: number | null; // meters accuracy radius
  heading: number | null; // degrees (0 - 360)
  recordedAt: string; // ISO 8601 UTC
  timestamp: number; // Unix epoch ms
}

export interface LocationValidationResult {
  isValid: boolean;
  reason?: string;
  distanceFromPrevMeters?: number;
  calculatedSpeedMps?: number;
  timeDeltaSeconds?: number;
}

export interface RideStatistics {
  totalDistanceMeters: number;
  totalDurationSeconds: number;
  movingDurationSeconds: number;
  pausedDurationSeconds: number;
  currentSpeedMps: number;
  averageSpeedMps: number;
  maxSpeedMps: number;
  elevationGainMeters: number;
  maxLeanAngleDegrees?: number;
}

export type LocationErrorCode =
  | 'PERMISSION_DENIED'
  | 'PERMISSION_BLOCKED'
  | 'SERVICES_DISABLED'
  | 'TIMEOUT'
  | 'SIGNAL_LOST'
  | 'TRACKING_FAILED'
  | 'INVALID_COORDINATE';

export interface LocationError {
  code: LocationErrorCode;
  message: string;
  recoverable: boolean;
  timestamp: number;
  originalError?: any;
}
