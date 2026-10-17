import { useState, useEffect, useCallback } from 'react';
import { LocationPermissionStatus } from '@/services/location/locationTypes';
import { locationPermissionService } from '@/services/location/LocationPermissionService';

export function useLocationPermission() {
  const [status, setStatus] = useState<LocationPermissionStatus>('UNKNOWN');
  const [isServicesEnabled, setIsServicesEnabled] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const checkStatus = useCallback(async () => {
    setIsLoading(true);
    const permStatus = await locationPermissionService.checkForegroundPermission();
    const servicesEnabled = await locationPermissionService.isLocationServicesEnabled();
    setStatus(permStatus);
    setIsServicesEnabled(servicesEnabled);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  const requestPermission = async (): Promise<boolean> => {
    const res = await locationPermissionService.requestForegroundPermission();
    setStatus(res.status);
    return res.granted;
  };

  const openSettings = async () => {
    await locationPermissionService.openSettings();
  };

  return {
    status,
    isGranted: status === 'GRANTED',
    isBlocked: status === 'BLOCKED',
    isDenied: status === 'DENIED',
    isServicesEnabled,
    isLoading,
    checkStatus,
    requestPermission,
    openSettings,
  };
}
