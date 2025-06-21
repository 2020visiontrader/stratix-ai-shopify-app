import compression from 'compression';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { join } from 'path';
import { StratixEngineIntegration } from './lib/core/StratixEngineIntegration';
import {
    createRateLimiter,
    errorConverter,
    errorHandler,
    notFoundHandler
} from './middleware/error-handler';
import { logger } from './utils/logger';

// Load environment variables
dotenv.config();

// Initialize the Stratix Engine
const initializeStratixEngine = async () => {
  try {
    const stratixEngine = StratixEngineIntegration.getInstance();
    await stratixEngine.initialize();
    logger.info('Stratix Engine initialized successfully');
  } catch (error) {
    logger.error(`Failed to initialize Stratix Engine: ${error instanceof Error ? error.message : String(error)}`);
  }
};

// Create Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Set security HTTP headers
app.use(helmet());

// Parse JSON request body
app.use(express.json({ limit: '10mb' }));

// Parse URL-encoded request body
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Gzip compression
app.use(compression());

// Enable CORS
app.use(cors());

// Request logging
app.use(morgan('combined', {
  stream: { write: (message) => logger.info(message.trim()) }
}));

// Rate limiting for API routes
app.use('/api', createRateLimiter(15 * 60 * 1000, 100));

// API health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Server is healthy',
    timestamp: new Date().toISOString()
  });
});

// Import and mount API routes
import apiRoutes from './routes';
app.use('/api', apiRoutes);

// Serve static files for admin dashboard in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(join(__dirname, '../../frontend/dist')));
}

// Handle 404 routes
app.use(notFoundHandler);

// Convert errors to ApiError
app.use(errorConverter);

// Global error handler
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    // Initialize Stratix Engine
    await initializeStratixEngine();
    
    // Start the server
    app.listen(PORT, () => {
      logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    });
  } catch (error) {
    logger.error(`Server failed to start: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason) => {
  logger.error(`Unhandled Rejection: ${reason instanceof Error ? reason.message : String(reason)}`);
  // Close server & exit process
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error(`Uncaught Exception: ${error.message}`);
  // Close server & exit process
  process.exit(1);
});

export { app, startServer };
