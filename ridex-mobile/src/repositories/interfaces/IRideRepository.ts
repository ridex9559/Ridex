import { Ride, RideLocation } from '../../types';

export interface IRideRepository {
  getRides(userId: string, limit?: number, offset?: number): Promise<Ride[]>;
  getRideById(id: string): Promise<Ride | null>;
  createRide(ride: Partial<Ride>): Promise<Ride>;
  updateRide(id: string, ride: Partial<Ride>): Promise<Ride>;
  deleteRide(id: string): Promise<void>;
  saveRideTelemetry(rideId: string, locations: RideLocation[]): Promise<void>;
  getRideTelemetry(rideId: string): Promise<RideLocation[]>;
}
