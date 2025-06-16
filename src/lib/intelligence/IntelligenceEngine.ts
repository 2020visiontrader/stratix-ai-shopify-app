import { NetworkManager } from '../../../frontend/src/utils/network';
import { ABTestEngine } from '../core/ABTestEngine';
import { BrandDNAAnalyzer } from '../core/BrandDNAAnalyzer';
import { CrossCampaignLearner } from '../core/CrossCampaignLearner';
import { FeatureManager } from '../core/FeatureManager';
import { FrameworkRouter } from '../core/FrameworkRouter';
import { KnowledgeFeed } from '../core/KnowledgeFeed';
import { ProductLearner } from '../core/ProductLearner';
import { PromptComposer } from '../core/PromptComposer';
import { StoreAnalyzer } from '../core/StoreAnalyzer';
import { StoreOptimizer } from '../core/StoreOptimizer';

interface IntelligenceConfig {
  apiKey: string;
  modelVersion: string;
  maxConcurrentOperations: number;
  cacheEnabled: boolean;
  retryAttempts: number;
}

interface OperationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
  operationId: string;
}

export class IntelligenceEngine {
  private static instance: IntelligenceEngine;
  private networkManager: NetworkManager;
  private brandAnalyzer: BrandDNAAnalyzer;
  private frameworkRouter: FrameworkRouter;
  private campaignLearner: CrossCampaignLearner;
  private knowledgeFeed: KnowledgeFeed;
  private productLearner: ProductLearner;
  private promptComposer: PromptComposer;
  private storeAnalyzer: StoreAnalyzer;
  private storeOptimizer: StoreOptimizer;
  private abTestEngine: ABTestEngine;
  private config: IntelligenceConfig;
  private activeOperations: Map<string, AbortController>;
  private operationQueue: Array<{
    operationId: string;
    type: string;
    params: any;
    resolve: (value: any) => void;
    reject: (reason: any) => void;
  }>;

  private constructor(config: IntelligenceConfig) {
    this.config = config;
    this.networkManager = NetworkManager.getInstance();
    this.brandAnalyzer = BrandDNAAnalyzer.getInstance();
    this.frameworkRouter = FrameworkRouter.getInstance();
    this.campaignLearner = CrossCampaignLearner.getInstance();
    this.knowledgeFeed = KnowledgeFeed.getInstance();
    this.productLearner = ProductLearner.getInstance();
    this.promptComposer = PromptComposer.getInstance();
    this.storeAnalyzer = StoreAnalyzer.getInstance();
    this.storeOptimizer = StoreOptimizer.getInstance();
    this.abTestEngine = ABTestEngine.getInstance();
    this.activeOperations = new Map();
    this.operationQueue = [];
  }

  public static getInstance(config: IntelligenceConfig): IntelligenceEngine {
    if (!IntelligenceEngine.instance) {
      IntelligenceEngine.instance = new IntelligenceEngine(config);
    }
    return IntelligenceEngine.instance;
  }

  public async executeOperation<T>(
    type: string,
    params: any
  ): Promise<OperationResult<T>> {
    const operationId = crypto.randomUUID();
    const controller = new AbortController();
    this.activeOperations.set(operationId, controller);

    try {
      const result = await this.processOperation<T>({ type, data: params });
      return {
        success: true,
        data: result,
        timestamp: Date.now(),
        operationId
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp: Date.now(),
        operationId
      };
    } finally {
      this.activeOperations.delete(operationId);
    }
  }

  private async processOperation<T>(operation: Operation): Promise<T> {
    const featureManager = FeatureManager.getInstance();
    
    // Check if feature is enabled before processing
    if (!await featureManager.isFeatureEnabled(operation.type)) {
      throw new Error(`Feature ${operation.type} is not enabled`);
    }

    const startTime = Date.now();
    let result: T;

    try {
      switch (operation.type) {
        case 'analyzeBrand':
          result = await this.brandAnalyzer.analyze(operation.data) as T;
          break;
        case 'routeFramework':
          result = await this.frameworkRouter.route(operation.data) as T;
          break;
        case 'learnCampaign':
          result = await this.campaignLearner.learn(operation.data) as T;
          break;
        case 'feedKnowledge':
          result = await this.knowledgeFeed.feed(operation.data) as T;
          break;
        case 'learnProduct':
          result = await this.productLearner.learn(operation.data) as T;
          break;
        case 'composePrompt':
          result = await this.promptComposer.compose(operation.data) as T;
          break;
        case 'analyzeStore':
          result = await this.storeAnalyzer.analyze(operation.data) as T;
          break;
        case 'optimizeStore':
          result = await this.storeOptimizer.optimize(operation.data) as T;
          break;
        case 'runABTest':
          result = await this.abTestEngine.runTest(operation.data) as T;
          break;
        default:
          throw new Error(`Unknown operation type: ${operation.type}`);
      }

      const duration = Date.now() - startTime;
      this.recordOperation(operation.type, true, duration);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.recordOperation(operation.type, false, duration);
      throw error;
    }
  }

  private async trackOperationMetrics(
    operationId: string,
    type: string,
    startTime: number
  ): Promise<void> {
    const duration = Date.now() - startTime;
    await this.networkManager.request({
      method: 'POST',
      url: '/api/metrics/operations',
      data: {
        operationId,
        type,
        duration,
        timestamp: Date.now()
      }
    });
  }

  private async trackOperationError(
    operationId: string,
    type: string,
    error: any
  ): Promise<void> {
    await this.networkManager.request({
      method: 'POST',
      url: '/api/metrics/errors',
      data: {
        operationId,
        type,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now()
      }
    });
  }

  public async getOperationMetrics(
    type?: string,
    startTime?: number,
    endTime?: number
  ): Promise<Array<{
    operationId: string;
    type: string;
    duration: number;
    timestamp: number;
  }>> {
    const response = await this.networkManager.request<Array<{
      operationId: string;
      type: string;
      duration: number;
      timestamp: number;
    }>>({
      method: 'GET',
      url: '/api/metrics/operations',
      params: {
        type,
        startTime,
        endTime
      }
    });
    return response.data;
  }

  public async getOperationErrors(
    type?: string,
    startTime?: number,
    endTime?: number
  ): Promise<Array<{
    operationId: string;
    type: string;
    error: string;
    timestamp: number;
  }>> {
    const response = await this.networkManager.request<Array<{
      operationId: string;
      type: string;
      error: string;
      timestamp: number;
    }>>({
      method: 'GET',
      url: '/api/metrics/errors',
      params: {
        type,
        startTime,
        endTime
      }
    });
    return response.data;
  }

  public async getSystemHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    components: Array<{
      name: string;
      status: 'healthy' | 'degraded' | 'unhealthy';
      metrics: {
        responseTime: number;
        errorRate: number;
        throughput: number;
      };
    }>;
  }> {
    const response = await this.networkManager.request<{
      status: 'healthy' | 'degraded' | 'unhealthy';
      components: Array<{
        name: string;
        status: 'healthy' | 'degraded' | 'unhealthy';
        metrics: {
          responseTime: number;
          errorRate: number;
          throughput: number;
        };
      }>;
    }>({
      method: 'GET',
      url: '/api/health'
    });
    return response.data;
  }

  public async getPerformanceMetrics(): Promise<{
    operations: {
      total: number;
      successful: number;
      failed: number;
      averageDuration: number;
    };
    resources: {
      cpu: number;
      memory: number;
      network: {
        requests: number;
        errors: number;
        averageLatency: number;
      };
    };
  }> {
    const response = await this.networkManager.request<{
      operations: {
        total: number;
        successful: number;
        failed: number;
        averageDuration: number;
      };
      resources: {
        cpu: number;
        memory: number;
        network: {
          requests: number;
          errors: number;
          averageLatency: number;
        };
      };
    }>({
      method: 'GET',
      url: '/api/metrics/performance'
    });
    return response.data;
  }

  public async subscribeToEvents(
    callback: (event: {
      type: string;
      data: any;
      timestamp: number;
    }) => void
  ): Promise<() => void> {
    const eventSource = new EventSource('/api/events');
    
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      callback({
        type: data.type,
        data: data.payload,
        timestamp: Date.now()
      });
    };

    eventSource.onerror = (error) => {
      console.error('EventSource error:', error);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }

  public async getActiveOperations(): Promise<Array<{
    operationId: string;
    type: string;
    startTime: number;
    params: any;
  }>> {
    return Array.from(this.activeOperations.entries()).map(([operationId, controller]) => ({
      operationId,
      type: this.getOperationType(operationId),
      startTime: this.getOperationStartTime(operationId),
      params: this.getOperationParams(operationId)
    }));
  }

  private getOperationType(operationId: string): string {
    // Implementation would track operation types
    return 'unknown';
  }

  private getOperationStartTime(operationId: string): number {
    // Implementation would track operation start times
    return Date.now();
  }

  private getOperationParams(operationId: string): any {
    // Implementation would track operation parameters
    return {};
  }

  public cancelOperation(operationId: string): void {
    const controller = this.activeOperations.get(operationId);
    if (controller) {
      controller.abort();
      this.activeOperations.delete(operationId);
    }
  }

  public cancelAllOperations(): void {
    this.activeOperations.forEach(controller => controller.abort());
    this.activeOperations.clear();
  }

  public async exportState(): Promise<string> {
    const state = {
      config: this.config,
      activeOperations: Array.from(this.activeOperations.keys()),
      operationQueue: this.operationQueue.map(op => ({
        operationId: op.operationId,
        type: op.type,
        params: op.params
      }))
    };
    return JSON.stringify(state, null, 2);
  }

  public async importState(state: string): Promise<void> {
    try {
      const parsedState = JSON.parse(state);
      this.config = parsedState.config;
      this.operationQueue = parsedState.operationQueue;
    } catch (error) {
      console.error('Failed to import intelligence engine state:', error);
      throw error;
    }
  }

  public getActiveOperationCount(): number {
    return this.activeOperations.size;
  }

  public getQueuedOperationCount(): number {
    return this.operationQueue.length;
  }

  private recordOperation(
    type: string,
    success: boolean,
    duration: number
  ): void {
    // Implementation would record the operation in the database
  }
} 