import { db } from '../lib/supabase';

interface PerformanceData {
  topPerformers: {
    by_roas: any[];
    by_ctr: any[];
    by_conversion: any[];
  };
  weakPerformers: {
    by_roas: any[];
    by_ctr: any[];
    by_conversion: any[];
  };
  recommendations: Array<{
    type: string;
    message: string;
    metric: string;
    current: number;
    target: number;
  }>;
  timestamp: Date;
}

interface AggregatedInsights {
  trends: {
    ctr_trend: 'up' | 'down' | 'stable';
    conversion_trend: 'up' | 'down' | 'stable';
    roas_trend: 'up' | 'down' | 'stable';
  };
  content_patterns: {
    high_performing_elements: string[];
    weak_performing_elements: string[];
    recommended_improvements: string[];
  };
  visual_insights: {
    successful_formats: string[];
    color_patterns: string[];
    layout_preferences: string[];
  };
  copy_insights: {
    effective_lengths: string[];
    successful_tones: string[];
    high_impact_phrases: string[];
  };
}

export class InsightsEngine {
  private static instance: InsightsEngine;
  
  private constructor() {}

  public static getInstance(): InsightsEngine {
    if (!InsightsEngine.instance) {
      InsightsEngine.instance = new InsightsEngine();
    }
    return InsightsEngine.instance;
  }

  public async processPerformanceData(brandId: string, data: PerformanceData): Promise<void> {
    try {
      // Get historical data
      const [{ data: previousInsights }, { data: brandConfig }] = await Promise.all([
        db.performance_insights.getByBrandId(brandId),
        db.brand_configs.getByBrandId(brandId)
      ]);

      // Aggregate insights
      const insights = await this.aggregateInsights(data, previousInsights || []);

      // Update brand DNA
      await this.updateBrandDNA(brandId, insights, brandConfig);

      // Store aggregated insights
      await db.brand_insights.create({
        brand_id: brandId,
        insights_type: 'performance_aggregate',
        data: insights,
        created_at: new Date()
      });

      // Log insights event
      await db.events.create({
        type: 'INSIGHTS_GENERATED',
        brand_id: brandId,
        payload: {
          insights_type: 'performance_aggregate',
          timestamp: new Date()
        }
      });

    } catch (error) {
      console.error('Error processing performance data:', error);
      throw error;
    }
  }

  private async aggregateInsights(
    currentData: PerformanceData,
    historicalData: any[]
  ): Promise<AggregatedInsights> {
    // Analyze trends
    const trends = this.analyzeTrends(currentData, historicalData);

    // Extract content patterns
    const contentPatterns = this.extractContentPatterns(
      currentData.topPerformers,
      currentData.weakPerformers
    );

    // Analyze visuals
    const visualInsights = this.analyzeVisualPatterns(
      currentData.topPerformers,
      historicalData
    );

    // Analyze copy
    const copyInsights = this.analyzeCopyPatterns(
      currentData.topPerformers,
      historicalData
    );

    return {
      trends,
      content_patterns: contentPatterns,
      visual_insights: visualInsights,
      copy_insights: copyInsights
    };
  }

  private analyzeTrends(current: PerformanceData, historical: any[]) {
    // Calculate trend directions
    return {
      ctr_trend: this.calculateTrend(current, historical, 'ctr'),
      conversion_trend: this.calculateTrend(current, historical, 'conversion_rate'),
      roas_trend: this.calculateTrend(current, historical, 'roas')
    };
  }

  private calculateTrend(
    current: PerformanceData,
    historical: any[],
    metric: string
  ): 'up' | 'down' | 'stable' {
    if (historical.length === 0) return 'stable';

    const currentAvg = this.calculateAverageMetric(current.topPerformers, metric);
    const historicalAvg = this.calculateAverageMetric(historical[0].topPerformers, metric);

    const difference = ((currentAvg - historicalAvg) / historicalAvg) * 100;

    if (difference > 10) return 'up';
    if (difference < -10) return 'down';
    return 'stable';
  }

  private calculateAverageMetric(data: any, metric: string): number {
    const values = Object.values(data)
      .flat()
      .map(item => Number(item[metric]));
    
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  private extractContentPatterns(topPerformers: any, weakPerformers: any) {
    return {
      high_performing_elements: this.extractCommonElements(topPerformers),
      weak_performing_elements: this.extractCommonElements(weakPerformers),
      recommended_improvements: this.generateRecommendations(topPerformers, weakPerformers)
    };
  }

  private extractCommonElements(performers: any): string[] {
    // Extract common patterns from successful content
    const elements = new Set<string>();
    
    Object.values(performers).flat().forEach((item: any) => {
      // Add content elements that appear frequently
      if (item.headline) elements.add(this.categorizeLength(item.headline));
      if (item.description) elements.add(this.analyzeStructure(item.description));
      if (item.cta) elements.add(`CTA: ${item.cta}`);
    });

    return Array.from(elements);
  }

  private categorizeLength(text: string): string {
    const words = text.split(' ').length;
    if (words <= 5) return 'Short form (≤5 words)';
    if (words <= 10) return 'Medium form (6-10 words)';
    return 'Long form (>10 words)';
  }

  private analyzeStructure(text: string): string {
    if (text.includes('?')) return 'Question format';
    if (text.includes('!')) return 'Exclamation format';
    if (text.match(/\d+/)) return 'Contains numbers';
    return 'Standard format';
  }

  private generateRecommendations(top: any, weak: any): string[] {
    const recommendations = new Set<string>();

    // Compare patterns between top and weak performers
    const topPatterns = this.extractCommonElements(top);
    const weakPatterns = this.extractCommonElements(weak);

    topPatterns.forEach(pattern => {
      if (!weakPatterns.includes(pattern)) {
        recommendations.add(`Increase usage of: ${pattern}`);
      }
    });

    return Array.from(recommendations);
  }

  private analyzeVisualPatterns(performers: any, historical: any[]): any {
    return {
      successful_formats: this.extractVisualFormats(performers),
      color_patterns: this.extractColorPatterns(performers),
      layout_preferences: this.extractLayoutPatterns(performers)
    };
  }

  private extractVisualFormats(performers: any): string[] {
    const formats = new Set<string>();
    
    Object.values(performers).flat().forEach((item: any) => {
      if (item.image_format) formats.add(item.image_format);
      if (item.video_format) formats.add(item.video_format);
    });

    return Array.from(formats);
  }

  private extractColorPatterns(performers: any): string[] {
    const colors = new Set<string>();
    
    Object.values(performers).flat().forEach((item: any) => {
      if (item.dominant_colors) {
        item.dominant_colors.forEach((color: string) => colors.add(color));
      }
    });

    return Array.from(colors);
  }

  private extractLayoutPatterns(performers: any): string[] {
    const layouts = new Set<string>();
    
    Object.values(performers).flat().forEach((item: any) => {
      if (item.layout_type) layouts.add(item.layout_type);
    });

    return Array.from(layouts);
  }

  private analyzeCopyPatterns(performers: any, historical: any[]): any {
    return {
      effective_lengths: this.extractCopyLengths(performers),
      successful_tones: this.extractTones(performers),
      high_impact_phrases: this.extractKeyPhrases(performers)
    };
  }

  private extractCopyLengths(performers: any): string[] {
    const lengths = new Set<string>();
    
    Object.values(performers).flat().forEach((item: any) => {
      if (item.copy_text) {
        lengths.add(this.categorizeLength(item.copy_text));
      }
    });

    return Array.from(lengths);
  }

  private extractTones(performers: any): string[] {
    const tones = new Set<string>();
    
    Object.values(performers).flat().forEach((item: any) => {
      if (item.copy_tone) tones.add(item.copy_tone);
    });

    return Array.from(tones);
  }

  private extractKeyPhrases(performers: any): string[] {
    const phrases = new Set<string>();
    
    Object.values(performers).flat().forEach((item: any) => {
      if (item.high_impact_phrases) {
        item.high_impact_phrases.forEach((phrase: string) => phrases.add(phrase));
      }
    });

    return Array.from(phrases);
  }

  private async updateBrandDNA(brandId: string, insights: AggregatedInsights, config: any): Promise<void> {
    // Update brand configuration based on insights
    const updates = {
      tone: this.selectOptimalTone(insights.copy_insights.successful_tones, config.tone),
      preferred_ctas: this.updatePreferredCTAs(insights.content_patterns.high_performing_elements, config.preferred_ctas)
    };

    await db.brand_configs.update(brandId, updates);
  }

  private selectOptimalTone(successfulTones: string[], currentTone: string): string {
    if (successfulTones.length === 0) return currentTone;
    return successfulTones[0]; // Select most successful tone
  }

  private updatePreferredCTAs(highPerforming: string[], current: string[]): string[] {
    const ctaPattern = /CTA: (.*)/;
    const newCTAs = highPerforming
      .filter(element => ctaPattern.test(element))
      .map(element => element.match(ctaPattern)![1]);

    return [...new Set([...newCTAs, ...current])].slice(0, 5); // Keep top 5 CTAs
  }
} 