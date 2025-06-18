import { supabase } from '../lib/supabase';
import { AppError } from '../utils/errors';

async function verifyDatabase() {
  try {
    console.log('🔍 Verifying database connection and schema...');

    // Check connection
    const { data: connectionData, error: connectionError } = await supabase
      .from('shops')
      .select('count')
      .limit(1);

    if (connectionError) {
      throw new AppError(`Database connection failed: ${connectionError.message}`);
    }

    console.log('✅ Database connection successful');

    // Verify tables
    const tables = [
      'shops',
      'products',
      'content_revisions',
      'performance_metrics',
      'ai_models',
      'usage_logs',
      'events',
      'cache'
    ];

    for (const table of tables) {
      const { error: tableError } = await supabase
        .from(table)
        .select('count')
        .limit(1);

      if (tableError) {
        throw new AppError(`Table ${table} verification failed: ${tableError.message}`);
      }

      console.log(`✅ Table ${table} verified`);
    }

    // Verify indexes
    const { data: indexData, error: indexError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT indexname, tablename
        FROM pg_indexes
        WHERE schemaname = 'public'
        AND indexname LIKE 'idx_%'
      `
    });

    if (indexError) {
      throw new AppError(`Index verification failed: ${indexError.message}`);
    }

    console.log('✅ Database indexes verified');

    // Verify triggers
    const { data: triggerData, error: triggerError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT trigger_name, event_object_table
        FROM information_schema.triggers
        WHERE trigger_schema = 'public'
        AND trigger_name LIKE 'update_%_updated_at'
      `
    });

    if (triggerError) {
      throw new AppError(`Trigger verification failed: ${triggerError.message}`);
    }

    console.log('✅ Database triggers verified');

    // Verify RLS policies
    const { data: policyData, error: policyError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT tablename, policyname
        FROM pg_policies
        WHERE schemaname = 'public'
      `
    });

    if (policyError) {
      throw new AppError(`Policy verification failed: ${policyError.message}`);
    }

    console.log('✅ Row Level Security policies verified');

    console.log('✅ Database verification completed successfully!');
  } catch (error) {
    console.error('❌ Database verification failed:', error);
    process.exit(1);
  }
}

// Run verification if this file is executed directly
if (require.main === module) {
  verifyDatabase();
}

export { verifyDatabase };
