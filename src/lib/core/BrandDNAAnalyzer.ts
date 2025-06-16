import { NetworkManager } from '../../../frontend/src/utils/network';
import { BrandDNA } from './BrandDNA';

export interface BrandInsight {
  id: string;
  type: 'voice' | 'visual' | 'value' | 'audience' | 'competitor';
  category: string;
  description: string;
  impact: {
    score: number;
    areas: string[];
    metrics: Record<string, number>;
  };
  recommendations: {
    action: string;
    priority: 'high' | 'medium' | 'low';
    expectedOutcome: string;
  }[];
  timestamp: Date;
}

export interface BrandAnalysis {
  id: string;
  brandId: string;
  timestamp: Date;
  overview: {
    strength: number;
    consistency: number;
    uniqueness: number;
    marketFit: number;
  };
  insights: BrandInsight[];
  trends: {
    metric: string;
    values: { timestamp: Date; value: number }[];
  }[];
  opportunities: {
    area: string;
    potential: number;
    effort: number;
    description: string;
  }[];
}

export interface BrandMetrics {
  id: string;
  brandId: string;
  timestamp: Date;
  performance: {
    awareness: number;
    recognition: number;
    loyalty: number;
    advocacy: number;
  };
  engagement: {
    reach: number;
    interaction: number;
    sentiment: number;
    conversion: number;
  };
  consistency: {
    voice: number;
    visual: number;
    message: number;
    experience: number;
  };
}

export class BrandDNAAnalyzer {
  private static instance: BrandDNAAnalyzer;
  private networkManager: NetworkManager;
  private brandDNA: BrandDNA;
  private analyses: Map<string, BrandAnalysis[]> = new Map();
  private metrics: Map<string, BrandMetrics[]> = new Map();
  private insights: Map<string, BrandInsight[]> = new Map();
  private lastUpdate: Date = new Date();

  private constructor() {
    this.networkManager = NetworkManager.getInstance();
    this.brandDNA = BrandDNA.getInstance();
  }

  public static getInstance(): BrandDNAAnalyzer {
    if (!BrandDNAAnalyzer.instance) {
      BrandDNAAnalyzer.instance = new BrandDNAAnalyzer();
    }
    return BrandDNAAnalyzer.instance;
  }

  public async analyzeBrand(
    brandId: string,
    context?: {
      timeRange?: { start: Date; end: Date };
      focus?: string[];
      depth?: 'basic' | 'detailed' | 'comprehensive';
    }
  ): Promise<BrandAnalysis> {
    try {
      const response = await this.networkManager.request({
        method: 'POST',
        url: `/api/brand/${brandId}/analyze`,
        data: context,
        cache: false
      });

      const analysis = response.data as BrandAnalysis;
      if (!this.analyses.has(brandId)) {
        this.analyses.set(brandId, []);
      }
      this.analyses.get(brandId)!.push(analysis);
      this.lastUpdate = new Date();

      return analysis;
    } catch (error) {
      console.error('Failed to analyze brand:', error);
      throw error;
    }
  }

  public async generateInsights(
    brandId: string,
    type?: BrandInsight['type']
  ): Promise<BrandInsight[]> {
    try {
      const response = await this.networkManager.request({
        method: 'POST',
        url: `/api/brand/${brandId}/insights`,
        data: { type },
        cache: false
      });

      const insights = response.data as BrandInsight[];
      if (!this.insights.has(brandId)) {
        this.insights.set(brandId, []);
      }
      this.insights.get(brandId)!.push(...insights);
      this.lastUpdate = new Date();

      return insights;
    } catch (error) {
      console.error('Failed to generate brand insights:', error);
      throw error;
    }
  }

  public async trackMetrics(metrics: BrandMetrics): Promise<void> {
    if (!this.metrics.has(metrics.brandId)) {
      this.metrics.set(metrics.brandId, []);
    }
    this.metrics.get(metrics.brandId)!.push(metrics);
    this.lastUpdate = new Date();

    try {
      await this.networkManager.request({
        method: 'POST',
        url: '/api/brand/metrics',
        data: metrics,
        cache: false
      });
    } catch (error) {
      console.error('Failed to track brand metrics:', error);
      throw error;
    }
  }

  public async compareBrands(
    brandIds: string[],
    metrics: (keyof BrandMetrics['performance'] | keyof BrandMetrics['engagement'] | keyof BrandMetrics['consistency'])[]
  ): Promise<Record<string, Record<string, number>>> {
    try {
      const response = await this.networkManager.request({
        method: 'POST',
        url: '/api/brand/compare',
        data: { brandIds, metrics },
        cache: false
      });

      return response.data as Record<string, Record<string, number>>;
    } catch (error) {
      console.error('Failed to compare brands:', error);
      throw error;
    }
  }

  public async predictTrends(
    brandId: string,
    timeRange: { start: Date; end: Date }
  ): Promise<{
    trends: {
      metric: string;
      values: { timestamp: Date; value: number }[];
      confidence: number;
    }[];
    opportunities: {
      area: string;
      potential: number;
      timeframe: string;
      description: string;
    }[];
  }> {
    try {
      const response = await this.networkManager.request({
        method: 'POST',
        url: `/api/brand/${brandId}/predict`,
        data: { timeRange },
        cache: false
      });

      return response.data as {
        trends: {
          metric: string;
          values: { timestamp: Date; value: number }[];
          confidence: number;
        }[];
        opportunities: {
          area: string;
          potential: number;
          timeframe: string;
          description: string;
        }[];
      };
    } catch (error) {
      console.error('Failed to predict brand trends:', error);
      throw error;
    }
  }

  public getAnalyses(brandId: string): BrandAnalysis[] {
    return this.analyses.get(brandId) || [];
  }

  public getInsights(brandId: string): BrandInsight[] {
    return this.insights.get(brandId) || [];
  }

  public getMetrics(brandId: string): BrandMetrics[] {
    return this.metrics.get(brandId) || [];
  }

  public getLastUpdate(): Date {
    return this.lastUpdate;
  }

  public async exportData(): Promise<string> {
    const exportData = {
      analyses: Object.fromEntries(this.analyses),
      insights: Object.fromEntries(this.insights),
      metrics: Object.fromEntries(this.metrics),
      lastUpdate: this.lastUpdate
    };
    return JSON.stringify(exportData, null, 2);
  }

  public async importData(dataJson: string): Promise<void> {
    try {
      const importedData = JSON.parse(dataJson);
      this.analyses = new Map(Object.entries(importedData.analyses));
      this.insights = new Map(Object.entries(importedData.insights));
      this.metrics = new Map(Object.entries(importedData.metrics));
      this.lastUpdate = new Date(importedData.lastUpdate);
    } catch (error) {
      console.error('Failed to import brand analysis data:', error);
      throw error;
    }
  }
} 