import { runMigration } from './migrate';
import { setupSupabase } from './setup';
import { verifyDatabase } from './verify';

async function initializeDatabase() {
  try {
    console.log('🚀 Initializing database...');
    
    // Run setup first
    await setupSupabase();
    
    // Then run migrations
    await runMigration();
    
    // Finally verify everything
    await verifyDatabase();
    
    console.log('✅ Database initialization completed successfully!');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
}

// Run initialization if this file is executed directly
if (require.main === module) {
  initializeDatabase();
}

export { initializeDatabase };
