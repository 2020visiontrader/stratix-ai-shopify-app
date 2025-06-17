import { NextFunction, Request, Response, Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { verifyShopifySession } from '../middleware/shopify-auth';
import { validateRequest } from '../middleware/validation';

const router = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.mimetype === 'application/json') {
      cb(null, true);
    } else {
      cb(new Error('Only CSV and JSON files are allowed'));
    }
  }
});

// Request validation schemas
const getMetricsSchema = z.object({
  query: z.object({
    productId: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    period: z.enum(['7d', '30d', '90d', '1y']).default('30d'),
    metrics: z.array(z.enum(['views', 'clicks', 'conversions', 'revenue'])).optional()
  })
});

// Extended request interface
interface ExtendedRequest extends Request {
  shop?: any;
  shopDomain?: string;
  file?: Express.Multer.File;
}

// Get performance metrics
router.get(
  '/metrics',
  verifyShopifySession,
  validateRequest(getMetricsSchema),
  async (req: ExtendedRequest, res: Response, next: NextFunction) => {
    try {
      const { productId, startDate, endDate, period, metrics } = req.query as any;
      const shop = req.shop;

      if (!shop) {
        res.status(404).json({ 
          success: false, 
          error: 'Shop not found' 
        });
        return;
      }

      const performanceData = generateMockPerformanceMetrics(
        shop.id,
        productId,
        startDate,
        endDate,
        period,
        metrics
      );

      res.json({
        success: true,
        data: performanceData
      });
    } catch (error) {
      console.error('Performance metrics error:', error);
      next(error);
    }
  }
);

// Upload performance data
router.post(
  '/upload',
  verifyShopifySession,
  upload.single('file'),
  async (req: ExtendedRequest, res: Response, next: NextFunction) => {
    try {
      const shop = req.shop;
      const file = req.file;

      if (!shop) {
        res.status(404).json({ 
          success: false, 
          error: 'Shop not found' 
        });
        return;
      }

      if (!file) {
        res.status(400).json({ 
          success: false, 
          error: 'No file uploaded' 
        });
        return;
      }

      // Process the uploaded file
      const result = await processPerformanceFile(file);

      res.json({
        success: true,
        data: {
          processed: result.recordsProcessed,
          errors: result.errors,
          summary: result.summary
        },
        message: `Successfully processed ${result.recordsProcessed} records`
      });
    } catch (error) {
      console.error('Performance upload error:', error);
      next(error);
    }
  }
);

// Get performance dashboard data
router.get(
  '/dashboard',
  verifyShopifySession,
  async (req: ExtendedRequest, res: Response, next: NextFunction) => {
    try {
      const shop = req.shop;

      if (!shop) {
        res.status(404).json({ 
          success: false, 
          error: 'Shop not found' 
        });
        return;
      }

      const dashboardData = generateDashboardData(shop.id);

      res.json({
        success: true,
        data: dashboardData
      });
    } catch (error) {
      console.error('Dashboard data error:', error);
      next(error);
    }
  }
);

// Get top performing products
router.get(
  '/top-products',
  verifyShopifySession,
  async (req: ExtendedRequest, res: Response, next: NextFunction) => {
    try {
      const { limit = 10, metric = 'revenue', period = '30d' } = req.query as any;
      const shop = req.shop;

      if (!shop) {
        res.status(404).json({ 
          success: false, 
          error: 'Shop not found' 
        });
        return;
      }

      const topProducts = generateTopProducts(shop.id, metric, period, parseInt(limit));

      res.json({
        success: true,
        data: topProducts
      });
    } catch (error) {
      console.error('Top products error:', error);
      next(error);
    }
  }
);

// Get performance trends
router.get(
  '/trends',
  verifyShopifySession,
  async (req: ExtendedRequest, res: Response, next: NextFunction) => {
    try {
      const { period = '30d', metric = 'revenue' } = req.query as any;
      const shop = req.shop;

      if (!shop) {
        res.status(404).json({ 
          success: false, 
          error: 'Shop not found' 
        });
        return;
      }

      const trends = generatePerformanceTrends(shop.id, period, metric);

      res.json({
        success: true,
        data: trends
      });
    } catch (error) {
      console.error('Performance trends error:', error);
      next(error);
    }
  }
);

// Generate performance report
router.post(
  '/report',
  verifyShopifySession,
  async (req: ExtendedRequest, res: Response, next: NextFunction) => {
    try {
      const { reportType, startDate, endDate, includeProducts, format } = req.body;
      const shop = req.shop;

      if (!shop) {
        res.status(404).json({ 
          success: false, 
          error: 'Shop not found' 
        });
        return;
      }

      const report = await generatePerformanceReport({
        shopId: shop.id,
        reportType,
        startDate,
        endDate,
        includeProducts,
        format: format || 'json'
      });

      res.json({
        success: true,
        data: report,
        message: 'Performance report generated successfully'
      });
    } catch (error) {
      console.error('Performance report error:', error);
      next(error);
    }
  }
);

// Helper functions
function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

function generateMockPerformanceMetrics(
  shopId: string,
  productId?: string,
  startDate?: string,
  endDate?: string, 
  period: string = '30d',
  metrics?: string[]
): any {
  const days = getDaysFromPeriod(period);
  const data = [];
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    data.push({
      date: date.toISOString().split('T')[0],
      views: Math.floor(Math.random() * 1000) + 100,
      clicks: Math.floor(Math.random() * 150) + 20,
      conversions: Math.floor(Math.random() * 25) + 2,
      revenue: Math.floor(Math.random() * 5000) + 500,
      clickThroughRate: Math.random() * 0.1 + 0.05,
      conversionRate: Math.random() * 0.05 + 0.01
    });
  }
  
  const summary = {
    totalViews: data.reduce((sum, day) => sum + day.views, 0),
    totalClicks: data.reduce((sum, day) => sum + day.clicks, 0),
    totalConversions: data.reduce((sum, day) => sum + day.conversions, 0),
    totalRevenue: data.reduce((sum, day) => sum + day.revenue, 0),
    averageClickThroughRate: data.reduce((sum, day) => sum + day.clickThroughRate, 0) / data.length,
    averageConversionRate: data.reduce((sum, day) => sum + day.conversionRate, 0) / data.length
  };
  
  return {
    period,
    productId,
    summary,
    dailyData: data,
    trends: calculateTrends(data)
  };
}

function processPerformanceFile(file: Express.Multer.File): Promise<any> {
  return new Promise((resolve, reject) => {
    try {
      const content = file.buffer.toString('utf8');
      let records = [];
      
      if (file.mimetype === 'application/json') {
        records = JSON.parse(content);
      } else if (file.mimetype === 'text/csv') {
        // Simple CSV parsing (in production, use a proper CSV parser)
        const lines = content.split('\n');
        const headers = lines[0].split(',');
        
        for (let i = 1; i < lines.length; i++) {
          if (lines[i].trim()) {
            const values = lines[i].split(',');
            const record: any = {};
            headers.forEach((header, index) => {
              record[header.trim()] = values[index]?.trim();
            });
            records.push(record);
          }
        }
      }
      
      // Validate and process records
      const processedRecords = records.filter((record: any) => {
        return record.productId && record.date && (record.views || record.clicks || record.conversions);
      });
      
      const result = {
        recordsProcessed: processedRecords.length,
        errors: records.length - processedRecords.length,
        summary: {
          totalViews: processedRecords.reduce((sum: number, record: any) => sum + (parseInt(record.views) || 0), 0),
          totalClicks: processedRecords.reduce((sum: number, record: any) => sum + (parseInt(record.clicks) || 0), 0),
          totalConversions: processedRecords.reduce((sum: number, record: any) => sum + (parseInt(record.conversions) || 0), 0),
        }
      };
      
      resolve(result);
    } catch (error) {
      reject(error);
    }
  });
}

function generateDashboardData(shopId: string): any {
  return {
    overview: {
      totalViews: Math.floor(Math.random() * 50000) + 10000,
      totalClicks: Math.floor(Math.random() * 5000) + 1000,
      totalConversions: Math.floor(Math.random() * 500) + 100,
      totalRevenue: Math.floor(Math.random() * 100000) + 20000,
      averageOrderValue: Math.floor(Math.random() * 200) + 50,
      conversionRate: (Math.random() * 0.05 + 0.01).toFixed(3)
    },
    charts: {
      revenue: generateChartData('revenue', 30),
      conversions: generateChartData('conversions', 30),
      traffic: generateChartData('views', 30)
    },
    alerts: [
      {
        type: 'warning',
        message: 'Product X has low conversion rate this week',
        priority: 'medium'
      },
      {
        type: 'success',
        message: 'Overall revenue increased 15% this month',
        priority: 'low'
      }
    ]
  };
}

function generateTopProducts(shopId: string, metric: string, period: string, limit: number): any[] {
  const products = [];
  
  for (let i = 0; i < limit; i++) {
    products.push({
      id: generateId(),
      title: `Top Product ${i + 1}`,
      image: `https://cdn.shopify.com/s/files/1/0000/0000/${i + 1}/product.jpg`,
      metrics: {
        views: Math.floor(Math.random() * 5000) + 1000,
        clicks: Math.floor(Math.random() * 500) + 100,
        conversions: Math.floor(Math.random() * 50) + 10,
        revenue: Math.floor(Math.random() * 10000) + 2000,
        conversionRate: (Math.random() * 0.1 + 0.02).toFixed(3)
      },
      trend: Math.random() > 0.5 ? 'up' : 'down',
      change: (Math.random() * 30 + 5).toFixed(1)
    });
  }
  
  return products.sort((a, b) => {
    const aValue = (a.metrics as any)[metric] || 0;
    const bValue = (b.metrics as any)[metric] || 0;
    return typeof aValue === 'string' ? parseFloat(bValue) - parseFloat(aValue) : bValue - aValue;
  });
}

function generatePerformanceTrends(shopId: string, period: string, metric: string): any {
  const days = getDaysFromPeriod(period);
  const currentPeriod = generateChartData(metric, days);
  const previousPeriod = generateChartData(metric, days);
  
  const currentTotal = currentPeriod.reduce((sum, point) => sum + point.value, 0);
  const previousTotal = previousPeriod.reduce((sum, point) => sum + point.value, 0);
  const change = ((currentTotal - previousTotal) / previousTotal * 100).toFixed(1);
  
  return {
    metric,
    period,
    currentPeriod,
    previousPeriod,
    summary: {
      current: currentTotal,
      previous: previousTotal,
      change: parseFloat(change),
      trend: parseFloat(change) > 0 ? 'up' : 'down'
    }
  };
}

function generatePerformanceReport(options: any): Promise<any> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const report = {
        id: generateId(),
        type: options.reportType || 'summary',
        period: {
          start: options.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          end: options.endDate || new Date().toISOString()
        },
        summary: {
          totalViews: Math.floor(Math.random() * 100000) + 10000,
          totalClicks: Math.floor(Math.random() * 10000) + 1000,
          totalConversions: Math.floor(Math.random() * 1000) + 100,
          totalRevenue: Math.floor(Math.random() * 200000) + 20000
        },
        topProducts: generateTopProducts(options.shopId, 'revenue', '30d', 10),
        insights: [
          'Revenue increased 12% compared to last period',
          'Mobile traffic accounts for 65% of total views',
          'Conversion rate improved by 0.8% this month'
        ],
        recommendations: [
          'Focus on optimizing mobile experience',
          'Consider A/B testing product descriptions',
          'Implement abandoned cart recovery campaigns'
        ],
        generatedAt: new Date().toISOString()
      };
      
      resolve(report);
    }, 1000);
  });
}

function getDaysFromPeriod(period: string): number {
  switch (period) {
    case '7d': return 7;
    case '30d': return 30;
    case '90d': return 90;
    case '1y': return 365;
    default: return 30;
  }
}

function generateChartData(metric: string, days: number): any[] {
  const data = [];
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    let value;
    switch (metric) {
      case 'revenue':
        value = Math.floor(Math.random() * 5000) + 1000;
        break;
      case 'conversions':
        value = Math.floor(Math.random() * 50) + 10;
        break;
      case 'views':
        value = Math.floor(Math.random() * 1000) + 200;
        break;
      default:
        value = Math.floor(Math.random() * 100) + 10;
    }
    
    data.push({
      date: date.toISOString().split('T')[0],
      value
    });
  }
  
  return data;
}

function calculateTrends(data: any[]): any {
  if (data.length < 2) return { trend: 'stable', change: 0 };
  
  const firstHalf = data.slice(0, Math.floor(data.length / 2));
  const secondHalf = data.slice(Math.floor(data.length / 2));
  
  const firstAvg = firstHalf.reduce((sum, day) => sum + day.revenue, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((sum, day) => sum + day.revenue, 0) / secondHalf.length;
  
  const change = ((secondAvg - firstAvg) / firstAvg * 100).toFixed(1);
  
  return {
    trend: parseFloat(change) > 5 ? 'up' : parseFloat(change) < -5 ? 'down' : 'stable',
    change: parseFloat(change)
  };
}

export default router;
