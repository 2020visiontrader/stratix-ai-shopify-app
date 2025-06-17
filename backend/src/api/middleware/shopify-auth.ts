import crypto from 'crypto';
import { NextFunction, Request, Response } from 'express';

export interface ShopifyRequest extends Request {
  shop?: string;
  shopDomain?: string;
  shopify?: {
    session: any;
    shop: string;
    accessToken: string;
  };
}

// Verify Shopify webhook signatures
export const verifyShopifyWebhook = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hmac = req.headers['x-shopify-hmac-sha256'] as string;
    const topic = req.headers['x-shopify-topic'] as string;
    const shopDomain = req.headers['x-shopify-shop-domain'] as string;

    if (!hmac || !topic || !shopDomain) {
      return res.status(401).json({ error: 'Missing required headers' });
    }

    const rawBody = JSON.stringify(req.body);
    const hash = crypto
      .createHmac('sha256', process.env.SHOPIFY_API_SECRET!)
      .update(rawBody, 'utf8')
      .digest('base64');

    if (hash !== hmac) {
      return res.status(401).json({ error: 'Invalid webhook signature' });
    }

    // Attach shop domain to request for handlers
    (req as any).shopDomain = shopDomain;
    next();
  } catch (error) {
    console.error('Webhook verification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Verify shop has valid session and access
export const verifyShopifySession = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const shopDomain = req.query.shop as string;
    
    if (!shopDomain) {
      return res.status(401).json({ error: 'Missing shop parameter' });
    }

    // Mock shop verification - replace with actual Supabase query
    const shop = { id: shopDomain, access_token: 'mock-token' };

    // Attach shop data to request for route handlers
    (req as any).shop = shop;
    next();
  } catch (error) {
    console.error('Shop verification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}; 