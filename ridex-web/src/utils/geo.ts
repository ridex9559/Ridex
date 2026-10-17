/**
 * RIDEX — Geodesic Mathematical Calculators & Separation Engine
 * Haversine Great-Circle distance, bearing, and hysteresis-based squad separation.
 */

import { LiveRiderLocation, GroupSeparationState, GroupSeparationStatus, MapCoordinate } from '../types';

export const EARTH_RADIUS_METERS = 6371000;

/**
 * Validates coordinate sanity (bounds check and rejection of Null Island [0,0])
 */
export function isValidCoordinate(lat?: number | null, lng?: number | null): boolean {
  if (lat === null || lat === undefined || lng === null || lng === undefined) return false;
  if (isNaN(lat) || isNaN(lng)) return false;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return false;
  // Reject uninitialized GPS chipset (0, 0)
  if (Math.abs(lat) < 0.0001 && Math.abs(lng) < 0.0001) return false;
  return true;
}

/**
 * Calculates Great-Circle geodesic distance between two points in meters using Haversine formula.
 */
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  if (!isValidCoordinate(lat1, lon1) || !isValidCoordinate(lat2, lon2)) return 0;

  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_METERS * c;
}

/**
 * Calculates Great-Circle distance in kilometers.
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  return calculateDistanceMeters(lat1, lon1, lat2, lon2) / 1000;
}

/**
 * Computes compass bearing in degrees (0° - 360°) between two coordinates.
 */
export function calculateBearing(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const toDeg = (rad: number) => (rad * 180) / Math.PI;

  const phi1 = toRad(lat1);
  const phi2 = toRad(lat2);
  const deltaLambda = toRad(lon2 - lon1);

  const y = Math.sin(deltaLambda) * Math.cos(phi2);
  const x =
    Math.cos(phi1) * Math.sin(phi2) -
    Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);

  const theta = Math.atan2(y, x);
  return (toDeg(theta) + 360) % 360;
}

/**
 * Evaluates location freshness based on ISO timestamp age.
 */
export function evaluateFreshness(updatedAt?: string): 'LIVE' | 'STALE' | 'LOST' {
  if (!updatedAt) return 'LOST';
  const ageMs = Date.now() - new Date(updatedAt).getTime();
  if (ageMs < 30000) return 'LIVE';       // < 30s
  if (ageMs < 90000) return 'STALE';      // 30s - 90s
  return 'LOST';                          // > 90s
}

/**
 * Hysteresis-aware squad separation evaluator.
 * Thresholds:
 * - Warning: >500m (recovers <400m)
 * - Critical: >1000m (recovers <800m)
 */
export function evaluateGroupSeparation(
  riders: LiveRiderLocation[],
  currentUserId?: string,
  previousStatus?: GroupSeparationStatus
): GroupSeparationState {
  // Filter active and valid riders
  const validRiders = riders.filter(
    (r) => isValidCoordinate(r.latitude, r.longitude) && evaluateFreshness(r.updatedAt) !== 'LOST'
  );

  const staleCount = riders.filter(
    (r) => evaluateFreshness(r.updatedAt) === 'STALE'
  ).length;

  if (validRiders.length === 0) {
    return {
      status: 'OFFLINE',
      maxSpreadMeters: 0,
      leadDistanceMeters: 0,
      activeRidersCount: 0,
      staleRidersCount: staleCount,
      message: 'Waiting for rider locations...',
      separatedRiders: [],
    };
  }

  if (validRiders.length === 1) {
    return {
      status: 'TOGETHER',
      maxSpreadMeters: 0,
      leadDistanceMeters: 0,
      activeRidersCount: 1,
      staleRidersCount: staleCount,
      message: 'Solo Rider Rendezvous • Waiting for squad members to start GPS',
      separatedRiders: [],
    };
  }

  // Anchor to current user or first rider (typically organizer/leader)
  const anchor = validRiders.find((r) => r.userId === currentUserId) || validRiders[0];
  const separatedRiders: { userId: string; riderName: string; distanceMeters: number }[] = [];

  let maxSpread = 0;
  validRiders.forEach((r) => {
    if (r.userId !== anchor.userId) {
      const dist = calculateDistanceMeters(
        anchor.latitude,
        anchor.longitude,
        r.latitude,
        r.longitude
      );
      if (dist > maxSpread) maxSpread = dist;

      if (dist > 1000) {
        separatedRiders.push({
          userId: r.userId,
          riderName: r.riderName,
          distanceMeters: Math.round(dist),
        });
      }
    }
  });

  // Hysteresis calculation
  let status: GroupSeparationStatus = 'TOGETHER';
  if (previousStatus === 'SEPARATED') {
    // Rider must recover to < 800m to clear critical separated status
    status = maxSpread > 800 ? 'SEPARATED' : maxSpread > 500 ? 'SPREAD' : 'TOGETHER';
  } else if (previousStatus === 'SPREAD') {
    // Rider must recover to < 400m to clear spread status
    status = maxSpread > 1000 ? 'SEPARATED' : maxSpread > 400 ? 'SPREAD' : 'TOGETHER';
  } else {
    status = maxSpread > 1000 ? 'SEPARATED' : maxSpread > 500 ? 'SPREAD' : 'TOGETHER';
  }

  let message = 'Squad together within safe distance.';
  if (status === 'SEPARATED') {
    message = `⚠️ Warning: ${separatedRiders.length} rider(s) left behind (>1.0 km separation).`;
  } else if (status === 'SPREAD') {
    message = `Squad is stretching out (${(maxSpread / 1000).toFixed(1)} km gap).`;
  }

  return {
    status,
    maxSpreadMeters: Math.round(maxSpread),
    leadDistanceMeters: Math.round(maxSpread),
    activeRidersCount: validRiders.length,
    staleRidersCount: staleCount,
    message,
    separatedRiders,
  };
}
