import { NetworkManager } from '../../../frontend/src/utils/network';

export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  template: string;
  variables: {
    name: string;
    type: 'string' | 'number' | 'boolean' | 'array' | 'object';
    description: string;
    required: boolean;
    defaultValue?: any;
  }[];
  metadata: {
    category: string;
    tags: string[];
    version: string;
    author: string;
  };
}

export interface PromptMetrics {
  id: string;
  promptId: string;
  timestamp: Date;
  performance: {
    responseTime: number;
    tokenCount: number;
    cost: number;
  };
  quality: {
    relevance: number;
    coherence: number;
    accuracy: number;
    creativity: number;
  };
  feedback: {
    rating: number;
    comments: string;
    improvements: string[];
  };
}

export interface TuningResult {
  id: string;
  promptId: string;
  timestamp: Date;
  changes: {
    type: 'addition' | 'removal' | 'modification';
    section: string;
    before: string;
    after: string;
    reason: string;
  }[];
  impact: {
    metrics: Partial<PromptMetrics['performance'] & PromptMetrics['quality']>;
    description: string;
  };
}

export class PromptTuner {
  private static instance: PromptTuner;
  private networkManager: NetworkManager;
  private templates: Map<string, PromptTemplate> = new Map();
  private metrics: Map<string, PromptMetrics[]> = new Map();
  private tuningHistory: Map<string, TuningResult[]> = new Map();
  private lastUpdate: Date = new Date();

  private constructor() {
    this.networkManager = NetworkManager.getInstance();
  }

  public static getInstance(): PromptTuner {
    if (!PromptTuner.instance) {
      PromptTuner.instance = new PromptTuner();
    }
    return PromptTuner.instance;
  }

  public async addTemplate(template: PromptTemplate): Promise<void> {
    this.templates.set(template.id, template);
    this.lastUpdate = new Date();

    try {
      await this.networkManager.request({
        method: 'POST',
        url: '/api/prompts/templates',
        data: template,
        cache: false
      });
    } catch (error) {
      console.error('Failed to add prompt template:', error);
      throw error;
    }
  }

  public async updateTemplate(
    templateId: string,
    updates: Partial<PromptTemplate>
  ): Promise<void> {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    Object.assign(template, updates);
    this.lastUpdate = new Date();

    try {
      await this.networkManager.request({
        method: 'PUT',
        url: `/api/prompts/templates/${templateId}`,
        data: updates,
        cache: false
      });
    } catch (error) {
      console.error('Failed to update prompt template:', error);
      throw error;
    }
  }

  public async logMetrics(metrics: PromptMetrics): Promise<void> {
    if (!this.metrics.has(metrics.promptId)) {
      this.metrics.set(metrics.promptId, []);
    }
    this.metrics.get(metrics.promptId)!.push(metrics);
    this.lastUpdate = new Date();

    try {
      await this.networkManager.request({
        method: 'POST',
        url: '/api/prompts/metrics',
        data: metrics,
        cache: false
      });
    } catch (error) {
      console.error('Failed to log prompt metrics:', error);
      throw error;
    }
  }

  public async tunePrompt(
    promptId: string,
    context: {
      targetMetrics?: Partial<PromptMetrics['performance'] & PromptMetrics['quality']>;
      constraints?: Record<string, any>;
    }
  ): Promise<TuningResult> {
    const template = this.templates.get(promptId);
    if (!template) {
      throw new Error(`Template ${promptId} not found`);
    }

    try {
      const response = await this.networkManager.request({
        method: 'POST',
        url: `/api/prompts/${promptId}/tune`,
        data: context,
        cache: false
      });

      const result = response.data as TuningResult;
      if (!this.tuningHistory.has(promptId)) {
        this.tuningHistory.set(promptId, []);
      }
      this.tuningHistory.get(promptId)!.push(result);
      this.lastUpdate = new Date();

      return result;
    } catch (error) {
      console.error('Failed to tune prompt:', error);
      throw error;
    }
  }

  public async analyzePerformance(
    promptId: string,
    timeRange?: { start: Date; end: Date }
  ): Promise<{
    metrics: PromptMetrics[];
    trends: {
      metric: keyof (PromptMetrics['performance'] & PromptMetrics['quality']);
      values: { timestamp: Date; value: number }[];
    }[];
    recommendations: {
      type: string;
      description: string;
      expectedImpact: number;
    }[];
  }> {
    const template = this.templates.get(promptId);
    if (!template) {
      throw new Error(`Template ${promptId} not found`);
    }

    try {
      const response = await this.networkManager.request({
        method: 'GET',
        url: `/api/prompts/${promptId}/analyze`,
        params: timeRange,
        cache: false
      });

      return response.data as {
        metrics: PromptMetrics[];
        trends: {
          metric: keyof (PromptMetrics['performance'] & PromptMetrics['quality']);
          values: { timestamp: Date; value: number }[];
        }[];
        recommendations: {
          type: string;
          description: string;
          expectedImpact: number;
        }[];
      };
    } catch (error) {
      console.error('Failed to analyze prompt performance:', error);
      throw error;
    }
  }

  public getTemplates(): PromptTemplate[] {
    return Array.from(this.templates.values());
  }

  public getMetrics(promptId: string): PromptMetrics[] {
    return this.metrics.get(promptId) || [];
  }

  public getTuningHistory(promptId: string): TuningResult[] {
    return this.tuningHistory.get(promptId) || [];
  }

  public getLastUpdate(): Date {
    return this.lastUpdate;
  }

  public async exportData(): Promise<string> {
    const exportData = {
      templates: Object.fromEntries(this.templates),
      metrics: Object.fromEntries(this.metrics),
      tuningHistory: Object.fromEntries(this.tuningHistory),
      lastUpdate: this.lastUpdate
    };
    return JSON.stringify(exportData, null, 2);
  }

  public async importData(dataJson: string): Promise<void> {
    try {
      const importedData = JSON.parse(dataJson);
      this.templates = new Map(Object.entries(importedData.templates));
      this.metrics = new Map(Object.entries(importedData.metrics));
      this.tuningHistory = new Map(Object.entries(importedData.tuningHistory));
      this.lastUpdate = new Date(importedData.lastUpdate);
    } catch (error) {
      console.error('Failed to import prompt data:', error);
      throw error;
    }
  }
} 