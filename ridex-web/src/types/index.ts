/**
 * RIDEX Web — Unified Type Definitions
 * Authoritative parity with PostgreSQL / Supabase schemas and domain models.
 */

export interface UserProfile {
  id: string;
  fullName: string;
  username: string;
  email: string;
  avatarUrl?: string;
  city?: string;
  state?: string;
  bio?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Motorcycle {
  id: string;
  userId: string;
  manufacturer: string;
  model: string;
  year: number;
  color: string;
  engineCc: number;
  displacementCc?: number;
  registrationNumber?: string;
  fuelTankCapacityL: number;
  avgMileageKmpl: number;
  isPrimary: boolean;
  category?: string;
  variant?: string;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export type RideStatus = 'draft' | 'published' | 'upcoming' | 'active' | 'completed' | 'cancelled';
export type CheckpointType = 'START' | 'BREAKFAST' | 'FUEL' | 'VIEWPOINT' | 'REGROUP' | 'DESTINATION';
export type ParticipantRole = 'organizer' | 'leader' | 'road_captain' | 'sweeper' | 'rider';
export type ParticipantApprovalStatus = 'pending' | 'approved' | 'rejected' | 'left';

export interface MapCoordinate {
  latitude: number;
  longitude: number;
  name?: string;
}

export interface RideCheckpoint {
  id: string;
  rideId: string;
  name: string;
  type: CheckpointType;
  latitude: number;
  longitude: number;
  orderIndex: number;
  estimatedStopMinutes: number;
  isReached?: boolean;
  reachedAt?: string | null;
  address?: string;
}

export interface RideEvent {
  id: string;
  organizerId: string;
  title: string;
  description: string;
  joinCode: string;
  rideCode: string;
  status: RideStatus;
  visibility: 'public' | 'group_only' | 'private';
  joinMethod: 'REQUEST_APPROVAL' | 'OPEN_JOIN';
  startLocationName: string;
  startLatitude: number;
  startLongitude: number;
  destinationName: string;
  destinationLatitude: number;
  destinationLongitude: number;
  distanceKm: number;
  estimatedDuration: number;
  rideDate: string;
  meetupTime: string;
  departureTime: string;
  maxRiders: number;
  rideType: string;
  difficulty: 'EASY' | 'MODERATE' | 'ADVANCED' | 'EXPERT';
  organizer?: UserProfile;
  checkpoints?: RideCheckpoint[];
  participants?: RideParticipant[];
  currentParticipantCount?: number;
  userParticipationStatus?: ParticipantApprovalStatus | 'not_joined';
  createdAt?: string;
  updatedAt?: string;
}

export interface RideParticipant {
  id: string;
  rideId: string;
  userId: string;
  role: ParticipantRole;
  status: ParticipantApprovalStatus;
  joinedAt: string;
  approvedAt?: string | null;
  user?: UserProfile;
}

export interface LiveRiderLocation {
  userId: string;
  riderName: string;
  motorcycleName?: string;
  avatarUrl?: string;
  role?: ParticipantRole;
  latitude: number;
  longitude: number;
  heading?: number;
  speed?: number;
  accuracy?: number;
  updatedAt: string;
}

export type GroupSeparationStatus = 'TOGETHER' | 'SPREAD' | 'SEPARATED' | 'OFFLINE';

export interface GroupSeparationState {
  status: GroupSeparationStatus;
  maxSpreadMeters: number;
  leadDistanceMeters: number;
  activeRidersCount: number;
  staleRidersCount: number;
  message: string;
  separatedRiders: {
    userId: string;
    riderName: string;
    distanceMeters: number;
  }[];
}

export interface SosAlert {
  id: string;
  rideId: string;
  userId: string;
  riderName: string;
  issueType: 'FLAT_TYRE' | 'MECHANICAL' | 'OUT_OF_FUEL' | 'MEDICAL' | 'LOST';
  latitude: number;
  longitude: number;
  note?: string;
  status: 'ACTIVE' | 'RESOLVED';
  createdAt: string;
}
