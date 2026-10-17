/**
 * RIDEX V2 — Rider User and Profile Domain Models
 */

export type RidingExperienceLevel = 'BEGINNER' | 'INTERMEDIATE' | 'EXPERIENCED';

export type RidingInterest =
  | 'TOURING'
  | 'ADVENTURE'
  | 'WEEKEND'
  | 'HIGHWAY'
  | 'MOUNTAIN'
  | 'OFF_ROAD';

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
  isPrimary?: boolean;
}

export interface UserStatistics {
  totalDistanceKm?: number;
  totalRidesCount?: number;
  totalRides?: number;
  totalDurationSeconds?: number;
  totalDurationHours?: number;
  maxSpeedKmh?: number;
  elevationGainMeters?: number;
  maxLeanAngleDegrees?: number;
  routesCreatedCount?: number;
  longestRideKm?: number;
  countriesCount?: number;
  followingCount?: number;
  followersCount?: number;
  currentStreakDays?: number;
}

export interface User {
  id: string;
  name: string;
  fullName?: string;
  full_name?: string;
  username: string;
  handle?: string;
  email: string;
  phoneNumber?: string;
  phone?: string;
  avatarUrl?: string;
  avatar_url?: string;
  avatar?: string;
  bio?: string;
  callsign?: string;
  city?: string;
  state?: string;
  country?: string;
  location?: string;
  ridingExperience?: RidingExperienceLevel;
  ridingInterests?: RidingInterest[];
  ridingExperienceYears?: number;
  ridingLevel?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'PRO';
  emergencyContacts?: EmergencyContact[];
  role?: string;
  profileSetupCompleted?: boolean;
  createdAt: string;
  stats?: UserStatistics;
  statistics?: UserStatistics;
}

export type UserProfile = User;

export interface AuthSession {
  user: User;
  token: string;
  refreshToken?: string;
  expiresAt?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  primaryBike?: string;
}
