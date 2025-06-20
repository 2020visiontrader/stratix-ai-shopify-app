import { RateLimitError } from '../utils/errors';
import { DatabaseService } from './DatabaseService';

interface RateLimitConfig {
  window: number; // Time window in seconds
  maxRequests: number; // Maximum number of requests allowed in the window
}

interface RateLimitInfo {
  remaining: number;
  reset: number;
  total: number;
}

export class RateLimiter {
  private static instance: RateLimiter;
  private db: DatabaseService;
  private configs: Map<string, RateLimitConfig>;

  private constructor() {
    this.db = DatabaseService.getInstance();
    this.configs = new Map();
    this.initializeConfigs();
  }

  public static getInstance(): RateLimiter {
    if (!RateLimiter.instance) {
      RateLimiter.instance = new RateLimiter();
    }
    return RateLimiter.instance;
  }

  private initializeConfigs(): void {
    // Default rate limits
    this.configs.set('default', {
      window: 60, // 1 minute
      maxRequests: 60 // 60 requests per minute
    });

    this.configs.set('api', {
      window: 60,
      maxRequests: 100
    });

    this.configs.set('webhook', {
      window: 60,
      maxRequests: 200
    });

    this.configs.set('analytics', {
      window: 60,
      maxRequests: 30
    });
  }

  async checkRateLimit(
    key: string,
    type: string = 'default'
  ): Promise<RateLimitInfo> {
    try {
      const config = this.configs.get(type) || this.configs.get('default')!;
      const now = Math.floor(Date.now() / 1000);
      const windowStart = now - config.window;

      // Get rate limit records for the key
      const records = await this.db.list('rate_limits', {
        key,
        type,
        timestamp: {
          gte: windowStart
        }
      });

      // Calculate remaining requests
      const requestCount = (records as unknown as any[]).length;
      const remaining = Math.max(0, config.maxRequests - requestCount);
      const reset = now + config.window;

      if (remaining <= 0) {
        throw new RateLimitError(
          `Rate limit exceeded. Try again in ${reset - now} seconds.`
        );
      }

      // Create new rate limit record
      await this.db.create('rate_limits', {
        key,
        type,
        timestamp: now,
        created_at: new Date().toISOString()
      });

      return {
        remaining,
        reset,
        total: config.maxRequests
      };
    } catch (error) {
      if (error instanceof RateLimitError) {
        throw error;
      }
      throw new RateLimitError('Failed to check rate limit');
    }
  }

  async getRateLimitInfo(
    key: string,
    type: string = 'default'
  ): Promise<RateLimitInfo> {
    try {
      const config = this.configs.get(type) || this.configs.get('default')!;
      const now = Math.floor(Date.now() / 1000);
      const windowStart = now - config.window;

      const records = await this.db.list('rate_limits', {
        key,
        type,
        timestamp: {
          gte: windowStart
        }
      });

      const requestCount = (records as unknown as any[]).length;
      const remaining = Math.max(0, config.maxRequests - requestCount);
      const reset = now + config.window;

      return {
        remaining,
        reset,
        total: config.maxRequests
      };
    } catch (error) {
      throw new RateLimitError('Failed to get rate limit info');
    }
  }

  async resetRateLimit(key: string, type: string = 'default'): Promise<void> {
    try {
      const records = await this.db.list('rate_limits', { key, type });
      for (const record of records as unknown as any[]) {
        await this.db.delete('rate_limits', record.id);
      }
    } catch (error) {
      throw new RateLimitError('Failed to reset rate limit');
    }
  }

  async updateRateLimitConfig(
    type: string,
    config: RateLimitConfig
  ): Promise<void> {
    try {
      this.configs.set(type, config);
    } catch (error) {
      throw new RateLimitError('Failed to update rate limit config');
    }
  }

  async cleanup(): Promise<void> {
    try {
      const now = Math.floor(Date.now() / 1000);
      const oldestTimestamp = now - Math.max(...Array.from(this.configs.values()).map(c => c.window));
      const records = await this.db.list('rate_limits', { timestamp: { lt: oldestTimestamp } });
      for (const record of records as unknown as any[]) {
        await this.db.delete('rate_limits', record.id);
      }
    } catch (error) {
      throw new RateLimitError('Failed to cleanup rate limits');
    }
  }
} 