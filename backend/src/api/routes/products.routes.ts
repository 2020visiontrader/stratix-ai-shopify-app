import { NextFunction, Request, Response, Router } from 'express';
import { z } from 'zod';
import { verifyShopifySession } from '../middleware/shopify-auth';
import { validateRequest } from '../middleware/validation';

const router = Router();
// const db = new DatabaseService(); // Will implement proper database integration later

// Request validation schemas
const getProductsSchema = z.object({
  query: z.object({
    page: z.string().transform(Number).default('1'),
    limit: z.string().transform(Number).default('10'),
    search: z.string().optional(),
    category: z.string().optional(),
    status: z.enum(['active', 'inactive', 'draft']).optional()
  })
});

const optimizeProductSchema = z.object({
  params: z.object({
    id: z.string()
  }),
  body: z.object({
    optimizations: z.object({
      title: z.string().optional(),
      description: z.string().optional(),
      tags: z.array(z.string()).optional(),
      images: z.array(z.string()).optional(),
      seoTitle: z.string().optional(),
      seoDescription: z.string().optional()
    })
  })
});

// Extended request interface
interface ExtendedRequest extends Request {
  shop?: any;
  shopDomain?: string;
}

// Get products
router.get(
  '/',
  verifyShopifySession,
  validateRequest(getProductsSchema),
  async (req: ExtendedRequest, res: Response, next: NextFunction) => {
    try {
      const { page = 1, limit = 10, search, category, status } = req.query as any;
      const shop = req.shop;

      if (!shop) {
        res.status(404).json({ 
          success: false, 
          error: 'Shop not found' 
        });
        return;
      }

      // Mock products data for now
      const products = generateMockProducts(shop.id, search, category, status);
      const total = products.length;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedProducts = products.slice(startIndex, endIndex);
      
      const totalPages = Math.ceil(total / limit);

      res.json({
        success: true,
        data: paginatedProducts,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrevious: page > 1
        }
      });
    } catch (error) {
      console.error('Products fetch error:', error);
      next(error);
    }
  }
);

// Get single product
router.get(
  '/:id',
  verifyShopifySession,
  async (req: ExtendedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const shop = req.shop;

      if (!shop) {
        res.status(404).json({ 
          success: false, 
          error: 'Shop not found' 
        });
        return;
      }

      const product = generateMockProduct(id, shop.id);
      
      if (!product) {
        res.status(404).json({ 
          success: false, 
          error: 'Product not found' 
        });
        return;
      }

      res.json({
        success: true,
        data: product
      });
    } catch (error) {
      console.error('Product fetch error:', error);
      next(error);
    }
  }
);

// Optimize product
router.post(
  '/:id/optimize',
  verifyShopifySession,
  validateRequest(optimizeProductSchema),
  async (req: ExtendedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { optimizations } = req.body;
      const shop = req.shop;

      if (!shop) {
        res.status(404).json({ 
          success: false, 
          error: 'Shop not found' 
        });
        return;
      }

      // Get the current product
      const product = generateMockProduct(id, shop.id);
      
      if (!product) {
        res.status(404).json({ 
          success: false, 
          error: 'Product not found' 
        });
        return;
      }

      // Apply optimizations
      const optimizedProduct = {
        ...product,
        title: optimizations.title || product.title,
        description: optimizations.description || product.description,
        tags: optimizations.tags || product.tags,
        images: optimizations.images || product.images,
        seo: {
          title: optimizations.seoTitle || product.seo?.title,
          description: optimizations.seoDescription || product.seo?.description
        },
        lastOptimized: new Date().toISOString(),
        optimizationScore: calculateOptimizationScore(optimizations)
      };

      // In a real implementation, you would save this to Shopify and your database
      console.log('Product optimized:', optimizedProduct);

      res.json({
        success: true,
        data: optimizedProduct,
        message: 'Product optimized successfully'
      });
    } catch (error) {
      console.error('Product optimization error:', error);
      next(error);
    }
  }
);

// Get product analytics
router.get(
  '/:id/analytics',
  verifyShopifySession,
  async (req: ExtendedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const shop = req.shop;

      if (!shop) {
        res.status(404).json({ 
          success: false, 
          error: 'Shop not found' 
        });
        return;
      }

      const analytics = generateMockProductAnalytics(id);

      res.json({
        success: true,
        data: analytics
      });
    } catch (error) {
      console.error('Product analytics error:', error);
      next(error);
    }
  }
);

// Bulk optimize products
router.post(
  '/bulk-optimize',
  verifyShopifySession,
  async (req: ExtendedRequest, res: Response, next: NextFunction) => {
    try {
      const { productIds, optimizationType } = req.body;
      const shop = req.shop;

      if (!shop) {
        res.status(404).json({ 
          success: false, 
          error: 'Shop not found' 
        });
        return;
      }

      if (!productIds || !Array.isArray(productIds)) {
        res.status(400).json({ 
          success: false, 
          error: 'Product IDs are required' 
        });
        return;
      }

      // Mock bulk optimization
      const results = {
        successful: productIds.length,
        failed: 0,
        optimizations: productIds.map(id => ({
          productId: id,
          status: 'completed',
          optimizations: generateOptimizationSuggestions(optimizationType)
        }))
      };

      res.json({
        success: true,
        data: results,
        message: `Successfully optimized ${results.successful} products`
      });
    } catch (error) {
      console.error('Bulk optimization error:', error);
      next(error);
    }
  }
);

// Helper functions
function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

function generateMockProducts(shopId: string, search?: string, category?: string, status?: string): any[] {
  const products = [];
  const categories = ['Electronics', 'Clothing', 'Home & Garden', 'Books', 'Sports'];
  const statuses = ['active', 'inactive', 'draft'];
  
  for (let i = 0; i < 50; i++) {
    const product = {
      id: generateId(),
      shopifyId: `gid://shopify/Product/${1000000 + i}`,
      title: `Sample Product ${i + 1}`,
      description: `This is a detailed description for sample product ${i + 1}. It includes all the features and benefits that customers need to know.`,
      price: Math.floor(Math.random() * 500) + 20,
      compareAtPrice: Math.floor(Math.random() * 200) + 50,
      images: [
        `https://cdn.shopify.com/s/files/1/0000/0000/${i + 1}/product-image-1.jpg`,
        `https://cdn.shopify.com/s/files/1/0000/0000/${i + 1}/product-image-2.jpg`
      ],
      tags: ['new', 'featured', categories[Math.floor(Math.random() * categories.length)].toLowerCase()],
      category: categories[Math.floor(Math.random() * categories.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
      optimizationScore: Math.random() * 0.4 + 0.6,
      performanceMetrics: {
        views: Math.floor(Math.random() * 1000),
        clicks: Math.floor(Math.random() * 100),
        conversions: Math.floor(Math.random() * 10),
        revenue: Math.floor(Math.random() * 5000)
      }
    };
    
    // Apply filters
    if (search && !product.title.toLowerCase().includes(search.toLowerCase())) {
      continue;
    }
    if (category && product.category !== category) {
      continue;
    }
    if (status && product.status !== status) {
      continue;
    }
    
    products.push(product);
  }
  
  return products;
}

function generateMockProduct(id: string, shopId: string): any {
  return {
    id,
    shopifyId: `gid://shopify/Product/${id}`,
    title: 'Premium Sample Product',
    description: 'This is a premium product with exceptional quality and features that will exceed your expectations.',
    price: 299.99,
    compareAtPrice: 399.99,
    images: [
      'https://cdn.shopify.com/s/files/1/0000/0000/1/product-image-1.jpg',
      'https://cdn.shopify.com/s/files/1/0000/0000/1/product-image-2.jpg',
      'https://cdn.shopify.com/s/files/1/0000/0000/1/product-image-3.jpg'
    ],
    tags: ['premium', 'featured', 'bestseller'],
    category: 'Electronics',
    status: 'active',
    vendor: 'Premium Brand',
    inventory: 25,
    variants: [
      {
        id: generateId(),
        title: 'Default Title',
        price: 299.99,
        inventory: 25,
        sku: 'PREMIUM-001'
      }
    ],
    seo: {
      title: 'Premium Sample Product - Best Quality',
      description: 'Get the best premium sample product with exceptional quality and unmatched features.'
    },
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    lastOptimized: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    optimizationScore: 0.85,
    performanceMetrics: {
      views: 1250,
      clicks: 125,
      conversions: 15,
      revenue: 4499.85,
      conversionRate: 0.12
    }
  };
}

function generateMockProductAnalytics(productId: string): any {
  const last30Days = [];
  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    last30Days.push({
      date: date.toISOString().split('T')[0],
      views: Math.floor(Math.random() * 100) + 10,
      clicks: Math.floor(Math.random() * 20) + 2,
      conversions: Math.floor(Math.random() * 5),
      revenue: Math.floor(Math.random() * 1000) + 100
    });
  }
  
  return {
    productId,
    period: 'last_30_days',
    summary: {
      totalViews: last30Days.reduce((sum, day) => sum + day.views, 0),
      totalClicks: last30Days.reduce((sum, day) => sum + day.clicks, 0),
      totalConversions: last30Days.reduce((sum, day) => sum + day.conversions, 0),
      totalRevenue: last30Days.reduce((sum, day) => sum + day.revenue, 0),
      averageConversionRate: 0.08,
      clickThroughRate: 0.15
    },
    dailyData: last30Days,
    topKeywords: ['premium', 'quality', 'best', 'featured', 'sale'],
    trafficSources: [
      { source: 'organic', percentage: 45 },
      { source: 'social', percentage: 25 },
      { source: 'direct', percentage: 20 },
      { source: 'referral', percentage: 10 }
    ]
  };
}

function calculateOptimizationScore(optimizations: any): number {
  let score = 0.6; // Base score
  
  if (optimizations.title) score += 0.1;
  if (optimizations.description) score += 0.15;
  if (optimizations.tags && optimizations.tags.length > 0) score += 0.05;
  if (optimizations.images && optimizations.images.length > 0) score += 0.05;
  if (optimizations.seoTitle) score += 0.05;
  if (optimizations.seoDescription) score += 0.05;
  
  return Math.min(score, 1.0);
}

function generateOptimizationSuggestions(type: string): any[] {
  const suggestions = [];
  
  switch (type) {
    case 'seo':
      suggestions.push(
        { type: 'title', suggestion: 'Optimize title for SEO', impact: 'high' },
        { type: 'description', suggestion: 'Add more keywords to description', impact: 'medium' },
        { type: 'tags', suggestion: 'Add relevant SEO tags', impact: 'medium' }
      );
      break;
    case 'conversion':
      suggestions.push(
        { type: 'price', suggestion: 'Consider price optimization', impact: 'high' },
        { type: 'images', suggestion: 'Add more product images', impact: 'medium' },
        { type: 'description', suggestion: 'Highlight key benefits', impact: 'high' }
      );
      break;
    case 'content':
      suggestions.push(
        { type: 'description', suggestion: 'Improve product description', impact: 'high' },
        { type: 'features', suggestion: 'Add feature list', impact: 'medium' },
        { type: 'specifications', suggestion: 'Add technical specifications', impact: 'low' }
      );
      break;
    default:
      suggestions.push(
        { type: 'general', suggestion: 'General optimization applied', impact: 'medium' }
      );
  }
  
  return suggestions;
}

export default router;
