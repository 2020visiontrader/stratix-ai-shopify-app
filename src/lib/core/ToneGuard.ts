import { NetworkManager } from '../../../frontend/src/utils/network';

export interface ToneProfile {
  id: string;
  name: string;
  description: string;
  characteristics: {
    formality: number;
    enthusiasm: number;
    professionalism: number;
    friendliness: number;
    authority: number;
  };
  rules: {
    type: 'inclusion' | 'exclusion' | 'preference';
    pattern: string;
    description: string;
    examples: string[];
  }[];
  examples: {
    good: string[];
    bad: string[];
  };
}

export interface ToneAnalysis {
  id: string;
  contentId: string;
  timestamp: Date;
  profile: string;
  scores: {
    formality: number;
    enthusiasm: number;
    professionalism: number;
    friendliness: number;
    authority: number;
  };
  matches: {
    rule: string;
    type: 'inclusion' | 'exclusion' | 'preference';
    matches: {
      text: string;
      context: string;
      score: number;
    }[];
  }[];
  suggestions: {
    type: 'addition' | 'removal' | 'modification';
    original: string;
    suggested: string;
    reason: string;
  }[];
}

export interface ToneMetrics {
  id: string;
  profileId: string;
  timestamp: Date;
  usage: {
    totalContent: number;
    compliantContent: number;
    averageScore: number;
  };
  trends: {
    characteristic: keyof ToneProfile['characteristics'];
    values: { timestamp: Date; value: number }[];
  }[];
}

export class ToneGuard {
  private static instance: ToneGuard;
  private networkManager: NetworkManager;
  private profiles: Map<string, ToneProfile> = new Map();
  private analyses: Map<string, ToneAnalysis[]> = new Map();
  private metrics: Map<string, ToneMetrics[]> = new Map();
  private lastUpdate: Date = new Date();

  private constructor() {
    this.networkManager = NetworkManager.getInstance();
  }

  public static getInstance(): ToneGuard {
    if (!ToneGuard.instance) {
      ToneGuard.instance = new ToneGuard();
    }
    return ToneGuard.instance;
  }

  public async addProfile(profile: ToneProfile): Promise<void> {
    this.profiles.set(profile.id, profile);
    this.lastUpdate = new Date();

    try {
      await this.networkManager.request({
        method: 'POST',
        url: '/api/tone/profiles',
        data: profile,
        cache: false
      });
    } catch (error) {
      console.error('Failed to add tone profile:', error);
      throw error;
    }
  }

  public async updateProfile(
    profileId: string,
    updates: Partial<ToneProfile>
  ): Promise<void> {
    const profile = this.profiles.get(profileId);
    if (!profile) {
      throw new Error(`Profile ${profileId} not found`);
    }

    Object.assign(profile, updates);
    this.lastUpdate = new Date();

    try {
      await this.networkManager.request({
        method: 'PUT',
        url: `/api/tone/profiles/${profileId}`,
        data: updates,
        cache: false
      });
    } catch (error) {
      console.error('Failed to update tone profile:', error);
      throw error;
    }
  }

  public async analyzeContent(
    content: string,
    profileId: string
  ): Promise<ToneAnalysis> {
    const profile = this.profiles.get(profileId);
    if (!profile) {
      throw new Error(`Profile ${profileId} not found`);
    }

    try {
      const response = await this.networkManager.request({
        method: 'POST',
        url: '/api/tone/analyze',
        data: { content, profileId },
        cache: false
      });

      const analysis = response.data as ToneAnalysis;
      if (!this.analyses.has(profileId)) {
        this.analyses.set(profileId, []);
      }
      this.analyses.get(profileId)!.push(analysis);
      this.lastUpdate = new Date();

      return analysis;
    } catch (error) {
      console.error('Failed to analyze content tone:', error);
      throw error;
    }
  }

  public async suggestImprovements(
    content: string,
    profileId: string
  ): Promise<{
    suggestions: ToneAnalysis['suggestions'];
    expectedImpact: {
      scores: Partial<ToneProfile['characteristics']>;
      description: string;
    };
  }> {
    const profile = this.profiles.get(profileId);
    if (!profile) {
      throw new Error(`Profile ${profileId} not found`);
    }

    try {
      const response = await this.networkManager.request({
        method: 'POST',
        url: `/api/tone/suggestions`,
        data: { content, profileId },
        cache: false
      });

      return response.data as {
        suggestions: ToneAnalysis['suggestions'];
        expectedImpact: {
          scores: Partial<ToneProfile['characteristics']>;
          description: string;
        };
      };
    } catch (error) {
      console.error('Failed to get tone suggestions:', error);
      throw error;
    }
  }

  public async logMetrics(metrics: ToneMetrics): Promise<void> {
    if (!this.metrics.has(metrics.profileId)) {
      this.metrics.set(metrics.profileId, []);
    }
    this.metrics.get(metrics.profileId)!.push(metrics);
    this.lastUpdate = new Date();

    try {
      await this.networkManager.request({
        method: 'POST',
        url: '/api/tone/metrics',
        data: metrics,
        cache: false
      });
    } catch (error) {
      console.error('Failed to log tone metrics:', error);
      throw error;
    }
  }

  public async analyzeTrends(
    profileId: string,
    timeRange?: { start: Date; end: Date }
  ): Promise<{
    metrics: ToneMetrics[];
    trends: {
      characteristic: keyof ToneProfile['characteristics'];
      values: { timestamp: Date; value: number }[];
    }[];
    insights: {
      type: string;
      description: string;
      impact: number;
    }[];
  }> {
    const profile = this.profiles.get(profileId);
    if (!profile) {
      throw new Error(`Profile ${profileId} not found`);
    }

    try {
      const response = await this.networkManager.request({
        method: 'GET',
        url: `/api/tone/${profileId}/trends`,
        params: timeRange,
        cache: false
      });

      return response.data as {
        metrics: ToneMetrics[];
        trends: {
          characteristic: keyof ToneProfile['characteristics'];
          values: { timestamp: Date; value: number }[];
        }[];
        insights: {
          type: string;
          description: string;
          impact: number;
        }[];
      };
    } catch (error) {
      console.error('Failed to analyze tone trends:', error);
      throw error;
    }
  }

  public getProfiles(): ToneProfile[] {
    return Array.from(this.profiles.values());
  }

  public getAnalyses(profileId: string): ToneAnalysis[] {
    return this.analyses.get(profileId) || [];
  }

  public getMetrics(profileId: string): ToneMetrics[] {
    return this.metrics.get(profileId) || [];
  }

  public getLastUpdate(): Date {
    return this.lastUpdate;
  }

  public async exportData(): Promise<string> {
    const exportData = {
      profiles: Object.fromEntries(this.profiles),
      analyses: Object.fromEntries(this.analyses),
      metrics: Object.fromEntries(this.metrics),
      lastUpdate: this.lastUpdate
    };
    return JSON.stringify(exportData, null, 2);
  }

  public async importData(dataJson: string): Promise<void> {
    try {
      const importedData = JSON.parse(dataJson);
      this.profiles = new Map(Object.entries(importedData.profiles));
      this.analyses = new Map(Object.entries(importedData.analyses));
      this.metrics = new Map(Object.entries(importedData.metrics));
      this.lastUpdate = new Date(importedData.lastUpdate);
    } catch (error) {
      console.error('Failed to import tone data:', error);
      throw error;
    }
  }
} 