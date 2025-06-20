import { Router } from 'express';
import { runExperiment } from '../../modules/split_testing/experiments';

const router = Router();

// POST /api/split-testing/run
router.post('/run', async (req, res) => {
  try {
    const { userId, experimentKey, variations } = req.body;
    if (!userId || !experimentKey || !variations) return res.status(400).json({ error: 'userId, experimentKey, and variations are required' });
    const result = await runExperiment(userId, experimentKey, variations);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router; 