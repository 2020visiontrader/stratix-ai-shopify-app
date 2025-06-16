import { OpenAIClient } from '@/lib/openai';
import { AppError } from '@/utils/errorHandling';

interface PerformanceData {
  views: number;
  sales: number;
  revenue: number;
  conversionRate: number;
  bounceRate: number;
  timeOnPage: number;
}

interface Insight {
  id: string;
  type: 'trend' | 'anomaly' | 'recommendation' | 'opportunity';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  confidence: number;
  data: Record<string, any>;
  createdAt: Date;
}

interface AnalysisResult {
  insights: Insight[];
  summary: string;
  recommendations: string[];
}

export class InsightsEngine {
  private static instance: InsightsEngine;
  private readonly openai: OpenAIClient;

  private constructor() {
    this.openai = OpenAIClient.getInstance();
  }

  public static getInstance(): InsightsEngine {
    if (!InsightsEngine.instance) {
      InsightsEngine.instance = new InsightsEngine();
    }
    return InsightsEngine.instance;
  }

  public async analyzePerformance(
    currentData: PerformanceData,
    historicalData: PerformanceData[]
  ): Promise<AnalysisResult> {
    try {
      // Detect trends
      const trends = await this.detectTrends(historicalData);

      // Identify anomalies
      const anomalies = await this.detectAnomalies(currentData, historicalData);

      // Generate recommendations
      const recommendations = await this.generateRecommendations(
        currentData,
        trends,
        anomalies
      );

      // Create insights
      const insights = await this.createInsights(trends, anomalies, recommendations);

      // Generate summary
      const summary = await this.generateSummary(insights);

      return {
        insights,
        summary,
        recommendations: recommendations.map(r => r.description)
      };
    } catch (error) {
      throw new AppError(
        'Failed to analyze performance',
        500,
        error instanceof Error ? error.message : undefined
      );
    }
  }

  private async detectTrends(
    historicalData: PerformanceData[]
  ): Promise<Array<{ metric: string; trend: 'up' | 'down' | 'stable'; magnitude: number }>> {
    const trends: Array<{ metric: string; trend: 'up' | 'down' | 'stable'; magnitude: number }> = [];
    const metrics = ['views', 'sales', 'revenue', 'conversionRate', 'bounceRate', 'timeOnPage'];

    for (const metric of metrics) {
      const values = historicalData.map(d => d[metric as keyof PerformanceData] as number);
      const trend = this.calculateTrend(values);
      trends.push({
        metric,
        trend: trend.direction,
        magnitude: trend.magnitude
      });
    }

    return trends;
  }

  private calculateTrend(values: number[]): { direction: 'up' | 'down' | 'stable'; magnitude: number } {
    if (values.length < 2) {
      return { direction: 'stable', magnitude: 0 };
    }

    const changes = values.slice(1).map((val, i) => val - values[i]);
    const avgChange = changes.reduce((sum, val) => sum + val, 0) / changes.length;
    const magnitude = Math.abs(avgChange);

    if (magnitude < 0.1) {
      return { direction: 'stable', magnitude };
    }

    return {
      direction: avgChange > 0 ? 'up' : 'down',
      magnitude
    };
  }

  private async detectAnomalies(
    currentData: PerformanceData,
    historicalData: PerformanceData[]
  ): Promise<Array<{ metric: string; value: number; expected: number; deviation: number }>> {
    const anomalies: Array<{ metric: string; value: number; expected: number; deviation: number }> = [];
    const metrics = ['views', 'sales', 'revenue', 'conversionRate', 'bounceRate', 'timeOnPage'];

    for (const metric of metrics) {
      const values = historicalData.map(d => d[metric as keyof PerformanceData] as number);
      const currentValue = currentData[metric as keyof PerformanceData] as number;
      
      const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
      const stdDev = Math.sqrt(
        values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
      );

      const deviation = Math.abs(currentValue - mean) / stdDev;
      if (deviation > 2) { // More than 2 standard deviations
        anomalies.push({
          metric,
          value: currentValue,
          expected: mean,
          deviation
        });
      }
    }

    return anomalies;
  }

  private async generateRecommendations(
    currentData: PerformanceData,
    trends: Array<{ metric: string; trend: 'up' | 'down' | 'stable'; magnitude: number }>,
    anomalies: Array<{ metric: string; value: number; expected: number; deviation: number }>
  ): Promise<Array<{ description: string; impact: 'high' | 'medium' | 'low' }>> {
    const prompt = `
      Based on the following performance data, trends, and anomalies, provide specific recommendations:
      
      Current Performance:
      ${JSON.stringify(currentData, null, 2)}
      
      Trends:
      ${JSON.stringify(trends, null, 2)}
      
      Anomalies:
      ${JSON.stringify(anomalies, null, 2)}
      
      Provide 3-5 specific, actionable recommendations with their expected impact.
    `;

    const response = await this.openai.createCompletion({
      model: 'gpt-4',
      prompt,
      maxTokens: 500,
      temperature: 0.7
    });

    // Parse recommendations from the response
    const recommendations = response
      .split('\n')
      .filter(line => line.trim().startsWith('-'))
      .map(line => {
        const [description, impact] = line.trim().substring(1).split('|').map(s => s.trim());
        return {
          description,
          impact: (impact?.toLowerCase() as 'high' | 'medium' | 'low') || 'medium'
        };
      });

    return recommendations;
  }

  private async createInsights(
    trends: Array<{ metric: string; trend: 'up' | 'down' | 'stable'; magnitude: number }>,
    anomalies: Array<{ metric: string; value: number; expected: number; deviation: number }>,
    recommendations: Array<{ description: string; impact: 'high' | 'medium' | 'low' }>
  ): Promise<Insight[]> {
    const insights: Insight[] = [];

    // Create trend insights
    for (const trend of trends) {
      if (trend.magnitude > 0.2) {
        insights.push({
          id: crypto.randomUUID(),
          type: 'trend',
          title: `${trend.metric} is trending ${trend.trend}`,
          description: `${trend.metric} has shown a ${trend.trend}ward trend with a magnitude of ${trend.magnitude.toFixed(2)}`,
          impact: this.calculateImpact(trend.magnitude),
          confidence: 0.8,
          data: trend,
          createdAt: new Date()
        });
      }
    }

    // Create anomaly insights
    for (const anomaly of anomalies) {
      insights.push({
        id: crypto.randomUUID(),
        type: 'anomaly',
        title: `Unusual ${anomaly.metric} detected`,
        description: `${anomaly.metric} is ${anomaly.deviation.toFixed(1)} standard deviations from expected value`,
        impact: 'high',
        confidence: 0.9,
        data: anomaly,
        createdAt: new Date()
      });
    }

    // Create recommendation insights
    for (const recommendation of recommendations) {
      insights.push({
        id: crypto.randomUUID(),
        type: 'recommendation',
        title: 'Optimization Opportunity',
        description: recommendation.description,
        impact: recommendation.impact,
        confidence: 0.7,
        data: recommendation,
        createdAt: new Date()
      });
    }

    return insights;
  }

  private async generateSummary(insights: Insight[]): Promise<string> {
    const prompt = `
      Create a concise summary of the following insights:
      ${JSON.stringify(insights, null, 2)}
      
      Focus on the most impactful findings and recommendations.
    `;

    return await this.openai.createCompletion({
      model: 'gpt-4',
      prompt,
      maxTokens: 200,
      temperature: 0.7
    });
  }

  private calculateImpact(magnitude: number): 'high' | 'medium' | 'low' {
    if (magnitude > 0.5) return 'high';
    if (magnitude > 0.2) return 'medium';
    return 'low';
  }
}
