import { FilterParams } from '../types/database';
import { AppError } from '../utils/errors';
import { DatabaseService } from './DatabaseService';

interface CacheConfig {
  ttl: number; // Time to live in seconds
  maxSize: number; // Maximum number of items in cache
}

interface CacheItem<T> {
  key: string;
  value: T;
  type: string;
  expires_at: number;
  created_at: number;
  updated_at: number;
}

export class CacheService {
  private static instance: CacheService;
  private db: DatabaseService;
  private configs: Map<string, CacheConfig>;
  private memoryCache: Map<string, CacheItem<any>>;

  private constructor() {
    this.db = DatabaseService.getInstance();
    this.configs = new Map();
    this.memoryCache = new Map();
    this.initializeConfigs();
  }

  public static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  private initializeConfigs(): void {
    // Default cache configurations
    this.configs.set('default', {
      ttl: 300, // 5 minutes
      maxSize: 1000
    });

    this.configs.set('product', {
      ttl: 3600, // 1 hour
      maxSize: 100
    });

    this.configs.set('analytics', {
      ttl: 1800, // 30 minutes
      maxSize: 50
    });

    this.configs.set('user', {
      ttl: 86400, // 24 hours
      maxSize: 1000
    });
  }

  async get<T>(key: string, type: string = 'default'): Promise<T | null> {
    try {
      // Check memory cache first
      const memoryItem = this.memoryCache.get(key);
      if (memoryItem && !this.isExpired(memoryItem)) {
        return memoryItem.value as T;
      }

      // Check database cache
      const result = await this.db.getById<CacheItem<T>>('cache', key);
      if (result?.data && !this.isExpired(result.data)) {
        // Update memory cache
        this.memoryCache.set(key, result.data);
        return result.data.value;
      }

      return null;
    } catch (error) {
      throw new AppError('Failed to get cache item');
    }
  }

  async set<T>(
    key: string,
    value: T,
    type: string = 'default'
  ): Promise<void> {
    try {
      const config = this.configs.get(type) || this.configs.get('default')!;
      const now = Date.now();
      const expires_at = now + config.ttl * 1000;

      const item: CacheItem<T> = {
        key,
        value,
        type,
        expires_at,
        created_at: now,
        updated_at: now
      };

      // Update memory cache
      this.memoryCache.set(key, item);

      // Update database cache
      await this.db.create('cache', item);

      // Check cache size and cleanup if necessary
      await this.cleanup(type);
    } catch (error) {
      throw new AppError('Failed to set cache item');
    }
  }

  async delete(key: string): Promise<void> {
    try {
      // Remove from memory cache
      this.memoryCache.delete(key);

      // Remove from database cache
      await this.db.delete('cache', key);
    } catch (error) {
      throw new AppError('Failed to delete cache item');
    }
  }

  async clear(type?: string): Promise<void> {
    try {
      if (type) {
        // Clear specific type from memory cache
        for (const [key, item] of this.memoryCache.entries()) {
          if (item.type === type) {
            this.memoryCache.delete(key);
          }
        }

        // Clear specific type from database cache
        const filters: FilterParams[] = [{
          field: 'type',
          operator: 'eq',
          value: type
        }];

        const result = await this.db.list<CacheItem<any>>('cache', {
          filters
        });

        if (result.data) {
          await Promise.all(
            result.data.map(item =>
              this.db.delete('cache', item.key)
            )
          );
        }
      } else {
        // Clear all from memory cache
        this.memoryCache.clear();

        // Clear all from database cache
        const result = await this.db.list<CacheItem<any>>('cache', {});
        if (result.data) {
          await Promise.all(
            result.data.map(item =>
              this.db.delete('cache', item.key)
            )
          );
        }
      }
    } catch (error) {
      throw new AppError('Failed to clear cache');
    }
  }

  async updateConfig(type: string, config: CacheConfig): Promise<void> {
    try {
      this.configs.set(type, config);
    } catch (error) {
      throw new AppError('Failed to update cache config');
    }
  }

  private isExpired(item: CacheItem<any>): boolean {
    return Date.now() > item.expires_at;
  }

  private async cleanup(type: string): Promise<void> {
    try {
      const config = this.configs.get(type) || this.configs.get('default')!;

      // Cleanup memory cache
      for (const [key, item] of this.memoryCache.entries()) {
        if (this.isExpired(item)) {
          this.memoryCache.delete(key);
        }
      }

      // Check memory cache size
      if (this.memoryCache.size > config.maxSize) {
        const items = Array.from(this.memoryCache.entries())
          .sort((a, b) => a[1].updated_at - b[1].updated_at);

        const itemsToRemove = items.slice(0, this.memoryCache.size - config.maxSize);
        for (const [key] of itemsToRemove) {
          this.memoryCache.delete(key);
        }
      }

      // Cleanup database cache
      const now = Date.now();
      const filters: FilterParams[] = [
        {
          field: 'type',
          operator: 'eq',
          value: type
        },
        {
          field: 'expires_at',
          operator: 'lt',
          value: now
        }
      ];

      const result = await this.db.list<CacheItem<any>>('cache', {
        filters
      });

      if (result.data) {
        await Promise.all(
          result.data.map(item =>
            this.db.delete('cache', item.key)
          )
        );
      }

      // Check database cache size
      const typeFilter: FilterParams[] = [{
        field: 'type',
        operator: 'eq',
        value: type
      }];

      const allItems = await this.db.list<CacheItem<any>>('cache', {
        filters: typeFilter
      });

      if (allItems.data && allItems.data.length > config.maxSize) {
        const itemsToRemove = allItems.data
          .sort((a, b) => a.updated_at - b.updated_at)
          .slice(0, allItems.data.length - config.maxSize);

        await Promise.all(
          itemsToRemove.map(item =>
            this.db.delete('cache', item.key)
          )
        );
      }
    } catch (error) {
      throw new AppError('Failed to cleanup cache');
    }
  }
} 