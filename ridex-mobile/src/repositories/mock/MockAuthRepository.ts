/**
 * Mock Implementation of IAuthRepository for Testing & Offline Mode
 */

import { IAuthRepository } from '../interfaces/IAuthRepository';
import { AuthSession, LoginCredentials, SignupCredentials, UpdatePasswordParams } from '@/services/auth/authTypes';
import { User } from '@/types/user';
import { AppAuthError, AuthErrorCode } from '@/services/auth/authErrors';

const MOCK_MARCUS: User = {
  id: '00000000-0000-0000-0000-000000000001',
  name: 'Marcus Vance',
  username: 'marcus_vance',
  email: 'marcus@ridex.app',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80',
  bio: 'Adventure & sport tourer enthusiast. 50+ mountain passes conquered.',
  location: 'Munich, Germany',
  role: 'Lead Road Captain',
  createdAt: '2026-01-01T00:00:00.000Z',
  statistics: {
    totalRides: 48,
    totalDistanceKm: 14820.5,
    longestRideKm: 680.0,
    totalDurationSeconds: 432000,
    followersCount: 1240,
    followingCount: 310,
    currentStreakDays: 14,
    maxSpeedKmh: 198.5,
    elevationGainMeters: 45200,
    maxLeanAngleDegrees: 48.5,
  },
};

export class MockAuthRepository implements IAuthRepository {
  private users: Map<string, User> = new Map([
    [MOCK_MARCUS.email.toLowerCase(), MOCK_MARCUS],
    [MOCK_MARCUS.username.toLowerCase(), MOCK_MARCUS],
  ]);

  private currentUser: User | null = null;

  async signIn({ email, password }: LoginCredentials): Promise<AuthSession> {
    const input = email.trim().toLowerCase();

    if (!input || !password) {
      throw new AppAuthError(AuthErrorCode.INVALID_CREDENTIALS, 'Please enter email/callsign and password.');
    }

    if (password.length < 6) {
      throw new AppAuthError(AuthErrorCode.INVALID_CREDENTIALS, 'Password must be at least 6 characters.');
    }

    // Look up registered user by email or username
    let user = this.users.get(input);

    if (!user) {
      // Check if input is a username
      for (const u of this.users.values()) {
        if (u.username.toLowerCase() === input || u.email.toLowerCase() === input) {
          user = u;
          break;
        }
      }
    }

    if (!user) {
      // New user auto-registration in mock mode
      const isEmail = input.includes('@');
      const resolvedName = isEmail ? input.split('@')[0] : input;
      const resolvedUsername = isEmail ? input.split('@')[0] : input;
      const resolvedEmail = isEmail ? input : `${input}@gmail.com`;

      user = {
        id: `user-${Date.now()}`,
        name: resolvedName,
        username: resolvedUsername,
        email: resolvedEmail,
        role: 'Rider',
        createdAt: new Date().toISOString(),
        statistics: {
          totalRides: 0,
          totalDistanceKm: 0,
          longestRideKm: 0,
          totalDurationSeconds: 0,
          followersCount: 0,
          followingCount: 0,
          currentStreakDays: 0,
          maxSpeedKmh: 0,
          elevationGainMeters: 0,
          maxLeanAngleDegrees: 0,
        },
      };

      if (user) {
        this.users.set(user.email.toLowerCase(), user);
        this.users.set(user.username.toLowerCase(), user);
      }
    }

    const finalUser = user as User;
    this.currentUser = finalUser;

    return {
      user: finalUser,
      token: `mock-jwt-token-${finalUser.id}`,
      refreshToken: `mock-refresh-token-${finalUser.id}`,
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
    };
  }

  async signUp(credentials: SignupCredentials): Promise<AuthSession> {
    const cleanEmail = credentials.email.trim().toLowerCase();
    const cleanUsername = credentials.username.trim().toLowerCase();
    const cleanName = credentials.name.trim();

    const newUser: User = {
      id: `user-${Date.now()}`,
      name: cleanName,
      username: cleanUsername,
      email: cleanEmail,
      role: 'Rider',
      bio: 'Passionate motorcycle adventure rider.',
      location: 'Location not set',
      createdAt: new Date().toISOString(),
      statistics: {
        totalRides: 0,
        totalDistanceKm: 0,
        longestRideKm: 0,
        totalDurationSeconds: 0,
        followersCount: 0,
        followingCount: 0,
        currentStreakDays: 0,
        maxSpeedKmh: 0,
        elevationGainMeters: 0,
        maxLeanAngleDegrees: 0,
      },
    };

    this.users.set(cleanEmail, newUser);
    this.users.set(cleanUsername, newUser);
    this.currentUser = newUser;

    // If primary bike provided, auto-create in mock motorcycle repo
    if (credentials.primaryBike && credentials.primaryBike.trim().length > 0) {
      try {
        const { mockMotorcycleRepository } = require('./MockMotorcycleRepository');
        const bikeStr = credentials.primaryBike.trim();
        const parts = bikeStr.split(' ');
        const make = parts.length > 1 ? parts[0] : 'Motorcycle';
        const model = parts.length > 1 ? parts.slice(1).join(' ') : bikeStr;

        await mockMotorcycleRepository.createMotorcycle(newUser.id, {
          make,
          model,
          year: new Date().getFullYear(),
          displacementCc: 650,
          mileageKm: 0,
          category: 'ADVENTURE',
          isPrimary: true,
          nickname: bikeStr,
        });
      } catch (e) {
        // non-blocking
      }
    }

    return {
      user: this.currentUser,
      token: `mock-jwt-token-${newUser.id}`,
      refreshToken: `mock-refresh-token-${newUser.id}`,
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
    };
  }

  async signOut(): Promise<void> {
    this.currentUser = null;
  }

  async getCurrentSession(): Promise<AuthSession | null> {
    if (!this.currentUser) return null;
    return {
      user: this.currentUser,
      token: `mock-jwt-token-${this.currentUser.id}`,
      refreshToken: `mock-refresh-token-${this.currentUser.id}`,
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
    };
  }

  async getCurrentUser(): Promise<User | null> {
    return this.currentUser;
  }

  async resetPasswordForEmail(email: string): Promise<void> {
    if (!email || !email.includes('@')) {
      throw new AppAuthError(AuthErrorCode.INVALID_EMAIL, 'Invalid email address.');
    }
  }

  async updatePassword(params: UpdatePasswordParams): Promise<void> {
    if (!params.newPassword || params.newPassword.length < 6) {
      throw new AppAuthError(AuthErrorCode.WEAK_PASSWORD, 'Password must be at least 6 characters.');
    }
  }

  async resendVerificationEmail(_email: string): Promise<void> {}

  async ensureProfileExists(userId: string, defaults: { name: string; username: string; email: string }): Promise<User> {
    const existing = this.users.get(defaults.email.toLowerCase()) || this.users.get(defaults.username.toLowerCase());
    if (existing) return existing;

    const user: User = {
      id: userId,
      name: defaults.name,
      username: defaults.username,
      email: defaults.email,
      createdAt: new Date().toISOString(),
      statistics: {
        totalRides: 0,
        totalDistanceKm: 0,
        longestRideKm: 0,
        totalDurationSeconds: 0,
        followersCount: 0,
        followingCount: 0,
        currentStreakDays: 0,
        maxSpeedKmh: 0,
        elevationGainMeters: 0,
        maxLeanAngleDegrees: 0,
      },
    };

    this.users.set(defaults.email.toLowerCase(), user);
    this.users.set(defaults.username.toLowerCase(), user);
    return user;
  }
}

export const mockAuthRepository = new MockAuthRepository();
export default mockAuthRepository;
