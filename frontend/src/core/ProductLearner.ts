import { AppError } from '@/utils/errorHandling';

interface ProductData {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  attributes: Record<string, any>;
  performance: ProductPerformance;
}

interface ProductPerformance {
  views: number;
  sales: number;
  conversionRate: number;
  revenue: number;
  lastUpdated: Date;
}

export class ProductLearner {
  private static instance: ProductLearner;
  private products: Map<string, ProductData>;
  private readonly minDataPoints: number = 10;

  private constructor() {
    this.products = new Map();
  }

  public static getInstance(): ProductLearner {
    if (!ProductLearner.instance) {
      ProductLearner.instance = new ProductLearner();
    }
    return ProductLearner.instance;
  }

  public addProduct(product: ProductData): void {
    if (!product.id || !product.name) {
      throw new AppError('Product must have an ID and name', 400);
    }

    this.products.set(product.id, {
      ...product,
      performance: {
        views: 0,
        sales: 0,
        conversionRate: 0,
        revenue: 0,
        lastUpdated: new Date()
      }
    });
  }

  public updatePerformance(
    productId: string,
    views: number,
    sales: number
  ): void {
    const product = this.products.get(productId);
    if (!product) {
      throw new AppError('Product not found', 404);
    }

    const revenue = sales * product.price;
    const conversionRate = views > 0 ? (sales / views) * 100 : 0;

    this.products.set(productId, {
      ...product,
      performance: {
        views,
        sales,
        conversionRate,
        revenue,
        lastUpdated: new Date()
      }
    });
  }

  public analyzeProduct(productId: string): {
    insights: string[];
    recommendations: string[];
  } {
    const product = this.products.get(productId);
    if (!product) {
      throw new AppError('Product not found', 404);
    }

    const insights: string[] = [];
    const recommendations: string[] = [];

    // Analyze conversion rate
    if (product.performance.conversionRate < 1) {
      insights.push('Low conversion rate detected');
      recommendations.push('Consider optimizing product description and images');
    }

    // Analyze price point
    const avgPrice = this.calculateAveragePrice(product.category);
    if (product.price > avgPrice * 1.2) {
      insights.push('Price point is significantly higher than category average');
      recommendations.push('Consider price adjustment or highlighting premium features');
    }

    // Analyze performance trends
    if (product.performance.views < this.minDataPoints) {
      insights.push('Insufficient data for comprehensive analysis');
      recommendations.push('Continue collecting performance data');
    }

    return { insights, recommendations };
  }

  private calculateAveragePrice(category: string): number {
    const categoryProducts = Array.from(this.products.values())
      .filter(p => p.category === category);

    if (categoryProducts.length === 0) return 0;

    const totalPrice = categoryProducts.reduce((sum, p) => sum + p.price, 0);
    return totalPrice / categoryProducts.length;
  }

  public getProduct(productId: string): ProductData {
    const product = this.products.get(productId);
    if (!product) {
      throw new AppError('Product not found', 404);
    }
    return { ...product };
  }

  public getAllProducts(): ProductData[] {
    return Array.from(this.products.values());
  }

  public getProductsByCategory(category: string): ProductData[] {
    return this.getAllProducts().filter(p => p.category === category);
  }
}
