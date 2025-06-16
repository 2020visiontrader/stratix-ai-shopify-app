import { Router } from 'express';
import { verifyShopifySession } from '../middleware/shopify-auth';
import brandRoutes from './brand.routes';
import webhookRoutes from './webhooks.routes';

const router = Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Public webhook endpoints
router.use('/webhooks', webhookRoutes);

// Protected brand routes
router.use('/brands', verifyShopifySession, brandRoutes);

export default router; 