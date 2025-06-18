import compression from 'compression';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { config } from '../config';
import { errorHandler } from './middleware/error';
import { rateLimiter } from './middleware/rateLimiter';
import { shopifyAuth } from './middleware/shopifyAuth';
import { validateRequest } from './middleware/validate';

// Import routes
import aiRoutes from './routes/ai';
import analyticsRoutes from './routes/analytics';
import contentRoutes from './routes/content';
import marketRoutes from './routes/market';
import notificationRoutes from './routes/notifications';
import performanceRoutes from './routes/performance';
import socialRoutes from './routes/social';

// Create Express app
export const app = express();

// Apply middleware
app.use(helmet()); // Security headers
app.use(cors({
  origin: config.get('CORS_ORIGIN'),
  credentials: true
}));
app.use(compression()); // Compress responses
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(rateLimiter); // Rate limiting
app.use(shopifyAuth); // Shopify authentication
app.use(validateRequest); // Request validation

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// API routes
app.use('/api/ai', aiRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/social', socialRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/performance', performanceRoutes);
app.use('/api/market', marketRoutes);

// Error handling
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'NOT_FOUND',
    message: 'The requested resource was not found'
  });
});

// Export for testing
export default app; 