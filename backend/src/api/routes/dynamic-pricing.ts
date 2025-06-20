import { Router } from 'express';
import { runDynamicPricing } from '../../modules/pricing/dynamicPricing';

const router = Router();

// POST /api/dynamic-pricing/run
router.post('/run', async (req, res) => {
  try {
    await runDynamicPricing();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router; 