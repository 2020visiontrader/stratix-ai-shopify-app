import { supabase } from '../../lib/supabase';
import { AppError } from '../../utils/errors';
import { logger } from '../../utils/logger';

export interface PerformanceMetrics {
  views: number;
  clicks: number;
  conversions: number;
  revenue: number;
  ctr: number;
  conversion_rate: number;
  average_order_value: number;
  timestamp: Date;
}

export class PerformanceMonitor {
  async trackMetrics(
    productId: string,
    metrics: Partial<PerformanceMetrics>
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('performance_metrics')
        .insert({
          product_id: productId,
          ...metrics,
          timestamp: new Date()
        });

      if (error) throw error;
    } catch (error) {
      logger.error('Error tracking metrics:', error);
      throw new AppError(500, 'DATABASE_ERROR', 'Failed to track metrics', error);
    }
  }

  async getMetrics(
    productId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<PerformanceMetrics[]> {
    try {
      let query = supabase
        .from('performance_metrics')
        .select('*')
        .eq('product_id', productId)
        .order('timestamp', { ascending: false });

      if (startDate) {
        query = query.gte('timestamp', startDate.toISOString());
      }

      if (endDate) {
        query = query.lte('timestamp', endDate.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as PerformanceMetrics[];
    } catch (error) {
      logger.error('Error getting metrics:', error);
      throw new AppError(500, 'DATABASE_ERROR', 'Failed to get metrics', error);
    }
  }

  async getAggregatedMetrics(
    productId: string,
    period: 'day' | 'week' | 'month'
  ): Promise<PerformanceMetrics> {
    try {
      const { data, error } = await supabase
        .rpc('get_aggregated_metrics', {
          p_product_id: productId,
          p_period: period
        });

      if (error) throw error;
      return data as PerformanceMetrics;
    } catch (error) {
      logger.error('Error getting aggregated metrics:', error);
      throw new AppError(500, 'DATABASE_ERROR', 'Failed to get aggregated metrics', error);
    }
  }

  async analyzePerformance(
    productId: string,
    period: 'day' | 'week' | 'month'
  ): Promise<{
    trend: 'up' | 'down' | 'stable';
    insights: string[];
    recommendations: string[];
  }> {
    try {
      const metrics = await this.getAggregatedMetrics(productId, period);
      const previousMetrics = await this.getAggregatedMetrics(
        productId,
        this.getPreviousPeriod(period)
      );

      const trend = this.calculateTrend(metrics, previousMetrics);
      const insights = this.generateInsights(metrics, previousMetrics);
      const recommendations = this.generateRecommendations(metrics, insights);

      return {
        trend,
        insights,
        recommendations
      };
    } catch (error) {
      logger.error('Error analyzing performance:', error);
      throw new AppError(500, 'ANALYSIS_ERROR', 'Failed to analyze performance', error);
    }
  }

  private getPreviousPeriod(period: 'day' | 'week' | 'month'): 'day' | 'week' | 'month' {
    return period; // In a real implementation, this would return the previous period
  }

  private calculateTrend(
    current: PerformanceMetrics,
    previous: PerformanceMetrics
  ): 'up' | 'down' | 'stable' {
    const threshold = 0.05; // 5% change threshold
    const change = (current.conversions - previous.conversions) / previous.conversions;

    if (change > threshold) return 'up';
    if (change < -threshold) return 'down';
    return 'stable';
  }

  private generateInsights(
    current: PerformanceMetrics,
    previous: PerformanceMetrics
  ): string[] {
    const insights: string[] = [];

    // Conversion rate analysis
    const conversionRateChange =
      (current.conversion_rate - previous.conversion_rate) / previous.conversion_rate;
    if (Math.abs(conversionRateChange) > 0.1) {
      insights.push(
        `Conversion rate has ${conversionRateChange > 0 ? 'increased' : 'decreased'} by ${
          Math.abs(conversionRateChange * 100).toFixed(1)
        }%`
      );
    }

    // CTR analysis
    const ctrChange = (current.ctr - previous.ctr) / previous.ctr;
    if (Math.abs(ctrChange) > 0.1) {
      insights.push(
        `Click-through rate has ${ctrChange > 0 ? 'improved' : 'declined'} by ${
          Math.abs(ctrChange * 100).toFixed(1)
        }%`
      );
    }

    // Revenue analysis
    const revenueChange = (current.revenue - previous.revenue) / previous.revenue;
    if (Math.abs(revenueChange) > 0.1) {
      insights.push(
        `Revenue has ${revenueChange > 0 ? 'increased' : 'decreased'} by ${
          Math.abs(revenueChange * 100).toFixed(1)
        }%`
      );
    }

    return insights;
  }

  private generateRecommendations(
    metrics: PerformanceMetrics,
    insights: string[]
  ): string[] {
    const recommendations: string[] = [];

    // Low CTR recommendations
    if (metrics.ctr < 0.02) {
      recommendations.push('Consider optimizing product title and images to improve click-through rate');
    }

    // Low conversion rate recommendations
    if (metrics.conversion_rate < 0.01) {
      recommendations.push('Review product pricing and description to improve conversion rate');
    }

    // High bounce rate recommendations
    if (metrics.views > 0 && metrics.clicks / metrics.views < 0.1) {
      recommendations.push('Improve product page load time and mobile responsiveness');
    }

    return recommendations;
  }
} 