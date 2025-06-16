import { NetworkManager } from '../../../frontend/src/utils/network';

export interface ModelMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  latency: number;
  throughput: number;
  errorRate: number;
  timestamp: Date;
}

export interface ModelVersion {
  id: string;
  version: string;
  type: 'base' | 'fine-tuned' | 'custom';
  metrics: ModelMetrics;
  trainingData: {
    size: number;
    distribution: Record<string, number>;
    quality: number;
  };
  parameters: {
    total: number;
    trainable: number;
    nonTrainable: number;
  };
  performance: {
    trainingTime: number;
    inferenceTime: number;
    memoryUsage: number;
  };
}

export interface EvolutionEvent {
  id: string;
  type: 'training' | 'deployment' | 'rollback' | 'optimization';
  modelId: string;
  timestamp: Date;
  details: {
    previousVersion?: string;
    newVersion?: string;
    changes: Record<string, any>;
    impact: {
      metrics: Partial<ModelMetrics>;
      description: string;
    };
  };
}

export class AIEvolutionLogger {
  private static instance: AIEvolutionLogger;
  private networkManager: NetworkManager;
  private models: Map<string, ModelVersion[]> = new Map();
  private events: EvolutionEvent[] = [];
  private lastUpdate: Date = new Date();

  private constructor() {
    this.networkManager = NetworkManager.getInstance();
  }

  public static getInstance(): AIEvolutionLogger {
    if (!AIEvolutionLogger.instance) {
      AIEvolutionLogger.instance = new AIEvolutionLogger();
    }
    return AIEvolutionLogger.instance;
  }

  public async logModelVersion(
    modelId: string,
    version: ModelVersion
  ): Promise<void> {
    if (!this.models.has(modelId)) {
      this.models.set(modelId, []);
    }
    this.models.get(modelId)!.push(version);
    this.lastUpdate = new Date();

    try {
      await this.networkManager.request({
        method: 'POST',
        url: '/api/models/versions',
        data: { modelId, version },
        cache: false
      });
    } catch (error) {
      console.error('Failed to log model version:', error);
      throw error;
    }
  }

  public async logEvent(event: EvolutionEvent): Promise<void> {
    this.events.push(event);
    this.lastUpdate = new Date();

    try {
      await this.networkManager.request({
        method: 'POST',
        url: '/api/models/events',
        data: event,
        cache: false
      });
    } catch (error) {
      console.error('Failed to log evolution event:', error);
      throw error;
    }
  }

  public async updateMetrics(
    modelId: string,
    version: string,
    metrics: Partial<ModelMetrics>
  ): Promise<void> {
    const modelVersions = this.models.get(modelId);
    if (!modelVersions) {
      throw new Error(`Model ${modelId} not found`);
    }

    const versionIndex = modelVersions.findIndex(v => v.version === version);
    if (versionIndex === -1) {
      throw new Error(`Version ${version} not found for model ${modelId}`);
    }

    Object.assign(modelVersions[versionIndex].metrics, metrics);
    this.lastUpdate = new Date();

    try {
      await this.networkManager.request({
        method: 'PUT',
        url: `/api/models/${modelId}/versions/${version}/metrics`,
        data: { metrics, timestamp: this.lastUpdate },
        cache: false
      });
    } catch (error) {
      console.error('Failed to update model metrics:', error);
      throw error;
    }
  }

  public async analyzeEvolution(
    modelId: string,
    timeRange?: { start: Date; end: Date }
  ): Promise<{
    versions: ModelVersion[];
    events: EvolutionEvent[];
    trends: {
      metric: keyof ModelMetrics;
      values: { timestamp: Date; value: number }[];
    }[];
  }> {
    const modelVersions = this.models.get(modelId);
    if (!modelVersions) {
      throw new Error(`Model ${modelId} not found`);
    }

    try {
      const response = await this.networkManager.request({
        method: 'GET',
        url: `/api/models/${modelId}/evolution`,
        params: timeRange,
        cache: false
      });

      return response.data as {
        versions: ModelVersion[];
        events: EvolutionEvent[];
        trends: {
          metric: keyof ModelMetrics;
          values: { timestamp: Date; value: number }[];
        }[];
      };
    } catch (error) {
      console.error('Failed to analyze model evolution:', error);
      throw error;
    }
  }

  public async compareVersions(
    modelId: string,
    versions: string[]
  ): Promise<Record<string, ModelMetrics>> {
    const modelVersions = this.models.get(modelId);
    if (!modelVersions) {
      throw new Error(`Model ${modelId} not found`);
    }

    const comparison: Record<string, ModelMetrics> = {};
    for (const version of versions) {
      const versionData = modelVersions.find(v => v.version === version);
      if (!versionData) {
        throw new Error(`Version ${version} not found for model ${modelId}`);
      }
      comparison[version] = versionData.metrics;
    }

    return comparison;
  }

  public getModelVersions(modelId: string): ModelVersion[] {
    return this.models.get(modelId) || [];
  }

  public getEvents(): EvolutionEvent[] {
    return this.events;
  }

  public getLastUpdate(): Date {
    return this.lastUpdate;
  }

  public async exportData(): Promise<string> {
    const exportData = {
      models: Object.fromEntries(this.models),
      events: this.events,
      lastUpdate: this.lastUpdate
    };
    return JSON.stringify(exportData, null, 2);
  }

  public async importData(dataJson: string): Promise<void> {
    try {
      const importedData = JSON.parse(dataJson);
      this.models = new Map(Object.entries(importedData.models));
      this.events = importedData.events;
      this.lastUpdate = new Date(importedData.lastUpdate);
    } catch (error) {
      console.error('Failed to import evolution data:', error);
      throw error;
    }
  }
} 