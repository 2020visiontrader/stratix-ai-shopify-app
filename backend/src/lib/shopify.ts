import { ApiVersion } from '@shopify/shopify-api';
import { shopifyApp } from '@shopify/shopify-app-express';

// Initialize Shopify App configuration
export const shopify = shopifyApp({
  api: {
    apiKey: process.env.SHOPIFY_API_KEY!,
    apiSecretKey: process.env.SHOPIFY_API_SECRET!,
    scopes: ['read_products', 'write_products', 'read_orders', 'read_analytics', 'write_content'],
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
    storeSession: async (session) => {
      // Mock implementation - in real app would store in database
      console.log('Storing session:', session.id);
      return true;
    },
    loadSession: async (id) => {
      // Mock implementation - in real app would load from database
      console.log('Loading session:', id);
      return undefined;
    },
    deleteSession: async (id) => {
      // Mock implementation - in real app would delete from database
      console.log('Deleting session:', id);
      return true;
    },
    deleteSessions: async (ids) => {
      // Mock implementation - in real app would delete multiple from database
      console.log('Deleting sessions:', ids);
      return true;
    },
    findSessionsByShop: async (shop) => {
      // Mock implementation - in real app would find sessions by shop
      console.log('Finding sessions for shop:', shop);
      return [];
    },
  },
});

// Export shopify client for direct API calls
export const shopifyClient = shopify.api;

export default shopify;
