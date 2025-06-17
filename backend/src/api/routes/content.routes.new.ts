import { NextFunction, Request, Response, Router } from 'express';
import { z } from 'zod';
import { verifyShopifySession } from '../middleware/shopify-auth';
import { validateRequest } from '../middleware/validation';

const router = Router();

// Request validation schemas
const generateContentSchema = z.object({
  body: z.object({
    type: z.enum(['product_title', 'product_description', 'blog_post', 'email_subject', 'ad_copy', 'social_post']),
    context: z.object({
      productTitle: z.string().optional(),
      brandVoice: z.string().optional(),
      targetAudience: z.string().optional(),
      keywords: z.array(z.string()).optional(),
      tone: z.enum(['professional', 'casual', 'friendly', 'urgent', 'creative']).optional(),
      length: z.enum(['short', 'medium', 'long']).optional()
    }),
    prompt: z.string().optional(),
    variations: z.number().min(1).max(10).default(3)
  })
});

// Extended request interface
interface ExtendedRequest extends Request {
  shop?: any;
  shopDomain?: string;
}

// Generate content
router.post(
  '/generate',
  verifyShopifySession,
  validateRequest(generateContentSchema),
  async (req: ExtendedRequest, res: Response, next: NextFunction) => {
    try {
      const { type, context, prompt, variations } = req.body;
      const shop = req.shop;

      if (!shop) {
        res.status(404).json({ 
          success: false, 
          error: 'Shop not found' 
        });
        return;
      }

      const generatedContent = await generateContent(type, context, prompt, variations);

      res.json({
        success: true,
        data: {
          type,
          context,
          variations: generatedContent,
          generatedAt: new Date().toISOString(),
          usage: {
            tokensUsed: Math.floor(Math.random() * 500) + 100,
            cost: ((Math.random() * 0.05) + 0.01).toFixed(4)
          }
        }
      });
    } catch (error) {
      console.error('Content generation error:', error);
      next(error);
    }
  }
);

// Helper function to generate content by type
function generateContentByType(type: string, context: any, variation: number): string {
  const templates: Record<string, string[]> = {
    product_title: [
      `${context.productTitle || 'Premium Product'} - Quality ${variation}`,
      `Experience ${context.productTitle || 'Amazing Product'} Like Never Before`,
      `${context.productTitle || 'Top-Rated Product'} - Customer Favorite`
    ],
    product_description: [
      `Discover the exceptional quality of our ${context.productTitle || 'product'}. Designed with ${context.targetAudience || 'customers'} in mind.`,
      `Transform your experience with our premium ${context.productTitle || 'product'}. Perfect for ${context.targetAudience || 'anyone'} seeking quality.`,
      `Upgrade to our ${context.productTitle || 'amazing product'} and discover why customers love the superior quality.`
    ]
  };
  
  const typeTemplates = templates[type] || templates.product_description;
  return typeTemplates[variation - 1] || typeTemplates[0];
}

async function generateContent(type: string, context: any, prompt?: string, variations: number = 3): Promise<any[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const content = [];
      
      for (let i = 0; i < variations; i++) {
        content.push({
          id: Math.random().toString(36).substring(2, 15),
          content: generateContentByType(type, context, i + 1),
          score: Math.random() * 0.3 + 0.7,
          wordCount: Math.floor(Math.random() * 100) + 20
        });
      }
      
      resolve(content.sort((a, b) => b.score - a.score));
    }, 1000);
  });
}

export default router;
