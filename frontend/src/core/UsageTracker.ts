import { AppError } from '@/utils/errorHandling';

interface UsageMetrics {
  apiCalls: number;
  tokensUsed: number;
  lastUpdated: Date;
}

export class UsageTracker {
  private static instance: UsageTracker;
  private metrics: Map<string, UsageMetrics>;

  private constructor() {
    this.metrics = new Map();
  }

  public static getInstance(): UsageTracker {
    if (!UsageTracker.instance) {
      UsageTracker.instance = new UsageTracker();
    }
    return UsageTracker.instance;
  }

  public trackApiCall(shopId: string, tokensUsed: number): void {
    const currentMetrics = this.metrics.get(shopId) || {
      apiCalls: 0,
      tokensUsed: 0,
      lastUpdated: new Date()
    };

    this.metrics.set(shopId, {
      apiCalls: currentMetrics.apiCalls + 1,
      tokensUsed: currentMetrics.tokensUsed + tokensUsed,
      lastUpdated: new Date()
    });
  }

  public getMetrics(shopId: string): UsageMetrics {
    const metrics = this.metrics.get(shopId);
    if (!metrics) {
      throw new AppError('No usage metrics found for this shop', 404);
    }
    return metrics;
  }

  public resetMetrics(shopId: string): void {
    this.metrics.delete(shopId);
  }

  public getAllMetrics(): Map<string, UsageMetrics> {
    return new Map(this.metrics);
  }
}
