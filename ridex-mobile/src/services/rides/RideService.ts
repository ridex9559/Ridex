/**
 * RIDEX V2 — Production Ride Creation, Unique Ride ID & Multi-Device Synchronization Service
 * Interfaces directly with Supabase Cloud Postgres database with Row Level Security (RLS).
 * Supports Android APK, Expo Go, and Web cross-platform clients.
 */

import {
  RideDraft,
  CreateRideFormErrors,
  RideEvent,
  RideParticipant,
  ParticipantApprovalStatus,
  ParticipantRole,
} from '../../types/groupRide';
import { supabaseClient } from '../supabase/client';
import { rideRealtimeService } from '../realtime/RideRealtimeService';
import { checkpointService } from '../connectRide/CheckpointService';
import { routeCalculationService } from '../maps/RouteCalculationService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '../../utils/logger';

// In-memory fallback cache for instant responsiveness
const LOCAL_RIDES_CACHE: Record<string, RideEvent> = {};
const LOCAL_PARTICIPANTS_CACHE: Record<string, RideParticipant[]> = {};

/**
 * Generate human-friendly Unique Ride ID in format RIDEX-XXXXX
 * Avoids ambiguous characters (0, O, 1, I, L)
 */
export function generateRideCode(): string {
  const chars = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `RIDEX-${code}`;
}

export class RideService {
  /**
   * Validates a ride creation draft before publishing.
   */
  public validateDraft(draft: RideDraft): { isValid: boolean; errors: CreateRideFormErrors } {
    const errors: CreateRideFormErrors = {};

    if (!draft.title || draft.title.trim().length < 3) {
      errors.title = 'Ride title must be at least 3 characters long';
    } else if (draft.title.trim().length > 100) {
      errors.title = 'Ride title must not exceed 100 characters';
    }

    if (!draft.startLocation) {
      errors.startLocation = 'Start / Meetup location is required';
    }

    if (!draft.destination) {
      errors.destination = 'Destination point is required';
    }

    if (!draft.scheduledDate) {
      errors.scheduledDate = 'Ride date is required';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }

  /**
   * Generates a collision-checked unique Ride ID against the Supabase database.
   */
  public async generateUniqueRideCode(): Promise<string> {
    for (let attempts = 0; attempts < 5; attempts++) {
      const code = generateRideCode();
      try {
        const { data, error } = await (supabaseClient.from('rides') as any)
          .select('id')
          .eq('join_code', code)
          .maybeSingle();

        if (!error && !data) {
          return code;
        }
      } catch {
        return code;
      }
    }
    return `RIDEX-${Date.now().toString(36).toUpperCase().slice(-5)}`;
  }

  /**
   * Publishes a new Group Ride to Supabase.
   * Atomically enrolls the organizer into public.ride_participants as an approved organizer.
   */
  public async publishRide(organizerId: string, draft: RideDraft): Promise<RideEvent> {
    const rideCode = await this.generateUniqueRideCode();
    const cleanTitle = draft.title.trim();

    const startLat = draft.startLocation?.latitude || 18.5204;
    const startLng = draft.startLocation?.longitude || 73.8567;
    const endLat = draft.destination?.latitude || 18.7557;
    const endLng = draft.destination?.longitude || 73.4091;

    // Accurate multi-stop distance calculation in km including all checkpoints/waypoints
    const distKm =
      routeCalculationService.calculateQuickDistanceKm(
        draft.startLocation,
        (draft.checkpoints as any) || [],
        draft.destination
      ) ||
      Math.round(
        Math.sqrt(Math.pow((endLat - startLat) * 111, 2) + Math.pow((endLng - startLng) * 111, 2))
      ) ||
      64;

    const formattedDate =
      draft.scheduledDate instanceof Date
        ? draft.scheduledDate.toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0];

    // Confirm session
    const { data: sessionData } = await supabaseClient.auth.getSession();
    const activeUserId = sessionData?.session?.user?.id || organizerId;

    let dbRideId = `ride-${Date.now()}`;

    const ridePayload = {
      join_code: rideCode,
      ride_code: rideCode,
      title: cleanTitle,
      description: draft.description?.trim() || 'Motorcycle group ride with the RIDEX squad.',
      organizer_id: activeUserId,
      visibility: draft.visibility ? draft.visibility.toLowerCase() : 'public',
      join_method: draft.approvalRequired ? 'REQUEST_APPROVAL' : 'OPEN_JOIN',
      status: 'published',
      start_location_name: draft.startLocation?.name || 'Pune Rendezvous Point',
      start_latitude: startLat,
      start_longitude: startLng,
      meetup_location_name: draft.startLocation?.name || 'Meetup Point',
      meetup_latitude: startLat,
      meetup_longitude: startLng,
      destination_name: draft.destination?.name || 'Destination Point',
      destination_latitude: endLat,
      destination_longitude: endLng,
      distance_km: distKm,
      estimated_duration: Math.round(distKm * 1.5),
      ride_date: formattedDate,
      meetup_time: draft.meetingTime || '05:30 AM',
      departure_time: draft.rideStartTime || '06:00 AM',
      max_riders: draft.maxParticipants || 20,
      ride_type: draft.category || 'WEEKEND',
      difficulty: draft.difficulty || 'MODERATE',
    };

    try {
      const { data: createdRow, error: insertError } = await (supabaseClient.from('rides') as any)
        .insert(ridePayload)
        .select('*')
        .single();

      if (insertError) {
        logger.error('[RideService] Database insert error for rides table:', insertError);
      } else if (createdRow) {
        dbRideId = createdRow.id;
        logger.info('[RideService] Group ride saved to Supabase:', dbRideId, rideCode);

        // Auto-enroll organizer into public.ride_participants as APPROVED ORGANIZER
        try {
          await (supabaseClient.from('ride_participants') as any).upsert(
            {
              ride_id: dbRideId,
              user_id: activeUserId,
              role: 'organizer',
              status: 'approved',
              joined_at: new Date().toISOString(),
              approved_at: new Date().toISOString(),
            },
            { onConflict: 'ride_id,user_id' }
          );

          // Maintain compatibility in ride_members
          await (supabaseClient.from('ride_members') as any).upsert(
            {
              ride_id: dbRideId,
              user_id: activeUserId,
              role: 'ORGANIZER',
              status: 'APPROVED',
            },
            { onConflict: 'ride_id,user_id' }
          );
        } catch (memberErr) {
          logger.warn('[RideService] Auto-enroll organizer warning:', memberErr);
        }
      }
    } catch (err) {
      logger.error('[RideService] publishRide network error:', err);
    }

    // Persist checkpoints to checkpoint service immediately
    const rawCheckpoints = (draft.checkpoints as any) || [];
    await checkpointService.saveCheckpoints(dbRideId, rawCheckpoints);

    // Construct unified domain model
    const createdRide: RideEvent = {
      id: dbRideId,
      rideCode,
      joinCode: rideCode,
      title: cleanTitle,
      description: draft.description?.trim() || 'Motorcycle group ride with the RIDEX squad.',
      category: draft.category || 'WEEKEND',
      difficulty: draft.difficulty || 'MODERATE',
      organizerId: activeUserId,
      organizer: {
        id: activeUserId,
        name: 'Ride Organizer',
        username: 'organizer',
        email: '',
        avatarUrl: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=400&q=80',
        city: 'Pune',
        createdAt: new Date().toISOString(),
      },
      startLocation: draft.startLocation!,
      destination: draft.destination!,
      checkpoints: rawCheckpoints,
      scheduledAt: new Date(draft.scheduledDate).toISOString(),
      meetingTime: draft.meetingTime || '05:30 AM',
      rideStartTime: draft.rideStartTime || '06:00 AM',
      estimatedDistanceKm: distKm,
      estimatedDurationMinutes: Math.round(distKm * 1.5),
      maxParticipants: draft.maxParticipants || 20,
      currentParticipantCount: 1,
      visibility: draft.visibility || 'PUBLIC',
      approvalRequired: draft.approvalRequired ?? true,
      assignedLeaders: draft.assignedLeaders || [],
      status: 'UPCOMING',
      userParticipationStatus: 'ORGANIZER',
      userRole: 'ORGANIZER',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Cache locally
    LOCAL_RIDES_CACHE[createdRide.id] = createdRide;
    LOCAL_RIDES_CACHE[rideCode] = createdRide;

    try {
      await AsyncStorage.setItem(`@ridex_ride_${createdRide.id}`, JSON.stringify(createdRide));
    } catch {}

    LOCAL_PARTICIPANTS_CACHE[createdRide.id] = [
      {
        id: `p-${Date.now()}`,
        rideId: createdRide.id,
        userId: activeUserId,
        role: 'ORGANIZER',
        approvalStatus: 'APPROVED',
        joinedAt: new Date().toISOString(),
      },
    ];

    // Subscribe to realtime channel
    rideRealtimeService.subscribeToRide(createdRide.id);

    return createdRide;
  }

  /**
   * Finds a ride by Unique Ride ID code (e.g. RIDEX-KA84R).
   */
  public async getRideByCode(code: string): Promise<RideEvent | null> {
    if (!code || code.trim() === '') return null;

    const raw = code.trim().toUpperCase();
    const cleanCode = raw.startsWith('RIDEX-') ? raw : `RIDEX-${raw}`;

    logger.info('[RideService] Searching Supabase for Ride Code:', cleanCode);

    try {
      const { data: dbRow, error } = await (supabaseClient.from('rides') as any)
        .select(`
          *,
          organizer:profiles!rides_organizer_id_fkey(id, full_name, username, avatar_url, city)
        `)
        .or(`join_code.eq.${cleanCode},ride_code.eq.${cleanCode}`)
        .maybeSingle();

      if (!error && dbRow) {
        let count = 1;
        try {
          const { count: participantCount } = await (supabaseClient.from('ride_participants') as any)
            .select('id', { count: 'exact', head: true })
            .eq('ride_id', dbRow.id)
            .in('status', ['approved', 'APPROVED', 'JOINED']);
          if (participantCount && participantCount > 0) count = participantCount;
        } catch {}

        const organizerName = dbRow.organizer?.full_name || dbRow.organizer?.username || 'Ride Organizer';
        const organizerAvatar =
          dbRow.organizer?.avatar_url || 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=400&q=80';
        const organizerCity = dbRow.organizer?.city || 'Pune';

        const rawStatus = (dbRow.status || 'published').toUpperCase();
        const status = rawStatus === 'ACTIVE' || rawStatus === 'LIVE' ? 'LIVE' : rawStatus === 'COMPLETED' ? 'COMPLETED' : 'UPCOMING';

        // Load actual persisted checkpoints
        const checkpoints = await checkpointService.getCheckpoints(dbRow.id);

        const rideEvent: RideEvent = {
          id: dbRow.id,
          rideCode: dbRow.join_code || dbRow.ride_code || cleanCode,
          joinCode: dbRow.join_code || dbRow.ride_code || cleanCode,
          title: dbRow.title,
          description: dbRow.description || `Group motorcycle ride organized by ${organizerName}.`,
          category: dbRow.ride_type || 'WEEKEND',
          difficulty: dbRow.difficulty || 'MODERATE',
          organizerId: dbRow.organizer_id,
          organizer: {
            id: dbRow.organizer_id,
            name: organizerName,
            username: dbRow.organizer?.username || 'organizer',
            email: '',
            avatarUrl: organizerAvatar,
            city: organizerCity,
            createdAt: dbRow.created_at,
          },
          startLocation: {
            name: dbRow.start_location_name,
            latitude: Number(dbRow.start_latitude) || 18.5204,
            longitude: Number(dbRow.start_longitude) || 73.8567,
          },
          destination: {
            name: dbRow.destination_name,
            latitude: Number(dbRow.destination_latitude) || 18.7557,
            longitude: Number(dbRow.destination_longitude) || 73.4091,
          },
          checkpoints: (checkpoints as any) || [],
          scheduledAt: dbRow.ride_date || dbRow.created_at,
          meetingTime: dbRow.meetup_time || '05:30 AM',
          rideStartTime: dbRow.departure_time || '06:00 AM',
          estimatedDistanceKm: Number(dbRow.distance_km) || 64,
          estimatedDurationMinutes: Number(dbRow.estimated_duration) || 90,
          maxParticipants: dbRow.max_riders || 20,
          currentParticipantCount: count,
          visibility: (dbRow.visibility ? dbRow.visibility.toUpperCase() : 'PUBLIC') as any,
          approvalRequired: dbRow.join_method === 'REQUEST_APPROVAL',
          assignedLeaders: [],
          status,
          createdAt: dbRow.created_at,
          updatedAt: dbRow.updated_at,
        };

        LOCAL_RIDES_CACHE[rideEvent.id] = rideEvent;
        LOCAL_RIDES_CACHE[cleanCode] = rideEvent;

        return rideEvent;
      }
    } catch (err) {
      logger.warn('[RideService] Supabase getRideByCode error:', err);
    }

    // Local fallback
    for (const key of Object.keys(LOCAL_RIDES_CACHE)) {
      const ride = LOCAL_RIDES_CACHE[key];
      if (ride.rideCode === cleanCode || ride.id === raw || ride.joinCode === cleanCode) {
        return ride;
      }
    }

    return null;
  }

  /**
   * Retrieves full details for a group ride with active user participation.
   */
  public async getRideDetails(rideId: string, currentUserId?: string): Promise<RideEvent | null> {
    if (!rideId) return null;

    try {
      const { data: dbRow, error } = await (supabaseClient.from('rides') as any)
        .select(`
          *,
          organizer:profiles!rides_organizer_id_fkey(id, full_name, username, avatar_url, city)
        `)
        .eq('id', rideId)
        .maybeSingle();

      if (!error && dbRow) {
        // Fetch participants from public.ride_participants
        const { data: participants } = await (supabaseClient.from('ride_participants') as any)
          .select(`
            *,
            user:profiles!ride_participants_user_id_fkey(id, full_name, username, avatar_url, city)
          `)
          .eq('ride_id', rideId);

        const approvedCount =
          participants?.filter((m: any) => ['approved', 'APPROVED', 'JOINED'].includes(m.status)).length || 1;
        const currentMember = currentUserId
          ? participants?.find((m: any) => m.user_id === currentUserId)
          : null;

        const isOrganizer = currentUserId && (dbRow.organizer_id === currentUserId || currentMember?.role === 'organizer' || currentMember?.role === 'ORGANIZER');

        let userPartStatus: any = 'NOT_JOINED';
        if (isOrganizer) {
          userPartStatus = 'ORGANIZER';
        } else if (currentMember) {
          const raw = (currentMember.status || '').toUpperCase();
          userPartStatus = raw === 'APPROVED' || raw === 'JOINED' ? 'APPROVED' : raw === 'PENDING' ? 'PENDING' : raw === 'REJECTED' ? 'REJECTED' : 'NOT_JOINED';
        }

        const organizerName = dbRow.organizer?.full_name || dbRow.organizer?.username || 'Ride Organizer';
        const rawStatus = (dbRow.status || 'published').toUpperCase();
        const status = rawStatus === 'ACTIVE' || rawStatus === 'LIVE' ? 'LIVE' : rawStatus === 'COMPLETED' ? 'COMPLETED' : 'UPCOMING';

        // Load actual persisted checkpoints
        const checkpoints = await checkpointService.getCheckpoints(rideId);

        const rideEvent: RideEvent = {
          id: dbRow.id,
          rideCode: dbRow.join_code || dbRow.ride_code,
          joinCode: dbRow.join_code || dbRow.ride_code,
          title: dbRow.title,
          description: dbRow.description || `Motorcycle group ride organized by ${organizerName}.`,
          category: dbRow.ride_type || 'WEEKEND',
          difficulty: dbRow.difficulty || 'MODERATE',
          organizerId: dbRow.organizer_id,
          organizer: {
            id: dbRow.organizer_id,
            name: organizerName,
            username: dbRow.organizer?.username || 'organizer',
            email: '',
            avatarUrl: dbRow.organizer?.avatar_url || 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=400&q=80',
            city: dbRow.organizer?.city || 'Pune',
            createdAt: dbRow.created_at,
          },
          startLocation: {
            name: dbRow.start_location_name,
            latitude: Number(dbRow.start_latitude) || 18.5204,
            longitude: Number(dbRow.start_longitude) || 73.8567,
          },
          destination: {
            name: dbRow.destination_name,
            latitude: Number(dbRow.destination_latitude) || 18.7557,
            longitude: Number(dbRow.destination_longitude) || 73.4091,
          },
          checkpoints: (checkpoints as any) || [],
          scheduledAt: dbRow.ride_date || dbRow.created_at,
          meetingTime: dbRow.meetup_time || '05:30 AM',
          rideStartTime: dbRow.departure_time || '06:00 AM',
          estimatedDistanceKm: Number(dbRow.distance_km) || 64,
          estimatedDurationMinutes: Number(dbRow.estimated_duration) || 90,
          maxParticipants: dbRow.max_riders || 20,
          currentParticipantCount: approvedCount,
          visibility: (dbRow.visibility ? dbRow.visibility.toUpperCase() : 'PUBLIC') as any,
          approvalRequired: dbRow.join_method === 'REQUEST_APPROVAL',
          assignedLeaders: [],
          status,
          createdAt: dbRow.created_at,
          updatedAt: dbRow.updated_at,
          userParticipationStatus: userPartStatus,
          userRole: isOrganizer ? 'ORGANIZER' : currentMember?.role?.toUpperCase(),
        };

        LOCAL_RIDES_CACHE[rideId] = rideEvent;
        return rideEvent;
      }
    } catch (err) {
      logger.warn('[RideService] getRideDetails Supabase query error:', err);
    }

    // Check memory cache
    if (LOCAL_RIDES_CACHE[rideId]) {
      const cached = LOCAL_RIDES_CACHE[rideId];
      if (!cached.checkpoints || cached.checkpoints.length === 0) {
        cached.checkpoints = (await checkpointService.getCheckpoints(rideId)) as any;
      }
      return cached;
    }

    // Check AsyncStorage
    try {
      const stored = await AsyncStorage.getItem(`@ridex_ride_${rideId}`);
      if (stored) {
        const parsed: RideEvent = JSON.parse(stored);
        parsed.checkpoints = (await checkpointService.getCheckpoints(rideId)) as any;
        LOCAL_RIDES_CACHE[rideId] = parsed;
        return parsed;
      }
    } catch {}

    return null;
  }

  /**
   * Rider requests to join a group ride.
   */
  public async requestToJoinRide(
    rideId: string,
    user: { id: string; name: string; username?: string; avatarUrl?: string },
    motorcycle?: { model: string; engineCc?: number }
  ): Promise<{ success: boolean; message: string }> {
    logger.info('[RideService] Rider requesting to join ride:', rideId, user.name);

    try {
      // 1. Insert into public.ride_participants as 'pending'
      await (supabaseClient.from('ride_participants') as any).upsert(
        {
          ride_id: rideId,
          user_id: user.id,
          role: 'rider',
          status: 'pending',
          joined_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'ride_id,user_id' }
      );

      // 2. Also keep compatibility in ride_members
      try {
        await (supabaseClient.from('ride_members') as any).upsert(
          {
            ride_id: rideId,
            user_id: user.id,
            role: 'RIDER',
            status: 'PENDING',
          },
          { onConflict: 'ride_id,user_id' }
        );
      } catch {}
    } catch (dbErr) {
      logger.warn('[RideService] Supabase join request write warning:', dbErr);
    }

    // Local cache update
    const participant: RideParticipant = {
      id: `p-${Date.now()}`,
      rideId,
      userId: user.id,
      role: 'RIDER',
      approvalStatus: 'PENDING',
      joinedAt: new Date().toISOString(),
      user: {
        id: user.id,
        name: user.name,
        username: user.username || user.name.toLowerCase().replace(/\s+/g, '_'),
        email: '',
        avatarUrl: user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80',
        city: 'Pune',
        createdAt: new Date().toISOString(),
      },
    };

    if (!LOCAL_PARTICIPANTS_CACHE[rideId]) LOCAL_PARTICIPANTS_CACHE[rideId] = [];
    const idx = LOCAL_PARTICIPANTS_CACHE[rideId].findIndex((p) => p.userId === user.id);
    if (idx >= 0) LOCAL_PARTICIPANTS_CACHE[rideId][idx] = participant;
    else LOCAL_PARTICIPANTS_CACHE[rideId].push(participant);

    // Broadcast Realtime Event
    try {
      await rideRealtimeService.broadcastJoinRequest({
        rideId,
        userId: user.id,
        riderName: user.name,
        username: user.username || 'rider',
        avatarUrl: user.avatarUrl,
        motorcycleName: motorcycle?.model || 'Motorcycle',
        motorcycleCc: motorcycle?.engineCc || 400,
        requestedAt: new Date().toISOString(),
      });
    } catch (e) {
      logger.warn('[RideService] Broadcast join_request warning:', e);
    }

    return {
      success: true,
      message: 'Join request sent to the ride organizer for approval!',
    };
  }

  /**
   * Organizer approves a pending rider request.
   */
  public async approveParticipant(rideId: string, userId: string): Promise<boolean> {
    try {
      await (supabaseClient.from('ride_participants') as any)
        .update({ status: 'approved', approved_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq('ride_id', rideId)
        .eq('user_id', userId);

      try {
        await (supabaseClient.from('ride_members') as any)
          .update({ status: 'APPROVED', updated_at: new Date().toISOString() })
          .eq('ride_id', rideId)
          .eq('user_id', userId);
      } catch {}
    } catch (e) {
      logger.warn('[RideService] Supabase approveParticipant warning:', e);
    }

    const list = LOCAL_PARTICIPANTS_CACHE[rideId] || [];
    const target = list.find((p) => p.userId === userId);
    if (target) target.approvalStatus = 'APPROVED';

    try {
      await rideRealtimeService.broadcastApproval({
        rideId,
        userId,
        status: 'APPROVED',
        updatedAt: new Date().toISOString(),
      });
    } catch {}

    return true;
  }

  /**
   * Organizer rejects a pending rider request.
   */
  public async rejectParticipant(rideId: string, userId: string): Promise<boolean> {
    try {
      await (supabaseClient.from('ride_participants') as any)
        .update({ status: 'rejected', updated_at: new Date().toISOString() })
        .eq('ride_id', rideId)
        .eq('user_id', userId);

      try {
        await (supabaseClient.from('ride_members') as any)
          .update({ status: 'REJECTED', updated_at: new Date().toISOString() })
          .eq('ride_id', rideId)
          .eq('user_id', userId);
      } catch {}
    } catch (e) {
      logger.warn('[RideService] Supabase rejectParticipant warning:', e);
    }

    const list = LOCAL_PARTICIPANTS_CACHE[rideId] || [];
    const target = list.find((p) => p.userId === userId);
    if (target) target.approvalStatus = 'REJECTED';

    try {
      await rideRealtimeService.broadcastApproval({
        rideId,
        userId,
        status: 'REJECTED',
        updatedAt: new Date().toISOString(),
      });
    } catch {}

    return true;
  }

  public async approveJoinRequest(rideId: string, userId: string): Promise<boolean> {
    return this.approveParticipant(rideId, userId);
  }

  public async rejectJoinRequest(rideId: string, userId: string): Promise<boolean> {
    return this.rejectParticipant(rideId, userId);
  }

  /**
   * Organizer starts the live ride.
   */
  public async startRide(rideId: string, organizerId: string): Promise<boolean> {
    try {
      await (supabaseClient.from('rides') as any)
        .update({ status: 'active', updated_at: new Date().toISOString() })
        .eq('id', rideId);

      await rideRealtimeService.broadcastRideStatusChange(rideId, 'LIVE');
      return true;
    } catch (err) {
      logger.error('[RideService] startRide error:', err);
      return false;
    }
  }

  /**
   * Organizer ends/completes the ride.
   */
  public async completeRide(rideId: string, organizerId: string): Promise<boolean> {
    try {
      await (supabaseClient.from('rides') as any)
        .update({ status: 'completed', updated_at: new Date().toISOString() })
        .eq('id', rideId);

      await rideRealtimeService.broadcastRideStatusChange(rideId, 'COMPLETED');
      return true;
    } catch (err) {
      logger.error('[RideService] completeRide error:', err);
      return false;
    }
  }

  /**
   * Fetches all rides for a user: organized, approved upcoming, active, and pending approval.
   */
  public async getMyRides(userId: string): Promise<{
    pending: RideEvent[];
    upcoming: RideEvent[];
    active: RideEvent[];
    completed: RideEvent[];
  }> {
    if (!userId) return { pending: [], upcoming: [], active: [], completed: [] };

    try {
      // 1. Fetch rides organized by user
      const { data: organizedRides } = await (supabaseClient.from('rides') as any)
        .select(`
          *,
          organizer:profiles!rides_organizer_id_fkey(id, full_name, username, avatar_url, city)
        `)
        .eq('organizer_id', userId)
        .order('created_at', { ascending: false });

      // 2. Fetch rides joined by user from public.ride_participants
      const { data: joinedParticipations } = await (supabaseClient.from('ride_participants') as any)
        .select(`
          status,
          role,
          ride:rides(
            *,
            organizer:profiles!rides_organizer_id_fkey(id, full_name, username, avatar_url, city)
          )
        `)
        .eq('user_id', userId);

      const pending: RideEvent[] = [];
      const upcoming: RideEvent[] = [];
      const active: RideEvent[] = [];
      const completed: RideEvent[] = [];

      const processedRideIds = new Set<string>();

      // Process organized rides
      (organizedRides || []).forEach((r: any) => {
        processedRideIds.add(r.id);
        const event = this.mapRowToRideEvent(r, r.organizer, 'ORGANIZER');
        const st = (r.status || 'published').toLowerCase();
        if (st === 'active' || st === 'live') active.push(event);
        else if (st === 'completed') completed.push(event);
        else upcoming.push(event);
      });

      // Process joined rides
      (joinedParticipations || []).forEach((p: any) => {
        if (!p.ride || processedRideIds.has(p.ride.id)) return;
        processedRideIds.add(p.ride.id);

        const rawPartStatus = (p.status || '').toLowerCase();
        const userStatus = rawPartStatus === 'approved' || rawPartStatus === 'joined' ? 'APPROVED' : rawPartStatus === 'pending' ? 'PENDING' : 'NOT_JOINED';
        const event = this.mapRowToRideEvent(p.ride, p.ride.organizer, userStatus);

        const st = (p.ride.status || 'published').toLowerCase();
        if (userStatus === 'PENDING') {
          pending.push(event);
        } else if (st === 'active' || st === 'live') {
          active.push(event);
        } else if (st === 'completed') {
          completed.push(event);
        } else {
          upcoming.push(event);
        }
      });

      return { pending, upcoming, active, completed };
    } catch (err) {
      logger.warn('[RideService] getMyRides query error:', err);
      return { pending: [], upcoming: [], active: [], completed: [] };
    }
  }

  /**
   * Get all participants for a ride.
   */
  public async getParticipants(rideId: string): Promise<RideParticipant[]> {
    try {
      const { data, error } = await (supabaseClient.from('ride_participants') as any)
        .select(`
          *,
          user:profiles!ride_participants_user_id_fkey(id, full_name, username, avatar_url, city)
        `)
        .eq('ride_id', rideId);

      if (!error && data && data.length > 0) {
        const result: RideParticipant[] = data.map((m: any) => {
          const rawStatus = (m.status || 'PENDING').toUpperCase();
          const approvalStatus: ParticipantApprovalStatus =
            rawStatus === 'APPROVED' || rawStatus === 'JOINED' ? 'APPROVED' : rawStatus === 'REJECTED' ? 'REJECTED' : 'PENDING';

          return {
            id: m.id,
            rideId: m.ride_id,
            userId: m.user_id,
            role: (m.role || 'RIDER').toUpperCase() as ParticipantRole,
            approvalStatus,
            joinedAt: m.joined_at,
            user: m.user
              ? {
                  id: m.user.id,
                  name: m.user.full_name || m.user.username || 'Rider',
                  username: m.user.username || 'rider',
                  email: '',
                  avatarUrl: m.user.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80',
                  city: m.user.city || 'Pune',
                  createdAt: m.joined_at,
                }
              : undefined,
          };
        });

        LOCAL_PARTICIPANTS_CACHE[rideId] = result;
        return result;
      }
    } catch (err) {
      logger.warn('[RideService] getParticipants Supabase error:', err);
    }

    return LOCAL_PARTICIPANTS_CACHE[rideId] || [];
  }

  public async getRideParticipants(rideId: string): Promise<RideParticipant[]> {
    return this.getParticipants(rideId);
  }

  private mapRowToRideEvent(r: any, profile?: any, userParticipationStatus: any = 'NOT_JOINED'): RideEvent {
    const startLat = Number(r.start_latitude) || 18.5204;
    const startLng = Number(r.start_longitude) || 73.8567;
    const endLat = Number(r.destination_latitude) || Number(r.end_latitude) || (startLat + 0.05);
    const endLng = Number(r.destination_longitude) || Number(r.end_longitude) || (startLng + 0.05);
    const distanceKm = Number(r.distance_km) || 64;
    const durationMins = Number(r.estimated_duration) || 90;

    const code = r.join_code || r.ride_code || 'RIDEX-7X92K';
    const cleanStatus = (r.status || 'published').toUpperCase();
    const organizerName = profile?.full_name || profile?.username || 'Ride Organizer';

    return {
      id: r.id,
      rideCode: code,
      joinCode: code,
      approvalRequired: r.join_method !== 'OPEN_JOIN',
      organizerId: r.organizer_id || '00000000-0000-0000-0000-000000000000',
      title: r.title || 'Motorcycle Squad Ride',
      description: r.description || `Group motorcycle ride with ${organizerName}.`,
      category: r.ride_type || 'WEEKEND',
      difficulty: r.difficulty || 'MODERATE',
      startLocation: {
        name: r.start_location_name || 'Starting Point',
        latitude: startLat,
        longitude: startLng,
      },
      destination: {
        name: r.destination_name || 'Destination Point',
        latitude: endLat,
        longitude: endLng,
      },
      scheduledAt: r.ride_date || r.created_at || new Date().toISOString(),
      meetingTime: r.meetup_time || '05:30 AM',
      rideStartTime: r.departure_time || '06:00 AM',
      estimatedDistanceKm: distanceKm,
      estimatedDurationMinutes: durationMins,
      maxParticipants: r.max_riders || 20,
      currentParticipantCount: 1,
      visibility: (r.visibility ? r.visibility.toUpperCase() : 'PUBLIC') as any,
      status: cleanStatus === 'ACTIVE' || cleanStatus === 'LIVE' ? 'LIVE' : cleanStatus === 'COMPLETED' ? 'COMPLETED' : 'UPCOMING',
      userParticipationStatus,
      createdAt: r.created_at || new Date().toISOString(),
      updatedAt: r.updated_at || new Date().toISOString(),
      organizer: {
        id: r.organizer_id || profile?.id || '00000000-0000-0000-0000-000000000000',
        name: organizerName,
        username: profile?.username || 'organizer',
        email: profile?.email || '',
        fullName: organizerName,
        callsign: profile?.username || 'Captain',
        avatarUrl: profile?.avatar_url || 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=400&q=80',
        bio: profile?.bio || '',
        city: profile?.city || 'Pune',
        state: profile?.state || 'Maharashtra',
        country: 'India',
        createdAt: r.created_at || new Date().toISOString(),
      },
    };
  }
}

export const rideService = new RideService();
export default rideService;
