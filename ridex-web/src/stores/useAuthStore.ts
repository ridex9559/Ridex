/**
 * RIDEX Web — Authentication Store (Zustand)
 * Manages authenticated user profile, session, and initialization state.
 */

import { create } from 'zustand';
import { UserProfile } from '../types';
import { supabase } from '../services/supabase';
import { authService } from '../services/authService';

interface AuthState {
  user: UserProfile | null;
  session: any | null;
  isLoading: boolean;
  isInitialized: boolean;
  initialize: () => Promise<void>;
  setUser: (user: UserProfile | null) => void;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  isLoading: true,
  isInitialized: false,

  initialize: async () => {
    try {
      const { data } = await supabase.auth.getSession();
      const session = data?.session;

      if (session?.user) {
        const profile = await authService.getProfile(session.user.id);
        set({
          session,
          user: profile || {
            id: session.user.id,
            fullName: session.user.user_metadata?.full_name || 'Rider',
            username: session.user.user_metadata?.username || 'rider',
            email: session.user.email || '',
            avatarUrl: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=400&q=80',
          },
          isLoading: false,
          isInitialized: true,
        });
      } else {
        set({ session: null, user: null, isLoading: false, isInitialized: true });
      }

      // Listen for auth state changes (login, logout, token refresh)
      supabase.auth.onAuthStateChange(async (event, newSession) => {
        if (event === 'SIGNED_IN' && newSession?.user) {
          const profile = await authService.getProfile(newSession.user.id);
          set({
            session: newSession,
            user: profile,
            isLoading: false,
          });
        } else if (event === 'SIGNED_OUT') {
          set({ session: null, user: null, isLoading: false });
        }
      });
    } catch (err) {
      console.error('[useAuthStore] initialize error:', err);
      set({ session: null, user: null, isLoading: false, isInitialized: true });
    }
  },

  setUser: (user) => set({ user }),

  signOut: async () => {
    await authService.signOut();
    set({ user: null, session: null });
  },
}));
