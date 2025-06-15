import { db } from '../lib/supabase';

// Example trending product rewrite script
async function rewriteTrendingProducts() {
  // 1. Scan for products with 30%+ increase in views/adds to cart (past 3 days)
  // TODO: Query analytics for trending products
  const trendingProducts = [
    { productId: 'prod1', views: 130, prevViews: 100 },
    { productId: 'prod2', views: 260, prevViews: 200 }
  ];

  for (const product of trendingProducts) {
    // 2. Rewrite copy for trending product
    const rewritten = {
      title: `🔥 Best-seller: ${product.productId}`,
      bullets: ['Hurry, limited stock!', 'Top-rated by customers'],
      meta: 'Best-seller, trending now'
    };

    // 3. Store in /productMomentum/{productId}
    await db.from('product_momentum').upsert({
      product_id: product.productId,
      data: rewritten,
      created_at: new Date()
    });
  }
}

// Example usage
// rewriteTrendingProducts(); 