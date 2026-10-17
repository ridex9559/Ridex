import { Platform, Linking } from 'react-native';
import * as Location from 'expo-location';
import { LocationPermissionStatus } from './locationTypes';
import { logger } from '@/utils/logger';

export class LocationPermissionService {
  private static instance: LocationPermissionService | null = null;

  private constructor() {}

  public static getInstance(): LocationPermissionService {
    if (!LocationPermissionService.instance) {
      LocationPermissionService.instance = new LocationPermissionService();
    }
    return LocationPermissionService.instance;
  }

  /**
   * Checks current foreground location permission status without prompting the user.
   */
  async checkForegroundPermission(): Promise<LocationPermissionStatus> {
    if (Platform.OS === 'web') {
      if (typeof navigator !== 'undefined' && (navigator as any).permissions) {
        try {
          const result = await (navigator as any).permissions.query({ name: 'geolocation' });
          if (result.state === 'granted') return 'GRANTED';
          if (result.state === 'denied') return 'BLOCKED';
          return 'NOT_REQUESTED';
        } catch {
          return 'NOT_REQUESTED';
        }
      }
      return 'NOT_REQUESTED';
    }

    try {
      const { status, canAskAgain } = await Location.getForegroundPermissionsAsync();

      if (status === Location.PermissionStatus.GRANTED) {
        return 'GRANTED';
      }
      if (!canAskAgain && status === Location.PermissionStatus.DENIED) {
        return 'BLOCKED';
      }
      if (status === Location.PermissionStatus.DENIED) {
        return 'DENIED';
      }
      return 'NOT_REQUESTED';
    } catch (error) {
      logger.error('[LocationPermissionService] Error checking permissions:', error);
      return 'UNKNOWN';
    }
  }

  /**
   * Request foreground location permission contextually (e.g. when app starts or starting a ride).
   * Triggers the browser / device permission modal.
   */
  async requestForegroundPermission(): Promise<{
    status: LocationPermissionStatus;
    granted: boolean;
  }> {
    if (Platform.OS === 'web') {
      if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
        return { status: 'UNKNOWN', granted: false };
      }

      return new Promise((resolve) => {
        logger.info('[LocationPermissionService] Requesting browser GPS permission via navigator.geolocation...');
        navigator.geolocation.getCurrentPosition(
          () => {
            logger.info('[LocationPermissionService] Browser location permission GRANTED.');
            resolve({ status: 'GRANTED', granted: true });
          },
          (err) => {
            logger.warn('[LocationPermissionService] Browser location notice (or HTTP origin restriction):', err);
            // On web, treat as granted with fallback coordinates so web users are never blocked
            resolve({ status: 'GRANTED', granted: true });
          },
          { enableHighAccuracy: true, timeout: 5000, maximumAge: 30000 }
        );
      });
    }

    try {
      logger.info('[LocationPermissionService] Requesting foreground GPS permission...');
      const response = await Location.requestForegroundPermissionsAsync();

      if (response.status === Location.PermissionStatus.GRANTED) {
        logger.info('[LocationPermissionService] Foreground location permission GRANTED.');
        return { status: 'GRANTED', granted: true };
      }

      if (!response.canAskAgain) {
        logger.warn('[LocationPermissionService] Location permission permanently BLOCKED.');
        return { status: 'BLOCKED', granted: false };
      }

      logger.warn('[LocationPermissionService] Location permission DENIED by user.');
      return { status: 'DENIED', granted: false };
    } catch (error) {
      logger.error('[LocationPermissionService] Permission request failed:', error);
      return { status: 'UNKNOWN', granted: false };
    }
  }

  /**
   * Checks if device location services (GPS hardware switch) are enabled.
   */
  async isLocationServicesEnabled(): Promise<boolean> {
    if (Platform.OS === 'web') {
      return typeof navigator !== 'undefined' && 'geolocation' in navigator;
    }
    try {
      return await Location.hasServicesEnabledAsync();
    } catch (error) {
      logger.error('[LocationPermissionService] Error checking location services:', error);
      return false;
    }
  }

  /**
   * Opens the native device app settings page if permission is blocked.
   */
  async openSettings(): Promise<void> {
    try {
      await Linking.openSettings();
    } catch (error) {
      logger.error('[LocationPermissionService] Failed to open system settings:', error);
    }
  }
}

export const locationPermissionService = LocationPermissionService.getInstance();
