/**
 * Centralized Supabase Client with Expo Secure Store Session Persistence
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ExpoSecureStoreAdapter } from '@/services/storage/secureStore';
import { Database } from './types';
import { supabaseConfig } from './config';
import { logger } from '@/utils/logger';

class SupabaseClientService {
  private clientInstance: SupabaseClient<Database> | null = null;

  getClient(): SupabaseClient<Database> {
    if (!this.clientInstance) {
      this.clientInstance = createClient<Database>(
        supabaseConfig.url,
        supabaseConfig.anonKey,
        {
          auth: {
            storage: ExpoSecureStoreAdapter,
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: false,
          },
        }
      );
      logger.info('Supabase', 'Supabase client initialized with SecureStore session persistence');
    }
    return this.clientInstance;
  }
}

export const supabaseService = new SupabaseClientService();
export const supabase = supabaseService.getClient();
export const supabaseClient = supabase;
export default supabase;
