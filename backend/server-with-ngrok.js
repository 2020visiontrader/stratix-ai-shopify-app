const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const ngrok = require('@ngrok/ngrok');

// Simple Stratix AI Backend Server with ngrok integration
const app = express();
const PORT = process.env.PORT || 3001;

// Logger
const logger = {
  info: (message, meta = {}) => console.log(`[INFO] ${new Date().toISOString()} - ${message}`, meta),
  error: (message, meta = {}) => console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, meta)
};

// Store ngrok URL globally
let ngrokUrl = null;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));
app.use(helmet());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: 'development',
    ngrokUrl: ngrokUrl || 'Not available'
  });
});

// API Routes

// Analysis endpoints
app.post('/api/analysis', (req, res) => {
  const { content, type, framework } = req.body;
  
  // Mock analysis response
  const mockResponse = {
    id: `analysis_${Date.now()}`,
    suggestions: [
      'Use more action-oriented language in your headlines',
      'Add emotional triggers to increase engagement',
      'Include specific benefits rather than generic features'
    ],
    frameworks: ['AIDA', 'PAS', 'Hook-Story-Close'],
    confidence: 0.87,
    improvements: [
      { type: 'headline', suggestion: 'Make your headline more specific and benefit-focused' },
      { type: 'cta', suggestion: 'Use stronger action verbs in your call-to-action' },
      { type: 'body', suggestion: 'Break up long paragraphs for better readability' }
    ],
    contentType: type || 'general',
    processedAt: new Date().toISOString()
  };
  
  logger.info('Analysis request processed', { contentLength: content?.length || 0, type, framework });
  res.json(mockResponse);
});

// Brand DNA endpoints
app.get('/api/brands/:id/dna', (req, res) => {
  const { id } = req.params;
  
  const mockBrandDNA = {
    brandId: id,
    personality: {
      voice: 'Professional yet approachable',
      tone: 'Confident and helpful',
      values: ['Innovation', 'Reliability', 'Customer Success'],
      archetype: 'The Sage'
    },
    guidelines: {
      doUse: ['Clear, concise language', 'Data-driven insights', 'Solution-focused messaging'],
      dontUse: ['Jargon without explanation', 'Overly casual language', 'Pushy sales tactics']
    },
    colorPalette: ['#1a73e8', '#34a853', '#fbbc04', '#ea4335'],
    messaging: {
      tagline: 'Optimize. Analyze. Succeed.',
      keyMessages: [
        'AI-powered e-commerce optimization',
        'Data-driven decision making',
        'Measurable results for your business'
      ]
    },
    lastUpdated: new Date().toISOString()
  };
  
  logger.info('Brand DNA request processed', { brandId: id });
  res.json(mockBrandDNA);
});

// Content generation endpoints
app.post('/api/content/generate', (req, res) => {
  const { type, prompt, brandId, framework } = req.body;
  
  const mockContent = {
    id: `content_${Date.now()}`,
    type: type || 'product_description',
    content: {
      headline: 'Transform Your E-commerce Performance with AI',
      body: 'Discover how our advanced AI algorithms can optimize your product listings, improve conversion rates, and boost your sales by up to 40%. Get started with intelligent recommendations tailored to your brand.',
      cta: 'Start Your Free Trial Today',
      keywords: ['AI optimization', 'e-commerce', 'conversion rates', 'sales boost']
    },
    variations: [
      {
        headline: 'Boost Sales with Smart AI Optimization',
        body: 'Leverage cutting-edge AI technology to enhance your online store performance and maximize revenue potential.',
        cta: 'Try AI Optimization Now'
      }
    ],
    framework: framework || 'AIDA',
    brandId: brandId || 'default',
    createdAt: new Date().toISOString()
  };
  
  logger.info('Content generation request processed', { type, framework, brandId });
  res.json(mockContent);
});

// Performance metrics endpoints
app.get('/api/performance/metrics', (req, res) => {
  const mockMetrics = {
    overview: {
      totalRevenue: 125000,
      conversionRate: 3.2,
      averageOrderValue: 85.50,
      totalOrders: 1463,
      period: 'last_30_days'
    },
    trends: {
      revenueGrowth: 15.3,
      conversionImprovement: 8.7,
      orderVolumeIncrease: 12.1
    },
    topProducts: [
      { id: 'prod_1', name: 'Premium Widget', revenue: 25000, orders: 294 },
      { id: 'prod_2', name: 'Deluxe Package', revenue: 18500, orders: 216 },
      { id: 'prod_3', name: 'Starter Kit', revenue: 15200, orders: 178 }
    ],
    optimizations: {
      applied: 23,
      pending: 5,
      impact: 'High performance improvement detected'
    },
    lastUpdated: new Date().toISOString()
  };
  
  logger.info('Performance metrics request processed');
  res.json(mockMetrics);
});

// Products endpoints
app.get('/api/products', (req, res) => {
  const mockProducts = {
    products: [
      {
        id: 'prod_1',
        title: 'Premium AI Widget',
        description: 'Advanced AI-powered widget for e-commerce optimization',
        price: 299.99,
        status: 'active',
        optimization: {
          score: 85,
          suggestions: ['Improve title keywords', 'Add more product images'],
          priority: 'medium'
        }
      },
      {
        id: 'prod_2',
        title: 'Deluxe Analytics Package',
        description: 'Comprehensive analytics suite for data-driven decisions',
        price: 199.99,
        status: 'active',
        optimization: {
          score: 92,
          suggestions: ['Perfect optimization detected'],
          priority: 'low'
        }
      }
    ],
    total: 2,
    optimized: 2,
    needsAttention: 0,
    lastSync: new Date().toISOString()
  };
  
  logger.info('Products request processed');
  res.json(mockProducts);
});

// Security endpoints
app.get('/api/security/scan', (req, res) => {
  const mockSecurityScan = {
    status: 'completed',
    score: 95,
    issues: {
      critical: 0,
      high: 0,
      medium: 1,
      low: 2
    },
    findings: [
      {
        type: 'medium',
        title: 'API Rate Limiting',
        description: 'Consider implementing stricter rate limiting for public endpoints',
        recommendation: 'Add rate limiting middleware with lower thresholds'
      },
      {
        type: 'low',
        title: 'Security Headers',
        description: 'Additional security headers could be implemented',
        recommendation: 'Add Content-Security-Policy and X-Frame-Options headers'
      }
    ],
    lastScan: new Date().toISOString(),
    nextScan: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  };
  
  logger.info('Security scan request processed');
  res.json(mockSecurityScan);
});

// Settings endpoints
app.get('/api/settings', (req, res) => {
  const mockSettings = {
    general: {
      companyName: 'Stratix AI Demo',
      industry: 'E-commerce',
      timezone: 'UTC',
      currency: 'USD'
    },
    ai: {
      optimizationLevel: 'aggressive',
      autoApply: false,
      learningMode: true,
      frameworks: ['AIDA', 'PAS', 'Hook-Story-Close']
    },
    notifications: {
      email: true,
      push: false,
      frequency: 'daily'
    },
    integrations: {
      shopify: { connected: true, lastSync: new Date().toISOString() },
      analytics: { connected: false },
      email: { connected: true, provider: 'SendGrid' }
    },
    lastUpdated: new Date().toISOString()
  };
  
  logger.info('Settings request processed');
  res.json(mockSettings);
});

// Trial status endpoints
app.get('/api/trials/status', (req, res) => {
  const mockTrialStatus = {
    isActive: true,
    plan: 'Premium Trial',
    daysRemaining: 14,
    startDate: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    usage: {
      apiCalls: 1250,
      limit: 5000,
      percentage: 25
    },
    features: {
      aiOptimization: true,
      advancedAnalytics: true,
      customBranding: true,
      prioritySupport: true
    },
    upgradeOptions: [
      { plan: 'Professional', price: 99, features: ['Unlimited API calls', 'Advanced reporting'] },
      { plan: 'Enterprise', price: 299, features: ['Custom integrations', 'Dedicated support'] }
    ]
  };
  
  logger.info('Trial status request processed');
  res.json(mockTrialStatus);
});

// ngrok URL endpoint for frontend
app.get('/api/ngrok-url', (req, res) => {
  res.json({ 
    url: ngrokUrl || null,
    available: !!ngrokUrl,
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Endpoint not found',
    availableEndpoints: [
      'GET /health',
      'POST /api/analysis',
      'GET /api/brands/:id/dna',
      'POST /api/content/generate',
      'GET /api/performance/metrics',
      'GET /api/products',
      'GET /api/security/scan',
      'GET /api/settings',
      'GET /api/trials/status',
      'GET /api/ngrok-url'
    ]
  });
});

// Error handler
app.use((err, req, res, next) => {
  logger.error('Server error', { error: err.message, stack: err.stack });
  res.status(500).json({ error: 'Internal server error' });
});

// Start server and ngrok tunnel
async function startServerWithNgrok() {
  try {
    // Start the Express server
    const server = app.listen(PORT, () => {
      logger.info(`🚀 Stratix AI Backend Server running on port ${PORT}`);
      logger.info(`📍 Local URL: http://localhost:${PORT}`);
      logger.info(`🏥 Health check: http://localhost:${PORT}/health`);
    });

    // Wait a moment for server to be ready
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Start ngrok tunnel
    logger.info('🌐 Starting ngrok tunnel...');
    const listener = await ngrok.connect({
      addr: PORT,
      authtoken_from_env: true
    });

    ngrokUrl = listener.url();
    logger.info(`✅ ngrok tunnel established at: ${ngrokUrl}`);
    logger.info(`🔌 API Endpoints accessible at:`);
    logger.info(`   Health Check: ${ngrokUrl}/health`);
    logger.info(`   Analysis API: ${ngrokUrl}/api/analysis`);
    logger.info(`   Brand DNA: ${ngrokUrl}/api/brands/{id}/dna`);
    logger.info(`   Content Generation: ${ngrokUrl}/api/content/generate`);
    logger.info(`   All other endpoints available at: ${ngrokUrl}/api/*`);
    
    logger.info(`\n📋 Frontend Integration:`);
    logger.info(`   Update your frontend API client to use: ${ngrokUrl}`);
    logger.info(`   Or visit: ${ngrokUrl}/api/ngrok-url to get the URL programmatically`);

    // Write the URL to a file for easy access
    const fs = require('fs');
    fs.writeFileSync('.ngrok-url', ngrokUrl);
    logger.info(`💾 URL saved to .ngrok-url file`);

    // Handle graceful shutdown
    const cleanup = async () => {
      logger.info('🛑 Shutting down server and ngrok tunnel...');
      await listener.close();
      server.close();
      // Clean up the URL file
      try {
        fs.unlinkSync('.ngrok-url');
      } catch (e) {
        // Ignore if file doesn't exist
      }
      process.exit(0);
    };

    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);

  } catch (error) {
    logger.error('❌ Error starting server with ngrok:', error);
    console.error('💡 Make sure ngrok is installed and authenticated');
    console.error('💡 Check your ngrok auth token: ngrok config check');
    process.exit(1);
  }
}

// Start everything
startServerWithNgrok();
