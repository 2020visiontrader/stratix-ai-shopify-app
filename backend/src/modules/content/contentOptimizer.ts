// Content Optimization - TypeScript implementation using OpenAI and Shopify API
// Fetches, optimizes, and updates product descriptions using real APIs.

import OpenAI from 'openai';
// @ts-ignore
import Shopify from 'shopify-api-node';

const shopify = new Shopify({
  shopName: process.env.SHOP_NAME!,
  accessToken: process.env.SHOPIFY_ACCESS_TOKEN!,
});
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function optimizeProductDescription(productId: number): Promise<string> {
  // 1. Retrieve the current product description from Shopify
  const product = await shopify.product.get(productId);
  const originalDesc: string = product.body_html || '';
  // 2. Use OpenAI to generate an optimized description (SEO-friendly)
  const prompt = `Generate an SEO-optimized, engaging product description. Keep the tone on-brand.\nOriginal: "${originalDesc}"`;
  const chatRes = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
  });
  const optimizedDesc = chatRes.choices[0]?.message?.content?.trim() ?? originalDesc;
  // 3. Update the product with the optimized description via Shopify API
  await shopify.product.update(productId, { body_html: optimizedDesc });
  return optimizedDesc;
} 