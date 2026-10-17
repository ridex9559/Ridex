/**
 * RIDEX V3 — Separation & Spatial Clustering Engine
 * Production-grade geodesic Haversine distance calculations, multi-reference spread metrics,
 * hysteresis state recovery (500m/400m and 1000m/800m), and location freshness tracking.
 */

import { LiveRiderLocation } from '../../types/liveRide';
import { GroupSeparationState, SeparatedRiderInfo, RiderTrackingState, GroupSeparationStatus } from '../../types/connectRide';
import { CONNECT_RIDE_CONFIG } from '../../config/connectRide';
import { calculateDistanceMeters, isValidCoordinate } from '../../utils/geo/routeBounds';
import { MapCoordinate } from '../maps/mapTypes';

// In-memory hysteresis state tracker across animation/telemetry frames
const riderHysteresisMap = new Map<string, { lastStatus: GroupSeparationStatus; lastAlertTime: number }>();

export class SeparationEngine {
  /**
   * Helper to extract clean coordinate from any rider beacon format.
   */
  public static extractCoordinate(rider: LiveRiderLocation): MapCoordinate | null {
    if (rider.coordinate && isValidCoordinate(rider.coordinate)) {
      return {
        latitude: Number(rider.coordinate.latitude),
        longitude: Number(rider.coordinate.longitude),
      };
    }
    if (isValidCoordinate(rider.latitude, rider.longitude)) {
      return {
        latitude: Number(rider.latitude),
        longitude: Number(rider.longitude),
      };
    }
    return null;
  }

  /**
   * Evaluates location freshness based on timestamp.
   */
  public static evaluateFreshness(updatedAt: string | number | undefined): 'LIVE' | 'STALE' | 'LOST' {
    if (!updatedAt) return 'LOST';
    const timestamp = typeof updatedAt === 'string' ? new Date(updatedAt).getTime() : updatedAt;
    const ageMs = Date.now() - timestamp;

    if (ageMs < CONNECT_RIDE_CONFIG.FRESHNESS.STALE_LOCATION_MS) {
      return 'LIVE';
    }
    if (ageMs < CONNECT_RIDE_CONFIG.FRESHNESS.LOST_LOCATION_MS) {
      return 'STALE';
    }
    return 'LOST';
  }

  /**
   * Evaluates the relative positioning of all live squad riders.
   */
  public static evaluateGroupSeparation(
    riders: LiveRiderLocation[],
    currentUserId?: string,
    leaderUserId?: string
  ): GroupSeparationState {
    const now = Date.now();

    // 1. Classify freshness & valid coordinates
    const parsedRiders = riders.map((r) => {
      const coord = this.extractCoordinate(r);
      const freshness = this.evaluateFreshness(r.updatedAt);
      return {
        raw: r,
        coord,
        freshness,
        userId: r.userId,
        name: r.user?.name || r.user?.fullName || (r.userId === currentUserId ? 'You' : 'Squad Rider'),
      };
    });

    const activeTrackingRiders = parsedRiders.filter((r) => r.coord !== null && r.freshness !== 'LOST');
    const staleCount = parsedRiders.filter((r) => r.freshness === 'STALE').length;

    if (activeTrackingRiders.length <= 1) {
      return {
        status: 'TOGETHER',
        maxSpreadMeters: 0,
        leadDistanceMeters: 0,
        tailDistanceMeters: 0,
        activeRidersCount: activeTrackingRiders.length,
        staleRidersCount: staleCount,
        separatedRiders: [],
        message: activeTrackingRiders.length === 1 ? 'Solo Rider / Squad Rendezvous' : 'Searching for Squad GPS...',
      };
    }

    // 2. Identify Reference Points: Leader, Me, and Centroid
    const leaderRider = activeTrackingRiders.find((r) => r.userId === leaderUserId) || activeTrackingRiders[0];
    const meRider = activeTrackingRiders.find((r) => r.userId === currentUserId);

    const avgLat = activeTrackingRiders.reduce((sum, r) => sum + r.coord!.latitude, 0) / activeTrackingRiders.length;
    const avgLng = activeTrackingRiders.reduce((sum, r) => sum + r.coord!.longitude, 0) / activeTrackingRiders.length;
    const centroidCoord: MapCoordinate = { latitude: avgLat, longitude: avgLng };

    // 3. Compute pairwise distances and distances from leader/me
    let maxDistanceMeters = 0;
    let maxLeadDistance = 0;
    let maxTailDistance = 0;

    const separatedRiders: SeparatedRiderInfo[] = [];

    for (let i = 0; i < activeTrackingRiders.length; i++) {
      const riderA = activeTrackingRiders[i];

      // Distance from leader
      const distFromLeader = calculateDistanceMeters(riderA.coord!, leaderRider.coord!);
      if (distFromLeader > maxLeadDistance) maxLeadDistance = distFromLeader;

      // Distance from me (if me is present)
      if (meRider && meRider.userId !== riderA.userId) {
        const distFromMe = calculateDistanceMeters(riderA.coord!, meRider.coord!);
        if (distFromMe > maxTailDistance) maxTailDistance = distFromMe;
      }

      // Pairwise max distance across entire cluster
      for (let j = i + 1; j < activeTrackingRiders.length; j++) {
        const riderB = activeTrackingRiders[j];
        const pairDist = calculateDistanceMeters(riderA.coord!, riderB.coord!);
        if (pairDist > maxDistanceMeters) {
          maxDistanceMeters = pairDist;
        }
      }

      // Distance to centroid for separation detection
      const distToCentroid = calculateDistanceMeters(riderA.coord!, centroidCoord);
      const prevHysteresis = riderHysteresisMap.get(riderA.userId);
      const prevStatus = prevHysteresis?.lastStatus || 'TOGETHER';

      let trackingState: RiderTrackingState = 'NEAR_GROUP';

      if (riderA.freshness === 'STALE') {
        trackingState = 'LOCATION_STALE';
      } else if (prevStatus === 'SEPARATED') {
        // Hysteresis: Must return within RECOVERY_SIGNIFICANT_METERS (800m) to clear critical
        if (distToCentroid > CONNECT_RIDE_CONFIG.SEPARATION.RECOVERY_SIGNIFICANT_METERS) {
          trackingState = 'SEPARATED';
        } else if (distToCentroid > CONNECT_RIDE_CONFIG.SEPARATION.RECOVERY_WARNING_METERS) {
          trackingState = 'NEAR_GROUP';
        }
      } else if (prevStatus === 'SPREAD') {
        // Hysteresis: Must return within RECOVERY_WARNING_METERS (400m) to return to TOGETHER
        if (distToCentroid > CONNECT_RIDE_CONFIG.SEPARATION.SIGNIFICANT_SEPARATION_METERS) {
          trackingState = 'SEPARATED';
        } else if (distToCentroid > CONNECT_RIDE_CONFIG.SEPARATION.RECOVERY_WARNING_METERS) {
          trackingState = 'NEAR_GROUP';
        }
      } else {
        if (distToCentroid > CONNECT_RIDE_CONFIG.SEPARATION.SIGNIFICANT_SEPARATION_METERS) {
          trackingState = 'SEPARATED';
        }
      }

      if (trackingState === 'SEPARATED') {
        separatedRiders.push({
          userId: riderA.userId,
          name: riderA.name,
          distanceBehindMeters: Math.round(distFromLeader),
          distanceBehindKm: Number((distFromLeader / 1000).toFixed(1)),
          coordinate: riderA.coord!,
          lastUpdated: String(riderA.raw.updatedAt || new Date().toISOString()),
          trackingState: 'SEPARATED',
          reference: 'LEADER',
        });
        riderHysteresisMap.set(riderA.userId, { lastStatus: 'SEPARATED', lastAlertTime: now });
      } else if (distToCentroid > CONNECT_RIDE_CONFIG.SEPARATION.WARNING_SEPARATION_METERS) {
        riderHysteresisMap.set(riderA.userId, { lastStatus: 'SPREAD', lastAlertTime: now });
      } else {
        riderHysteresisMap.set(riderA.userId, { lastStatus: 'TOGETHER', lastAlertTime: now });
      }
    }

    // 4. Overall Squad Group Status
    let overallStatus: GroupSeparationStatus = 'TOGETHER';
    let message = 'Squad riding together within 500m';

    if (separatedRiders.length > 0) {
      overallStatus = 'SEPARATED';
      const primarySeparated = separatedRiders[0];
      message = `${primarySeparated.name} is ${primarySeparated.distanceBehindKm} km behind the squad`;
    } else if (maxDistanceMeters > CONNECT_RIDE_CONFIG.SEPARATION.WARNING_SEPARATION_METERS) {
      overallStatus = 'SPREAD';
      message = `Squad spread across ${(maxDistanceMeters / 1000).toFixed(1)} km`;
    }

    return {
      status: overallStatus,
      maxSpreadMeters: Math.round(maxDistanceMeters),
      leadDistanceMeters: Math.round(maxLeadDistance),
      tailDistanceMeters: Math.round(maxTailDistance || maxLeadDistance),
      activeRidersCount: activeTrackingRiders.length,
      staleRidersCount: staleCount,
      separatedRiders,
      leadRiderName: leaderRider.name,
      message,
    };
  }

  /**
   * Clears state cache when a live ride terminates.
   */
  public static reset(): void {
    riderHysteresisMap.clear();
  }
}

