import { repositories } from '../repositories';
import { Ride, RideLocation } from '../types';

export class RideService {
  private rideRepo = repositories.rides;
  private motorcycleRepo = repositories.motorcycles;
  private userRepo = repositories.users;

  async getRides(userId: string, limit = 20, offset = 0): Promise<Ride[]> {
    return this.rideRepo.getRides(userId, limit, offset);
  }

  async getRideById(id: string): Promise<Ride | null> {
    return this.rideRepo.getRideById(id);
  }

  async saveCompletedRide(ride: Partial<Ride>, locations: RideLocation[] = []): Promise<Ride> {
    // 1. Create ride record
    const created = await this.rideRepo.createRide({
      ...ride,
      coordinates: locations,
    });

    // 2. Update motorcycle mileage if motorcycleId is provided
    if (created.motorcycleId && created.distanceKm > 0) {
      try {
        const bike = await this.motorcycleRepo.getMotorcycleById(created.motorcycleId);
        if (bike) {
          const newMileage = (bike.mileageKm || 0) + created.distanceKm;
          await this.motorcycleRepo.updateMotorcycle(bike.id, { mileageKm: Math.round(newMileage * 10) / 10 });
        }
      } catch (err) {
        console.warn('Could not update motorcycle mileage:', err);
      }
    }

    // 3. Update user aggregate stats if user exists
    if (created.userId) {
      try {
        const user = await this.userRepo.getProfile(created.userId);
        if (user && user.statistics) {
          const stats = user.statistics;
          const updatedStats = {
            ...stats,
            totalRides: (stats.totalRides || 0) + 1,
            totalRidesCount: (stats.totalRides || 0) + 1,
            totalDistanceKm: Math.round(((stats.totalDistanceKm || 0) + created.distanceKm) * 10) / 10,
            longestRideKm: Math.max(stats.longestRideKm || 0, created.distanceKm),
            totalDurationSeconds: (stats.totalDurationSeconds || 0) + (created.durationSeconds || 0),
            elevationGainMeters: (stats.elevationGainMeters || 0) + (created.elevationGainMeters || 0),
            maxSpeedKmh: Math.max(stats.maxSpeedKmh || 0, created.maxSpeedKmh || 0),
            maxLeanAngleDegrees: Math.max(stats.maxLeanAngleDegrees || 0, created.maxLeanAngleDegrees || 0),
          };
          await this.userRepo.updateProfile(created.userId, { statistics: updatedStats });
        }
      } catch (err) {
        console.warn('Could not update user stats:', err);
      }
    }

    return created;
  }

  async deleteRide(id: string): Promise<void> {
    return this.rideRepo.deleteRide(id);
  }

  async getRideTelemetry(rideId: string): Promise<RideLocation[]> {
    return this.rideRepo.getRideTelemetry(rideId);
  }
}

export const rideService = new RideService();
export default rideService;
