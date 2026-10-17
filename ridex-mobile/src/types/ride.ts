/**
 * Ride and GPS Telemetry Domain Models
 */

export interface RideLocation {
  latitude: number;
  longitude: number;
  timestamp: number;
  speedKmh: number;
  speed?: number;
  altitudeMeters: number;
  altitude?: number;
  accuracyMeters?: number;
  accuracy?: number;
  headingDegrees?: number;
  heading?: number;
}

export interface RideStatistics {
  distanceKm: number;
  durationSeconds: number;
  averageSpeedKmh: number;
  maxSpeedKmh: number;
  elevationGainMeters: number;
  maxLeanAngleDegrees?: number;
}

export interface Ride {
  id: string;
  userId?: string;
  motorcycleId: string;
  motorcycleName?: string;
  title: string;
  name?: string;
  startTime: string;
  endTime?: string;
  distanceKm: number;
  durationSeconds: number;
  averageSpeedKmh: number;
  maxSpeedKmh: number;
  elevationGainMeters: number;
  maxLeanAngleDegrees?: number;
  startLocationName?: string;
  endLocationName?: string;
  type?: 'SOLO' | 'GROUP' | 'COMMUTE' | 'TRACK';
  routeCoordinates?: [number, number][];
  coordinates?: RideLocation[];
  status?: 'active' | 'completed' | 'paused' | 'cancelled';
  thumbnailUrl?: string;
  isPublic?: boolean;
}
