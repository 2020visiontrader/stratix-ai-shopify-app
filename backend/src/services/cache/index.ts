import { config } from '../../config';
import { supabase } from '../../lib/supabase';
import { AppError } from '../../utils/errors';
import { logger } from '../../utils/logger';

export interface CacheEntry<T> {
  key: string;
  value: T;
  expires_at: Date;
  created_at: Date;
}

export class CacheService {
  private defaultTTL: number;

  constructor() {
    this.defaultTTL = config.CACHE_TTL;
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const { data, error } = await supabase
        .from('cache')
        .select('*')
        .eq('key', key)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Cache miss
        }
        throw error;
      }

      const entry = data as CacheEntry<T>;

      // Check if entry is expired
      if (new Date(entry.expires_at) < new Date()) {
        await this.delete(key);
        return null;
      }

      return entry.value;
    } catch (error) {
      logger.error('Error getting cache entry:', error);
      throw new AppError(500, 'CACHE_ERROR', 'Failed to get cache entry', error);
    }
  }

  async set<T>(
    key: string,
    value: T,
    ttl: number = this.defaultTTL
  ): Promise<void> {
    try {
      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + ttl);

      const { error } = await supabase
        .from('cache')
        .upsert({
          key,
          value,
          expires_at: expiresAt,
          created_at: new Date()
        });

      if (error) throw error;
    } catch (error) {
      logger.error('Error setting cache entry:', error);
      throw new AppError(500, 'CACHE_ERROR', 'Failed to set cache entry', error);
    }
  }

  async delete(key: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('cache')
        .delete()
        .eq('key', key);

      if (error) throw error;
    } catch (error) {
      logger.error('Error deleting cache entry:', error);
      throw new AppError(500, 'CACHE_ERROR', 'Failed to delete cache entry', error);
    }
  }

  async clear(): Promise<void> {
    try {
      const { error } = await supabase
        .from('cache')
        .delete()
        .neq('key', ''); // Delete all entries

      if (error) throw error;
    } catch (error) {
      logger.error('Error clearing cache:', error);
      throw new AppError(500, 'CACHE_ERROR', 'Failed to clear cache', error);
    }
  }

  async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl: number = this.defaultTTL
  ): Promise<T> {
    try {
      // Try to get from cache
      const cached = await this.get<T>(key);
      if (cached !== null) {
        return cached;
      }

      // Cache miss, fetch and cache
      const value = await fetchFn();
      await this.set(key, value, ttl);
      return value;
    } catch (error) {
      logger.error('Error in getOrSet:', error);
      throw new AppError(500, 'CACHE_ERROR', 'Failed to get or set cache entry', error);
    }
  }

  async invalidatePattern(pattern: string): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('cache')
        .select('key')
        .ilike('key', pattern);

      if (error) throw error;

      // Delete all matching entries
      await Promise.all(
        (data || []).map(entry => this.delete(entry.key))
      );
    } catch (error) {
      logger.error('Error invalidating cache pattern:', error);
      throw new AppError(500, 'CACHE_ERROR', 'Failed to invalidate cache pattern', error);
    }
  }

  async getStats(): Promise<{
    total_entries: number;
    expired_entries: number;
    memory_usage: number;
  }> {
    try {
      const { data, error } = await supabase
        .rpc('get_cache_stats');

      if (error) throw error;
      return data as {
        total_entries: number;
        expired_entries: number;
        memory_usage: number;
      };
    } catch (error) {
      logger.error('Error getting cache stats:', error);
      throw new AppError(500, 'CACHE_ERROR', 'Failed to get cache stats', error);
    }
  }
} 