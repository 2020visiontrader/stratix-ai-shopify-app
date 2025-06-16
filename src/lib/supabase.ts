// Supabase client configuration for Stratix AI
import { createClient } from '@supabase/supabase-js';

// Environment variables with fallbacks for development
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'your_supabase_url_here';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your_supabase_anon_key_here';

// Validate required environment variables
if (!supabaseUrl || supabaseUrl === 'your_supabase_url_here') {
  console.warn('⚠️  SUPABASE_URL not configured. Some features may not work.');
}

if (!supabaseAnonKey || supabaseAnonKey === 'your_supabase_anon_key_here') {
  console.warn('⚠️  SUPABASE_ANON_KEY not configured. Some features may not work.');
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Helper function to check if Supabase is properly configured
export const isSupabaseConfigured = (): boolean => {
  return supabaseUrl !== 'your_supabase_url_here' && 
         supabaseAnonKey !== 'your_supabase_anon_key_here' &&
         supabaseUrl.startsWith('https://') &&
         supabaseAnonKey.length > 20;
};

// Helper function to get Supabase connection status
export const getSupabaseStatus = async (): Promise<{
  connected: boolean;
  error?: string;
}> => {
  try {
    if (!isSupabaseConfigured()) {
      return {
        connected: false,
        error: 'Supabase credentials not configured'
      };
    }

    // Test connection with a simple query
    const { data, error } = await supabase
      .from('campaigns')
      .select('count')
      .limit(1);

    if (error && error.code !== 'PGRST116') { // PGRST116 = table doesn't exist (which is fine)
      return {
        connected: false,
        error: error.message
      };
    }

    return { connected: true };
  } catch (error) {
    return {
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Database table interfaces
export interface DatabaseTables {
  campaigns: {
    id: string;
    name: string;
    status: string;
    type: string;
    user_id: string;
    created_at: string;
    updated_at: string;
    config: any;
  };
  variants: {
    id: string;
    campaign_id: string;
    name: string;
    content: any;
    traffic_percentage: number;
    created_at: string;
  };
  metrics: {
    id: string;
    campaign_id: string;
    variant_id: string;
    visitors: number;
    conversions: number;
    revenue: number;
    recorded_at: string;
  };
  users: {
    id: string;
    email: string;
    name: string;
    plan: string;
    created_at: string;
    updated_at: string;
  };
}

// Export default client
export default supabase;
