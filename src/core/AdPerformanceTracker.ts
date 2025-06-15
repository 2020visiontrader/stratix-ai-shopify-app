import { db } from '../lib/supabase';
import { AIEvolutionLogger } from './AIEvolutionLogger';
import { PromptComposer } from './PromptComposer';

interface AdPerformanceMetrics {
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
  revenue: number;
  ctr: number;
  cvr: number;
  roas: number;
  timestamp: Date;
}

interface AdVariant {
  id: string;
  content: string;
  prompt_template: string;
  frameworks_used: string[];
  tone_markers: string[];
  performance?: AdPerformanceMetrics;
}

interface PerformancePattern {
  pattern_type: 'framework' | 'tone' | 'structure';
  pattern_value: string;
  success_rate: number;
  sample_size: number;
  confidence_score: number;
}

export class AdPerformanceTracker {
  private static instance: AdPerformanceTracker;
  private evolutionLogger: AIEvolutionLogger;
  private promptComposer: PromptComposer;
  
  private constructor() {
    this.evolutionLogger = AIEvolutionLogger.getInstance();
    this.promptComposer = PromptComposer.getInstance();
  }

  public static getInstance(): AdPerformanceTracker {
    if (!AdPerformanceTracker.instance) {
      AdPerformanceTracker.instance = new AdPerformanceTracker();
    }
    return AdPerformanceTracker.instance;
  }

  public async trackPerformance(
    brandId: string,
    adId: string,
    metrics: Omit<AdPerformanceMetrics, 'ctr' | 'cvr' | 'roas' | 'timestamp'>
  ): Promise<void> {
    try {
      // Calculate derived metrics
      const derivedMetrics = this.calculateDerivedMetrics(metrics);
      
      // Store performance data
      await db.ad_performance.create({
        brand_id: brandId,
        ad_id: adId,
        ...derivedMetrics
      });

      // Get ad variant details
      const { data: variant } = await db.ad_variants.getById(adId);
      if (!variant) throw new Error('Ad variant not found');

      // Analyze patterns
      const patterns = await this.analyzePerformancePatterns(brandId, variant, derivedMetrics);

      // Update AI behavior based on patterns
      await this.updateAIBehavior(brandId, patterns);

      // Log evolution
      await this.evolutionLogger.logEvolution(brandId, {
        type: 'PROMPT_PERFORMANCE',
        trigger: {
          source: 'ad_performance',
          action: 'metrics_update',
          metadata: { ad_id: adId }
        },
        changes: {
          before: { patterns: await this.getExistingPatterns(brandId) },
          after: { patterns },
          impact_areas: ['ad_generation', 'prompt_tuning']
        },
        metrics: {
          performance_delta: this.calculatePerformanceDelta(patterns),
          confidence_score: this.calculateConfidenceScore(patterns),
          sample_size: patterns.reduce((sum, p) => sum + p.sample_size, 0)
        }
      });

    } catch (error) {
      console.error('Error tracking ad performance:', error);
      throw error;
    }
  }

  private calculateDerivedMetrics(metrics: Omit<AdPerformanceMetrics, 'ctr' | 'cvr' | 'roas' | 'timestamp'>): AdPerformanceMetrics {
    return {
      ...metrics,
      ctr: metrics.clicks / metrics.impressions,
      cvr: metrics.conversions / metrics.clicks,
      roas: metrics.revenue / metrics.spend,
      timestamp: new Date()
    };
  }

  private async analyzePerformancePatterns(
    brandId: string,
    variant: AdVariant,
    metrics: AdPerformanceMetrics
  ): Promise<PerformancePattern[]> {
    const patterns: PerformancePattern[] = [];

    // Analyze frameworks
    for (const framework of variant.frameworks_used) {
      const frameworkPattern = await this.analyzePattern(brandId, {
        pattern_type: 'framework',
        pattern_value: framework,
        metrics
      });
      patterns.push(frameworkPattern);
    }

    // Analyze tone
    for (const tone of variant.tone_markers) {
      const tonePattern = await this.analyzePattern(brandId, {
        pattern_type: 'tone',
        pattern_value: tone,
        metrics
      });
      patterns.push(tonePattern);
    }

    // Analyze structure
    const structurePattern = await this.analyzePattern(brandId, {
      pattern_type: 'structure',
      pattern_value: this.extractStructurePattern(variant.content),
      metrics
    });
    patterns.push(structurePattern);

    return patterns;
  }

  private async analyzePattern(
    brandId: string,
    data: {
      pattern_type: PerformancePattern['pattern_type'];
      pattern_value: string;
      metrics: AdPerformanceMetrics;
    }
  ): Promise<PerformancePattern> {
    // Get historical performance for this pattern
    const { data: history } = await db.performance_patterns.getByPattern({
      brand_id: brandId,
      pattern_type: data.pattern_type,
      pattern_value: data.pattern_value
    });

    // Calculate success metrics
    const success_rate = this.calculateSuccessRate(data.metrics);
    const sample_size = (history?.sample_size || 0) + 1;
    const confidence_score = this.calculatePatternConfidence(sample_size);

    // Update pattern stats
    await db.performance_patterns.upsert({
      brand_id: brandId,
      pattern_type: data.pattern_type,
      pattern_value: data.pattern_value,
      success_rate: (history?.success_rate || 0) * ((sample_size - 1) / sample_size) + success_rate / sample_size,
      sample_size,
      confidence_score,
      last_updated: new Date()
    });

    return {
      pattern_type: data.pattern_type,
      pattern_value: data.pattern_value,
      success_rate,
      sample_size,
      confidence_score
    };
  }

  private calculateSuccessRate(metrics: AdPerformanceMetrics): number {
    // Weight different success factors
    const weights = {
      ctr: 0.3,
      cvr: 0.4,
      roas: 0.3
    };

    // Benchmark thresholds
    const thresholds = {
      ctr: 0.02, // 2% CTR
      cvr: 0.03, // 3% CVR
      roas: 2.0  // 2x ROAS
    };

    // Calculate normalized scores
    const scores = {
      ctr: Math.min(metrics.ctr / thresholds.ctr, 2),
      cvr: Math.min(metrics.cvr / thresholds.cvr, 2),
      roas: Math.min(metrics.roas / thresholds.roas, 2)
    };

    // Calculate weighted average
    return Object.entries(weights).reduce((score, [metric, weight]) => {
      return score + scores[metric as keyof typeof scores] * weight;
    }, 0);
  }

  private calculatePatternConfidence(sampleSize: number): number {
    const MIN_SAMPLES = 10;
    const MAX_SAMPLES = 100;
    return Math.min((sampleSize - MIN_SAMPLES) / (MAX_SAMPLES - MIN_SAMPLES), 1);
  }

  private extractStructurePattern(content: string): string {
    // Simple structure analysis based on content parts
    const parts = content.split('\n').filter(Boolean);
    return parts.map(part => {
      if (part.endsWith('?')) return 'QUESTION';
      if (part.endsWith('!')) return 'EXCLAMATION';
      if (part.match(/\d+/)) return 'NUMBER';
      if (part.match(/^(buy|get|try|start)/i)) return 'CTA';
      return 'STATEMENT';
    }).join('_');
  }

  private async updateAIBehavior(brandId: string, patterns: PerformancePattern[]): Promise<void> {
    // Get high-confidence patterns
    const significantPatterns = patterns.filter(p => 
      p.confidence_score > 0.7 && p.sample_size > 20
    );

    if (significantPatterns.length === 0) return;

    // Update prompt weights
    const updates = {
      framework_weights: this.calculatePatternWeights(
        significantPatterns.filter(p => p.pattern_type === 'framework')
      ),
      tone_weights: this.calculatePatternWeights(
        significantPatterns.filter(p => p.pattern_type === 'tone')
      ),
      structure_weights: this.calculatePatternWeights(
        significantPatterns.filter(p => p.pattern_type === 'structure')
      )
    };

    // Apply updates to prompt composer
    await this.promptComposer.updateWeights(brandId, updates);
  }

  private calculatePatternWeights(patterns: PerformancePattern[]): Record<string, number> {
    if (patterns.length === 0) return {};

    const weights: Record<string, number> = {};
    const totalScore = patterns.reduce((sum, p) => sum + p.success_rate, 0);

    patterns.forEach(pattern => {
      weights[pattern.pattern_value] = pattern.success_rate / totalScore;
    });

    return weights;
  }

  private async getExistingPatterns(brandId: string): Promise<PerformancePattern[]> {
    const { data: patterns } = await db.performance_patterns.getByBrandId(brandId);
    return patterns || [];
  }

  private calculatePerformanceDelta(patterns: PerformancePattern[]): number {
    if (patterns.length === 0) return 0;
    return patterns.reduce((sum, p) => sum + p.success_rate, 0) / patterns.length - 0.5;
  }

  private calculateConfidenceScore(patterns: PerformancePattern[]): number {
    if (patterns.length === 0) return 0;
    return patterns.reduce((sum, p) => sum + p.confidence_score, 0) / patterns.length;
  }
} 