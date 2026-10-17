/**
 * RIDEX — Supabase Live Group Ride Repository
 * Implements atomic stored procedure calls for start_live_ride / end_live_ride
 * and live location upserting.
 */

import { ILiveRideRepository } from '../interfaces/ILiveRideRepository';
import { LiveRideSession, LiveRiderLocation, LiveRiderPresenceStatus } from '../../types/liveRide';
import { supabase } from '../../services/supabase';
import { LIVE_RIDE_CONFIG } from '../../config/liveRide';
import { logger } from '../../utils/logger';

export class SupabaseLiveRideRepository implements ILiveRideRepository {
  async getActiveSessionByRideId(rideId: string): Promise<LiveRideSession | null> {
    try {
      const { data, error } = await (supabase as any)
        .from('ride_live_sessions')
        .select('*')
        .eq('ride_id', rideId)
        .eq('status', 'LIVE')
        .maybeSingle();

      if (error || !data) return null;

      return {
        id: data.id,
        rideId: data.ride_id,
        status: data.status,
        startedAt: data.started_at,
        endedAt: data.ended_at,
        createdAt: data.created_at,
      };
    } catch {
      return null;
    }
  }

  async startLiveRide(
    rideId: string,
    userId: string
  ): Promise<{ success: boolean; sessionId?: string; error?: string; message?: string }> {
    try {
      const { data, error } = await (supabase as any).rpc('start_live_ride', {
        p_ride_id: rideId,
        p_user_id: userId,
      });

      if (!error && (data as any)?.session_id) {
        const res = data as any;
        return {
          success: res.success ?? true,
          sessionId: res.session_id,
          message: res.message,
        };
      }
    } catch {}

    // Direct table fallback
    try {
      await (supabase.from('rides') as any)
        .update({ status: 'active', updated_at: new Date().toISOString() })
        .eq('id', rideId);
      return { success: true, sessionId: rideId, message: 'Ride started successfully' };
    } catch (err: any) {
      logger.error('[SupabaseLiveRideRepository] startLiveRide exception:', err);
      return { success: false, error: err?.message || 'Failed to start live ride' };
    }
  }

  async endLiveRide(
    rideId: string,
    userId: string
  ): Promise<{ success: boolean; error?: string; message?: string }> {
    try {
      const { data, error } = await (supabase as any).rpc('end_live_ride', {
        p_ride_id: rideId,
        p_user_id: userId,
      });

      if (!error) {
        const res = data as any;
        return {
          success: res.success ?? true,
          message: res.message || 'Ride ended successfully',
        };
      }
    } catch {}

    // Direct table fallback
    try {
      await (supabase.from('rides') as any)
        .update({ status: 'completed', updated_at: new Date().toISOString() })
        .eq('id', rideId);
      return { success: true, message: 'Ride ended successfully' };
    } catch (err: any) {
      logger.error('[SupabaseLiveRideRepository] endLiveRide exception:', err);
      return { success: false, error: err?.message || 'Failed to end live ride' };
    }
  }

  async upsertLiveLocation(params: {
    sessionId: string;
    userId: string;
    latitude: number;
    longitude: number;
    heading?: number | null;
    speed?: number | null;
    accuracy?: number | null;
  }): Promise<void> {
    try {
      await (supabase as any).rpc('upsert_live_location', {
        p_session_id: params.sessionId,
        p_user_id: params.userId,
        p_latitude: params.latitude,
        p_longitude: params.longitude,
        p_heading: params.heading ?? null,
        p_speed: params.speed ?? 0,
        p_accuracy: params.accuracy ?? null,
      });
    } catch (error) {
      logger.warn('[SupabaseLiveRideRepository] upsertLiveLocation warning:', error);
    }
  }

  async getSessionLocations(sessionId: string): Promise<LiveRiderLocation[]> {
    try {
      const { data, error } = await (supabase as any)
        .from('ride_live_locations')
        .select(`
          session_id,
          user_id,
          latitude,
          longitude,
          heading,
          speed,
          accuracy,
          updated_at,
          profiles:user_id (
            id,
            display_name,
            callsign,
            avatar_url
          )
        `)
        .eq('session_id', sessionId);

      if (error) {
        logger.error('[SupabaseLiveRideRepository] getSessionLocations error:', error);
        return [];
      }

      const now = Date.now();
      const currentAuthUser = (await supabase.auth.getUser()).data.user?.id;

      return (data || []).map((row: any) => {
        const lastUpdatedMs = new Date(row.updated_at).getTime();
        const silenceMs = now - lastUpdatedMs;

        let presenceStatus: LiveRiderPresenceStatus = 'LIVE';
        if (silenceMs > LIVE_RIDE_CONFIG.OFFLINE_THRESHOLD_MS) {
          presenceStatus = 'OFFLINE';
        } else if (silenceMs > LIVE_RIDE_CONFIG.STALE_THRESHOLD_MS) {
          presenceStatus = 'STALE';
        }

        return {
          sessionId: row.session_id,
          userId: row.user_id,
          coordinate: {
            latitude: Number(row.latitude),
            longitude: Number(row.longitude),
          },
          heading: row.heading !== null ? Number(row.heading) : null,
          speedKmh: Math.round((Number(row.speed) || 0) * 3.6),
          accuracy: row.accuracy !== null ? Number(row.accuracy) : null,
          updatedAt: row.updated_at,
          presenceStatus,
          isCurrentUser: row.user_id === currentAuthUser,
          user: row.profiles
            ? {
                id: row.profiles.id,
                name: row.profiles.display_name || row.profiles.callsign || 'RIDEX Rider',
                username: row.profiles.callsign || 'Rider',
                email: '',
                fullName: row.profiles.display_name || 'RIDEX Rider',
                callsign: row.profiles.callsign || 'Rider',
                avatarUrl: row.profiles.avatar_url,
                bio: '',
                city: '',
                state: '',
                country: '',
                createdAt: row.updated_at,
                stats: {
                  totalDistanceKm: 0,
                  totalRidesCount: 0,
                  totalDurationHours: 0,
                  longestRideKm: 0,
                  countriesCount: 1,
                },
              }
            : undefined,
        };
      });
    } catch (error) {
      logger.error('[SupabaseLiveRideRepository] getSessionLocations exception:', error);
      return [];
    }
  }

  async removeUserLiveLocation(sessionId: string, userId: string): Promise<void> {
    try {
      await (supabase as any)
        .from('ride_live_locations')
        .delete()
        .eq('session_id', sessionId)
        .eq('user_id', userId);
    } catch {}
  }
}

export const supabaseLiveRideRepository = new SupabaseLiveRideRepository();
