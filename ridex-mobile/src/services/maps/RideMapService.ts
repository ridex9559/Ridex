/**
 * RIDEX — Ride Map Service
 * Queries GPS points from SQLite, converts them into pure MapCoordinate models,
 * calculates bounding boxes, extracts start/end anchors, and manages route simplification.
 */

import { localRideLocationRepository } from '../database/repositories/LocalRideLocationRepository';
import { LocalRideLocation } from '../database/databaseTypes';
import { MapCoordinate, MapRegion, RouteBounds } from './mapTypes';
import { calculateRouteBounds, isValidCoordinate } from '../../utils/geo/routeBounds';
import { getRegionFromRoute } from '../../utils/geo/mapRegion';
import { simplifyRoute } from '../../utils/geo/routeSimplification';
import { logger } from '../../utils/logger';

export interface RideRouteData {
  rideId: string;
  coordinates: MapCoordinate[];
  simplifiedCoordinates: MapCoordinate[];
  startCoordinate: MapCoordinate | null;
  endCoordinate: MapCoordinate | null;
  bounds: RouteBounds;
  region: MapRegion;
  pointCount: number;
  isEmpty: boolean;
}

export class RideMapService {
  /**
   * Transforms raw SQLite location records into sanitized MapCoordinates.
   */
  public transformLocationsToCoordinates(locations: LocalRideLocation[]): MapCoordinate[] {
    if (!locations || !Array.isArray(locations)) return [];

    return locations
      .filter((loc) => loc && isValidCoordinate({ latitude: loc.latitude, longitude: loc.longitude }))
      .map((loc) => ({
        latitude: Number(loc.latitude),
        longitude: Number(loc.longitude),
      }));
  }

  /**
   * Extracts the initial start coordinate from a route array.
   */
  public getStartCoordinate(coordinates: MapCoordinate[]): MapCoordinate | null {
    if (!coordinates || coordinates.length === 0) return null;
    return isValidCoordinate(coordinates[0]) ? coordinates[0] : null;
  }

  /**
   * Extracts the terminal end coordinate from a route array.
   */
  public getEndCoordinate(coordinates: MapCoordinate[]): MapCoordinate | null {
    if (!coordinates || coordinates.length === 0) return null;
    const last = coordinates[coordinates.length - 1];
    return isValidCoordinate(last) ? last : null;
  }

  /**
   * Loads a full ride route from local SQLite storage and builds all visual metadata.
   */
  public async getRideRoute(
    rideId: string,
    options: { simplify?: boolean; maxPoints?: number; paddingFactor?: number } = {}
  ): Promise<RideRouteData> {
    const { simplify = true, maxPoints = 500, paddingFactor = 1.3 } = options;

    try {
      const locations = await localRideLocationRepository.getLocationsByRideId(rideId);
      const coordinates = this.transformLocationsToCoordinates(locations);

      const startCoordinate = this.getStartCoordinate(coordinates);
      const endCoordinate = coordinates.length > 1 ? this.getEndCoordinate(coordinates) : null;
      const bounds = calculateRouteBounds(coordinates, paddingFactor);
      const region = getRegionFromRoute(coordinates, paddingFactor);

      const simplifiedCoordinates = simplify
        ? simplifyRoute(coordinates, 0.00005, maxPoints)
        : coordinates;

      return {
        rideId,
        coordinates,
        simplifiedCoordinates,
        startCoordinate,
        endCoordinate,
        bounds,
        region,
        pointCount: coordinates.length,
        isEmpty: coordinates.length === 0,
      };
    } catch (error) {
      logger.error(`[RideMapService] Error loading route for ride ${rideId}:`, error);

      // Return safe fallback rather than crashing the map
      const emptyBounds = calculateRouteBounds([]);
      return {
        rideId,
        coordinates: [],
        simplifiedCoordinates: [],
        startCoordinate: null,
        endCoordinate: null,
        bounds: emptyBounds,
        region: getRegionFromRoute([]),
        pointCount: 0,
        isEmpty: true,
      };
    }
  }

  /**
   * Prepares route data from an in-memory coordinate array (e.g. for active rides).
   */
  public prepareRouteData(
    coordinates: MapCoordinate[],
    rideId: string = 'active_ride',
    paddingFactor = 1.3
  ): RideRouteData {
    const valid = coordinates.filter(isValidCoordinate);
    const startCoordinate = this.getStartCoordinate(valid);
    const endCoordinate = valid.length > 1 ? this.getEndCoordinate(valid) : null;
    const bounds = calculateRouteBounds(valid, paddingFactor);
    const region = getRegionFromRoute(valid, paddingFactor);

    return {
      rideId,
      coordinates: valid,
      simplifiedCoordinates: valid,
      startCoordinate,
      endCoordinate,
      bounds,
      region,
      pointCount: valid.length,
      isEmpty: valid.length === 0,
    };
  }
}

export const rideMapService = new RideMapService();
