import { useState, useEffect, useCallback } from 'react';
import { rideService } from '../services/RideService';
import { Ride, RideLocation } from '../types';

export function useRides(userId = 'usr-1', limit = 20) {
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRides = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await rideService.getRides(userId, limit);
      setRides(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load rides history');
    } finally {
      setLoading(false);
    }
  }, [userId, limit]);

  useEffect(() => {
    fetchRides();
  }, [fetchRides]);

  const saveRide = async (ride: Partial<Ride>, locations: RideLocation[] = []) => {
    try {
      const created = await rideService.saveCompletedRide(ride, locations);
      setRides((prev) => [created, ...prev]);
      return created;
    } catch (err: any) {
      setError(err?.message || 'Failed to save ride');
      throw err;
    }
  };

  const deleteRide = async (id: string) => {
    try {
      await rideService.deleteRide(id);
      setRides((prev) => prev.filter((r) => r.id !== id));
    } catch (err: any) {
      setError(err?.message || 'Failed to delete ride');
      throw err;
    }
  };

  const getRideTelemetry = async (rideId: string) => {
    return rideService.getRideTelemetry(rideId);
  };

  return {
    rides,
    loading,
    error,
    refresh: fetchRides,
    saveRide,
    deleteRide,
    getRideTelemetry,
  };
}
