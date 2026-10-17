/**
 * Authentication Repository Interface
 */

import { AuthSession, LoginCredentials, SignupCredentials, UpdatePasswordParams } from '@/services/auth/authTypes';
import { User } from '@/types/user';

export interface IAuthRepository {
  signIn(credentials: LoginCredentials): Promise<AuthSession>;
  signUp(credentials: SignupCredentials): Promise<AuthSession>;
  signOut(): Promise<void>;
  getCurrentSession(): Promise<AuthSession | null>;
  getCurrentUser(): Promise<User | null>;
  resetPasswordForEmail(email: string): Promise<void>;
  updatePassword(params: UpdatePasswordParams): Promise<void>;
  resendVerificationEmail(email: string): Promise<void>;
  ensureProfileExists(userId: string, defaults: { name: string; username: string; email: string }): Promise<User>;
}
