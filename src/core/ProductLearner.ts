import { db } from '../lib/supabase';
import { AIEvolutionLogger } from './AIEvolutionLogger';
import { PromptComposer } from './PromptComposer';

interface ProductMetrics {
  add_to_cart_rate: number;
  bounce_rate: number;
  avg_time_on_page: number;
  conversion_rate: number;
  engagement_score: number;
}

interface ProductInsight {
  product_id: string;
  metrics: ProductMetrics;
  content_analysis: {
    messaging_effectiveness: number;
    headline_impact: number;
    visual_engagement: number;
  };
  recommendations: Array<{
    type: 'messaging' | 'headline' | 'visuals';
    current_score: number;
    suggestion: string;
    expected_impact: number;
  }>;
  timestamp: Date;
}

const PERFORMANCE_THRESHOLDS = {
  add_to_cart_rate: 0.15, // 15%
  bounce_rate: 0.35, // 35%
  avg_time_on_page: 120, // 2 minutes
  conversion_rate: 0.03, // 3%
  engagement_score: 7 // out of 10
};

export class ProductLearner {
  private static instance: ProductLearner;
  private evolutionLogger: AIEvolutionLogger;
  private promptComposer: PromptComposer;
  
  private constructor() {
    this.evolutionLogger = AIEvolutionLogger.getInstance();
    this.promptComposer = PromptComposer.getInstance();
  }

  public static getInstance(): ProductLearner {
    if (!ProductLearner.instance) {
      ProductLearner.instance = new ProductLearner();
    }
    return ProductLearner.instance;
  }

  public async processProductMetrics(brandId: string, productId: string, metrics: ProductMetrics): Promise<void> {
    try {
      // Calculate engagement score
      const engagementScore = this.calculateEngagementScore(metrics);
      const enrichedMetrics = { ...metrics, engagement_score: engagementScore };

      // Generate insights
      const insights = await this.analyzeProductPerformance(brandId, productId, enrichedMetrics);

      // Store insights
      await db.product_insights.create({
        brand_id: brandId,
        product_id: productId,
        metrics: enrichedMetrics,
        analysis: insights.content_analysis,
        recommendations: insights.recommendations,
        timestamp: new Date()
      });

      // Check if rewrite is needed
      if (this.shouldTriggerRewrite(enrichedMetrics)) {
        await this.triggerContentRewrite(brandId, productId, insights);
      }

      // Log evolution
      await this.evolutionLogger.logEvolution(brandId, {
        type: 'PROMPT_PERFORMANCE',
        trigger: {
          source: 'product_learner',
          action: 'metrics_analysis',
          metadata: { product_id: productId }
        },
        changes: {
          before: { metrics: metrics },
          after: { metrics: enrichedMetrics, insights },
          impact_areas: ['product_content', 'conversion_optimization']
        },
        metrics: {
          performance_delta: engagementScore - 7, // Compare against baseline
          confidence_score: this.calculateConfidenceScore(metrics),
          sample_size: this.calculateSampleSize(metrics)
        }
      });

    } catch (error) {
      console.error('Error processing product metrics:', error);
      throw error;
    }
  }

  private calculateEngagementScore(metrics: ProductMetrics): number {
    const weights = {
      add_to_cart_rate: 0.3,
      bounce_rate: 0.2,
      avg_time_on_page: 0.2,
      conversion_rate: 0.3
    };

    const scores = {
      add_to_cart_rate: (metrics.add_to_cart_rate / PERFORMANCE_THRESHOLDS.add_to_cart_rate) * 10,
      bounce_rate: ((1 - metrics.bounce_rate) / (1 - PERFORMANCE_THRESHOLDS.bounce_rate)) * 10,
      avg_time_on_page: (metrics.avg_time_on_page / PERFORMANCE_THRESHOLDS.avg_time_on_page) * 10,
      conversion_rate: (metrics.conversion_rate / PERFORMANCE_THRESHOLDS.conversion_rate) * 10
    };

    return Object.entries(weights).reduce((score, [metric, weight]) => {
      return score + (scores[metric as keyof typeof scores] * weight);
    }, 0);
  }

  private async analyzeProductPerformance(
    brandId: string,
    productId: string,
    metrics: ProductMetrics
  ): Promise<Omit<ProductInsight, 'product_id' | 'metrics' | 'timestamp'>> {
    // Get product content
    const { data: product } = await db.shopify_products.getById(productId);
    if (!product) throw new Error('Product not found');

    // Analyze content effectiveness
    const analysis = {
      messaging_effectiveness: this.analyzeMessaging(product, metrics),
      headline_impact: this.analyzeHeadline(product, metrics),
      visual_engagement: this.analyzeVisuals(product, metrics)
    };

    // Generate recommendations
    const recommendations = await this.generateRecommendations(brandId, product, analysis);

    return {
      content_analysis: analysis,
      recommendations
    };
  }

  private analyzeMessaging(product: any, metrics: ProductMetrics): number {
    const factors = {
      description_length: product.description?.length || 0,
      bullet_points: (product.description?.match(/•/g) || []).length,
      benefit_statements: (product.description?.match(/benefit|advantage|value/gi) || []).length
    };

    // Score based on content factors and metrics
    const score = (
      (factors.description_length > 300 ? 1 : 0.5) +
      (factors.bullet_points > 3 ? 1 : 0.5) +
      (factors.benefit_statements > 2 ? 1 : 0.5) +
      (metrics.conversion_rate > PERFORMANCE_THRESHOLDS.conversion_rate ? 1 : 0)
    ) / 4 * 10;

    return Math.min(score, 10);
  }

  private analyzeHeadline(product: any, metrics: ProductMetrics): number {
    const factors = {
      length: product.title?.length || 0,
      keywords: (product.title?.match(/\b\w{4,}\b/g) || []).length,
      click_worthy: metrics.bounce_rate < PERFORMANCE_THRESHOLDS.bounce_rate
    };

    // Score based on headline factors
    const score = (
      (factors.length >= 30 && factors.length <= 60 ? 1 : 0.5) +
      (factors.keywords >= 2 ? 1 : 0.5) +
      (factors.click_worthy ? 1 : 0)
    ) / 3 * 10;

    return Math.min(score, 10);
  }

  private analyzeVisuals(product: any, metrics: ProductMetrics): number {
    const factors = {
      image_count: product.images?.length || 0,
      high_quality: product.images?.every((img: any) => img.width >= 800) || false,
      engagement: metrics.avg_time_on_page > PERFORMANCE_THRESHOLDS.avg_time_on_page
    };

    // Score based on visual factors
    const score = (
      (factors.image_count >= 3 ? 1 : 0.5) +
      (factors.high_quality ? 1 : 0.5) +
      (factors.engagement ? 1 : 0)
    ) / 3 * 10;

    return Math.min(score, 10);
  }

  private async generateRecommendations(
    brandId: string,
    product: any,
    analysis: ProductInsight['content_analysis']
  ): Promise<ProductInsight['recommendations']> {
    const recommendations: ProductInsight['recommendations'] = [];

    // Messaging recommendations
    if (analysis.messaging_effectiveness < 7) {
      const messagingPrompt = await this.promptComposer.composePrompt(
        brandId,
        'Suggest improvements for product description',
        { contentType: 'product' }
      );

      recommendations.push({
        type: 'messaging',
        current_score: analysis.messaging_effectiveness,
        suggestion: 'Enhance product description with more benefit statements and structured content',
        expected_impact: 2.5
      });
    }

    // Headline recommendations
    if (analysis.headline_impact < 7) {
      recommendations.push({
        type: 'headline',
        current_score: analysis.headline_impact,
        suggestion: 'Optimize title length and include key selling points',
        expected_impact: 1.8
      });
    }

    // Visual recommendations
    if (analysis.visual_engagement < 7) {
      recommendations.push({
        type: 'visuals',
        current_score: analysis.visual_engagement,
        suggestion: 'Add more high-quality images showing product details and usage',
        expected_impact: 2.0
      });
    }

    return recommendations;
  }

  private shouldTriggerRewrite(metrics: ProductMetrics): boolean {
    return (
      metrics.engagement_score < PERFORMANCE_THRESHOLDS.engagement_score ||
      metrics.conversion_rate < PERFORMANCE_THRESHOLDS.conversion_rate / 2 ||
      metrics.bounce_rate > PERFORMANCE_THRESHOLDS.bounce_rate * 1.5
    );
  }

  private async triggerContentRewrite(
    brandId: string,
    productId: string,
    insights: Omit<ProductInsight, 'product_id' | 'metrics' | 'timestamp'>
  ): Promise<void> {
    // Create rewrite task
    await db.rewrite_tasks.create({
      brand_id: brandId,
      product_id: productId,
      trigger: 'auto_performance',
      insights,
      status: 'pending',
      created_at: new Date()
    });

    // Log event
    await db.events.create({
      type: 'REWRITE_TRIGGERED',
      brand_id: brandId,
      payload: {
        product_id: productId,
        trigger: 'performance_threshold',
        insights,
        timestamp: new Date()
      }
    });
  }

  private calculateConfidenceScore(metrics: ProductMetrics): number {
    const sampleSize = this.calculateSampleSize(metrics);
    const minSample = 100; // Minimum sample size for high confidence
    const maxSample = 1000; // Sample size for maximum confidence

    return Math.min((sampleSize - minSample) / (maxSample - minSample), 1);
  }

  private calculateSampleSize(metrics: ProductMetrics): number {
    // Estimate sample size from conversion metrics
    return Math.round(metrics.conversion_rate * 100); // Assuming conversion_rate is a percentage
  }
} 