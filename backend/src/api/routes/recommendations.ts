import { Router } from 'express';
import { getRecommendations } from '../../modules/product_recommendations/recommender';

const router = Router();

// GET /api/recommendations/user/:userId
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) return res.status(400).json({ error: 'userId is required' });
    const recommendations = await getRecommendations(userId);
    res.json({ recommendations });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router; 