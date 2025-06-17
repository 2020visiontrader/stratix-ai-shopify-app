
export interface AIModelMetrics {
  modelId: string;
  modelName: string;
  version: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  responseTime: number; // in milliseconds
  tokenUsage: {
    input: number;
    output: number;
    total: number;
  };
  cost: number;
  timestamp: Date;
}

export interface AIEvolutionEvent {
  eventId: string;
  eventType: 'prediction' | 'feedback' | 'retraining' | 'evaluation' | 'deployment';
  modelId: string;
  metadata: Record<string, any>;
  timestamp: Date;
  userId?: string;
  sessionId?: string;
}

export interface AIPerformanceTrend {
  modelId: string;
  timeframe: 'hourly' | 'daily' | 'weekly' | 'monthly';
  averageAccuracy: number;
  averageResponseTime: number;
  totalPredictions: number;
  totalCost: number;
  trend: 'improving' | 'degrading' | 'stable';
  trendPercentage: number;
}

export interface AIModelComparison {
  models: Array<{
    modelId: string;
    modelName: string;
    metrics: AIModelMetrics;
    rank: number;
  }>;
  bestPerforming: string;
  recommendations: string[];
}

export class AIEvolutionLogger {
  private metrics: Map<string, AIModelMetrics[]> = new Map();
  private events: AIEvolutionEvent[] = [];
  private performanceThresholds: Map<string, number> = new Map();
  private retentionPeriod: number = 90; // days

  constructor() {
    this.initializeDefaultThresholds();
    this.startPeriodicCleanup();
  }

  private initializeDefaultThresholds(): void {
    this.performanceThresholds.set('accuracy', 0.85);
    this.performanceThresholds.set('responseTime', 2000); // 2 seconds
    this.performanceThresholds.set('f1Score', 0.80);
    this.performanceThresholds.set('cost', 0.10); // $0.10 per request
  }

  private startPeriodicCleanup(): void {
    // Clean up old data every 24 hours
    setInterval(() => {
      this.cleanupOldData();
    }, 24 * 60 * 60 * 1000);
  }

  // Log AI model performance metrics
  async logModelMetrics(metrics: Omit<AIModelMetrics, 'timestamp'>): Promise<void> {
    try {
      const timestampedMetrics: AIModelMetrics = {
        ...metrics,
        timestamp: new Date()
      };

      if (!this.metrics.has(metrics.modelId)) {
        this.metrics.set(metrics.modelId, []);
      }

      this.metrics.get(metrics.modelId)!.push(timestampedMetrics);

      // Log evolution event
      await this.logEvolutionEvent({
        eventType: 'evaluation',
        modelId: metrics.modelId,
        metadata: { 
          metrics: timestampedMetrics,
          performanceGrade: this.calculatePerformanceGrade(timestampedMetrics)
        }
      });

      // Check for performance alerts
      await this.checkPerformanceAlerts(timestampedMetrics);

    } catch (error) {
      console.error('Error logging model metrics:', error);
      throw error;
    }
  }

  // Log AI evolution events
  async logEvolutionEvent(
    event: Omit<AIEvolutionEvent, 'eventId' | 'timestamp'>
  ): Promise<string> {
    try {
      const evolutionEvent: AIEvolutionEvent = {
        eventId: this.generateEventId(),
        timestamp: new Date(),
        ...event
      };

      this.events.push(evolutionEvent);

      // Store in persistent storage if configured
      await this.persistEvent(evolutionEvent);

      return evolutionEvent.eventId;
    } catch (error) {
      console.error('Error logging evolution event:', error);
      throw error;
    }
  }

  // Track AI model prediction
  async trackPrediction(
    modelId: string,
    input: any,
    output: any,
    metadata: Record<string, any> = {}
  ): Promise<void> {
    try {
      await this.logEvolutionEvent({
        eventType: 'prediction',
        modelId,
        metadata: {
          input: this.sanitizeInput(input),
          output: this.sanitizeOutput(output),
          ...metadata
        }
      });
    } catch (error) {
      console.error('Error tracking prediction:', error);
      throw error;
    }
  }

  // Track user feedback on AI predictions
  async trackFeedback(
    modelId: string,
    predictionId: string,
    feedback: {
      rating: number; // 1-5 scale
      isCorrect: boolean;
      comments?: string;
      userId?: string;
    }
  ): Promise<void> {
    try {
      await this.logEvolutionEvent({
        eventType: 'feedback',
        modelId,
        userId: feedback.userId,
        metadata: {
          predictionId,
          feedback
        }
      });

      // Update model performance based on feedback
      await this.updateModelPerformanceFromFeedback(modelId, feedback);
    } catch (error) {
      console.error('Error tracking feedback:', error);
      throw error;
    }
  }

  // Analyze AI performance trends
  async analyzePerformanceTrends(
    modelId: string,
    timeframe: AIPerformanceTrend['timeframe'] = 'daily'
  ): Promise<AIPerformanceTrend> {
    try {
      const modelMetrics = this.metrics.get(modelId) || [];
      
      if (modelMetrics.length === 0) {
        throw new Error(`No metrics found for model ${modelId}`);
      }

      const timeframeDuration = this.getTimeframeDuration(timeframe);
      const cutoffDate = new Date(Date.now() - timeframeDuration);
      
      const recentMetrics = modelMetrics.filter(
        metric => metric.timestamp >= cutoffDate
      );

      const averageAccuracy = this.calculateAverage(
        recentMetrics.map(m => m.accuracy)
      );
      
      const averageResponseTime = this.calculateAverage(
        recentMetrics.map(m => m.responseTime)
      );

      const totalCost = recentMetrics.reduce((sum, m) => sum + m.cost, 0);

      // Calculate trend
      const trend = this.calculateTrend(recentMetrics, 'accuracy');

      return {
        modelId,
        timeframe,
        averageAccuracy,
        averageResponseTime,
        totalPredictions: recentMetrics.length,
        totalCost,
        trend: trend.direction,
        trendPercentage: trend.percentage
      };
    } catch (error) {
      console.error('Error analyzing performance trends:', error);
      throw error;
    }
  }

  // Compare multiple AI models
  async compareModels(modelIds: string[]): Promise<AIModelComparison> {
    try {
      const modelComparisons: Array<{
        modelId: string;
        modelName: string;
        metrics: AIModelMetrics;
        rank: number;
      }> = [];

      for (const modelId of modelIds) {
        const metrics = this.getLatestMetrics(modelId);
        if (metrics) {
          modelComparisons.push({
            modelId,
            modelName: metrics.modelName,
            metrics,
            rank: 0 // Will be calculated below
          });
        }
      }

      // Rank models by composite score
      modelComparisons.forEach(model => {
        model.rank = this.calculateCompositeScore(model.metrics);
      });

      // Sort by rank (higher score = better rank)
      modelComparisons.sort((a, b) => b.rank - a.rank);

      // Assign ranks
      modelComparisons.forEach((model, index) => {
        model.rank = index + 1;
      });

      const bestPerforming = modelComparisons[0]?.modelId || '';
      const recommendations = this.generateModelRecommendations(modelComparisons);

      return {
        models: modelComparisons,
        bestPerforming,
        recommendations
      };
    } catch (error) {
      console.error('Error comparing models:', error);
      throw error;
    }
  }

  // Get AI evolution insights
  async getEvolutionInsights(modelId: string): Promise<{
    totalEvents: number;
    recentActivity: AIEvolutionEvent[];
    performanceHistory: AIModelMetrics[];
    alerts: string[];
    recommendations: string[];
  }> {
    try {
      const modelEvents = this.events.filter(event => event.modelId === modelId);
      const recentEvents = modelEvents
        .slice(-10)
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      const performanceHistory = this.metrics.get(modelId) || [];
      const alerts = await this.getModelAlerts(modelId);
      const recommendations = await this.getModelRecommendations(modelId);

      return {
        totalEvents: modelEvents.length,
        recentActivity: recentEvents,
        performanceHistory: performanceHistory.slice(-20), // Last 20 metrics
        alerts,
        recommendations
      };
    } catch (error) {
      console.error('Error getting evolution insights:', error);
      throw error;
    }
  }

  // Export evolution data
  async exportEvolutionData(
    modelId?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    metrics: AIModelMetrics[];
    events: AIEvolutionEvent[];
    summary: any;
  }> {
    try {
      let filteredMetrics: AIModelMetrics[] = [];
      let filteredEvents: AIEvolutionEvent[] = [];

      if (modelId) {
        filteredMetrics = this.metrics.get(modelId) || [];
        filteredEvents = this.events.filter(event => event.modelId === modelId);
      } else {
        // Get all metrics
        for (const metrics of this.metrics.values()) {
          filteredMetrics.push(...metrics);
        }
        filteredEvents = [...this.events];
      }

      // Apply date filters
      if (startDate) {
        filteredMetrics = filteredMetrics.filter(m => m.timestamp >= startDate);
        filteredEvents = filteredEvents.filter(e => e.timestamp >= startDate);
      }

      if (endDate) {
        filteredMetrics = filteredMetrics.filter(m => m.timestamp <= endDate);
        filteredEvents = filteredEvents.filter(e => e.timestamp <= endDate);
      }

      const summary = this.generateDataSummary(filteredMetrics, filteredEvents);

      return {
        metrics: filteredMetrics,
        events: filteredEvents,
        summary
      };
    } catch (error) {
      console.error('Error exporting evolution data:', error);
      throw error;
    }
  }

  // Helper methods
  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private calculatePerformanceGrade(metrics: AIModelMetrics): string {
    const compositeScore = this.calculateCompositeScore(metrics);
    
    if (compositeScore >= 90) return 'A+';
    if (compositeScore >= 85) return 'A';
    if (compositeScore >= 80) return 'B+';
    if (compositeScore >= 75) return 'B';
    if (compositeScore >= 70) return 'C+';
    if (compositeScore >= 65) return 'C';
    if (compositeScore >= 60) return 'D';
    return 'F';
  }

  private calculateCompositeScore(metrics: AIModelMetrics): number {
    // Weighted scoring
    const accuracyWeight = 0.3;
    const f1Weight = 0.25;
    const responseTimeWeight = 0.2;
    const costWeight = 0.15;
    const precisionWeight = 0.1;

    const accuracyScore = metrics.accuracy * 100;
    const f1Score = metrics.f1Score * 100;
    const responseTimeScore = Math.max(0, 100 - (metrics.responseTime / 1000) * 10);
    const costScore = Math.max(0, 100 - metrics.cost * 1000);
    const precisionScore = metrics.precision * 100;

    return (
      accuracyScore * accuracyWeight +
      f1Score * f1Weight +
      responseTimeScore * responseTimeWeight +
      costScore * costWeight +
      precisionScore * precisionWeight
    );
  }

  private async checkPerformanceAlerts(metrics: AIModelMetrics): Promise<void> {
    const alerts: string[] = [];

    if (metrics.accuracy < this.performanceThresholds.get('accuracy')!) {
      alerts.push(`Low accuracy: ${(metrics.accuracy * 100).toFixed(1)}%`);
    }

    if (metrics.responseTime > this.performanceThresholds.get('responseTime')!) {
      alerts.push(`High response time: ${metrics.responseTime}ms`);
    }

    if (metrics.cost > this.performanceThresholds.get('cost')!) {
      alerts.push(`High cost per request: $${metrics.cost.toFixed(4)}`);
    }

    if (alerts.length > 0) {
      await this.logEvolutionEvent({
        eventType: 'evaluation',
        modelId: metrics.modelId,
        metadata: {
          alerts,
          alertLevel: 'warning'
        }
      });
    }
  }

  private getLatestMetrics(modelId: string): AIModelMetrics | null {
    const modelMetrics = this.metrics.get(modelId);
    if (!modelMetrics || modelMetrics.length === 0) return null;
    
    return modelMetrics[modelMetrics.length - 1];
  }

  private calculateAverage(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    return numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
  }

  private calculateTrend(
    metrics: AIModelMetrics[],
    field: keyof AIModelMetrics
  ): { direction: 'improving' | 'degrading' | 'stable'; percentage: number } {
    if (metrics.length < 2) {
      return { direction: 'stable', percentage: 0 };
    }

    const values = metrics.map(m => m[field] as number).filter(v => typeof v === 'number');
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));

    const firstAvg = this.calculateAverage(firstHalf);
    const secondAvg = this.calculateAverage(secondHalf);

    const percentageChange = ((secondAvg - firstAvg) / firstAvg) * 100;

    if (Math.abs(percentageChange) < 5) {
      return { direction: 'stable', percentage: Math.abs(percentageChange) };
    }

    return {
      direction: percentageChange > 0 ? 'improving' : 'degrading',
      percentage: Math.abs(percentageChange)
    };
  }

  private getTimeframeDuration(timeframe: AIPerformanceTrend['timeframe']): number {
    const durations = {
      hourly: 60 * 60 * 1000,
      daily: 24 * 60 * 60 * 1000,
      weekly: 7 * 24 * 60 * 60 * 1000,
      monthly: 30 * 24 * 60 * 60 * 1000
    };
    return durations[timeframe];
  }

  private sanitizeInput(input: any): any {
    // Remove sensitive information from input
    if (typeof input === 'object' && input !== null) {
      const sanitized = { ...input };
      delete sanitized.password;
      delete sanitized.apiKey;
      delete sanitized.token;
      return sanitized;
    }
    return input;
  }

  private sanitizeOutput(output: any): any {
    // Remove sensitive information from output
    if (typeof output === 'object' && output !== null) {
      const sanitized = { ...output };
      delete sanitized.internalData;
      return sanitized;
    }
    return output;
  }

  private async updateModelPerformanceFromFeedback(
    modelId: string,
    feedback: any
  ): Promise<void> {
    // This would update model performance metrics based on user feedback
    // For now, we'll just log it
    console.log(`Updating model ${modelId} performance from feedback:`, feedback);
  }

  private generateModelRecommendations(models: any[]): string[] {
    const recommendations: string[] = [];

    if (models.length === 0) return recommendations;

    const bestModel = models[0];
    const worstModel = models[models.length - 1];

    recommendations.push(
      `Best performing model: ${bestModel.modelName} with composite score of ${bestModel.rank}`
    );

    if (models.length > 1) {
      recommendations.push(
        `Consider optimizing ${worstModel.modelName} or replacing it with ${bestModel.modelName}`
      );
    }

    // Add specific recommendations based on metrics
    models.forEach(model => {
      if (model.metrics.responseTime > 2000) {
        recommendations.push(
          `${model.modelName} has high response time - consider optimization`
        );
      }
      
      if (model.metrics.accuracy < 0.8) {
        recommendations.push(
          `${model.modelName} has low accuracy - consider retraining`
        );
      }
    });

    return recommendations;
  }

  private async getModelAlerts(modelId: string): Promise<string[]> {
    const alerts: string[] = [];
    const latestMetrics = this.getLatestMetrics(modelId);

    if (!latestMetrics) return alerts;

    if (latestMetrics.accuracy < 0.7) {
      alerts.push('Critical: Model accuracy below 70%');
    }

    if (latestMetrics.responseTime > 5000) {
      alerts.push('Warning: Response time exceeds 5 seconds');
    }

    return alerts;
  }

  private async getModelRecommendations(modelId: string): Promise<string[]> {
    const recommendations: string[] = [];
    const latestMetrics = this.getLatestMetrics(modelId);

    if (!latestMetrics) return recommendations;

    if (latestMetrics.accuracy < 0.8) {
      recommendations.push('Consider retraining the model with more data');
    }

    if (latestMetrics.responseTime > 2000) {
      recommendations.push('Optimize model for faster inference');
    }

    if (latestMetrics.cost > 0.05) {
      recommendations.push('Consider using a more cost-effective model');
    }

    return recommendations;
  }

  private generateDataSummary(
    metrics: AIModelMetrics[],
    events: AIEvolutionEvent[]
  ): any {
    return {
      totalMetricsRecords: metrics.length,
      totalEvents: events.length,
      dateRange: {
        start: metrics.length > 0 ? metrics[0].timestamp : null,
        end: metrics.length > 0 ? metrics[metrics.length - 1].timestamp : null
      },
      averageAccuracy: this.calculateAverage(metrics.map(m => m.accuracy)),
      averageResponseTime: this.calculateAverage(metrics.map(m => m.responseTime)),
      totalCost: metrics.reduce((sum, m) => sum + m.cost, 0),
      eventTypes: events.reduce((acc, event) => {
        acc[event.eventType] = (acc[event.eventType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };
  }

  private async persistEvent(event: AIEvolutionEvent): Promise<void> {
    // This would persist the event to a database or external storage
    // For now, we'll just log it
    console.log('Persisting evolution event:', event.eventId);
  }

  private cleanupOldData(): void {
    const cutoffDate = new Date(Date.now() - this.retentionPeriod * 24 * 60 * 60 * 1000);

    // Clean up old metrics
    for (const [modelId, metrics] of this.metrics.entries()) {
      const filteredMetrics = metrics.filter(metric => metric.timestamp >= cutoffDate);
      this.metrics.set(modelId, filteredMetrics);
    }

    // Clean up old events
    this.events = this.events.filter(event => event.timestamp >= cutoffDate);

    console.log(`Cleaned up data older than ${this.retentionPeriod} days`);
  }

  // Configuration methods
  setPerformanceThreshold(metric: string, threshold: number): void {
    this.performanceThresholds.set(metric, threshold);
  }

  setRetentionPeriod(days: number): void {
    this.retentionPeriod = days;
  }

  // Status and health methods
  getSystemStatus(): {
    totalModels: number;
    totalMetrics: number;
    totalEvents: number;
    memoryUsage: number;
  } {
    let totalMetrics = 0;
    for (const metrics of this.metrics.values()) {
      totalMetrics += metrics.length;
    }

    return {
      totalModels: this.metrics.size,
      totalMetrics,
      totalEvents: this.events.length,
      memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024 // MB
    };
  }
}