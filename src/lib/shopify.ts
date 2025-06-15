import Shopify from 'shopify-api-node';
import { db } from './supabase';

class ShopifyClient {
  private clients: Map<string, Shopify> = new Map();

  public async forShop(shopDomain: string): Promise<Shopify> {
    if (this.clients.has(shopDomain)) {
      return this.clients.get(shopDomain)!;
    }

    const { data: shop } = await db.shopify_shops.getByShopDomain(shopDomain);
    if (!shop || !shop.access_token) {
      throw new Error(`No access token found for shop: ${shopDomain}`);
    }

    const client = new Shopify({
      shopName: shopDomain,
      accessToken: shop.access_token,
      apiVersion: '2023-01'
    });

    this.clients.set(shopDomain, client);
    return client;
  }
}

export const shopifyClient = new ShopifyClient(); 