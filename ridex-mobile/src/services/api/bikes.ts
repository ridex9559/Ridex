/**
 * Motorcycles & Garage API Service
 */

import { apiClient } from './client';
import { env } from '@/config/env';
import { CreateMotorcycleDto, Motorcycle } from '@/types';
import { MOCK_MOTORCYCLES } from '@/data/motorcycles';

class BikeService {
  async getUserBikes(): Promise<Motorcycle[]> {
    if (env.useMockData) {
      return MOCK_MOTORCYCLES;
    }
    const res = await apiClient.get<Motorcycle[]>('/motorcycles');
    return res.data;
  }

  async getBikeById(id: string): Promise<Motorcycle | null> {
    if (env.useMockData) {
      return MOCK_MOTORCYCLES.find(b => b.id === id) || null;
    }
    const res = await apiClient.get<Motorcycle>(`/motorcycles/${id}`);
    return res.data;
  }

  async createBike(dto: CreateMotorcycleDto): Promise<Motorcycle> {
    if (env.useMockData) {
      const created: Motorcycle = {
        id: `bike-${Date.now()}`,
        brand: dto.brand || dto.make || 'Motorcycle',
        make: dto.make || dto.brand || 'Motorcycle',
        manufacturer: dto.make || dto.brand,
        model: dto.model,
        year: dto.year,
        displacementCc: dto.displacementCc || 1000,
        mileageKm: dto.mileageKm || 0,
        horsepower: dto.horsepower || 160,
        category: dto.category || 'ADVENTURE',
        nickname: dto.nickname,
        registrationNumber: dto.registrationNumber || 'RIDEX-001',
        isPrimary: dto.isPrimary ?? false,
        engineHealth: 'Optimal',
        createdAt: new Date().toISOString(),
      };
      return created;
    }

    const res = await apiClient.post<Motorcycle>('/motorcycles', dto);
    return res.data;
  }

  async updateBike(id: string, updates: Partial<Motorcycle>): Promise<Motorcycle> {
    if (env.useMockData) {
      const existing = MOCK_MOTORCYCLES.find(b => b.id === id) || MOCK_MOTORCYCLES[0];
      return { ...existing, ...updates };
    }
    const res = await apiClient.put<Motorcycle>(`/motorcycles/${id}`, updates);
    return res.data;
  }

  async deleteBike(id: string): Promise<void> {
    if (!env.useMockData) {
      await apiClient.delete(`/motorcycles/${id}`);
    }
  }
}

export const bikeService = new BikeService();

export async function fetchUserMotorcycles(): Promise<Motorcycle[]> {
  return bikeService.getUserBikes();
}

export async function createMotorcycle(dto: CreateMotorcycleDto): Promise<Motorcycle> {
  return bikeService.createBike(dto);
}

export default bikeService;
