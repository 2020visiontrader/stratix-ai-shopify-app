import { db } from '../lib/supabase';

interface UsageLimits {
  ai_tokens: number;
  storage_gb: number;
  shopify_stores: number;
  monthly_visitors: number;
  variants_tested: number;
}

interface UsageMetrics {
  ai_tokens_used: number;
  storage_used_gb: number;
  stores_connected: number;
  visitors_this_month: number;
  variants_tested: number;
  last_updated: Date;
}

interface OverageAlert {
  feature: keyof UsageMetrics;
  current_usage: number;
  limit: number;
  timestamp: Date;
}

const PLAN_LIMITS: Record<string, UsageLimits> = {
  essential: {
    ai_tokens: 100000,
    storage_gb: 5,
    shopify_stores: 1,
    monthly_visitors: 10000,
    variants_tested: 50
  },
  growth: {
    ai_tokens: 500000,
    storage_gb: 20,
    shopify_stores: 3,
    monthly_visitors: 50000,
    variants_tested: 200
  },
  enterprise: {
    ai_tokens: 2000000,
    storage_gb: 100,
    shopify_stores: 10,
    monthly_visitors: 500000,
    variants_tested: 1000
  }
};

export class UsageTracker {
  private static instance: UsageTracker;
  
  private constructor() {}

  public static getInstance(): UsageTracker {
    if (!UsageTracker.instance) {
      UsageTracker.instance = new UsageTracker();
    }
    return UsageTracker.instance;
  }

  public async trackTokenUsage(brandId: string, tokens: number): Promise<void> {
    await this.incrementUsage(brandId, 'ai_tokens_used', tokens);
  }

  public async trackStorageUsage(brandId: string, sizeInMb: number): Promise<void> {
    const sizeInGb = sizeInMb / 1024;
    await this.incrementUsage(brandId, 'storage_used_gb', sizeInGb);
  }

  public async trackStoreConnection(brandId: string): Promise<void> {
    await this.incrementUsage(brandId, 'stores_connected', 1);
  }

  public async trackVisitor(brandId: string): Promise<void> {
    await this.incrementUsage(brandId, 'visitors_this_month', 1);
  }

  public async trackVariantTested(brandId: string): Promise<void> {
    await this.incrementUsage(brandId, 'variants_tested', 1);
  }

  private async incrementUsage(brandId: string, metric: keyof UsageMetrics, amount: number): Promise<void> {
    try {
      const { data: brand } = await db.brands.getById(brandId);
      if (!brand) throw new Error('Brand not found');

      const { data: usage } = await db.brand_usage.getByBrandId(brandId);
      if (!usage) {
        await this.initializeUsage(brandId);
        return;
      }

      const updatedMetric = (usage[metric] || 0) + amount;
      await db.brand_usage.update(usage.id, {
        [metric]: updatedMetric,
        last_updated: new Date()
      });

      await this.checkOverage(brandId, metric, updatedMetric);
    } catch (error) {
      console.error(`Error tracking usage for ${metric}:`, error);
      throw error;
    }
  }

  private async initializeUsage(brandId: string): Promise<void> {
    await db.brand_usage.create({
      brand_id: brandId,
      ai_tokens_used: 0,
      storage_used_gb: 0,
      stores_connected: 0,
      visitors_this_month: 0,
      variants_tested: 0,
      last_updated: new Date()
    });
  }

  private async checkOverage(brandId: string, metric: keyof UsageMetrics, currentUsage: number): Promise<void> {
    try {
      const { data: brand } = await db.brands.getById(brandId);
      if (!brand?.plan) throw new Error('Brand plan not found');

      const limits = PLAN_LIMITS[brand.plan];
      if (!limits) throw new Error('Invalid plan');

      const limit = limits[metric.replace('_used', '').replace('this_month', '') as keyof UsageLimits];
      
      if (currentUsage > limit) {
        await this.handleOverage(brandId, metric, currentUsage, limit);
      }
    } catch (error) {
      console.error('Error checking overage:', error);
      throw error;
    }
  }

  private async handleOverage(brandId: string, feature: keyof UsageMetrics, currentUsage: number, limit: number): Promise<void> {
    try {
      // Log overage
      await db.brand_overages.create({
        brand_id: brandId,
        feature,
        current_usage: currentUsage,
        limit,
        timestamp: new Date()
      });

      // Get brand config to check if this is first overage
      const { data: overages } = await db.brand_overages.getByFeature(brandId, feature);
      const isFirstOverage = !overages || overages.length === 1;

      if (isFirstOverage) {
        // Send alert
        await db.events.create({
          type: 'USAGE_OVERAGE_ALERT',
          brand_id: brandId,
          payload: {
            feature,
            current_usage: currentUsage,
            limit,
            timestamp: new Date()
          }
        });

        // For essential plan, optionally lock non-critical features
        const { data: brand } = await db.brands.getById(brandId);
        if (brand?.plan === 'essential') {
          await this.lockNonCriticalFeatures(brandId);
        }
      }
    } catch (error) {
      console.error('Error handling overage:', error);
      throw error;
    }
  }

  private async lockNonCriticalFeatures(brandId: string): Promise<void> {
    await db.brand_configs.update(brandId, {
      feature_locks: {
        autopilot: true,
        bulk_operations: true,
        advanced_analytics: true
      }
    });
  }

  public async resetMonthlyMetrics(brandId: string): Promise<void> {
    try {
      const { data: usage } = await db.brand_usage.getByBrandId(brandId);
      if (!usage) return;

      await db.brand_usage.update(usage.id, {
        visitors_this_month: 0,
        last_updated: new Date()
      });
    } catch (error) {
      console.error('Error resetting monthly metrics:', error);
      throw error;
    }
  }

  public async getUsageReport(brandId: string): Promise<UsageMetrics | null> {
    try {
      const { data: usage } = await db.brand_usage.getByBrandId(brandId);
      return usage;
    } catch (error) {
      console.error('Error getting usage report:', error);
      throw error;
    }
  }
} 