/**
 * Haversine Great-Circle Distance Formula
 * Computes the exact geodesic distance between two latitude/longitude pairs on Earth.
 *
 * All calculations return distance strictly in METERS.
 */

const EARTH_RADIUS_METERS = 6371008.8; // Mean Earth Radius (WGS 84 ellipsoid mean radius)

export interface GeoPoint {
  latitude: number;
  longitude: number;
}

/**
 * Converts degrees to radians.
 */
function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Calculates the great-circle distance between two points on the Earth's surface.
 *
 * @param lat1 Latitude of point 1 in decimal degrees
 * @param lon1 Longitude of point 1 in decimal degrees
 * @param lat2 Latitude of point 2 in decimal degrees
 * @param lon2 Longitude of point 2 in decimal degrees
 * @returns Geodesic distance in METERS
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  // If points are identical, distance is zero
  if (lat1 === lat2 && lon1 === lon2) {
    return 0;
  }

  const phi1 = toRadians(lat1);
  const phi2 = toRadians(lat2);
  const deltaPhi = toRadians(lat2 - lat1);
  const deltaLambda = toRadians(lon2 - lon1);

  const sinDeltaPhiHalf = Math.sin(deltaPhi / 2);
  const sinDeltaLambdaHalf = Math.sin(deltaLambda / 2);

  const a =
    sinDeltaPhiHalf * sinDeltaPhiHalf +
    Math.cos(phi1) * Math.cos(phi2) * sinDeltaLambdaHalf * sinDeltaLambdaHalf;

  // Clamping to [0, 1] to prevent NaN resulting from floating point rounding errors
  const clampedA = Math.max(0, Math.min(1, a));
  const c = 2 * Math.atan2(Math.sqrt(clampedA), Math.sqrt(1 - clampedA));

  return EARTH_RADIUS_METERS * c;
}

/**
 * Convenience overload accepting GeoPoint objects.
 */
export function calculatePointDistance(p1: GeoPoint, p2: GeoPoint): number {
  return calculateHaversineDistance(p1.latitude, p1.longitude, p2.latitude, p2.longitude);
}
