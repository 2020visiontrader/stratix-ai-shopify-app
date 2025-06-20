// @ts-ignore
import Shopify from 'shopify-api-node';

export async function deployTheme(shop: string, themeDirectory: string): Promise<any> {
  const shopify = new Shopify({ shopName: shop, accessToken: process.env.SHOPIFY_ACCESS_TOKEN });
  // TODO: Zip themeDirectory and upload via Shopify API
  // Placeholder: Return dummy theme object
  return { id: '0', name: `Stratix Theme`, preview_url: `https://${shop}/?preview_theme_id=0` };
} 