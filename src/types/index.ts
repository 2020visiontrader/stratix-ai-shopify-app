// Stratix AI Platform - Core Type Definitions
export interface User {
  id: string;
  email: string;
  name: string;
  plan: 'free' | 'pro' | 'enterprise';
  createdAt: Date;
  updatedAt: Date;
}

export interface Campaign {
  id: string;
  name: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
  type: 'ab_test' | 'multivariate' | 'split_url';
  variants: Variant[];
  metrics: CampaignMetrics;
  createdAt: Date;
  updatedAt: Date;
}

export interface Variant {
  id: string;
  name: string;
  description?: string;
  content: VariantContent;
  traffic: number; // percentage
  conversions: number;
  visitors: number;
  conversionRate: number;
}

export interface VariantContent {
  headline?: string;
  description?: string;
  buttonText?: string;
  imageUrl?: string;
  customCode?: string;
}

export interface CampaignMetrics {
  totalVisitors: number;
  totalConversions: number;
  conversionRate: number;
  confidenceLevel: number;
  statisticalSignificance: boolean;
  revenue?: number;
  averageOrderValue?: number;
}

export interface ABTestResult {
  campaignId: string;
  winner?: string;
  winnerConfidence: number;
  improvementPercentage: number;
  recommendedAction: 'continue' | 'conclude' | 'extend';
}

export interface AuntMelResponse {
  response: string;
  suggestions: string[];
  confidence: number;
  processingTime: number;
  timestamp: string;
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  service: string;
  version: string;
  environment: string;
  uptime: number;
  memory: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
    arrayBuffers: number;
  };
  cpu: {
    user: number;
    system: number;
  };
  nodeVersion: string;
  features: {
    security: string;
    cors: string;
    logging: string;
    errorHandling: string;
    healthMonitoring: string;
  };
}

export interface BrandConfiguration {
  id: string;
  name: string;
  industry: string;
  targetAudience: string;
  brandVoice: string;
  primaryColors: string[];
  secondaryColors?: string[];
  fonts?: {
    primary: string;
    secondary: string;
  };
  logoUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}
