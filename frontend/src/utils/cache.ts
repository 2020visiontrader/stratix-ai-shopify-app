export class CacheManager {
  private static instance: CacheManager;
  private cache: Map<string, CacheEntry>;
  private maxSize: number;
  private maxAge: number;
  private subscribers: Map<string, Set<CacheSubscriber>>;

  private constructor(options?: CacheOptions) {
    this.cache = new Map();
    this.maxSize = options?.maxSize || 1000;
    this.maxAge = options?.maxAge || 3600000; // 1 hour in milliseconds
    this.subscribers = new Map();
  }

  public static getInstance(options?: CacheOptions): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager(options);
    }
    return CacheManager.instance;
  }

  public set<T>(
    key: string,
    value: T,
    options?: CacheEntryOptions
  ): void {
    const entry: CacheEntry<T> = {
      value,
      timestamp: Date.now(),
      maxAge: options?.maxAge || this.maxAge,
      tags: options?.tags || []
    };

    this.cache.set(key, entry);
    this.notifySubscribers(key, value, null);
    this.cleanup();
  }

  public get<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;

    if (!entry) {
      return null;
    }

    if (this.isExpired(entry)) {
      this.delete(key);
      return null;
    }

    return entry.value;
  }

  public delete(key: string): void {
    const entry = this.cache.get(key);
    this.cache.delete(key);
    if (entry) {
      this.notifySubscribers(key, null, entry.value);
    }
  }

  public clear(): void {
    this.cache.clear();
    this.notifySubscribers('*', null, null);
  }

  public has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) {
      return false;
    }
    return !this.isExpired(entry);
  }

  private isExpired(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp > entry.maxAge;
  }

  private cleanup(): void {
    if (this.cache.size > this.maxSize) {
      const entries = Array.from(this.cache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      const entriesToRemove = entries.slice(0, entries.length - this.maxSize);
      entriesToRemove.forEach(([key]) => this.delete(key));
    }

    // Remove expired entries
    for (const [key, entry] of this.cache.entries()) {
      if (this.isExpired(entry)) {
        this.delete(key);
      }
    }
  }

  public subscribe(
    key: string,
    subscriber: CacheSubscriber
  ): () => void {
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set());
    }
    this.subscribers.get(key)!.add(subscriber);

    return () => {
      const subscribers = this.subscribers.get(key);
      if (subscribers) {
        subscribers.delete(subscriber);
        if (subscribers.size === 0) {
          this.subscribers.delete(key);
        }
      }
    };
  }

  private notifySubscribers(
    key: string,
    newValue: any,
    previousValue: any
  ): void {
    // Notify specific key subscribers
    const keySubscribers = this.subscribers.get(key);
    if (keySubscribers) {
      keySubscribers.forEach(subscriber => {
        try {
          subscriber(newValue, previousValue);
        } catch (error) {
          console.error(`Error in cache subscriber for ${key}:`, error);
        }
      });
    }

    // Notify wildcard subscribers
    const wildcardSubscribers = this.subscribers.get('*');
    if (wildcardSubscribers) {
      wildcardSubscribers.forEach(subscriber => {
        try {
          subscriber(newValue, previousValue);
        } catch (error) {
          console.error('Error in wildcard cache subscriber:', error);
        }
      });
    }
  }

  public getByTag(tag: string): Array<{ key: string; value: any }> {
    const results: Array<{ key: string; value: any }> = [];
    for (const [key, entry] of this.cache.entries()) {
      if (entry.tags.includes(tag) && !this.isExpired(entry)) {
        results.push({ key, value: entry.value });
      }
    }
    return results;
  }

  public deleteByTag(tag: string): void {
    for (const [key, entry] of this.cache.entries()) {
      if (entry.tags.includes(tag)) {
        this.delete(key);
      }
    }
  }

  public getSize(): number {
    return this.cache.size;
  }

  public getMaxSize(): number {
    return this.maxSize;
  }

  public setMaxSize(size: number): void {
    this.maxSize = size;
    this.cleanup();
  }

  public getMaxAge(): number {
    return this.maxAge;
  }

  public setMaxAge(age: number): void {
    this.maxAge = age;
    this.cleanup();
  }

  public async exportData(format: 'json' | 'csv'): Promise<string> {
    const data: Record<string, any> = {};
    for (const [key, entry] of this.cache.entries()) {
      if (!this.isExpired(entry)) {
        data[key] = {
          value: entry.value,
          timestamp: entry.timestamp,
          maxAge: entry.maxAge,
          tags: entry.tags
        };
      }
    }

    if (format === 'json') {
      return JSON.stringify(data, null, 2);
    } else {
      const headers = ['Key', 'Value', 'Timestamp', 'MaxAge', 'Tags'];
      const rows = Object.entries(data).map(([key, entry]) => [
        key,
        JSON.stringify(entry.value),
        entry.timestamp,
        entry.maxAge,
        entry.tags.join(';')
      ]);
      return [headers, ...rows].map(row => row.join(',')).join('\n');
    }
  }

  public async importData(data: string, format: 'json' | 'csv'): Promise<void> {
    try {
      let parsedData: Record<string, any>;

      if (format === 'json') {
        parsedData = JSON.parse(data);
      } else {
        const rows = data.split('\n').map(row => row.split(','));
        const headers = rows[0];
        parsedData = {};
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (row.length === headers.length) {
            const key = row[0];
            parsedData[key] = {
              value: JSON.parse(row[1]),
              timestamp: Number(row[2]),
              maxAge: Number(row[3]),
              tags: row[4].split(';')
            };
          }
        }
      }

      Object.entries(parsedData).forEach(([key, entry]) => {
        this.cache.set(key, {
          value: entry.value,
          timestamp: entry.timestamp,
          maxAge: entry.maxAge,
          tags: entry.tags
        });
      });
    } catch (error) {
      console.error('Failed to import cache data:', error);
      throw error;
    }
  }

  public getStats(): CacheStats {
    const totalEntries = this.cache.size;
    const expiredEntries = Array.from(this.cache.values()).filter(entry =>
      this.isExpired(entry)
    ).length;
    const activeEntries = totalEntries - expiredEntries;
    const tags = new Set<string>();
    this.cache.forEach(entry => {
      entry.tags.forEach(tag => tags.add(tag));
    });

    return {
      totalEntries,
      activeEntries,
      expiredEntries,
      uniqueTags: tags.size,
      maxSize: this.maxSize,
      maxAge: this.maxAge
    };
  }
}

interface CacheEntry<T = any> {
  value: T;
  timestamp: number;
  maxAge: number;
  tags: string[];
}

interface CacheOptions {
  maxSize?: number;
  maxAge?: number;
}

interface CacheEntryOptions {
  maxAge?: number;
  tags?: string[];
}

type CacheSubscriber = (newValue: any, previousValue: any) => void;

interface CacheStats {
  totalEntries: number;
  activeEntries: number;
  expiredEntries: number;
  uniqueTags: number;
  maxSize: number;
  maxAge: number;
} 