/**
 * RIDEX — Checkpoint & Waypoint Persistence Service
 * Canonical manager for ride waypoints and intermediate checkpoints.
 * Strictly persists user-selected stops to memory cache, local AsyncStorage, and Supabase database.
 * NEVER injects hardcoded or demo fallback stops.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { RideCheckpoint, CheckpointType } from '../../types/connectRide';
import { MapCoordinate } from '../maps/mapTypes';
import { calculateDistanceMeters, isValidCoordinate } from '../../utils/geo/routeBounds';
import { supabase } from '../supabase';
import { logger } from '../../utils/logger';

// In-memory cache for ultra-fast zero-latency access across screens
const LOCAL_CHECKPOINTS_CACHE: Record<string, RideCheckpoint[]> = {};

export class CheckpointService {
  /**
   * Fetches all sequential checkpoints for a given group ride.
   * Returns ONLY the user-defined checkpoints or an empty array.
   */
  async getCheckpoints(rideId: string): Promise<RideCheckpoint[]> {
    if (!rideId) return [];

    // 1. Return from memory cache if available
    if (LOCAL_CHECKPOINTS_CACHE[rideId] && LOCAL_CHECKPOINTS_CACHE[rideId].length > 0) {
      return LOCAL_CHECKPOINTS_CACHE[rideId];
    }

    // 2. Check local AsyncStorage persistence
    try {
      const stored = await AsyncStorage.getItem(`@ridex_checkpoints_${rideId}`);
      if (stored) {
        const parsed: RideCheckpoint[] = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          LOCAL_CHECKPOINTS_CACHE[rideId] = parsed;
          return parsed;
        }
      }
    } catch (e) {
      logger.warn('[CheckpointService] AsyncStorage read warning:', e);
    }

    // 3. Query Supabase database
    try {
      const { data, error } = await (supabase as any)
        .from('ride_checkpoints')
        .select('*')
        .eq('ride_id', rideId)
        .order('order_index', { ascending: true });

      if (!error && data && data.length > 0) {
        const formatted: RideCheckpoint[] = data.map((row: any, idx: number) => ({
          id: row.id || `cp-${rideId}-${idx}`,
          rideId: row.ride_id || rideId,
          name: row.name || `Stop ${idx + 1}`,
          type: (row.type || 'REGROUP') as CheckpointType,
          latitude: Number(row.latitude),
          longitude: Number(row.longitude),
          orderIndex: Number(row.order_index ?? idx),
          sequence: Number(row.order_index ?? idx) + 1,
          estimatedStopMinutes: Number(row.estimated_stop_minutes || 15),
          stopDuration: Number(row.estimated_stop_minutes || 15),
          isReached: Boolean(row.is_reached),
          reachedAt: row.reached_at,
          address: row.address,
        }));

        LOCAL_CHECKPOINTS_CACHE[rideId] = formatted;
        try {
          await AsyncStorage.setItem(`@ridex_checkpoints_${rideId}`, JSON.stringify(formatted));
        } catch {}

        return formatted;
      }
    } catch (dbErr) {
      logger.warn('[CheckpointService] Supabase getCheckpoints query warning:', dbErr);
    }

    // 4. Return cached or empty array — NEVER fake demo stops!
    return LOCAL_CHECKPOINTS_CACHE[rideId] || [];
  }

  /**
   * Saves and persists a list of checkpoints for a ride across memory, AsyncStorage, and Supabase.
   */
  async saveCheckpoints(rideId: string, checkpoints: Partial<RideCheckpoint>[]): Promise<boolean> {
    if (!rideId) return false;

    try {
      const normalized: RideCheckpoint[] = checkpoints
        .filter((cp) => isValidCoordinate(cp.latitude, cp.longitude))
        .map((cp, idx) => ({
          id: cp.id || `cp-${rideId}-${idx}-${Date.now()}`,
          rideId,
          name: cp.name || `Stop ${idx + 1}`,
          type: (cp.type as CheckpointType) || 'REGROUP',
          latitude: Number(cp.latitude),
          longitude: Number(cp.longitude),
          orderIndex: cp.orderIndex !== undefined ? cp.orderIndex : idx,
          sequence: idx + 1,
          estimatedStopMinutes: cp.estimatedStopMinutes || cp.stopDuration || 15,
          stopDuration: cp.stopDuration || cp.estimatedStopMinutes || 15,
          address: cp.address,
          category: cp.category,
          distanceFromStartKm: cp.distanceFromStartKm,
          isReached: Boolean(cp.isReached),
          reachedAt: cp.reachedAt || null,
        }))
        .sort((a, b) => a.orderIndex - b.orderIndex);

      // Save to memory cache
      LOCAL_CHECKPOINTS_CACHE[rideId] = normalized;

      // Persist to local storage
      try {
        await AsyncStorage.setItem(`@ridex_checkpoints_${rideId}`, JSON.stringify(normalized));
      } catch (storageErr) {
        logger.warn('[CheckpointService] AsyncStorage save warning:', storageErr);
      }

      // Persist to Supabase if available
      if (normalized.length > 0) {
        try {
          const rows = normalized.map((cp, idx) => ({
            ride_id: rideId,
            name: cp.name,
            type: cp.type,
            latitude: cp.latitude,
            longitude: cp.longitude,
            order_index: cp.orderIndex ?? idx,
            estimated_stop_minutes: cp.estimatedStopMinutes,
          }));

          await (supabase as any).from('ride_checkpoints').upsert(rows, { onConflict: 'ride_id,order_index' });
        } catch (supabaseErr) {
          logger.warn('[CheckpointService] Supabase insert warning (offline/local mode active):', supabaseErr);
        }
      }

      return true;
    } catch (err) {
      logger.error('[CheckpointService] saveCheckpoints error:', err);
      return false;
    }
  }

  /**
   * Sets checkpoints directly into memory cache (useful immediately upon creation).
   */
  public setMemoryCache(rideId: string, checkpoints: RideCheckpoint[]): void {
    if (!rideId) return;
    LOCAL_CHECKPOINTS_CACHE[rideId] = checkpoints;
    try {
      AsyncStorage.setItem(`@ridex_checkpoints_${rideId}`, JSON.stringify(checkpoints));
    } catch {}
  }

  /**
   * Determines the Next Upcoming Stop based on current user coordinate.
   */
  public findNextCheckpoint(
    checkpoints: RideCheckpoint[],
    currentLocation: MapCoordinate | null
  ): RideCheckpoint | null {
    if (!checkpoints || checkpoints.length === 0) return null;

    // Find first unreached checkpoint
    const unreached = checkpoints.filter((cp) => !cp.isReached);
    if (unreached.length === 0) return checkpoints[checkpoints.length - 1];

    const next = { ...unreached[0] };

    if (currentLocation && isValidCoordinate(currentLocation.latitude, currentLocation.longitude)) {
      const distMeters = calculateDistanceMeters(currentLocation, {
        latitude: next.latitude,
        longitude: next.longitude,
      });

      next.distanceFromUserMeters = Math.round(distMeters);
      // Assume average riding speed ~50 km/h (833 m/min)
      next.etaMinutes = Math.max(1, Math.round(distMeters / 833));
    }

    return next;
  }
}

export const checkpointService = new CheckpointService();
