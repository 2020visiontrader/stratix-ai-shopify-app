export interface TestVariant {
  id: string;
  name: string;
  type: 'content' | 'design' | 'pricing' | 'layout';
  changes: Record<string, unknown>;
  metrics: {
    visitors: number;
    conversions: number;
    revenue: number;
    conversionRate: number;
  };
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
    startDate: string;  // ISO string format
    endDate: string;    // ISO string format
    trafficSplit: Record<string, number>;
  };
  status: 'draft' | 'running' | 'paused' | 'completed';
}

export interface TestResult {
  testId: string;
  winner: string | null;
  confidence: number;
  metrics: {
    variant: string;
    visitors: number;
    conversions: number;
    revenue: number;
    conversionRate: number;
    improvement: number;
  }[];
  insights: {
    type: string;
    description: string;
    impact: number;
  }[];
  recommendations: string[];
} 