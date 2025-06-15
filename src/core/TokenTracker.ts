import { db } from '../lib/supabase';
import { EscalationEngine } from './EscalationEngine';

interface TokenUsage {
  operation: 'ad_generation' | 'prompt_tuning' | 'content_rewrite' | 'visual_creation';
  tokens: number;
  cost?: number;
}

const PLAN_TOKEN_LIMITS = {
  essential: 100000,
  growth: 500000,
  enterprise: 2000000
};

const TOKEN_COST_PER_1K = 0.02; // $0.02 per 1000 tokens

export class TokenTracker {
  private static instance: TokenTracker;
  
  private constructor() {}

  public static getInstance(): TokenTracker {
    if (!TokenTracker.instance) {
      TokenTracker.instance = new TokenTracker();
    }
    return TokenTracker.instance;
  }

  public async trackUsage(brandId: string, usage: TokenUsage): Promise<void> {
    try {
      // Get current usage and brand info
      const [{ data: currentUsage }, { data: brand }] = await Promise.all([
        db.brand_usage.getByBrandId(brandId),
        db.brands.getById(brandId)
      ]);

      if (!currentUsage || !brand) {
        throw new Error('Usage data or brand not found');
      }

      // Calculate new total
      const newTotal = currentUsage.ai_tokens_used + usage.tokens;

      // Update usage
      await db.brand_usage.update(brandId, {
        ai_tokens_used: newTotal,
        last_updated: new Date()
      });

      // Log usage event
      await db.events.create({
        type: 'TOKEN_USAGE',
        brand_id: brandId,
        payload: {
          operation: usage.operation,
          tokens_used: usage.tokens,
          new_total: newTotal,
          timestamp: new Date()
        }
      });

      // Check against plan limits
      const planLimit = PLAN_TOKEN_LIMITS[brand.plan as keyof typeof PLAN_TOKEN_LIMITS];
      if (!planLimit) {
        throw new Error('Invalid plan');
      }

      // Handle overage
      if (newTotal > planLimit) {
        await this.handleOverage(brandId, {
          current: newTotal,
          limit: planLimit,
          operation: usage.operation
        });
      }

      // Check if approaching limit (80%)
      if (newTotal > planLimit * 0.8 && newTotal <= planLimit) {
        await this.sendLimitWarning(brandId, {
          current: newTotal,
          limit: planLimit,
          percentUsed: Math.round((newTotal / planLimit) * 100)
        });
      }

    } catch (error) {
      console.error('Error tracking token usage:', error);
      throw error;
    }
  }

  private async handleOverage(brandId: string, data: {
    current: number;
    limit: number;
    operation: TokenUsage['operation'];
  }): Promise<void> {
    const overage = data.current - data.limit;
    const overageCost = (overage / 1000) * TOKEN_COST_PER_1K;

    // Create overage record
    await db.brand_overages.create({
      brand_id: brandId,
      feature: 'ai_tokens',
      current_usage: data.current,
      limit_value: data.limit,
      timestamp: new Date()
    });

    // Escalate incident
    await EscalationEngine.getInstance().escalateIncident({
      type: 'TOKEN_DEPLETION',
      brand_id: brandId,
      severity: 'high',
      details: {
        current_usage: data.current,
        plan_limit: data.limit,
        overage_tokens: overage,
        overage_cost: overageCost,
        operation: data.operation,
        timestamp: new Date()
      },
      timestamp: new Date()
    });
  }

  private async sendLimitWarning(brandId: string, data: {
    current: number;
    limit: number;
    percentUsed: number;
  }): Promise<void> {
    // Log warning event
    await db.events.create({
      type: 'TOKEN_LIMIT_WARNING',
      brand_id: brandId,
      payload: {
        current_usage: data.current,
        plan_limit: data.limit,
        percent_used: data.percentUsed,
        timestamp: new Date()
      }
    });

    // Get brand for notification
    const { data: brand } = await db.brands.getById(brandId);
    if (!brand) return;

    // Get associated shop for contact info
    const { data: shops } = await db.shopify_shops.getByBrandId(brandId);
    if (!shops?.length) return;

    // Send notification
    await EscalationEngine.getInstance().escalateIncident({
      type: 'TOKEN_DEPLETION',
      brand_id: brandId,
      severity: 'medium',
      details: {
        current_usage: data.current,
        plan_limit: data.limit,
        percent_used: data.percentUsed,
        shop_email: shops[0].email,
        timestamp: new Date()
      },
      timestamp: new Date()
    });
  }
} 