import { NetworkManager } from '../../../frontend/src/utils/network';

export interface PromptTemplate {
  id: string;
  name: string;
  type: 'product' | 'campaign' | 'content' | 'customer' | 'analysis';
  version: string;
  content: {
    system: string;
    user: string;
    assistant: string;
    examples: {
      input: string;
      output: string;
    }[];
  };
  metadata: {
    description: string;
    tags: string[];
    parameters: {
      name: string;
      type: string;
      description: string;
      required: boolean;
      default?: any;
    }[];
    constraints: {
      maxLength?: number;
      minLength?: number;
      format?: string;
      validation?: string;
    };
  };
  performance: {
    successRate: number;
    averageResponseTime: number;
    usageCount: number;
    lastUsed: Date;
  };
}

export interface PromptResult {
  id: string;
  templateId: string;
  input: Record<string, any>;
  output: string;
  metadata: {
    tokens: number;
    processingTime: number;
    confidence: number;
    model: string;
  };
  status: 'success' | 'failure' | 'partial';
  error?: string;
  timestamp: Date;
}

export interface PromptAnalysis {
  id: string;
  templateId: string;
  metrics: {
    clarity: number;
    relevance: number;
    effectiveness: number;
    consistency: number;
  };
  suggestions: {
    type: string;
    description: string;
    impact: number;
  }[];
  timestamp: Date;
}

export class PromptComposer {
  private static instance: PromptComposer;
  private networkManager: NetworkManager;
  private templates: Map<string, PromptTemplate> = new Map();
  private results: Map<string, PromptResult[]> = new Map();
  private analyses: Map<string, PromptAnalysis[]> = new Map();
  private lastUpdate: Date = new Date();

  private constructor() {
    this.networkManager = NetworkManager.getInstance();
  }

  public static getInstance(): PromptComposer {
    if (!PromptComposer.instance) {
      PromptComposer.instance = new PromptComposer();
    }
    return PromptComposer.instance;
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

  public async composePrompt(
    templateId: string,
    parameters: Record<string, any>
  ): Promise<PromptResult> {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    try {
      const response = await this.networkManager.request({
        method: 'POST',
        url: `/api/prompts/compose/${templateId}`,
        data: { parameters },
        cache: false
      });

      const result = response.data as PromptResult;

      // Store result
      if (!this.results.has(templateId)) {
        this.results.set(templateId, []);
      }
      this.results.get(templateId)!.push(result);

      // Update template performance
      template.performance.usageCount++;
      template.performance.lastUsed = new Date();

      this.lastUpdate = new Date();
      return result;
    } catch (error) {
      console.error('Failed to compose prompt:', error);
      throw error;
    }
  }

  public async analyzePrompt(
    templateId: string,
    resultId: string
  ): Promise<PromptAnalysis> {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    const result = this.results.get(templateId)?.find(r => r.id === resultId);
    if (!result) {
      throw new Error(`Result ${resultId} not found`);
    }

    try {
      const response = await this.networkManager.request({
        method: 'POST',
        url: `/api/prompts/analyze/${templateId}/${resultId}`,
        cache: false
      });

      const analysis = response.data as PromptAnalysis;

      // Store analysis
      if (!this.analyses.has(templateId)) {
        this.analyses.set(templateId, []);
      }
      this.analyses.get(templateId)!.push(analysis);

      this.lastUpdate = new Date();
      return analysis;
    } catch (error) {
      console.error('Failed to analyze prompt:', error);
      throw error;
    }
  }

  public async optimizeTemplate(
    templateId: string,
    optimizationGoals: {
      metric: keyof PromptTemplate['performance'];
      target: number;
      priority: number;
    }[]
  ): Promise<{
    changes: Partial<PromptTemplate>;
    expectedImpact: number;
    confidence: number;
  }> {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    try {
      const response = await this.networkManager.request({
        method: 'POST',
        url: `/api/prompts/optimize/${templateId}`,
        data: { optimizationGoals },
        cache: false
      });

      return response.data as {
        changes: Partial<PromptTemplate>;
        expectedImpact: number;
        confidence: number;
      };
    } catch (error) {
      console.error('Failed to optimize template:', error);
      throw error;
    }
  }

  public async validateParameters(
    templateId: string,
    parameters: Record<string, any>
  ): Promise<{
    valid: boolean;
    errors: {
      parameter: string;
      message: string;
    }[];
  }> {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    try {
      const response = await this.networkManager.request({
        method: 'POST',
        url: `/api/prompts/validate/${templateId}`,
        data: { parameters },
        cache: false
      });

      return response.data as {
        valid: boolean;
        errors: {
          parameter: string;
          message: string;
        }[];
      };
    } catch (error) {
      console.error('Failed to validate parameters:', error);
      throw error;
    }
  }

  public getTemplate(templateId: string): PromptTemplate | undefined {
    return this.templates.get(templateId);
  }

  public getResults(templateId: string): PromptResult[] {
    return this.results.get(templateId) || [];
  }

  public getAnalyses(templateId: string): PromptAnalysis[] {
    return this.analyses.get(templateId) || [];
  }

  public getLastUpdate(): Date {
    return this.lastUpdate;
  }

  public async exportData(): Promise<string> {
    const exportData = {
      templates: Object.fromEntries(this.templates),
      results: Object.fromEntries(this.results),
      analyses: Object.fromEntries(this.analyses),
      lastUpdate: this.lastUpdate
    };
    return JSON.stringify(exportData, null, 2);
  }

  public async importData(dataJson: string): Promise<void> {
    try {
      const importedData = JSON.parse(dataJson);
      this.templates = new Map(Object.entries(importedData.templates));
      this.results = new Map(Object.entries(importedData.results));
      this.analyses = new Map(Object.entries(importedData.analyses));
      this.lastUpdate = new Date(importedData.lastUpdate);
    } catch (error) {
      console.error('Failed to import prompt data:', error);
      throw error;
    }
  }
} 