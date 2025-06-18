import { readFileSync } from 'fs';
import { join } from 'path';
import { supabase } from '../lib/supabase';
import { AppError } from '../utils/errors';

async function runMigration() {
  try {
    console.log('🚀 Starting database migration...');

    // Read migration file
    const migrationPath = join(__dirname, 'migrations', '001_initial_schema.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');

    // Split SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(statement => statement.trim())
      .filter(statement => statement.length > 0);

    // Execute each statement
    for (const statement of statements) {
      console.log(`📝 Executing: ${statement.substring(0, 100)}...`);
      const { error } = await supabase.rpc('exec_sql', { sql: statement });
      
      if (error) {
        throw new AppError(`Migration failed: ${error.message}`);
      }
    }

    console.log('✅ Database migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  runMigration();
}

export { runMigration };
