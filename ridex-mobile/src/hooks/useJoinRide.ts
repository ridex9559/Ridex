/**
 * RIDEX — useJoinRide Hook
 * Mutation hook for joining and leaving group rides with automatic query invalidation.
 */

import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import { rideParticipationService } from '../services/rides/RideParticipationService';

export function useJoinRide(rideId: string) {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const joinRide = useCallback(async (): Promise<boolean> => {
    if (!user) {
      setError('Please log in to join this ride');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      await rideParticipationService.joinRide(rideId, user.id);
      await queryClient.invalidateQueries({ queryKey: ['rides'] });
      setIsLoading(false);
      return true;
    } catch (err: any) {
      setIsLoading(false);
      setError(err?.message || 'Failed to join ride');
      return false;
    }
  }, [rideId, user, queryClient]);

  const leaveRide = useCallback(async (): Promise<boolean> => {
    if (!user) return false;

    setIsLoading(true);
    setError(null);

    try {
      await rideParticipationService.leaveRide(rideId, user.id);
      await queryClient.invalidateQueries({ queryKey: ['rides'] });
      setIsLoading(false);
      return true;
    } catch (err: any) {
      setIsLoading(false);
      setError(err?.message || 'Failed to leave ride');
      return false;
    }
  }, [rideId, user, queryClient]);

  return {
    joinRide,
    leaveRide,
    isLoading,
    error,
  };
}
