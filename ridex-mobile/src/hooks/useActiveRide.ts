import { useState, useEffect, useCallback } from 'react';
import { LocalRide } from '@/services/database/databaseTypes';
import { rideRecoveryService } from '@/services/location/RideRecoveryService';
import { useAuthStore } from '@/store/authStore';

export function useActiveRide() {
  const [recoverableRide, setRecoverableRide] = useState<LocalRide | null>(null);
  const [isChecking, setIsChecking] = useState<boolean>(true);
  const user = useAuthStore((state) => state.user);

  const checkActiveRide = useCallback(async () => {
    if (!user?.id) {
      setRecoverableRide(null);
      setIsChecking(false);
      return;
    }

    setIsChecking(true);
    const activeRide = await rideRecoveryService.checkForActiveRide(user.id);
    setRecoverableRide(activeRide);
    setIsChecking(false);
  }, [user?.id]);

  useEffect(() => {
    checkActiveRide();
  }, [checkActiveRide]);

  const resumeRide = async () => {
    if (!recoverableRide) return;
    await rideRecoveryService.resumeRecoveredRide(recoverableRide);
    setRecoverableRide(null);
  };

  const finishRide = async () => {
    if (!recoverableRide) return;
    await rideRecoveryService.finishRecoveredRide(recoverableRide);
    setRecoverableRide(null);
  };

  const discardRide = async () => {
    if (!recoverableRide) return;
    await rideRecoveryService.discardRecoveredRide(recoverableRide.id);
    setRecoverableRide(null);
  };

  return {
    recoverableRide,
    isChecking,
    checkActiveRide,
    resumeRide,
    finishRide,
    discardRide,
  };
}
