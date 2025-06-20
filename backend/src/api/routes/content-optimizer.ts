import { Router } from 'express';
import { optimizeProductDescription } from '../../modules/content/contentOptimizer';

const router = Router();

// POST /api/content-optimizer/optimize
router.post('/optimize', async (req, res) => {
  try {
    const { productId } = req.body;
    if (!productId) return res.status(400).json({ error: 'productId is required' });
    const optimizedDesc = await optimizeProductDescription(productId);
    res.json({ optimizedDesc });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router; 