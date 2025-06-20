import { exec } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
// @ts-ignore
import Shopify from 'shopify-api-node';

export interface BrandConfig {
  primaryColor: string;
  heroImage: string;
  featuredCollection: string;
  fontFamily?: string;
}

export async function initializeTheme(shop: string, brandConfig: BrandConfig): Promise<{ themeId: string; themeUrl: string }> {
  const tmpDir = `/tmp/stratix-theme-${shop}`;
  // 1. Clone Theme Lab starter
  await execPromise(`git clone https://github.com/uicrooks/shopify-theme-lab ${tmpDir}`);
  // 2. Inject brand colors/fonts into Tailwind config
  const twConfigPath = path.join(tmpDir, 'tailwind.config.js');
  const twConfig = require(twConfigPath);
  twConfig.theme.extend = twConfig.theme.extend || {};
  twConfig.theme.extend.colors = { ...twConfig.theme.extend.colors, primary: brandConfig.primaryColor };
  if (brandConfig.fontFamily) {
    twConfig.theme.extend.fontFamily = { ...twConfig.theme.extend.fontFamily, sans: [brandConfig.fontFamily, 'sans-serif'] };
  }
  await fs.writeFile(twConfigPath, `module.exports = ${JSON.stringify(twConfig, null, 2)}`);
  // 3. Modify index.json to include default sections
  const indexJsonPath = path.join(tmpDir, 'templates/index.json');
  const indexJson = require(indexJsonPath);
  indexJson.sections = [
    { name: 'hero', settings: { image: brandConfig.heroImage } },
    { name: 'collection-grid', settings: { collection: brandConfig.featuredCollection } },
    { name: 'newsletter', settings: {} }
  ];
  await fs.writeFile(indexJsonPath, JSON.stringify(indexJson, null, 2));
  // 4. Deploy via Shopify API
  const themeId = await deployTheme(shop, tmpDir);
  return { themeId, themeUrl: `https://${shop}/?preview_theme_id=${themeId}` };
}

function execPromise(cmd: string): Promise<void> {
  return new Promise((resolve, reject) => {
    exec(cmd, (err) => (err ? reject(err) : resolve()));
  });
}

async function deployTheme(shop: string, themeDirectory: string): Promise<string> {
  const shopify = new Shopify({ shopName: shop, accessToken: process.env.SHOPIFY_ACCESS_TOKEN });
  // TODO: Zip themeDirectory and upload via Shopify API
  // Placeholder: Return dummy themeId
  return '0';
} 