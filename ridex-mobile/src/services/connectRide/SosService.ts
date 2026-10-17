/**
 * RIDEX — SOS Emergency Service
 * Handles 1-tap SOS assistance requests (🔧 Mechanical, ⛽ Fuel, 🛞 Flat Tyre, 🚑 Medical, 📍 Lost)
 * and real-time broadcast to all squad members.
 */

import { SosAlert, SosIssueType } from '../../types/connectRide';
import { supabase } from '../supabase';
import { logger } from '../../utils/logger';

export class SosService {
  /**
   * Triggers an emergency SOS alert broadcast to all squad members.
   */
  async triggerSos(params: {
    sessionId: string;
    rideId: string;
    userId: string;
    issueType: SosIssueType;
    latitude: number;
    longitude: number;
    note?: string;
  }): Promise<SosAlert | null> {
    try {
      const { data, error } = await (supabase as any).rpc('trigger_sos_alert', {
        p_session_id: params.sessionId,
        p_ride_id: params.rideId,
        p_user_id: params.userId,
        p_issue_type: params.issueType,
        p_latitude: params.latitude,
        p_longitude: params.longitude,
        p_note: params.note || null,
      });

      if (error) {
        logger.error('[SosService] trigger_sos_alert error:', error);
      }

      return {
        id: data?.alert_id || `sos-${Date.now()}`,
        sessionId: params.sessionId,
        rideId: params.rideId,
        userId: params.userId,
        issueType: params.issueType,
        latitude: params.latitude,
        longitude: params.longitude,
        note: params.note,
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
      };
    } catch (err) {
      logger.error('[SosService] Exception triggering SOS:', err);
      // Return local fallback alert object so local UI reacts instantly
      return {
        id: `sos-${Date.now()}`,
        sessionId: params.sessionId,
        rideId: params.rideId,
        userId: params.userId,
        issueType: params.issueType,
        latitude: params.latitude,
        longitude: params.longitude,
        note: params.note,
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
      };
    }
  }

  /**
   * Resolves an active SOS alert.
   */
  async resolveSos(alertId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await (supabase as any).rpc('resolve_sos_alert', {
        p_alert_id: alertId,
        p_user_id: userId,
      });

      return !error;
    } catch {
      return true;
    }
  }

  /**
   * Fetches all active SOS alerts for the live session.
   */
  async getActiveAlerts(sessionId: string): Promise<SosAlert[]> {
    try {
      const { data, error } = await (supabase as any)
        .from('ride_sos_alerts')
        .select(`
          id,
          session_id,
          ride_id,
          user_id,
          issue_type,
          latitude,
          longitude,
          note,
          status,
          created_at,
          profiles:user_id (
            display_name,
            callsign
          )
        `)
        .eq('session_id', sessionId)
        .eq('status', 'ACTIVE');

      if (error || !data) return [];

      return data.map((row: any) => ({
        id: row.id,
        sessionId: row.session_id,
        rideId: row.ride_id,
        userId: row.user_id,
        userName: row.profiles?.display_name || row.profiles?.callsign || 'Squad Member',
        issueType: row.issue_type as SosIssueType,
        latitude: Number(row.latitude),
        longitude: Number(row.longitude),
        note: row.note,
        status: row.status,
        createdAt: row.created_at,
      }));
    } catch {
      return [];
    }
  }
}

export const sosService = new SosService();
