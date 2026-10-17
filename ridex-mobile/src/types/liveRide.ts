/**
 * RIDEX — Live Group Ride & Real-Time Telemetry Domain Models
 * Strict TypeScript types for live sessions, peer rider beacons,
 * throttled broadcast packets, and presence states.
 */

import { UserProfile } from './user';
import { Motorcycle } from './motorcycle';
import { MapCoordinate } from '../services/maps/mapTypes';

export type LiveRideSessionStatus = 'WAITING' | 'LIVE' | 'ENDED';

export type LiveRiderPresenceStatus = 'LIVE' | 'STALE' | 'OFFLINE' | 'LEFT';

export interface LiveRideSession {
  id: string;
  rideId: string;
  status: LiveRideSessionStatus;
  startedAt: string;
  endedAt?: string | null;
  createdAt: string;
}

export interface LiveRiderLocation {
  sessionId?: string;
  userId: string;
  user?: UserProfile;
  motorcycle?: Motorcycle;
  coordinate?: MapCoordinate;
  latitude?: number;
  longitude?: number;
  heading?: number | null;
  speedKmh?: number;
  accuracy?: number | null;
  batteryPercent?: number;
  updatedAt: string | number; // ISO 8601 UTC or timestamp
  presenceStatus: LiveRiderPresenceStatus;
  isCurrentUser?: boolean;
}

export interface LiveLocationPacket {
  sessionId: string;
  userId: string;
  latitude: number;
  longitude: number;
  heading?: number | null;
  speed?: number | null;
  accuracy?: number | null;
  timestamp: number;
}
