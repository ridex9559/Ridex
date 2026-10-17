/**
 * Background Location Service Abstraction
 * Prepares the architecture for Expo TaskManager and native background tracking.
 */

import { Platform } from 'react-native';
import { logger } from '@/utils/logger';

export const RIDEX_BACKGROUND_LOCATION_TASK = 'RIDEX_BACKGROUND_LOCATION_TRACKING';

export class BackgroundLocationService {
  private static instance: BackgroundLocationService | null = null;
  private isRegistered = false;

  private constructor() {}

  public static getInstance(): BackgroundLocationService {
    if (!BackgroundLocationService.instance) {
      BackgroundLocationService.instance = new BackgroundLocationService();
    }
    return BackgroundLocationService.instance;
  }

  /**
   * Registers the background location task with Expo TaskManager if supported on platform.
   */
  async registerBackgroundTask(): Promise<boolean> {
    if (Platform.OS === 'web') return false;

    try {
      logger.info('[BackgroundLocationService] Preparing background location task registration...');
      // Task registration will be activated when native background capabilities are built
      this.isRegistered = true;
      return true;
    } catch (error) {
      logger.error('[BackgroundLocationService] Failed to register background task:', error);
      return false;
    }
  }

  async unregisterBackgroundTask(): Promise<void> {
    if (!this.isRegistered) return;
    this.isRegistered = false;
    logger.info('[BackgroundLocationService] Unregistered background location task.');
  }
}

export const backgroundLocationService = BackgroundLocationService.getInstance();
