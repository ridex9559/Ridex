/**
 * RIDEX V2.1 — Realtime Cloud Synchronization Service
 * Coordinates live group ride events, join requests, organizer approvals,
 * ride status changes, live GPS radar broadcasting, push-to-talk intercom state, and SOS alerts.
 */

import { supabaseClient } from '../supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';
import { logger } from '@/utils/logger';

export interface LiveRiderLocation {
  userId: string;
  riderName: string;
  motorcycleName: string;
  avatarUrl?: string;
  role: 'ORGANIZER' | 'LEADER' | 'RIDER';
  latitude: number;
  longitude: number;
  heading?: number;
  speed?: number;
  updatedAt: string;
}

export interface JoinRequestEvent {
  rideId: string;
  userId: string;
  riderName: string;
  username: string;
  avatarUrl?: string;
  motorcycleName: string;
  motorcycleCc?: number;
  requestedAt: string;
}

export interface ApprovalEvent {
  rideId: string;
  userId: string;
  status: 'APPROVED' | 'REJECTED' | 'PROMOTED_LEADER';
  updatedAt: string;
}

export interface RideStatusEvent {
  rideId: string;
  status: 'UPCOMING' | 'LIVE' | 'COMPLETED' | 'CANCELLED';
  timestamp: string;
}

export interface IntercomStateEvent {
  rideId: string;
  activeSpeakerId: string | null;
  activeSpeakerName: string | null;
  isLeaderChannel: boolean;
  timestamp: string;
}

export interface SosAlertEvent {
  rideId: string;
  userId: string;
  riderName: string;
  motorcycleName: string;
  latitude: number;
  longitude: number;
  emergencyType: string;
  timestamp: string;
}

type EventCallback<T> = (payload: T) => void;

class RideRealtimeService {
  private activeChannels: Map<string, RealtimeChannel> = new Map();
  private joinRequestListeners: Map<string, Set<EventCallback<JoinRequestEvent>>> = new Map();
  private approvalListeners: Map<string, Set<EventCallback<ApprovalEvent>>> = new Map();
  private rideStatusListeners: Map<string, Set<EventCallback<RideStatusEvent>>> = new Map();
  private locationListeners: Map<string, Set<EventCallback<LiveRiderLocation>>> = new Map();
  private intercomListeners: Map<string, Set<EventCallback<IntercomStateEvent>>> = new Map();
  private sosListeners: Map<string, Set<EventCallback<SosAlertEvent>>> = new Map();

  /**
   * Subscribe to a ride's real-time channel
   */
  public subscribeToRide(rideId: string): RealtimeChannel {
    if (this.activeChannels.has(rideId)) {
      return this.activeChannels.get(rideId)!;
    }

    const channelName = `ride:${rideId}`;
    const channel = supabaseClient.channel(channelName, {
      config: {
        broadcast: { self: true },
      },
    });

    channel
      .on('broadcast', { event: 'join_request' }, ({ payload }) => {
        logger.info('[RideRealtimeService] Received join_request', payload);
        this.joinRequestListeners.get(rideId)?.forEach((cb) => cb(payload));
      })
      .on('broadcast', { event: 'approval_status' }, ({ payload }) => {
        logger.info('[RideRealtimeService] Received approval_status', payload);
        this.approvalListeners.get(rideId)?.forEach((cb) => cb(payload));
      })
      .on('broadcast', { event: 'ride_status' }, ({ payload }) => {
        logger.info('[RideRealtimeService] Received ride_status change:', payload);
        this.rideStatusListeners.get(rideId)?.forEach((cb) => cb(payload));
      })
      .on('broadcast', { event: 'location_update' }, ({ payload }) => {
        this.locationListeners.get(rideId)?.forEach((cb) => cb(payload));
      })
      .on('broadcast', { event: 'intercom_state' }, ({ payload }) => {
        this.intercomListeners.get(rideId)?.forEach((cb) => cb(payload));
      })
      .on('broadcast', { event: 'sos_alert' }, ({ payload }) => {
        logger.warn('[RideRealtimeService] Received SOS alert!', payload);
        this.sosListeners.get(rideId)?.forEach((cb) => cb(payload));
      })
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ride_participants',
          filter: `ride_id=eq.${rideId}`,
        },
        (payload: any) => {
          logger.info('[RideRealtimeService] postgres_changes on ride_participants:', payload);
          const record = payload.new || payload.old;
          if (!record) return;

          const rawStatus = (record.status || '').toUpperCase();
          if (rawStatus === 'PENDING') {
            this.joinRequestListeners.get(rideId)?.forEach((cb) =>
              cb({
                rideId,
                userId: record.user_id,
                riderName: 'Rider',
                username: 'rider',
                motorcycleName: 'Motorcycle',
                requestedAt: record.joined_at || new Date().toISOString(),
              })
            );
          } else if (rawStatus === 'APPROVED' || rawStatus === 'REJECTED') {
            this.approvalListeners.get(rideId)?.forEach((cb) =>
              cb({
                rideId,
                userId: record.user_id,
                status: rawStatus === 'APPROVED' ? 'APPROVED' : 'REJECTED',
                updatedAt: record.updated_at || new Date().toISOString(),
              })
            );
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'rides',
          filter: `id=eq.${rideId}`,
        },
        (payload: any) => {
          logger.info('[RideRealtimeService] postgres_changes on rides table:', payload);
          const newStatus = (payload.new?.status || '').toUpperCase();
          const mappedStatus: 'UPCOMING' | 'LIVE' | 'COMPLETED' | 'CANCELLED' =
            newStatus === 'ACTIVE' || newStatus === 'LIVE'
              ? 'LIVE'
              : newStatus === 'COMPLETED'
              ? 'COMPLETED'
              : newStatus === 'CANCELLED'
              ? 'CANCELLED'
              : 'UPCOMING';

          this.rideStatusListeners.get(rideId)?.forEach((cb) =>
            cb({
              rideId,
              status: mappedStatus,
              timestamp: new Date().toISOString(),
            })
          );
        }
      )
      .subscribe((status) => {
        logger.info(`[RideRealtimeService] Channel ${channelName} status: ${status}`);
      });

    this.activeChannels.set(rideId, channel);
    return channel;
  }

  /**
   * Broadcast a join request from a rider to the organizer
   */
  public async broadcastJoinRequest(event: JoinRequestEvent): Promise<void> {
    const channel = this.subscribeToRide(event.rideId);
    await channel.send({
      type: 'broadcast',
      event: 'join_request',
      payload: event,
    });
    logger.info('[RideRealtimeService] Broadcasted join_request for ride:', event.rideId);
  }

  /**
   * Broadcast organizer approval / rejection / promotion
   */
  public async broadcastApproval(event: ApprovalEvent): Promise<void> {
    const channel = this.subscribeToRide(event.rideId);
    await channel.send({
      type: 'broadcast',
      event: 'approval_status',
      payload: event,
    });
    logger.info('[RideRealtimeService] Broadcasted approval status:', event);
  }

  /**
   * Broadcast ride status transition (e.g. 'LIVE', 'COMPLETED')
   */
  public async broadcastRideStatusChange(
    rideId: string,
    status: 'UPCOMING' | 'LIVE' | 'COMPLETED' | 'CANCELLED'
  ): Promise<void> {
    const channel = this.subscribeToRide(rideId);
    await channel.send({
      type: 'broadcast',
      event: 'ride_status',
      payload: {
        rideId,
        status,
        timestamp: new Date().toISOString(),
      },
    });
    logger.info('[RideRealtimeService] Broadcasted ride_status change:', status);
  }

  /**
   * Broadcast rider GPS telemetry
   */
  public async broadcastLocation(location: LiveRiderLocation, rideId: string): Promise<void> {
    const channel = this.subscribeToRide(rideId);
    await channel.send({
      type: 'broadcast',
      event: 'location_update',
      payload: location,
    });
  }

  /**
   * Broadcast Push-to-Talk intercom state
   */
  public async broadcastIntercomState(event: IntercomStateEvent): Promise<void> {
    const channel = this.subscribeToRide(event.rideId);
    await channel.send({
      type: 'broadcast',
      event: 'intercom_state',
      payload: event,
    });
  }

  /**
   * Broadcast SOS emergency alert
   */
  public async broadcastSosAlert(event: SosAlertEvent): Promise<void> {
    const channel = this.subscribeToRide(event.rideId);
    await channel.send({
      type: 'broadcast',
      event: 'sos_alert',
      payload: event,
    });
  }

  /**
   * Listen for join requests (for organizers)
   */
  public onJoinRequest(rideId: string, cb: EventCallback<JoinRequestEvent>): () => void {
    this.subscribeToRide(rideId);
    if (!this.joinRequestListeners.has(rideId)) {
      this.joinRequestListeners.set(rideId, new Set());
    }
    this.joinRequestListeners.get(rideId)!.add(cb);

    return () => {
      this.joinRequestListeners.get(rideId)?.delete(cb);
    };
  }

  /**
   * Listen for approval status updates (for joining riders)
   */
  public onApproval(rideId: string, cb: EventCallback<ApprovalEvent>): () => void {
    this.subscribeToRide(rideId);
    if (!this.approvalListeners.has(rideId)) {
      this.approvalListeners.set(rideId, new Set());
    }
    this.approvalListeners.get(rideId)!.add(cb);

    return () => {
      this.approvalListeners.get(rideId)?.delete(cb);
    };
  }

  /**
   * Listen for ride status changes (start ride, complete ride)
   */
  public onRideStatusChange(rideId: string, cb: EventCallback<RideStatusEvent>): () => void {
    this.subscribeToRide(rideId);
    if (!this.rideStatusListeners.has(rideId)) {
      this.rideStatusListeners.set(rideId, new Set());
    }
    this.rideStatusListeners.get(rideId)!.add(cb);

    return () => {
      this.rideStatusListeners.get(rideId)?.delete(cb);
    };
  }

  /**
   * Listen for live squad GPS location updates
   */
  public onLocationUpdate(rideId: string, cb: EventCallback<LiveRiderLocation>): () => void {
    this.subscribeToRide(rideId);
    if (!this.locationListeners.has(rideId)) {
      this.locationListeners.set(rideId, new Set());
    }
    this.locationListeners.get(rideId)!.add(cb);

    return () => {
      this.locationListeners.get(rideId)?.delete(cb);
    };
  }

  /**
   * Listen for Intercom / PTT state changes
   */
  public onIntercomState(rideId: string, cb: EventCallback<IntercomStateEvent>): () => void {
    this.subscribeToRide(rideId);
    if (!this.intercomListeners.has(rideId)) {
      this.intercomListeners.set(rideId, new Set());
    }
    this.intercomListeners.get(rideId)!.add(cb);

    return () => {
      this.intercomListeners.get(rideId)?.delete(cb);
    };
  }

  /**
   * Listen for SOS emergency alerts
   */
  public onSosAlert(rideId: string, cb: EventCallback<SosAlertEvent>): () => void {
    this.subscribeToRide(rideId);
    if (!this.sosListeners.has(rideId)) {
      this.sosListeners.set(rideId, new Set());
    }
    this.sosListeners.get(rideId)!.add(cb);

    return () => {
      this.sosListeners.get(rideId)?.delete(cb);
    };
  }

  /**
   * Clean up channel subscriptions when leaving ride
   */
  public unsubscribeFromRide(rideId: string): void {
    const channel = this.activeChannels.get(rideId);
    if (channel) {
      supabaseClient.removeChannel(channel);
      this.activeChannels.delete(rideId);
    }
    this.joinRequestListeners.delete(rideId);
    this.approvalListeners.delete(rideId);
    this.rideStatusListeners.delete(rideId);
    this.locationListeners.delete(rideId);
    this.intercomListeners.delete(rideId);
    this.sosListeners.delete(rideId);
  }
}

export const rideRealtimeService = new RideRealtimeService();
