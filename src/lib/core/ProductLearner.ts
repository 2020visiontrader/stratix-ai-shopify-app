import { NetworkManager } from '../../../frontend/src/utils/network';

interface ProductData {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  attributes: Record<string, any>;
  metrics: {
    views: number;
    sales: number;
    revenue: number;
    conversion: number;
  };
  metadata: {
    created: number;
    updated: number;
    status: 'active' | 'draft' | 'archived';
    tags: string[];
  };
}

interface LearningResult {
  productId: string;
  timestamp: number;
  insights: {
    performance: {
      score: number;
      trends: Record<string, number>;
      recommendations: string[];
    };
    optimization: {
      suggestions: string[];
      potentialImpact: number;
    };
    competitive: {
      position: number;
      advantages: string[];
      threats: string[];
    };
  };
  metadata: {
    confidence: number;
    dataPoints: number;
    lastAnalysis: number;
  };
}

export class ProductLearner {
  private static instance: ProductLearner;
  private networkManager: NetworkManager;
  private products: Map<string, ProductData>;
  private results: Map<string, LearningResult>;
  private lastUpdate: number;

  private constructor() {
    this.networkManager = NetworkManager.getInstance();
    this.products = new Map();
    this.results = new Map();
    this.lastUpdate = Date.now();
  }

  public static getInstance(): ProductLearner {
    if (!ProductLearner.instance) {
      ProductLearner.instance = new ProductLearner();
    }
    return ProductLearner.instance;
  }

  public async learn(productId: string): Promise<LearningResult> {
    try {
      // Fetch product data
      const product = await this.fetchProductData(productId);
      this.products.set(productId, product);

      // Generate learning result
      const result = await this.generateLearningResult(product);
      this.results.set(productId, result);

      this.lastUpdate = Date.now();
      return result;
    } catch (error) {
      console.error(`Error learning product ${productId}:`, error);
      throw error;
    }
  }

  private async fetchProductData(productId: string): Promise<ProductData> {
    const response = await this.networkManager.request<ProductData>({
      method: 'GET',
      url: `/api/products/${productId}`
    });
    return response.data;
  }

  private async generateLearningResult(
    product: ProductData
  ): Promise<LearningResult> {
    const insights = await this.analyzeProduct(product);
    return {
      productId: product.id,
      timestamp: Date.now(),
      insights,
      metadata: {
        confidence: this.calculateConfidence(product),
        dataPoints: this.countDataPoints(product),
        lastAnalysis: Date.now()
      }
    };
  }

  private async analyzeProduct(
    product: ProductData
  ): Promise<LearningResult['insights']> {
    // Analyze performance
    const performance = await this.analyzePerformance(product);

    // Generate optimization suggestions
    const optimization = await this.generateOptimizationSuggestions(product);

    // Analyze competitive position
    const competitive = await this.analyzeCompetitivePosition(product);

    return {
      performance,
      optimization,
      competitive
    };
  }

  private async analyzePerformance(
    product: ProductData
  ): Promise<LearningResult['insights']['performance']> {
    const score = this.calculatePerformanceScore(product);
    const trends = await this.analyzeTrends(product);
    const recommendations = await this.generateRecommendations(product);

    return {
      score,
      trends,
      recommendations
    };
  }

  private calculatePerformanceScore(product: ProductData): number {
    const { metrics } = product;
    const weights = {
      views: 0.2,
      sales: 0.4,
      revenue: 0.3,
      conversion: 0.1
    };

    return (
      metrics.views * weights.views +
      metrics.sales * weights.sales +
      metrics.revenue * weights.revenue +
      metrics.conversion * weights.conversion
    );
  }

  private async analyzeTrends(
    product: ProductData
  ): Promise<Record<string, number>> {
    const response = await this.networkManager.request<Record<string, number>>({
      method: 'GET',
      url: `/api/products/${product.id}/trends`
    });
    return response.data;
  }

  private async generateRecommendations(
    product: ProductData
  ): Promise<string[]> {
    const response = await this.networkManager.request<string[]>({
      method: 'GET',
      url: `/api/products/${product.id}/recommendations`
    });
    return response.data;
  }

  private async generateOptimizationSuggestions(
    product: ProductData
  ): Promise<LearningResult['insights']['optimization']> {
    const response = await this.networkManager.request<
      LearningResult['insights']['optimization']
    >({
      method: 'GET',
      url: `/api/products/${product.id}/optimization`
    });
    return response.data;
  }

  private async analyzeCompetitivePosition(
    product: ProductData
  ): Promise<LearningResult['insights']['competitive']> {
    const response = await this.networkManager.request<
      LearningResult['insights']['competitive']
    >({
      method: 'GET',
      url: `/api/products/${product.id}/competitive`
    });
    return response.data;
  }

  private calculateConfidence(product: ProductData): number {
    const dataPoints = this.countDataPoints(product);
    return Math.min(dataPoints / 1000, 1); // Normalize to 0-1 range
  }

  private countDataPoints(product: ProductData): number {
    return Object.values(product.metrics).reduce((sum, value) => sum + value, 0);
  }

  public async addProduct(product: ProductData): Promise<ProductData> {
    this.validateProduct(product);

    const newProduct: ProductData = {
      ...product,
      metadata: {
        ...product.metadata,
        created: Date.now(),
        updated: Date.now()
      }
    };

    this.products.set(newProduct.id, newProduct);
    this.lastUpdate = Date.now();
    return newProduct;
  }

  private validateProduct(product: ProductData): void {
    if (!product.id || !product.name || !product.price) {
      throw new Error('Invalid product data');
    }

    if (!product.metadata || !product.metadata.status || !product.metadata.tags) {
      throw new Error('Product must include metadata');
    }
  }

  public async updateProduct(
    productId: string,
    updates: Partial<ProductData>
  ): Promise<ProductData> {
    const product = this.products.get(productId);
    if (!product) {
      throw new Error(`Product not found: ${productId}`);
    }

    const updatedProduct: ProductData = {
      ...product,
      ...updates,
      metadata: {
        ...product.metadata,
        updated: Date.now()
      }
    };

    this.validateProduct(updatedProduct);
    this.products.set(productId, updatedProduct);
    this.lastUpdate = Date.now();
    return updatedProduct;
  }

  public async getProduct(productId: string): Promise<ProductData | undefined> {
    return this.products.get(productId);
  }

  public async getAllProducts(): Promise<ProductData[]> {
    return Array.from(this.products.values());
  }

  public async getProductsByCategory(
    category: string
  ): Promise<ProductData[]> {
    return Array.from(this.products.values()).filter(
      product => product.category === category
    );
  }

  public async getLearningResult(
    productId: string
  ): Promise<LearningResult | undefined> {
    return this.results.get(productId);
  }

  public async searchProducts(query: string): Promise<ProductData[]> {
    const response = await this.networkManager.request<ProductData[]>({
      method: 'GET',
      url: '/api/products/search',
      params: { query }
    });
    return response.data;
  }

  public async exportData(): Promise<string> {
    const data = {
      products: Array.from(this.products.values()),
      results: Array.from(this.results.values()),
      lastUpdate: this.lastUpdate
    };
    return JSON.stringify(data, null, 2);
  }

  public async importData(data: string): Promise<void> {
    try {
      const parsedData = JSON.parse(data);
      this.products = new Map(
        parsedData.products.map((p: ProductData) => [p.id, p])
      );
      this.results = new Map(
        parsedData.results.map((r: LearningResult) => [r.productId, r])
      );
      this.lastUpdate = parsedData.lastUpdate;
    } catch (error) {
      console.error('Failed to import product learner data:', error);
      throw error;
    }
  }

  public getLastUpdate(): number {
    return this.lastUpdate;
  }

  public getProductCount(): number {
    return this.products.size;
  }

  public getResultCount(): number {
    return this.results.size;
  }
} 