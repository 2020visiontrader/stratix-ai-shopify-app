import { NextFunction, Request, Response } from 'express';
import { db } from '../lib/database';

interface RestrictedEndpoint {
  path: string;
  feature: 'ad_generator' | 'store_rewrite' | 'prompt_tuning' | 'visual_swap';
  usageMetric: 'ai_tokens' | 'storage_gb' | 'variants_tested';
}

const RESTRICTED_ENDPOINTS: RestrictedEndpoint[] = [
  { path: '/generate', feature: 'ad_generator', usageMetric: 'ai_tokens' },
  { path: '/rewrite', feature: 'store_rewrite', usageMetric: 'ai_tokens' },
  { path: '/tune', feature: 'prompt_tuning', usageMetric: 'ai_tokens' },
  { path: '/visual', feature: 'visual_swap', usageMetric: 'storage_gb' }
];

const PLAN_LIMITS = {
  essential: {
    ai_tokens: 100000,
    storage_gb: 5,
    variants_tested: 50
  },
  growth: {
    ai_tokens: 500000,
    storage_gb: 20,
    variants_tested: 200
  },
  enterprise: {
    ai_tokens: 2000000,
    storage_gb: 100,
    variants_tested: 1000
  }
};

export async function enforcePlanLimits(req: Request, res: Response, next: NextFunction) {
  try {
    const brandId = req.headers['x-brand-id'] as string;
    if (!brandId) {
      return res.status(400).json({ error: 'Brand ID is required' });
    }

    // Get the endpoint configuration
    const endpoint = RESTRICTED_ENDPOINTS.find(e => req.path.startsWith(e.path));
    if (!endpoint) {
      return next();
    }

    // Get brand's plan and usage
    const brand = await db.brands.getById(brandId);
    if (!brand) {
      return res.status(404).json({ error: 'Brand not found' });
    }

    // TODO: Implement usage fetching when db accessor is available
    // const usage = await db.brand_usage.getByBrandId(brandId);
    const usage = null;
    if (!usage) {
      return res.status(404).json({ error: 'Usage data not found' });
    }

    // TODO: Implement config fetching when db accessor is available
    // const config = await db.brand_configs.getByBrandId(brandId);
    const config: any = null;

    // Check for admin override
    if (config?.lockout_override) {
      return next();
    }

    // Get plan limits
    const planLimits = PLAN_LIMITS[brand.plan as keyof typeof PLAN_LIMITS];
    if (!planLimits) {
      return res.status(400).json({ error: 'Invalid plan' });
    }

    // Check if over limit
    const currentUsage = usage[endpoint.usageMetric];
    const limit = planLimits[endpoint.usageMetric];

    if (currentUsage >= limit) {
      // Log overage alert
      await db.events.create({
        type: 'USAGE_LIMIT_REACHED',
        brand_id: brandId,
        payload: {
          feature: endpoint.feature,
          metric: endpoint.usageMetric,
          current_usage: currentUsage,
          limit,
          timestamp: new Date()
        }
      });

      return res.status(402).json({
        error: 'Usage limit exceeded',
        feature: endpoint.feature,
        current_usage: currentUsage,
        limit,
        upgrade_url: `${process.env.APP_URL}/billing/upgrade`
      });
    }

    // If within limits, proceed
    next();
  } catch (error) {
    console.error('Error enforcing plan limits:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export function applyPlanLimits(app: any) {
  // Apply to all restricted endpoints
  RESTRICTED_ENDPOINTS.forEach(endpoint => {
    app.use(endpoint.path, enforcePlanLimits);
  });
} 