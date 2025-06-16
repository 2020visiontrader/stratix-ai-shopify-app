import crypto from 'crypto';
import { Router } from 'express';
import { EscalationEngine } from '../core/EscalationEngine';
import { db } from '../lib/supabase';
import { sendEmail } from '../utils/email';

const router = Router();

interface BillingWebhookPayload {
  app_subscription: {
    admin_graphql_api_id: string;
    name: string;
    status: 'active' | 'cancelled' | 'frozen' | 'pending';
    admin_graphql_api_shop_id: string;
    created_at: string;
    updated_at: string;
    test: boolean;
  };
  shop_domain: string;
}

router.post('/webhooks/shopify/billing', async (req, res) => {
  try {
    // Verify webhook signature
    const hmac = req.headers['x-shopify-hmac-sha256'] as string;
    const topic = req.headers['x-shopify-topic'] as string;
    
    if (!hmac || topic !== 'app_subscriptions/update') {
      return res.status(401).json({ error: 'Invalid webhook signature or topic' });
    }

    const generated = crypto
      .createHmac('sha256', process.env.SHOPIFY_WEBHOOK_SECRET || '')
      .update(JSON.stringify(req.body))
      .digest('base64');

    if (generated !== hmac) {
      return res.status(401).json({ error: 'Invalid webhook signature' });
    }

    const payload = req.body as BillingWebhookPayload;

    // Get shop and associated brand
    const { data: shop } = await db.shopify_shops.getByShopDomain(payload.shop_domain);
    if (!shop) {
      return res.status(404).json({ error: 'Shop not found' });
    }

    // Update brand billing status
    const { data: brand } = await db.brands.getById(shop.brand_id);
    if (!brand) {
      return res.status(404).json({ error: 'Brand not found' });
    }

    const status = payload.app_subscription.status;
    const planName = payload.app_subscription.name.toLowerCase();

    await db.brands.update(shop.brand_id, {
      billing_active: status === 'active',
      plan: planName
    });

    // Handle cancellation
    if (status === 'cancelled') {
      // Lock brand features
      await db.brand_configs.update(shop.brand_id, {
        feature_locks: {
          autopilot: true,
          bulk_operations: true,
          advanced_analytics: true
        }
      });

      // Send cancellation email
      await sendEmail({
        to: shop.email,
        template: 'subscription-cancelled',
        data: {
          shop_name: shop.store_name,
          reactivate_url: `${process.env.APP_URL}/billing/reactivate?shop=${shop.shop_domain}`
        }
      });

      // Escalate incident
      await EscalationEngine.getInstance().escalateIncident({
        type: 'BILLING_FAILURE',
        brand_id: shop.brand_id,
        severity: 'high',
        details: {
          shop_domain: shop.shop_domain,
          plan_name: planName,
          cancelled_at: new Date()
        },
        timestamp: new Date()
      });
    }

    // Log billing event
    await db.events.create({
      type: 'BILLING_STATUS_CHANGE',
      brand_id: shop.brand_id,
      payload: {
        status,
        plan: planName,
        shop_domain: payload.shop_domain,
        timestamp: new Date()
      }
    });

    res.sendStatus(200);
  } catch (error) {
    console.error('Error processing billing webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router; 