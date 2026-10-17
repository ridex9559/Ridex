/**
 * RIDEX Web — Supabase Realtime Telemetry & Event Synchronization Service
 * Coordinates WebSockets on channel `ride:${rideId}` for live radar, approvals, and SOS.
 */

import { supabase } from './supabase';
import { RealtimeChannel } from '@supabase/supabase-js';
import { LiveRiderLocation, SosAlert } from '../types';

export interface RealtimeCallbacks {
  onLocationUpdate?: (location: LiveRiderLocation) => void;
  onJoinRequest?: (payload: { userId: string; riderName: string; requestedAt: string }) => void;
  onApprovalStatus?: (payload: { userId: string; status: 'APPROVED' | 'REJECTED' }) => void;
  onRideStatus?: (payload: { status: string }) => void;
  onSosAlert?: (alert: SosAlert) => void;
}

const activeChannels = new Map<string, RealtimeChannel>();

export const realtimeService = {
  /**
   * Subscribes to live WebSocket channel for a specific ride.
   */
  subscribeToRide(rideId: string, callbacks: RealtimeCallbacks): RealtimeChannel {
    if (activeChannels.has(rideId)) {
      this.unsubscribeFromRide(rideId);
    }

    const channelName = `ride:${rideId}`;
    const channel = supabase.channel(channelName, {
      config: {
        broadcast: { self: true },
      },
    });

    channel
      .on('broadcast', { event: 'location_update' }, ({ payload }) => {
        callbacks.onLocationUpdate?.(payload);
      })
      .on('broadcast', { event: 'join_request' }, ({ payload }) => {
        callbacks.onJoinRequest?.(payload);
      })
      .on('broadcast', { event: 'approval_status' }, ({ payload }) => {
        callbacks.onApprovalStatus?.(payload);
      })
      .on('broadcast', { event: 'ride_status' }, ({ payload }) => {
        callbacks.onRideStatus?.(payload);
      })
      .on('broadcast', { event: 'sos_alert' }, ({ payload }) => {
        callbacks.onSosAlert?.(payload);
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`[realtimeService] Subscribed to real-time channel: ${channelName}`);
        }
      });

    activeChannels.set(rideId, channel);
    return channel;
  },

  /**
   * Unsubscribes and cleans up channel listeners.
   */
  unsubscribeFromRide(rideId: string) {
    if (activeChannels.has(rideId)) {
      const channel = activeChannels.get(rideId);
      supabase.removeChannel(channel!);
      activeChannels.delete(rideId);
    }
  },

  /**
   * Broadcasts live GPS telemetry to squad members and updates database.
   */
  async broadcastLocation(rideId: string, location: LiveRiderLocation): Promise<void> {
    const channel = activeChannels.get(rideId);
    if (channel) {
      await channel.send({
        type: 'broadcast',
        event: 'location_update',
        payload: location,
      });
    }

    // Upsert into public.ride_locations for persistent history
    try {
      await supabase.from('ride_locations').upsert(
        {
          ride_id: rideId,
          user_id: location.userId,
          latitude: location.latitude,
          longitude: location.longitude,
          heading: location.heading || 0,
          speed: location.speed || 0,
          accuracy: location.accuracy || 0,
          is_sharing: true,
          updated_at: location.updatedAt,
        },
        { onConflict: 'ride_id,user_id' }
      );
    } catch (e) {
      console.warn('[realtimeService] ride_locations upsert error:', e);
    }
  },

  /**
   * Broadcasts join request submission.
   */
  async broadcastJoinRequest(
    rideId: string,
    req: { userId: string; riderName: string; requestedAt: string }
  ): Promise<void> {
    const channel = activeChannels.get(rideId);
    if (channel) {
      await channel.send({
        type: 'broadcast',
        event: 'join_request',
        payload: req,
      });
    }
  },

  /**
   * Broadcasts organizer approval or rejection.
   */
  async broadcastApproval(
    rideId: string,
    approval: { userId: string; status: 'APPROVED' | 'REJECTED' }
  ): Promise<void> {
    const channel = activeChannels.get(rideId);
    if (channel) {
      await channel.send({
        type: 'broadcast',
        event: 'approval_status',
        payload: approval,
      });
    }
  },

  /**
   * Broadcasts active SOS emergency alert.
   */
  async broadcastSos(rideId: string, alert: SosAlert): Promise<void> {
    const channel = activeChannels.get(rideId);
    if (channel) {
      await channel.send({
        type: 'broadcast',
        event: 'sos_alert',
        payload: alert,
      });
    }
  },
};
