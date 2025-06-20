import { Router } from 'express';
import { generateAdCopy } from '../../modules/ads/generator';

const router = Router();

// POST /api/ad-generator/generate
router.post('/generate', async (req, res) => {
  try {
    const { productName, productDetails } = req.body;
    if (!productName || !productDetails) return res.status(400).json({ error: 'productName and productDetails are required' });
    const adCopy = await generateAdCopy(productName, productDetails);
    res.json({ adCopy });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router; 