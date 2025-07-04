import { Router } from 'express';
import { db } from '../lib/database';
import { verifyAdmin } from '../middleware/auth';

const router = Router();

interface OverrideRequest {
  brandId: string;
  overrideType: 'usage' | 'billing' | 'lockout';
  expiryDate?: string;
  notes?: string;
}

router.post('/admin/override', verifyAdmin, async (req, res) => {
  try {
    const { brandId, overrideType, expiryDate, notes }: OverrideRequest = req.body;

    // Validate request
    if (!brandId || !overrideType) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get brand
    const brand = await db.brands.getById(brandId);
    if (!brand) {
      return res.status(404).json({ error: 'Brand not found' });
    }

    // Create override record
    await db.events.create({
      type: 'ADMIN_OVERRIDE',
      brand_id: brandId,
      payload: {
        override_type: overrideType,
        expiry_date: expiryDate,
        notes,
        admin_id: req.user?.id || 'unknown',
        timestamp: new Date()
      }
    });

    // Apply override
    switch (overrideType) {
      case 'usage':
        await handleUsageOverride(brandId);
        break;
      case 'billing':
        await handleBillingOverride(brandId);
        break;
      case 'lockout':
        await handleLockoutOverride(brandId);
        break;
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error applying admin override:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

async function handleUsageOverride(brandId: string): Promise<void> {
  // TODO: Implement usage counter reset and overage clearing
}

async function handleBillingOverride(brandId: string): Promise<void> {
  await db.brands.update(brandId, {
    billing_active: true,
    trial_start_date: new Date() // Reset trial period
  });
}

async function handleLockoutOverride(brandId: string): Promise<void> {
  // TODO: Implement lockout override
}

router.get('/admin/overrides/:brandId', verifyAdmin, async (req, res) => {
  try {
    // TODO: Implement fetching overrides by type when db accessor is available
    res.json({ overrides: [] });
  } catch (error) {
    console.error('Error fetching overrides:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router; 