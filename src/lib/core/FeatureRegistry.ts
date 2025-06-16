import { Feature } from './FeatureManager';

export const FEATURES: Record<string, Feature> = {
  // Brand Analysis Features
  brandAnalysis: {
    id: 'brandAnalysis',
    name: 'Brand Analysis',
    description: 'Analyze brand DNA and generate insights',
    type: 'section',
    state: {
      enabled: true,
      visible: true,
      loading: false
    },
    metadata: {
      created: Date.now(),
      updated: Date.now(),
      version: '1.0.0',
      category: 'brand',
      tags: ['analysis', 'insights'],
      dependencies: []
    },
    config: {
      defaultValue: true,
      requiresAuth: true,
      roles: ['admin', 'analyst'],
      conditions: []
    }
  },

  // Framework Features
  frameworkRouting: {
    id: 'frameworkRouting',
    name: 'Framework Routing',
    description: 'Route and manage AI frameworks',
    type: 'section',
    state: {
      enabled: true,
      visible: true,
      loading: false
    },
    metadata: {
      created: Date.now(),
      updated: Date.now(),
      version: '1.0.0',
      category: 'framework',
      tags: ['routing', 'management'],
      dependencies: []
    },
    config: {
      defaultValue: true,
      requiresAuth: true,
      roles: ['admin', 'developer'],
      conditions: []
    }
  },

  // Campaign Features
  campaignLearning: {
    id: 'campaignLearning',
    name: 'Campaign Learning',
    description: 'Learn from cross-campaign data',
    type: 'section',
    state: {
      enabled: true,
      visible: true,
      loading: false
    },
    metadata: {
      created: Date.now(),
      updated: Date.now(),
      version: '1.0.0',
      category: 'campaign',
      tags: ['learning', 'optimization'],
      dependencies: []
    },
    config: {
      defaultValue: true,
      requiresAuth: true,
      roles: ['admin', 'marketer'],
      conditions: []
    }
  },

  // Knowledge Features
  knowledgeFeeding: {
    id: 'knowledgeFeeding',
    name: 'Knowledge Feeding',
    description: 'Feed and manage knowledge base',
    type: 'section',
    state: {
      enabled: true,
      visible: true,
      loading: false
    },
    metadata: {
      created: Date.now(),
      updated: Date.now(),
      version: '1.0.0',
      category: 'knowledge',
      tags: ['learning', 'management'],
      dependencies: []
    },
    config: {
      defaultValue: true,
      requiresAuth: true,
      roles: ['admin', 'analyst'],
      conditions: []
    }
  },

  // Product Features
  productLearning: {
    id: 'productLearning',
    name: 'Product Learning',
    description: 'Learn from product data',
    type: 'section',
    state: {
      enabled: true,
      visible: true,
      loading: false
    },
    metadata: {
      created: Date.now(),
      updated: Date.now(),
      version: '1.0.0',
      category: 'product',
      tags: ['learning', 'analysis'],
      dependencies: []
    },
    config: {
      defaultValue: true,
      requiresAuth: true,
      roles: ['admin', 'analyst'],
      conditions: []
    }
  },

  productOptimization: {
    id: 'productOptimization',
    name: 'Product Optimization',
    description: 'Optimize product listings',
    type: 'section',
    state: {
      enabled: true,
      visible: true,
      loading: false
    },
    metadata: {
      created: Date.now(),
      updated: Date.now(),
      version: '1.0.0',
      category: 'product',
      tags: ['optimization', 'performance'],
      dependencies: ['productLearning']
    },
    config: {
      defaultValue: true,
      requiresAuth: true,
      roles: ['admin', 'analyst'],
      conditions: []
    }
  },

  // Prompt Features
  promptComposition: {
    id: 'promptComposition',
    name: 'Prompt Composition',
    description: 'Compose and manage prompts',
    type: 'section',
    state: {
      enabled: true,
      visible: true,
      loading: false
    },
    metadata: {
      created: Date.now(),
      updated: Date.now(),
      version: '1.0.0',
      category: 'prompt',
      tags: ['composition', 'management'],
      dependencies: []
    },
    config: {
      defaultValue: true,
      requiresAuth: true,
      roles: ['admin', 'developer'],
      conditions: []
    }
  },

  // Store Features
  storeAnalysis: {
    id: 'storeAnalysis',
    name: 'Store Analysis',
    description: 'Analyze store performance',
    type: 'section',
    state: {
      enabled: true,
      visible: true,
      loading: false
    },
    metadata: {
      created: Date.now(),
      updated: Date.now(),
      version: '1.0.0',
      category: 'store',
      tags: ['analysis', 'performance'],
      dependencies: []
    },
    config: {
      defaultValue: true,
      requiresAuth: true,
      roles: ['admin', 'analyst'],
      conditions: []
    }
  },

  storeOptimization: {
    id: 'storeOptimization',
    name: 'Store Optimization',
    description: 'Optimize store performance',
    type: 'section',
    state: {
      enabled: true,
      visible: true,
      loading: false
    },
    metadata: {
      created: Date.now(),
      updated: Date.now(),
      version: '1.0.0',
      category: 'store',
      tags: ['optimization', 'performance'],
      dependencies: ['storeAnalysis']
    },
    config: {
      defaultValue: true,
      requiresAuth: true,
      roles: ['admin', 'analyst'],
      conditions: []
    }
  },

  // A/B Testing Features
  abTesting: {
    id: 'abTesting',
    name: 'A/B Testing',
    description: 'Run and manage A/B tests',
    type: 'section',
    state: {
      enabled: true,
      visible: true,
      loading: false
    },
    metadata: {
      created: Date.now(),
      updated: Date.now(),
      version: '1.0.0',
      category: 'testing',
      tags: ['testing', 'optimization'],
      dependencies: []
    },
    config: {
      defaultValue: true,
      requiresAuth: true,
      roles: ['admin', 'analyst'],
      conditions: []
    }
  },

  // Customer Features
  customerInsights: {
    id: 'customerInsights',
    name: 'Customer Insights',
    description: 'Analyze customer behavior and preferences',
    type: 'section',
    state: {
      enabled: true,
      visible: true,
      loading: false
    },
    metadata: {
      created: Date.now(),
      updated: Date.now(),
      version: '1.0.0',
      category: 'customer',
      tags: ['analysis', 'insights'],
      dependencies: []
    },
    config: {
      defaultValue: true,
      requiresAuth: true,
      roles: ['admin', 'analyst'],
      conditions: []
    }
  },

  customerSegmentation: {
    id: 'customerSegmentation',
    name: 'Customer Segmentation',
    description: 'Segment customers for targeted marketing',
    type: 'section',
    state: {
      enabled: true,
      visible: true,
      loading: false
    },
    metadata: {
      created: Date.now(),
      updated: Date.now(),
      version: '1.0.0',
      category: 'customer',
      tags: ['segmentation', 'marketing'],
      dependencies: ['customerInsights']
    },
    config: {
      defaultValue: true,
      requiresAuth: true,
      roles: ['admin', 'analyst'],
      conditions: []
    }
  },

  // Analytics Features
  salesAnalytics: {
    id: 'salesAnalytics',
    name: 'Sales Analytics',
    description: 'Track and analyze sales performance',
    type: 'section',
    state: {
      enabled: true,
      visible: true,
      loading: false
    },
    metadata: {
      created: Date.now(),
      updated: Date.now(),
      version: '1.0.0',
      category: 'analytics',
      tags: ['sales', 'performance'],
      dependencies: []
    },
    config: {
      defaultValue: true,
      requiresAuth: true,
      roles: ['admin', 'analyst'],
      conditions: []
    }
  },

  marketingAnalytics: {
    id: 'marketingAnalytics',
    name: 'Marketing Analytics',
    description: 'Measure marketing campaign effectiveness',
    type: 'section',
    state: {
      enabled: true,
      visible: true,
      loading: false
    },
    metadata: {
      created: Date.now(),
      updated: Date.now(),
      version: '1.0.0',
      category: 'analytics',
      tags: ['marketing', 'performance'],
      dependencies: []
    },
    config: {
      defaultValue: true,
      requiresAuth: true,
      roles: ['admin', 'analyst'],
      conditions: []
    }
  },

  // Settings Features
  generalSettings: {
    id: 'generalSettings',
    name: 'General Settings',
    description: 'Configure general application settings',
    type: 'section',
    state: {
      enabled: true,
      visible: true,
      loading: false
    },
    metadata: {
      created: Date.now(),
      updated: Date.now(),
      version: '1.0.0',
      category: 'settings',
      tags: ['configuration'],
      dependencies: []
    },
    config: {
      defaultValue: true,
      requiresAuth: true,
      roles: ['admin'],
      conditions: []
    }
  },

  integrationSettings: {
    id: 'integrationSettings',
    name: 'Integration Settings',
    description: 'Manage third-party integrations',
    type: 'section',
    state: {
      enabled: true,
      visible: true,
      loading: false
    },
    metadata: {
      created: Date.now(),
      updated: Date.now(),
      version: '1.0.0',
      category: 'settings',
      tags: ['integrations'],
      dependencies: []
    },
    config: {
      defaultValue: true,
      requiresAuth: true,
      roles: ['admin'],
      conditions: []
    }
  },

  notificationSettings: {
    id: 'notificationSettings',
    name: 'Notification Settings',
    description: 'Configure notification preferences',
    type: 'section',
    state: {
      enabled: true,
      visible: true,
      loading: false
    },
    metadata: {
      created: Date.now(),
      updated: Date.now(),
      version: '1.0.0',
      category: 'settings',
      tags: ['notifications'],
      dependencies: []
    },
    config: {
      defaultValue: true,
      requiresAuth: true,
      roles: ['admin', 'user'],
      conditions: []
    }
  },

  securitySettings: {
    id: 'securitySettings',
    name: 'Security Settings',
    description: 'Manage security preferences',
    type: 'section',
    state: {
      enabled: true,
      visible: true,
      loading: false
    },
    metadata: {
      created: Date.now(),
      updated: Date.now(),
      version: '1.0.0',
      category: 'settings',
      tags: ['security'],
      dependencies: []
    },
    config: {
      defaultValue: true,
      requiresAuth: true,
      roles: ['admin'],
      conditions: []
    }
  },

  // UI Features
  darkMode: {
    id: 'darkMode',
    name: 'Dark Mode',
    description: 'Enable dark mode theme',
    type: 'toggle',
    state: {
      enabled: false,
      visible: true,
      loading: false
    },
    metadata: {
      created: Date.now(),
      updated: Date.now(),
      version: '1.0.0',
      category: 'ui',
      tags: ['theme', 'preferences'],
      dependencies: []
    },
    config: {
      defaultValue: false,
      requiresAuth: false,
      roles: [],
      conditions: []
    }
  },

  advancedAnalytics: {
    id: 'advancedAnalytics',
    name: 'Advanced Analytics',
    description: 'Enable advanced analytics features',
    type: 'toggle',
    state: {
      enabled: false,
      visible: true,
      loading: false
    },
    metadata: {
      created: Date.now(),
      updated: Date.now(),
      version: '1.0.0',
      category: 'analytics',
      tags: ['advanced', 'features'],
      dependencies: []
    },
    config: {
      defaultValue: false,
      requiresAuth: true,
      roles: ['admin', 'analyst'],
      conditions: []
    }
  },

  aiOptimization: {
    id: 'aiOptimization',
    name: 'AI Optimization',
    description: 'Enable AI-powered store optimization',
    type: 'toggle',
    state: {
      enabled: false,
      visible: true,
      loading: false
    },
    metadata: {
      created: Date.now(),
      updated: Date.now(),
      version: '1.0.0',
      category: 'optimization',
      tags: ['ai', 'automation'],
      dependencies: []
    },
    config: {
      defaultValue: false,
      requiresAuth: true,
      roles: ['admin'],
      conditions: []
    }
  },

  automatedPricing: {
    id: 'automatedPricing',
    name: 'Automated Pricing',
    description: 'Enable dynamic pricing optimization',
    type: 'toggle',
    state: {
      enabled: false,
      visible: true,
      loading: false
    },
    metadata: {
      created: Date.now(),
      updated: Date.now(),
      version: '1.0.0',
      category: 'pricing',
      tags: ['automation', 'optimization'],
      dependencies: ['aiOptimization']
    },
    config: {
      defaultValue: false,
      requiresAuth: true,
      roles: ['admin'],
      conditions: []
    }
  }
}; 