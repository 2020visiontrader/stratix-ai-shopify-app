// Shopify Store Sync - TypeScript implementation using shopify-api-node
// Fetches and updates products and orders from Shopify using real API calls.

// @ts-ignore
import Shopify from 'shopify-api-node';

const shopify = new Shopify({
  shopName: process.env.SHOP_NAME!,
  accessToken: process.env.SHOPIFY_ACCESS_TOKEN!,
});

export async function syncStoreData(): Promise<{ products: any[]; orders: any[] }> {
  // Fetch latest products from Shopify
  const products = await shopify.product.list({ limit: 250 });
  // Fetch recent orders as well
  const orders = await shopify.order.list({ limit: 100, status: 'any' });
  return { products, orders };
}
