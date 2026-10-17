import { IRideRepository } from '../interfaces/IRideRepository';
import { Ride, RideLocation } from '../../types';
import { RideEvent, RideDiscoveryFilters, GroupRideStatus } from '../../types/groupRide';
import { supabaseClient } from '../../services/supabase/client';
import { executeQuery } from '../../services/supabase/database';
import { RideMapper } from '../mappers/rideMapper';
import { logger } from '../../utils/logger';

export class SupabaseRideRepository implements IRideRepository {
  async getRides(userId: string, limit = 20, offset = 0): Promise<Ride[]> {
    try {
      const rows = await executeQuery<any[]>(async () => {
        const { data, error } = await (supabaseClient.from('rides') as any)
          .select('*')
          .eq('organizer_id', userId)
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);
        if (error) throw error;
        return data || [];
      });

      return (rows || []).map((r: any) => RideMapper.toDomain(r));
    } catch (error) {
      logger.warn('[SupabaseRideRepository] getRides error:', error);
      return [];
    }
  }

  async getRideById(id: string): Promise<Ride | null> {
    try {
      const row = await executeQuery<any>(async () => {
        const { data, error } = await (supabaseClient.from('rides') as any)
          .select('*')
          .eq('id', id)
          .single();
        if (error && error.code === 'PGRST116') return null;
        if (error) throw error;
        return data;
      });

      if (!row) return null;
      return RideMapper.toDomain(row);
    } catch (error) {
      logger.warn(`[SupabaseRideRepository] getRideById error for ${id}:`, error);
      return null;
    }
  }

  async createRide(ride: Partial<Ride>): Promise<Ride> {
    const { data: { user } } = await supabaseClient.auth.getUser();
    const userId = ride.userId || user?.id || '00000000-0000-0000-0000-000000000000';
    const insertPayload = RideMapper.toInsert(userId, ride);

    const row = await executeQuery<any>(async () => {
      const { data: created, error } = await (supabaseClient.from('rides') as any)
        .insert(insertPayload)
        .select()
        .single();
      if (error) throw error;
      return created;
    });

    if (ride.coordinates && ride.coordinates.length > 0) {
      await this.saveRideTelemetry(row.id, ride.coordinates);
    }

    return RideMapper.toDomain(row, ride.motorcycleName);
  }

  async updateRide(id: string, ride: Partial<Ride>): Promise<Ride> {
    const updatePayload = RideMapper.toUpdate(ride);
    const row = await executeQuery<any>(async () => {
      const { data: updated, error } = await (supabaseClient.from('rides') as any)
        .update(updatePayload)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return updated;
    });

    return RideMapper.toDomain(row, ride.motorcycleName);
  }

  async deleteRide(id: string): Promise<void> {
    await executeQuery(async () => {
      const { error } = await (supabaseClient.from('rides') as any)
        .delete()
        .eq('id', id);
      if (error) throw error;
      return null;
    });
  }

  async saveRideTelemetry(rideId: string, locations: RideLocation[]): Promise<void> {
    if (locations.length === 0) return;

    const { data: { user } } = await supabaseClient.auth.getUser();
    const fallbackUserId = user?.id || '00000000-0000-0000-0000-000000000000';

    const inserts = locations.map((loc: any) => ({
      ride_id: rideId,
      user_id: loc.userId || fallbackUserId,
      latitude: loc.latitude,
      longitude: loc.longitude,
      speed: loc.speedKmh ? loc.speedKmh / 3.6 : (loc.speed || 0),
      heading: loc.heading || 0,
      accuracy: loc.accuracy || 0,
      updated_at: typeof loc.timestamp === 'number' ? new Date(loc.timestamp).toISOString() : (loc.timestamp || new Date().toISOString()),
    }));

    const CHUNK_SIZE = 200;
    for (let i = 0; i < inserts.length; i += CHUNK_SIZE) {
      const chunk = inserts.slice(i, i + CHUNK_SIZE);
      await executeQuery(async () => {
        const { error } = await (supabaseClient.from('ride_locations') as any)
          .upsert(chunk, { onConflict: 'ride_id,user_id' });
        if (error) throw error;
        return null;
      });
    }
  }

  async getRideTelemetry(rideId: string): Promise<RideLocation[]> {
    try {
      const rows = await executeQuery<any[]>(async () => {
        const { data, error } = await (supabaseClient.from('ride_locations') as any)
          .select('*')
          .eq('ride_id', rideId)
          .order('updated_at', { ascending: true });
        if (error) throw error;
        return data || [];
      });

      return (rows || []).map((r) => RideMapper.locationToDomain(r));
    } catch (error) {
      logger.warn(`[SupabaseRideRepository] getRideTelemetry error for ${rideId}:`, error);
      return [];
    }
  }

  // =========================================================================
  // GROUP RIDES & EVENT DISCOVERY
  // =========================================================================

  async getUpcomingGroupRides(filters: RideDiscoveryFilters = {}): Promise<RideEvent[]> {
    const { searchQuery, limit = 30, offset = 0 } = filters;

    try {
      let query = (supabaseClient.from('rides') as any)
        .select(`
          *,
          organizer:profiles!rides_organizer_id_fkey(id, full_name, username, avatar_url, city)
        `)
        .in('visibility', ['PUBLIC', 'public'])
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (searchQuery && searchQuery.trim() !== '') {
        const term = `%${searchQuery.trim()}%`;
        query = query.or(`title.ilike.${term},description.ilike.${term},start_location_name.ilike.${term},destination_name.ilike.${term}`);
      }

      const rows = await executeQuery<any[]>(async () => {
        const { data, error } = await query;
        if (error) throw error;
        return data || [];
      });

      if (!rows || rows.length === 0) {
        return [];
      }

      return rows.map((r: any) => this.mapRowToRideEvent(r, r.organizer, 1));
    } catch (error) {
      logger.warn('[SupabaseRideRepository] getUpcomingGroupRides error:', error);
      return [];
    }
  }

  async getGroupRideDetails(rideId: string, currentUserId?: string): Promise<RideEvent | null> {
    try {
      const row = await executeQuery<any>(async () => {
        const { data, error } = await (supabaseClient.from('rides') as any)
          .select(`
            *,
            organizer:profiles!rides_organizer_id_fkey(id, full_name, username, avatar_url, city)
          `)
          .eq('id', rideId)
          .maybeSingle();
        if (error) throw error;
        return data;
      });

      if (!row) return null;

      // Check current user participation
      let userStatus = 'NOT_JOINED';
      let count = 1;
      if (currentUserId) {
        if (row.organizer_id === currentUserId) {
          userStatus = 'ORGANIZER';
        } else {
          try {
            const { data: part } = await (supabaseClient.from('ride_participants') as any)
              .select('status')
              .eq('ride_id', rideId)
              .eq('user_id', currentUserId)
              .maybeSingle();

            if (part) {
              const raw = (part.status || '').toUpperCase();
              userStatus = raw === 'APPROVED' || raw === 'JOINED' ? 'APPROVED' : raw === 'PENDING' ? 'PENDING' : raw;
            }
          } catch {}
        }
      }

      try {
        const { count: approvedCount } = await (supabaseClient.from('ride_participants') as any)
          .select('id', { count: 'exact', head: true })
          .eq('ride_id', rideId)
          .in('status', ['approved', 'APPROVED', 'JOINED']);
        if (approvedCount && approvedCount > 0) count = approvedCount;
      } catch {}

      const rideEvent = this.mapRowToRideEvent(row, row.organizer, count);
      rideEvent.userParticipationStatus = userStatus as any;
      return rideEvent;
    } catch (error) {
      logger.warn(`[SupabaseRideRepository] getGroupRideDetails error for ${rideId}:`, error);
      return null;
    }
  }

  async updateGroupRideStatus(rideId: string, status: GroupRideStatus): Promise<void> {
    try {
      const dbStatus = status.toLowerCase();
      await executeQuery(async () => {
        const { error } = await (supabaseClient.from('rides') as any)
          .update({ status: dbStatus, updated_at: new Date().toISOString() })
          .eq('id', rideId);
        if (error) throw error;
        return null;
      });
    } catch (err) {
      logger.warn(`[SupabaseRideRepository] updateGroupRideStatus warning for ${rideId}:`, err);
    }
  }

  private mapRowToRideEvent(r: any, profile?: any, participantCount: number = 1): RideEvent {
    const startLat = Number(r.start_latitude) || 18.5204;
    const startLng = Number(r.start_longitude) || 73.8567;
    const endLat = Number(r.destination_latitude) || Number(r.end_latitude) || (startLat + 0.05);
    const endLng = Number(r.destination_longitude) || Number(r.end_longitude) || (startLng + 0.05);
    const distanceKm = Number(r.distance_km) || (r.distance_meters ? Math.round(r.distance_meters / 1000) : 0);
    const durationMins = Number(r.estimated_duration) || (r.duration_seconds ? Math.round(r.duration_seconds / 60) : 60);

    const code = r.join_code || r.ride_code || 'RIDEX-7X92K';
    const cleanStatus = (r.status || 'published').toUpperCase();

    const organizerName = profile?.full_name || profile?.username || 'Ride Organizer';

    return {
      id: r.id,
      rideCode: code,
      joinCode: code,
      approvalRequired: r.join_method !== 'OPEN_JOIN',
      organizerId: r.organizer_id || r.user_id || '00000000-0000-0000-0000-000000000000',
      title: r.title || r.name || 'Motorcycle Squad Ride',
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
      scheduledAt: r.ride_date || r.start_time || r.created_at || new Date().toISOString(),
      meetingTime: r.meetup_time || '05:30 AM',
      rideStartTime: r.departure_time || '06:00 AM',
      estimatedDistanceKm: distanceKm,
      estimatedDurationMinutes: durationMins,
      maxParticipants: r.max_riders || null,
      currentParticipantCount: participantCount,
      visibility: (r.visibility ? r.visibility.toUpperCase() : 'PUBLIC') as any,
      status: cleanStatus === 'ACTIVE' || cleanStatus === 'LIVE' ? 'LIVE' : cleanStatus === 'COMPLETED' ? 'COMPLETED' : 'UPCOMING',
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
        stats: {
          totalDistanceKm: 0,
          totalRidesCount: 0,
          totalDurationHours: 0,
          longestRideKm: 0,
          countriesCount: 1,
        },
      },
    };
  }
}

export const supabaseRideRepository = new SupabaseRideRepository();
