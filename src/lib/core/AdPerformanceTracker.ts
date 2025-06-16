import { NetworkManager } from '../../../frontend/src/utils/network';

export interface AdMetrics {
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
  revenue: number;
  ctr: number;
  cpc: number;
  cpa: number;
  roas: number;
  timestamp: Date;
}

export interface AdCampaign {
  id: string;
  name: string;
  platform: 'facebook' | 'google' | 'instagram' | 'tiktok' | 'pinterest';
  status: 'active' | 'paused' | 'completed';
  budget: {
    daily: number;
    total: number;
    spent: number;
  };
  metrics: AdMetrics;
  targeting: {
    audience: string[];
    locations: string[];
    interests: string[];
    demographics: Record<string, any>;
  };
  creatives: {
    id: string;
    type: 'image' | 'video' | 'carousel';
    url: string;
    metrics: AdMetrics;
  }[];
}

export interface PerformanceInsights {
  campaignId: string;
  timestamp: Date;
  metrics: {
    current: AdMetrics;
    previous: AdMetrics;
    change: Record<keyof AdMetrics, number>;
  };
  recommendations: {
    type: 'budget' | 'targeting' | 'creative' | 'bid';
    priority: 'high' | 'medium' | 'low';
    description: string;
    expectedImpact: number;
  }[];
  alerts: {
    type: 'performance' | 'budget' | 'compliance';
    severity: 'critical' | 'warning' | 'info';
    message: string;
    action: string;
  }[];
}

export class AdPerformanceTracker {
  private static instance: AdPerformanceTracker;
  private networkManager: NetworkManager;
  private campaigns: Map<string, AdCampaign> = new Map();
  private insights: Map<string, PerformanceInsights[]> = new Map();
  private lastUpdate: Date = new Date();

  private constructor() {
    this.networkManager = NetworkManager.getInstance();
  }

  public static getInstance(): AdPerformanceTracker {
    if (!AdPerformanceTracker.instance) {
      AdPerformanceTracker.instance = new AdPerformanceTracker();
    }
    return AdPerformanceTracker.instance;
  }

  public async addCampaign(campaign: AdCampaign): Promise<void> {
    this.campaigns.set(campaign.id, campaign);
    try {
      await this.networkManager.request({
        method: 'POST',
        url: '/api/campaigns',
        data: campaign,
        cache: false
      });
    } catch (error) {
      console.error('Failed to add campaign:', error);
      throw error;
    }
  }

  public async updateCampaignMetrics(
    campaignId: string,
    metrics: Partial<AdMetrics>
  ): Promise<void> {
    const campaign = this.campaigns.get(campaignId);
    if (!campaign) {
      throw new Error(`Campaign ${campaignId} not found`);
    }

    Object.assign(campaign.metrics, metrics);
    this.lastUpdate = new Date();

    try {
      await this.networkManager.request({
        method: 'PUT',
        url: `/api/campaigns/${campaignId}/metrics`,
        data: { metrics, timestamp: this.lastUpdate },
        cache: false
      });
    } catch (error) {
      console.error('Failed to update campaign metrics:', error);
      throw error;
    }
  }

  public async updateCreativeMetrics(
    campaignId: string,
    creativeId: string,
    metrics: Partial<AdMetrics>
  ): Promise<void> {
    const campaign = this.campaigns.get(campaignId);
    if (!campaign) {
      throw new Error(`Campaign ${campaignId} not found`);
    }

    const creative = campaign.creatives.find(c => c.id === creativeId);
    if (!creative) {
      throw new Error(`Creative ${creativeId} not found in campaign ${campaignId}`);
    }

    Object.assign(creative.metrics, metrics);
    this.lastUpdate = new Date();

    try {
      await this.networkManager.request({
        method: 'PUT',
        url: `/api/campaigns/${campaignId}/creatives/${creativeId}/metrics`,
        data: { metrics, timestamp: this.lastUpdate },
        cache: false
      });
    } catch (error) {
      console.error('Failed to update creative metrics:', error);
      throw error;
    }
  }

  public async analyzePerformance(campaignId: string): Promise<PerformanceInsights> {
    const campaign = this.campaigns.get(campaignId);
    if (!campaign) {
      throw new Error(`Campaign ${campaignId} not found`);
    }

    try {
      const response = await this.networkManager.request({
        method: 'GET',
        url: `/api/campaigns/${campaignId}/analyze`,
        cache: false
      });

      const insights = response.data as PerformanceInsights;
      if (!this.insights.has(campaignId)) {
        this.insights.set(campaignId, []);
      }
      this.insights.get(campaignId)!.push(insights);

      return insights;
    } catch (error) {
      console.error('Failed to analyze campaign performance:', error);
      throw error;
    }
  }

  public async optimizeCampaign(
    campaignId: string,
    optimizationType: 'budget' | 'targeting' | 'creative' | 'bid'
  ): Promise<void> {
    const campaign = this.campaigns.get(campaignId);
    if (!campaign) {
      throw new Error(`Campaign ${campaignId} not found`);
    }

    try {
      await this.networkManager.request({
        method: 'POST',
        url: `/api/campaigns/${campaignId}/optimize`,
        data: { optimizationType },
        cache: false
      });
    } catch (error) {
      console.error('Failed to optimize campaign:', error);
      throw error;
    }
  }

  public async compareCampaigns(
    campaignIds: string[],
    metrics: (keyof AdMetrics)[]
  ): Promise<Record<string, Record<keyof AdMetrics, number>>> {
    const comparison: Record<string, Record<keyof AdMetrics, number>> = {};

    for (const campaignId of campaignIds) {
      const campaign = this.campaigns.get(campaignId);
      if (!campaign) {
        throw new Error(`Campaign ${campaignId} not found`);
      }

      comparison[campaignId] = metrics.reduce((acc, metric) => {
        acc[metric] = campaign.metrics[metric];
        return acc;
      }, {} as Record<keyof AdMetrics, number>);
    }

    return comparison;
  }

  public getCampaigns(): AdCampaign[] {
    return Array.from(this.campaigns.values());
  }

  public getInsights(campaignId: string): PerformanceInsights[] {
    return this.insights.get(campaignId) || [];
  }

  public getLastUpdate(): Date {
    return this.lastUpdate;
  }

  public async exportData(): Promise<string> {
    const exportData = {
      campaigns: Array.from(this.campaigns.values()),
      insights: Object.fromEntries(this.insights),
      lastUpdate: this.lastUpdate
    };
    return JSON.stringify(exportData, null, 2);
  }

  public async importData(dataJson: string): Promise<void> {
    try {
      const importedData = JSON.parse(dataJson);
      this.campaigns = new Map(
        importedData.campaigns.map((campaign: AdCampaign) => [campaign.id, campaign])
      );
      this.insights = new Map(Object.entries(importedData.insights));
      this.lastUpdate = new Date(importedData.lastUpdate);
    } catch (error) {
      console.error('Failed to import campaign data:', error);
      throw error;
    }
  }
} 