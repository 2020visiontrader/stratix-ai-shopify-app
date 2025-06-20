import { Router } from 'express';
import { triggerCampaign } from '../../modules/campaign_automation/mautic';

const router = Router();

// POST /api/campaign-automation/trigger
router.post('/trigger', async (req, res) => {
  try {
    const { email, campaignId } = req.body;
    if (!email || !campaignId) return res.status(400).json({ error: 'email and campaignId are required' });
    await triggerCampaign(email, campaignId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router; 