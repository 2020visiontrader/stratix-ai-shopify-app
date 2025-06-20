import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import axios from 'axios';
import { deleteCookie, getCookie, setCookie } from 'cookies-next';

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Auth Types
export interface LoginRequest {
  email: string;
  shopDomain: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    shopDomain: string;
    role: string;
  };
}

// Analysis Types
export interface AnalysisRequest {
  content: string;
  type: 'product' | 'ad' | 'landing_page';
  framework?: string;
}

export interface AnalysisResponse {
  id: string;
  suggestions: string[];
  frameworks: string[];
  confidence: number;
  improvements: Array<{
    type: string;
    description: string;
    impact: 'low' | 'medium' | 'high';
  }>;
}

// Product Types
export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  images: string[];
  shopifyId: string;
}

// Performance Types
export interface PerformanceMetrics {
  views: number;
  clicks: number;
  conversions: number;
  revenue: number;
  period: string;
}

class ApiClient {
  private client: AxiosInstance;
  private baseURL: string;
  private ngrokUrl: string | null = null;

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Try to detect ngrok URL on initialization
    this.detectNgrokUrl();

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = this.getAuthToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor to handle errors
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          this.handleUnauthorized();
        }
        return Promise.reject(error);
      }
    );
  }

  private getAuthToken(): string | null {
    return getCookie('auth_token') as string || null;
  }

  private setAuthToken(token: string) {
    setCookie('auth_token', token, {
      maxAge: 7 * 24 * 60 * 60, // 7 days
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });
  }

  private removeAuthToken() {
    deleteCookie('auth_token');
  }

  private handleUnauthorized() {
    this.removeAuthToken();
    // Redirect to login or emit event
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }

  // Detect and switch to ngrok URL if available
  private async detectNgrokUrl() {
    try {
      // First try to get ngrok URL from the current backend
      const response = await fetch(`${this.baseURL}/api/ngrok-url`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.url && data.available) {
          this.ngrokUrl = data.url;
          console.log('🌐 Detected ngrok URL:', this.ngrokUrl);
          
          // Update the axios client to use ngrok URL
          this.client.defaults.baseURL = this.ngrokUrl!;
          console.log('✅ API client switched to ngrok URL');
        }
      }
    } catch (error) {
      // Silently fail - ngrok might not be available
      console.log('ℹ️ ngrok URL detection failed (this is normal if ngrok is not running)');
    }
  }

  // Public method to get current API URL
  public getCurrentApiUrl(): string {
    return this.ngrokUrl || this.baseURL;
  }

  // Public method to manually refresh ngrok URL
  public async refreshNgrokUrl(): Promise<boolean> {
    await this.detectNgrokUrl();
    return !!this.ngrokUrl;
  }

  // Generic request method
  private async request<T>(config: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<ApiResponse<T>> = await this.client.request(config);
      return response.data;
    } catch (error: any) {
      console.error('API request error:', error);
      
      if (error.response?.data) {
        return error.response.data;
      }
      
      return {
        success: false,
        error: error.message || 'An unexpected error occurred',
      };
    }
  }

  // Authentication endpoints
  async login(credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    const response = await this.request<LoginResponse>({
      method: 'POST',
      url: '/api/auth/login',
      data: credentials,
    });

    if (response.success && response.data?.token) {
      this.setAuthToken(response.data.token);
    }

    return response;
  }

  async logout(): Promise<ApiResponse<void>> {
    const response = await this.request<void>({
      method: 'POST',
      url: '/api/auth/logout',
    });

    this.removeAuthToken();
    return response;
  }

  async refreshToken(): Promise<ApiResponse<{ token: string }>> {
    return this.request({
      method: 'POST',
      url: '/api/auth/refresh',
    });
  }

  // Analysis endpoints
  async analyzeContent(request: AnalysisRequest): Promise<ApiResponse<AnalysisResponse>> {
    return this.request<AnalysisResponse>({
      method: 'POST',
      url: '/api/analysis/analyze',
      data: request,
    });
  }

  async getAnalysisHistory(page = 1, limit = 10): Promise<PaginatedResponse<AnalysisResponse>> {
    return this.request<AnalysisResponse[]>({
      method: 'GET',
      url: '/api/analysis/history',
      params: { page, limit },
    });
  }

  // Product endpoints
  async getProducts(page = 1, limit = 10): Promise<PaginatedResponse<Product>> {
    return this.request<Product[]>({
      method: 'GET',
      url: '/api/products',
      params: { page, limit },
    });
  }

  async getProduct(id: string): Promise<ApiResponse<Product>> {
    return this.request<Product>({
      method: 'GET',
      url: `/api/products/${id}`,
    });
  }

  async optimizeProduct(id: string, optimizations: any): Promise<ApiResponse<Product>> {
    return this.request<Product>({
      method: 'POST',
      url: `/api/products/${id}/optimize`,
      data: optimizations,
    });
  }

  // Performance endpoints
  async getPerformanceMetrics(
    productId?: string,
    startDate?: string,
    endDate?: string
  ): Promise<ApiResponse<PerformanceMetrics>> {
    return this.request<PerformanceMetrics>({
      method: 'GET',
      url: '/api/performance/metrics',
      params: { productId, startDate, endDate },
    });
  }

  async uploadPerformanceData(file: File): Promise<ApiResponse<{ processed: number }>> {
    const formData = new FormData();
    formData.append('file', file);

    return this.request<{ processed: number }>({
      method: 'POST',
      url: '/api/performance/upload',
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  // Trial endpoints
  async getTrialStatus(): Promise<ApiResponse<{
    active: boolean;
    daysRemaining: number;
    features: string[];
  }>> {
    return this.request({
      method: 'GET',
      url: '/api/trials/status',
    });
  }

  async startTrial(): Promise<ApiResponse<{ trialId: string }>> {
    return this.request({
      method: 'POST',
      url: '/api/trials/start',
    });
  }

  // Security endpoints
  async getSecurityStatus(): Promise<ApiResponse<{
    lastScan: string;
    threats: number;
    recommendations: string[];
  }>> {
    return this.request({
      method: 'GET',
      url: '/api/security/status',
    });
  }

  async runSecurityScan(): Promise<ApiResponse<{ scanId: string }>> {
    return this.request({
      method: 'POST',
      url: '/api/security/scan',
    });
  }

  // Settings endpoints
  async getSettings(): Promise<ApiResponse<Record<string, any>>> {
    return this.request({
      method: 'GET',
      url: '/api/settings',
    });
  }

  async updateSettings(settings: Record<string, any>): Promise<ApiResponse<void>> {
    return this.request({
      method: 'PUT',
      url: '/api/settings',
      data: settings,
    });
  }

  // Health check
  async healthCheck(): Promise<ApiResponse<{
    status: string;
    timestamp: string;
    version: string;
  }>> {
    return this.request({
      method: 'GET',
      url: '/health',
    });
  }
}

/**
 * Enhanced fetch wrapper with authentication support and error handling
 */
export async function fetchWithAuth<T = any>(
  url: string,
  options: RequestInit = {},
  config: {
    showSuccessToast?: boolean;
    showErrorToast?: boolean;
    successMessage?: string;
    errorMessage?: string;
    redirectToLogin?: boolean;
  } = {}
): Promise<{ data: T | null; error: Error | null; status: number }> {
  const {
    showSuccessToast = false,
    showErrorToast = true,
    successMessage = 'Operation successful',
    errorMessage = 'An error occurred',
    redirectToLogin = true,
  } = config;

  try {
    // Get token from cookie
    const token = getCookie('session') as string || getCookie('auth_token') as string || null;

    // Create headers with authorization if token exists
    const headers = new Headers(options.headers);
    if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    // Execute fetch
    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Handle unauthorized (session expired, etc.)
    if (response.status === 401 && redirectToLogin) {
      if (typeof window !== 'undefined') {
        deleteCookie('auth_token');
        deleteCookie('session');
        window.location.href = '/auth/login';
      }
      return { data: null, error: new Error('Unauthorized'), status: 401 };
    }

    // Parse response data
    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    // Handle successful response
    if (response.ok) {
      if (showSuccessToast && typeof window !== 'undefined') {
        // If react-hot-toast is available, use it
        try {
          const toast = require('react-hot-toast');
          toast.success(successMessage);
        } catch (e) {
          console.log(successMessage);
        }
      }
      return { data, error: null, status: response.status };
    }

    // Handle error response
    const errorMsg = data.error || data.message || 'An unknown error occurred';
    const error = new Error(errorMsg);
    
    if (showErrorToast && typeof window !== 'undefined') {
      try {
        const toast = require('react-hot-toast');
        toast.error(`${errorMessage}: ${errorMsg}`);
      } catch (e) {
        console.error(`${errorMessage}: ${errorMsg}`);
      }
    }
    
    return { data: null, error, status: response.status };
  } catch (err) {
    // Handle network errors or other exceptions
    const error = err instanceof Error ? err : new Error('Network error');
    
    if (showErrorToast && typeof window !== 'undefined') {
      try {
        const toast = require('react-hot-toast');
        toast.error(`${errorMessage}: ${error.message}`);
      } catch (e) {
        console.error(`${errorMessage}: ${error.message}`);
      }
    }
    
    return { data: null, error, status: 0 };
  }
}

// Standalone fetch function with auth for use in Next.js API routes
export async function fetchWithAuthLegacy(url: string, options: RequestInit = {}) {
  const token = getCookie('auth_token') as string || null;
  
  const headers = new Headers(options.headers || {});
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  return fetch(url, {
    ...options,
    headers
  });
}

// Export singleton instance
export const apiClient = new ApiClient();
export default apiClient;
