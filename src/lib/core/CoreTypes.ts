// Network Types
export interface NetworkResponse<T> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  config: NetworkRequestConfig;
}

export interface NetworkRequestConfig {
  method?: string;
  url?: string;
  baseURL?: string;
  headers?: Record<string, string>;
  params?: Record<string, unknown>;
  data?: unknown;
  timeout?: number;
  withCredentials?: boolean;
  responseType?: 'arraybuffer' | 'blob' | 'document' | 'json' | 'text' | 'stream';
}

export interface RequestOptions extends NetworkRequestConfig {
  cache?: boolean;
}

// Feature Types
export interface FeatureCondition {
  type: 'user' | 'role' | 'time' | 'date' | 'custom';
  operator: 'equals' | 'notEquals' | 'contains' | 'notContains' | 'greaterThan' | 'lessThan' | 'between';
  value: string | number | boolean | Date | Array<string | number | boolean | Date>;
  metadata?: Record<string, unknown>;
}

export interface Feature {
  id: string;
  name: string;
  description: string;
  type: 'section' | 'toggle' | 'switch' | 'checkbox' | 'radio';
  config: {
    defaultValue?: boolean;
    requiresAuth?: boolean;
    roles?: string[];
    conditions?: FeatureCondition[];
    dependencies?: string[];
  };
  state: {
    enabled: boolean;
    visible?: boolean;
    loading?: boolean;
  };
  metadata: {
    created?: number;
    updated: number;
    version: string;
    category?: string;
    tags?: string[];
    dependencies?: string[];
    icon?: string;
    tooltip?: string;
    requireConfirmation?: boolean;
    confirmationMessage?: string;
  };
}

// Brand Types
export interface BrandVoice {
  tone: string[];
  personality: string[];
  keywords: string[];
  phrases: string[];
  doNotUse: string[];
}

export interface BrandVisuals {
  colors: {
    primary: string[];
    secondary: string[];
    accent: string[];
  };
  typography: {
    headings: string[];
    body: string[];
    display: string[];
  };
  imagery: {
    style: string[];
    subjects: string[];
    composition: string[];
  };
  logo: {
    variations: string[];
    usage: string[];
    spacing: string[];
  };
}

export interface BrandGuidelines {
  id: string;
  name: string;
  description: string;
  voice: BrandVoice;
  visuals: BrandVisuals;
  values: string[];
  mission: string;
  vision: string;
  targetAudience: {
    demographics: Record<string, string | number | boolean>;
    psychographics: string[];
    behaviors: string[];
  };
  competitors: {
    direct: string[];
    indirect: string[];
    analysis: Record<string, string | number | boolean>;
  };
}

export interface BrandCheck {
  id: string;
  type: 'content' | 'design' | 'voice' | 'compliance';
  status: 'pass' | 'fail' | 'warning';
  score: number;
  details: {
    category: string;
    findings: BrandFinding[];
  };
  timestamp: Date;
}

export interface BrandFinding {
  type: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
  recommendation: string;
}

// Config Types
export interface Config {
  id: string;
  key: string;
  value: ConfigValue;
  type: ConfigType;
  metadata: ConfigMetadata;
  validation: ConfigValidation;
}

export type ConfigValue = string | number | boolean | Record<string, unknown> | unknown[];
export type ConfigType = 'string' | 'number' | 'boolean' | 'object' | 'array';

export interface ConfigMetadata {
  created: number;
  updated: number;
  version: string;
  description: string;
  tags: string[];
}

export interface ConfigValidation {
  required: boolean;
  pattern?: string;
  min?: number;
  max?: number;
  enum?: ConfigValue[];
}

export interface ConfigResult {
  configId: string;
  timestamp: number;
  operation: 'get' | 'set' | 'delete' | 'validate';
  success: boolean;
  value?: ConfigValue;
  error?: string;
  metadata: {
    processingTime: number;
    source: string;
  };
}

// A/B Testing Types
export interface TestVariant {
  id: string;
  name: string;
  description?: string;
  weight: number;
  metrics: TestMetrics;
  metadata?: Record<string, unknown>;
}

export interface TestMetrics {
  visitors: number;
  conversions: number;
  revenue: number;
  conversionRate: number;
}

export interface TestConfig {
  id: string;
  name: string;
  description: string;
  variants: TestVariant[];
  targetAudience: {
    segments: string[];
    conditions: Record<string, string | number | boolean>;
  };
  goals: {
    primary: string;
    secondary: string[];
    thresholds: Record<string, number>;
  };
  schedule: {
    startDate: string; // ISO string format
    endDate: string;   // ISO string format
    trafficSplit: Record<string, number>;
  };
  status: 'draft' | 'running' | 'paused' | 'completed';
}

export interface TestResult {
  testId: string;
  winner: string | null;
  confidence: number;
  metrics: (TestMetrics & {
    variant: string;
    improvement: number;
  })[];
  insights: {
    type: string;
    description: string;
    impact: number;
  }[];
  recommendations: string[];
}

export interface TestAnalysis {
  status: string;
  progress: number;
  confidence: number;
  insights: string[];
}

// Common Types
export interface BaseManager {
  getLastUpdate(): Date;
  exportData(): Promise<string>;
  importData(data: string): Promise<void>;
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

export interface ManagerState {
  lastUpdate: Date;
  version: string;
  status: 'active' | 'inactive' | 'error';
  error?: string;
} 