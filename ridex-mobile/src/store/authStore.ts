/**
 * Zustand Global Authentication Store
 * Manages reactive auth state, user profile, session persistence, and error states.
 */

import { create } from 'zustand';
import { User, UserProfile } from '@/types/user';
import {
  AuthSession,
  LoginCredentials,
  SignupCredentials,
  UpdatePasswordParams,
} from '@/services/auth/authTypes';
import { authService } from '@/services/auth/AuthService';
import { mapAuthError } from '@/services/auth/authErrors';
import { secureStore } from '@/services/storage/secureStore';
import { asyncStorage } from '@/services/storage/asyncStorage';
import { logger } from '@/utils/logger';

interface AuthStoreState {
  user: User | null;
  profile: UserProfile | null;
  session: AuthSession | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;

  // Actions
  signIn: (credentials: LoginCredentials) => Promise<boolean>;
  signUp: (credentials: SignupCredentials) => Promise<boolean>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<boolean>;
  updatePassword: (params: UpdatePasswordParams) => Promise<boolean>;
  resendVerification: (email: string) => Promise<boolean>;
  loadStoredSession: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
  clearError: () => void;
  setSessionFromListener: (session: any) => Promise<void>;
}

export const useAuthStore = create<AuthStoreState>((set, get) => ({
  user: null,
  profile: null,
  session: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  isInitialized: false,
  error: null,

  signIn: async (credentials: LoginCredentials) => {
    set({ isLoading: true, error: null });
    try {
      const authSession = await authService.signIn(credentials);
      set({
        user: authSession.user,
        session: authSession,
        token: authSession.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      // Synchronize garage motorcycles
      try {
        const { useBikeStore } = require('./bikeStore');
        useBikeStore.getState().fetchMotorcycles();
      } catch (e) {
        // non-blocking
      }

      return true;
    } catch (err) {
      const errorMsg = mapAuthError(err);
      set({ error: errorMsg, isLoading: false });
      return false;
    }
  },

  signUp: async (credentials: SignupCredentials) => {
    set({ isLoading: true, error: null });
    try {
      const authSession = await authService.signUp(credentials);
      set({
        user: authSession.user,
        session: authSession,
        token: authSession.token,
        isAuthenticated: authSession.token !== 'pending_verification',
        isLoading: false,
        error: null,
      });

      // Synchronize garage motorcycles
      try {
        const { useBikeStore } = require('./bikeStore');
        useBikeStore.getState().fetchMotorcycles();
      } catch (e) {
        // non-blocking
      }

      return true;
    } catch (err) {
      const errorMsg = mapAuthError(err);
      set({ error: errorMsg, isLoading: false });
      return false;
    }
  },

  signOut: async () => {
    set({ isLoading: true });
    try {
      await authService.signOut();
    } catch (e) {
      logger.warn('AuthStore', 'SignOut warning', e);
    } finally {
      // Clear garage fleet state
      try {
        const { useBikeStore } = require('./bikeStore');
        useBikeStore.getState().clearGarage();
      } catch (e) {
        // non-blocking
      }

      set({
        user: null,
        profile: null,
        session: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  },

  resetPassword: async (email: string) => {
    set({ isLoading: true, error: null });
    try {
      await authService.resetPassword(email);
      set({ isLoading: false, error: null });
      return true;
    } catch (err) {
      const errorMsg = mapAuthError(err);
      set({ error: errorMsg, isLoading: false });
      return false;
    }
  },

  updatePassword: async (params: UpdatePasswordParams) => {
    set({ isLoading: true, error: null });
    try {
      await authService.updatePassword(params);
      set({ isLoading: false, error: null });
      return true;
    } catch (err) {
      const errorMsg = mapAuthError(err);
      set({ error: errorMsg, isLoading: false });
      return false;
    }
  },

  resendVerification: async (email: string) => {
    set({ isLoading: true, error: null });
    try {
      await authService.resendVerificationEmail(email);
      set({ isLoading: false, error: null });
      return true;
    } catch (err) {
      const errorMsg = mapAuthError(err);
      set({ error: errorMsg, isLoading: false });
      return false;
    }
  },

  loadStoredSession: async () => {
    set({ isLoading: true });
    try {
      const activeSession = await authService.getCurrentSession();
      if (activeSession && activeSession.token) {
        set({
          user: activeSession.user,
          session: activeSession,
          token: activeSession.token,
          isAuthenticated: true,
          isLoading: false,
          isInitialized: true,
          error: null,
        });
        logger.info('AuthStore', 'Session restored successfully', activeSession.user.id);
        try {
          const { useBikeStore } = require('./bikeStore');
          useBikeStore.getState().fetchMotorcycles();
        } catch (e) {}
        return;
      }

      // Offline fallback from secure store & async storage
      const token = await secureStore.getToken();
      const cachedUser = await asyncStorage.getJson<User>(asyncStorage.KEYS.USER_PROFILE);

      if (token && cachedUser) {
        set({
          user: cachedUser,
          token,
          isAuthenticated: true,
          isLoading: false,
          isInitialized: true,
          error: null,
        });
        logger.info('AuthStore', 'Offline cached session loaded', cachedUser.id);
        try {
          const { useBikeStore } = require('./bikeStore');
          useBikeStore.getState().fetchMotorcycles();
        } catch (e) {}
      } else {
        set({
          user: null,
          session: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
          isInitialized: true,
          error: null,
        });
      }
    } catch (err) {
      logger.error('AuthStore', 'Failed to restore session', err);
      set({
        user: null,
        session: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        isInitialized: true,
      });
    }
  },

  refreshProfile: async () => {
    try {
      const user = await authService.getCurrentUser();
      if (user) {
        set({ user });
        await asyncStorage.setJson(asyncStorage.KEYS.USER_PROFILE, user);
      }
    } catch (err) {
      logger.warn('AuthStore', 'Profile refresh warning', err);
    }
  },

  updateUser: (updates: Partial<User>) => {
    const current = get().user;
    if (!current) return;
    const updated = { ...current, ...updates };
    set({ user: updated });
    asyncStorage.setJson(asyncStorage.KEYS.USER_PROFILE, updated);
  },

  clearError: () => set({ error: null }),

  setSessionFromListener: async (supabaseSession: any) => {
    if (!supabaseSession) {
      set({
        user: null,
        session: null,
        token: null,
        isAuthenticated: false,
      });
      return;
    }

    const user = await authService.getCurrentUser();
    if (user) {
      set({
        user,
        token: supabaseSession.access_token,
        isAuthenticated: true,
      });
    }
  },
}));

export default useAuthStore;
