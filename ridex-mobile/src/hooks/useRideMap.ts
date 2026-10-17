/**
 * RIDEX — useRideMap Hook
 * Orchestrates route loading, GPS coordinate streaming, bounding calculation,
 * and live active polyline growth without overwhelming state stores.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { MapCoordinate, MapError, MapRegion, RouteBounds } from '../services/maps/mapTypes';
import { rideMapService, RideRouteData } from '../services/maps/RideMapService';
import { useRideTrackingStore } from '../store/rideTrackingStore';
import { MAP_CONFIG } from '../config/maps';
import { getRegionFromCoordinate, fitRouteWithPadding } from '../utils/geo/mapRegion';
import { isValidCoordinate } from '../utils/geo/routeBounds';

export interface UseRideMapOptions {
  rideId?: string | null;
  autoLoad?: boolean;
  simplify?: boolean;
}

export interface UseRideMapResult {
  coordinates: MapCoordinate[];
  startCoordinate: MapCoordinate | null;
  endCoordinate: MapCoordinate | null;
  currentCoordinate: MapCoordinate | null;
  currentHeading: number | null;
  currentSpeedKmh: number;
  region: MapRegion;
  bounds: RouteBounds;
  isLoading: boolean;
  error: MapError | null;
  pointCount: number;
  isEmpty: boolean;
  reload: () => Promise<void>;
  addActiveCoordinate: (coord: MapCoordinate) => void;
  clearRoute: () => void;
}

export function useRideMap(options: UseRideMapOptions = {}): UseRideMapResult {
  const { rideId, autoLoad = true, simplify = true } = options;

  const [routeData, setRouteData] = useState<RideRouteData | null>(null);
  const [activeCoordinates, setActiveCoordinates] = useState<MapCoordinate[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<MapError | null>(null);

  // Live tracking store subscription
  const currentLocation = useRideTrackingStore((s) => s.currentLocation);
  const currentSpeedKmh = useRideTrackingStore((s) => s.currentSpeedKmh);
  const isTracking = useRideTrackingStore((s) => s.isTracking);
  const activeRideId = useRideTrackingStore((s) => s.activeRideId);

  const lastProcessedLocRef = useRef<string | null>(null);

  /**
   * Loads completed ride route from SQLite.
   */
  const loadRideRoute = useCallback(async () => {
    const targetRideId = rideId || (!isTracking ? activeRideId : null);
    if (!targetRideId) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await rideMapService.getRideRoute(targetRideId, { simplify });
      setRouteData(data);
    } catch (err: any) {
      setError({
        code: 'ROUTE_NOT_FOUND',
        message: err?.message || 'Failed to load ride route',
        originalError: err,
      });
    } finally {
      setIsLoading(false);
    }
  }, [rideId, activeRideId, isTracking, simplify]);

  // Initial / dependency load
  useEffect(() => {
    if (autoLoad && (rideId || (!isTracking && activeRideId))) {
      loadRideRoute();
    }
  }, [autoLoad, rideId, isTracking, activeRideId, loadRideRoute]);

  // Live coordinate stream appending for active rides
  useEffect(() => {
    if (!isTracking || !currentLocation) return;

    const locKey = `${currentLocation.latitude}_${currentLocation.longitude}_${currentLocation.timestamp}`;
    if (lastProcessedLocRef.current === locKey) return;
    lastProcessedLocRef.current = locKey;

    const newCoord: MapCoordinate = {
      latitude: currentLocation.latitude,
      longitude: currentLocation.longitude,
    };

    if (isValidCoordinate(newCoord)) {
      setActiveCoordinates((prev) => [...prev, newCoord]);
    }
  }, [isTracking, currentLocation]);

  // Reset active route when tracking starts fresh
  useEffect(() => {
    if (isTracking && activeCoordinates.length === 0 && currentLocation) {
      const initialCoord: MapCoordinate = {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
      };
      if (isValidCoordinate(initialCoord)) {
        setActiveCoordinates([initialCoord]);
      }
    } else if (!isTracking && !rideId) {
      setActiveCoordinates([]);
      lastProcessedLocRef.current = null;
    }
  }, [isTracking, rideId]);

  const addActiveCoordinate = useCallback((coord: MapCoordinate) => {
    if (isValidCoordinate(coord)) {
      setActiveCoordinates((prev) => [...prev, coord]);
    }
  }, []);

  const clearRoute = useCallback(() => {
    setActiveCoordinates([]);
    setRouteData(null);
    setError(null);
  }, []);

  // Compute final effective coordinates & metadata
  const effectiveCoordinates = isTracking ? activeCoordinates : routeData?.simplifiedCoordinates || [];
  const pointCount = effectiveCoordinates.length;
  const isEmpty = pointCount === 0;

  const currentCoordinate: MapCoordinate | null = currentLocation
    ? { latitude: currentLocation.latitude, longitude: currentLocation.longitude }
    : null;

  const currentHeading = currentLocation?.heading ?? null;

  const startCoordinate: MapCoordinate | null = isTracking
    ? activeCoordinates.length > 0
      ? activeCoordinates[0]
      : currentCoordinate
    : routeData?.startCoordinate ?? null;

  const endCoordinate: MapCoordinate | null = isTracking
    ? null
    : routeData?.endCoordinate ?? null;

  // Compute bounding region
  let region: MapRegion;
  let bounds: RouteBounds;

  if (isTracking && currentCoordinate) {
    region = getRegionFromCoordinate(currentCoordinate, MAP_CONFIG.ZOOM.ACTIVE_RIDE);
    bounds = routeData?.bounds || fitRouteWithPadding(effectiveCoordinates).bounds;
  } else if (!isEmpty) {
    const fitted = fitRouteWithPadding(effectiveCoordinates);
    region = fitted.region;
    bounds = fitted.bounds;
  } else if (currentCoordinate) {
    region = getRegionFromCoordinate(currentCoordinate, MAP_CONFIG.ZOOM.ACTIVE_RIDE);
    bounds = fitRouteWithPadding([currentCoordinate]).bounds;
  } else {
    region = MAP_CONFIG.DEFAULT_REGION;
    bounds = fitRouteWithPadding([]).bounds;
  }

  return {
    coordinates: effectiveCoordinates,
    startCoordinate,
    endCoordinate,
    currentCoordinate,
    currentHeading,
    currentSpeedKmh,
    region,
    bounds,
    isLoading,
    error,
    pointCount,
    isEmpty,
    reload: loadRideRoute,
    addActiveCoordinate,
    clearRoute,
  };
}
