export class NetworkManager {
  private static instance: NetworkManager;
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;
  private requestQueue: Request[];
  private activeRequests: Map<string, AbortController>;
  private subscribers: Map<string, Set<NetworkSubscriber>>;
  private retryConfig: RetryConfig;
  private cache: Map<string, CacheEntry>;
  private maxCacheSize: number;

  private constructor(options?: NetworkOptions) {
    this.baseUrl = options?.baseUrl || '';
    this.defaultHeaders = options?.defaultHeaders || {
      'Content-Type': 'application/json'
    };
    this.requestQueue = [];
    this.activeRequests = new Map();
    this.subscribers = new Map();
    this.retryConfig = options?.retryConfig || {
      maxRetries: 3,
      retryDelay: 1000,
      retryStatusCodes: [408, 429, 500, 502, 503, 504]
    };
    this.cache = new Map();
    this.maxCacheSize = options?.maxCacheSize || 100;
  }

  public static getInstance(options?: NetworkOptions): NetworkManager {
    if (!NetworkManager.instance) {
      NetworkManager.instance = new NetworkManager(options);
    }
    return NetworkManager.instance;
  }

  public async request<T>(
    config: RequestConfig
  ): Promise<Response<T>> {
    const requestId = crypto.randomUUID();
    const controller = new AbortController();
    this.activeRequests.set(requestId, controller);

    try {
      const response = await this.executeRequest<T>(config, controller.signal);
      this.notifySubscribers('success', { requestId, config, response });
      return response;
    } catch (error) {
      this.notifySubscribers('error', { requestId, config, error });
      throw error;
    } finally {
      this.activeRequests.delete(requestId);
    }
  }

  private async executeRequest<T>(
    config: RequestConfig,
    signal: AbortSignal
  ): Promise<Response<T>> {
    const {
      method = 'GET',
      url,
      data,
      headers = {},
      params,
      retry = this.retryConfig,
      cache = false
    } = config;

    const fullUrl = this.buildUrl(url, params);
    const requestHeaders = this.buildHeaders(headers);

    // Check cache for GET requests
    if (method === 'GET' && cache) {
      const cachedResponse = this.getCachedResponse<T>(fullUrl);
      if (cachedResponse) {
        return cachedResponse;
      }
    }

    let retryCount = 0;
    while (true) {
      try {
        const response = await fetch(fullUrl, {
          method,
          headers: requestHeaders,
          body: data ? JSON.stringify(data) : undefined,
          signal
        });

        if (!response.ok) {
          if (
            retry.maxRetries > retryCount &&
            retry.retryStatusCodes.includes(response.status)
          ) {
            retryCount++;
            await this.delay(retry.retryDelay * retryCount);
            continue;
          }
          throw new NetworkError(response.status, await response.text());
        }

        const responseData = await response.json();
        const result: Response<T> = {
          data: responseData,
          status: response.status,
          headers: Object.fromEntries(response.headers.entries())
        };

        // Cache successful GET responses
        if (method === 'GET' && cache) {
          this.cacheResponse(fullUrl, result);
        }

        return result;
      } catch (error) {
        if (error instanceof NetworkError) {
          throw error;
        }
        if (retry.maxRetries > retryCount) {
          retryCount++;
          await this.delay(retry.retryDelay * retryCount);
          continue;
        }
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        throw new NetworkError(0, errorMessage);
      }
    }
  }

  private buildUrl(url: string, params?: Record<string, any>): string {
    const fullUrl = this.baseUrl + url;
    if (!params) {
      return fullUrl;
    }

    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });

    const queryString = searchParams.toString();
    return queryString ? `${fullUrl}?${queryString}` : fullUrl;
  }

  private buildHeaders(headers: Record<string, string>): HeadersInit {
    return {
      ...this.defaultHeaders,
      ...headers
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private getCachedResponse<T>(url: string): Response<T> | null {
    const entry = this.cache.get(url);
    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expiry) {
      this.cache.delete(url);
      return null;
    }

    return entry.data;
  }

  private cacheResponse<T>(url: string, response: Response<T>): void {
    if (this.cache.size >= this.maxCacheSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(url, {
      data: response,
      expiry: Date.now() + 5 * 60 * 1000 // 5 minutes
    });
  }

  public cancelRequest(requestId: string): void {
    const controller = this.activeRequests.get(requestId);
    if (controller) {
      controller.abort();
      this.activeRequests.delete(requestId);
    }
  }

  public cancelAllRequests(): void {
    this.activeRequests.forEach(controller => controller.abort());
    this.activeRequests.clear();
  }

  public subscribe(
    event: NetworkEvent,
    subscriber: NetworkSubscriber
  ): () => void {
    if (!this.subscribers.has(event)) {
      this.subscribers.set(event, new Set());
    }
    this.subscribers.get(event)!.add(subscriber);

    return () => {
      const subscribers = this.subscribers.get(event);
      if (subscribers) {
        subscribers.delete(subscriber);
        if (subscribers.size === 0) {
          this.subscribers.delete(event);
        }
      }
    };
  }

  private notifySubscribers(
    event: NetworkEvent,
    data: any
  ): void {
    const subscribers = this.subscribers.get(event);
    if (subscribers) {
      subscribers.forEach(subscriber => {
        try {
          subscriber(data);
        } catch (error) {
          console.error(`Error in network subscriber for ${event}:`, error);
        }
      });
    }
  }

  public setBaseUrl(url: string): void {
    this.baseUrl = url;
  }

  public setDefaultHeaders(headers: Record<string, string>): void {
    this.defaultHeaders = headers;
  }

  public setRetryConfig(config: RetryConfig): void {
    this.retryConfig = config;
  }

  public clearCache(): void {
    this.cache.clear();
  }

  public getActiveRequestCount(): number {
    return this.activeRequests.size;
  }

  public getCacheSize(): number {
    return this.cache.size;
  }

  public async exportConfig(): Promise<string> {
    const config = {
      baseUrl: this.baseUrl,
      defaultHeaders: this.defaultHeaders,
      retryConfig: this.retryConfig,
      maxCacheSize: this.maxCacheSize
    };
    return JSON.stringify(config, null, 2);
  }

  public async importConfig(config: string): Promise<void> {
    try {
      const parsedConfig = JSON.parse(config);
      this.baseUrl = parsedConfig.baseUrl;
      this.defaultHeaders = parsedConfig.defaultHeaders;
      this.retryConfig = parsedConfig.retryConfig;
      this.maxCacheSize = parsedConfig.maxCacheSize;
    } catch (error) {
      console.error('Failed to import network config:', error);
      throw error;
    }
  }
}

class NetworkError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = 'NetworkError';
  }
}

type NetworkSubscriber = (data: any) => void;

type NetworkEvent = 'success' | 'error';

interface RequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  data?: any;
  headers?: Record<string, string>;
  params?: Record<string, any>;
  retry?: RetryConfig;
  cache?: boolean;
}

interface Response<T> {
  data: T;
  status: number;
  headers: Record<string, string>;
}

interface RetryConfig {
  maxRetries: number;
  retryDelay: number;
  retryStatusCodes: number[];
}

interface NetworkOptions {
  baseUrl?: string;
  defaultHeaders?: Record<string, string>;
  retryConfig?: RetryConfig;
  maxCacheSize?: number;
}

interface CacheEntry<T = any> {
  data: Response<T>;
  expiry: number;
} 