/**
 * Application-level useAuth() Custom Hook
 * Provides clean access to authentication actions and state without exposing raw Supabase client.
 */

import { useAuthStore } from '@/store/authStore';
import { LoginCredentials, SignupCredentials, UpdatePasswordParams } from '@/services/auth/authTypes';

export function useAuth() {
  const user = useAuthStore(state => state.user);
  const profile = useAuthStore(state => state.profile);
  const session = useAuthStore(state => state.session);
  const token = useAuthStore(state => state.token);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const isLoading = useAuthStore(state => state.isLoading);
  const isInitialized = useAuthStore(state => state.isInitialized);
  const error = useAuthStore(state => state.error);

  const signIn = useAuthStore(state => state.signIn);
  const signUp = useAuthStore(state => state.signUp);
  const signOut = useAuthStore(state => state.signOut);
  const resetPassword = useAuthStore(state => state.resetPassword);
  const updatePassword = useAuthStore(state => state.updatePassword);
  const resendVerification = useAuthStore(state => state.resendVerification);
  const refreshProfile = useAuthStore(state => state.refreshProfile);
  const clearError = useAuthStore(state => state.clearError);

  return {
    // State
    user,
    profile,
    session,
    token,
    isAuthenticated,
    isLoading,
    isInitialized,
    error,

    // Actions
    signIn: (credentials: LoginCredentials) => signIn(credentials),
    signUp: (credentials: SignupCredentials) => signUp(credentials),
    signOut: () => signOut(),
    resetPassword: (email: string) => resetPassword(email),
    updatePassword: (params: UpdatePasswordParams) => updatePassword(params),
    resendVerification: (email: string) => resendVerification(email),
    refreshProfile: () => refreshProfile(),
    clearError: () => clearError(),
  };
}

export default useAuth;
