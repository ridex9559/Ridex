/**
 * Authentication Domain Types and Interfaces for RIDEX
 */

import { User, UserProfile } from '@/types/user';

export interface AuthUser {
  id: string;
  email: string;
  phone?: string;
  createdAt: string;
  emailConfirmedAt?: string;
  lastSignInAt?: string;
  userMetadata?: Record<string, any>;
}

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

export interface SignupCredentials {
  name: string;
  username: string;
  email: string;
  password: string;
  confirmPassword?: string;
  primaryBike?: string;
}

export interface ResetPasswordParams {
  email: string;
}

export interface UpdatePasswordParams {
  newPassword: string;
  confirmPassword: string;
}

export interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  session: AuthSession | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
}

export type AuthChangeEvent =
  | 'INITIAL_SESSION'
  | 'SIGNED_IN'
  | 'SIGNED_OUT'
  | 'TOKEN_REFRESHED'
  | 'USER_UPDATED'
  | 'PASSWORD_RECOVERY';
