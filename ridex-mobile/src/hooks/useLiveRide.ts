/**
 * RIDEX — useLiveRide Hook
 * Handles starting and ending live sessions, organizer actions, and live session status tracking.
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../store/authStore';
import { liveRideService } from '../services/liveRide/LiveRideService';
import { LiveRideSession } from '../types/liveRide';

export function useLiveRide(rideId: string) {
  const user = useAuthStore((s) => s.user);

  const [session, setSession] = useState<LiveRideSession | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isStarting, setIsStarting] = useState<boolean>(false);
  const [isEnding, setIsEnding] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadSession = useCallback(async () => {
    setIsLoading(true);
    try {
      const active = await liveRideService.getActiveSession(rideId);
      setSession(active);
    } catch {
      setSession(null);
    } finally {
      setIsLoading(false);
    }
  }, [rideId]);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  const startLiveRide = useCallback(async (): Promise<string | null> => {
    if (!user) {
      setError('Must be logged in to launch live session');
      return null;
    }

    setIsStarting(true);
    setError(null);

    try {
      const sessionId = await liveRideService.startLiveRide(rideId, user.id);
      await loadSession();
      setIsStarting(false);
      return sessionId;
    } catch (err: any) {
      setIsStarting(false);
      setError(err?.message || 'Failed to start live ride');
      return null;
    }
  }, [rideId, user, loadSession]);

  const endLiveRide = useCallback(async (): Promise<boolean> => {
    if (!user) return false;

    setIsEnding(true);
    setError(null);

    try {
      await liveRideService.endLiveRide(rideId, user.id);
      setSession(null);
      setIsEnding(false);
      return true;
    } catch (err: any) {
      setIsEnding(false);
      setError(err?.message || 'Failed to end live ride');
      return false;
    }
  }, [rideId, user]);

  return {
    session,
    isLive: session?.status === 'LIVE',
    isLoading,
    isStarting,
    isEnding,
    error,
    startLiveRide,
    startLiveSession: startLiveRide,
    endLiveRide,
    endLiveSession: endLiveRide,
    leaveLiveSession: endLiveRide,
    refreshSession: loadSession,
  };
}
