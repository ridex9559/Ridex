import { IRideRepository } from '../interfaces/IRideRepository';
import { Ride, RideLocation } from '../../types';
import { mockPastRides } from '../../data/rides';

export class MockRideRepository implements IRideRepository {
  private rides: Ride[] = [...mockPastRides];
  private telemetry: Map<string, RideLocation[]> = new Map();

  async getRides(userId: string, limit = 20, offset = 0): Promise<Ride[]> {
    return this.rides.slice(offset, offset + limit);
  }

  async getRideById(id: string): Promise<Ride | null> {
    return this.rides.find((r) => r.id === id) || null;
  }

  async createRide(ride: Partial<Ride>): Promise<Ride> {
    const newRide: Ride = {
      id: ride.id || `ride-${Date.now()}`,
      userId: ride.userId || 'usr-1',
      motorcycleId: ride.motorcycleId || 'bike-1',
      motorcycleName: ride.motorcycleName || 'Motorcycle',
      title: ride.title || ride.name || 'Completed Ride',
      name: ride.title || ride.name || 'Completed Ride',
      startTime: ride.startTime || new Date().toISOString(),
      endTime: ride.endTime || new Date().toISOString(),
      distanceKm: ride.distanceKm || 0,
      durationSeconds: ride.durationSeconds || 0,
      averageSpeedKmh: ride.averageSpeedKmh || 0,
      maxSpeedKmh: ride.maxSpeedKmh || 0,
      elevationGainMeters: ride.elevationGainMeters || 0,
      maxLeanAngleDegrees: ride.maxLeanAngleDegrees || 0,
      startLocationName: ride.startLocationName || 'Start Point',
      endLocationName: ride.endLocationName || 'Destination',
      type: ride.type || 'SOLO',
      status: ride.status || 'completed',
      routeCoordinates: ride.routeCoordinates || [],
      coordinates: ride.coordinates || [],
      thumbnailUrl: ride.thumbnailUrl || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&q=80',
      isPublic: ride.isPublic ?? true,
    };

    if (ride.coordinates && ride.coordinates.length > 0) {
      this.telemetry.set(newRide.id, [...ride.coordinates]);
    }

    this.rides.unshift(newRide);
    return newRide;
  }

  async updateRide(id: string, ride: Partial<Ride>): Promise<Ride> {
    const idx = this.rides.findIndex((r) => r.id === id);
    if (idx === -1) {
      throw new Error(`Ride not found: ${id}`);
    }
    const updated = { ...this.rides[idx], ...ride };
    this.rides[idx] = updated;
    return updated;
  }

  async deleteRide(id: string): Promise<void> {
    this.rides = this.rides.filter((r) => r.id !== id);
    this.telemetry.delete(id);
  }

  async saveRideTelemetry(rideId: string, locations: RideLocation[]): Promise<void> {
    const existing = this.telemetry.get(rideId) || [];
    this.telemetry.set(rideId, [...existing, ...locations]);
  }

  async getRideTelemetry(rideId: string): Promise<RideLocation[]> {
    return this.telemetry.get(rideId) || [];
  }
}
