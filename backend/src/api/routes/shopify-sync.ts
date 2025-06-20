import { Router } from 'express';
import { syncStoreData } from '../../modules/shopify/shopifySync';

const router = Router();

// GET /api/shopify-sync/sync
router.get('/sync', async (req, res) => {
  try {
    const { products, orders } = await syncStoreData();
    res.json({ products, orders });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router; 