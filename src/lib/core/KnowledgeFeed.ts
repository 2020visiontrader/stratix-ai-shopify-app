import { NetworkManager } from '../../../frontend/src/utils/network';

export interface KnowledgeSource {
  id: string;
  type: 'api' | 'database' | 'file' | 'stream';
  name: string;
  config: Record<string, any>;
  lastSync: Date | null;
  status: 'active' | 'inactive' | 'error';
}

export interface KnowledgeItem {
  id: string;
  type: 'insight' | 'pattern' | 'trend' | 'recommendation' | 'alert';
  source: string;
  category: string;
  content: {
    title: string;
    description: string;
    data: Record<string, any>;
    metadata: Record<string, any>;
  };
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'new' | 'processing' | 'processed' | 'archived';
  timestamp: Date;
  expiry?: Date;
}

export interface FeedConfig {
  id: string;
  name: string;
  sources: string[];
  filters: {
    types: string[];
    categories: string[];
    priority: string[];
    timeRange?: {
      start: Date;
      end: Date;
    };
  };
  processing: {
    autoProcess: boolean;
    batchSize: number;
    retryAttempts: number;
    timeout: number;
  };
  notifications: {
    enabled: boolean;
    channels: string[];
    priority: string[];
  };
}

export interface ProcessingResult {
  itemId: string;
  status: 'success' | 'failure' | 'skipped';
  timestamp: Date;
  output?: Record<string, any>;
  error?: string;
}

export interface FeedResult {
  knowledgeId: string;
  timestamp: number;
  items: KnowledgeItem[];
  summary: {
    total: number;
    byType: Record<string, number>;
    bySource: Record<string, number>;
    byTag: Record<string, number>;
  };
}

export class KnowledgeFeed {
  private static instance: KnowledgeFeed;
  private networkManager: NetworkManager;
  private items: Map<string, KnowledgeItem> = new Map();
  private configs: Map<string, FeedConfig> = new Map();
  private processingQueue: string[] = [];
  private processingResults: Map<string, ProcessingResult[]> = new Map();
  private results: Map<string, FeedResult> = new Map();
  private lastUpdate: number = Date.now();

  private constructor() {
    this.networkManager = NetworkManager.getInstance();
  }

  public static getInstance(): KnowledgeFeed {
    if (!KnowledgeFeed.instance) {
      KnowledgeFeed.instance = new KnowledgeFeed();
    }
    return KnowledgeFeed.instance;
  }

  public async addSource(source: KnowledgeSource): Promise<void> {
    // Implementation needed
  }

  public async updateSource(sourceId: string, updates: Partial<KnowledgeSource>): Promise<void> {
    // Implementation needed
  }

  public async addItem(item: KnowledgeItem): Promise<void> {
    this.items.set(item.id, item);
    this.lastUpdate = Date.now();

    try {
      await this.networkManager.request({
        method: 'POST',
        url: '/api/knowledge/items',
        data: item,
        cache: false
      });

      if (this.shouldAutoProcess(item)) {
        this.addToProcessingQueue(item.id);
      }
    } catch (error) {
      console.error('Failed to add knowledge item:', error);
      throw error;
    }
  }

  public async updateItem(
    itemId: string,
    updates: Partial<KnowledgeItem>
  ): Promise<void> {
    const item = this.items.get(itemId);
    if (!item) {
      throw new Error(`Knowledge item ${itemId} not found`);
    }

    Object.assign(item, updates);
    this.lastUpdate = Date.now();

    try {
      await this.networkManager.request({
        method: 'PUT',
        url: `/api/knowledge/items/${itemId}`,
        data: updates,
        cache: false
      });
    } catch (error) {
      console.error('Failed to update knowledge item:', error);
      throw error;
    }
  }

  public async addConfig(config: FeedConfig): Promise<void> {
    this.configs.set(config.id, config);
    this.lastUpdate = Date.now();

    try {
      await this.networkManager.request({
        method: 'POST',
        url: '/api/knowledge/configs',
        data: config,
        cache: false
      });
    } catch (error) {
      console.error('Failed to add feed config:', error);
      throw error;
    }
  }

  public async processItems(
    itemIds: string[],
    configId: string
  ): Promise<ProcessingResult[]> {
    const config = this.configs.get(configId);
    if (!config) {
      throw new Error(`Feed config ${configId} not found`);
    }

    const results: ProcessingResult[] = [];

    for (const itemId of itemIds) {
      const item = this.items.get(itemId);
      if (!item) {
        results.push({
          itemId,
          status: 'skipped',
          timestamp: new Date(),
          error: 'Item not found'
        });
        continue;
      }

      try {
        const response = await this.networkManager.request({
          method: 'POST',
          url: `/api/knowledge/process/${itemId}`,
          data: {
            config: config.processing
          },
          cache: false
        });

        const result: ProcessingResult = {
          itemId,
          status: 'success',
          timestamp: new Date(),
          output: response.data as Record<string, any>
        };

        results.push(result);
        this.recordProcessingResult(itemId, result);
      } catch (error) {
        const result: ProcessingResult = {
          itemId,
          status: 'failure',
          timestamp: new Date(),
          error: error instanceof Error ? error.message : 'Unknown error'
        };

        results.push(result);
        this.recordProcessingResult(itemId, result);
      }
    }

    return results;
  }

  public async analyzeFeed(
    configId: string,
    timeRange?: { start: Date; end: Date }
  ): Promise<{
    items: KnowledgeItem[];
    trends: {
      type: string;
      frequency: number;
      impact: number;
    }[];
    insights: {
      category: string;
      description: string;
      confidence: number;
    }[];
  }> {
    const config = this.configs.get(configId);
    if (!config) {
      throw new Error(`Feed config ${configId} not found`);
    }

    try {
      const response = await this.networkManager.request({
        method: 'GET',
        url: `/api/knowledge/analyze/${configId}`,
        params: timeRange,
        cache: false
      });

      return response.data as {
        items: KnowledgeItem[];
        trends: {
          type: string;
          frequency: number;
          impact: number;
        }[];
        insights: {
          category: string;
          description: string;
          confidence: number;
        }[];
      };
    } catch (error) {
      console.error('Failed to analyze knowledge feed:', error);
      throw error;
    }
  }

  private shouldAutoProcess(item: KnowledgeItem): boolean {
    return Array.from(this.configs.values()).some(
      config =>
        config.processing.autoProcess &&
        config.sources.includes(item.source) &&
        config.filters.types.includes(item.type) &&
        config.filters.categories.includes(item.category) &&
        config.filters.priority.includes(item.priority)
    );
  }

  private addToProcessingQueue(itemId: string): void {
    if (!this.processingQueue.includes(itemId)) {
      this.processingQueue.push(itemId);
    }
  }

  private recordProcessingResult(
    itemId: string,
    result: ProcessingResult
  ): void {
    if (!this.processingResults.has(itemId)) {
      this.processingResults.set(itemId, []);
    }
    this.processingResults.get(itemId)!.push(result);
  }

  public getItems(configId: string): KnowledgeItem[] {
    const config = this.configs.get(configId);
    if (!config) {
      throw new Error(`Feed config ${configId} not found`);
    }

    return Array.from(this.items.values()).filter(item =>
      this.matchesConfig(item, config)
    );
  }

  private matchesConfig(item: KnowledgeItem, config: FeedConfig): boolean {
    return (
      config.sources.includes(item.source) &&
      config.filters.types.includes(item.type) &&
      config.filters.categories.includes(item.category) &&
      config.filters.priority.includes(item.priority) &&
      (!config.filters.timeRange ||
        (item.timestamp >= config.filters.timeRange.start &&
          item.timestamp <= config.filters.timeRange.end))
    );
  }

  public getProcessingResults(itemId: string): ProcessingResult[] {
    return this.processingResults.get(itemId) || [];
  }

  public getLastUpdate(): number {
    return this.lastUpdate;
  }

  public async exportData(): Promise<string> {
    const exportData = {
      items: Object.fromEntries(this.items),
      configs: Object.fromEntries(this.configs),
      processingResults: Object.fromEntries(this.processingResults),
      results: Object.fromEntries(this.results),
      lastUpdate: this.lastUpdate
    };
    return JSON.stringify(exportData, null, 2);
  }

  public async importData(dataJson: string): Promise<void> {
    try {
      const importedData = JSON.parse(dataJson);
      this.items = new Map(Object.entries(importedData.items));
      this.configs = new Map(Object.entries(importedData.configs));
      this.processingResults = new Map(
        Object.entries(importedData.processingResults)
      );
      this.results = new Map(Object.entries(importedData.results));
      this.lastUpdate = importedData.lastUpdate;
    } catch (error) {
      console.error('Failed to import knowledge feed data:', error);
      throw error;
    }
  }

  public async feed(knowledgeId: string): Promise<FeedResult> {
    try {
      // Fetch knowledge items
      const items = await this.fetchKnowledgeItems(knowledgeId);
      items.forEach(item => this.items.set(item.id, item));

      // Generate feed result
      const result = await this.generateFeedResult(knowledgeId, items);
      this.results.set(knowledgeId, result);

      this.lastUpdate = Date.now();
      return result;
    } catch (error) {
      console.error(`Error feeding knowledge ${knowledgeId}:`, error);
      throw error;
    }
  }

  private async fetchKnowledgeItems(
    knowledgeId: string
  ): Promise<KnowledgeItem[]> {
    const response = await this.networkManager.request<KnowledgeItem[]>({
      method: 'GET',
      url: `/api/knowledge/${knowledgeId}/items`
    });
    return response.data;
  }

  private async generateFeedResult(
    knowledgeId: string,
    items: KnowledgeItem[]
  ): Promise<FeedResult> {
    const summary = this.generateSummary(items);
    return {
      knowledgeId,
      timestamp: Date.now(),
      items,
      summary
    };
  }

  private generateSummary(items: KnowledgeItem[]): FeedResult['summary'] {
    const byType: Record<string, number> = {};
    const bySource: Record<string, number> = {};
    const byTag: Record<string, number> = {};

    items.forEach(item => {
      // Count by type
      byType[item.type] = (byType[item.type] || 0) + 1;

      // Count by source
      bySource[item.source] = (bySource[item.source] || 0) + 1;

      // Count by tag
      item.content.metadata.tags.forEach(tag => {
        byTag[tag] = (byTag[tag] || 0) + 1;
      });
    });

    return {
      total: items.length,
      byType,
      bySource,
      byTag
    };
  }

  public async getFeedResult(
    knowledgeId: string
  ): Promise<FeedResult | undefined> {
    return this.results.get(knowledgeId);
  }

  public async searchItems(query: string): Promise<KnowledgeItem[]> {
    const response = await this.networkManager.request<KnowledgeItem[]>({
      method: 'GET',
      url: '/api/knowledge/search',
      params: { query }
    });
    return response.data;
  }

  public getItemCount(): number {
    return this.items.size;
  }

  public getResultCount(): number {
    return this.results.size;
  }
} 