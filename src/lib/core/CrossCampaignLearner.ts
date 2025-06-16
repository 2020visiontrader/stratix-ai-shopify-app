import { NetworkManager } from '../../../frontend/src/utils/network';

interface CampaignData {
  id: string;
  name: string;
  type: string;
  metrics: {
    impressions: number;
    clicks: number;
    conversions: number;
    revenue: number;
  };
  settings: {
    target: string;
    budget: number;
    duration: number;
  };
  metadata: {
    created: number;
    updated: number;
    status: 'active' | 'paused' | 'completed';
  };
}

interface LearningResult {
  campaignId: string;
  timestamp: number;
  insights: {
    performance: {
      score: number;
      trend: number;
      factors: string[];
    };
    recommendations: {
      budget: {
        current: number;
        suggested: number;
        impact: number;
      };
      targeting: {
        current: string[];
        suggested: string[];
        impact: number;
      };
      timing: {
        current: number;
        suggested: number;
        impact: number;
      };
    };
  };
}

export class CrossCampaignLearner {
  private static instance: CrossCampaignLearner;
  private networkManager: NetworkManager;
  private campaigns: Map<string, CampaignData>;
  private results: Map<string, LearningResult>;
  private lastUpdate: number;

  private constructor() {
    this.networkManager = NetworkManager.getInstance();
    this.campaigns = new Map();
    this.results = new Map();
    this.lastUpdate = Date.now();
  }

  public static getInstance(): CrossCampaignLearner {
    if (!CrossCampaignLearner.instance) {
      CrossCampaignLearner.instance = new CrossCampaignLearner();
    }
    return CrossCampaignLearner.instance;
  }

  public async learn(campaignId: string): Promise<LearningResult> {
    const campaign = this.campaigns.get(campaignId);
    if (!campaign) {
      throw new Error(`Campaign not found: ${campaignId}`);
    }

    try {
      // Fetch campaign data
      const campaignData = await this.fetchCampaignData(campaignId);
      this.campaigns.set(campaignId, campaignData);

      // Generate learning results
      const result = await this.generateLearningResult(campaignId, campaignData);
      this.results.set(campaignId, result);

      this.lastUpdate = Date.now();
      return result;
    } catch (error) {
      console.error(`Error learning from campaign ${campaignId}:`, error);
      throw error;
    }
  }

  private async fetchCampaignData(campaignId: string): Promise<CampaignData> {
    const response = await this.networkManager.request<CampaignData>({
      method: 'GET',
      url: `/api/campaigns/${campaignId}`
    });
    return response.data;
  }

  private async generateLearningResult(
    campaignId: string,
    campaign: CampaignData
  ): Promise<LearningResult> {
    const response = await this.networkManager.request<LearningResult>({
      method: 'POST',
      url: `/api/campaigns/${campaignId}/learn`,
      data: campaign
    });
    return response.data;
  }

  public async addCampaign(campaign: CampaignData): Promise<CampaignData> {
    this.validateCampaign(campaign);

    const newCampaign: CampaignData = {
      ...campaign,
      metadata: {
        ...campaign.metadata,
        created: Date.now(),
        updated: Date.now(),
        status: 'active'
      }
    };

    this.campaigns.set(newCampaign.id, newCampaign);
    this.lastUpdate = Date.now();
    return newCampaign;
  }

  private validateCampaign(campaign: CampaignData): void {
    if (!campaign.id || !campaign.name || !campaign.type) {
      throw new Error('Invalid campaign configuration');
    }

    if (!campaign.metrics || !campaign.settings) {
      throw new Error('Campaign must include metrics and settings');
    }
  }

  public async updateCampaign(
    campaignId: string,
    updates: Partial<CampaignData>
  ): Promise<CampaignData> {
    const campaign = this.campaigns.get(campaignId);
    if (!campaign) {
      throw new Error(`Campaign not found: ${campaignId}`);
    }

    const updatedCampaign: CampaignData = {
      ...campaign,
      ...updates,
      metadata: {
        ...campaign.metadata,
        updated: Date.now()
      }
    };

    this.validateCampaign(updatedCampaign);
    this.campaigns.set(campaignId, updatedCampaign);
    this.lastUpdate = Date.now();
    return updatedCampaign;
  }

  public async getCampaign(campaignId: string): Promise<CampaignData | undefined> {
    return this.campaigns.get(campaignId);
  }

  public async getAllCampaigns(): Promise<CampaignData[]> {
    return Array.from(this.campaigns.values());
  }

  public async getLearningResult(
    campaignId: string
  ): Promise<LearningResult | undefined> {
    return this.results.get(campaignId);
  }

  public async compareCampaigns(
    campaignIds: string[]
  ): Promise<Array<{
    campaignId: string;
    data: CampaignData;
    result: LearningResult;
  }>> {
    const comparisons = await Promise.all(
      campaignIds.map(async campaignId => {
        const data = await this.fetchCampaignData(campaignId);
        const result = await this.generateLearningResult(campaignId, data);
        return {
          campaignId,
          data,
          result
        };
      })
    );
    return comparisons;
  }

  public async predictPerformance(
    campaignId: string,
    changes: Partial<CampaignData>
  ): Promise<{
    predicted: {
      impressions: number;
      clicks: number;
      conversions: number;
      revenue: number;
    };
    confidence: number;
  }> {
    const response = await this.networkManager.request<{
      predicted: {
        impressions: number;
        clicks: number;
        conversions: number;
        revenue: number;
      };
      confidence: number;
    }>({
      method: 'POST',
      url: `/api/campaigns/${campaignId}/predict`,
      data: changes
    });
    return response.data;
  }

  public async exportData(): Promise<string> {
    const data = {
      campaigns: Array.from(this.campaigns.values()),
      results: Array.from(this.results.values()),
      lastUpdate: this.lastUpdate
    };
    return JSON.stringify(data, null, 2);
  }

  public async importData(data: string): Promise<void> {
    try {
      const parsedData = JSON.parse(data);
      this.campaigns = new Map(
        parsedData.campaigns.map((c: CampaignData) => [c.id, c])
      );
      this.results = new Map(
        parsedData.results.map((r: LearningResult) => [r.campaignId, r])
      );
      this.lastUpdate = parsedData.lastUpdate;
    } catch (error) {
      console.error('Failed to import campaign learner data:', error);
      throw error;
    }
  }

  public getLastUpdate(): number {
    return this.lastUpdate;
  }

  public getCampaignCount(): number {
    return this.campaigns.size;
  }

  public getResultCount(): number {
    return this.results.size;
  }
} 