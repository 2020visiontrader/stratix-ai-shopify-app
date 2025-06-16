export interface BrandDNA {
  billing_active?: boolean;
  trial_start_date?: Date;
}

export interface BrandConfig {
  lockout_override: boolean;
  feature_locks: {
    autopilot: boolean;
    bulk_operations: boolean;
    advanced_analytics: boolean;
  };
} 

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: any;
  };
  timestamp: string;
}

export interface HealthCheckResponse {
  success: boolean;
  status: 'healthy' | 'unhealthy';
  message: string;
  data: {
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
    node_version: string;
    timestamp: string;
    features: {
      security: string;
      cors: string;
      logging: string;
      error_handling: string;
      health_monitoring: string;
    };
  };
  timestamp: string;
} 