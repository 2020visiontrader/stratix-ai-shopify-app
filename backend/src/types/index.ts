// Backend types for Stratix AI Shopify App

export interface DatabaseConfig {
  host?: string;
  port?: number;
  database?: string;
  username?: string;
  password?: string;
  ssl?: boolean;
  // Supabase specific
  supabaseUrl?: string;
  supabaseKey?: string;
  schema?: string;
}

export interface SupabaseConfig {
  supabaseUrl: string;
  supabaseKey: string;
  schema: string;
}

export interface OpenAIConfig {
  apiKey: string;
  model: string;
  maxTokens: number;
  temperature: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
}

export interface ShopifyConfig {
  apiKey: string;
  apiSecret: string;
  scopes: string[];
  hostName: string;
  apiVersion: string;
}

export interface StripeConfig {
  secretKey: string;
  webhookSecret: string;
  publicKey: string;
}

export interface Config {
  database: DatabaseConfig;
  openai: OpenAIConfig;
  shopify: ShopifyConfig;
  stripe: StripeConfig;
  jwt: {
    secret: string;
    expiresIn: string;
  };
  supabase: {
    url: string;
    key: string;
  };
}

export interface ContentBackup {
  id: string;
  pageId: string;
  content: any;
  content_type: string;
  timestamp: Date;
  brandId: string;
}

export interface StoreRevision {
  id: string;
  storeId: string;
  revision: number;
  content: any;
  content_type: string;
  timestamp: Date;
}

export interface BrandDNA {
  brandId: string;
  tone: string;
  style: string;
  values: string[];
  targetAudience: string;
  keyMessages: string[];
}

export interface OptimizationSuggestion {
  id: string;
  section: string;
  currentContent: string;
  suggestedContent: string;
  reason: string;
  confidence: number;
  impact: 'low' | 'medium' | 'high';
  timestamp: Date;
}

export interface PerformanceMetrics {
  id: string;
  brand_id: string;
  type: 'product' | 'collection' | 'page';
  content_id: string;
  metrics: {
    views: number;
    clicks: number;
    conversions: number;
    revenue: number;
    bounce_rate: number;
    time_on_page: number;
  };
  period: 'daily' | 'weekly' | 'monthly';
  date: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  shopDomain: string;
  plan: 'free' | 'basic' | 'pro' | 'enterprise';
  role: string;
  createdAt: Date;
  updatedAt: Date;
}

import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  user?: User;
  shop?: string;
  shopDomain?: string;
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T = any> extends APIResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface NotificationData {
  id: string;
  userId: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
}

export interface TrialInfo {
  active: boolean;
  daysRemaining: number;
  features: string[];
  usage: {
    optimizations: number;
    analyses: number;
    contentGenerated: number;
  };
  limits: {
    optimizations: number;
    analyses: number;
    contentGenerated: number;
  };
}

export interface SecurityScanResult {
  id: string;
  storeId: string;
  scanType: 'basic' | 'comprehensive';
  status: 'pending' | 'completed' | 'failed';
  issues: SecurityIssue[];
  score: number;
  timestamp: Date;
}

export interface SecurityIssue {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  title: string;
  description: string;
  recommendation: string;
  resolved: boolean;
}

export interface SettingsData {
  general: {
    storeName: string;
    timezone: string;
    language: string;
    currency: string;
  };
  optimization: {
    autoApply: boolean;
    notifyOnChanges: boolean;
    backupBeforeChanges: boolean;
    minConfidenceScore: number;
  };
  analytics: {
    trackingEnabled: boolean;
    reportFrequency: 'daily' | 'weekly' | 'monthly';
    includeHeatmaps: boolean;
  };
  notifications: {
    email: boolean;
    push: boolean;
    slack: boolean;
    webhook?: string;
  };
  ai: {
    model: string;
    temperature: number;
    maxTokens: number;
    customPrompts: string[];
  };
}

export interface ContentTemplate {
  id: string;
  name: string;
  type: 'headline' | 'description' | 'cta' | 'email' | 'ad';
  template: string;
  variables: string[];
  category: string;
  brandId?: string;
}

export interface BulkOperation {
  id: string;
  type: 'optimization' | 'generation' | 'analysis';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  total: number;
  processed: number;
  failed: number;
  results: any[];
  createdAt: Date;
  completedAt?: Date;
}

export interface Product {
  id: string;
  shop_id: string;
  title: string;
  description: string;
  handle: string;
  vendor: string;
  product_type: string;
  tags: string[];
  variants: ProductVariant[];
  images: ProductImage[];
  created_at: string;
  updated_at: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  title: string;
  price: string;
  sku: string;
  position: number;
  inventory_policy: string;
  compare_at_price: string;
  fulfillment_service: string;
  inventory_management: string;
  option1: string;
  option2?: string;
  option3?: string;
  created_at: string;
  updated_at: string;
}

export interface ProductImage {
  id: string;
  product_id: string;
  position: number;
  created_at: string;
  updated_at: string;
  width: number;
  height: number;
  src: string;
  variant_ids: string[];
}

export interface Collection {
  id: string;
  shop_id: string;
  title: string;
  handle: string;
  description: string;
  published_at: string;
  products_count: number;
  created_at: string;
  updated_at: string;
}

export interface Page {
  id: string;
  shop_id: string;
  title: string;
  handle: string;
  body: string;
  published_at: string;
  created_at: string;
  updated_at: string;
}

export interface Shop {
  id: string;
  domain: string;
  name: string;
  email: string;
  access_token: string;
  scope: string;
  created_at: string;
  updated_at: string;
}

export interface Brand {
  id: string;
  shop_id: string;
  name: string;
  description: string;
  logo_url: string;
  website: string;
  social_media: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    linkedin?: string;
  };
  created_at: string;
  updated_at: string;
}

export interface BrandConfig {
  id: string;
  brand_id: string;
  settings: {
    content_optimization: boolean;
    seo_optimization: boolean;
    social_media_integration: boolean;
    analytics_tracking: boolean;
  };
  features: {
    ai_content_generation: boolean;
    performance_monitoring: boolean;
    competitor_analysis: boolean;
    market_trends: boolean;
  };
  created_at: string;
  updated_at: string;
}

export interface UsageLog {
  id: string;
  brand_id: string;
  action: string;
  resource_type: string;
  resource_id: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface Event {
  id: string;
  brand_id: string;
  type: string;
  data: Record<string, any>;
  created_at: string;
}
