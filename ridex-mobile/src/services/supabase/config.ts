/**
 * Supabase Environment and Client Configuration
 */

import { env } from '@/config/env';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConfigured: boolean;
}

export const supabaseConfig: SupabaseConfig = {
  url: env.supabaseUrl,
  anonKey: env.supabaseAnonKey,
  isConfigured:
    Boolean(env.supabaseUrl) &&
    Boolean(env.supabaseAnonKey) &&
    !env.supabaseUrl.includes('placeholder') &&
    !env.supabaseAnonKey.includes('placeholder'),
};

export default supabaseConfig;
