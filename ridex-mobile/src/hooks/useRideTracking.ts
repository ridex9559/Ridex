import { useCallback } from 'react';
import { useRideTrackingStore } from '@/store/rideTrackingStore';
import { rideLifecycleService, StartRideParams } from '@/services/rides/RideLifecycleService';
import { Ride } from '@/types/ride';

export function useRideTracking() {
  const store = useRideTrackingStore();

  const startRide = useCallback(async (params: StartRideParams = {}): Promise<Ride | null> => {
    return await rideLifecycleService.startRide(params);
  }, []);

  const pauseRide = useCallback(async (): Promise<void> => {
    await rideLifecycleService.pauseRide();
  }, []);

  const resumeRide = useCallback(async (): Promise<void> => {
    await rideLifecycleService.resumeRide();
  }, []);

  const stopRide = useCallback(async (): Promise<Ride | null> => {
    return await rideLifecycleService.stopRide();
  }, []);

  return {
    ...store,
    startRide,
    pauseRide,
    resumeRide,
    stopRide,
  };
}
