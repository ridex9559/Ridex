/**
 * Digital Garage & Fleet Zustand Store
 * Scoped strictly to the currently authenticated user
 */

import { create } from 'zustand';
import { Motorcycle, CreateMotorcycleDto } from '@/types/motorcycle';
import { repositories } from '@/repositories';
import { useAuthStore } from './authStore';
import { asyncStorage } from '@/services/storage/asyncStorage';
import { logger } from '@/utils/logger';

interface BikeState {
  motorcycles: Motorcycle[];
  activeMotorcycleId: string | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchMotorcycles: () => Promise<void>;
  setActiveMotorcycle: (id: string) => Promise<void>;
  addMotorcycle: (dto: CreateMotorcycleDto) => Promise<Motorcycle | null>;
  updateMotorcycle: (id: string, updates: Partial<Motorcycle>) => Promise<boolean>;
  deleteMotorcycle: (id: string) => Promise<boolean>;
  getActiveMotorcycle: () => Motorcycle | undefined;
  clearGarage: () => void;
}

export const useBikeStore = create<BikeState>((set, get) => ({
  motorcycles: [],
  activeMotorcycleId: null,
  isLoading: false,
  error: null,

  fetchMotorcycles: async () => {
    const user = useAuthStore.getState().user;
    if (!user || !user.id) {
      set({ motorcycles: [], activeMotorcycleId: null, isLoading: false });
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const bikes = await repositories.motorcycles.getMotorcycles(user.id);
      let activeId = get().activeMotorcycleId;

      // Select primary bike or first available bike
      if (!activeId || !bikes.find((b: Motorcycle) => b.id === activeId)) {
        const primary = bikes.find((b: Motorcycle) => b.isPrimary);
        activeId = primary ? primary.id : (bikes.length > 0 ? bikes[0].id : null);
      }

      set({
        motorcycles: bikes,
        activeMotorcycleId: activeId,
        isLoading: false,
        error: null,
      });

      if (activeId) {
        await asyncStorage.set(asyncStorage.KEYS.ACTIVE_BIKE_ID, activeId);
      }
    } catch (err: any) {
      logger.error('Fetch motorcycles error', err);
      set({ error: err?.message || 'Failed to load garage', isLoading: false });
    }
  },

  setActiveMotorcycle: async (id: string) => {
    const user = useAuthStore.getState().user;
    set({ activeMotorcycleId: id });
    await asyncStorage.set(asyncStorage.KEYS.ACTIVE_BIKE_ID, id);

    if (user?.id) {
      try {
        await repositories.motorcycles.setPrimaryMotorcycle(user.id, id);
      } catch (e) {
        logger.warn('BikeStore', 'Set primary motorcycle warning', e);
      }
    }
    logger.info('Active motorcycle set', id);
  },

  addMotorcycle: async (dto: CreateMotorcycleDto) => {
    const user = useAuthStore.getState().user;
    if (!user || !user.id) {
      set({ error: 'User must be authenticated to add a motorcycle' });
      return null;
    }

    set({ isLoading: true, error: null });
    try {
      const newBike = await repositories.motorcycles.createMotorcycle(user.id, dto);
      const updated = [...get().motorcycles, newBike];
      const shouldBeActive = newBike.isPrimary || updated.length === 1;

      set({
        motorcycles: updated,
        activeMotorcycleId: shouldBeActive ? newBike.id : get().activeMotorcycleId,
        isLoading: false,
      });

      if (shouldBeActive) {
        await asyncStorage.set(asyncStorage.KEYS.ACTIVE_BIKE_ID, newBike.id);
      }

      logger.info('Motorcycle added successfully', newBike.id);
      return newBike;
    } catch (err: any) {
      logger.error('Add motorcycle error', err);
      set({ error: err?.message || 'Failed to add bike', isLoading: false });
      return null;
    }
  },

  updateMotorcycle: async (id: string, updates: Partial<Motorcycle>) => {
    try {
      const updated = await repositories.motorcycles.updateMotorcycle(id, updates);
      set(state => ({
        motorcycles: state.motorcycles.map((b: Motorcycle) => (b.id === id ? updated : b)),
      }));
      return true;
    } catch (err) {
      logger.error('Update motorcycle error', err);
      return false;
    }
  },

  deleteMotorcycle: async (id: string) => {
    try {
      await repositories.motorcycles.deleteMotorcycle(id);
      const remaining = get().motorcycles.filter((b: Motorcycle) => b.id !== id);
      const newActive = get().activeMotorcycleId === id ? (remaining[0]?.id || null) : get().activeMotorcycleId;
      set({
        motorcycles: remaining,
        activeMotorcycleId: newActive,
      });
      return true;
    } catch (err) {
      logger.error('Delete motorcycle error', err);
      return false;
    }
  },

  getActiveMotorcycle: () => {
    const { motorcycles, activeMotorcycleId } = get();
    return motorcycles.find((b: Motorcycle) => b.id === activeMotorcycleId) || motorcycles[0];
  },

  clearGarage: () => {
    set({
      motorcycles: [],
      activeMotorcycleId: null,
      isLoading: false,
      error: null,
    });
  },
}));

export default useBikeStore;
