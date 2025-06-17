import { NextFunction, Request, Response, Router } from 'express';
import { verifyShopifySession } from '../middleware/shopify-auth';

const router = Router();
// const db = new DatabaseService(); // Will implement proper database integration later

// Extended request interface
interface ExtendedRequest extends Request {
  shop?: any;
  shopDomain?: string;
}

// Get trial status
router.get(
  '/status',
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

      // Mock trial data for now
      const trialStatus = generateMockTrialStatus(shop.id);

      res.json({
        success: true,
        data: trialStatus
      });
    } catch (error) {
      console.error('Trial status error:', error);
      next(error);
    }
  }
);

// Start trial
router.post(
  '/start',
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

      // Check if trial already exists
      const existingTrial = await checkExistingTrial(shop.id);
      
      if (existingTrial && existingTrial.active) {
        res.status(400).json({ 
          success: false, 
          error: 'Trial already active' 
        });
        return;
      }

      // Start new trial
      const trial = await createNewTrial(shop.id);

      res.json({
        success: true,
        data: {
          trialId: trial.id,
          startDate: trial.startDate,
          endDate: trial.endDate,
          features: trial.features
        },
        message: 'Trial started successfully'
      });
    } catch (error) {
      console.error('Start trial error:', error);
      next(error);
    }
  }
);

// Extend trial
router.post(
  '/extend',
  verifyShopifySession,
  async (req: ExtendedRequest, res: Response, next: NextFunction) => {
    try {
      const { days = 7 } = req.body;
      const shop = req.shop;

      if (!shop) {
        res.status(404).json({ 
          success: false, 
          error: 'Shop not found' 
        });
        return;
      }

      const extendedTrial = await extendTrial(shop.id, days);
      
      if (!extendedTrial) {
        res.status(404).json({ 
          success: false, 
          error: 'No active trial found' 
        });
        return;
      }

      res.json({
        success: true,
        data: extendedTrial,
        message: `Trial extended by ${days} days`
      });
    } catch (error) {
      console.error('Extend trial error:', error);
      next(error);
    }
  }
);

// Cancel trial
router.post(
  '/cancel',
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

      const cancelledTrial = await cancelTrial(shop.id);
      
      if (!cancelledTrial) {
        res.status(404).json({ 
          success: false, 
          error: 'No active trial found' 
        });
        return;
      }

      res.json({
        success: true,
        data: cancelledTrial,
        message: 'Trial cancelled successfully'
      });
    } catch (error) {
      console.error('Cancel trial error:', error);
      next(error);
    }
  }
);

// Get trial usage
router.get(
  '/usage',
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

      const usage = generateMockTrialUsage(shop.id);

      res.json({
        success: true,
        data: usage
      });
    } catch (error) {
      console.error('Trial usage error:', error);
      next(error);
    }
  }
);

// Get trial features
router.get(
  '/features',
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

      const features = getTrialFeatures();

      res.json({
        success: true,
        data: features
      });
    } catch (error) {
      console.error('Trial features error:', error);
      next(error);
    }
  }
);

// Helper functions
function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

function generateMockTrialStatus(shopId: string): any {
  const startDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
  const endDate = new Date(Date.now() + 20 * 24 * 60 * 60 * 1000);
  const now = new Date();
  
  const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  return {
    active: daysRemaining > 0,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    daysRemaining: Math.max(daysRemaining, 0),
    daysUsed: Math.max(30 - daysRemaining, 0),
    features: [
      'AI Content Analysis',
      'Product Optimization',
      'Performance Analytics',
      'Brand Alignment Check',
      'SEO Recommendations'
    ],
    limits: {
      analysesPerMonth: 100,
      analysesUsed: Math.floor(Math.random() * 80) + 10,
      optimizationsPerMonth: 50,
      optimizationsUsed: Math.floor(Math.random() * 40) + 5
    },
    status: daysRemaining > 0 ? 'active' : 'expired'
  };
}

async function checkExistingTrial(shopId: string): Promise<any> {
  // Mock implementation - in real app, check database
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        id: generateId(),
        shopId,
        active: Math.random() > 0.7, // 30% chance of existing active trial
        startDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString()
      });
    }, 100);
  });
}

async function createNewTrial(shopId: string): Promise<any> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const startDate = new Date();
      const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
      
      resolve({
        id: generateId(),
        shopId,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        features: [
          'AI Content Analysis',
          'Product Optimization',
          'Performance Analytics',
          'Brand Alignment Check',
          'SEO Recommendations'
        ],
        limits: {
          analysesPerMonth: 100,
          optimizationsPerMonth: 50
        },
        status: 'active'
      });
    }, 200);
  });
}

async function extendTrial(shopId: string, days: number): Promise<any> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const currentEndDate = new Date(Date.now() + 20 * 24 * 60 * 60 * 1000);
      const newEndDate = new Date(currentEndDate.getTime() + days * 24 * 60 * 60 * 1000);
      
      resolve({
        id: generateId(),
        shopId,
        endDate: newEndDate.toISOString(),
        daysExtended: days,
        newDaysRemaining: Math.ceil((newEndDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      });
    }, 100);
  });
}

async function cancelTrial(shopId: string): Promise<any> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        id: generateId(),
        shopId,
        status: 'cancelled',
        cancelledAt: new Date().toISOString(),
        remainingDays: 0
      });
    }, 100);
  });
}

function generateMockTrialUsage(shopId: string): any {
  return {
    period: 'current_trial',
    usage: {
      analyses: {
        total: Math.floor(Math.random() * 80) + 10,
        limit: 100,
        percentage: Math.floor((Math.random() * 80 + 10) / 100 * 100)
      },
      optimizations: {
        total: Math.floor(Math.random() * 40) + 5,
        limit: 50,
        percentage: Math.floor((Math.random() * 40 + 5) / 50 * 100)
      },
      apiCalls: {
        total: Math.floor(Math.random() * 500) + 100,
        limit: 1000,
        percentage: Math.floor((Math.random() * 500 + 100) / 1000 * 100)
      }
    },
    dailyUsage: generateDailyUsage(14), // Last 14 days
    topFeatures: [
      { feature: 'Product Analysis', usage: Math.floor(Math.random() * 50) + 20 },
      { feature: 'SEO Optimization', usage: Math.floor(Math.random() * 30) + 10 },
      { feature: 'Brand Alignment', usage: Math.floor(Math.random() * 20) + 5 },
      { feature: 'Performance Analytics', usage: Math.floor(Math.random() * 15) + 3 }
    ]
  };
}

function generateDailyUsage(days: number): any[] {
  const usage = [];
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    usage.push({
      date: date.toISOString().split('T')[0],
      analyses: Math.floor(Math.random() * 10) + 1,
      optimizations: Math.floor(Math.random() * 5) + 1,
      apiCalls: Math.floor(Math.random() * 50) + 10
    });
  }
  
  return usage;
}

function getTrialFeatures(): any {
  return {
    included: [
      {
        name: 'AI Content Analysis',
        description: 'Analyze product descriptions, titles, and content with AI',
        limit: '100 analyses per month'
      },
      {
        name: 'Product Optimization',
        description: 'Get AI-powered suggestions to optimize your products',
        limit: '50 optimizations per month'
      },
      {
        name: 'Performance Analytics',
        description: 'Track performance metrics and get insights',
        limit: 'Unlimited viewing'
      },
      {
        name: 'Brand Alignment Check',
        description: 'Ensure your content aligns with your brand voice',
        limit: 'Included with analyses'
      },
      {
        name: 'SEO Recommendations',
        description: 'Get SEO suggestions for better search visibility',
        limit: 'Included with optimizations'
      }
    ],
    premium: [
      {
        name: 'Advanced AI Models',
        description: 'Access to the latest and most powerful AI models',
        available: false
      },
      {
        name: 'Bulk Operations',
        description: 'Process multiple products simultaneously',
        available: false
      },
      {
        name: 'Custom Brand Training',
        description: 'Train AI models specifically for your brand',
        available: false
      },
      {
        name: 'Priority Support',
        description: '24/7 priority customer support',
        available: false
      },
      {
        name: 'Advanced Analytics',
        description: 'Detailed performance insights and reporting',
        available: false
      }
    ],
    limits: {
      analysesPerMonth: 100,
      optimizationsPerMonth: 50,
      apiCallsPerDay: 1000,
      storageLimit: '1GB',
      supportLevel: 'Standard'
    }
  };
}

export default router;
