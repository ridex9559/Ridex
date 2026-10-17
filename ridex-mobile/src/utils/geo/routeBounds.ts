/**
 * RIDEX — Route Bounds & Bounding Box Utilities
 * Calculates geographic boundaries, centers, and aspect-ratio adjusted spans
 * with fail-safe protection for empty, single-point, and multi-point routes.
 */

import { MapCoordinate, MapPadding, MapRegion, RouteBounds } from '../../services/maps/mapTypes';
import { MAP_CONFIG } from '../../config/maps';

/**
 * Universal Coordinate Validator: Supports both object `{ latitude, longitude }` and `(lat, lng)` arguments.
 */
export function isValidCoordinate(first: any, second?: any): boolean {
  let lat: number;
  let lng: number;

  if (second !== undefined) {
    if (first === null || second === null) return false;
    lat = typeof first === 'string' ? parseFloat(first) : Number(first);
    lng = typeof second === 'string' ? parseFloat(second) : Number(second);
  } else {
    if (!first || typeof first !== 'object') return false;
    if (first.latitude === null || first.latitude === undefined) return false;
    if (first.longitude === null || first.longitude === undefined) return false;
    lat = typeof first.latitude === 'string' ? parseFloat(first.latitude) : Number(first.latitude);
    lng = typeof first.longitude === 'string' ? parseFloat(first.longitude) : Number(first.longitude);
  }

  if (isNaN(lat) || isNaN(lng)) return false;
  if (!isFinite(lat) || !isFinite(lng)) return false;
  if (lat < -90 || lat > 90) return false;
  if (lng < -180 || lng > 180) return false;

  // Filter out exact (0, 0) "Null Island" coordinates
  if (lat === 0 && lng === 0) return false;

  return true;
}

/**
 * Calculates the bounding box and span for an array of coordinates.
 * Handles empty, single-point, and multi-point coordinate sets safely.
 */
export function calculateRouteBounds(
  coordinates: MapCoordinate[],
  paddingFactor = 1.3
): RouteBounds {
  // 1. Handle empty / invalid coordinates
  const validCoords = coordinates.filter((c) => isValidCoordinate(c));

  if (validCoords.length === 0) {
    return {
      minLatitude: MAP_CONFIG.DEFAULT_REGION.latitude - MAP_CONFIG.DEFAULT_REGION.latitudeDelta / 2,
      maxLatitude: MAP_CONFIG.DEFAULT_REGION.latitude + MAP_CONFIG.DEFAULT_REGION.latitudeDelta / 2,
      minLongitude: MAP_CONFIG.DEFAULT_REGION.longitude - MAP_CONFIG.DEFAULT_REGION.longitudeDelta / 2,
      maxLongitude: MAP_CONFIG.DEFAULT_REGION.longitude + MAP_CONFIG.DEFAULT_REGION.longitudeDelta / 2,
      centerLatitude: MAP_CONFIG.DEFAULT_REGION.latitude,
      centerLongitude: MAP_CONFIG.DEFAULT_REGION.longitude,
      latitudeDelta: MAP_CONFIG.DEFAULT_REGION.latitudeDelta,
      longitudeDelta: MAP_CONFIG.DEFAULT_REGION.longitudeDelta,
    };
  }

  // 2. Handle single coordinate safely
  if (validCoords.length === 1) {
    const coord = validCoords[0];
    const defaultDelta = 0.012; // ~1.3km view span
    return {
      minLatitude: coord.latitude - defaultDelta / 2,
      maxLatitude: coord.latitude + defaultDelta / 2,
      minLongitude: coord.longitude - defaultDelta / 2,
      maxLongitude: coord.longitude + defaultDelta / 2,
      centerLatitude: coord.latitude,
      centerLongitude: coord.longitude,
      latitudeDelta: defaultDelta,
      longitudeDelta: defaultDelta,
    };
  }

  // 3. Multi-coordinate bounding box calculation
  let minLat = validCoords[0].latitude;
  let maxLat = validCoords[0].latitude;
  let minLng = validCoords[0].longitude;
  let maxLng = validCoords[0].longitude;

  for (let i = 1; i < validCoords.length; i++) {
    const pt = validCoords[i];
    if (pt.latitude < minLat) minLat = pt.latitude;
    if (pt.latitude > maxLat) maxLat = pt.latitude;
    if (pt.longitude < minLng) minLng = pt.longitude;
    if (pt.longitude > maxLng) maxLng = pt.longitude;
  }

  const rawLatDelta = maxLat - minLat;
  const rawLngDelta = maxLng - minLng;

  // Minimum delta floor to prevent extreme over-zoom on tight routes
  const minDelta = 0.005; // ~500m
  const paddedLatDelta = Math.max(rawLatDelta * paddingFactor, minDelta);
  const paddedLngDelta = Math.max(rawLngDelta * paddingFactor, minDelta);

  const centerLat = (minLat + maxLat) / 2;
  const centerLng = (minLng + maxLng) / 2;

  return {
    minLatitude: minLat,
    maxLatitude: maxLat,
    minLongitude: minLng,
    maxLongitude: maxLng,
    centerLatitude: centerLat,
    centerLongitude: centerLng,
    latitudeDelta: paddedLatDelta,
    longitudeDelta: paddedLngDelta,
  };
}

/**
 * Converts a RouteBounds into a MapRegion object.
 */
export function getRegionFromBounds(bounds: RouteBounds): MapRegion {
  return {
    latitude: bounds.centerLatitude,
    longitude: bounds.centerLongitude,
    latitudeDelta: bounds.latitudeDelta,
    longitudeDelta: bounds.longitudeDelta,
  };
}

/**
 * Check if coordinate is contained within route bounds.
 */
export function isCoordinateWithinBounds(coord: MapCoordinate, bounds: RouteBounds): boolean {
  if (!isValidCoordinate(coord)) return false;
  return (
    coord.latitude >= bounds.minLatitude &&
    coord.latitude <= bounds.maxLatitude &&
    coord.longitude >= bounds.minLongitude &&
    coord.longitude <= bounds.maxLongitude
  );
}

/**
 * Calculates great-circle distance between two coordinates in meters (Haversine formula).
 */
export function calculateDistanceMeters(coord1: MapCoordinate, coord2: MapCoordinate): number {
  if (!isValidCoordinate(coord1) || !isValidCoordinate(coord2)) return 0;
  const R = 6371e3; // Earth radius in meters
  const lat1 = (coord1.latitude * Math.PI) / 180;
  const lat2 = (coord2.latitude * Math.PI) / 180;
  const deltaLat = ((coord2.latitude - coord1.latitude) * Math.PI) / 180;
  const deltaLng = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

