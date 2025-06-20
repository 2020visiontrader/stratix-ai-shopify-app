// Source: https://github.com/MONEI/shopify-api-node (adapted for Stratix)
// Shopify Store Sync - Fetch products and orders from Shopify

const Shopify = require('shopify-api-node');

const shopify = new Shopify({
  shopName: process.env.SHOP_NAME,
  accessToken: process.env.SHOPIFY_ACCESS_TOKEN
});

async function syncStoreData() {
  // Fetch latest products from Shopify
  const allProducts = await shopify.product.list({ limit: 250 });
  console.log(`Synced ${allProducts.length} products from Shopify`);
  // Fetch recent orders as well
  const recentOrders = await shopify.order.list({ limit: 100, status: 'any' });
  console.log(`Synced ${recentOrders.length} orders from Shopify`);
  // ... further syncing as needed
}

// Example: run the sync
// syncStoreData().catch(console.error);

module.exports = { syncStoreData }; 