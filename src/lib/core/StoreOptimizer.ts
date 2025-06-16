import { NetworkManager } from '../../../frontend/src/utils/network';
import { StoreAnalyzer } from './StoreAnalyzer';

export interface OptimizationStrategy {
  id: string;
  name: string;
  type: 'pricing' | 'inventory' | 'marketing' | 'layout' | 'content';
  target: {
    metric: string;
    goal: 'increase' | 'decrease' | 'maintain';
    value: number;
  };
  conditions: {
    triggers: Record<string, any>;
    constraints: Record<string, any>;
    dependencies: string[];
  };
  actions: {
    type: string;
    parameters: Record<string, any>;
    priority: number;
  }[];
  schedule: {
    start: Date;
    end?: Date;
    frequency: string;
    timezone: string;
  };
  status: 'draft' | 'active' | 'paused' | 'completed' | 'failed';
  performance: {
    impact: number;
    confidence: number;
    lastRun: Date;
    successRate: number;
  };
}

export interface OptimizationResult {
  id: string;
  strategyId: string;
  storeId: string;
  timestamp: Date;
  status: 'success' | 'partial' | 'failure';
  metrics: {
    before: Record<string, number>;
    after: Record<string, number>;
    change: Record<string, number>;
  };
  actions: {
    type: string;
    status: 'success' | 'failure';
    impact: number;
    error?: string;
  }[];
  insights: {
    type: string;
    description: string;
    impact: number;
  }[];
}

export interface OptimizationImpact {
  id: string;
  strategyId: string;
  storeId: string;
  metrics: {
    metric: string;
    before: number;
    after: number;
    change: number;
    confidence: number;
  }[];
  factors: {
    name: string;
    impact: number;
    confidence: number;
  }[];
  recommendations: {
    action: string;
    impact: number;
    effort: number;
  }[];
  timestamp: Date;
}

export class StoreOptimizer {
  private static instance: StoreOptimizer;
  private networkManager: NetworkManager;
  private storeAnalyzer: StoreAnalyzer;
  private strategies: Map<string, OptimizationStrategy> = new Map();
  private results: Map<string, OptimizationResult[]> = new Map();
  private impacts: Map<string, OptimizationImpact[]> = new Map();
  private lastUpdate: Date = new Date();

  private constructor() {
    this.networkManager = NetworkManager.getInstance();
    this.storeAnalyzer = StoreAnalyzer.getInstance();
  }

  public static getInstance(): StoreOptimizer {
    if (!StoreOptimizer.instance) {
      StoreOptimizer.instance = new StoreOptimizer();
    }
    return StoreOptimizer.instance;
  }

  public async addStrategy(strategy: OptimizationStrategy): Promise<void> {
    this.strategies.set(strategy.id, strategy);
    this.lastUpdate = new Date();

    try {
      await this.networkManager.request({
        method: 'POST',
        url: '/api/optimization/strategies',
        data: strategy,
        cache: false
      });
    } catch (error) {
      console.error('Failed to add optimization strategy:', error);
      throw error;
    }
  }

  public async updateStrategy(
    strategyId: string,
    updates: Partial<OptimizationStrategy>
  ): Promise<void> {
    const strategy = this.strategies.get(strategyId);
    if (!strategy) {
      throw new Error(`Strategy ${strategyId} not found`);
    }

    Object.assign(strategy, updates);
    this.lastUpdate = new Date();

    try {
      await this.networkManager.request({
        method: 'PUT',
        url: `/api/optimization/strategies/${strategyId}`,
        data: updates,
        cache: false
      });
    } catch (error) {
      console.error('Failed to update optimization strategy:', error);
      throw error;
    }
  }

  public async executeStrategy(
    strategyId: string,
    storeId: string
  ): Promise<OptimizationResult> {
    const strategy = this.strategies.get(strategyId);
    if (!strategy) {
      throw new Error(`Strategy ${strategyId} not found`);
    }

    try {
      const response = await this.networkManager.request({
        method: 'POST',
        url: `/api/optimization/execute/${strategyId}/${storeId}`,
        data: { strategy },
        cache: false
      });

      const result = response.data as OptimizationResult;

      // Store result
      if (!this.results.has(strategyId)) {
        this.results.set(strategyId, []);
      }
      this.results.get(strategyId)!.push(result);

      // Update strategy performance
      strategy.performance.lastRun = new Date();
      strategy.performance.successRate =
        (strategy.performance.successRate * (strategy.performance.lastRun.getTime() - 1) +
          (result.status === 'success' ? 1 : 0)) /
        strategy.performance.lastRun.getTime();

      this.lastUpdate = new Date();
      return result;
    } catch (error) {
      console.error('Failed to execute optimization strategy:', error);
      throw error;
    }
  }

  public async analyzeImpact(
    strategyId: string,
    storeId: string,
    timeRange?: { start: Date; end: Date }
  ): Promise<OptimizationImpact> {
    const strategy = this.strategies.get(strategyId);
    if (!strategy) {
      throw new Error(`Strategy ${strategyId} not found`);
    }

    try {
      const response = await this.networkManager.request({
        method: 'POST',
        url: `/api/optimization/impact/${strategyId}/${storeId}`,
        data: { timeRange },
        cache: false
      });

      const impact = response.data as OptimizationImpact;

      // Store impact
      if (!this.impacts.has(strategyId)) {
        this.impacts.set(strategyId, []);
      }
      this.impacts.get(strategyId)!.push(impact);

      this.lastUpdate = new Date();
      return impact;
    } catch (error) {
      console.error('Failed to analyze optimization impact:', error);
      throw error;
    }
  }

  public async generateStrategy(
    storeId: string,
    goals: {
      metric: string;
      target: number;
      priority: number;
    }[]
  ): Promise<OptimizationStrategy> {
    try {
      const response = await this.networkManager.request({
        method: 'POST',
        url: `/api/optimization/generate/${storeId}`,
        data: { goals },
        cache: false
      });

      const strategy = response.data as OptimizationStrategy;
      this.strategies.set(strategy.id, strategy);
      this.lastUpdate = new Date();

      return strategy;
    } catch (error) {
      console.error('Failed to generate optimization strategy:', error);
      throw error;
    }
  }

  public getStrategies(): OptimizationStrategy[] {
    return Array.from(this.strategies.values());
  }

  public getResults(strategyId: string): OptimizationResult[] {
    return this.results.get(strategyId) || [];
  }

  public getImpacts(strategyId: string): OptimizationImpact[] {
    return this.impacts.get(strategyId) || [];
  }

  public getLastUpdate(): Date {
    return this.lastUpdate;
  }

  public async exportData(): Promise<string> {
    const exportData = {
      strategies: Object.fromEntries(this.strategies),
      results: Object.fromEntries(this.results),
      impacts: Object.fromEntries(this.impacts),
      lastUpdate: this.lastUpdate
    };
    return JSON.stringify(exportData, null, 2);
  }

  public async importData(dataJson: string): Promise<void> {
    try {
      const importedData = JSON.parse(dataJson);
      this.strategies = new Map(Object.entries(importedData.strategies));
      this.results = new Map(Object.entries(importedData.results));
      this.impacts = new Map(Object.entries(importedData.impacts));
      this.lastUpdate = new Date(importedData.lastUpdate);
    } catch (error) {
      console.error('Failed to import optimization data:', error);
      throw error;
    }
  }
} 