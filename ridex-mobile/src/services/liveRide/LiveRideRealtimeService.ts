/**
 * RIDEX — Live Ride Realtime Service
 * Subscribes to Supabase Realtime broadcast channels for live rider positions,
 * peer presence updates, and session completion events.
 */

import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../supabase';
import { supabaseLiveRideRepository } from '../../repositories/supabase/SupabaseLiveRideRepository';
import { LiveRiderLocation } from '../../types/liveRide';
import { logger } from '../../utils/logger';

export type LocationListener = (locations: LiveRiderLocation[]) => void;
export type SessionStatusListener = (status: string) => void;

export class LiveRideRealtimeService {
  private channel: RealtimeChannel | null = null;
  private activeSessionId: string | null = null;
  private locationListeners: Set<LocationListener> = new Set();
  private sessionStatusListeners: Set<SessionStatusListener> = new Set();

  /**
   * Subscribes to the realtime channel for a live ride session.
   */
  public async subscribeToSession(sessionId: string): Promise<LiveRiderLocation[]> {
    this.unsubscribe(); // Clean up any existing channel

    this.activeSessionId = sessionId;
    logger.info(`[LiveRideRealtimeService] Subscribing to realtime session ${sessionId}...`);

    // Fetch initial snapshot
    const initialLocations = await supabaseLiveRideRepository.getSessionLocations(sessionId);

    // Create Supabase Realtime Channel
    this.channel = supabase
      .channel(`live_ride_${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ride_live_locations',
          filter: `session_id=eq.${sessionId}`,
        },
        async () => {
          // Refresh and notify listeners on location changes
          const updated = await supabaseLiveRideRepository.getSessionLocations(sessionId);
          this.notifyLocationListeners(updated);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'ride_live_sessions',
          filter: `id=eq.${sessionId}`,
        },
        (payload: any) => {
          const newStatus = payload?.new?.status;
          if (newStatus) {
            this.notifySessionStatusListeners(newStatus);
          }
        }
      )
      .subscribe((status) => {
        logger.info(`[LiveRideRealtimeService] Channel status for ${sessionId}: ${status}`);
      });

    return initialLocations;
  }

  /**
   * Registers a listener for live location updates.
   */
  public onLocationsUpdated(listener: LocationListener): () => void {
    this.locationListeners.add(listener);
    return () => this.locationListeners.delete(listener);
  }

  /**
   * Registers a listener for session lifecycle changes.
   */
  public onSessionStatusChanged(listener: SessionStatusListener): () => void {
    this.sessionStatusListeners.add(listener);
    return () => this.sessionStatusListeners.delete(listener);
  }

  /**
   * Unsubscribes and cleans up channel resources.
   */
  public unsubscribe(): void {
    if (this.channel) {
      logger.info(`[LiveRideRealtimeService] Unsubscribing from session ${this.activeSessionId}`);
      supabase.removeChannel(this.channel);
      this.channel = null;
    }
    this.activeSessionId = null;
    this.locationListeners.clear();
    this.sessionStatusListeners.clear();
  }

  private notifyLocationListeners(locations: LiveRiderLocation[]): void {
    this.locationListeners.forEach((fn) => {
      try {
        fn(locations);
      } catch (err) {
        logger.error('[LiveRideRealtimeService] Error in location listener:', err);
      }
    });
  }

  private notifySessionStatusListeners(status: string): void {
    this.sessionStatusListeners.forEach((fn) => {
      try {
        fn(status);
      } catch (err) {
        logger.error('[LiveRideRealtimeService] Error in session status listener:', err);
      }
    });
  }
}

export const liveRideRealtimeService = new LiveRideRealtimeService();
