import { Request, Response } from 'express';
import { BrandDNAAnalyzer } from '../../core/intelligence/brand/BrandDNAAnalyzer';
import { db } from '../../lib/supabase';

const brandAnalyzer = BrandDNAAnalyzer.getInstance();

interface ShopifyShopData {
  name: string;
  domain: string;
  email: string;
  plan_name: string;
  shop_owner: string;
  description?: string;
  currency: string;
  timezone: string;
  country_name: string;
}

interface ShopifyWebhookResponse {
  webhook: {
    id: number;
    address: string;
    topic: string;
    format: string;
    created_at: string;
    updated_at: string;
  };
}

export async function handleAppInstalled(req: Request, res: Response): Promise<void> {
  try {
    const { shop_domain, access_token } = req.body;

    // Get shop data from Shopify
    const shopResponse = await fetch(`https://${shop_domain}/admin/api/2024-01/shop.json`, {
      headers: {
        'X-Shopify-Access-Token': access_token
      }
    });

    if (!shopResponse.ok) {
      throw new Error('Failed to fetch shop data from Shopify');
    }

    const { shop } = (await shopResponse.json()) as { shop: ShopifyShopData };

    // Create initial brand profile
    const analysisResult = await brandAnalyzer.analyzeBrandDocument(
      JSON.stringify({
        shopName: shop.name,
        domain: shop.domain,
        email: shop.email,
        plan: shop.plan_name,
        owner: shop.shop_owner,
        description: shop.description || '',
        currency: shop.currency,
        timezone: shop.timezone,
        country: shop.country_name
      })
    );

    const brand = await brandAnalyzer.createBrandProfile(
      shop.name,
      'retail', // Default industry, can be updated later
      analysisResult
    );

    // Store Shopify shop data
    await db.shopify_shops.create({
      brand_id: brand.id,
      shop_domain: shop_domain,
      store_name: shop.name,
      shop_owner: shop.shop_owner,
      email: shop.email,
      plan: shop.plan_name,
      access_token,
      access_scope: req.body.access_scope
    });

    // Register webhooks
    const webhooks = [
      { topic: 'app/uninstalled', address: `${process.env.APP_URL}/api/webhooks/uninstalled` },
      { topic: 'products/create', address: `${process.env.APP_URL}/api/webhooks/product-created` },
      { topic: 'products/update', address: `${process.env.APP_URL}/api/webhooks/product-updated` },
      { topic: 'products/delete', address: `${process.env.APP_URL}/api/webhooks/product-deleted` }
    ];

    for (const webhook of webhooks) {
      const response = await fetch(`https://${shop_domain}/admin/api/2024-01/webhooks.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': access_token
        },
        body: JSON.stringify({
          webhook: {
            topic: webhook.topic,
            address: webhook.address,
            format: 'json'
          }
        })
      });

      if (!response.ok) {
        console.error(`Failed to create webhook for ${webhook.topic}`);
        continue;
      }

      const { webhook: createdWebhook } = (await response.json()) as ShopifyWebhookResponse;

      await db.shopify_webhooks.create({
        shop_id: brand.id,
        topic: webhook.topic,
        address: webhook.address,
        format: 'json'
      });
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error handling app installation:', error);
    res.status(500).json({ error: 'Internal server error during app installation' });
  }
}

export async function handleAppUninstalled(req: Request, res: Response): Promise<void> {
  try {
    const { shop_domain } = req.body;

    // Mark shop as uninstalled
    await db.shopify_shops.markUninstalled(shop_domain);

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error handling app uninstallation:', error);
    res.status(500).json({ error: 'Internal server error during app uninstallation' });
  }
}

export async function handleProductCreated(req: Request, res: Response): Promise<void> {
  try {
    const { shop_domain } = req.headers;
    const product = req.body;

    const { data: shop } = await db.shopify_shops.getByShopDomain(shop_domain as string);
    if (!shop) {
      res.status(404).json({ error: 'Shop not found' });
      return;
    }

    await db.shopify_products.create({
      shop_id: shop.id,
      product_id: product.id,
      title: product.title,
      description: product.body_html,
      product_type: product.product_type,
      vendor: product.vendor,
      handle: product.handle,
      status: product.status,
      variants: product.variants,
      options: product.options,
      images: product.images
    });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error handling product creation:', error);
    res.status(500).json({ error: 'Internal server error during product creation' });
  }
}

export async function handleProductUpdated(req: Request, res: Response): Promise<void> {
  try {
    const { shop_domain } = req.headers;
    const product = req.body;

    const { data: shop } = await db.shopify_shops.getByShopDomain(shop_domain as string);
    if (!shop) {
      res.status(404).json({ error: 'Shop not found' });
      return;
    }

    const { data: existingProduct } = await db.shopify_products.getByShopAndProductId(
      shop.id,
      product.id
    );

    if (existingProduct) {
      await db.shopify_products.update(existingProduct.id, {
        title: product.title,
        description: product.body_html,
        product_type: product.product_type,
        vendor: product.vendor,
        handle: product.handle,
        status: product.status,
        variants: product.variants,
        options: product.options,
        images: product.images
      });
    } else {
      await db.shopify_products.create({
        shop_id: shop.id,
        product_id: product.id,
        title: product.title,
        description: product.body_html,
        product_type: product.product_type,
        vendor: product.vendor,
        handle: product.handle,
        status: product.status,
        variants: product.variants,
        options: product.options,
        images: product.images
      });
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error handling product update:', error);
    res.status(500).json({ error: 'Internal server error during product update' });
  }
}

export async function handleProductDeleted(req: Request, res: Response): Promise<void> {
  try {
    const { shop_domain } = req.headers;
    const { id: productId } = req.body;

    const { data: shop } = await db.shopify_shops.getByShopDomain(shop_domain as string);
    if (!shop) {
      res.status(404).json({ error: 'Shop not found' });
      return;
    }

    await db.shopify_products.deleteByShopAndProductId(shop.id, productId);

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error handling product deletion:', error);
    res.status(500).json({ error: 'Internal server error during product deletion' });
  }
} 