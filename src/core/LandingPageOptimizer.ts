import OpenAI from 'openai';
import { ShopifyAnalytics } from '../integrations/shopify/Analytics';
import { ShopifyContentManager } from '../integrations/shopify/ContentManager';
import { db } from '../lib/supabase';
import { StorageService } from '../services/StorageService';
import { EvolutionLogger } from './EvolutionLogger';

/**
 * Custom error class for Landing Page Optimizer related errors
 */
export class LandingPageOptimizerError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = 'LandingPageOptimizerError';
  }
}

export interface PageMetrics {
  bounceRate: number;
  avgScrollDepth: number;
  ctaClickRate: number;
  avgSessionTime: number;
  sampleSize: number;
}

export interface SectionPerformance {
  section: 'headline' | 'value_prop' | 'hero_image' | 'cta';
  metrics: {
    viewRate: number;
    engagementRate: number;
    conversionImpact: number;
  };
}

export interface OptimizationSuggestion {
  section: SectionPerformance['section'];
  currentContent: string;
  suggestedContent: string;
  expectedImprovement: number;
  confidence: number;
  reasoning: string;
}

/**
 * LandingPageOptimizer is responsible for monitoring and optimizing landing page performance.
 * It tracks metrics, analyzes performance, and generates/applies optimizations automatically
 * or through manual approval based on the brand's tier.
 */
export class LandingPageOptimizer {
  private static instance: LandingPageOptimizer;
  private evolutionLogger: EvolutionLogger;
  private openai: OpenAI;
  private analytics: ShopifyAnalytics;
  private contentManager: ShopifyContentManager;
  private storage: StorageService;
  
  private constructor() {
    this.evolutionLogger = EvolutionLogger.getInstance();
    this.openai = new OpenAI();
    this.analytics = ShopifyAnalytics.getInstance();
    this.contentManager = ShopifyContentManager.getInstance();
    this.storage = StorageService.getInstance();
  }

  /**
   * Gets the singleton instance of LandingPageOptimizer
   */
  public static getInstance(): LandingPageOptimizer {
    if (!LandingPageOptimizer.instance) {
      LandingPageOptimizer.instance = new LandingPageOptimizer();
    }
    return LandingPageOptimizer.instance;
  }

  /**
   * Tracks and analyzes page performance metrics
   * @param brandId - The ID of the brand
   * @param pageId - The ID of the landing page
   * @throws {LandingPageOptimizerError} If analytics service fails or storage fails
   */
  public async trackPagePerformance(
    brandId: string,
    pageId: string
  ): Promise<void> {
    try {
      if (!brandId || !pageId) {
        throw new LandingPageOptimizerError(
          'Brand ID and Page ID are required',
          'INVALID_PARAMETERS'
        );
      }

      // Get metrics from Shopify analytics
      let metrics: PageMetrics;
      try {
        metrics = await this.analytics.getPageMetrics(pageId);
      } catch (error: any) {
        throw new LandingPageOptimizerError(
          `Failed to fetch analytics: ${error.message}`,
          'ANALYTICS_ERROR'
        );
      }

      // Validate metrics
      if (metrics.sampleSize < 100) {
        throw new LandingPageOptimizerError(
          'Insufficient data for analysis',
          'INSUFFICIENT_DATA'
        );
      }

      const performanceLog = {
        timestamp: new Date(),
        metrics,
        insights: await this.analyzeMetrics(metrics)
      };

      // Store performance history
      try {
        await this.storage.storePerformanceLog(brandId, pageId, performanceLog);
      } catch (error: any) {
        throw new LandingPageOptimizerError(
          `Failed to store performance log: ${error.message}`,
          'STORAGE_ERROR'
        );
      }

      // Check for significant performance drops
      const needsOptimization = await this.checkPerformanceThresholds(metrics);
      if (needsOptimization) {
        await this.triggerOptimization(brandId, pageId).catch(error => {
          console.error('Failed to trigger optimization:', error);
          // Don't throw here to avoid failing the entire tracking process
        });
      }

    } catch (error: any) {
      if (error instanceof LandingPageOptimizerError) {
        throw error;
      }
      throw new LandingPageOptimizerError(
        `Unexpected error in trackPagePerformance: ${error.message}`,
        'UNKNOWN_ERROR'
      );
    }
  }

  /**
   * Analyzes metrics to generate insights
   * @param metrics - The page performance metrics
   * @returns Array of insight strings
   */
  private async analyzeMetrics(metrics: PageMetrics): Promise<string[]> {
    const insights: string[] = [];
    
    // Analyze bounce rate
    if (metrics.bounceRate > 0.7) {
      insights.push('High bounce rate indicates potential content mismatch or slow load times');
    }
    
    // Analyze scroll depth
    if (metrics.avgScrollDepth < 0.4) {
      insights.push('Low scroll depth suggests above-the-fold content needs improvement');
    }
    
    // Analyze CTA performance
    if (metrics.ctaClickRate < 0.02) {
      insights.push('CTA click rate below benchmark - consider testing new copy or placement');
    }
    
    // Analyze session time
    if (metrics.avgSessionTime < 30) {
      insights.push('Short session duration indicates engagement issues');
    }

    return insights;
  }

  /**
   * Checks if performance metrics are below acceptable thresholds
   * @param metrics - The page performance metrics
   * @returns boolean indicating if optimization is needed
   */
  private async checkPerformanceThresholds(metrics: PageMetrics): Promise<boolean> {
    // Define thresholds
    const CRITICAL_BOUNCE_RATE = 0.8;
    const MIN_SCROLL_DEPTH = 0.3;
    const MIN_CTA_RATE = 0.01;
    const MIN_SESSION_TIME = 20;
    
    return (
      metrics.bounceRate > CRITICAL_BOUNCE_RATE ||
      metrics.avgScrollDepth < MIN_SCROLL_DEPTH ||
      metrics.ctaClickRate < MIN_CTA_RATE ||
      metrics.avgSessionTime < MIN_SESSION_TIME
    );
  }

  /**
   * Analyzes performance of individual page sections
   * @param brandId - The ID of the brand
   * @param pageId - The ID of the landing page
   * @returns Array of section performance data
   * @throws {LandingPageOptimizerError} If analytics service fails
   */
  public async analyzeSectionPerformance(
    brandId: string,
    pageId: string
  ): Promise<SectionPerformance[]> {
    try {
      if (!brandId || !pageId) {
        throw new LandingPageOptimizerError(
          'Brand ID and Page ID are required',
          'INVALID_PARAMETERS'
        );
      }

      // Get section metrics from analytics
      const sections: SectionPerformance[] = await Promise.all([
        'headline',
        'value_prop',
        'hero_image',
        'cta'
      ].map(async section => {
        try {
          const metrics = await this.analytics.getSectionMetrics(pageId, section);
          return {
            section: section as SectionPerformance['section'],
            metrics
          };
        } catch (error: any) {
          throw new LandingPageOptimizerError(
            `Failed to fetch metrics for section ${section}: ${error.message}`,
            'ANALYTICS_ERROR'
          );
        }
      }));

      return sections.sort((a, b) => 
        (b.metrics.conversionImpact - a.metrics.conversionImpact)
      );

    } catch (error: any) {
      if (error instanceof LandingPageOptimizerError) {
        throw error;
      }
      throw new LandingPageOptimizerError(
        `Unexpected error in analyzeSectionPerformance: ${error.message}`,
        'UNKNOWN_ERROR'
      );
    }
  }

  /**
   * Generates optimization suggestions for underperforming sections
   * @param brandId - The ID of the brand
   * @param pageId - The ID of the landing page
   * @param underperformingSections - Array of sections needing optimization
   * @returns Array of optimization suggestions
   * @throws {LandingPageOptimizerError} If content service fails or AI generation fails
   */
  public async generateOptimizations(
    brandId: string,
    pageId: string,
    underperformingSections: SectionPerformance[]
  ): Promise<OptimizationSuggestion[]> {
    try {
      if (!brandId || !pageId) {
        throw new LandingPageOptimizerError(
          'Brand ID and Page ID are required',
          'INVALID_PARAMETERS'
        );
      }

      const suggestions: OptimizationSuggestion[] = [];

      for (const section of underperformingSections) {
        try {
          const currentContent = await this.contentManager.getPageContent(
            pageId,
            section.section
          );
          
          // Generate optimization using GPT-4
          const suggestion = await this.generateSuggestion(
            brandId,
            section.section,
            currentContent,
            section.metrics
          );

          suggestions.push(suggestion);
        } catch (error: any) {
          console.error(`Failed to generate optimization for section ${section.section}:`, error);
          // Continue with other sections instead of failing completely
          continue;
        }
      }

      if (suggestions.length === 0) {
        throw new LandingPageOptimizerError(
          'Failed to generate any optimization suggestions',
          'GENERATION_ERROR'
        );
      }

      return suggestions;

    } catch (error: any) {
      if (error instanceof LandingPageOptimizerError) {
        throw error;
      }
      throw new LandingPageOptimizerError(
        `Unexpected error in generateOptimizations: ${error.message}`,
        'UNKNOWN_ERROR'
      );
    }
  }

  /**
   * Generates a single optimization suggestion using AI
   * @param brandId - The ID of the brand
   * @param section - The section type
   * @param currentContent - Current content of the section
   * @param metrics - Performance metrics for the section
   * @returns Optimization suggestion
   * @throws {LandingPageOptimizerError} If brand not found or AI generation fails
   */
  private async generateSuggestion(
    brandId: string,
    section: SectionPerformance['section'],
    currentContent: string,
    metrics: SectionPerformance['metrics']
  ): Promise<OptimizationSuggestion> {
    try {
      // Get brand DNA for context
      const { data: brand } = await db.brands.getById(brandId);
      if (!brand) {
        throw new LandingPageOptimizerError(
          'Brand not found',
          'BRAND_NOT_FOUND'
        );
      }

      // Generate optimization using GPT-4
      try {
        const completion = await this.openai.chat.completions.create({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: `You are an expert in landing page optimization. Generate an improved version of the ${section} 
                       that aligns with the brand voice and improves conversion. Current metrics:
                       - View rate: ${metrics.viewRate}
                       - Engagement rate: ${metrics.engagementRate}
                       - Conversion impact: ${metrics.conversionImpact}`
            },
            {
              role: 'user',
              content: `Current ${section}: ${currentContent}
                       Brand voice: ${JSON.stringify(brand.brand_voice)}
                       Target audience: ${JSON.stringify(brand.target_audience)}`
            }
          ]
        });

        const suggestion = completion.choices[0].message.content;
        if (!suggestion) {
          throw new LandingPageOptimizerError(
            'AI failed to generate suggestion',
            'AI_GENERATION_ERROR'
          );
        }

        return {
          section,
          currentContent,
          suggestedContent: suggestion,
          expectedImprovement: 0.15, // Conservative estimate
          confidence: 0.8,
          reasoning: 'Based on brand voice alignment and conversion patterns'
        };

      } catch (error: any) {
        throw new LandingPageOptimizerError(
          `AI generation failed: ${error.message}`,
          'AI_GENERATION_ERROR'
        );
      }

    } catch (error: any) {
      if (error instanceof LandingPageOptimizerError) {
        throw error;
      }
      throw new LandingPageOptimizerError(
        `Unexpected error in generateSuggestion: ${error.message}`,
        'UNKNOWN_ERROR'
      );
    }
  }

  /**
   * Applies optimization suggestions to the landing page
   * @param brandId - The ID of the brand
   * @param pageId - The ID of the landing page
   * @param suggestions - Array of optimization suggestions
   * @param autoApprove - Whether to auto-apply changes
   * @throws {LandingPageOptimizerError} If content update fails
   */
  public async applyOptimizations(
    brandId: string,
    pageId: string,
    suggestions: OptimizationSuggestion[],
    autoApprove: boolean = false
  ): Promise<void> {
    try {
      if (!brandId || !pageId) {
        throw new LandingPageOptimizerError(
          'Brand ID and Page ID are required',
          'INVALID_PARAMETERS'
        );
      }

      const { data: brand } = await db.brands.getById(brandId);
      if (!brand) {
        throw new LandingPageOptimizerError(
          'Brand not found',
          'BRAND_NOT_FOUND'
        );
      }

      for (const suggestion of suggestions) {
        if (autoApprove || brand.tier === 'enterprise') {
          // Create backup before updating
          let backupId: string;
          try {
            const sections = await Promise.all([
              'headline',
              'value_prop',
              'hero_image',
              'cta'
            ].map(async type => {
              const content = await this.contentManager.getPageContent(pageId, type);
              return {
                id: `${pageId}_${type}`,
                type: type as SectionPerformance['section'],
                content
              };
            }));

            backupId = await this.contentManager.createBackup(pageId, sections);
          } catch (error: any) {
            throw new LandingPageOptimizerError(
              `Failed to create backup: ${error.message}`,
              'BACKUP_ERROR'
            );
          }

          try {
            // Apply change directly
            await this.contentManager.updatePageContent(
              pageId,
              suggestion.section,
              suggestion.suggestedContent
            );
            
            // Log the evolution
            await this.evolutionLogger.logEvolution(brandId, {
              type: 'CONTENT_CHANGE',
              trigger: {
                source: 'landing_page_optimizer',
                action: 'auto_update',
                metadata: {
                  pageId,
                  section: suggestion.section,
                  backupId
                }
              },
              changes: {
                before: { content: suggestion.currentContent },
                after: { content: suggestion.suggestedContent },
                impact_areas: ['landing_page', suggestion.section]
              },
              metrics: {
                performance_delta: suggestion.expectedImprovement,
                confidence_score: suggestion.confidence
              }
            });

          } catch (error: any) {
            // Restore from backup if update fails
            try {
              await this.contentManager.restoreFromBackup(pageId, backupId);
            } catch (restoreError: any) {
              throw new LandingPageOptimizerError(
                `Failed to restore from backup: ${restoreError.message}`,
                'RESTORE_ERROR'
              );
            }
            throw new LandingPageOptimizerError(
              `Failed to apply optimization: ${error.message}`,
              'UPDATE_ERROR'
            );
          }
        } else {
          // Store for manual approval
          try {
            await this.storage.storeOptimizationSuggestion(
              brandId,
              pageId,
              suggestion
            );
          } catch (error: any) {
            throw new LandingPageOptimizerError(
              `Failed to store suggestion: ${error.message}`,
              'STORAGE_ERROR'
            );
          }
        }
      }

    } catch (error: any) {
      if (error instanceof LandingPageOptimizerError) {
        throw error;
      }
      throw new LandingPageOptimizerError(
        `Unexpected error in applyOptimizations: ${error.message}`,
        'UNKNOWN_ERROR'
      );
    }
  }

  /**
   * Triggers the optimization process for a page
   * @param brandId - The ID of the brand
   * @param pageId - The ID of the landing page
   * @private
   */
  private async triggerOptimization(
    brandId: string,
    pageId: string
  ): Promise<void> {
    try {
      const sections = await this.analyzeSectionPerformance(brandId, pageId);
      const underperforming = sections.filter(s => s.metrics.conversionImpact < 0.5);
      
      if (underperforming.length > 0) {
        const suggestions = await this.generateOptimizations(
          brandId,
          pageId,
          underperforming
        );
        
        await this.applyOptimizations(brandId, pageId, suggestions);
      }
    } catch (error: any) {
      throw new LandingPageOptimizerError(
        `Failed to trigger optimization: ${error.message}`,
        'OPTIMIZATION_ERROR'
      );
    }
  }
} 