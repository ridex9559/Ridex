/**
 * SQLite Local Database Schema & Entity Types for RIDEX
 * Strictly typed interfaces for Local-First persistence
 */

export type SyncStatus = 'LOCAL' | 'PENDING' | 'SYNCING' | 'SYNCED' | 'FAILED';

export type SyncOperationType = 'CREATE' | 'UPDATE' | 'DELETE';

export type SyncEntityType = 'profile' | 'motorcycle' | 'ride' | 'ride_location';

export type SyncQueueStatus = 'PENDING' | 'SYNCING' | 'COMPLETED' | 'FAILED';

export interface LocalProfile {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
  bio: string | null;
  city: string | null;
  country: string | null;
  created_at: string;
  updated_at: string;
  synced_at: string | null;
  sync_status: SyncStatus;
}

export interface LocalMotorcycle {
  id: string;
  user_id: string;
  manufacturer: string;
  model: string;
  year: number;
  displacement_cc: number;
  horsepower: number | null;
  registration_number: string | null;
  odometer_km: number;
  category: string;
  nickname: string | null;
  image_url: string | null;
  is_primary: number; // 0 = false, 1 = true
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  sync_status: SyncStatus;
  synced_at: string | null;
}

export interface LocalRide {
  id: string;
  user_id: string;
  motorcycle_id: string | null;
  name: string;
  start_time: string;
  end_time: string | null;
  distance_meters: number;
  duration_seconds: number;
  average_speed: number;
  max_speed: number;
  elevation_gain: number;
  max_lean_angle: number | null;
  start_latitude: number | null;
  start_longitude: number | null;
  end_latitude: number | null;
  end_longitude: number | null;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'PAUSED';
  visibility: 'PUBLIC' | 'PRIVATE' | 'UNLISTED';
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  sync_status: SyncStatus;
  synced_at: string | null;
  version: number;
}

export interface LocalRideLocation {
  id: string;
  ride_id: string;
  latitude: number;
  longitude: number;
  altitude: number | null;
  speed: number | null;
  accuracy: number | null;
  heading: number | null;
  recorded_at: string;
  created_at: string;
  sync_status: SyncStatus;
}

export interface SyncQueueItem {
  id: string;
  entity_type: SyncEntityType;
  entity_id: string;
  operation: SyncOperationType;
  payload: string; // JSON string
  status: SyncQueueStatus;
  retry_count: number;
  last_error: string | null;
  created_at: string;
  updated_at: string;
  last_attempt_at: string | null;
}

export interface SyncMetadata {
  entity_type: string;
  last_sync_at: string | null;
  last_successful_sync_at: string | null;
  sync_cursor: string | null;
}

export interface AppMetadata {
  key: string;
  value: string;
  updated_at: string;
}

export interface DatabaseQueryResult<T = any> {
  rows: T[];
  rowsAffected: number;
  insertId?: number;
}
