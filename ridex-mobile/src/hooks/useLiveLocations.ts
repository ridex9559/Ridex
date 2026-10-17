/**
 * RIDEX — useLiveLocations Hook
 * Connects the Step 5 GPS hardware stream to the live sharing publisher and
 * subscribes to Supabase Realtime for peer rider positions.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuthStore } from '../store/authStore';
import { useRideTrackingStore } from '../store/rideTrackingStore';
import { liveLocationService } from '../services/liveRide/LiveLocationService';
import { liveRideRealtimeService } from '../services/liveRide/LiveRideRealtimeService';
import { LiveRiderLocation } from '../types/liveRide';
import { isValidCoordinate } from '../utils/geo/routeBounds';

export interface UseLiveLocationsResult {
  riders: LiveRiderLocation[];
  currentUserLocation: LiveRiderLocation | null;
  peerRiders: LiveRiderLocation[];
  isSharing: boolean;
  isBroadcasting: boolean;
  activeCount: number;
  activeRiderCount: number;
  toggleSharing: (enabled: boolean) => void;
  toggleBroadcasting: () => void;
  reconnect: () => Promise<void>;
}

export function useLiveLocations(sessionId: string | null | undefined, _rideId?: string): UseLiveLocationsResult {
  const user = useAuthStore((s) => s.user);
  const currentGpsPoint = useRideTrackingStore((s) => s.currentLocation);

  const [riders, setRiders] = useState<LiveRiderLocation[]>([]);
  const [isSharing, setIsSharing] = useState<boolean>(true);
  const lastProcessedGpsRef = useRef<number>(0);

  // 1. Subscribe to Realtime Location Channel when Session is Active
  useEffect(() => {
    if (!sessionId || !user) return;

    let isMounted = true;

    const initRealtime = async () => {
      const initial = await liveRideRealtimeService.subscribeToSession(sessionId);
      if (isMounted) {
        setRiders(initial);
      }
    };

    initRealtime();

    const unsubscribeLocations = liveRideRealtimeService.onLocationsUpdated((updated) => {
      if (isMounted) {
        setRiders(updated);
      }
    });

    // Start local publisher
    liveLocationService.startSharing(sessionId, user.id);
    setIsSharing(true);

    return () => {
      isMounted = false;
      unsubscribeLocations();
      liveRideRealtimeService.unsubscribe();
      liveLocationService.stopSharing();
    };
  }, [sessionId, user?.id]);

  // 2. Consume Incoming GPS Coordinates from Step 5 Tracking Engine
  useEffect(() => {
    if (!sessionId || !user || !currentGpsPoint || !isSharing) return;

    if (currentGpsPoint.timestamp === lastProcessedGpsRef.current) return;
    lastProcessedGpsRef.current = currentGpsPoint.timestamp;

    liveLocationService.processGpsUpdate(currentGpsPoint);
  }, [sessionId, user?.id, currentGpsPoint, isSharing]);

  const toggleSharing = useCallback((enabled: boolean) => {
    liveLocationService.toggleSharing(enabled);
    setIsSharing(enabled);
  }, []);

  const reconnect = useCallback(async () => {
    if (!sessionId) return;
    const fresh = await liveRideRealtimeService.subscribeToSession(sessionId);
    setRiders(fresh);
  }, [sessionId]);

  const currentUserLocation = riders.find((r) => r.isCurrentUser) || null;
  const peerRiders = riders.filter((r) => !r.isCurrentUser && isValidCoordinate(r.coordinate));
  const activeCount = riders.filter((r) => r.presenceStatus === 'LIVE').length;

  return {
    riders,
    currentUserLocation,
    peerRiders,
    isSharing,
    isBroadcasting: isSharing,
    activeCount,
    activeRiderCount: activeCount,
    toggleSharing,
    toggleBroadcasting: () => toggleSharing(!isSharing),
    reconnect,
  };
}
