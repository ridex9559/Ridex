/**
 * RIDEX — Map Region & Viewport Utilities
 * Computes region deltas, zoom conversions, and viewport framing for active/completed rides.
 */

import { MapCoordinate, MapPadding, MapRegion, RouteBounds } from '../../services/maps/mapTypes';
import { MAP_CONFIG } from '../../config/maps';
import { calculateRouteBounds, isValidCoordinate } from './routeBounds';

/**
 * Converts a standard zoom level (3 - 19) to latitude/longitude deltas.
 */
export function zoomToDeltas(zoomLevel: number): { latitudeDelta: number; longitudeDelta: number } {
  const clampedZoom = Math.max(MAP_CONFIG.ZOOM.MIN_ZOOM, Math.min(MAP_CONFIG.ZOOM.MAX_ZOOM, zoomLevel));
  const latDelta = 360 / Math.pow(2, clampedZoom);
  const lngDelta = 360 / Math.pow(2, clampedZoom);
  return {
    latitudeDelta: latDelta,
    longitudeDelta: lngDelta,
  };
}

/**
 * Converts a latitudeDelta to an approximate zoom level.
 */
export function deltasToZoom(latitudeDelta: number): number {
  if (latitudeDelta <= 0) return MAP_CONFIG.ZOOM.ACTIVE_RIDE;
  const zoom = Math.log2(360 / latitudeDelta);
  return Math.round(Math.max(MAP_CONFIG.ZOOM.MIN_ZOOM, Math.min(MAP_CONFIG.ZOOM.MAX_ZOOM, zoom)));
}

/**
 * Generates a MapRegion centered on a specific coordinate at a given zoom level.
 */
export function getRegionFromCoordinate(
  coordinate: MapCoordinate | null | undefined,
  zoomLevel = MAP_CONFIG.ZOOM.ACTIVE_RIDE
): MapRegion {
  if (!coordinate || !isValidCoordinate(coordinate)) {
    return MAP_CONFIG.DEFAULT_REGION;
  }

  const { latitudeDelta, longitudeDelta } = zoomToDeltas(zoomLevel);

  return {
    latitude: coordinate.latitude,
    longitude: coordinate.longitude,
    latitudeDelta,
    longitudeDelta,
  };
}

/**
 * Generates a MapRegion that fits all coordinates of a route with padding.
 */
export function getRegionFromRoute(
  coordinates: MapCoordinate[],
  paddingFactor = 1.3
): MapRegion {
  const bounds = calculateRouteBounds(coordinates, paddingFactor);
  return {
    latitude: bounds.centerLatitude,
    longitude: bounds.centerLongitude,
    latitudeDelta: bounds.latitudeDelta,
    longitudeDelta: bounds.longitudeDelta,
  };
}

/**
 * Fits a route with custom UI padding offsets (e.g. for bottom Cockpit telemetry HUD).
 */
export function fitRouteWithPadding(
  coordinates: MapCoordinate[],
  padding: Partial<MapPadding> = MAP_CONFIG.DEFAULT_PADDING
): { region: MapRegion; bounds: RouteBounds } {
  const bounds = calculateRouteBounds(coordinates, 1.25);
  const fullPadding = { ...MAP_CONFIG.DEFAULT_PADDING, ...padding };

  const verticalBias = (fullPadding.bottom - fullPadding.top) / 1000;
  const adjustedCenterLat = bounds.centerLatitude - bounds.latitudeDelta * (verticalBias * 0.2);

  const region: MapRegion = {
    latitude: adjustedCenterLat,
    longitude: bounds.centerLongitude,
    latitudeDelta: bounds.latitudeDelta * 1.15,
    longitudeDelta: bounds.longitudeDelta * 1.15,
  };

  return { region, bounds };
}
