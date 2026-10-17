import { Database } from '../../services/supabase/types';
import { Ride, RideLocation } from '../../types';

type RideRow = Database['public']['Tables']['rides']['Row'];
type RideInsert = Database['public']['Tables']['rides']['Insert'];
type RideUpdate = Database['public']['Tables']['rides']['Update'];
type RideLocationRow = Database['public']['Tables']['ride_locations']['Row'];
type RideLocationInsert = Database['public']['Tables']['ride_locations']['Insert'];

export class RideMapper {
  static toDomain(row: RideRow, motorcycleName?: string): Ride {
    return {
      id: row.id,
      userId: row.user_id,
      motorcycleId: row.motorcycle_id,
      motorcycleName: motorcycleName || 'Motorcycle',
      title: row.name,
      name: row.name,
      startTime: row.start_time,
      endTime: row.end_time ?? undefined,
      distanceKm: Number(((Number(row.distance_meters) || 0) / 1000).toFixed(1)) || 0,
      durationSeconds: row.duration_seconds || 0,
      averageSpeedKmh: Number(row.average_speed_kmh) || 0,
      maxSpeedKmh: Number(row.max_speed_kmh) || 0,
      elevationGainMeters: Number(row.elevation_gain_meters) || 0,
      maxLeanAngleDegrees: row.max_lean_angle_degrees ? Number(row.max_lean_angle_degrees) : undefined,
      type: 'SOLO',
      status: (row.status as any) || 'completed',
      isPublic: row.visibility === 'public',
    };
  }

  static toInsert(userId: string, ride: Partial<Ride>): RideInsert {
    const distanceMeters = (ride.distanceKm || 0) * 1000;
    return {
      id: ride.id,
      user_id: userId,
      motorcycle_id: ride.motorcycleId || '00000000-0000-0000-0000-000000000000',
      name: ride.title || ride.name || 'Motorcycle Ride',
      start_time: ride.startTime || new Date().toISOString(),
      end_time: ride.endTime || null,
      distance_meters: distanceMeters,
      duration_seconds: ride.durationSeconds || 0,
      average_speed_kmh: ride.averageSpeedKmh || 0,
      max_speed_kmh: ride.maxSpeedKmh || 0,
      elevation_gain_meters: ride.elevationGainMeters || 0,
      max_lean_angle_degrees: ride.maxLeanAngleDegrees || null,
      status: (ride.status as any) || 'completed',
      visibility: ride.isPublic ? 'public' : 'private',
    };
  }

  static toUpdate(ride: Partial<Ride>): RideUpdate {
    const update: RideUpdate = {};
    if (ride.title !== undefined || ride.name !== undefined) {
      update.name = ride.title || ride.name;
    }
    if (ride.motorcycleId !== undefined) update.motorcycle_id = ride.motorcycleId;
    if (ride.status !== undefined) update.status = ride.status as any;
    if (ride.endTime !== undefined) update.end_time = ride.endTime;
    if (ride.distanceKm !== undefined) update.distance_meters = ride.distanceKm * 1000;
    if (ride.durationSeconds !== undefined) update.duration_seconds = ride.durationSeconds;
    if (ride.averageSpeedKmh !== undefined) update.average_speed_kmh = ride.averageSpeedKmh;
    if (ride.maxSpeedKmh !== undefined) update.max_speed_kmh = ride.maxSpeedKmh;
    if (ride.elevationGainMeters !== undefined) update.elevation_gain_meters = ride.elevationGainMeters;
    if (ride.maxLeanAngleDegrees !== undefined) update.max_lean_angle_degrees = ride.maxLeanAngleDegrees;
    if (ride.isPublic !== undefined) update.visibility = ride.isPublic ? 'public' : 'private';
    return update;
  }

  static locationToDomain(row: RideLocationRow): RideLocation {
    return {
      latitude: Number(row.latitude),
      longitude: Number(row.longitude),
      timestamp: new Date(row.recorded_at).getTime(),
      speedKmh: Number(row.speed_kmh) || 0,
      speed: Number(row.speed_kmh) || 0,
      altitudeMeters: Number(row.altitude) || 0,
      altitude: Number(row.altitude) || 0,
      accuracyMeters: row.accuracy_meters ? Number(row.accuracy_meters) : undefined,
      accuracy: row.accuracy_meters ? Number(row.accuracy_meters) : undefined,
      headingDegrees: row.heading_degrees ? Number(row.heading_degrees) : undefined,
      heading: row.heading_degrees ? Number(row.heading_degrees) : undefined,
    };
  }

  static locationToInsert(rideId: string, loc: RideLocation): RideLocationInsert {
    return {
      ride_id: rideId,
      latitude: loc.latitude,
      longitude: loc.longitude,
      altitude: loc.altitudeMeters ?? loc.altitude ?? 0,
      speed_kmh: loc.speedKmh ?? loc.speed ?? 0,
      heading_degrees: loc.headingDegrees ?? loc.heading ?? null,
      accuracy_meters: loc.accuracyMeters ?? loc.accuracy ?? null,
      recorded_at: new Date(loc.timestamp).toISOString(),
    };
  }
}
