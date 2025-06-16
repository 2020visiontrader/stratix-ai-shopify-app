export const productionConfig = {
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || 'https://api.stratix.ai',
    timeout: 30000,
    retryAttempts: 3,
    retryDelay: 1000
  },
  shopify: {
    apiKey: process.env.SHOPIFY_API_KEY,
    apiSecret: process.env.SHOPIFY_API_SECRET,
    scopes: [
      'read_products',
      'write_products',
      'read_orders',
      'write_orders',
      'read_customers',
      'write_customers',
      'read_analytics',
      'read_marketing_events',
      'write_marketing_events'
    ],
    hostName: process.env.SHOPIFY_HOST_NAME
  },
  features: {
    defaultEnabled: [
      'brandAnalysis',
      'storeAnalysis',
      'storeOptimization',
      'campaignLearning',
      'productLearning',
      'knowledgeFeeding'
    ],
    requireAuth: [
      'advancedAnalytics',
      'storeOptimization',
      'campaignLearning'
    ]
  },
  analytics: {
    enabled: true,
    trackingId: process.env.ANALYTICS_TRACKING_ID,
    debug: false
  },
  errorReporting: {
    enabled: true,
    dsn: process.env.ERROR_REPORTING_DSN,
    environment: 'production'
  },
  performance: {
    monitoring: true,
    sampling: 1.0,
    thresholds: {
      apiLatency: 1000,
      renderTime: 100,
      memoryUsage: 0.8
    }
  },
  security: {
    cors: {
      origin: process.env.ALLOWED_ORIGINS?.split(',') || ['https://*.myshopify.com'],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      credentials: true
    },
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100 // limit each IP to 100 requests per windowMs
    }
  },
  logging: {
    level: 'info',
    format: 'json',
    destination: 'file',
    filename: 'production.log'
  }
}; 