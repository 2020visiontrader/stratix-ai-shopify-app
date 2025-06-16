import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';

interface RequestOptions extends AxiosRequestConfig {
  cache?: boolean;
}

export class NetworkManager {
  private static instance: NetworkManager;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private lastUpdate: Date;

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

  public async request<T = any>(options: RequestOptions): Promise<AxiosResponse<T>> {
    const { cache = true, ...config } = options;
    const cacheKey = this.generateCacheKey(config);

    if (cache && this.isCacheValid(cacheKey)) {
      return this.getFromCache(cacheKey);
    }

    try {
      const response = await axios.request<T>(config);
      
      if (cache) {
        this.setCache(cacheKey, response);
      }

      return response;
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

  private generateCacheKey(config: AxiosRequestConfig): string {
    return `${config.method}-${config.url}-${JSON.stringify(config.params)}-${JSON.stringify(config.data)}`;
  }

  private isCacheValid(key: string): boolean {
    const cached = this.cache.get(key);
    if (!cached) return false;

    const now = Date.now();
    return now - cached.timestamp < this.CACHE_DURATION;
  }

  private getFromCache<T>(key: string): AxiosResponse<T> {
    const cached = this.cache.get(key);
    if (!cached) throw new Error('Cache miss');

    return {
      data: cached.data,
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as any,
    };
  }

  private setCache<T>(key: string, response: AxiosResponse<T>): void {
    this.cache.set(key, {
      data: response.data,
      timestamp: Date.now(),
    });
  }

  public clearCache(): void {
    this.cache.clear();
  }

  public removeFromCache(key: string): void {
    this.cache.delete(key);
  }

  public exportData(): { cache: Array<[string, { data: any; timestamp: number }]>; lastUpdate: number } {
    const data = {
      cache: Array.from(this.cache.entries()),
      lastUpdate: this.lastUpdate.getTime(),
    };
    return data;
  }

  public importData(data: { cache: Array<[string, { data: any; timestamp: number }]>; lastUpdate: number }): void {
    this.cache.clear();
    data.cache.forEach(([key, value]) => {
      this.cache.set(key, value);
    });
    this.lastUpdate = new Date(data.lastUpdate);
  }
} 