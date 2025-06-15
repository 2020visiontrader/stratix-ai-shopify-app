import { openai } from '../../../lib/openai';
import { db } from '../../../lib/supabase';
import { Framework, FrameworkRouter } from '../framework/FrameworkRouter';

interface StoreRevision {
  id?: string;
  brand_id: string;
  content_type: 'product' | 'landing_page' | 'meta' | 'category';
  original_content: {
    id: string;
    content: string;
    metrics?: {
      ctr?: number;
      cvr?: number;
      revenue?: number;
    };
  };
  optimized_content: {
    content: string;
    rationale: string;
    predicted_improvement: {
      ctr?: number;
      cvr?: number;
      revenue?: number;
    };
    frameworks_applied: string[];
  };
  status: 'pending' | 'approved' | 'deployed' | 'rejected';
  created_at?: Date;
  updated_at?: Date;
}

interface OptimizationContext {
  brand_id: string;
  industry: string;
  target_audience: string[];
  brand_voice: string;
  key_value_props: string[];
  performance_data: {
    avg_ctr: number;
    avg_cvr: number;
    top_performing_phrases: string[];
  };
}

export class StoreOptimizer {
  private static instance: StoreOptimizer;
  private frameworkRouter: FrameworkRouter;

  private constructor() {
    this.frameworkRouter = FrameworkRouter.getInstance();
  }

  public static getInstance(): StoreOptimizer {
    if (!StoreOptimizer.instance) {
      StoreOptimizer.instance = new StoreOptimizer();
    }
    return StoreOptimizer.instance;
  }

  public async optimizeProduct(
    brandId: string,
    product: {
      id: string;
      title: string;
      description: string;
      metrics?: {
        ctr?: number;
        cvr?: number;
        revenue?: number;
      };
    }
  ): Promise<StoreRevision> {
    try {
      const context = await this.getOptimizationContext(brandId);
      const frameworks = await this.getRelevantFrameworks(context);
      
      const completion = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `Optimize the product content using these frameworks:
            ${JSON.stringify(frameworks)}
            
            Context:
            ${JSON.stringify(context)}
            
            Focus on:
            1. Compelling value proposition
            2. Emotional triggers
            3. Clear benefits
            4. SEO optimization
            5. Brand voice consistency
            
            Return JSON with optimized content and rationale.`
          },
          {
            role: 'user',
            content: JSON.stringify({
              title: product.title,
              description: product.description
            })
          }
        ],
        temperature: 0.3
      });

      const optimization = JSON.parse(completion.choices[0].message.content || '{}');
      
      const revision: StoreRevision = {
        brand_id: brandId,
        content_type: 'product',
        original_content: {
          id: product.id,
          content: JSON.stringify({
            title: product.title,
            description: product.description
          }),
          metrics: product.metrics
        },
        optimized_content: {
          content: JSON.stringify(optimization.content),
          rationale: optimization.rationale,
          predicted_improvement: optimization.predicted_improvement,
          frameworks_applied: frameworks.map(f => f.name)
        },
        status: 'pending'
      };

      await this.saveRevision(revision);
      await this.handleAutopilot(revision);

      return revision;
    } catch (error) {
      console.error('Error optimizing product:', error);
      throw error;
    }
  }

  public async optimizeLandingPage(
    brandId: string,
    page: {
      id: string;
      title: string;
      content: string;
      metrics?: {
        ctr?: number;
        cvr?: number;
        revenue?: number;
      };
    }
  ): Promise<StoreRevision> {
    try {
      const context = await this.getOptimizationContext(brandId);
      const frameworks = await this.getRelevantFrameworks(context);
      
      const completion = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `Optimize the landing page using these frameworks:
            ${JSON.stringify(frameworks)}
            
            Context:
            ${JSON.stringify(context)}
            
            Focus on:
            1. Hero section impact
            2. Clear value proposition
            3. Social proof placement
            4. CTA optimization
            5. Visual hierarchy
            
            Return JSON with optimized content and rationale.`
          },
          {
            role: 'user',
            content: JSON.stringify({
              title: page.title,
              content: page.content
            })
          }
        ],
        temperature: 0.3
      });

      const optimization = JSON.parse(completion.choices[0].message.content || '{}');
      
      const revision: StoreRevision = {
        brand_id: brandId,
        content_type: 'landing_page',
        original_content: {
          id: page.id,
          content: JSON.stringify({
            title: page.title,
            content: page.content
          }),
          metrics: page.metrics
        },
        optimized_content: {
          content: JSON.stringify(optimization.content),
          rationale: optimization.rationale,
          predicted_improvement: optimization.predicted_improvement,
          frameworks_applied: frameworks.map(f => f.name)
        },
        status: 'pending'
      };

      await this.saveRevision(revision);
      await this.handleAutopilot(revision);

      return revision;
    } catch (error) {
      console.error('Error optimizing landing page:', error);
      throw error;
    }
  }

  private async getOptimizationContext(brandId: string): Promise<OptimizationContext> {
    try {
      const { data: brand } = await db.brands.getById(brandId);
      if (!brand) throw new Error('Brand not found');

      const { data: analyses } = await db.brand_analyses.getByBrandId(brandId);
      const performanceData = analyses?.find(a => a.analysis_type === 'performance_metrics')?.results;

      return {
        brand_id: brandId,
        industry: brand.industry,
        target_audience: brand.target_audience,
        brand_voice: brand.brand_voice,
        key_value_props: brand.value_propositions,
        performance_data: performanceData || {
          avg_ctr: 0,
          avg_cvr: 0,
          top_performing_phrases: []
        }
      };
    } catch (error) {
      console.error('Error getting optimization context:', error);
      throw error;
    }
  }

  private async getRelevantFrameworks(context: OptimizationContext): Promise<Framework[]> {
    try {
      const industryFrameworks = await this.frameworkRouter.getFrameworksByIndustry(context.industry);
      const optimizationFrameworks = await this.frameworkRouter.getFrameworksByCategory('optimization');
      
      return [...industryFrameworks, ...optimizationFrameworks];
    } catch (error) {
      console.error('Error getting relevant frameworks:', error);
      throw error;
    }
  }

  private async saveRevision(revision: StoreRevision): Promise<void> {
    try {
      await db.store_revisions.create(revision);
    } catch (error) {
      console.error('Error saving revision:', error);
      throw error;
    }
  }

  private async handleAutopilot(revision: StoreRevision): Promise<void> {
    try {
      const { data: config } = await db.brand_configs.getByBrandId(revision.brand_id);
      
      if (config?.autopilot) {
        // Auto-approve and deploy if predicted improvement is significant
        const significantImprovement = this.isSignificantImprovement(
          revision.original_content.metrics,
          revision.optimized_content.predicted_improvement
        );

        if (significantImprovement) {
          await db.store_revisions.update(revision.id!, {
            status: 'approved'
          });

          // Trigger deployment
          await this.deployRevision(revision);
        }
      }
    } catch (error) {
      console.error('Error handling autopilot:', error);
      throw error;
    }
  }

  private isSignificantImprovement(
    current?: { ctr?: number; cvr?: number; revenue?: number },
    predicted?: { ctr?: number; cvr?: number; revenue?: number }
  ): boolean {
    if (!current || !predicted) return false;

    const IMPROVEMENT_THRESHOLDS = {
      ctr: 0.1, // 10% improvement
      cvr: 0.15, // 15% improvement
      revenue: 0.2 // 20% improvement
    };

    const improvements = [
      predicted.ctr && current.ctr && (predicted.ctr - current.ctr) / current.ctr > IMPROVEMENT_THRESHOLDS.ctr,
      predicted.cvr && current.cvr && (predicted.cvr - current.cvr) / current.cvr > IMPROVEMENT_THRESHOLDS.cvr,
      predicted.revenue && current.revenue && (predicted.revenue - current.revenue) / current.revenue > IMPROVEMENT_THRESHOLDS.revenue
    ].filter(Boolean);

    return improvements.length > 0;
  }

  private async deployRevision(revision: StoreRevision): Promise<void> {
    try {
      // Update status to deploying
      await db.store_revisions.update(revision.id!, {
        status: 'deployed'
      });

      // Emit event for Shopify handler to pick up
      await db.events.create({
        type: 'STORE_REVISION_DEPLOYED',
        brand_id: revision.brand_id,
        payload: revision
      });
    } catch (error) {
      console.error('Error deploying revision:', error);
      throw error;
    }
  }
} 