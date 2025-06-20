import { ApiVersion, Session } from '@shopify/shopify-api';
import { shopifyApp } from '@shopify/shopify-app-express';
import { ShopifyAPIError } from '../utils/errors';
import { db } from './database';

// Initialize Shopify App configuration
export const shopify = shopifyApp({
  api: {
    apiKey: process.env.SHOPIFY_API_KEY!,
    apiSecretKey: process.env.SHOPIFY_API_SECRET!,
    scopes: [
      'read_products',
      'write_products',
      'read_orders',
      'read_analytics',
      'write_content',
      'read_customers',
      'write_customers'
    ],
    hostName: process.env.SHOPIFY_APP_URL!,
    apiVersion: ApiVersion.October23,
  },
  auth: {
    path: '/api/auth',
    callbackPath: '/api/auth/callback',
  },
  webhooks: {
    path: '/api/webhooks',
  },
  sessionStorage: {
    storeSession: async (session: Session): Promise<boolean> => {
      try {
        await db.shops.update(session.shop, {
          access_token: session.accessToken,
          status: 'active',
          updated_at: new Date()
        });
        return true;
      } catch (error) {
        throw new ShopifyAPIError('Failed to store session', error);
      }
    },

    loadSession: async (id: string): Promise<Session | undefined> => {
      try {
        const shop = await db.shops.getByShopDomain(id);
        if (!shop) return undefined;

        return new Session({
          id,
          shop: shop.shop_domain,
          state: '',
          isOnline: true,
          accessToken: shop.access_token ?? undefined,
          scope: process.env.SHOPIFY_SCOPES || ''
        });
      } catch (error) {
        throw new ShopifyAPIError('Failed to load session', error);
      }
    },

    deleteSession: async (id: string): Promise<boolean> => {
      try {
        await db.shops.update(id, {
          access_token: null,
          status: 'inactive',
          updated_at: new Date()
        });
        return true;
      } catch (error) {
        throw new ShopifyAPIError('Failed to delete session', error);
      }
    },

    deleteSessions: async (ids: string[]): Promise<boolean> => {
      try {
        // Reference deleteSession directly from the current object
        // @ts-ignore
        const { deleteSession } = shopify.options?.sessionStorage || {};
        if (typeof deleteSession === 'function') {
          await Promise.all(ids.map(id => deleteSession(id)));
        } else {
          // fallback: use the local deleteSession function
          await Promise.all(ids.map(id => (shopify as any).sessionStorage.deleteSession(id)));
        }
        return true;
      } catch (error) {
        throw new ShopifyAPIError('Failed to delete sessions', error);
      }
    },

    findSessionsByShop: async (shop: string): Promise<Session[]> => {
      try {
        const shopData = await db.shops.getByShopDomain(shop);
        if (!shopData) return [];

        return [new Session({
          id: shop,
          shop: shopData.shop_domain,
          state: '',
          isOnline: true,
          accessToken: shopData.access_token ?? undefined,
          scope: process.env.SHOPIFY_SCOPES || ''
        })];
      } catch (error) {
        throw new ShopifyAPIError('Failed to find sessions', error);
      }
    }
  }
});

// Webhook handlers
export const webhookHandlers = {
  'APP_UNINSTALLED': async (topic: string, shop: string, body: string) => {
    try {
      await db.shops.update(shop, {
        status: 'inactive',
        access_token: null,
        updated_at: new Date()
      });

      await db.events.create({
        type: 'APP_UNINSTALLED',
        brand_id: shop,
        payload: {
          timestamp: new Date(),
          shop
        }
      });
    } catch (error) {
      throw new ShopifyAPIError('Failed to handle app uninstall', error);
    }
  },

  'PRODUCTS_CREATE': async (topic: string, shop: string, body: string) => {
    try {
      const product = JSON.parse(body);
      await db.events.create({
        type: 'PRODUCT_CREATED',
        brand_id: shop,
        payload: {
          product_id: product.id,
          timestamp: new Date(),
          shop
        }
      });
    } catch (error) {
      throw new ShopifyAPIError('Failed to handle product creation', error);
    }
  },

  'PRODUCTS_UPDATE': async (topic: string, shop: string, body: string) => {
    try {
      const product = JSON.parse(body);
      await db.events.create({
        type: 'PRODUCT_UPDATED',
        brand_id: shop,
        payload: {
          product_id: product.id,
          timestamp: new Date(),
          shop
        }
      });
    } catch (error) {
      throw new ShopifyAPIError('Failed to handle product update', error);
    }
  }
};

// Export shopify client for direct API calls
export const shopifyClient = shopify.api;

export default shopify;
