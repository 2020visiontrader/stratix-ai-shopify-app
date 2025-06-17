import { NextFunction, Request, Response, Router } from 'express';
import { z } from 'zod';
import { DatabaseService } from '../../services/DatabaseService';
import { verifyShopifySession } from '../middleware/shopify-auth';
import { validateRequest } from '../middleware/validation';

const router = Router();
const db = new DatabaseService();

// Request validation schemas
const analyzeContentSchema = z.object({
  body: z.object({
    type: z.enum(['product', 'page', 'campaign', 'content']),
    data: z.object({
      title: z.string().optional(),
      description: z.string().optional(),
      content: z.string().optional(),
      url: z.string().url().optional(),
      images: z.array(z.string()).optional(),
      tags: z.array(z.string()).optional(),
      targetAudience: z.string().optional(),
      goals: z.array(z.string()).optional()
    }),
    options: z.object({
      includeOptimizations: z.boolean().default(true),
      includeBrandAlignment: z.boolean().default(true),
      includePerformancePrediction: z.boolean().default(false)
    }).optional()
  })
});

const historyQuerySchema = z.object({
  query: z.object({
    page: z.string().transform(Number).default('1'),
    limit: z.string().transform(Number).default('10'),
    type: z.enum(['product', 'page', 'campaign', 'content']).optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional()
  })
});

// Extended request interface
interface ExtendedRequest extends Request {
  shop?: any;
  shopDomain?: string;
}

// Analyze content endpoint
router.post(
  '/analyze',
  verifyShopifySession,
  validateRequest(analyzeContentSchema),
  async (req: ExtendedRequest, res: Response, next: NextFunction) => {
    try {
      const { type, data, options = {} } = req.body;
      const shop = req.shop;

      if (!shop) {
        res.status(404).json({ 
          success: false, 
          error: 'Shop not found' 
        });
        return;
      }

      // Perform content analysis
      const analysisResult = await performContentAnalysis(
        type,
        data,
        options
      );

      // Save analysis to database (simplified for now)
      const savedAnalysis = {
        id: generateId(),
        shopId: shop.id,
        type,
        inputData: data,
        result: analysisResult,
        createdAt: new Date()
      };

      res.json({
        success: true,
        data: {
          id: savedAnalysis.id,
          type,
          analysis: analysisResult,
          optimizations: analysisResult.optimizations || [],
          performancePrediction: analysisResult.performancePrediction || null,
          timestamp: savedAnalysis.createdAt
        }
      });
    } catch (error) {
      console.error('Analysis error:', error);
      next(error);
    }
  }
);

// Get analysis history
router.get(
  '/history',
  verifyShopifySession,
  validateRequest(historyQuerySchema),
  async (req: ExtendedRequest, res: Response, next: NextFunction) => {
    try {
      const { page = 1, limit = 10, type, startDate, endDate } = req.query as any;
      const shop = req.shop;

      if (!shop) {
        res.status(404).json({ 
          success: false, 
          error: 'Shop not found' 
        });
        return;
      }

      // For now, return mock data
      const analyses = generateMockAnalysisHistory(shop.id, type, startDate, endDate);
      const total = analyses.length;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedAnalyses = analyses.slice(startIndex, endIndex);
      
      const totalPages = Math.ceil(total / limit);

      res.json({
        success: true,
        data: paginatedAnalyses,
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
      console.error('History fetch error:', error);
      next(error);
    }
  }
);

// Get specific analysis
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

      // For now, return mock data
      const analysis = generateMockAnalysis(id, shop.id);
      
      if (!analysis) {
        res.status(404).json({ 
          success: false, 
          error: 'Analysis not found' 
        });
        return;
      }

      res.json({
        success: true,
        data: analysis
      });
    } catch (error) {
      console.error('Analysis fetch error:', error);
      next(error);
    }
  }
);

// Helper function to perform content analysis
async function performContentAnalysis(
  type: string,
  data: any,
  options: any
) {
  const analysis: any = {
    type,
    timestamp: new Date().toISOString(),
    insights: [],
    optimizations: [],
    scores: {}
  };

  // Basic content analysis
  if (data.title) {
    analysis.insights.push({
      category: 'title',
      score: calculateTitleScore(data.title),
      feedback: generateTitleFeedback(data.title)
    });
  }

  if (data.description) {
    analysis.insights.push({
      category: 'description',
      score: calculateDescriptionScore(data.description),
      feedback: generateDescriptionFeedback(data.description)
    });
  }

  if (data.content) {
    analysis.insights.push({
      category: 'content',
      score: calculateContentScore(data.content),
      feedback: generateContentFeedback(data.content)
    });
  }

  // Generate optimizations
  if (options.includeOptimizations) {
    analysis.optimizations = generateOptimizations(data, analysis.insights);
  }

  // Performance prediction
  if (options.includePerformancePrediction) {
    analysis.performancePrediction = {
      expectedViews: Math.floor(Math.random() * 10000) + 1000,
      expectedClicks: Math.floor(Math.random() * 1000) + 100,
      expectedConversions: Math.floor(Math.random() * 100) + 10,
      confidence: Math.random() * 0.3 + 0.7
    };
  }

  return analysis;
}

// Helper functions for analysis
function calculateTitleScore(title: string): number {
  let score = 0.5;
  if (title.length >= 30 && title.length <= 60) score += 0.2;
  if (/[A-Z]/.test(title)) score += 0.1;
  if (/\d/.test(title)) score += 0.1;
  if (title.includes('!') || title.includes('?')) score += 0.1;
  return Math.min(score, 1.0);
}

function generateTitleFeedback(title: string): string {
  const issues = [];
  if (title.length < 30) issues.push('Title is too short');
  if (title.length > 60) issues.push('Title is too long');
  if (!/[A-Z]/.test(title)) issues.push('Consider using capital letters');
  if (!/\d/.test(title)) issues.push('Consider including numbers');
  
  return issues.length > 0 
    ? `Improvements needed: ${issues.join(', ')}`
    : 'Title looks good!';
}

function calculateDescriptionScore(description: string): number {
  let score = 0.5;
  if (description.length >= 100 && description.length <= 300) score += 0.2;
  if (description.split(' ').length >= 20) score += 0.1;
  if (description.includes('!') || description.includes('?')) score += 0.1;
  if (/benefit|advantage|solution|quality/.test(description.toLowerCase())) score += 0.1;
  return Math.min(score, 1.0);
}

function generateDescriptionFeedback(description: string): string {
  const issues = [];
  if (description.length < 100) issues.push('Description is too short');
  if (description.length > 300) issues.push('Description is too long');
  if (!/benefit|advantage|solution|quality/.test(description.toLowerCase())) {
    issues.push('Consider highlighting benefits');
  }
  
  return issues.length > 0 
    ? `Improvements needed: ${issues.join(', ')}`
    : 'Description looks good!';
}

function calculateContentScore(content: string): number {
  let score = 0.5;
  if (content.length >= 200) score += 0.2;
  if (content.split('\n').length >= 3) score += 0.1;
  if (/\*\*|\*|#/.test(content)) score += 0.1;
  if (content.includes('http')) score += 0.1;
  return Math.min(score, 1.0);
}

function generateContentFeedback(content: string): string {
  const issues = [];
  if (content.length < 200) issues.push('Content is too short');
  if (content.split('\n').length < 3) issues.push('Consider adding more paragraphs');
  if (!/\*\*|\*|#/.test(content)) issues.push('Consider using formatting');
  
  return issues.length > 0 
    ? `Improvements needed: ${issues.join(', ')}`
    : 'Content looks good!';
}

function generateOptimizations(data: any, insights: any[]): any[] {
  const optimizations = [];
  
  // Title optimizations
  const titleInsight = insights.find(i => i.category === 'title');
  if (titleInsight && titleInsight.score < 0.8) {
    optimizations.push({
      type: 'title',
      current: data.title,
      suggested: improveTitleSuggestion(data.title),
      impact: 'medium',
      description: 'Optimize title for better engagement'
    });
  }
  
  // Description optimizations
  const descInsight = insights.find(i => i.category === 'description');
  if (descInsight && descInsight.score < 0.8) {
    optimizations.push({
      type: 'description',
      current: data.description,
      suggested: improveDescriptionSuggestion(data.description),
      impact: 'high',
      description: 'Enhance description to highlight benefits'
    });
  }
  
  return optimizations;
}

function improveTitleSuggestion(title: string): string {
  if (title.length < 30) {
    return title + ' - Premium Quality Solution';
  }
  if (title.length > 60) {
    return title.substring(0, 57) + '...';
  }
  return title;
}

function improveDescriptionSuggestion(description: string): string {
  if (description.length < 100) {
    return description + ' Experience the benefits of our premium solution designed for your success.';
  }
  return description;
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

function generateMockAnalysisHistory(shopId: string, type?: string, startDate?: string, endDate?: string): any[] {
  const analyses = [];
  const types = ['product', 'page', 'campaign', 'content'];
  
  for (let i = 0; i < 25; i++) {
    const analysisType = type || types[Math.floor(Math.random() * types.length)];
    const date = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);
    
    analyses.push({
      id: generateId(),
      shopId,
      type: analysisType,
      timestamp: date.toISOString(),
      score: Math.random() * 0.5 + 0.5,
      optimizations: Math.floor(Math.random() * 5) + 1,
      status: 'completed'
    });
  }
  
  return analyses.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

function generateMockAnalysis(id: string, shopId: string): any {
  return {
    id,
    shopId,
    type: 'product',
    timestamp: new Date().toISOString(),
    analysis: {
      insights: [
        {
          category: 'title',
          score: 0.8,
          feedback: 'Title looks good!'
        },
        {
          category: 'description',
          score: 0.7,
          feedback: 'Description could be improved'
        }
      ],
      optimizations: [
        {
          type: 'description',
          current: 'Short description',
          suggested: 'Enhanced description with benefits',
          impact: 'high',
          description: 'Improve description for better engagement'
        }
      ],
      scores: {
        overall: 0.75,
        engagement: 0.8,
        conversion: 0.7
      }
    },
    status: 'completed'
  };
}

export default router;
