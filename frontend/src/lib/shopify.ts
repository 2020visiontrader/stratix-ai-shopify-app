import { AppError } from '@/utils/errorHandling';

interface ShopifyConfig {
  shopDomain: string;
  accessToken: string;
  apiVersion: string;
}

interface ShopifyProduct {
  id: number;
  title: string;
  description: string;
  price: string;
  vendor: string;
  product_type: string;
  status: string;
}

export class ShopifyClient {
  private static instance: ShopifyClient;
  private config: ShopifyConfig | null = null;

  private constructor() {}

  public static getInstance(): ShopifyClient {
    if (!ShopifyClient.instance) {
      ShopifyClient.instance = new ShopifyClient();
    }
    return ShopifyClient.instance;
  }

  public initialize(config: ShopifyConfig): void {
    this.config = config;
  }

  private getHeaders(): HeadersInit {
    if (!this.config) {
      throw new AppError('Shopify client not initialized', 500);
    }

    return {
      'X-Shopify-Access-Token': this.config.accessToken,
      'Content-Type': 'application/json',
    };
  }

  private getBaseUrl(): string {
    if (!this.config) {
      throw new AppError('Shopify client not initialized', 500);
    }

    return `https://${this.config.shopDomain}/admin/api/${this.config.apiVersion}`;
  }

  public async getProducts(params: {
    limit?: number;
    page?: number;
    status?: string;
  } = {}): Promise<ShopifyProduct[]> {
    try {
      const queryParams = new URLSearchParams();
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.status) queryParams.append('status', params.status);

      const response = await fetch(
        `${this.getBaseUrl()}/products.json?${queryParams.toString()}`,
        {
          headers: this.getHeaders(),
        }
      );

      if (!response.ok) {
        throw new AppError('Failed to fetch products', response.status);
      }

      const data = await response.json();
      return data.products;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to fetch products', 500);
    }
  }

  public async getProduct(id: number): Promise<ShopifyProduct> {
    try {
      const response = await fetch(
        `${this.getBaseUrl()}/products/${id}.json`,
        {
          headers: this.getHeaders(),
        }
      );

      if (!response.ok) {
        throw new AppError('Failed to fetch product', response.status);
      }

      const data = await response.json();
      return data.product;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to fetch product', 500);
    }
  }

  public async updateProduct(
    id: number,
    updates: Partial<ShopifyProduct>
  ): Promise<ShopifyProduct> {
    try {
      const response = await fetch(
        `${this.getBaseUrl()}/products/${id}.json`,
        {
          method: 'PUT',
          headers: this.getHeaders(),
          body: JSON.stringify({ product: updates }),
        }
      );

      if (!response.ok) {
        throw new AppError('Failed to update product', response.status);
      }

      const data = await response.json();
      return data.product;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to update product', 500);
    }
  }

  public async createProduct(product: Omit<ShopifyProduct, 'id'>): Promise<ShopifyProduct> {
    try {
      const response = await fetch(
        `${this.getBaseUrl()}/products.json`,
        {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({ product }),
        }
      );

      if (!response.ok) {
        throw new AppError('Failed to create product', response.status);
      }

      const data = await response.json();
      return data.product;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to create product', 500);
    }
  }

  public async deleteProduct(id: number): Promise<void> {
    try {
      const response = await fetch(
        `${this.getBaseUrl()}/products/${id}.json`,
        {
          method: 'DELETE',
          headers: this.getHeaders(),
        }
      );

      if (!response.ok) {
        throw new AppError('Failed to delete product', response.status);
      }
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to delete product', 500);
    }
  }
}
