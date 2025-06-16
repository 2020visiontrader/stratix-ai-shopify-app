import { AppError } from '@/utils/errorHandling';

interface TokenUsage {
  total: number;
  used: number;
  remaining: number;
  lastReset: Date;
}

export class TokenTracker {
  private static instance: TokenTracker;
  private usage: Map<string, TokenUsage>;
  private readonly defaultLimit: number = 1000000; // 1 million tokens per month

  private constructor() {
    this.usage = new Map();
  }

  public static getInstance(): TokenTracker {
    if (!TokenTracker.instance) {
      TokenTracker.instance = new TokenTracker();
    }
    return TokenTracker.instance;
  }

  public initializeShop(shopId: string, limit?: number): void {
    this.usage.set(shopId, {
      total: limit || this.defaultLimit,
      used: 0,
      remaining: limit || this.defaultLimit,
      lastReset: new Date()
    });
  }

  public trackUsage(shopId: string, tokens: number): void {
    const usage = this.usage.get(shopId);
    if (!usage) {
      throw new AppError('Shop not initialized', 404);
    }

    if (tokens > usage.remaining) {
      throw new AppError('Token limit exceeded', 429);
    }

    this.usage.set(shopId, {
      ...usage,
      used: usage.used + tokens,
      remaining: usage.remaining - tokens
    });
  }

  public getUsage(shopId: string): TokenUsage {
    const usage = this.usage.get(shopId);
    if (!usage) {
      throw new AppError('Shop not initialized', 404);
    }
    return { ...usage };
  }

  public resetUsage(shopId: string): void {
    const usage = this.usage.get(shopId);
    if (!usage) {
      throw new AppError('Shop not initialized', 404);
    }

    this.usage.set(shopId, {
      ...usage,
      used: 0,
      remaining: usage.total,
      lastReset: new Date()
    });
  }

  public updateLimit(shopId: string, newLimit: number): void {
    const usage = this.usage.get(shopId);
    if (!usage) {
      throw new AppError('Shop not initialized', 404);
    }

    this.usage.set(shopId, {
      ...usage,
      total: newLimit,
      remaining: newLimit - usage.used
    });
  }

  public getAllUsage(): Map<string, TokenUsage> {
    return new Map(this.usage);
  }
}
