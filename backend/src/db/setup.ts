import { createClient } from '@supabase/supabase-js';
import { config } from '../config';
import { logger } from '../utils/logger';

// Initialize Supabase client
const supabaseUrl = config.SUPABASE_URL;
const supabaseKey = config.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase configuration');
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Test database connection
export async function testConnection(): Promise<boolean> {
  try {
    // First, try to create the health_check table if it doesn't exist
    const { error: createError } = await supabase.rpc('execute_sql', {
      sql_query: `
        CREATE TABLE IF NOT EXISTS health_check (
          id SERIAL PRIMARY KEY,
          status TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Insert a test record if none exists
        INSERT INTO health_check (status)
        SELECT 'ok'
        WHERE NOT EXISTS (SELECT 1 FROM health_check LIMIT 1);
      `
    });
    
    if (createError) {
      logger.warn('Failed to create health_check table:', createError);
      // Continue anyway to check if the table exists
    }
    
    // Now try to query the table
    const { data, error } = await supabase.from('health_check').select('*').limit(1);
    if (error) throw error;
    logger.info('Database connection successful');
    return true;
  } catch (error) {
    logger.error('Database connection failed:', error);
    return false;
  }
}

// Initialize database
export async function initializeDatabase(): Promise<void> {
  try {
    // Create a basic set of tables if they don't exist
    const { error } = await supabase.rpc('execute_sql', {
      sql_query: `
        -- Create health_check table
        CREATE TABLE IF NOT EXISTS health_check (
          id SERIAL PRIMARY KEY,
          status TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Create users table if not exists
        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          first_name TEXT,
          last_name TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Create sessions table if not exists
        CREATE TABLE IF NOT EXISTS sessions (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          token TEXT UNIQUE NOT NULL,
          expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Create shopify_stores table if not exists
        CREATE TABLE IF NOT EXISTS shopify_stores (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          shop_name TEXT UNIQUE NOT NULL,
          access_token TEXT,
          scope TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });
    
    if (error) {
      throw error;
    }
    
    logger.info('Basic database tables initialized successfully');
    
    // Skip the more complex initialization for now
    // Only run these if necessary and if the execute_sql RPC exists
    // await initializeSchema();
    // await initializeFunctions();
    // await initializeTriggers();
    // await initializeIndexes();
    // await initializePolicies();
    
    logger.info('Database initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize database:', error);
    throw error;
  }
}

/**
 * Sets up the Supabase client and tests the connection.
 */
export async function setupSupabase(): Promise<void> {
  await testConnection();
}
