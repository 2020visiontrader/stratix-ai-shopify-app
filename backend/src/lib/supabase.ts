import { createClient } from '@supabase/supabase-js';
import { DatabaseConfig } from '../types';

// Database configuration
const config: DatabaseConfig = {
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseKey: process.env.SUPABASE_ANON_KEY || '',
  schema: process.env.SUPABASE_SCHEMA || 'public'
};

// Create Supabase client
export const supabase = createClient(config.supabaseUrl, config.supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true
  },
  db: {
    schema: config.schema
  }
});

// Database table interfaces
export interface DatabaseTables {
  shops: {
    id: string;
    shop_domain: string;
    access_token: string;
    created_at: string;
    updated_at: string;
    plan: string;
    status: 'active' | 'inactive' | 'suspended';
  };
  products: {
    id: string;
    shop_id: string;
    product_id: string;
    title: string;
    description: string;
    price: number;
    created_at: string;
    updated_at: string;
  };
  content_revisions: {
    id: string;
    shop_id: string;
    product_id: string;
    content_type: 'title' | 'description' | 'meta';
    original_content: string;
    optimized_content: string;
    created_at: string;
    status: 'pending' | 'approved' | 'rejected';
  };
  performance_metrics: {
    id: string;
    shop_id: string;
    product_id: string;
    views: number;
    sales: number;
    revenue: number;
    date: string;
  };
  ai_models: {
    id: string;
    name: string;
    version: string;
    status: 'active' | 'inactive';
    created_at: string;
    updated_at: string;
  };
  usage_logs: {
    id: string;
    shop_id: string;
    model_id: string;
    tokens_used: number;
    cost: number;
    created_at: string;
  };
}

// Helper function to check if Supabase is properly configured
export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    config.supabaseUrl &&
    config.supabaseKey &&
    config.supabaseUrl.startsWith('https://') &&
    config.supabaseKey.length > 20
  );
};

// Helper function to get Supabase connection status
export const getSupabaseStatus = async (): Promise<{
  connected: boolean;
  error?: string;
}> => {
  if (!isSupabaseConfigured()) {
    return {
      connected: false,
      error: 'Supabase credentials not configured'
    };
  }

  try {
    const { data, error } = await supabase
      .from('shops')
      .select('id')
      .limit(1);

    if (error) throw error;

    return {
      connected: true
    };
  } catch (error) {
    return {
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Export database instance
export const db = supabase; 