/**
 * RIDEX — Announcement Service
 * Handles live group broadcasts and road captain updates during group rides.
 */

import { RideAnnouncement, AnnouncementType } from '../../types/connectRide';
import { supabase } from '../supabase';
import { logger } from '../../utils/logger';

export class AnnouncementService {
  /**
   * Broadcasts an announcement to the entire squad.
   */
  async broadcastAnnouncement(params: {
    sessionId: string;
    rideId: string;
    authorId: string;
    message: string;
    type?: AnnouncementType;
  }): Promise<RideAnnouncement | null> {
    try {
      const { data, error } = await (supabase as any).rpc('broadcast_ride_announcement', {
        p_session_id: params.sessionId,
        p_ride_id: params.rideId,
        p_author_id: params.authorId,
        p_message: params.message,
        p_type: params.type || 'GENERAL',
      });

      if (error) {
        logger.error('[AnnouncementService] broadcast_ride_announcement error:', error);
      }

      return {
        id: data?.announcement_id || `ann-${Date.now()}`,
        sessionId: params.sessionId,
        authorId: params.authorId,
        message: params.message,
        type: params.type || 'GENERAL',
        createdAt: new Date().toISOString(),
      };
    } catch (err) {
      logger.error('[AnnouncementService] Exception in broadcastAnnouncement:', err);
      return {
        id: `ann-${Date.now()}`,
        sessionId: params.sessionId,
        authorId: params.authorId,
        message: params.message,
        type: params.type || 'GENERAL',
        createdAt: new Date().toISOString(),
      };
    }
  }

  /**
   * Fetches recent announcements for a session.
   */
  async getRecentAnnouncements(sessionId: string): Promise<RideAnnouncement[]> {
    try {
      const { data, error } = await (supabase as any)
        .from('ride_announcements')
        .select(`
          id,
          session_id,
          author_id,
          message,
          type,
          created_at,
          profiles:author_id (
            display_name,
            callsign
          )
        `)
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error || !data) return [];

      return data.map((row: any) => ({
        id: row.id,
        sessionId: row.session_id,
        authorId: row.author_id,
        authorName: row.profiles?.display_name || row.profiles?.callsign || 'Lead Road Captain',
        message: row.message,
        type: row.type as AnnouncementType,
        createdAt: row.created_at,
      }));
    } catch {
      return [];
    }
  }

  /**
   * Fetches latest announcement for a session.
   */
  async getLatestAnnouncement(sessionId: string): Promise<RideAnnouncement | null> {
    const list = await this.getRecentAnnouncements(sessionId);
    return list.length > 0 ? list[0] : null;
  }
}

export const announcementService = new AnnouncementService();
