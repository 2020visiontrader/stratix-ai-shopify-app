import { BrandConfig, PerformanceMetrics } from '../types';
import { AppError } from '../utils/errors';
import { DatabaseService } from './DatabaseService';

interface PerformanceAlert {
  type: 'warning' | 'critical';
  message: string;
  metrics: Partial<PerformanceMetrics['metrics']>;
  threshold: number;
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private db: DatabaseService;

  private constructor() {
    this.db = DatabaseService.getInstance();
  }

  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  async trackMetrics(
    brandId: string,
    type: PerformanceMetrics['type'],
    contentId: string,
    metrics: PerformanceMetrics['metrics']
  ): Promise<void> {
    try {
      const performanceMetrics: Omit<PerformanceMetrics, 'id'> = {
        brand_id: brandId,
        type,
        content_id: contentId,
        metrics,
        period: 'daily',
        date: new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      await this.db.create('performance_metrics', performanceMetrics);
      await this.checkAlerts(brandId, type, contentId, metrics);
    } catch (error) {
      throw new AppError('Failed to track performance metrics', error);
    }
  }

  async getMetrics(
    brandId: string,
    type: PerformanceMetrics['type'],
    contentId: string,
    period: PerformanceMetrics['period'] = 'daily',
    startDate: string,
    endDate: string
  ): Promise<PerformanceMetrics[]> {
    try {
      const metrics = await this.db.list('performance_metrics', {
        brand_id: brandId,
        type,
        content_id: contentId,
        period,
        date: {
          gte: startDate,
          lte: endDate
        }
      });

      return metrics as PerformanceMetrics[];
    } catch (error) {
      throw new AppError('Failed to get performance metrics', error);
    }
  }

  async analyzePerformance(
    brandId: string,
    type: PerformanceMetrics['type'],
    contentId: string,
    period: PerformanceMetrics['period'] = 'daily',
    days: number = 30
  ): Promise<{
    average: PerformanceMetrics['metrics'];
    trend: Record<keyof PerformanceMetrics['metrics'], number>;
    alerts: PerformanceAlert[];
  }> {
    try {
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];

      const metrics = await this.getMetrics(
        brandId,
        type,
        contentId,
        period,
        startDate,
        endDate
      );

      if (metrics.length === 0) {
        throw new AppError('No metrics found for the specified period');
      }

      const average = this.calculateAverage(metrics);
      const trend = this.calculateTrend(metrics);
      const alerts = await this.checkAlerts(brandId, type, contentId, average);

      return { average, trend, alerts };
    } catch (error) {
      throw new AppError('Failed to analyze performance', error);
    }
  }

  private calculateAverage(metrics: PerformanceMetrics[]): PerformanceMetrics['metrics'] {
    const sum = metrics.reduce(
      (acc, curr) => ({
        views: acc.views + curr.metrics.views,
        clicks: acc.clicks + curr.metrics.clicks,
        conversions: acc.conversions + curr.metrics.conversions,
        revenue: acc.revenue + curr.metrics.revenue,
        bounce_rate: acc.bounce_rate + curr.metrics.bounce_rate,
        time_on_page: acc.time_on_page + curr.metrics.time_on_page
      }),
      {
        views: 0,
        clicks: 0,
        conversions: 0,
        revenue: 0,
        bounce_rate: 0,
        time_on_page: 0
      }
    );

    const count = metrics.length;
    return {
      views: sum.views / count,
      clicks: sum.clicks / count,
      conversions: sum.conversions / count,
      revenue: sum.revenue / count,
      bounce_rate: sum.bounce_rate / count,
      time_on_page: sum.time_on_page / count
    };
  }

  private calculateTrend(
    metrics: PerformanceMetrics[]
  ): Record<keyof PerformanceMetrics['metrics'], number> {
    const sortedMetrics = [...metrics].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const firstMetrics = sortedMetrics[0].metrics;
    const lastMetrics = sortedMetrics[sortedMetrics.length - 1].metrics;

    return {
      views: this.calculatePercentageChange(firstMetrics.views, lastMetrics.views),
      clicks: this.calculatePercentageChange(firstMetrics.clicks, lastMetrics.clicks),
      conversions: this.calculatePercentageChange(
        firstMetrics.conversions,
        lastMetrics.conversions
      ),
      revenue: this.calculatePercentageChange(firstMetrics.revenue, lastMetrics.revenue),
      bounce_rate: this.calculatePercentageChange(
        firstMetrics.bounce_rate,
        lastMetrics.bounce_rate
      ),
      time_on_page: this.calculatePercentageChange(
        firstMetrics.time_on_page,
        lastMetrics.time_on_page
      )
    };
  }

  private calculatePercentageChange(start: number, end: number): number {
    if (start === 0) return end > 0 ? 100 : 0;
    return ((end - start) / start) * 100;
  }

  private async checkAlerts(
    brandId: string,
    type: PerformanceMetrics['type'],
    contentId: string,
    metrics: PerformanceMetrics['metrics']
  ): Promise<PerformanceAlert[]> {
    try {
      const brandConfig = await this.db.getById('brand_configs', brandId) as BrandConfig;
      const alerts: PerformanceAlert[] = [];

      if (!brandConfig.features.performance_monitoring) {
        return alerts;
      }

      // Check bounce rate
      if (metrics.bounce_rate > 70) {
        alerts.push({
          type: 'warning',
          message: 'High bounce rate detected',
          metrics: { bounce_rate: metrics.bounce_rate },
          threshold: 70
        });
      }

      // Check conversion rate
      const conversionRate = (metrics.conversions / metrics.views) * 100;
      if (conversionRate < 1) {
        alerts.push({
          type: 'warning',
          message: 'Low conversion rate detected',
          metrics: { conversions: metrics.conversions, views: metrics.views },
          threshold: 1
        });
      }

      // Check time on page
      if (metrics.time_on_page < 30) {
        alerts.push({
          type: 'warning',
          message: 'Low time on page detected',
          metrics: { time_on_page: metrics.time_on_page },
          threshold: 30
        });
      }

      // Store alerts in the database
      if (alerts.length > 0) {
        await this.db.create('events', {
          brand_id: brandId,
          type: 'performance_alert',
          data: {
            content_type: type,
            content_id: contentId,
            alerts
          },
          created_at: new Date().toISOString()
        });
      }

      return alerts;
    } catch (error) {
      throw new AppError('Failed to check performance alerts', error);
    }
  }
} 