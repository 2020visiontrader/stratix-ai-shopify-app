import { Router } from 'express';
import { verifyShopifyWebhook } from '../middleware/shopify-auth';
import {
    handleAppInstalled,
    handleAppUninstalled,
    handleProductCreated,
    handleProductDeleted,
    handleProductUpdated
} from '../webhooks/shopify';

const router = Router();

// Shopify webhooks
router.post('/installed', handleAppInstalled);
router.post('/uninstalled', verifyShopifyWebhook, handleAppUninstalled);
router.post('/product-created', verifyShopifyWebhook, handleProductCreated);
router.post('/product-updated', verifyShopifyWebhook, handleProductUpdated);
router.post('/product-deleted', verifyShopifyWebhook, handleProductDeleted);

export default router; 