/**
 * Supabase Database Helper and Error Transformer
 */

import { PostgrestError } from '@supabase/supabase-js';
import { logger } from '@/utils/logger';

export interface DatabaseResult<T> {
  data: T | null;
  error: string | null;
}

export class DatabaseError extends Error {
  readonly code?: string;
  readonly details?: string;

  constructor(message: string, code?: string, details?: string) {
    super(message);
    this.name = 'DatabaseError';
    this.code = code;
    this.details = details;
  }
}

export function transformSupabaseError(error: PostgrestError | Error | null | any): string {
  if (!error) return 'An unexpected database error occurred.';

  if (typeof error === 'object' && 'code' in error) {
    switch (error.code) {
      case '23505':
        return 'A record with these unique details already exists.';
      case '23503':
        return 'Referenced record was not found or is restricted.';
      case '42501':
      case 'PGRST301':
        return 'You do not have permission to access or modify this information.';
      case 'PGRST116':
        return 'Requested record was not found.';
      default:
        return error.message || 'Database request failed. Please check your network connection.';
    }
  }

  return error.message || 'Database request failed.';
}

export async function executeQuery<T>(
  contextOrFn: string | (() => Promise<{ data: T | null; error: any } | any>),
  maybeFn?: () => Promise<{ data: T | null; error: any } | any>
): Promise<T> {
  const context = typeof contextOrFn === 'string' ? contextOrFn : 'DatabaseQuery';
  const queryFn = typeof contextOrFn === 'function' ? contextOrFn : maybeFn!;

  try {
    const result = await queryFn();
    const error = result?.error;
    const data = result?.data !== undefined ? result.data : result;

    if (error) {
      const friendlyMessage = transformSupabaseError(error);
      logger.error('Database', `Query error in [${context}]`, { error, friendlyMessage });
      throw new DatabaseError(friendlyMessage, error.code, error.details);
    }
    return data as T;
  } catch (err: any) {
    if (err instanceof DatabaseError) throw err;
    const msg = transformSupabaseError(err);
    logger.error('Database', `Unhandled error in [${context}]`, err);
    throw new DatabaseError(msg);
  }
}
