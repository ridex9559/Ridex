/**
 * RIDEX — Live Location Publishing Service
 * Consumes valid GPS coordinates from the Step 5 location engine, enforces
 * distance and time throttling, and broadcasts live telemetry to Supabase.
 */

import { supabaseLiveRideRepository } from '../../repositories/supabase/SupabaseLiveRideRepository';
import { RideLocationPoint } from '../location/locationTypes';
import { LIVE_RIDE_CONFIG } from '../../config/liveRide';
import { calculateHaversineDistance } from '../../utils/geo/haversine';
import { logger } from '../../utils/logger';

export class LiveLocationService {
  private activeSessionId: string | null = null;
  private currentUserId: string | null = null;
  private isSharingEnabled = false;

  private lastPublishedTimestamp = 0;
  private lastPublishedLat: number | null = null;
  private lastPublishedLng: number | null = null;

  /**
   * Begins live location sharing for a session.
   */
  public startSharing(sessionId: string, userId: string): void {
    this.activeSessionId = sessionId;
    this.currentUserId = userId;
    this.isSharingEnabled = true;
    this.lastPublishedTimestamp = 0;
    this.lastPublishedLat = null;
    this.lastPublishedLng = null;
    logger.info(`[LiveLocationService] Live sharing enabled for session ${sessionId}`);
  }

  /**
   * Stops live location sharing and cleans up broadcast presence.
   */
  public async stopSharing(): Promise<void> {
    if (this.activeSessionId && this.currentUserId) {
      try {
        await supabaseLiveRideRepository.removeUserLiveLocation(this.activeSessionId, this.currentUserId);
      } catch {}
    }
    this.isSharingEnabled = false;
    this.activeSessionId = null;
    this.currentUserId = null;
    logger.info('[LiveLocationService] Live sharing stopped.');
  }

  /**
   * Toggles live sharing on or off during an active ride.
   */
  public toggleSharing(enabled: boolean): void {
    this.isSharingEnabled = enabled;
  }

  public getSharingStatus(): boolean {
    return this.isSharingEnabled && !!this.activeSessionId;
  }

  /**
   * Evaluates an incoming GPS point from the Step 5 tracking engine and publishes if throttled conditions pass.
   */
  public async processGpsUpdate(point: RideLocationPoint): Promise<boolean> {
    if (!this.isSharingEnabled || !this.activeSessionId || !this.currentUserId) {
      return false;
    }

    // 1. Validate Accuracy
    if (point.accuracy !== null && point.accuracy > LIVE_RIDE_CONFIG.MAX_BROADCAST_ACCURACY_METERS) {
      return false; // Skip inaccurate GPS drift
    }

    const now = Date.now();
    const timeSinceLastPublish = now - this.lastPublishedTimestamp;

    // 2. Check Distance Movement
    let distanceMovedMeters = 0;
    if (this.lastPublishedLat !== null && this.lastPublishedLng !== null) {
      distanceMovedMeters = calculateHaversineDistance(
        this.lastPublishedLat,
        this.lastPublishedLng,
        point.latitude,
        point.longitude
      );
    } else {
      distanceMovedMeters = 999; // First point always passes
    }

    // 3. Throttling Condition: Send if time passed AND rider moved, or if 15s elapsed
    const shouldPublish =
      (timeSinceLastPublish >= LIVE_RIDE_CONFIG.BROADCAST_INTERVAL_MS &&
        distanceMovedMeters >= LIVE_RIDE_CONFIG.MIN_MOVEMENT_DISTANCE_METERS) ||
      timeSinceLastPublish >= 15000;

    if (!shouldPublish) {
      return false;
    }

    // 4. Atomic Upsert to Supabase
    try {
      this.lastPublishedTimestamp = now;
      this.lastPublishedLat = point.latitude;
      this.lastPublishedLng = point.longitude;

      await supabaseLiveRideRepository.upsertLiveLocation({
        sessionId: this.activeSessionId,
        userId: this.currentUserId,
        latitude: point.latitude,
        longitude: point.longitude,
        heading: point.heading ?? null,
        speed: point.speed ?? 0,
        accuracy: point.accuracy ?? null,
      });

      return true;
    } catch (error) {
      logger.warn('[LiveLocationService] Broadcast failed:', error);
      return false;
    }
  }
}

export const liveLocationService = new LiveLocationService();
