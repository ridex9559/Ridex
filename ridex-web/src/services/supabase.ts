/**
 * RIDEX Web — Authoritative Supabase Client
 * Interfaces with PostgreSQL, Auth, Row Level Security, and Realtime Channels.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://rsmgifwhlvlgkpmfeqdj.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_VKZ_yfnWZicZHEnsTcu_6A_mtlNcDMT';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});
