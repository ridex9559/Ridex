/**
 * RIDEX Web — Core Ride Lifecycle & Waypoint Persistence Service
 * Interacts with public.rides, public.ride_participants, and public.ride_checkpoints tables.
 */

import { supabase } from './supabase';
import {
  RideEvent,
  RideCheckpoint,
  RideParticipant,
  RideStatus,
  ParticipantRole,
  ParticipantApprovalStatus,
  LiveRiderLocation,
  SosAlert,
} from '../types';
import { mapService } from './mapService';

/**
 * Generates an 8-character squad join code (e.g. RIDEX-7X92K)
 * Excludes ambiguous characters (0, O, 1, I, L)
 */
export function generateUniqueRideCode(): string {
  const chars = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `RIDEX-${code}`;
}

export const rideService = {
  /**
   * Fetches published and active group rides.
   */
  async getRides(): Promise<RideEvent[]> {
    const { data, error } = await supabase
      .from('rides')
      .select(`
        *,
        organizer:profiles!rides_organizer_id_fkey(id, full_name, username, avatar_url, city)
      `)
      .order('ride_date', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[rideService] getRides error:', error);
      return [];
    }

    return (data || []).map(this.mapDbRowToRideEvent);
  },

  /**
   * Fetches a specific ride by UUID ID.
   */
  async getRideById(id: string, currentUserId?: string): Promise<RideEvent | null> {
    if (!id) return null;

    const { data, error } = await supabase
      .from('rides')
      .select(`
        *,
        organizer:profiles!rides_organizer_id_fkey(id, full_name, username, avatar_url, city)
      `)
      .eq('id', id)
      .maybeSingle();

    if (error || !data) {
      console.warn('[rideService] getRideById error or not found:', error);
      return null;
    }

    const ride = this.mapDbRowToRideEvent(data);

    // Fetch checkpoints strictly ordered by order_index
    ride.checkpoints = await this.getRideCheckpoints(id);

    // Fetch participants
    ride.participants = await this.getRideParticipants(id);
    ride.currentParticipantCount = ride.participants.filter(
      (p) => p.status === 'approved'
    ).length;

    if (currentUserId) {
      const myPart = ride.participants.find((p) => p.userId === currentUserId);
      ride.userParticipationStatus = myPart ? myPart.status : 'not_joined';
    }

    return ride;
  },

  /**
   * Looks up a ride by its unique join code (e.g. RIDEX-7X92K).
   */
  async getRideByCode(code: string, currentUserId?: string): Promise<RideEvent | null> {
    const cleanCode = code.trim().toUpperCase();

    const { data, error } = await supabase
      .from('rides')
      .select(`
        *,
        organizer:profiles!rides_organizer_id_fkey(id, full_name, username, avatar_url, city)
      `)
      .or(`join_code.eq.${cleanCode},ride_code.eq.${cleanCode}`)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return this.getRideById(data.id, currentUserId);
  },

  /**
   * Publishes a new group ride with origin, destination, and intermediate checkpoints.
   */
  async createRide(
    organizerId: string,
    rideData: {
      title: string;
      description?: string;
      startLocationName: string;
      startLatitude: number;
      startLongitude: number;
      destinationName: string;
      destinationLatitude: number;
      destinationLongitude: number;
      rideDate: string;
      meetupTime: string;
      departureTime: string;
      maxRiders?: number;
      difficulty?: 'EASY' | 'MODERATE' | 'ADVANCED' | 'EXPERT';
      rideType?: string;
    },
    waypoints: {
      name: string;
      type: 'START' | 'BREAKFAST' | 'FUEL' | 'VIEWPOINT' | 'REGROUP' | 'DESTINATION';
      latitude: number;
      longitude: number;
      estimatedStopMinutes?: number;
    }[]
  ): Promise<RideEvent> {
    const rideCode = generateUniqueRideCode();

    // Calculate total route distance with intermediate waypoints
    const allRoutePoints = [
      { latitude: rideData.startLatitude, longitude: rideData.startLongitude },
      ...waypoints.map((w) => ({ latitude: w.latitude, longitude: w.longitude })),
      { latitude: rideData.destinationLatitude, longitude: rideData.destinationLongitude },
    ];

    let distanceKm = 50;
    let estimatedDuration = 60;
    try {
      const routeCalc = await mapService.calculateRoute(allRoutePoints);
      if (routeCalc.distanceKm > 0) {
        distanceKm = routeCalc.distanceKm;
        estimatedDuration = routeCalc.durationMinutes;
      }
    } catch {}

    const payload = {
      organizer_id: organizerId,
      title: rideData.title.trim(),
      description: rideData.description?.trim() || 'Motorcycle group ride with RIDEX squad.',
      join_code: rideCode,
      ride_code: rideCode,
      status: 'published',
      visibility: 'public',
      join_method: 'REQUEST_APPROVAL',
      start_location_name: rideData.startLocationName,
      start_latitude: rideData.startLatitude,
      start_longitude: rideData.startLongitude,
      destination_name: rideData.destinationName,
      destination_latitude: rideData.destinationLatitude,
      destination_longitude: rideData.destinationLongitude,
      distance_km: distanceKm,
      estimated_duration: estimatedDuration,
      ride_date: rideData.rideDate,
      meetup_time: rideData.meetupTime || '05:30 AM',
      departure_time: rideData.departureTime || '06:00 AM',
      max_riders: rideData.maxRiders || 20,
      difficulty: rideData.difficulty || 'MODERATE',
      ride_type: rideData.rideType || 'WEEKEND',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: createdRide, error: rideError } = await supabase
      .from('rides')
      .insert(payload)
      .select()
      .single();

    if (rideError) {
      console.error('[rideService] createRide error:', rideError);
      throw rideError;
    }

    const rideId = createdRide.id;

    // 1. Auto-enroll organizer as approved organizer
    await supabase.from('ride_participants').upsert(
      {
        ride_id: rideId,
        user_id: organizerId,
        role: 'organizer',
        status: 'approved',
        joined_at: new Date().toISOString(),
        approved_at: new Date().toISOString(),
      },
      { onConflict: 'ride_id,user_id' }
    );

    // 2. Persist checkpoints with strict order_index
    if (waypoints && waypoints.length > 0) {
      await this.saveRideCheckpoints(rideId, waypoints);
    }

    return (await this.getRideById(rideId, organizerId))!;
  },

  /**
   * Fetches checkpoints for a ride strictly ordered by order_index.
   */
  async getRideCheckpoints(rideId: string): Promise<RideCheckpoint[]> {
    const { data, error } = await supabase
      .from('ride_checkpoints')
      .select('*')
      .eq('ride_id', rideId)
      .order('order_index', { ascending: true });

    if (error) {
      console.warn('[rideService] getRideCheckpoints error:', error);
      return [];
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      rideId: row.ride_id,
      name: row.name,
      type: row.type || 'REGROUP',
      latitude: Number(row.latitude),
      longitude: Number(row.longitude),
      orderIndex: Number(row.order_index),
      estimatedStopMinutes: Number(row.estimated_stop_minutes || 15),
      isReached: Boolean(row.is_reached),
      reachedAt: row.reached_at,
    }));
  },

  /**
   * Saves and persists checkpoints with strict sequence indexes.
   */
  async saveRideCheckpoints(
    rideId: string,
    checkpoints: {
      name: string;
      type: 'START' | 'BREAKFAST' | 'FUEL' | 'VIEWPOINT' | 'REGROUP' | 'DESTINATION';
      latitude: number;
      longitude: number;
      estimatedStopMinutes?: number;
    }[]
  ): Promise<boolean> {
    try {
      // Delete existing checkpoints for clean replacement
      await supabase.from('ride_checkpoints').delete().eq('ride_id', rideId);

      const rows = checkpoints.map((cp, idx) => ({
        ride_id: rideId,
        name: cp.name.trim() || `Stop ${idx + 1}`,
        type: cp.type || 'REGROUP',
        latitude: cp.latitude,
        longitude: cp.longitude,
        order_index: idx,
        estimated_stop_minutes: cp.estimatedStopMinutes || 15,
        created_at: new Date().toISOString(),
      }));

      const { error } = await supabase.from('ride_checkpoints').insert(rows);
      if (error) throw error;
      return true;
    } catch (err) {
      console.error('[rideService] saveRideCheckpoints error:', err);
      return false;
    }
  },

  /**
   * Fetches all participants for a ride.
   */
  async getRideParticipants(rideId: string): Promise<RideParticipant[]> {
    const { data, error } = await supabase
      .from('ride_participants')
      .select(`
        *,
        user:profiles!ride_participants_user_id_fkey(id, full_name, username, avatar_url, city)
      `)
      .eq('ride_id', rideId)
      .order('joined_at', { ascending: true });

    if (error) {
      console.warn('[rideService] getRideParticipants error:', error);
      return [];
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      rideId: row.ride_id,
      userId: row.user_id,
      role: (row.role || 'rider').toLowerCase() as ParticipantRole,
      status: (row.status || 'pending').toLowerCase() as ParticipantApprovalStatus,
      joinedAt: row.joined_at,
      approvedAt: row.approved_at,
      user: row.user
        ? {
            id: row.user.id,
            fullName: row.user.full_name || 'Rider',
            username: row.user.username || 'rider',
            email: '',
            avatarUrl: row.user.avatar_url,
            city: row.user.city || 'Pune',
          }
        : undefined,
    }));
  },

  /**
   * Rider requests to join a ride.
   */
  async requestToJoinRide(rideId: string, userId: string): Promise<boolean> {
    const { error } = await supabase.from('ride_participants').upsert(
      {
        ride_id: rideId,
        user_id: userId,
        role: 'rider',
        status: 'pending',
        joined_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'ride_id,user_id' }
    );

    return !error;
  },

  /**
   * Organizer approves a pending participant.
   */
  async approveParticipant(rideId: string, userId: string): Promise<boolean> {
    const { error } = await supabase
      .from('ride_participants')
      .update({
        status: 'approved',
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('ride_id', rideId)
      .eq('user_id', userId);

    return !error;
  },

  /**
   * Organizer rejects a pending participant.
   */
  async rejectParticipant(rideId: string, userId: string): Promise<boolean> {
    const { error } = await supabase
      .from('ride_participants')
      .update({
        status: 'rejected',
        updated_at: new Date().toISOString(),
      })
      .eq('ride_id', rideId)
      .eq('user_id', userId);

    return !error;
  },

  /**
   * Fetches all pending join requests across all rides hosted by this organizer.
   */
  async getHostPendingRequests(hostUserId: string): Promise<{
    participantId: string;
    rideId: string;
    rideTitle: string;
    userId: string;
    user?: UserProfile;
    joinedAt: string;
  }[]> {
    if (!hostUserId) return [];

    try {
      const { data: hostRides, error: ridesError } = await supabase
        .from('rides')
        .select('id, title')
        .eq('organizer_id', hostUserId);

      if (ridesError || !hostRides || hostRides.length === 0) return [];

      const rideIds = hostRides.map((r: any) => r.id);
      const rideMap = new Map(hostRides.map((r: any) => [r.id, r.title]));

      const { data: participants, error: partError } = await supabase
        .from('ride_participants')
        .select(`
          id,
          ride_id,
          user_id,
          status,
          joined_at,
          user:profiles!ride_participants_user_id_fkey(id, full_name, username, avatar_url, city)
        `)
        .in('ride_id', rideIds)
        .eq('status', 'pending')
        .order('joined_at', { ascending: false });

      if (partError || !participants) return [];

      return participants.map((p: any) => ({
        participantId: p.id,
        rideId: p.ride_id,
        rideTitle: rideMap.get(p.ride_id) || 'Squad Tour',
        userId: p.user_id,
        user: p.user
          ? {
              id: p.user.id,
              fullName: p.user.full_name || 'Rider',
              username: p.user.username || 'rider',
              email: '',
              avatarUrl: p.user.avatar_url,
              city: p.user.city || 'Pune',
            }
          : undefined,
        joinedAt: p.joined_at,
      }));
    } catch (err) {
      console.warn('[rideService] getHostPendingRequests error:', err);
      return [];
    }
  },

  /**
   * Starts a live ride session (Organizer only).
   */
  async startLiveRide(rideId: string): Promise<boolean> {
    const { error } = await supabase
      .from('rides')
      .update({
        status: 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('id', rideId);

    return !error;
  },

  /**
   * Ends a live ride session (Organizer only).
   */
  async endLiveRide(rideId: string): Promise<boolean> {
    const { error } = await supabase
      .from('rides')
      .update({
        status: 'completed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', rideId);

    return !error;
  },

  /**
   * Fetches latest live GPS positions for active squad participants.
   */
  async getRideLiveLocations(rideId: string): Promise<LiveRiderLocation[]> {
    if (!rideId) return [];
    try {
      const { data, error } = await supabase
        .from('ride_locations')
        .select(`
          ride_id,
          user_id,
          latitude,
          longitude,
          heading,
          speed,
          accuracy,
          is_sharing,
          updated_at,
          user:profiles!ride_locations_user_id_fkey(id, full_name, username)
        `)
        .eq('ride_id', rideId)
        .eq('is_sharing', true);

      if (error || !data) {
        console.warn('[rideService] getRideLiveLocations query warning:', error);
        return [];
      }

      return data.map((row: any) => ({
        userId: row.user_id,
        riderName: row.user?.full_name || row.user?.username || 'Rider',
        latitude: Number(row.latitude),
        longitude: Number(row.longitude),
        heading: Number(row.heading || 0),
        speed: Number(row.speed || 0),
        accuracy: Number(row.accuracy || 0),
        updatedAt: row.updated_at || new Date().toISOString(),
      }));
    } catch (err) {
      console.warn('[rideService] getRideLiveLocations error:', err);
      return [];
    }
  },

  /**
   * Checks if an active, unresolved SOS alert exists for this ride.
   */
  async getRideActiveSos(rideId: string): Promise<SosAlert | null> {
    if (!rideId) return null;
    try {
      const { data, error } = await supabase
        .from('ride_sos_alerts')
        .select(`
          *,
          user:profiles!ride_sos_alerts_user_id_fkey(full_name, username)
        `)
        .eq('ride_id', rideId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error || !data) return null;

      return {
        id: data.id,
        rideId: data.ride_id,
        userId: data.user_id,
        riderName: data.user?.full_name || data.user?.username || 'Rider',
        issueType: data.issue_type || 'MEDICAL',
        latitude: Number(data.latitude || 0),
        longitude: Number(data.longitude || 0),
        note: data.note,
        createdAt: data.created_at,
      };
    } catch {
      return null;
    }
  },

  /**
   * Fetches all rides hosted or joined by a user (completed, active, published).
   */
  async getUserRides(userId: string): Promise<RideEvent[]> {
    if (!userId) return [];
    try {
      // 1. Fetch hosted rides
      const { data: hosted = [] } = await supabase
        .from('rides')
        .select(`
          *,
          organizer:profiles!rides_organizer_id_fkey(id, full_name, username, avatar_url, city)
        `)
        .eq('organizer_id', userId)
        .order('ride_date', { ascending: false });

      // 2. Fetch joined rides via ride_participants
      const { data: participations = [] } = await supabase
        .from('ride_participants')
        .select(`
          ride_id,
          status,
          role,
          ride:rides!ride_participants_ride_id_fkey(
            *,
            organizer:profiles!rides_organizer_id_fkey(id, full_name, username, avatar_url, city)
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'approved');

      const joinedRides = (participations || [])
        .map((p: any) => p.ride)
        .filter(Boolean);

      // Merge and deduplicate by ID
      const allRidesMap = new Map<string, any>();
      [...(hosted || []), ...joinedRides].forEach((r: any) => {
        if (!allRidesMap.has(r.id)) {
          allRidesMap.set(r.id, r);
        }
      });

      return Array.from(allRidesMap.values()).map(this.mapDbRowToRideEvent);
    } catch (e) {
      console.warn('[rideService] getUserRides fallback:', e);
      return [];
    }
  },

  /**
   * Maps raw database row to clean domain model.
   */
  mapDbRowToRideEvent(row: any): RideEvent {
    return {
      id: row.id,
      organizerId: row.organizer_id,
      title: row.title || 'Motorcycle Tour',
      description: row.description || '',
      joinCode: row.join_code || row.ride_code || 'RIDEX',
      rideCode: row.ride_code || row.join_code || 'RIDEX',
      status: (row.status || 'published').toLowerCase() as RideStatus,
      visibility: (row.visibility || 'public').toLowerCase() as any,
      joinMethod: row.join_method || 'REQUEST_APPROVAL',
      startLocationName: row.start_location_name || 'Start Point',
      startLatitude: Number(row.start_latitude || 18.5204),
      startLongitude: Number(row.start_longitude || 73.8567),
      destinationName: row.destination_name || 'Destination Point',
      destinationLatitude: Number(row.destination_latitude || 18.7557),
      destinationLongitude: Number(row.destination_longitude || 73.4091),
      distanceKm: Number(row.distance_km || 0),
      estimatedDuration: Number(row.estimated_duration || 0),
      rideDate: row.ride_date || new Date().toISOString().split('T')[0],
      meetupTime: row.meetup_time || '05:30 AM',
      departureTime: row.departure_time || '06:00 AM',
      maxRiders: Number(row.max_riders || 20),
      rideType: row.ride_type || 'WEEKEND',
      difficulty: (row.difficulty || 'MODERATE').toUpperCase() as any,
      organizer: row.organizer
        ? {
            id: row.organizer.id,
            fullName: row.organizer.full_name || 'Road Captain',
            username: row.organizer.username || 'captain',
            email: '',
            avatarUrl: row.organizer.avatar_url,
            city: row.organizer.city,
          }
        : undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  },
};
