/**
 * RIDEX — useCurrentLocation Hook
 * Lightweight hook providing current GPS position, heading, speed, and accuracy
 * connected to the Step 5 location service layer.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { MapCoordinate } from '../services/maps/mapTypes';
import { useRideTrackingStore } from '../store/rideTrackingStore';
import { locationService } from '../services/location/LocationService';
import { locationPermissionService } from '../services/location/LocationPermissionService';
import { isValidCoordinate } from '../utils/geo/routeBounds';

export interface UseCurrentLocationResult {
  coordinate: MapCoordinate | null;
  heading: number | null;
  speedKmh: number;
  accuracy: number | null;
  hasPermission: boolean;
  isLoading: boolean;
  refreshLocation: () => Promise<MapCoordinate | null>;
}

export function useCurrentLocation(): UseCurrentLocationResult {
  const storeLocation = useRideTrackingStore((s) => s.currentLocation);
  const currentSpeedKmh = useRideTrackingStore((s) => s.currentSpeedKmh);

  const [coordinate, setCoordinate] = useState<MapCoordinate | null>(() => {
    if (storeLocation && isValidCoordinate(storeLocation)) {
      return { latitude: storeLocation.latitude, longitude: storeLocation.longitude };
    }
    return null;
  });
  const [heading, setHeading] = useState<number | null>(storeLocation?.heading ?? null);
  const [accuracy, setAccuracy] = useState<number | null>(storeLocation?.accuracy ?? null);
  const [hasPermission, setHasPermission] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Sync from store location whenever it updates
  useEffect(() => {
    if (storeLocation && isValidCoordinate(storeLocation)) {
      setCoordinate({ latitude: storeLocation.latitude, longitude: storeLocation.longitude });
      setHeading(storeLocation.heading ?? null);
      setAccuracy(storeLocation.accuracy ?? null);
    }
  }, [storeLocation]);

  /**
   * Refreshes one-time current location and requests permission if needed
   */
  const refreshLocation = useCallback(async (): Promise<MapCoordinate | null> => {
    setIsLoading(true);
    try {
      let status = await locationPermissionService.checkForegroundPermission();
      if (status !== 'GRANTED') {
        const req = await locationPermissionService.requestForegroundPermission();
        if (!req.granted) {
          setHasPermission(false);
          setIsLoading(false);
          return null;
        }
      }
      setHasPermission(true);

      const raw = await locationService.getCurrentPosition();
      if (raw && isValidCoordinate(raw)) {
        useRideTrackingStore.getState().updateLiveMetrics({ currentLocation: raw });
        const coord: MapCoordinate = { latitude: raw.latitude, longitude: raw.longitude };
        setCoordinate(coord);
        setHeading(raw.heading ?? null);
        setAccuracy(raw.accuracy ?? null);
        setIsLoading(false);
        return coord;
      }
    } catch {
      // Graceful fallback
    } finally {
      setIsLoading(false);
    }
    return null;
  }, []);

  const hasAttemptedRef = useRef(false);

  // Auto-fetch location on hook mount if not already acquired
  useEffect(() => {
    if (!storeLocation && !hasAttemptedRef.current) {
      hasAttemptedRef.current = true;
      refreshLocation();
    }
  }, [storeLocation, refreshLocation]);

  return {
    coordinate,
    heading,
    speedKmh: currentSpeedKmh,
    accuracy,
    hasPermission,
    isLoading,
    refreshLocation,
  };
}
