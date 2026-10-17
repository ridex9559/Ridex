/**
 * RIDEX — Live Ride Session Service
 * Manages live group ride session lifecycle (start live ride, complete ride, session checks).
 */

import { supabaseLiveRideRepository } from '../../repositories/supabase/SupabaseLiveRideRepository';
import { LiveRideSession } from '../../types/liveRide';
import { logger } from '../../utils/logger';

export class LiveRideService {
  /**
   * Starts a live ride session (Organizer only).
   */
  public async startLiveRide(rideId: string, organizerId: string): Promise<string> {
    try {
      logger.info(`[LiveRideService] Starting live ride session for ride ${rideId}...`);
      const result = await supabaseLiveRideRepository.startLiveRide(rideId, organizerId);
      if (!result.success || !result.sessionId) {
        throw new Error(result.error || result.message || 'Failed to start live ride');
      }
      return result.sessionId;
    } catch (error: any) {
      logger.error('[LiveRideService] startLiveRide error:', error);
      throw error;
    }
  }

  /**
   * Completes and ends a live ride session (Organizer only).
   */
  public async endLiveRide(rideId: string, organizerId: string): Promise<void> {
    try {
      logger.info(`[LiveRideService] Ending live ride session for ride ${rideId}...`);
      const result = await supabaseLiveRideRepository.endLiveRide(rideId, organizerId);
      if (!result.success) {
        throw new Error(result.error || result.message || 'Failed to end live ride');
      }
    } catch (error: any) {
      logger.error('[LiveRideService] endLiveRide error:', error);
      throw error;
    }
  }

  /**
   * Retrieves active live session for a ride.
   */
  public async getActiveSession(rideId: string): Promise<LiveRideSession | null> {
    return await supabaseLiveRideRepository.getActiveSessionByRideId(rideId);
  }
}

export const liveRideService = new LiveRideService();
