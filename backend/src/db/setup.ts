import { createClient } from '@supabase/supabase-js';
import { config } from '../config';
import { logger } from '../utils/logger';

// Initialize Supabase client
const supabaseUrl = config.get('SUPABASE_URL');
const supabaseKey = config.get('SUPABASE_SERVICE_KEY');

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
    const { data, error } = await supabase.from('health_check').select('*').limit(1);
    if (error) throw error;
    logger.info('Database connection successful');
    return true;
  } catch (error) {
    logger.error('Database connection failed:', error);
    return false;
  }
}

// Initialize database schema
export async function initializeSchema(): Promise<void> {
  try {
    // Create cache table
    await supabase.rpc('create_cache_table');
    
    // Create usage_logs table
    await supabase.rpc('create_usage_logs_table');
    
    // Create content_revisions table
    await supabase.rpc('create_content_revisions_table');
    
    // Create social_posts table
    await supabase.rpc('create_social_posts_table');
    
    // Create notifications table
    await supabase.rpc('create_notifications_table');
    
    // Create performance_metrics table
    await supabase.rpc('create_performance_metrics_table');
    
    // Create market_analysis table
    await supabase.rpc('create_market_analysis_table');
    
    // Create analytics_reports table
    await supabase.rpc('create_analytics_reports_table');
    
    logger.info('Database schema initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize database schema:', error);
    throw error;
  }
}

// Initialize database functions
export async function initializeFunctions(): Promise<void> {
  try {
    // Create cache management functions
    await supabase.rpc('create_cache_functions');
    
    // Create usage tracking functions
    await supabase.rpc('create_usage_tracking_functions');
    
    // Create content optimization functions
    await supabase.rpc('create_content_optimization_functions');
    
    // Create social media functions
    await supabase.rpc('create_social_media_functions');
    
    // Create notification functions
    await supabase.rpc('create_notification_functions');
    
    // Create performance tracking functions
    await supabase.rpc('create_performance_tracking_functions');
    
    // Create market analysis functions
    await supabase.rpc('create_market_analysis_functions');
    
    // Create analytics functions
    await supabase.rpc('create_analytics_functions');
    
    logger.info('Database functions initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize database functions:', error);
    throw error;
  }
}

// Initialize database triggers
export async function initializeTriggers(): Promise<void> {
  try {
    // Create cache cleanup trigger
    await supabase.rpc('create_cache_cleanup_trigger');
    
    // Create usage log trigger
    await supabase.rpc('create_usage_log_trigger');
    
    // Create notification trigger
    await supabase.rpc('create_notification_trigger');
    
    // Create performance metrics trigger
    await supabase.rpc('create_performance_metrics_trigger');
    
    logger.info('Database triggers initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize database triggers:', error);
    throw error;
  }
}

// Initialize database indexes
export async function initializeIndexes(): Promise<void> {
  try {
    // Create cache indexes
    await supabase.rpc('create_cache_indexes');
    
    // Create usage logs indexes
    await supabase.rpc('create_usage_logs_indexes');
    
    // Create content revisions indexes
    await supabase.rpc('create_content_revisions_indexes');
    
    // Create social posts indexes
    await supabase.rpc('create_social_posts_indexes');
    
    // Create notifications indexes
    await supabase.rpc('create_notifications_indexes');
    
    // Create performance metrics indexes
    await supabase.rpc('create_performance_metrics_indexes');
    
    // Create market analysis indexes
    await supabase.rpc('create_market_analysis_indexes');
    
    // Create analytics reports indexes
    await supabase.rpc('create_analytics_reports_indexes');
    
    logger.info('Database indexes initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize database indexes:', error);
    throw error;
  }
}

// Initialize database policies
export async function initializePolicies(): Promise<void> {
  try {
    // Create cache policies
    await supabase.rpc('create_cache_policies');
    
    // Create usage logs policies
    await supabase.rpc('create_usage_logs_policies');
    
    // Create content revisions policies
    await supabase.rpc('create_content_revisions_policies');
    
    // Create social posts policies
    await supabase.rpc('create_social_posts_policies');
    
    // Create notifications policies
    await supabase.rpc('create_notifications_policies');
    
    // Create performance metrics policies
    await supabase.rpc('create_performance_metrics_policies');
    
    // Create market analysis policies
    await supabase.rpc('create_market_analysis_policies');
    
    // Create analytics reports policies
    await supabase.rpc('create_analytics_reports_policies');
    
    logger.info('Database policies initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize database policies:', error);
    throw error;
  }
}

// Initialize database
export async function initializeDatabase(): Promise<void> {
  try {
    await initializeSchema();
    await initializeFunctions();
    await initializeTriggers();
    await initializeIndexes();
    await initializePolicies();
    logger.info('Database initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize database:', error);
    throw error;
  }
}
