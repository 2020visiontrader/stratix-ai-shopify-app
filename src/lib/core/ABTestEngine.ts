import { NetworkManager } from '@/lib/core/NetworkManager';
import { ManagerState, TestAnalysis, TestConfig, TestMetrics, TestResult } from './CoreTypes';

export class ABTestEngine {
  private static instance: ABTestEngine;
  private networkManager: NetworkManager;
  private tests: Map<string, TestConfig> = new Map();
  private results: Map<string, TestResult> = new Map();
  private activeTests: Set<string> = new Set();
  private state: ManagerState = {
    lastUpdate: new Date(),
    version: '1.0.0',
    status: 'active'
  };

  private constructor() {
    this.networkManager = NetworkManager.getInstance();
  }

  public static getInstance(): ABTestEngine {
    if (!ABTestEngine.instance) {
      ABTestEngine.instance = new ABTestEngine();
    }
    return ABTestEngine.instance;
  }

  public async createTest(config: TestConfig): Promise<void> {
    this.tests.set(config.id, config);
    try {
      await this.networkManager.request({
        method: 'POST',
        url: '/api/tests',
        data: config,
        cache: false
      });
    } catch (error) {
      console.error('Failed to create test:', error);
      throw error;
    }
  }

  public async updateTest(testId: string, updates: Partial<TestConfig>): Promise<void> {
    const test = this.tests.get(testId);
    if (!test) {
      throw new Error(`Test ${testId} not found`);
    }

    const updatedTest = { ...test, ...updates };
    this.tests.set(testId, updatedTest);

    try {
      await this.networkManager.request({
        method: 'PUT',
        url: `/api/tests/${testId}`,
        data: updatedTest,
        cache: false
      });
    } catch (error) {
      console.error('Failed to update test:', error);
      throw error;
    }
  }

  public async startTest(testId: string): Promise<void> {
    const test = this.tests.get(testId);
    if (!test) {
      throw new Error(`Test ${testId} not found`);
    }

    if (test.status !== 'draft') {
      throw new Error(`Test ${testId} is not in draft status`);
    }

    test.status = 'running';
    this.activeTests.add(testId);

    try {
      await this.networkManager.request({
        method: 'POST',
        url: `/api/tests/${testId}/start`,
        data: { startDate: new Date().toISOString() },
        cache: false
      });
    } catch (error) {
      console.error('Failed to start test:', error);
      throw error;
    }
  }

  public async pauseTest(testId: string): Promise<void> {
    const test = this.tests.get(testId);
    if (!test) {
      throw new Error(`Test ${testId} not found`);
    }

    if (test.status !== 'running') {
      throw new Error(`Test ${testId} is not running`);
    }

    test.status = 'paused';
    this.activeTests.delete(testId);

    try {
      await this.networkManager.request({
        method: 'POST',
        url: `/api/tests/${testId}/pause`,
        cache: false
      });
    } catch (error) {
      console.error('Failed to pause test:', error);
      throw error;
    }
  }

  public async completeTest(testId: string): Promise<TestResult> {
    const test = this.tests.get(testId);
    if (!test) {
      throw new Error(`Test ${testId} not found`);
    }

    if (test.status !== 'running' && test.status !== 'paused') {
      throw new Error(`Test ${testId} is not active`);
    }

    try {
      const response = await this.networkManager.request<TestResult>({
        method: 'POST',
        url: `/api/tests/${testId}/complete`,
        data: { endDate: new Date().toISOString() },
        cache: false
      });

      const result = response.data;
      this.results.set(testId, result);
      test.status = 'completed';
      this.activeTests.delete(testId);

      return result;
    } catch (error) {
      console.error('Failed to complete test:', error);
      throw error;
    }
  }

  public async trackVariant(
    testId: string,
    variantId: string,
    metrics: Partial<TestMetrics>
  ): Promise<void> {
    const test = this.tests.get(testId);
    if (!test) {
      throw new Error(`Test ${testId} not found`);
    }

    const variant = test.variants.find(v => v.id === variantId);
    if (!variant) {
      throw new Error(`Variant ${variantId} not found in test ${testId}`);
    }

    Object.assign(variant.metrics, metrics);

    try {
      await this.networkManager.request({
        method: 'POST',
        url: `/api/tests/${testId}/variants/${variantId}/track`,
        data: metrics,
        cache: false
      });
    } catch (error) {
      console.error('Failed to track variant metrics:', error);
      throw error;
    }
  }

  public async analyzeTest(testId: string): Promise<TestAnalysis> {
    const test = this.tests.get(testId);
    if (!test) {
      throw new Error(`Test ${testId} not found`);
    }

    try {
      const response = await this.networkManager.request<TestAnalysis>({
        method: 'GET',
        url: `/api/tests/${testId}/analyze`,
        cache: false
      });

      return response.data;
    } catch (error) {
      console.error('Failed to analyze test:', error);
      throw error;
    }
  }

  public getTests(): TestConfig[] {
    return Array.from(this.tests.values());
  }

  public getResults(): TestResult[] {
    return Array.from(this.results.values());
  }

  public getActiveTests(): string[] {
    return Array.from(this.activeTests);
  }

  public getLastUpdate(): Date {
    return this.state.lastUpdate;
  }

  public getState(): ManagerState {
    return { ...this.state };
  }

  public async exportData(): Promise<string> {
    const data = {
      tests: Array.from(this.tests.entries()),
      results: Array.from(this.results.entries()),
      activeTests: Array.from(this.activeTests),
      state: this.state
    };
    return JSON.stringify(data);
  }

  public async importData(dataJson: string): Promise<void> {
    const data = JSON.parse(dataJson);
    this.tests = new Map(data.tests);
    this.results = new Map(data.results);
    this.activeTests = new Set(data.activeTests);
    this.state = data.state;
  }
} 