/**
 * RIDEX Web — Notification Center Service
 * Interfaces with public.notifications with real-time updates for SOS alerts,
 * join requests, approvals, and squad events.
 */

import { supabase } from './supabase';
import { AppNotification } from '../types';

export const notificationService = {
  /**
   * Fetches in-app notifications for an authenticated rider.
   */
  async getNotifications(userId: string): Promise<AppNotification[]> {
    if (!userId) return [];

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(40);

      if (error || !data) return [];

      return data.map((row: any) => ({
        id: row.id,
        userId: row.user_id,
        title: row.title || 'Notification',
        body: row.body || '',
        type: row.type || 'GENERAL',
        isRead: Boolean(row.is_read),
        linkUrl: row.link_url || (row.type === 'SOS_ALERT' ? '/safety' : '/dashboard'),
        createdAt: row.created_at,
      }));
    } catch (e) {
      console.warn('[notificationService] getNotifications fallback:', e);
      return [];
    }
  },

  /**
   * Marks a notification as read.
   */
  async markAsRead(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);
      return !error;
    } catch (e) {
      return false;
    }
  },

  /**
   * Marks all notifications as read for a user.
   */
  async markAllAsRead(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false);
      return !error;
    } catch (e) {
      return false;
    }
  },

  /**
   * Subscribes to real-time notification inserts.
   */
  subscribeToNotifications(userId: string, onNewNotification: (n: AppNotification) => void) {
    if (!userId) return () => {};

    const channel = supabase
      .channel(`user-notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const row = payload.new;
          onNewNotification({
            id: row.id,
            userId: row.user_id,
            title: row.title,
            body: row.body,
            type: row.type || 'GENERAL',
            isRead: false,
            linkUrl: row.link_url || '/dashboard',
            createdAt: row.created_at,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
};
