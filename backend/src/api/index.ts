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
import authenticationRoutes from './authentication';
import aiRoutes from './routes/ai';
import analyticsRoutes from './routes/analytics';
import approvalRoutes from './routes/approval';
import bookIngestionRoutes from './routes/book-ingestion.routes';
import brandDnaRoutes from './routes/brand-dna';
import campaignsRoutes from './routes/campaigns';
import chatRoutes from './routes/chat';
import chatbotRoutes from './routes/chatbot';
import contentRoutes from './routes/content';
import dashboardRoutes from './routes/dashboard';
import healthRoutes from './routes/health';
import marketRoutes from './routes/market';
import memoryRoutes from './routes/memory.routes';
import notificationRoutes from './routes/notifications';
import performanceRoutes from './routes/performance';
import segmentsRoutes from './routes/segments';
import shopifyRoutes from './routes/shopify';
import socialRoutes from './routes/social';
import testDeployRoutes from './routes/test-deploy.routes';
import testingRoutes from './routes/testing';
import userRoutes from './routes/user';
import visualBuilderRoutes from './routes/visual-builder.routes';
import workflowRoutes from './routes/workflows';

// Create Express app
export const app = express();

// Apply middleware
app.use(helmet()); // Security headers
app.use(cors({
  origin: config.CORS_ORIGIN,
  credentials: true
}));
app.use(compression()); // Compress responses
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(rateLimiter); // Rate limiting
// Note: shopifyAuth middleware removed from global scope
app.use(validateRequest); // Request validation

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// API routes
app.use('/api/ai', aiRoutes);
app.use('/api/approval', approvalRoutes);
app.use('/api', authenticationRoutes); // Auth routes
app.use('/api/analytics', analyticsRoutes);
app.use('/api/books', bookIngestionRoutes);
app.use('/api/brand-dna', brandDnaRoutes);
app.use('/api/campaigns', campaignsRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/memory', memoryRoutes);
app.use('/api/segments', segmentsRoutes);
app.use('/api/shopify', shopifyAuth, shopifyRoutes);
app.use('/api/social', socialRoutes);
app.use('/api/testing', testingRoutes);
app.use('/api/test-deploy', testDeployRoutes);
app.use('/api/user', userRoutes);
app.use('/api/visual-builder', visualBuilderRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/performance', performanceRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/workflows', workflowRoutes);

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