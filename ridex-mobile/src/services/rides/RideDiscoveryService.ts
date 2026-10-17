/**
 * RIDEX — Ride Discovery Service
 * Fetches upcoming community group rides with search, filters, and pagination.
 */

import { supabaseRideRepository } from '../../repositories/supabase/SupabaseRideRepository';
import { RideEvent, RideDiscoveryFilters } from '../../types/groupRide';
import { logger } from '../../utils/logger';

export class RideDiscoveryService {
  /**
   * Retrieves upcoming published and live group rides.
   */
  public async discoverRides(filters: RideDiscoveryFilters = {}): Promise<RideEvent[]> {
    try {
      return await supabaseRideRepository.getUpcomingGroupRides(filters);
    } catch (error) {
      logger.error('[RideDiscoveryService] discoverRides error:', error);
      return [];
    }
  }
}

export const rideDiscoveryService = new RideDiscoveryService();
