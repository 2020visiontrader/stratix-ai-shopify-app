// Core Type Definitions for Stratix AI Platform
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
  traffic: number;
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

export interface AIAnalysisResult {
  confidence: number;
  recommendations: string[];
  metrics: Record<string, number>;
  analysis: string;
  targetAudience?: string[];
  brandVoice?: {
    tone: string;
    personality: string[];
    communication_style: string;
  };
  visualIdentity?: {
    primary_colors: string[];
    secondary_colors: string[];
    fonts: string[];
  };
  marketingStrategy?: {
    objectives: string[];
    channels: string[];
    keyMessages: string[];
  };
}

export interface BrandDNA {
  id: string;
  brand_id: string;
  brand_voice: {
    tone: string;
    personality: string[];
    communication_style: string;
  };
  target_audience: {
    demographics: string[];
    psychographics: string[];
    pain_points: string[];
  };
  visual_identity: {
    primary_colors: string[];
    secondary_colors: string[];
    fonts: string[];
  };
  content_strategy: {
    themes: string[];
    messaging_pillars: string[];
    content_types: string[];
  };
  positioning: {
    market_position: string;
    value_proposition: string;
    differentiators: string[];
  };
  tone_preferences?: {
    preferred_words: string[];
    avoid_words: string[];
  };
  name?: string;
  created_at: Date;
  updated_at: Date;
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