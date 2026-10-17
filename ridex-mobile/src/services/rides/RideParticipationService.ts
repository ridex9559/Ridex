/**
 * RIDEX — Ride Participation Service
 * Coordinates atomic join and leave actions protected by PostgreSQL stored procedures.
 */

import { supabaseRideParticipantRepository } from '../../repositories/supabase/SupabaseRideParticipantRepository';
import { RideParticipant } from '../../types/groupRide';
import { logger } from '../../utils/logger';

export class RideParticipationService {
  /**
   * Joins an upcoming or live group ride atomically.
   */
  public async joinRide(
    rideId: string,
    userId: string
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const result = await supabaseRideParticipantRepository.joinRide(rideId, userId, 'RIDER');
      if (!result.success) {
        throw new Error(result.error || result.message || 'Could not join ride');
      }
      return result;
    } catch (error: any) {
      logger.error('[RideParticipationService] joinRide error:', error);
      throw error;
    }
  }

  /**
   * Leaves a joined group ride atomically.
   */
  public async leaveRide(
    rideId: string,
    userId: string
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const result = await supabaseRideParticipantRepository.leaveRide(rideId, userId);
      if (!result.success) {
        throw new Error(result.error || result.message || 'Could not leave ride');
      }
      return result;
    } catch (error: any) {
      logger.error('[RideParticipationService] leaveRide error:', error);
      throw error;
    }
  }

  /**
   * Retrieves participant roster for a ride.
   */
  public async getParticipants(rideId: string): Promise<RideParticipant[]> {
    return await supabaseRideParticipantRepository.getParticipantsByRideId(rideId);
  }
}

export const rideParticipationService = new RideParticipationService();
