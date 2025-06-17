import axios from 'axios';
import { CacheEntry, ManagerState, NetworkResponse, RequestOptions } from './CoreTypes';

export class NetworkManager {
  private static instance: NetworkManager;
  private cache: Map<string, CacheEntry<unknown>> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private state: ManagerState = {
    lastUpdate: new Date(),
    version: '1.0.0',
    status: 'active'
  };

  private constructor() {
    // Initialize axios instance with default config
    axios.defaults.baseURL = process.env.NEXT_PUBLIC_API_URL;
    axios.defaults.headers.common['Content-Type'] = 'application/json';
  }

  public static getInstance(): NetworkManager {
    if (!NetworkManager.instance) {
      NetworkManager.instance = new NetworkManager();
    }
    return NetworkManager.instance;
  }

  public async request<T>(options: RequestOptions): Promise<NetworkResponse<T>> {
    const { cache = true, ...config } = options;
    const cacheKey = this.generateCacheKey(config);

    if (cache && this.isCacheValid(cacheKey)) {
      return this.getFromCache<T>(cacheKey);
    }

    try {
      const response = await axios.request<T>(config);
      const networkResponse: NetworkResponse<T> = {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers as Record<string, string>,
        config: response.config
      };
      
      if (cache) {
        this.setCache(cacheKey, networkResponse);
      }

      return networkResponse;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        // Handle specific error cases
        if (error.response?.status === 401) {
          // Handle unauthorized
          window.location.href = '/auth/login';
        }
        throw new Error(error.response?.data?.message || error.message);
      }
      throw error;
    }
  }

  private generateCacheKey(config: RequestOptions): string {
    return `${config.method}-${config.url}-${JSON.stringify(config.params)}-${JSON.stringify(config.data)}`;
  }

  private isCacheValid(key: string): boolean {
    const cached = this.cache.get(key);
    if (!cached) return false;

    const now = Date.now();
    return now - cached.timestamp < this.CACHE_DURATION;
  }

  private getFromCache<T>(key: string): NetworkResponse<T> {
    const cached = this.cache.get(key);
    if (!cached) throw new Error('Cache miss');

    return cached.data as NetworkResponse<T>;
  }

  private setCache<T>(key: string, response: NetworkResponse<T>): void {
    this.cache.set(key, {
      data: response,
      timestamp: Date.now(),
    });
  }

  public clearCache(): void {
    this.cache.clear();
    this.state.lastUpdate = new Date();
  }

  public removeFromCache(key: string): void {
    this.cache.delete(key);
    this.state.lastUpdate = new Date();
  }

  public getLastUpdate(): Date {
    return this.state.lastUpdate;
  }

  public getState(): ManagerState {
    return { ...this.state };
  }

  public async exportData(): Promise<string> {
    const data = {
      cache: Array.from(this.cache.entries()),
      state: this.state
    };
    return JSON.stringify(data);
  }

  public async importData(dataJson: string): Promise<void> {
    const data = JSON.parse(dataJson);
    this.cache = new Map(data.cache);
    this.state = data.state;
  }
} 