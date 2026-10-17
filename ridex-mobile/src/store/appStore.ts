import { create } from 'zustand';
import { asyncStorage } from '@/services/storage/asyncStorage';
import { logger } from '@/utils/logger';

interface AppState {
  isOnline: boolean;
  hasCompletedOnboarding: boolean;
  theme: 'dark' | 'oled';
  units: 'metric' | 'imperial';
  offlineQueueCount: number;
  isInitialized: boolean;

  // Actions
  initApp: () => Promise<void>;
  setOnboardingCompleted: (completed: boolean) => Promise<void>;
  setOnlineStatus: (isOnline: boolean) => void;
  setUnits: (units: 'metric' | 'imperial') => Promise<void>;
  setOfflineQueueCount: (count: number) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  isOnline: true,
  hasCompletedOnboarding: false,
  theme: 'oled',
  units: 'metric',
  offlineQueueCount: 0,
  isInitialized: false,

  initApp: async () => {
    try {
      const onboardingDone = await asyncStorage.get(asyncStorage.KEYS.ONBOARDING_COMPLETED);
      const savedUnits = await asyncStorage.get(asyncStorage.KEYS.UNITS_SYSTEM);

      set({
        hasCompletedOnboarding: onboardingDone === 'true',
        units: (savedUnits as 'metric' | 'imperial') || 'metric',
        isInitialized: true,
      });
      logger.info('App state initialized', { onboardingDone, savedUnits });
    } catch (err) {
      logger.error('Failed to initialize app state', err);
      set({ isInitialized: true });
    }
  },

  setOnboardingCompleted: async (completed: boolean) => {
    set({ hasCompletedOnboarding: completed });
    await asyncStorage.set(asyncStorage.KEYS.ONBOARDING_COMPLETED, String(completed));
    logger.info('Onboarding completion status updated', completed);
  },

  setOnlineStatus: (isOnline: boolean) => {
    set({ isOnline });
    logger.info('Network status updated', { isOnline });
  },

  setUnits: async (units: 'metric' | 'imperial') => {
    set({ units });
    await asyncStorage.set(asyncStorage.KEYS.UNITS_SYSTEM, units);
  },

  setOfflineQueueCount: (count: number) => {
    set({ offlineQueueCount: count });
  },
}));
