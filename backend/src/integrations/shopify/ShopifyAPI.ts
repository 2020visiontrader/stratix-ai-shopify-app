import { db } from '../../lib/supabase';

interface ShopifyProduct {
  id: string;
  title: string;
  description: string;
  handle: string;
  metafields?: {
    seo_title?: string;
    seo_description?: string;
  };
}

export class ShopifyAPI {
  private brandId: string;
  private shopDomain: string | null = null;
  private accessToken: string | null = null;

  constructor(brandId: string) {
    this.brandId = brandId;
  }

  async initialize() {
    // Get shop credentials from Supabase
    const { data: shop } = await db
      .from('shopify_shops')
      .select('shop_domain, access_token')
      .eq('brand_id', this.brandId)
      .single();

    if (!shop) {
      throw new Error('Shopify shop not found for this brand');
    }

    this.shopDomain = shop.shop_domain;
    this.accessToken = shop.access_token;
  }

  async getProduct(productId: string): Promise<ShopifyProduct> {
    if (!this.shopDomain || !this.accessToken) {
      await this.initialize();
    }

    const response = await fetch(
      `https://${this.shopDomain}/admin/api/2024-01/products/${productId}.json`,
      {
        headers: {
          'X-Shopify-Access-Token': this.accessToken!,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch product: ${response.statusText}`);
    }

    const { product } = await response.json();

    // Get SEO metafields
    const metafields = await this.getProductMetafields(productId);

    return {
      id: product.id,
      title: product.title,
      description: product.body_html,
      handle: product.handle,
      metafields
    };
  }

  async updateProductMeta(
    productId: string,
    meta: {
      title?: string;
      description?: string;
      h1?: string;
    }
  ) {
    if (!this.shopDomain || !this.accessToken) {
      await this.initialize();
    }

    // Update product title (H1)
    if (meta.h1) {
      await this.updateProduct(productId, { title: meta.h1 });
    }

    // Update SEO metafields
    if (meta.title || meta.description) {
      await this.updateProductMetafields(productId, {
        seo_title: meta.title,
        seo_description: meta.description
      });
    }
  }

  private async getProductMetafields(
    productId: string
  ): Promise<ShopifyProduct['metafields']> {
    const response = await fetch(
      `https://${this.shopDomain}/admin/api/2024-01/products/${productId}/metafields.json`,
      {
        headers: {
          'X-Shopify-Access-Token': this.accessToken!,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch metafields: ${response.statusText}`);
    }

    const { metafields } = await response.json();

    return metafields.reduce(
      (acc: ShopifyProduct['metafields'], field: any) => {
        if (field.namespace === 'seo' && acc) {
          if (field.key === 'seo_title' || field.key === 'seo_description') {
            (acc as any)[field.key] = field.value;
          }
        }
        return acc;
      },
      {}
    );
  }

  private async updateProduct(productId: string, data: { title?: string }) {
    const response = await fetch(
      `https://${this.shopDomain}/admin/api/2024-01/products/${productId}.json`,
      {
        method: 'PUT',
        headers: {
          'X-Shopify-Access-Token': this.accessToken!,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ product: data })
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to update product: ${response.statusText}`);
    }
  }

  private async updateProductMetafields(
    productId: string,
    fields: {
      seo_title?: string;
      seo_description?: string;
    }
  ) {
    const metafields = Object.entries(fields)
      .filter(([_, value]) => value !== undefined)
      .map(([key, value]) => ({
        namespace: 'seo',
        key,
        value,
        type: 'single_line_text_field'
      }));

    const response = await fetch(
      `https://${this.shopDomain}/admin/api/2024-01/products/${productId}/metafields.json`,
      {
        method: 'POST',
        headers: {
          'X-Shopify-Access-Token': this.accessToken!,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ metafields })
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to update metafields: ${response.statusText}`);
    }
  }
} 