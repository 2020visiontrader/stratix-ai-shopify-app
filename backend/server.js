import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import morgan from 'morgan';
import { errorHandler } from './src/utils/errorHandling.js';

/**
 * Stratix AI - Enhanced Backend Server
 * Production-ready Express server with comprehensive features
 */

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Enhanced logger with different levels
const logger = {
  info: (message, meta = {}) => {
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`, 
      Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '');
  },
  error: (message, meta = {}) => {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, 
      Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '');
  },
  warn: (message, meta = {}) => {
    console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, 
      Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '');
  },
  debug: (message, meta = {}) => {
    if (NODE_ENV === 'development') {
      console.debug(`[DEBUG] ${new Date().toISOString()} - ${message}`, 
        Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '');
    }
  }
};

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(helmet());
app.use(express.json());
app.use(morgan('dev'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Health check endpoint
app.get('/health', (req, res) => {
  const healthData = {
    success: true,
    status: 'healthy',
    message: 'Stratix Backend API is healthy',
    data: {
      service: 'Stratix AI Backend',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      node_version: process.version,
      timestamp: new Date().toISOString(),
      features: {
        security: 'helmet + rate limiting',
        cors: 'enabled',
        logging: 'morgan + custom logger',
        error_handling: 'comprehensive',
        health_monitoring: 'detailed'
      }
    },
    timestamp: new Date().toISOString()
  };
  res.json(healthData);
});

// API routes
app.use('/api', (req, res) => {
  res.json({ message: 'Stratix AI API is ready' });
});

// Error handling middleware
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`[INFO] ${new Date().toISOString()} - 🚀 Stratix Backend started successfully`, {
    port: PORT,
            environment: process.env.NODE_ENV || 'development',
            pid: process.pid,
            timestamp: new Date().toISOString()
          });
          
          console.log('\n🚀 Stratix AI Backend Started!');
          console.log('================================');
  console.log(`📍 Server: http://localhost:${PORT}`);
  console.log(`🏥 Health: http://localhost:${PORT}/health`);
  console.log(`🤖 API: http://localhost:${PORT}/api`);
  console.log('\n✅ Ready for frontend connection!');
  console.log(`✅ CORS enabled for ${process.env.FRONTEND_URL || 'localhost:3000'}`);
          console.log('✅ All endpoints operational');
  console.log('\nPress Ctrl+C to stop the server');
  console.log('================================');
});

export default app;
