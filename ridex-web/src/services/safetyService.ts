/**
 * RIDEX Web — Safety & SOS Emergency Assistance Service
 * Coordinates emergency alerts, database persistence in `ride_sos_alerts`,
 * squad real-time broadcasts, and tracking health telemetry.
 */

import { supabase } from './supabase';
import { SosAlert, LiveRiderLocation } from '../types';
import { realtimeService } from './realtimeService';

export const safetyService = {
  /**
   * Triggers an emergency SOS alert.
   * Inserts into `public.ride_sos_alerts`, broadcasts over Supabase Realtime,
   * and creates a record for authorized squad members.
   */
  async triggerSos(alertData: {
    rideId: string;
    userId: string;
    riderName: string;
    issueType: 'FLAT_TYRE' | 'MECHANICAL' | 'OUT_OF_FUEL' | 'MEDICAL' | 'LOST';
    latitude: number;
    longitude: number;
    note?: string;
  }): Promise<{ success: boolean; alert: SosAlert | null; error?: string }> {
    try {
      const newAlert: SosAlert = {
        id: `sos-${Date.now()}`,
        rideId: alertData.rideId,
        userId: alertData.userId,
        riderName: alertData.riderName,
        issueType: alertData.issueType,
        latitude: alertData.latitude,
        longitude: alertData.longitude,
        note: alertData.note,
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
      };

      // 1. Persist to public.ride_sos_alerts (if table exists)
      try {
        const { data, error } = await supabase
          .from('ride_sos_alerts')
          .insert({
            ride_id: alertData.rideId,
            user_id: alertData.userId,
            issue_type: alertData.issueType,
            latitude: alertData.latitude,
            longitude: alertData.longitude,
            note: alertData.note || null,
            status: 'ACTIVE',
            created_at: newAlert.createdAt,
          })
          .select('id')
          .single();

        if (!error && data?.id) {
          newAlert.id = data.id;
        }
      } catch (dbErr) {
        console.warn('[safetyService] ride_sos_alerts table insert notice:', dbErr);
      }

      // 2. Broadcast via Supabase Realtime WebSocket to squad
      await realtimeService.broadcastSos(alertData.rideId, newAlert);

      // 3. Insert notification for squad
      try {
        await supabase.from('notifications').insert({
          user_id: alertData.userId,
          title: `EMERGENCY SOS: ${alertData.issueType.replace('_', ' ')}`,
          body: `${alertData.riderName} triggered an emergency SOS: ${alertData.note || 'Immediate squad assistance needed.'}`,
          type: 'SOS_ALERT',
          is_read: false,
        });
      } catch (_) {}

      return { success: true, alert: newAlert };
    } catch (err: any) {
      console.error('[safetyService] triggerSos error:', err);
      return { success: false, alert: null, error: err.message || 'Failed to dispatch SOS alert.' };
    }
  },

  /**
   * Resolves an active SOS alert (by organizer or author).
   */
  async resolveSos(alertId: string, rideId: string, resolvedByUserId: string): Promise<boolean> {
    try {
      // 1. Update in database
      try {
        await supabase
          .from('ride_sos_alerts')
          .update({
            status: 'RESOLVED',
            resolved_at: new Date().toISOString(),
          })
          .eq('id', alertId);
      } catch (_) {}

      // 2. Broadcast resolution event over realtime
      const channel = (realtimeService as any).activeChannels?.get?.(rideId);
      if (channel) {
        await channel.send({
          type: 'broadcast',
          event: 'sos_resolved',
          payload: { alertId, resolvedByUserId, resolvedAt: new Date().toISOString() },
        });
      }

      return true;
    } catch (err) {
      console.error('[safetyService] resolveSos error:', err);
      return false;
    }
  },

  /**
   * Fetches active and past SOS alerts for a specific tour.
   */
  async getRideSosAlerts(rideId: string): Promise<SosAlert[]> {
    if (!rideId) return [];

    try {
      const { data, error } = await supabase
        .from('ride_sos_alerts')
        .select(`
          id,
          ride_id,
          user_id,
          issue_type,
          latitude,
          longitude,
          note,
          status,
          created_at,
          user:profiles!ride_sos_alerts_user_id_fkey(full_name)
        `)
        .eq('ride_id', rideId)
        .order('created_at', { ascending: false });

      if (error || !data) return [];

      return data.map((row: any) => ({
        id: row.id,
        rideId: row.ride_id,
        userId: row.user_id,
        riderName: row.user?.full_name || 'Squad Rider',
        issueType: row.issue_type || 'MECHANICAL',
        latitude: Number(row.latitude),
        longitude: Number(row.longitude),
        note: row.note,
        status: row.status || 'ACTIVE',
        createdAt: row.created_at,
      }));
    } catch (err) {
      console.warn('[safetyService] getRideSosAlerts fallback:', err);
      return [];
    }
  },

  /**
   * Evaluates location staleness and tracking health.
   */
  evaluateLocationFreshness(lastUpdatedIso?: string): {
    isStale: boolean;
    secondsAgo: number;
    statusText: string;
    level: 'fresh' | 'stale' | 'lost';
  } {
    if (!lastUpdatedIso) {
      return { isStale: true, secondsAgo: 9999, statusText: 'No GPS Signal', level: 'lost' };
    }

    const diffMs = Date.now() - new Date(lastUpdatedIso).getTime();
    const secondsAgo = Math.max(0, Math.round(diffMs / 1000));

    if (secondsAgo < 15) {
      return { isStale: false, secondsAgo, statusText: 'Live (<15s)', level: 'fresh' };
    } else if (secondsAgo < 45) {
      return { isStale: false, secondsAgo, statusText: `Recent (${secondsAgo}s ago)`, level: 'fresh' };
    } else if (secondsAgo < 120) {
      return { isStale: true, secondsAgo, statusText: `Signal Degraded (${secondsAgo}s ago)`, level: 'stale' };
    } else {
      return { isStale: true, secondsAgo, statusText: `Signal Lost (>2m)`, level: 'lost' };
    }
  },
};
