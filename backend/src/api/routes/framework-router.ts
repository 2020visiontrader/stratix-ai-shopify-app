import { Router } from 'express';
import { rewriteWithFrameworks } from '../../modules/prompts/frameworkRouter';

const router = Router();

// POST /api/framework-router/rewrite
router.post('/rewrite', async (req, res) => {
  try {
    const { content, count } = req.body;
    if (!content) return res.status(400).json({ error: 'content is required' });
    const rewrites = await rewriteWithFrameworks(content, count || 3);
    res.json({ rewrites });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router; 