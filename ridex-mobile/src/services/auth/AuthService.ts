/**
 * Centralized Authentication Service for RIDEX
 * Orchestrates repositories, input validation, secure session persistence, and auth listeners.
 */

import { repositories } from '@/repositories';
import { supabase } from '@/services/supabase/client';
import { secureStore } from '@/services/storage/secureStore';
import { asyncStorage } from '@/services/storage/asyncStorage';
import {
  AuthSession,
  LoginCredentials,
  SignupCredentials,
  UpdatePasswordParams,
} from './authTypes';
import { AppAuthError, AuthErrorCode, mapAuthError } from './authErrors';
import { User } from '@/types/user';
import { logger } from '@/utils/logger';

class AuthService {
  private authListenerSubscription: { unsubscribe: () => void } | null = null;

  /**
   * Validate email format
   */
  private validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  }

  /**
   * Validate username format (3-30 chars, alphanumeric + underscores)
   */
  private validateUsername(username: string): boolean {
    const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
    return usernameRegex.test(username.trim());
  }

  /**
   * Authenticate user with email and password
   */
  async signIn(credentials: LoginCredentials): Promise<AuthSession> {
    const cleanInput = credentials.email.trim().toLowerCase();
    const password = credentials.password;

    if (!cleanInput) {
      throw new AppAuthError(AuthErrorCode.INVALID_EMAIL, 'Email address or callsign is required.');
    }

    if (cleanInput.includes('@')) {
      if (!this.validateEmail(cleanInput)) {
        throw new AppAuthError(AuthErrorCode.INVALID_EMAIL, 'Please enter a valid email address.');
      }
    } else {
      if (!this.validateUsername(cleanInput)) {
        throw new AppAuthError(AuthErrorCode.INVALID_USERNAME, 'Please enter a valid callsign (at least 3 characters).');
      }
    }

    if (!password) {
      throw new AppAuthError(AuthErrorCode.INVALID_CREDENTIALS, 'Password is required.');
    }

    try {
      const session = await repositories.auth.signIn({
        email: cleanInput,
        password,
      });

      // Persist auth tokens securely
      if (session.token && session.token !== 'pending_verification') {
        await secureStore.setToken(session.token);
      }
      if (session.refreshToken) {
        await secureStore.setRefreshToken(session.refreshToken);
      }
      await asyncStorage.setJson(asyncStorage.KEYS.USER_PROFILE, session.user);

      logger.info('AuthService', 'User signed in successfully', session.user.id);
      return session;
    } catch (error) {
      logger.error('AuthService', 'signIn failed', error);
      throw error instanceof AppAuthError ? error : new AppAuthError(AuthErrorCode.INVALID_CREDENTIALS, mapAuthError(error), error);
    }
  }

  /**
   * Register a new rider account
   */
  async signUp(credentials: SignupCredentials): Promise<AuthSession> {
    const cleanName = credentials.name.trim();
    const cleanEmail = credentials.email.trim().toLowerCase();
    const cleanUsername = credentials.username.trim().toLowerCase();
    const password = credentials.password;
    const confirmPassword = credentials.confirmPassword;

    if (!cleanName || cleanName.length < 2) {
      throw new AppAuthError(AuthErrorCode.INVALID_FULL_NAME, 'Please enter your full name (at least 2 characters).');
    }

    if (!cleanUsername) {
      throw new AppAuthError(AuthErrorCode.INVALID_USERNAME, 'Callsign / username is required.');
    }

    if (!this.validateUsername(cleanUsername)) {
      throw new AppAuthError(
        AuthErrorCode.INVALID_USERNAME,
        'Callsign must be 3-30 characters and contain only letters, numbers, and underscores.'
      );
    }

    if (!cleanEmail || !this.validateEmail(cleanEmail)) {
      throw new AppAuthError(AuthErrorCode.INVALID_EMAIL, 'Please enter a valid email address.');
    }

    if (!password || password.length < 6) {
      throw new AppAuthError(AuthErrorCode.WEAK_PASSWORD, 'Password must be at least 6 characters long.');
    }

    if (confirmPassword !== undefined && password !== confirmPassword) {
      throw new AppAuthError(AuthErrorCode.PASSWORDS_DO_NOT_MATCH, 'Passwords do not match.');
    }

    try {
      const session = await repositories.auth.signUp({
        name: cleanName,
        username: cleanUsername,
        email: cleanEmail,
        password,
        primaryBike: credentials.primaryBike,
      });

      if (session.token && session.token !== 'pending_verification') {
        await secureStore.setToken(session.token);
      }
      if (session.refreshToken) {
        await secureStore.setRefreshToken(session.refreshToken);
      }
      await asyncStorage.setJson(asyncStorage.KEYS.USER_PROFILE, session.user);

      logger.info('AuthService', 'User registered successfully', session.user.id);
      return session;
    } catch (error) {
      logger.error('AuthService', 'signUp failed', error);
      throw error instanceof AppAuthError ? error : new AppAuthError(AuthErrorCode.UNKNOWN_ERROR, mapAuthError(error), error);
    }
  }

  /**
   * Sign out the active user and clear persisted tokens
   */
  async signOut(): Promise<void> {
    try {
      await repositories.auth.signOut();
    } catch (error) {
      logger.warn('AuthService', 'Sign out repository warning', error);
    } finally {
      await secureStore.clearAuth();
      await asyncStorage.remove(asyncStorage.KEYS.USER_PROFILE);
      logger.info('AuthService', 'User signed out and credentials cleared');
    }
  }

  /**
   * Get the current active session
   */
  async getCurrentSession(): Promise<AuthSession | null> {
    try {
      return await repositories.auth.getCurrentSession();
    } catch (error) {
      logger.error('AuthService', 'getCurrentSession error', error);
      return null;
    }
  }

  /**
   * Get the current user profile
   */
  async getCurrentUser(): Promise<User | null> {
    try {
      return await repositories.auth.getCurrentUser();
    } catch (error) {
      logger.error('AuthService', 'getCurrentUser error', error);
      return null;
    }
  }

  /**
   * Request password recovery link
   */
  async resetPassword(email: string): Promise<void> {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !this.validateEmail(cleanEmail)) {
      throw new AppAuthError(AuthErrorCode.INVALID_EMAIL, 'Please enter a valid email address.');
    }

    try {
      await repositories.auth.resetPasswordForEmail(cleanEmail);
      logger.info('AuthService', 'Password reset email requested', cleanEmail);
    } catch (error) {
      logger.error('AuthService', 'resetPassword error', error);
      throw error instanceof AppAuthError ? error : new AppAuthError(AuthErrorCode.UNKNOWN_ERROR, mapAuthError(error), error);
    }
  }

  /**
   * Update password for recovery session
   */
  async updatePassword(params: UpdatePasswordParams): Promise<void> {
    if (!params.newPassword || params.newPassword.length < 6) {
      throw new AppAuthError(AuthErrorCode.WEAK_PASSWORD, 'Password must be at least 6 characters long.');
    }

    if (params.newPassword !== params.confirmPassword) {
      throw new AppAuthError(AuthErrorCode.PASSWORDS_DO_NOT_MATCH, 'Passwords do not match.');
    }

    try {
      await repositories.auth.updatePassword(params);
      logger.info('AuthService', 'Password updated successfully');
    } catch (error) {
      logger.error('AuthService', 'updatePassword error', error);
      throw error instanceof AppAuthError ? error : new AppAuthError(AuthErrorCode.UNKNOWN_ERROR, mapAuthError(error), error);
    }
  }

  /**
   * Resend signup verification email
   */
  async resendVerificationEmail(email: string): Promise<void> {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !this.validateEmail(cleanEmail)) {
      throw new AppAuthError(AuthErrorCode.INVALID_EMAIL, 'Please enter a valid email address.');
    }

    try {
      await repositories.auth.resendVerificationEmail(cleanEmail);
      logger.info('AuthService', 'Verification email resent', cleanEmail);
    } catch (error) {
      logger.error('AuthService', 'resendVerificationEmail error', error);
      throw error instanceof AppAuthError ? error : new AppAuthError(AuthErrorCode.UNKNOWN_ERROR, mapAuthError(error), error);
    }
  }

  /**
   * Initialize a centralized single auth state listener
   */
  initAuthListener(onAuthChange: (event: string, session: any) => void): () => void {
    if (this.authListenerSubscription) {
      this.authListenerSubscription.unsubscribe();
    }

    try {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        logger.info('AuthService', `Auth state changed: ${event}`, session?.user?.id);
        onAuthChange(event, session);
      });

      this.authListenerSubscription = subscription;

      return () => {
        subscription.unsubscribe();
        this.authListenerSubscription = null;
      };
    } catch (e) {
      logger.warn('AuthService', 'Supabase auth listener initialization bypassed', e);
      return () => { };
    }
  }
}

export const authService = new AuthService();
export default authService;
