/**
 * RIDEX V2 — Group Ride, Participant, Checkpoints & Live Session Domain Models
 */

import { UserProfile } from './user';
import { Motorcycle } from './motorcycle';

export type RideCategory =
  | 'WEEKEND'
  | 'TOURING'
  | 'ADVENTURE'
  | 'HIGHWAY'
  | 'MOUNTAIN'
  | 'MOUNTAIN_PASS'
  | 'TRACK'
  | 'OFF_ROAD'
  | 'CASUAL'
  | 'COMMUNITY';

export type RideDifficulty =
  | 'EASY'
  | 'MODERATE'
  | 'BEGINNER'
  | 'INTERMEDIATE'
  | 'ADVANCED'
  | 'EXPERT';

export type RideVisibility = 'PUBLIC' | 'GROUP_ONLY' | 'PRIVATE';

export type GroupRideStatus =
  | 'DRAFT'
  | 'PUBLISHED'
  | 'UPCOMING'
  | 'STARTING'
  | 'LIVE'
  | 'ACTIVE'
  | 'PAUSED'
  | 'COMPLETED'
  | 'CANCELLED';

export type ParticipantRole =
  | 'ORGANIZER'
  | 'LEADER'
  | 'RIDER'
  | 'ROAD_CAPTAIN'
  | 'SWEEPER'
  | 'PARTICIPANT';

export type ParticipantApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'REMOVED' | 'LEFT';

export type LiveSessionStatus = 'NOT_STARTED' | 'LIVE' | 'PAUSED' | 'OFFLINE' | 'ENDED';

export type GroupClusterStatus = 'GROUP_TOGETHER' | 'GROUP_SPREADING' | 'RIDER_SEPARATED';

export interface Checkpoint {
  id: string;
  name: string;
  type: 'BREAKFAST' | 'FUEL' | 'VIEWPOINT' | 'REGROUP' | 'DESTINATION' | 'STOP';
  latitude: number;
  longitude: number;
  address?: string;
  order: number;
}

export interface LocationAnchor {
  name: string;
  latitude: number;
  longitude: number;
  address?: string;
}

export interface RideEvent {
  id: string;
  rideCode: string; // e.g. RIDEX-7X92K
  joinCode?: string; // alias
  title: string;
  name?: string;
  description?: string;
  category: RideCategory;
  difficulty?: RideDifficulty;
  organizerId: string;
  organizer?: UserProfile;
  groupId?: string;
  groupName?: string;
  motorcycleId?: string;
  motorcycle?: Motorcycle;
  startLocation: LocationAnchor;
  destination: LocationAnchor;
  checkpoints?: Checkpoint[];
  scheduledAt: string; // ISO string
  meetingTime?: string; // e.g. '05:30 AM'
  rideStartTime?: string; // e.g. '06:00 AM'
  estimatedDistanceKm: number;
  estimatedDurationMinutes: number;
  maxParticipants?: number | null; // null = unlimited
  currentParticipantCount: number;
  visibility: RideVisibility;
  approvalRequired: boolean;
  assignedLeaders?: string[]; // leader user IDs
  leaders?: UserProfile[];
  status: GroupRideStatus;
  createdAt: string;
  updatedAt: string;
  userParticipationStatus?: ParticipantApprovalStatus | 'NOT_JOINED' | 'ORGANIZER';
  userRole?: ParticipantRole;
}

export interface RideParticipant {
  id: string;
  rideId: string;
  userId: string;
  user?: UserProfile;
  motorcycleId?: string;
  motorcycle?: Motorcycle;
  role: ParticipantRole;
  approvalStatus: ParticipantApprovalStatus;
  status?: string;
  liveStatus?: LiveSessionStatus;
  joinedAt: string;
  approvedAt?: string;
  updatedAt?: string;
}

export interface ActiveRideSession {
  id: string;
  rideId: string;
  userId: string;
  user?: UserProfile;
  bikeId?: string;
  bikeName?: string;
  status: LiveSessionStatus;
  startedAt?: string;
  endedAt?: string;
  lastLocation?: {
    latitude: number;
    longitude: number;
    altitude?: number;
    speedKmh?: number;
    heading?: number;
    timestamp: number;
  };
  distanceFromLeadKm?: number;
  isSeparated?: boolean;
}

export interface RideDraft {
  title: string;
  description?: string;
  category: RideCategory;
  difficulty?: RideDifficulty;
  startLocation: LocationAnchor | null;
  destination: LocationAnchor | null;
  checkpoints: Checkpoint[];
  scheduledDate: Date;
  scheduledTime?: string;
  meetingTime?: string; // e.g. '05:30'
  rideStartTime?: string; // e.g. '06:00'
  maxParticipants: number | null;
  visibility: RideVisibility;
  approvalRequired?: boolean;
  assignedLeaders?: string[];
  motorcycleId?: string;
  groupId?: string;
}

export interface CreateRideFormErrors {
  title?: string;
  startLocation?: string;
  destination?: string;
  scheduledDate?: string;
  scheduledTime?: string;
  general?: string;
}

export interface RideDiscoveryFilters {
  searchQuery?: string;
  category?: RideCategory | 'ALL';
  difficulty?: RideDifficulty | 'ALL';
  city?: string;
  dateFilter?: 'ALL' | 'TODAY' | 'TOMORROW' | 'THIS_WEEKEND' | 'THIS_WEEK';
  tab?: 'ALL' | 'MY_RIDES' | 'GROUP_RIDES';
  limit?: number;
  offset?: number;
}
