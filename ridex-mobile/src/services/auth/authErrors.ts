/**
 * Centralized Authentication Error Codes and User-Friendly Error Messages
 */

export enum AuthErrorCode {
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  EMAIL_ALREADY_EXISTS = 'EMAIL_ALREADY_EXISTS',
  USERNAME_ALREADY_EXISTS = 'USERNAME_ALREADY_EXISTS',
  WEAK_PASSWORD = 'WEAK_PASSWORD',
  PASSWORDS_DO_NOT_MATCH = 'PASSWORDS_DO_NOT_MATCH',
  INVALID_EMAIL = 'INVALID_EMAIL',
  INVALID_USERNAME = 'INVALID_USERNAME',
  INVALID_FULL_NAME = 'INVALID_FULL_NAME',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  TOO_MANY_REQUESTS = 'TOO_MANY_REQUESTS',
  EMAIL_NOT_CONFIRMED = 'EMAIL_NOT_CONFIRMED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  RECOVERY_REQUIRED = 'RECOVERY_REQUIRED',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export class AppAuthError extends Error {
  readonly code: AuthErrorCode;
  readonly originalError?: unknown;

  constructor(code: AuthErrorCode, message: string, originalError?: unknown) {
    super(message);
    this.name = 'AppAuthError';
    this.code = code;
    this.originalError = originalError;
  }
}

/**
 * Maps raw backend or Supabase error messages into clean, user-friendly messages
 */
export function mapAuthError(error: unknown): string {
  if (!error) return 'An unexpected error occurred. Please try again.';

  if (error instanceof AppAuthError) {
    return error.message;
  }

  const rawMessage = typeof error === 'string' 
    ? error 
    : (error as any)?.message || (error as any)?.error_description || '';
  
  const lower = rawMessage.toLowerCase();

  if (lower.includes('invalid login credentials') || lower.includes('invalid email or password')) {
    return 'Incorrect email or password. Please check your credentials.';
  }

  if (lower.includes('user already registered') || lower.includes('already exists') || lower.includes('email address is already registered')) {
    return 'An account with this email address already exists. Try signing in.';
  }

  if (lower.includes('duplicate key') && lower.includes('username')) {
    return 'This callsign/username is already taken. Please choose another.';
  }

  if (lower.includes('password should be at least') || lower.includes('password is too short')) {
    return 'Password must be at least 6 characters long.';
  }

  if (lower.includes('email not confirmed') || lower.includes('unconfirmed email')) {
    return 'Please verify your email address to continue.';
  }

  if (lower.includes('rate limit') || lower.includes('too many requests') || lower.includes('security purposes')) {
    return 'Too many login attempts. Please wait a moment and try again.';
  }

  if (lower.includes('network') || lower.includes('failed to fetch') || lower.includes('offline') || lower.includes('network request failed')) {
    return 'No internet connection. Please check your network and try again.';
  }

  if (lower.includes('token has expired') || lower.includes('session expired') || lower.includes('jwt expired')) {
    return 'Your session has expired. Please log in again.';
  }

  return rawMessage || 'Authentication failed. Please verify your details and try again.';
}
