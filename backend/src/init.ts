import { app } from './api';
import { config } from './config';
import { supabase } from './db';
import { initializeDatabase, testConnection } from './db/setup';
import { logger } from './utils/logger';

async function initializeApp() {
  try {
    // Load environment variables
    config.load();

    // Test database connection
    const isConnected = await testConnection();
    if (!isConnected) {
      throw new Error('Failed to connect to database');
    }

    // Initialize database
    await initializeDatabase();

    // Start server
    const port = config.get('PORT');
    app.listen(port, () => {
      logger.info(`Server is running on port ${port}`);
    });

    // Handle graceful shutdown
    process.on('SIGTERM', async () => {
      logger.info('SIGTERM received. Shutting down gracefully...');
      await supabase.auth.signOut();
      process.exit(0);
    });

    process.on('SIGINT', async () => {
      logger.info('SIGINT received. Shutting down gracefully...');
      await supabase.auth.signOut();
      process.exit(0);
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught exception:', error);
      process.exit(1);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled rejection at:', promise, 'reason:', reason);
      process.exit(1);
    });

  } catch (error) {
    logger.error('Failed to initialize application:', error);
    process.exit(1);
  }
}

// Start the application
initializeApp(); 