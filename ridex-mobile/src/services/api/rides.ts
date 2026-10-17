/**
 * Rides and Routes API Service (with Mock fallback)
 */

import { apiClient } from './client';
import { env } from '@/config/env';
import { Ride, Route } from '@/types';
import { MOCK_RIDES } from '@/data/rides';
import { MOCK_ROUTES } from '@/data/routes';

class RideService {
  async getRides(): Promise<Ride[]> {
    if (env.useMockData) {
      return MOCK_RIDES;
    }
    const res = await apiClient.get<Ride[]>('/rides');
    return res.data;
  }

  async getRideById(id: string): Promise<Ride | null> {
    if (env.useMockData) {
      return MOCK_RIDES.find(r => r.id === id) || null;
    }
    const res = await apiClient.get<Ride>(`/rides/${id}`);
    return res.data;
  }

  async createRide(ride: Partial<Ride>): Promise<Ride> {
    if (env.useMockData) {
      const created: Ride = {
        id: `ride-${Date.now()}`,
        userId: ride.userId || 'usr-1',
        motorcycleId: ride.motorcycleId || 'bike-1',
        motorcycleName: ride.motorcycleName || 'Ducati Multistrada V4 S',
        title: ride.title || ride.name || 'Alpine Pass Adventure',
        name: ride.title || ride.name || 'Alpine Pass Adventure',
        startTime: ride.startTime || new Date().toISOString(),
        endTime: ride.endTime || new Date().toISOString(),
        distanceKm: ride.distanceKm || 0,
        durationSeconds: ride.durationSeconds || 0,
        averageSpeedKmh: ride.averageSpeedKmh || 0,
        maxSpeedKmh: ride.maxSpeedKmh || 0,
        elevationGainMeters: ride.elevationGainMeters || 0,
        maxLeanAngleDegrees: ride.maxLeanAngleDegrees || 45,
        type: ride.type || 'SOLO',
        startLocationName: ride.startLocationName || 'Start Point',
        endLocationName: ride.endLocationName || 'Summit Viewpoint',
        coordinates: ride.coordinates || [],
        status: 'completed',
        isPublic: ride.isPublic ?? true,
      };
      return created;
    }

    const res = await apiClient.post<Ride>('/rides', ride);
    return res.data;
  }

  async getRoutes(): Promise<Route[]> {
    if (env.useMockData) {
      return MOCK_ROUTES;
    }
    const res = await apiClient.get<Route[]>('/routes');
    return res.data;
  }

  async getRouteById(id: string): Promise<Route | null> {
    if (env.useMockData) {
      return MOCK_ROUTES.find(r => r.id === id) || null;
    }
    const res = await apiClient.get<Route>(`/routes/${id}`);
    return res.data;
  }
}

export const rideService = new RideService();

export async function fetchExploreRoutes(): Promise<Route[]> {
  return rideService.getRoutes();
}

export async function fetchRouteById(id: string): Promise<Route | null> {
  return rideService.getRouteById(id);
}

export async function fetchUserRides(): Promise<Ride[]> {
  return rideService.getRides();
}

export async function saveCompletedRide(ride: Partial<Ride>): Promise<Ride> {
  return rideService.createRide(ride);
}

export default rideService;
