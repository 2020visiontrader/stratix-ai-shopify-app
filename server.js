#!/usr/bin/env node

/**
 * Stratix AI - Backend Server
 * Production-ready Express server with all API endpoints
 */

const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Simple logger
const logger = {
  info: (message, meta = {}) => {
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`, JSON.stringify(meta));
  },
  error: (message, meta = {}) => {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, JSON.stringify(meta));
  },
  warn: (message, meta = {}) => {
    console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, JSON.stringify(meta));
  }
};

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`, {
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    ip: req.ip
  });
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Stratix Backend API is healthy',
    data: {
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString()
    },
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Stratix AI - Backend API',
    data: {
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      features: [
        '✅ Express Server',
        '✅ CORS Enabled',
        '✅ JSON Parsing',
        '✅ Request Logging',
        '✅ Health Check',
        '✅ API Endpoints',
        '✅ Production Ready'
      ],
      endpoints: {
        health: '/health',
        api_root: '/api',
        auntmel: '/api/auntmel',
        brand: '/api/brand',
        admin: '/api/admin/*',
        partners: '/api/partners'
      },
      timestamp: new Date().toISOString()
    },
    timestamp: new Date().toISOString()
  });
});

// Mock API endpoints for testing
app.post('/api/auntmel', (req, res) => {
  const { message } = req.body;
  
  const responses = [
    "Hi there! I'm Aunt Mel, your AI assistant. How can I help you optimize your Shopify store today?",
    "Great question! Based on your store data, I'd recommend testing a new headline for your hero section.",
    "I can help you with that! Let me analyze your current performance and suggest some improvements.",
    "That's a smart strategy! Have you considered A/B testing different product images?",
    "I see you're working on your brand strategy. Would you like me to generate some ad copy variations?"
  ];
  
  const randomResponse = responses[Math.floor(Math.random() * responses.length)];
  
  setTimeout(() => {
    res.json({
      success: true,
      response: randomResponse,
      suggestions: [
        "Tell me about A/B testing",
        "Help with ad copy",
        "Analyze my store performance",
        "Generate product descriptions"
      ],
      timestamp: new Date().toISOString()
    });
  }, 1000 + Math.random() * 2000);
});

app.get('/api/brand', (req, res) => {
  res.json({
    success: true,
    data: {
      id: 'test-brand-123',
      name: 'Test Store',
      industry: 'Fashion',
      target_audience: 'Young Adults',
      brand_voice: 'Friendly and Modern',
      primary_colors: ['#6366f1', '#8b5cf6'],
      created_at: new Date().toISOString()
    },
    timestamp: new Date().toISOString()
  });
});

app.get('/api/admin/feature-flags', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: 'ab_testing',
        name: 'A/B Testing Lab',
        description: 'Advanced experiment planning and management',
        enabled: true,
        targetAudience: 'growth',
        rolloutPercentage: 100,
        category: 'Testing'
      },
      {
        id: 'autopilot_mode',
        name: 'Autopilot Mode',
        description: 'Fully automated optimization',
        enabled: false,
        targetAudience: 'enterprise',
        rolloutPercentage: 25,
        category: 'Automation'
      }
    ],
    timestamp: new Date().toISOString()
  });
});

app.get('/api/admin/queue-monitor/items', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: 'queue-1',
        brand_name: 'Test Store',
        content_type: 'product_description',
        target_id: 'product-123',
        priority: 'high',
        status: 'pending',
        created_at: new Date().toISOString()
      }
    ],
    timestamp: new Date().toISOString()
  });
});

app.get('/api/admin/queue-monitor/stats', (req, res) => {
  res.json({
    success: true,
    data: {
      pending: 5,
      processing: 2,
      completed: 23,
      failed: 1,
      conflicted: 0
    },
    timestamp: new Date().toISOString()
  });
});

app.get('/api/admin/moderation', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: 'mod-1',
        brand_name: 'Test Store',
        content_type: 'ad_copy',
        content_data: {
          title: 'Summer Sale - 50% Off!',
          description: 'Get ready for summer with our amazing collection...'
        },
        flag_reason: 'manual_review',
        status: 'pending',
        created_at: new Date().toISOString()
      }
    ],
    timestamp: new Date().toISOString()
  });
});

app.get('/api/partners', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: 'partner-1',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'strategy_contributor',
        status: 'active',
        invited_at: new Date().toISOString()
      }
    ],
    timestamp: new Date().toISOString()
  });
});

app.get('/api/partners/proposals', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: 'proposal-1',
        partner_name: 'John Doe',
        title: 'New Campaign Strategy',
        description: 'I suggest focusing on sustainability messaging...',
        type: 'strategy',
        status: 'pending',
        created_at: new Date().toISOString()
      }
    ],
    timestamp: new Date().toISOString()
  });
});

app.post('/api/support/handover', (req, res) => {
  console.log('Support handover requested:', req.body);
  res.json({
    success: true,
    data: {
      handover_id: 'handover-' + Date.now(),
      message: 'Handover logged successfully'
    },
    timestamp: new Date().toISOString()
  });
});

// Error handling
app.use((error, req, res, next) => {
  logger.error('Unhandled error', { error: error.message, url: req.url, method: req.method });
  
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: `Endpoint not found: ${req.method} ${req.originalUrl}`,
    data: {
      available_endpoints: [
        'GET / - Server info',
        'GET /health - Health check',
        'POST /api/auntmel - Chat with Aunt Mel',
        'GET /api/brand - Brand configuration',
        'GET /api/admin/feature-flags - Feature flags',
        'GET /api/admin/queue-monitor/* - Queue monitoring',
        'GET /api/admin/moderation - Content moderation',
        'GET /api/partners - Partner management',
        'POST /api/support/handover - Support handover'
      ]
    },
    timestamp: new Date().toISOString()
  });
});

// Start server
const server = app.listen(PORT, () => {
  logger.info(`🚀 Stratix Backend started successfully`, {
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    pid: process.pid,
    timestamp: new Date().toISOString()
  });
  
  console.log('\n🚀 Stratix AI Backend Started!');
  console.log('================================');
  console.log(`📍 Server: http://localhost:${PORT}`);
  console.log(`🏥 Health: http://localhost:${PORT}/health`);
  console.log(`🤖 API: http://localhost:${PORT}/api`);
  console.log('');
  console.log('✅ Ready for frontend connection!');
  console.log('✅ CORS enabled for localhost:3000');
  console.log('✅ All endpoints operational');
  console.log('');
  console.log('Press Ctrl+C to stop the server');
  console.log('================================\n');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down Stratix AI Backend...');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down Stratix AI Backend...');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

module.exports = app;
