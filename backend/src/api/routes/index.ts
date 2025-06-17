import { Router } from 'express';
import { verifyShopifySession } from '../middleware/shopify-auth';
import analysisRoutes from './analysis.routes';
import brandRoutes from './brand.routes';
import contentRoutes from './content.routes';
import performanceRoutes from './performance.routes';
import productsRoutes from './products.routes';
import securityRoutes from './security.routes';
import settingsRoutes from './settings.routes';
import trialsRoutes from './trials.routes';
import webhookRoutes from './webhooks.routes';

const router = Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Public webhook endpoints
router.use('/webhooks', webhookRoutes);

// Protected API routes (require Shopify session)
router.use('/brands', verifyShopifySession, brandRoutes);
router.use('/analysis', verifyShopifySession, analysisRoutes);
router.use('/products', verifyShopifySession, productsRoutes);
router.use('/performance', verifyShopifySession, performanceRoutes);
router.use('/trials', verifyShopifySession, trialsRoutes);
router.use('/security', verifyShopifySession, securityRoutes);
router.use('/settings', verifyShopifySession, settingsRoutes);
router.use('/content', verifyShopifySession, contentRoutes);

export default router; 