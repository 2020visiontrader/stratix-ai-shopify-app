import { NetworkManager } from '@/lib/core/NetworkManager';

interface Content {
  id: string;
  type: 'product' | 'blog' | 'page' | 'email' | 'social';
  title: string;
  body: string;
  metadata: {
    created: number;
    updated: number;
    status: 'draft' | 'published' | 'archived';
    author: string;
    tags: string[];
    seo: {
      title: string;
      description: string;
      keywords: string[];
    };
  };
  analytics: {
    views: number;
    engagement: number;
    conversion: number;
  };
}

interface ContentResult {
  contentId: string;
  timestamp: number;
  analysis: {
    quality: {
      score: number;
      suggestions: string[];
    };
    seo: {
      score: number;
      recommendations: string[];
    };
    engagement: {
      predicted: number;
      factors: string[];
    };
  };
  metadata: {
    processingTime: number;
    confidence: number;
  };
}

export class ContentManager {
  private static instance: ContentManager;
  private networkManager: NetworkManager;
  private contents: Map<string, Content>;
  private results: Map<string, ContentResult>;
  private lastUpdate: number;

  private constructor() {
    this.networkManager = NetworkManager.getInstance();
    this.contents = new Map();
    this.results = new Map();
    this.lastUpdate = Date.now();
  }

  public static getInstance(): ContentManager {
    if (!ContentManager.instance) {
      ContentManager.instance = new ContentManager();
    }
    return ContentManager.instance;
  }

  public async create(content: Omit<Content, 'id'>): Promise<Content> {
    try {
      const newContent: Content = {
        ...content,
        id: crypto.randomUUID(),
        metadata: {
          ...content.metadata,
          created: Date.now(),
          updated: Date.now()
        },
        analytics: {
          views: 0,
          engagement: 0,
          conversion: 0
        }
      };

      this.validateContent(newContent);
      this.contents.set(newContent.id, newContent);
      this.lastUpdate = Date.now();

      // Analyze content
      const result = await this.analyzeContent(newContent);
      this.results.set(newContent.id, result);

      return newContent;
    } catch (error) {
      console.error('Error creating content:', error);
      throw error;
    }
  }

  private validateContent(content: Content): void {
    if (!content.type || !content.title || !content.body) {
      throw new Error('Invalid content data');
    }

    if (!content.metadata || !content.metadata.status || !content.metadata.author) {
      throw new Error('Content must include metadata');
    }
  }

  public async update(
    contentId: string,
    updates: Partial<Content>
  ): Promise<Content> {
    const content = this.contents.get(contentId);
    if (!content) {
      throw new Error(`Content not found: ${contentId}`);
    }

    const updatedContent: Content = {
      ...content,
      ...updates,
      metadata: {
        ...content.metadata,
        updated: Date.now()
      }
    };

    this.validateContent(updatedContent);
    this.contents.set(contentId, updatedContent);
    this.lastUpdate = Date.now();

    // Re-analyze content
    const result = await this.analyzeContent(updatedContent);
    this.results.set(contentId, result);

    return updatedContent;
  }

  private async analyzeContent(content: Content): Promise<ContentResult> {
    const startTime = Date.now();

    // Analyze content quality
    const quality = await this.analyzeQuality(content);

    // Analyze SEO
    const seo = await this.analyzeSEO(content);

    // Predict engagement
    const engagement = await this.predictEngagement(content);

    return {
      contentId: content.id,
      timestamp: Date.now(),
      analysis: {
        quality,
        seo,
        engagement
      },
      metadata: {
        processingTime: Date.now() - startTime,
        confidence: this.calculateConfidence(content)
      }
    };
  }

  private async analyzeQuality(
    content: Content
  ): Promise<ContentResult['analysis']['quality']> {
    const response = await this.networkManager.request<
      ContentResult['analysis']['quality']
    >({
      method: 'POST',
      url: '/api/content/analyze/quality',
      data: { content }
    });
    return response.data;
  }

  private async analyzeSEO(
    content: Content
  ): Promise<ContentResult['analysis']['seo']> {
    const response = await this.networkManager.request<
      ContentResult['analysis']['seo']
    >({
      method: 'POST',
      url: '/api/content/analyze/seo',
      data: { content }
    });
    return response.data;
  }

  private async predictEngagement(
    content: Content
  ): Promise<ContentResult['analysis']['engagement']> {
    const response = await this.networkManager.request<
      ContentResult['analysis']['engagement']
    >({
      method: 'POST',
      url: '/api/content/predict/engagement',
      data: { content }
    });
    return response.data;
  }

  private calculateConfidence(content: Content): number {
    // Calculate confidence based on content completeness and quality
    const contentScore = content.body.length > 500 ? 1 : content.body.length / 500;
    const metadataScore = content.metadata.seo ? 1 : 0.5;
    return (contentScore + metadataScore) / 2;
  }

  public async getContent(contentId: string): Promise<Content | undefined> {
    return this.contents.get(contentId);
  }

  public async getAllContent(): Promise<Content[]> {
    return Array.from(this.contents.values());
  }

  public async getContentByType(type: Content['type']): Promise<Content[]> {
    return Array.from(this.contents.values()).filter(
      content => content.type === type
    );
  }

  public async getContentByStatus(
    status: Content['metadata']['status']
  ): Promise<Content[]> {
    return Array.from(this.contents.values()).filter(
      content => content.metadata.status === status
    );
  }

  public async getContentResult(
    contentId: string
  ): Promise<ContentResult | undefined> {
    return this.results.get(contentId);
  }

  public async searchContent(query: string): Promise<Content[]> {
    const response = await this.networkManager.request<Content[]>({
      method: 'GET',
      url: '/api/content/search',
      params: { query }
    });
    return response.data;
  }

  public async updateAnalytics(
    contentId: string,
    analytics: Partial<Content['analytics']>
  ): Promise<Content> {
    const content = this.contents.get(contentId);
    if (!content) {
      throw new Error(`Content not found: ${contentId}`);
    }

    const updatedContent: Content = {
      ...content,
      analytics: {
        ...content.analytics,
        ...analytics
      }
    };

    this.contents.set(contentId, updatedContent);
    this.lastUpdate = Date.now();
    return updatedContent;
  }

  public async exportData(): Promise<string> {
    const data = {
      contents: Array.from(this.contents.values()),
      results: Array.from(this.results.values()),
      lastUpdate: this.lastUpdate
    };
    return JSON.stringify(data, null, 2);
  }

  public async importData(data: string): Promise<void> {
    try {
      const parsedData = JSON.parse(data);
      this.contents = new Map(
        parsedData.contents.map((c: Content) => [c.id, c])
      );
      this.results = new Map(
        parsedData.results.map((r: ContentResult) => [r.contentId, r])
      );
      this.lastUpdate = parsedData.lastUpdate;
    } catch (error) {
      console.error('Failed to import content manager data:', error);
      throw error;
    }
  }

  public getLastUpdate(): number {
    return this.lastUpdate;
  }

  public getContentCount(): number {
    return this.contents.size;
  }

  public getResultCount(): number {
    return this.results.size;
  }
} 