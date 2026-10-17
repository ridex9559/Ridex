/**
 * RIDEX — Connect Ride & Real-Time Group Telemetry Domain Models
 * Strict TypeScript types for Checkpoints, Rider Separation Detection,
 * SOS Emergency Assistance, and Squad Announcements.
 */

import { MapCoordinate } from '../services/maps/mapTypes';

export type CheckpointType =
  | 'START'
  | 'BREAKFAST'
  | 'LUNCH'
  | 'COFFEE'
  | 'FOOD'
  | 'FUEL'
  | 'VIEWPOINT'
  | 'SCENIC'
  | 'REST'
  | 'REGROUP'
  | 'CUSTOM'
  | 'STOP'
  | 'DESTINATION';

export interface RideCheckpoint {
  id: string;
  rideId?: string;
  name: string;
  type: CheckpointType;
  latitude: number;
  longitude: number;
  orderIndex: number;
  sequence?: number;
  estimatedStopMinutes: number;
  stopDuration?: number;
  address?: string;
  category?: string;
  distanceFromStartKm?: number;
  source?: string;
  isReached?: boolean;
  reachedAt?: string | null;
  distanceFromUserMeters?: number;
  etaMinutes?: number;
}

export type SosIssueType =
  | 'FLAT_TYRE'
  | 'MECHANICAL'
  | 'OUT_OF_FUEL'
  | 'MEDICAL'
  | 'LOST';

export interface SosAlert {
  id: string;
  sessionId: string;
  rideId: string;
  userId: string;
  userName?: string;
  riderName?: string;
  issueType: SosIssueType;
  latitude: number;
  longitude: number;
  note?: string;
  status: 'ACTIVE' | 'RESOLVED' | 'CANCELLED';
  createdAt: string;
  resolvedAt?: string | null;
}

export type GroupSeparationStatus = 'TOGETHER' | 'SPREAD' | 'SEPARATED';

export type RiderTrackingState =
  | 'CONNECTED'
  | 'TRACKING'
  | 'NEAR_GROUP'
  | 'SEPARATED'
  | 'LOCATION_STALE'
  | 'LOCATION_LOST'
  | 'OFFLINE'
  | 'RIDE_ENDED';

export interface SeparatedRiderInfo {
  userId: string;
  name: string;
  distanceBehindMeters: number;
  distanceBehindKm: number;
  coordinate: MapCoordinate;
  lastUpdated: string;
  trackingState?: RiderTrackingState;
  reference?: 'ME' | 'LEADER' | 'CENTROID';
}

export interface GroupSeparationState {
  status: GroupSeparationStatus;
  maxSpreadMeters: number;
  separatedRiders: SeparatedRiderInfo[];
  leadRiderName?: string;
  leadDistanceMeters?: number;
  tailDistanceMeters?: number;
  activeRidersCount?: number;
  staleRidersCount?: number;
  message?: string;
}

export type AnnouncementType = 'STOP' | 'ROUTE_CHANGE' | 'HAZARD' | 'GENERAL';

export interface RideAnnouncement {
  id: string;
  sessionId: string;
  authorId: string;
  authorName?: string;
  message: string;
  type: AnnouncementType;
  createdAt: string;
}

