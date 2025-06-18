import { supabase } from '../../db';
import { AppError } from '../../utils/errors';
import { logger } from '../../utils/logger';

export interface AnalyticsReport {
  period: {
    start: Date;
    end: Date;
  };
  metrics: {
    total_views: number;
    total_clicks: number;
    total_conversions: number;
    total_revenue: number;
    average_order_value: number;
    conversion_rate: number;
    click_through_rate: number;
  };
  trends: {
    daily: {
      date: Date;
      views: number;
      clicks: number;
      conversions: number;
      revenue: number;
    }[];
  };
  top_performing: {
    products: {
      id: string;
      title: string;
      views: number;
      conversions: number;
      revenue: number;
    }[];
    content: {
      id: string;
      type: string;
      views: number;
      conversions: number;
    }[];
  };
}

export class AnalyticsService {
  async generateReport(
    shopId: string,
    startDate: Date,
    endDate: Date
  ): Promise<AnalyticsReport> {
    try {
      // Get aggregated metrics
      const metrics = await this.getAggregatedMetrics(shopId, startDate, endDate);

      // Get daily trends
      const trends = await this.getDailyTrends(shopId, startDate, endDate);

      // Get top performing items
      const topPerforming = await this.getTopPerforming(shopId, startDate, endDate);

      return {
        period: { start: startDate, end: endDate },
        metrics,
        trends,
        top_performing: topPerforming
      };
    } catch (error) {
      logger.error('Error generating report:', error);
      throw new AppError(500, 'ANALYTICS_ERROR', 'Failed to generate report', error);
    }
  }

  private async getAggregatedMetrics(
    shopId: string,
    startDate: Date,
    endDate: Date
  ): Promise<AnalyticsReport['metrics']> {
    try {
      const { data, error } = await supabase
        .rpc('get_aggregated_metrics', {
          p_shop_id: shopId,
          p_start_date: startDate.toISOString(),
          p_end_date: endDate.toISOString()
        });

      if (error) throw error;
      return data as AnalyticsReport['metrics'];
    } catch (error) {
      logger.error('Error getting aggregated metrics:', error);
      throw new AppError(500, 'DATABASE_ERROR', 'Failed to get aggregated metrics', error);
    }
  }

  private async getDailyTrends(
    shopId: string,
    startDate: Date,
    endDate: Date
  ): Promise<AnalyticsReport['trends']> {
    try {
      const { data, error } = await supabase
        .rpc('get_daily_trends', {
          p_shop_id: shopId,
          p_start_date: startDate.toISOString(),
          p_end_date: endDate.toISOString()
        });

      if (error) throw error;
      return { daily: data as AnalyticsReport['trends']['daily'] };
    } catch (error) {
      logger.error('Error getting daily trends:', error);
      throw new AppError(500, 'DATABASE_ERROR', 'Failed to get daily trends', error);
    }
  }

  private async getTopPerforming(
    shopId: string,
    startDate: Date,
    endDate: Date
  ): Promise<AnalyticsReport['top_performing']> {
    try {
      const [products, content] = await Promise.all([
        this.getTopProducts(shopId, startDate, endDate),
        this.getTopContent(shopId, startDate, endDate)
      ]);

      return {
        products,
        content
      };
    } catch (error) {
      logger.error('Error getting top performing items:', error);
      throw new AppError(500, 'DATABASE_ERROR', 'Failed to get top performing items', error);
    }
  }

  private async getTopProducts(
    shopId: string,
    startDate: Date,
    endDate: Date
  ): Promise<AnalyticsReport['top_performing']['products']> {
    try {
      const { data, error } = await supabase
        .rpc('get_top_products', {
          p_shop_id: shopId,
          p_start_date: startDate.toISOString(),
          p_end_date: endDate.toISOString()
        });

      if (error) throw error;
      return data as AnalyticsReport['top_performing']['products'];
    } catch (error) {
      logger.error('Error getting top products:', error);
      throw new AppError(500, 'DATABASE_ERROR', 'Failed to get top products', error);
    }
  }

  private async getTopContent(
    shopId: string,
    startDate: Date,
    endDate: Date
  ): Promise<AnalyticsReport['top_performing']['content']> {
    try {
      const { data, error } = await supabase
        .rpc('get_top_content', {
          p_shop_id: shopId,
          p_start_date: startDate.toISOString(),
          p_end_date: endDate.toISOString()
        });

      if (error) throw error;
      return data as AnalyticsReport['top_performing']['content'];
    } catch (error) {
      logger.error('Error getting top content:', error);
      throw new AppError(500, 'DATABASE_ERROR', 'Failed to get top content', error);
    }
  }

  async exportReport(
    report: AnalyticsReport,
    format: 'csv' | 'json' | 'pdf'
  ): Promise<string> {
    try {
      switch (format) {
        case 'csv':
          return this.exportToCSV(report);
        case 'json':
          return JSON.stringify(report, null, 2);
        case 'pdf':
          return this.exportToPDF(report);
        default:
          throw new Error('Unsupported export format');
      }
    } catch (error) {
      logger.error('Error exporting report:', error);
      throw new AppError(500, 'EXPORT_ERROR', 'Failed to export report', error);
    }
  }

  private exportToCSV(report: AnalyticsReport): string {
    // In a real implementation, this would convert the report to CSV format
    return '';
  }

  private exportToPDF(report: AnalyticsReport): string {
    // In a real implementation, this would convert the report to PDF format
    return '';
  }
} 