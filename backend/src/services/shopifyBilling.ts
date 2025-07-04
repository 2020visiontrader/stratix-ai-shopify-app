import { db } from '../lib/database';
import { sendBillingFailAlert } from '../utils/slackAlerts';

interface BillingActivationResult {
  success: boolean;
  error?: string;
  charge_id?: string;
  activationUrl?: string;
  chargeId?: string;
}

export class ShopifyBilling {
  private static instance: ShopifyBilling;
  private retryDelayMs = 1000 * 60 * 5; // 5 minutes
  private maxRetries = 3;

  private constructor() {}

  public static getInstance(): ShopifyBilling {
    if (!ShopifyBilling.instance) {
      ShopifyBilling.instance = new ShopifyBilling();
    }
    return ShopifyBilling.instance;
  }

  public async checkTrialExpiration(brandId: string): Promise<void> {
    try {
      const brand = await db.brands.getById(brandId);
      if (!brand) throw new Error('Brand not found');

      const trialEndDate = new Date(brand.trial_start_date);
      trialEndDate.setDate(trialEndDate.getDate() + 7);

      if (new Date() >= trialEndDate) {
        await this.activateBilling(brandId);
      }
    } catch (error) {
      console.error('Error checking trial expiration:', error);
      throw error;
    }
  }

  private async activateBilling(brandId: string): Promise<void> {
    try {
      // Check if already upgraded
      const brand = await db.brands.getById(brandId);
      if (!brand) throw new Error('Brand not found');

      if (brand.billing_active) {
        console.log('Billing already active for brand:', brandId);
        return;
      }

      // Get shop details
      const shop = await db.shops.getByBrandId(brandId);
      if (!shop) throw new Error('Shop not found');

      // Try to activate billing
      let result = await this.tryActivateBilling(shop.shop_domain, brand.plan);
      let retries = 0;

      while (!result.success && retries < this.maxRetries) {
        await this.delay(this.retryDelayMs);
        result = await this.tryActivateBilling(shop.shop_domain, brand.plan);
        retries++;
      }

      if (!result.success) {
        await this.handleBillingFailure(brand, result.error || 'Unknown error');
        return;
      }

      // Update brand billing status
      await db.brands.update(brandId, {
        billing_active: true,
        billing_charge_id: result.charge_id
      });

      // Create billing activation event
      await db.events.create({
        type: 'BILLING_ACTIVATED',
        brand_id: brandId,
        payload: {
          charge_id: result.charge_id,
          plan: brand.plan,
          activated_at: new Date()
        }
      });
    } catch (error) {
      console.error('Error activating billing:', error);
      throw error;
    }
  }

  private async tryActivateBilling(shopDomain: string, plan: string): Promise<BillingActivationResult> {
    try {
      // Mock implementation - would need actual session for real Shopify API calls
      console.log('Attempting to activate billing for shop:', shopDomain, 'plan:', plan);
      
      // In a real implementation, you would create a session and use it with the Shopify API
      // const session = await loadSession(shopDomain);
      // const client = new shopify.clients.Rest({session});
      
      return {
        success: true,
        activationUrl: `https://example.com/activate-billing?shop=${shopDomain}&plan=${plan}`,
        chargeId: `charge_${Date.now()}`
      };
    } catch (error) {
      console.error('Error creating billing charge:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private getPlanPrice(plan: string): number {
    switch (plan.toLowerCase()) {
      case 'essential':
        return 29.99;
      case 'growth':
        return 99.99;
      case 'enterprise':
        return 299.99;
      default:
        throw new Error(`Invalid plan: ${plan}`);
    }
  }

  private async handleBillingFailure(brand: any, reason: string): Promise<void> {
    // Send alert
    await sendBillingFailAlert(brand, reason);

    // Freeze new generations
    await db.brands.update(brand.id, {
      settings: {
        ...(brand.settings || {}),
        feature_locks: {
          autopilot: true,
          bulk_operations: true,
          advanced_analytics: true,
          content_generation: true
        }
      }
    });

    // Create billing failure event
    await db.events.create({
      type: 'BILLING_FAILED',
      brand_id: brand.id,
      payload: {
        reason,
        timestamp: new Date()
      }
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
} 