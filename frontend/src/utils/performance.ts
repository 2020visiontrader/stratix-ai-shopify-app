export class PerformanceManager {
  private static instance: PerformanceManager;
  private metrics: Map<string, PerformanceMetric>;
  private readonly maxMetrics: number;
  private readonly sampleInterval: number;

  private constructor() {
    this.metrics = new Map();
    this.maxMetrics = 1000;
    this.sampleInterval = 60000; // 1 minute
    this.startMonitoring();
  }

  public static getInstance(): PerformanceManager {
    if (!PerformanceManager.instance) {
      PerformanceManager.instance = new PerformanceManager();
    }
    return PerformanceManager.instance;
  }

  private startMonitoring(): void {
    setInterval(() => {
      this.collectMetrics().catch(error => {
        console.error('Failed to collect performance metrics:', error);
      });
    }, this.sampleInterval);
  }

  private async collectMetrics(): Promise<void> {
    const metrics = await this.measurePerformance();
    const timestamp = new Date();

    Object.entries(metrics).forEach(([key, value]) => {
      const metric: PerformanceMetric = {
        id: crypto.randomUUID(),
        name: key,
        value,
        timestamp
      };

      this.metrics.set(metric.id, metric);
    });

    this.checkMetricLimit();
  }

  private async measurePerformance(): Promise<Record<string, number>> {
    const metrics: Record<string, number> = {};

    // Memory usage (Chrome specific)
    const perfWithMemory = performance as any;
    if (perfWithMemory.memory) {
      metrics.memoryUsed = perfWithMemory.memory.usedJSHeapSize;
      metrics.memoryTotal = perfWithMemory.memory.totalJSHeapSize;
    }

    // Navigation timing
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigation) {
      metrics.domContentLoaded = navigation.domContentLoadedEventEnd - navigation.startTime;
      metrics.loadTime = navigation.loadEventEnd - navigation.startTime;
      metrics.firstPaint = performance.getEntriesByName('first-paint')[0]?.startTime || 0;
      metrics.firstContentfulPaint = performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0;
    }

    // Resource timing
    const resources = performance.getEntriesByType('resource');
    metrics.resourceCount = resources.length;
    metrics.averageResourceLoadTime = resources.reduce((sum, resource) => sum + resource.duration, 0) / resources.length;

    // Frame rate
    metrics.frameRate = await this.measureFrameRate();

    return metrics;
  }

  private async measureFrameRate(): Promise<number> {
    return new Promise(resolve => {
      let frames = 0;
      let lastTime = performance.now();
      const duration = 1000; // 1 second

      const countFrames = () => {
        frames++;
        const currentTime = performance.now();
        if (currentTime - lastTime >= duration) {
          resolve(frames);
        } else {
          requestAnimationFrame(countFrames);
        }
      };

      requestAnimationFrame(countFrames);
    });
  }

  private checkMetricLimit(): void {
    if (this.metrics.size > this.maxMetrics) {
      const metricsArray = Array.from(this.metrics.entries());
      const metricsToRemove = metricsArray
        .sort((a, b) => a[1].timestamp.getTime() - b[1].timestamp.getTime())
        .slice(0, metricsArray.length - this.maxMetrics);

      metricsToRemove.forEach(([id]) => this.metrics.delete(id));
    }
  }

  public getMetrics(): PerformanceMetric[] {
    return Array.from(this.metrics.values());
  }

  public getMetricsByName(name: string): PerformanceMetric[] {
    return this.getMetrics().filter(metric => metric.name === name);
  }

  public async analyzePerformance(): Promise<PerformanceReport> {
    const metrics = this.getMetrics();
    if (metrics.length === 0) {
      return {
        summary: {
          averageLoadTime: 0,
          averageMemoryUsage: 0,
          averageFrameRate: 0
        },
        trends: [],
        recommendations: []
      };
    }

    const summary = this.calculateSummary(metrics);
    const trends = this.analyzeTrends(metrics);
    const recommendations = this.generateRecommendations(metrics);

    return {
      summary,
      trends,
      recommendations
    };
  }

  private calculateSummary(metrics: PerformanceMetric[]): PerformanceSummary {
    const loadTimes = metrics.filter(m => m.name === 'loadTime').map(m => m.value);
    const memoryUsage = metrics.filter(m => m.name === 'memoryUsed').map(m => m.value);
    const frameRates = metrics.filter(m => m.name === 'frameRate').map(m => m.value);

    return {
      averageLoadTime: loadTimes.reduce((sum, value) => sum + value, 0) / loadTimes.length,
      averageMemoryUsage: memoryUsage.reduce((sum, value) => sum + value, 0) / memoryUsage.length,
      averageFrameRate: frameRates.reduce((sum, value) => sum + value, 0) / frameRates.length
    };
  }

  private analyzeTrends(metrics: PerformanceMetric[]): string[] {
    const trends: string[] = [];
    const recentMetrics = metrics
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 10);

    // Analyze load time trend
    const loadTimes = recentMetrics.filter(m => m.name === 'loadTime').map(m => m.value);
    if (loadTimes.length >= 2) {
      const loadTimeTrend = loadTimes[0] - loadTimes[loadTimes.length - 1];
      trends.push(`Load time ${loadTimeTrend > 0 ? 'increased' : 'decreased'} by ${Math.abs(loadTimeTrend).toFixed(2)}ms`);
    }

    // Analyze memory usage trend
    const memoryUsage = recentMetrics.filter(m => m.name === 'memoryUsed').map(m => m.value);
    if (memoryUsage.length >= 2) {
      const memoryTrend = memoryUsage[0] - memoryUsage[memoryUsage.length - 1];
      trends.push(`Memory usage ${memoryTrend > 0 ? 'increased' : 'decreased'} by ${(Math.abs(memoryTrend) / 1024 / 1024).toFixed(2)}MB`);
    }

    return trends;
  }

  private generateRecommendations(metrics: PerformanceMetric[]): string[] {
    const recommendations: string[] = [];
    const summary = this.calculateSummary(metrics);

    if (summary.averageLoadTime > 3000) {
      recommendations.push('Consider optimizing page load time');
    }

    if (summary.averageMemoryUsage > 50 * 1024 * 1024) {
      recommendations.push('High memory usage detected, consider memory optimization');
    }

    if (summary.averageFrameRate < 30) {
      recommendations.push('Low frame rate detected, consider performance optimization');
    }

    return recommendations;
  }

  public async exportMetrics(format: 'json' | 'csv'): Promise<string> {
    const metrics = this.getMetrics();
    if (format === 'json') {
      return JSON.stringify(metrics, null, 2);
    } else {
      const headers = ['ID', 'Name', 'Value', 'Timestamp'];
      const rows = metrics.map(metric => [
        metric.id,
        metric.name,
        metric.value,
        metric.timestamp.toISOString()
      ]);
      return [headers, ...rows].map(row => row.join(',')).join('\n');
    }
  }

  public async importMetrics(data: string, format: 'json' | 'csv'): Promise<void> {
    try {
      let parsedMetrics: PerformanceMetric[];

      if (format === 'json') {
        parsedMetrics = JSON.parse(data);
      } else {
        const rows = data.split('\n').map(row => row.split(','));
        const headers = rows[0];
        parsedMetrics = rows.slice(1).map(row => ({
          id: row[0],
          name: row[1],
          value: Number(row[2]),
          timestamp: new Date(row[3])
        }));
      }

      parsedMetrics.forEach(metric => {
        this.metrics.set(metric.id, metric);
      });
    } catch (error) {
      console.error('Failed to import metrics:', error);
    }
  }

  public clearMetrics(): void {
    this.metrics.clear();
  }
}

interface PerformanceMetric {
  id: string;
  name: string;
  value: number;
  timestamp: Date;
}

interface PerformanceReport {
  summary: PerformanceSummary;
  trends: string[];
  recommendations: string[];
}

interface PerformanceSummary {
  averageLoadTime: number;
  averageMemoryUsage: number;
  averageFrameRate: number;
} 