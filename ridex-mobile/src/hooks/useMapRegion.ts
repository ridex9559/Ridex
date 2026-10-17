/**
 * RIDEX — useMapRegion Hook
 * Camera orchestration, follow mode state machine, recentering controls,
 * and user gesture detection.
 */

import { useState, useCallback, useRef } from 'react';
import { MapCoordinate, MapPadding, MapRegion } from '../services/maps/mapTypes';
import { MAP_CONFIG } from '../config/maps';
import { getRegionFromCoordinate, fitRouteWithPadding } from '../utils/geo/mapRegion';
import { isValidCoordinate } from '../utils/geo/routeBounds';

export interface UseMapRegionOptions {
  initialRegion?: MapRegion;
  initialFollowMode?: boolean;
  padding?: Partial<MapPadding>;
}

export interface UseMapRegionResult {
  region: MapRegion;
  isFollowing: boolean;
  setRegion: (region: MapRegion) => void;
  setIsFollowing: (isFollowing: boolean) => void;
  recenter: (coordinate?: MapCoordinate | null, zoom?: number) => void;
  handleUserPan: () => void;
  fitToCoordinates: (coordinates: MapCoordinate[], customPadding?: Partial<MapPadding>) => void;
  updateFollowPosition: (coordinate: MapCoordinate | null | undefined) => void;
}

export function useMapRegion(options: UseMapRegionOptions = {}): UseMapRegionResult {
  const {
    initialRegion = MAP_CONFIG.DEFAULT_REGION,
    initialFollowMode = MAP_CONFIG.FOLLOW_MODE.DEFAULT_ENABLED,
    padding = MAP_CONFIG.DEFAULT_PADDING,
  } = options;

  const [region, setRegionState] = useState<MapRegion>(initialRegion);
  const [isFollowing, setIsFollowingState] = useState<boolean>(initialFollowMode);
  const isFollowingRef = useRef<boolean>(initialFollowMode);

  const setRegion = useCallback((newRegion: MapRegion) => {
    setRegionState(newRegion);
  }, []);

  const setIsFollowing = useCallback((following: boolean) => {
    isFollowingRef.current = following;
    setIsFollowingState(following);
  }, []);

  /**
   * Disengages follow mode when rider manually drags/pans the map.
   */
  const handleUserPan = useCallback(() => {
    if (isFollowingRef.current) {
      isFollowingRef.current = false;
      setIsFollowingState(false);
    }
  }, []);

  /**
   * Smoothly recenters map to the specified coordinate or default and turns follow mode ON.
   */
  const recenter = useCallback(
    (coordinate?: MapCoordinate | null, zoom = MAP_CONFIG.ZOOM.ACTIVE_RIDE) => {
      const targetCoord = isValidCoordinate(coordinate)
        ? coordinate
        : { latitude: region.latitude, longitude: region.longitude };

      const newRegion = getRegionFromCoordinate(targetCoord, zoom);
      setRegionState(newRegion);
      setIsFollowing(true);
    },
    [region.latitude, region.longitude, setIsFollowing]
  );

  /**
   * Updates camera position if follow mode is enabled.
   */
  const updateFollowPosition = useCallback(
    (coordinate: MapCoordinate | null | undefined) => {
      if (!isFollowingRef.current || !coordinate || !isValidCoordinate(coordinate)) return;

      setRegionState((prev) => ({
        ...prev,
        latitude: coordinate.latitude,
        longitude: coordinate.longitude,
      }));
    },
    []
  );

  /**
   * Fits camera to a set of route coordinates with configured padding.
   */
  const fitToCoordinates = useCallback(
    (coordinates: MapCoordinate[], customPadding?: Partial<MapPadding>) => {
      const effectivePadding = { ...padding, ...customPadding };
      const { region: fittedRegion } = fitRouteWithPadding(coordinates, effectivePadding);
      setRegionState(fittedRegion);
      setIsFollowing(false);
    },
    [padding, setIsFollowing]
  );

  return {
    region,
    isFollowing,
    setRegion,
    setIsFollowing,
    recenter,
    handleUserPan,
    fitToCoordinates,
    updateFollowPosition,
  };
}
