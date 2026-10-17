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

export interface CommunityPost {
  id: string;
  userId: string;
  rideId?: string;
  motorcycleId?: string;
  caption: string;
  locationName?: string;
  visibility: 'public' | 'followers' | 'private';
  likesCount: number;
  commentsCount: number;
  isLikedByMe?: boolean;
  user?: UserProfile;
  rideTitle?: string;
  createdAt: string;
}

export interface PostComment {
  id: string;
  postId: string;
  userId: string;
  content: string;
  user?: UserProfile;
  createdAt: string;
}

export interface RiderGroup {
  id: string;
  name: string;
  description: string;
  region?: string;
  badge?: string;
  coverImageUrl?: string;
  avatarUrl?: string;
  createdBy: string;
  privacy: 'public' | 'private';
  membersCount: number;
  isJoinedByMe?: boolean;
  myRole?: 'owner' | 'admin' | 'member';
  createdAt: string;
}

export interface Achievement {
  id: string;
  code: string;
  title: string;
  description: string;
  icon: string;
  category: 'milestone' | 'speed' | 'lean' | 'elevation' | 'distance' | 'social';
  requirementValue: number;
  unit: string;
  isEarned: boolean;
  earnedAt?: string;
  progress: number;
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: 'RIDE_REQUEST' | 'RIDE_APPROVAL' | 'SOS_ALERT' | 'SEPARATION_WARNING' | 'COMMUNITY' | 'GENERAL';
  isRead: boolean;
  linkUrl?: string;
  createdAt: string;
}

export interface VoiceChannelState {
  id: string;
  rideId: string;
  name: string;
  state: 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'TRANSMITTING';
  activeSpeaker: {
    userId: string;
    userName: string;
  } | null;
  participantsCount: number;
  isMuted: boolean;
  micPermission: 'prompt' | 'granted' | 'denied' | 'unsupported';
}

export interface RouteManeuver {
  instruction: string;
  type: string;
  modifier?: string;
  distanceMeters: number;
  durationSeconds: number;
  location: [number, number]; // [lat, lng]
}

