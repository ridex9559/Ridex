/**
 * AsyncStorage Service for Non-Sensitive Preferences and Flags
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '@/utils/logger';

export const ASYNC_KEYS = {
  USER_PROFILE: '@ridex:user_profile',
  ACTIVE_BIKE_ID: '@ridex:active_bike_id',
  ONBOARDING_COMPLETED: '@ridex:onboarding_completed',
  UNITS_SYSTEM: '@ridex:units_system',
  OFFLINE_SAVED_RIDES: '@ridex:offline_saved_rides',
  OFFLINE_CACHED_ROUTES: '@ridex:offline_cached_routes',
} as const;

class AsyncStorageService {
  readonly KEYS = ASYNC_KEYS;

  async set(key: string, value: string): Promise<void> {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      logger.error('AsyncStorage', `Failed to set string for ${key}`, error);
    }
  }

  async get(key: string): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(key);
    } catch (error) {
      logger.error('AsyncStorage', `Failed to get string for ${key}`, error);
      return null;
    }
  }

  async setJson<T>(key: string, value: T): Promise<void> {
    try {
      const stringValue = JSON.stringify(value);
      await AsyncStorage.setItem(key, stringValue);
    } catch (error) {
      logger.error('AsyncStorage', `Failed to set item ${key}`, error);
    }
  }

  async getJson<T>(key: string, defaultValue?: T): Promise<T | null> {
    try {
      const stringValue = await AsyncStorage.getItem(key);
      if (stringValue === null) return defaultValue ?? null;
      return JSON.parse(stringValue) as T;
    } catch (error) {
      logger.error('AsyncStorage', `Failed to get item ${key}`, error);
      return defaultValue ?? null;
    }
  }

  async remove(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      logger.error('AsyncStorage', `Failed to remove item ${key}`, error);
    }
  }
}

export const asyncStorage = new AsyncStorageService();

// Standalone exports for backward compatibility
export async function setItem<T>(key: string, value: T): Promise<void> {
  return asyncStorage.setJson(key, value);
}

export async function getItem<T>(key: string, defaultValue: T): Promise<T> {
  const result = await asyncStorage.getJson<T>(key, defaultValue);
  return result ?? defaultValue;
}

export async function removeItem(key: string): Promise<void> {
  return asyncStorage.remove(key);
}

export default asyncStorage;
