import compression from 'compression';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import helmet from 'helmet';
import jwt from 'jsonwebtoken';
import morgan from 'morgan';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

// Import routes
import analysisRoutes from './api/routes/analysis.routes';
import securityRoutes from './api/routes/security.routes';
import trialsRoutes from './api/routes/trials.routes';

// Import services
import { apiRateLimit } from './api/middleware/rateLimit';
import { authMiddleware } from './middleware/auth';
import { DatabaseService } from './services/DatabaseService';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Database service
const dbService = DatabaseService.getInstance();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "https://api.openai.com"]
    }
  }
}));

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:3001',
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Compression middleware
app.use(compression());

// Logging middleware
app.use(morgan('combined'));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Global rate limiting
app.use(apiRateLimit);

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const dbHealth = await dbService.healthCheck();
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: dbHealth,
      version: process.env.npm_package_version || '1.0.0'
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// API routes
app.use('/api/analysis', analysisRoutes);
app.use('/api/trials', trialsRoutes);
app.use('/api/security', securityRoutes);

// Authentication endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, shopDomain } = req.body;
    
    if (!email || !shopDomain) {
      return res.status(400).json({
        success: false,
        error: 'Email and shop domain are required'
      });
    }

    // Check if user exists, create if not
    let user = await dbService.getUserByEmail(email);
    
    if (!user) {
      user = await dbService.createUser({
        email,
        shopDomain,
        name: email.split('@')[0]
      });
    }

    // Generate JWT token (simplified for demo)
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return res.status(500).json({ error: 'JWT secret not configured' });
    }
    
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      jwtSecret,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        shopDomain: user.shopDomain
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed'
    });
  }
});

// User profile endpoint
app.get('/api/user/profile', authMiddleware, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const user = await dbService.getUserById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        shopDomain: user.shopDomain,
        trial: user.trial,
        subscription: user.subscription,
        settings: user.settings
      }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve profile'
    });
  }
});

// Notifications endpoint
app.get('/api/notifications', authMiddleware, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const { page = 1, limit = 20, unreadOnly = false } = req.query;
    
    const notifications = await dbService.getUserNotifications(req.user.id, {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      unreadOnly: unreadOnly === 'true'
    });

    res.json({
      success: true,
      data: notifications
    });

  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve notifications'
    });
  }
});

// Mark notification as read
app.put('/api/notifications/:notificationId/read', authMiddleware, async (req, res) => {
  try {
    const { notificationId } = req.params;
    
    await dbService.markNotificationAsRead(notificationId);

    res.json({
      success: true,
      message: 'Notification marked as read'
    });

  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark notification as read'
    });
  }
});

// Error handling middleware
app.use((err: any, req: any, res: any, next: any) => {
  console.error('Unhandled error:', err);
  
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await dbService.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  await dbService.disconnect();
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Stratix AI Backend Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 CORS Origin: ${corsOptions.origin}`);
  
  // Run database cleanup on startup
  dbService.cleanupExpiredData().catch(console.error);
});

export default app;
