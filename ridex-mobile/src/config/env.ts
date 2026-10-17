/**
 * Type-Safe Environment Variables Configuration
 */

export const env = {
  apiUrl: process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.7:5000/api/v1',
  signalRUrl: process.env.EXPO_PUBLIC_SIGNALR_URL || 'http://192.168.1.7:5000/hubs/rides',
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://rsmgifwhlvlgkpmfeqdj.supabase.co',
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_VKZ_yfnWZicZHEnsTcu_6A_mtlNcDMT',
  useMockData: process.env.EXPO_PUBLIC_USE_MOCK_DATA === 'true',
  enableDebugLogs: process.env.EXPO_PUBLIC_ENABLE_DEBUG_LOGS === 'true',
  appEnv: process.env.EXPO_PUBLIC_APP_ENV || 'development',
} as const;

export default env;
