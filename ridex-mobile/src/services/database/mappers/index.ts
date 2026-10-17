import { LocalProfile, LocalMotorcycle, LocalRide, LocalRideLocation, SyncStatus } from '../databaseTypes';
import { User } from '@/types/user';
import { Motorcycle, CreateMotorcycleDto } from '@/types/motorcycle';
import { Ride, RideLocation } from '@/types/ride';
import { generateUUID } from '@/utils/uuid';

// ==========================================
// PROFILE MAPPERS
// ==========================================

export function mapLocalProfileToDomain(local: LocalProfile, email: string = ''): User {
  return {
    id: local.id,
    name: local.full_name,
    username: local.username,
    email: email || `${local.username.toLowerCase()}@ridex.app`,
    avatarUrl: local.avatar_url || undefined,
    avatar: local.avatar_url || undefined,
    bio: local.bio || undefined,
    location: local.city ? (local.country ? `${local.city}, ${local.country}` : local.city) : undefined,
    role: 'Lead Road Captain',
    createdAt: local.created_at,
  };
}

export function mapDomainProfileToLocal(user: User, syncStatus: SyncStatus = 'LOCAL'): LocalProfile {
  return {
    id: user.id,
    username: user.username,
    full_name: user.name,
    avatar_url: user.avatarUrl || user.avatar || null,
    bio: user.bio || null,
    city: user.location ? user.location.split(',')[0].trim() : null,
    country: user.location && user.location.includes(',') ? user.location.split(',')[1].trim() : null,
    created_at: user.createdAt || new Date().toISOString(),
    updated_at: new Date().toISOString(),
    synced_at: syncStatus === 'SYNCED' ? new Date().toISOString() : null,
    sync_status: syncStatus,
  };
}

export function mapCloudProfileToLocal(cloud: any, syncStatus: SyncStatus = 'SYNCED'): LocalProfile {
  return {
    id: cloud.id,
    username: cloud.username || cloud.callsign || 'rider',
    full_name: cloud.full_name || cloud.name || 'RIDEX Rider',
    avatar_url: cloud.avatar_url || null,
    bio: cloud.bio || null,
    city: cloud.city || null,
    country: cloud.country || null,
    created_at: cloud.created_at || new Date().toISOString(),
    updated_at: cloud.updated_at || new Date().toISOString(),
    synced_at: new Date().toISOString(),
    sync_status: syncStatus,
  };
}

// ==========================================
// MOTORCYCLE MAPPERS
// ==========================================

export function mapLocalMotorcycleToDomain(local: LocalMotorcycle): Motorcycle {
  return {
    id: local.id,
    userId: local.user_id,
    make: local.manufacturer,
    manufacturer: local.manufacturer,
    model: local.model,
    year: local.year,
    displacementCc: local.displacement_cc,
    mileageKm: local.odometer_km,
    odometer: local.odometer_km,
    registrationNumber: local.registration_number || undefined,
    horsepower: local.horsepower || undefined,
    category: (local.category as any) || 'ADVENTURE',
    nickname: local.nickname || undefined,
    imageUrl: local.image_url || undefined,
    image: local.image_url || undefined,
    isPrimary: local.is_primary === 1,
    createdAt: local.created_at,
    engineHealth: 'Optimal',
    serviceDueDays: 45,
    tpmsFrontPsi: 33,
    tpmsRearPsi: 38,
    insuranceStatus: 'Active',
  };
}

export function mapDomainMotorcycleToLocal(
  moto: Partial<Motorcycle> & Partial<CreateMotorcycleDto>,
  userId: string,
  syncStatus: SyncStatus = 'LOCAL'
): LocalMotorcycle {
  return {
    id: moto.id || generateUUID(),
    user_id: userId,
    manufacturer: moto.make || moto.manufacturer || 'Unknown',
    model: moto.model || 'Unknown',
    year: moto.year || new Date().getFullYear(),
    displacement_cc: moto.displacementCc || 500,
    horsepower: moto.horsepower || null,
    registration_number: moto.registrationNumber || null,
    odometer_km: moto.mileageKm || moto.odometer || 0,
    category: moto.category || 'ADVENTURE',
    nickname: moto.nickname || null,
    image_url: moto.imageUrl || moto.image || null,
    is_primary: moto.isPrimary ? 1 : 0,
    created_at: moto.createdAt || new Date().toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null,
    sync_status: syncStatus,
    synced_at: syncStatus === 'SYNCED' ? new Date().toISOString() : null,
  };
}

export function mapCloudMotorcycleToLocal(cloud: any, syncStatus: SyncStatus = 'SYNCED'): LocalMotorcycle {
  return {
    id: cloud.id,
    user_id: cloud.user_id,
    manufacturer: cloud.manufacturer || cloud.make || '',
    model: cloud.model || '',
    year: cloud.year || new Date().getFullYear(),
    displacement_cc: cloud.displacement_cc || cloud.displacementCc || 500,
    horsepower: cloud.horsepower || null,
    registration_number: cloud.registration_number || cloud.license_plate || null,
    odometer_km: Number(cloud.odometer_km || cloud.odometer || 0),
    category: cloud.category || 'ADVENTURE',
    nickname: cloud.nickname || null,
    image_url: cloud.image_url || cloud.image || null,
    is_primary: cloud.is_primary ? 1 : 0,
    created_at: cloud.created_at || new Date().toISOString(),
    updated_at: cloud.updated_at || new Date().toISOString(),
    deleted_at: cloud.deleted_at || null,
    sync_status: syncStatus,
    synced_at: new Date().toISOString(),
  };
}

export function mapLocalMotorcycleToCloud(local: LocalMotorcycle): any {
  const payload: any = {
    id: local.id,
    user_id: local.user_id,
    manufacturer: local.manufacturer,
    model: local.model,
    year: local.year,
    displacement_cc: local.displacement_cc,
    horsepower: local.horsepower,
    registration_number: local.registration_number,
    odometer_km: local.odometer_km,
    category: local.category,
    nickname: local.nickname,
    image_url: local.image_url,
    is_primary: local.is_primary === 1,
    created_at: local.created_at,
    updated_at: local.updated_at,
  };
  return payload;
}

// ==========================================
// RIDE MAPPERS
// ==========================================

export function mapLocalRideToDomain(local: LocalRide, locations: LocalRideLocation[] = []): Ride {
  const coordinates: RideLocation[] = locations.map((loc) => ({
    latitude: loc.latitude,
    longitude: loc.longitude,
    timestamp: new Date(loc.recorded_at).getTime(),
    speedKmh: loc.speed ? loc.speed * 3.6 : 0,
    speed: loc.speed || 0,
    altitudeMeters: loc.altitude || 0,
    altitude: loc.altitude || 0,
    accuracyMeters: loc.accuracy || 5,
    accuracy: loc.accuracy || 5,
    headingDegrees: loc.heading || 0,
    heading: loc.heading || 0,
  }));

  const routeCoordinates: [number, number][] = locations.map((loc) => [loc.latitude, loc.longitude]);

  return {
    id: local.id,
    userId: local.user_id,
    motorcycleId: local.motorcycle_id || 'unassigned',
    title: local.name,
    name: local.name,
    startTime: local.start_time,
    endTime: local.end_time || undefined,
    distanceKm: parseFloat((local.distance_meters / 1000).toFixed(2)),
    durationSeconds: local.duration_seconds,
    averageSpeedKmh: parseFloat(local.average_speed.toFixed(1)),
    maxSpeedKmh: parseFloat(local.max_speed.toFixed(1)),
    elevationGainMeters: Math.round(local.elevation_gain),
    maxLeanAngleDegrees: local.max_lean_angle || undefined,
    status: local.status === 'IN_PROGRESS' ? 'active' : local.status === 'PAUSED' ? 'paused' : 'completed',
    isPublic: local.visibility === 'PUBLIC',
    coordinates,
    routeCoordinates,
  };
}

export function mapDomainRideToLocal(
  ride: Partial<Ride>,
  userId: string,
  syncStatus: SyncStatus = 'LOCAL'
): LocalRide {
  const distanceMeters = (ride.distanceKm || 0) * 1000;
  return {
    id: ride.id || generateUUID(),
    user_id: userId,
    motorcycle_id: ride.motorcycleId || null,
    name: ride.title || ride.name || 'Morning Ride',
    start_time: ride.startTime || new Date().toISOString(),
    end_time: ride.endTime || null,
    distance_meters: distanceMeters,
    duration_seconds: ride.durationSeconds || 0,
    average_speed: ride.averageSpeedKmh || 0,
    max_speed: ride.maxSpeedKmh || 0,
    elevation_gain: ride.elevationGainMeters || 0,
    max_lean_angle: ride.maxLeanAngleDegrees || null,
    start_latitude: ride.routeCoordinates && ride.routeCoordinates.length > 0 ? ride.routeCoordinates[0][0] : null,
    start_longitude: ride.routeCoordinates && ride.routeCoordinates.length > 0 ? ride.routeCoordinates[0][1] : null,
    end_latitude:
      ride.routeCoordinates && ride.routeCoordinates.length > 0
        ? ride.routeCoordinates[ride.routeCoordinates.length - 1][0]
        : null,
    end_longitude:
      ride.routeCoordinates && ride.routeCoordinates.length > 0
        ? ride.routeCoordinates[ride.routeCoordinates.length - 1][1]
        : null,
    status: ride.status === 'active' ? 'IN_PROGRESS' : ride.status === 'paused' ? 'PAUSED' : 'COMPLETED',
    visibility: ride.isPublic ? 'PUBLIC' : 'PRIVATE',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null,
    sync_status: syncStatus,
    synced_at: syncStatus === 'SYNCED' ? new Date().toISOString() : null,
    version: 1,
  };
}

export function mapCloudRideToLocal(cloud: any, syncStatus: SyncStatus = 'SYNCED'): LocalRide {
  return {
    id: cloud.id,
    user_id: cloud.user_id,
    motorcycle_id: cloud.motorcycle_id || null,
    name: cloud.name || cloud.title || 'Ride',
    start_time: cloud.start_time || cloud.startTime || new Date().toISOString(),
    end_time: cloud.end_time || cloud.endTime || null,
    distance_meters: cloud.distance_meters !== undefined ? cloud.distance_meters : (cloud.distance_km || 0) * 1000,
    duration_seconds: cloud.duration_seconds || 0,
    average_speed: cloud.average_speed_kmh !== undefined ? cloud.average_speed_kmh : (cloud.average_speed || 0),
    max_speed: cloud.max_speed_kmh !== undefined ? cloud.max_speed_kmh : (cloud.max_speed || 0),
    elevation_gain: cloud.elevation_gain_meters !== undefined ? cloud.elevation_gain_meters : (cloud.elevation_gain || 0),
    max_lean_angle: cloud.max_lean_angle_degrees !== undefined ? cloud.max_lean_angle_degrees : (cloud.max_lean_angle || null),
    start_latitude: cloud.start_latitude || null,
    start_longitude: cloud.start_longitude || null,
    end_latitude: cloud.end_latitude || null,
    end_longitude: cloud.end_longitude || null,
    status: cloud.status === 'in_progress' || cloud.status === 'active' ? 'IN_PROGRESS' : cloud.status === 'paused' ? 'PAUSED' : 'COMPLETED',
    visibility: cloud.visibility ? cloud.visibility.toLowerCase() : 'public',
    created_at: cloud.created_at || new Date().toISOString(),
    updated_at: cloud.updated_at || new Date().toISOString(),
    deleted_at: cloud.deleted_at || null,
    sync_status: syncStatus,
    synced_at: new Date().toISOString(),
    version: cloud.version || 1,
  };
}

export function mapLocalRideToCloud(local: LocalRide): any {
  return {
    id: local.id,
    user_id: local.user_id,
    motorcycle_id: local.motorcycle_id,
    name: local.name,
    start_time: local.start_time,
    end_time: local.end_time,
    distance_meters: local.distance_meters,
    duration_seconds: local.duration_seconds,
    average_speed_kmh: local.average_speed,
    max_speed_kmh: local.max_speed,
    elevation_gain_meters: local.elevation_gain,
    max_lean_angle_degrees: local.max_lean_angle,
    start_latitude: local.start_latitude,
    start_longitude: local.start_longitude,
    end_latitude: local.end_latitude,
    end_longitude: local.end_longitude,
    status: local.status === 'IN_PROGRESS' ? 'active' : local.status === 'COMPLETED' ? 'completed' : 'draft',
    visibility: local.visibility ? local.visibility.toLowerCase() : 'public',
    created_at: local.created_at,
    updated_at: local.updated_at,
  };
}

// ==========================================
// RIDE LOCATION MAPPERS
// ==========================================

export function mapLocalRideLocationToDomain(loc: LocalRideLocation): RideLocation {
  return {
    latitude: loc.latitude,
    longitude: loc.longitude,
    timestamp: new Date(loc.recorded_at).getTime(),
    speedKmh: loc.speed ? loc.speed * 3.6 : 0,
    speed: loc.speed || 0,
    altitudeMeters: loc.altitude || 0,
    altitude: loc.altitude || 0,
    accuracyMeters: loc.accuracy || 5,
    accuracy: loc.accuracy || 5,
    headingDegrees: loc.heading || 0,
    heading: loc.heading || 0,
  };
}

export function mapDomainRideLocationToLocal(
  loc: RideLocation,
  rideId: string,
  syncStatus: SyncStatus = 'LOCAL'
): LocalRideLocation {
  return {
    id: generateUUID(),
    ride_id: rideId,
    latitude: loc.latitude,
    longitude: loc.longitude,
    altitude: loc.altitudeMeters || loc.altitude || null,
    speed: loc.speed !== undefined ? loc.speed : loc.speedKmh ? loc.speedKmh / 3.6 : null,
    accuracy: loc.accuracyMeters || loc.accuracy || null,
    heading: loc.headingDegrees || loc.heading || null,
    recorded_at: new Date(loc.timestamp || Date.now()).toISOString(),
    created_at: new Date().toISOString(),
    sync_status: syncStatus,
  };
}
