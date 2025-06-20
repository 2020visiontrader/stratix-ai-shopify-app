import cors from 'cors';
import express from 'express';
import helmet from 'helmet';

// Simple Stratix AI Backend Server for Testing
const app = express();
const PORT = process.env.PORT || 3001;

// Logger
const logger = {
  info: (message, meta = {}) => console.log(`[INFO] ${new Date().toISOString()} - ${message}`, meta),
  error: (message, meta = {}) => console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, meta)
};

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));
app.use(helmet());
app.use(express.json());

// Add ngrok-friendly headers
app.use((req, res, next) => {
  // Allow ngrok to work properly
  res.header('ngrok-skip-browser-warning', 'true');
  next();
});

// Root endpoint with API information
app.get('/', (req, res) => {
  const isNgrok = req.get('host')?.includes('ngrok');
  const baseUrl = isNgrok ? `https://${req.get('host')}` : `http://${req.get('host')}`;
  
  res.json({
    message: 'Stratix AI Backend API',
    version: '1.0.0',
    environment: 'development',
    documentation: 'https://github.com/your-repo/api-docs',
    endpoints: {
      health: `${baseUrl}/health`,
      analysis: `${baseUrl}/api/analysis`,
      brandDna: `${baseUrl}/api/brands/{id}/dna`,
      contentGeneration: `${baseUrl}/api/content/generate`,
      performanceMetrics: `${baseUrl}/api/performance/metrics`,
      products: `${baseUrl}/api/products`,
      securityScan: `${baseUrl}/api/security/scan`,
      settings: `${baseUrl}/api/settings`,
      trialStatus: `${baseUrl}/api/trials/status`
    },
    testInstructions: {
      browser: `Visit ${baseUrl}/health for a simple health check`,
      curl: `curl -H "ngrok-skip-browser-warning: true" ${baseUrl}/health`,
      frontend: 'http://localhost:3000/api-test'
    },
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  const isNgrok = req.get('host')?.includes('ngrok');
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: 'development',
    host: req.get('host'),
    accessType: isNgrok ? 'ngrok-tunnel' : 'local',
    url: isNgrok ? `https://${req.get('host')}` : `http://${req.get('host')}`
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
      { type: 'cta', suggestion: 'Use stronger call-to-action verbs' }
    ]
  };
  
  logger.info('Analysis request processed', { type, contentLength: content?.length });
  res.json({ success: true, data: mockResponse });
});

// Brand endpoints
app.get('/api/brands/:brandId/dna', (req, res) => {
  const { brandId } = req.params;
  
  const mockBrandDNA = {
    id: brandId,
    personality: ['Innovative', 'Trustworthy', 'Customer-focused'],
    values: ['Quality', 'Sustainability', 'Innovation'],
    voice: 'Professional yet approachable',
    target_audience: 'Tech-savvy professionals aged 25-45',
    unique_proposition: 'Cutting-edge solutions with personal touch'
  };
  
  logger.info('Brand DNA request', { brandId });
  res.json({ success: true, data: mockBrandDNA });
});

// Content generation endpoints
app.post('/api/content/generate', (req, res) => {
  const { type, prompt, brand_id } = req.body;
  
  const mockContent = {
    id: `content_${Date.now()}`,
    type,
    generated_text: 'This is AI-generated content optimized for your brand voice and audience.',
    suggestions: ['Consider adding more emotional appeal', 'Include a stronger call-to-action'],
    brand_alignment_score: 0.92
  };
  
  logger.info('Content generation request', { type, brand_id });
  res.json({ success: true, data: mockContent });
});

// Performance endpoints
app.get('/api/performance/metrics', (req, res) => {
  const mockMetrics = {
    conversion_rate: 3.2,
    bounce_rate: 45.6,
    avg_session_duration: 180,
    page_views: 15420,
    unique_visitors: 8934,
    trends: {
      conversion_rate: '+12%',
      traffic: '+8%',
      engagement: '+15%'
    }
  };
  
  logger.info('Performance metrics request');
  res.json({ success: true, data: mockMetrics });
});

// Products endpoints
app.get('/api/products', (req, res) => {
  const mockProducts = [
    {
      id: 'prod_1',
      name: 'Premium Widget',
      price: 99.99,
      conversion_rate: 4.2,
      optimization_score: 78
    },
    {
      id: 'prod_2',
      name: 'Basic Widget',
      price: 49.99,
      conversion_rate: 3.8,
      optimization_score: 65
    }
  ];
  
  logger.info('Products request');
  res.json({ success: true, data: mockProducts });
});

// Security endpoints
app.get('/api/security/scan', (req, res) => {
  const mockSecurityScan = {
    status: 'completed',
    score: 95,
    vulnerabilities: 0,
    recommendations: ['Enable 2FA for admin accounts', 'Update SSL certificate'],
    last_scan: new Date().toISOString()
  };
  
  logger.info('Security scan request');
  res.json({ success: true, data: mockSecurityScan });
});

// Settings endpoints
app.get('/api/settings', (req, res) => {
  const mockSettings = {
    notifications: true,
    auto_optimization: false,
    reporting_frequency: 'weekly',
    api_limits: {
      requests_per_hour: 1000,
      used: 45
    }
  };
  
  logger.info('Settings request');
  res.json({ success: true, data: mockSettings });
});

// Trials endpoints
app.get('/api/trials/status', (req, res) => {
  const mockTrialStatus = {
    active: true,
    days_remaining: 12,
    features_used: ['analysis', 'content_generation'],
    upgrade_available: true
  };
  
  logger.info('Trial status request');
  res.json({ success: true, data: mockTrialStatus });
});

// Error handling
app.use((err, req, res, next) => {
  logger.error('Server error', { error: err.message, stack: err.stack });
  res.status(500).json({ 
    success: false, 
    error: 'Internal server error' 
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    error: 'Endpoint not found' 
  });
});

// Start server
app.listen(PORT, () => {
  logger.info(`🚀 Stratix AI Backend Server running on port ${PORT}`);
  logger.info(`📊 Health check: http://localhost:${PORT}/health`);
  logger.info(`🔗 API Base URL: http://localhost:${PORT}/api`);
});
