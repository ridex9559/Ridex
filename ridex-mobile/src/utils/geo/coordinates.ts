/**
 * Geographic Coordinate Validation, Bearing & Format Utilities
 */

import { GeoPoint } from './haversine';

/**
 * Validates that latitude and longitude are valid non-null numbers within geographic bounds.
 */
export function isValidLatLonCoordinate(latitude: any, longitude: any): boolean {
  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    return false;
  }
  if (isNaN(latitude) || isNaN(longitude)) {
    return false;
  }
  if (!isFinite(latitude) || !isFinite(longitude)) {
    return false;
  }
  if (latitude < -90 || latitude > 90) {
    return false;
  }
  if (longitude < -180 || longitude > 180) {
    return false;
  }
  // Filter out exact (0, 0) "Null Island" coordinates which often indicate uninitialized GPS chipsets
  if (latitude === 0 && longitude === 0) {
    return false;
  }
  return true;
}

/**
 * Calculates initial compass bearing / heading in degrees (0° - 360°) from point 1 to point 2.
 */
export function calculateBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const y = Math.sin(deltaLambda) * Math.cos(phi2);
  const x =
    Math.cos(phi1) * Math.sin(phi2) -
    Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);

  const theta = Math.atan2(y, x);
  const bearing = (theta * 180) / Math.PI;

  return (bearing + 360) % 360;
}

/**
 * Converts meters per second (m/s) to kilometers per hour (km/h).
 */
export function mpsToKmh(speedMps: number): number {
  if (isNaN(speedMps) || speedMps < 0) return 0;
  return speedMps * 3.6;
}

/**
 * Converts kilometers per hour (km/h) to meters per second (m/s).
 */
export function kmhToMps(speedKmh: number): number {
  if (isNaN(speedKmh) || speedKmh < 0) return 0;
  return speedKmh / 3.6;
}

/**
 * Converts meters to kilometers formatted as a rounded float.
 */
export function metersToKm(meters: number): number {
  if (isNaN(meters) || meters < 0) return 0;
  return parseFloat((meters / 1000).toFixed(2));
}
