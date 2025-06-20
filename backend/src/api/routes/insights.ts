import { Router } from 'express';
import { getInsightsMetrics } from '../../modules/insights/dashboard';

const router = Router();

// GET /api/insights/metrics
router.get('/metrics', async (req, res) => {
  try {
    const metrics = await getInsightsMetrics();
    res.json(metrics);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router; 