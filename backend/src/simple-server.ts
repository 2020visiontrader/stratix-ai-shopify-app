// Simple server that doesn't depend on database
import cors from 'cors';
import express from 'express';
import { config } from './config';
import { logger } from './utils/logger';

// Create Express app
const app = express();

// Middleware
app.use(cors({
  origin: config.CORS_ORIGIN || '*',
  credentials: true
}));
app.use(express.json());

// Health check route
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.get('/api/v1/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Mock auth route
app.post('/api/v1/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  // Demo login
  if (email === 'demo@example.com' && password === 'password') {
    res.json({
      success: true,
      user: {
        id: '1',
        email: 'demo@example.com',
        name: 'Demo User'
      },
      token: 'mock-token-12345'
    });
  } else {
    res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }
});

// Mock dashboard data
app.get('/api/v1/dashboard', (req, res) => {
  res.json({
    metrics: {
      sales: 12500,
      visitors: 3200,
      conversion: 3.2,
      aov: 128.45
    },
    recentOrders: [
      { id: '1001', customer: 'John Doe', amount: 125.99, date: '2025-06-15' },
      { id: '1002', customer: 'Jane Smith', amount: 89.99, date: '2025-06-14' },
      { id: '1003', customer: 'Bob Johnson', amount: 229.99, date: '2025-06-13' }
    ]
  });
});

// Start server
const port = config.PORT || 3001;
app.listen(port, () => {
  logger.info(`Simple server is running on port ${port}`);
});

export { app };
