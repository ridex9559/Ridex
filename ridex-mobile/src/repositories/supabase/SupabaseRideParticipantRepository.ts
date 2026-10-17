/**
 * RIDEX — Supabase Ride Participant Repository
 * Production-ready repository using public.ride_participants table.
 */

import { IRideParticipantRepository } from '../interfaces/IRideParticipantRepository';
import { RideParticipant, ParticipantRole, ParticipantApprovalStatus } from '../../types/groupRide';
import { supabaseClient } from '../../services/supabase/client';
import { logger } from '../../utils/logger';

export class SupabaseRideParticipantRepository implements IRideParticipantRepository {
  /**
   * Fetches all participants for a specific ride with user profiles.
   */
  async getParticipantsByRideId(rideId: string): Promise<RideParticipant[]> {
    if (!rideId) return [];

    try {
      const { data, error } = await (supabaseClient.from('ride_participants') as any)
        .select(`
          id,
          ride_id,
          user_id,
          role,
          status,
          joined_at,
          approved_at,
          updated_at,
          user:profiles!ride_participants_user_id_fkey(
            id,
            full_name,
            username,
            avatar_url,
            city,
            state
          )
        `)
        .eq('ride_id', rideId)
        .order('joined_at', { ascending: true });

      if (error) {
        logger.warn('[SupabaseRideParticipantRepository] getParticipants error:', error);
        return [];
      }

      return (data || []).map((row: any) => {
        const rawStatus = (row.status || 'PENDING').toUpperCase();
        const approvalStatus: ParticipantApprovalStatus =
          rawStatus === 'APPROVED' || rawStatus === 'JOINED'
            ? 'APPROVED'
            : rawStatus === 'REJECTED'
            ? 'REJECTED'
            : 'PENDING';

        const role: ParticipantRole =
          (row.role || 'RIDER').toUpperCase() === 'ORGANIZER'
            ? 'ORGANIZER'
            : (row.role || 'RIDER').toUpperCase() === 'LEADER'
            ? 'LEADER'
            : 'RIDER';

        const prof = row.user;
        const name = prof?.full_name || prof?.username || 'Rider';
        const username = prof?.username || 'rider';

        return {
          id: row.id,
          rideId: row.ride_id,
          userId: row.user_id,
          role,
          approvalStatus,
          status: row.status,
          joinedAt: row.joined_at,
          approvedAt: row.approved_at,
          updatedAt: row.updated_at,
          user: prof
            ? {
                id: prof.id,
                name,
                username,
                email: '',
                fullName: name,
                callsign: username,
                avatarUrl: prof.avatar_url,
                bio: '',
                city: prof.city || 'Pune',
                state: prof.state || 'Maharashtra',
                country: 'India',
                createdAt: row.joined_at,
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
      logger.error('[SupabaseRideParticipantRepository] Error fetching participants:', error);
      return [];
    }
  }

  /**
   * Checks the participation record of a user in a ride.
   */
  async getUserParticipation(rideId: string, userId: string): Promise<RideParticipant | null> {
    if (!rideId || !userId) return null;

    try {
      const { data, error } = await (supabaseClient.from('ride_participants') as any)
        .select('*')
        .eq('ride_id', rideId)
        .eq('user_id', userId)
        .maybeSingle();

      if (error || !data) return null;

      const rawStatus = (data.status || 'PENDING').toUpperCase();
      const approvalStatus: ParticipantApprovalStatus =
        rawStatus === 'APPROVED' || rawStatus === 'JOINED'
          ? 'APPROVED'
          : rawStatus === 'REJECTED'
          ? 'REJECTED'
          : 'PENDING';

      return {
        id: data.id,
        rideId: data.ride_id,
        userId: data.user_id,
        role: (data.role || 'RIDER').toUpperCase() as ParticipantRole,
        approvalStatus,
        status: data.status,
        joinedAt: data.joined_at,
        approvedAt: data.approved_at,
        updatedAt: data.updated_at,
      };
    } catch {
      return null;
    }
  }

  /**
   * User joins a ride with pending status.
   */
  async joinRide(
    rideId: string,
    userId: string,
    role: ParticipantRole = 'RIDER'
  ): Promise<{ success: boolean; message?: string; participantId?: string; error?: string }> {
    try {
      const { data, error } = await (supabaseClient.from('ride_participants') as any)
        .upsert(
          {
            ride_id: rideId,
            user_id: userId,
            role: role.toLowerCase(),
            status: 'pending',
            joined_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'ride_id,user_id' }
        )
        .select('id')
        .single();

      if (error) {
        logger.error('[SupabaseRideParticipantRepository] joinRide error:', error);
        return { success: false, error: error.message };
      }

      // Also maintain compatibility record in ride_members
      try {
        await (supabaseClient.from('ride_members') as any).upsert(
          {
            ride_id: rideId,
            user_id: userId,
            role: role.toUpperCase(),
            status: 'PENDING',
          },
          { onConflict: 'ride_id,user_id' }
        );
      } catch {}

      return {
        success: true,
        participantId: data?.id,
        message: 'Join request submitted for organizer approval',
      };
    } catch (err: any) {
      logger.error('[SupabaseRideParticipantRepository] joinRide exception:', err);
      return { success: false, error: err?.message || 'Failed to submit join request' };
    }
  }

  /**
   * User leaves a ride.
   */
  async leaveRide(
    rideId: string,
    userId: string
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const { error } = await (supabaseClient.from('ride_participants') as any)
        .update({ status: 'left', updated_at: new Date().toISOString() })
        .eq('ride_id', rideId)
        .eq('user_id', userId);

      if (error) {
        logger.error('[SupabaseRideParticipantRepository] leaveRide error:', error);
        return { success: false, error: error.message };
      }

      try {
        await (supabaseClient.from('ride_members') as any)
          .delete()
          .eq('ride_id', rideId)
          .eq('user_id', userId);
      } catch {}

      return { success: true, message: 'Left ride successfully' };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to leave ride' };
    }
  }

  /**
   * Organizer updates participant role.
   */
  async updateParticipantRole(
    rideId: string,
    userId: string,
    role: ParticipantRole
  ): Promise<boolean> {
    try {
      const { error } = await (supabaseClient.from('ride_participants') as any)
        .update({ role: role.toLowerCase(), updated_at: new Date().toISOString() })
        .eq('ride_id', rideId)
        .eq('user_id', userId);

      return !error;
    } catch {
      return false;
    }
  }

  /**
   * Organizer removes a participant.
   */
  async removeParticipant(rideId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await (supabaseClient.from('ride_participants') as any)
        .update({ status: 'rejected', updated_at: new Date().toISOString() })
        .eq('ride_id', rideId)
        .eq('user_id', userId);

      return !error;
    } catch {
      return false;
    }
  }

  /**
   * Retrieves list of ride IDs that a user has joined as an approved participant.
   */
  async getJoinedRidesByUser(userId: string): Promise<string[]> {
    try {
      const { data, error } = await (supabaseClient.from('ride_participants') as any)
        .select('ride_id')
        .eq('user_id', userId)
        .in('status', ['approved', 'APPROVED', 'JOINED', 'active', 'ACTIVE']);

      if (error || !data) return [];
      return data.map((r: any) => r.ride_id);
    } catch {
      return [];
    }
  }
}

export const supabaseRideParticipantRepository = new SupabaseRideParticipantRepository();
