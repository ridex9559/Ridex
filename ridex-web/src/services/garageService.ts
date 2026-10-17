/**
 * RIDEX Web — Motorcycle Garage Service
 * Interfaces with public.motorcycles table with strict RLS enforcement.
 */

import { supabase } from './supabase';
import { Motorcycle } from '../types';

export const garageService = {
  /**
   * Fetches all non-deleted motorcycles for an authenticated user.
   */
  async getMotorcycles(userId: string): Promise<Motorcycle[]> {
    if (!userId) return [];

    const { data, error } = await supabase
      .from('motorcycles')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[garageService] getMotorcycles error:', error);
      return [];
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      manufacturer: row.manufacturer || 'Yamaha',
      model: row.model || 'MT-03',
      year: row.year || 2024,
      color: row.color || 'Black',
      engineCc: row.engine_cc || row.displacement_cc || 400,
      displacementCc: row.displacement_cc || row.engine_cc || 400,
      registrationNumber: row.registration_number || '',
      fuelTankCapacityL: Number(row.fuel_tank_capacity_l || 15.0),
      avgMileageKmpl: Number(row.avg_mileage_kmpl || 28.0),
      isPrimary: Boolean(row.is_primary),
      imageUrl: row.image_url || 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=600&q=80',
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      deletedAt: row.deleted_at,
    }));
  },

  /**
   * Adds a new motorcycle to the digital garage.
   */
  async addMotorcycle(userId: string, bike: Partial<Motorcycle>): Promise<Motorcycle | null> {
    const payload = {
      user_id: userId,
      manufacturer: bike.manufacturer || 'Yamaha',
      model: bike.model || 'MT-03',
      year: bike.year || 2024,
      color: bike.color || 'Black',
      engine_cc: bike.engineCc || 400,
      displacement_cc: bike.engineCc || 400,
      registration_number: bike.registrationNumber?.toUpperCase() || null,
      fuel_tank_capacity_l: bike.fuelTankCapacityL || 15.0,
      avg_mileage_kmpl: bike.avgMileageKmpl || 28.0,
      is_primary: Boolean(bike.isPrimary),
      image_url: bike.imageUrl || 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=600&q=80',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('motorcycles')
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error('[garageService] addMotorcycle error:', error);
      throw error;
    }

    return {
      id: data.id,
      userId: data.user_id,
      manufacturer: data.manufacturer,
      model: data.model,
      year: data.year,
      color: data.color,
      engineCc: data.engine_cc,
      displacementCc: data.displacement_cc,
      registrationNumber: data.registration_number,
      fuelTankCapacityL: Number(data.fuel_tank_capacity_l),
      avgMileageKmpl: Number(data.avg_mileage_kmpl),
      isPrimary: Boolean(data.is_primary),
      imageUrl: data.image_url,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  },

  /**
   * Updates motorcycle details.
   */
  async updateMotorcycle(id: string, updates: Partial<Motorcycle>): Promise<boolean> {
    const payload: any = {
      updated_at: new Date().toISOString(),
    };
    if (updates.manufacturer) payload.manufacturer = updates.manufacturer;
    if (updates.model) payload.model = updates.model;
    if (updates.year) payload.year = updates.year;
    if (updates.color) payload.color = updates.color;
    if (updates.engineCc) {
      payload.engine_cc = updates.engineCc;
      payload.displacement_cc = updates.engineCc;
    }
    if (updates.registrationNumber) payload.registration_number = updates.registrationNumber.toUpperCase();
    if (updates.fuelTankCapacityL) payload.fuel_tank_capacity_l = updates.fuelTankCapacityL;
    if (updates.avgMileageKmpl) payload.avg_mileage_kmpl = updates.avgMileageKmpl;
    if (updates.imageUrl) payload.image_url = updates.imageUrl;
    if (updates.isPrimary !== undefined) payload.is_primary = updates.isPrimary;

    const { error } = await supabase
      .from('motorcycles')
      .update(payload)
      .eq('id', id);

    return !error;
  },

  /**
   * Sets a motorcycle as primary and unsets others.
   */
  async setPrimary(userId: string, bikeId: string): Promise<boolean> {
    await supabase
      .from('motorcycles')
      .update({ is_primary: false })
      .eq('user_id', userId);

    const { error } = await supabase
      .from('motorcycles')
      .update({ is_primary: true })
      .eq('id', bikeId);

    return !error;
  },

  /**
   * Deletes a motorcycle (soft delete with deleted_at timestamp).
   */
  async deleteMotorcycle(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('motorcycles')
      .update({ deleted_at: new Date().toISOString(), is_primary: false })
      .eq('id', id);

    return !error;
  },

  /**
   * Persists rider onboarding preference (e.g. 'no_bike' or 'has_bike').
   * Uses Supabase Auth user metadata + localStorage cache with ZERO schema migration.
   */
  async setOnboardingChoice(userId: string, choice: 'no_bike' | 'completed'): Promise<void> {
    const key = `ridex_onboarding_${userId}`;
    onboardingMemoryCache.set(key, choice);

    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(key, choice);
      } catch (_) {}
    } else if (typeof globalThis !== 'undefined' && (globalThis as any).localStorage) {
      try {
        (globalThis as any).localStorage.setItem(key, choice);
      } catch (_) {}
    }

    try {
      await supabase.auth.updateUser({
        data: { onboarding_choice: choice, has_bike: choice === 'completed' },
      });
    } catch (err) {
      console.warn('[garageService] setOnboardingChoice warning:', err);
    }
  },

  /**
   * Retrieves saved onboarding choice.
   */
  getOnboardingChoice(userId: string, userMetadata?: any): string | null {
    if (userMetadata?.onboarding_choice) {
      return userMetadata.onboarding_choice;
    }

    const key = `ridex_onboarding_${userId}`;
    if (typeof window !== 'undefined' && window.localStorage) {
      const val = window.localStorage.getItem(key);
      if (val) return val;
    } else if (typeof globalThis !== 'undefined' && (globalThis as any).localStorage) {
      const val = (globalThis as any).localStorage.getItem(key);
      if (val) return val;
    }

    return onboardingMemoryCache.get(key) || null;
  },
};

const onboardingMemoryCache = new Map<string, string>();


