/**
 * Expo Secure Store Service for Sensitive Credentials & Supabase Session Persistence
 */

import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '@/utils/logger';

const AUTH_TOKEN_KEY = 'ridex_auth_token';
const REFRESH_TOKEN_KEY = 'ridex_refresh_token';

/**
 * Universal Storage Adapter for Supabase Auth Session Persistence
 * Uses Hardware Keystore/Keychain on Native and AsyncStorage on Web
 */
export const ExpoSecureStoreAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      if (Platform.OS === 'web') {
        return await AsyncStorage.getItem(key);
      }
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      logger.error('SecureStoreAdapter', `Error getting item for ${key}`, error);
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      if (Platform.OS === 'web') {
        await AsyncStorage.setItem(key, value);
      } else {
        await SecureStore.setItemAsync(key, value);
      }
    } catch (error) {
      logger.error('SecureStoreAdapter', `Error setting item for ${key}`, error);
    }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      if (Platform.OS === 'web') {
        await AsyncStorage.removeItem(key);
      } else {
        await SecureStore.deleteItemAsync(key);
      }
    } catch (error) {
      logger.error('SecureStoreAdapter', `Error removing item for ${key}`, error);
    }
  },
};

class SecureStoreService {
  async setToken(token: string): Promise<void> {
    try {
      await ExpoSecureStoreAdapter.setItem(AUTH_TOKEN_KEY, token);
    } catch (error) {
      logger.error('SecureStore', 'Failed to save auth token', error);
    }
  }

  async getToken(): Promise<string | null> {
    try {
      return await ExpoSecureStoreAdapter.getItem(AUTH_TOKEN_KEY);
    } catch (error) {
      logger.error('SecureStore', 'Failed to read auth token', error);
      return null;
    }
  }

  async setRefreshToken(token: string): Promise<void> {
    try {
      await ExpoSecureStoreAdapter.setItem(REFRESH_TOKEN_KEY, token);
    } catch (error) {
      logger.error('SecureStore', 'Failed to save refresh token', error);
    }
  }

  async getRefreshToken(): Promise<string | null> {
    try {
      return await ExpoSecureStoreAdapter.getItem(REFRESH_TOKEN_KEY);
    } catch (error) {
      logger.error('SecureStore', 'Failed to read refresh token', error);
      return null;
    }
  }

  async clearAuth(): Promise<void> {
    try {
      await ExpoSecureStoreAdapter.removeItem(AUTH_TOKEN_KEY);
      await ExpoSecureStoreAdapter.removeItem(REFRESH_TOKEN_KEY);
    } catch (error) {
      logger.error('SecureStore', 'Failed to delete auth tokens', error);
    }
  }
}

export const secureStore = new SecureStoreService();

export async function saveAuthToken(token: string): Promise<void> {
  return secureStore.setToken(token);
}

export async function getAuthToken(): Promise<string | null> {
  return secureStore.getToken();
}

export async function removeAuthToken(): Promise<void> {
  return secureStore.clearAuth();
}

export default secureStore;
