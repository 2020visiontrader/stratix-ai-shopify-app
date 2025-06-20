import { createClient } from '@supabase/supabase-js';
import { AppError } from '../utils/errors';

interface HealthCheck {
  status: 'healthy' | 'unhealthy';
  checks: {
    connection: boolean;
    tables: boolean;
    indexes: boolean;
    policies: boolean;
  };
  details: {
    connection?: string;
    tables?: string[];
    indexes?: string[];
    policies?: string[];
  };
}

async function checkDatabaseHealth(): Promise<HealthCheck> {
  const health: HealthCheck = {
    status: 'healthy',
    checks: {
      connection: false,
      tables: false,
      indexes: false,
      policies: false
    },
    details: {}
  };

  try {
    // Initialize Supabase client
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!
    );

    // Check connection
    const { error: connectionError } = await supabase.from('shops').select('count').limit(1);
    if (connectionError) {
      throw AppError.internal('Failed to connect to database', connectionError);
    }
    health.checks.connection = true;

    // Check tables
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');

    if (tablesError) {
      throw AppError.internal('Failed to get tables', tablesError);
    }

    const requiredTables = [
      'shops',
      'products',
      'content_revisions',
      'performance_metrics',
      'ai_models',
      'usage_logs',
      'events',
      'cache'
    ];

    const existingTables = tables.map(t => t.table_name);
    const missingTables = requiredTables.filter(t => !existingTables.includes(t));

    if (missingTables.length > 0) {
      health.status = 'unhealthy';
      health.checks.tables = false;
      health.details.tables = missingTables;
    } else {
      health.checks.tables = true;
    }

    // Check indexes
    const { data: indexes, error: indexesError } = await supabase
      .from('pg_indexes')
      .select('indexname, tablename')
      .eq('schemaname', 'public');

    if (indexesError) {
      throw AppError.internal('Failed to get indexes', indexesError);
    }

    const requiredIndexes = [
      'shops_domain_idx',
      'products_shop_id_idx',
      'content_revisions_product_id_idx',
      'performance_metrics_product_id_idx',
      'usage_logs_shop_id_idx',
      'events_shop_id_idx'
    ];

    const existingIndexes = indexes.map(i => i.indexname);
    const missingIndexes = requiredIndexes.filter(i => !existingIndexes.includes(i));

    if (missingIndexes.length > 0) {
      health.status = 'unhealthy';
      health.checks.indexes = false;
      health.details.indexes = missingIndexes;
    } else {
      health.checks.indexes = true;
    }

    // Check policies
    const { data: policies, error: policiesError } = await supabase
      .from('pg_policies')
      .select('policyname, tablename')
      .eq('schemaname', 'public');

    if (policiesError) {
      throw AppError.internal('Failed to get policies', policiesError);
    }

    const requiredPolicies = [
      'shops_policy',
      'products_policy',
      'content_revisions_policy',
      'performance_metrics_policy',
      'ai_models_policy',
      'usage_logs_policy',
      'events_policy',
      'cache_policy'
    ];

    const existingPolicies = policies.map(p => p.policyname);
    const missingPolicies = requiredPolicies.filter(p => !existingPolicies.includes(p));

    if (missingPolicies.length > 0) {
      health.status = 'unhealthy';
      health.checks.policies = false;
      health.details.policies = missingPolicies;
    } else {
      health.checks.policies = true;
    }

    return health;
  } catch (error) {
    console.error('Health check failed:', error);
    health.status = 'unhealthy';
    health.details.connection = error instanceof Error ? error.message : 'Unknown error';
    return health;
  }
}

// Run health check
checkDatabaseHealth().then(health => {
  console.log('Database Health Check Results:');
  console.log('----------------------------');
  console.log(`Status: ${health.status}`);
  console.log('\nChecks:');
  console.log(`- Connection: ${health.checks.connection ? '✅' : '❌'}`);
  console.log(`- Tables: ${health.checks.tables ? '✅' : '❌'}`);
  console.log(`- Indexes: ${health.checks.indexes ? '✅' : '❌'}`);
  console.log(`- Policies: ${health.checks.policies ? '✅' : '❌'}`);

  if (health.status === 'unhealthy') {
    console.log('\nDetails:');
    if (health.details.connection) {
      console.log(`Connection Error: ${health.details.connection}`);
    }
    if (health.details.tables?.length) {
      console.log(`Missing Tables: ${health.details.tables.join(', ')}`);
    }
    if (health.details.indexes?.length) {
      console.log(`Missing Indexes: ${health.details.indexes.join(', ')}`);
    }
    if (health.details.policies?.length) {
      console.log(`Missing Policies: ${health.details.policies.join(', ')}`);
    }
    process.exit(1);
  }
}); 