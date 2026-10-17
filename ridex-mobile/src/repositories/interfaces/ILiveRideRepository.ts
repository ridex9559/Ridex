/**
 * RIDEX — Live Group Ride Repository Interface
 */

import { LiveRideSession, LiveRiderLocation } from '../../types/liveRide';

export interface ILiveRideRepository {
  getActiveSessionByRideId(rideId: string): Promise<LiveRideSession | null>;
  startLiveRide(rideId: string, userId: string): Promise<{ success: boolean; sessionId?: string; error?: string; message?: string }>;
  endLiveRide(rideId: string, userId: string): Promise<{ success: boolean; error?: string; message?: string }>;
  upsertLiveLocation(params: {
    sessionId: string;
    userId: string;
    latitude: number;
    longitude: number;
    heading?: number | null;
    speed?: number | null;
    accuracy?: number | null;
  }): Promise<void>;
  getSessionLocations(sessionId: string): Promise<LiveRiderLocation[]>;
  removeUserLiveLocation(sessionId: string, userId: string): Promise<void>;
}
