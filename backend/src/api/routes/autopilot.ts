import { Router } from 'express';
import { isAutopilot, setAutopilot } from '../../modules/autopilot_toggle/toggle';

const router = Router();

// POST /api/autopilot/set
router.post('/set', async (req, res) => {
  try {
    const { userId, enabled } = req.body;
    if (!userId || typeof enabled !== 'boolean') return res.status(400).json({ error: 'userId and enabled(boolean) are required' });
    await setAutopilot(userId, enabled);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// GET /api/autopilot/status/:userId
router.get('/status/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) return res.status(400).json({ error: 'userId is required' });
    const enabled = await isAutopilot(userId);
    res.json({ enabled });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router; 