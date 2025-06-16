import { OpenAIClient } from '@/lib/openai';
import { AppError } from '@/utils/errorHandling';

interface KnowledgeItem {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  relevance: number;
}

interface FeedOptions {
  category?: string;
  tags?: string[];
  limit?: number;
  minRelevance?: number;
}

export class KnowledgeFeed {
  private static instance: KnowledgeFeed;
  private readonly openai: OpenAIClient;
  private knowledgeBase: Map<string, KnowledgeItem>;

  private constructor() {
    this.openai = OpenAIClient.getInstance();
    this.knowledgeBase = new Map();
  }

  public static getInstance(): KnowledgeFeed {
    if (!KnowledgeFeed.instance) {
      KnowledgeFeed.instance = new KnowledgeFeed();
    }
    return KnowledgeFeed.instance;
  }

  public async addKnowledgeItem(item: Omit<KnowledgeItem, 'id' | 'createdAt' | 'updatedAt' | 'relevance'>): Promise<KnowledgeItem> {
    try {
      const id = crypto.randomUUID();
      const now = new Date();
      
      // Calculate initial relevance
      const relevance = await this.calculateRelevance(item.content);

      const knowledgeItem: KnowledgeItem = {
        id,
        ...item,
        createdAt: now,
        updatedAt: now,
        relevance
      };

      this.knowledgeBase.set(id, knowledgeItem);
      return knowledgeItem;
    } catch (error) {
      throw new AppError(
        'Failed to add knowledge item',
        500,
        error instanceof Error ? error.message : undefined
      );
    }
  }

  public async updateKnowledgeItem(
    id: string,
    updates: Partial<Omit<KnowledgeItem, 'id' | 'createdAt' | 'updatedAt' | 'relevance'>>
  ): Promise<KnowledgeItem> {
    const item = this.knowledgeBase.get(id);
    if (!item) {
      throw new AppError('Knowledge item not found', 404);
    }

    try {
      const updatedItem = {
        ...item,
        ...updates,
        updatedAt: new Date()
      };

      // Recalculate relevance if content was updated
      if (updates.content) {
        updatedItem.relevance = await this.calculateRelevance(updates.content);
      }

      this.knowledgeBase.set(id, updatedItem);
      return updatedItem;
    } catch (error) {
      throw new AppError(
        'Failed to update knowledge item',
        500,
        error instanceof Error ? error.message : undefined
      );
    }
  }

  public getKnowledgeItem(id: string): KnowledgeItem {
    const item = this.knowledgeBase.get(id);
    if (!item) {
      throw new AppError('Knowledge item not found', 404);
    }
    return { ...item };
  }

  public getFeed(options: FeedOptions = {}): KnowledgeItem[] {
    let items = Array.from(this.knowledgeBase.values());

    // Apply filters
    if (options.category) {
      items = items.filter(item => item.category === options.category);
    }

    if (options.tags && options.tags.length > 0) {
      items = items.filter(item => 
        options.tags!.some(tag => item.tags.includes(tag))
      );
    }

    if (options.minRelevance) {
      items = items.filter(item => item.relevance >= options.minRelevance!);
    }

    // Sort by relevance and limit results
    items.sort((a, b) => b.relevance - a.relevance);
    
    if (options.limit) {
      items = items.slice(0, options.limit);
    }

    return items;
  }

  public async searchKnowledge(query: string): Promise<KnowledgeItem[]> {
    try {
      // Generate embeddings for the search query
      const queryEmbedding = await this.openai.createEmbedding({
        model: 'text-embedding-ada-002',
        input: query
      });

      // Calculate similarity scores for all items
      const items = Array.from(this.knowledgeBase.values());
      const scoredItems = await Promise.all(
        items.map(async item => {
          const itemEmbedding = await this.openai.createEmbedding({
            model: 'text-embedding-ada-002',
            input: item.content
          });

          const similarity = this.calculateCosineSimilarity(
            queryEmbedding[0],
            itemEmbedding[0]
          );

          return { ...item, similarity };
        })
      );

      // Sort by similarity score
      return scoredItems
        .sort((a, b) => b.similarity - a.similarity)
        .map(({ similarity, ...item }) => item);
    } catch (error) {
      throw new AppError(
        'Failed to search knowledge base',
        500,
        error instanceof Error ? error.message : undefined
      );
    }
  }

  private async calculateRelevance(content: string): Promise<number> {
    try {
      const prompt = `
        Analyze the following content and rate its relevance to e-commerce optimization
        on a scale of 0 to 100:
        ${content}
      `;

      const response = await this.openai.createCompletion({
        model: 'gpt-4',
        prompt,
        maxTokens: 50,
        temperature: 0.3
      });

      const score = parseInt(response.trim());
      return isNaN(score) ? 50 : Math.min(100, Math.max(0, score));
    } catch (error) {
      console.error('Failed to calculate relevance:', error);
      return 50; // Default relevance score
    }
  }

  private calculateCosineSimilarity(vec1: number[], vec2: number[]): number {
    const dotProduct = vec1.reduce((sum, val, i) => sum + val * vec2[i], 0);
    const magnitude1 = Math.sqrt(vec1.reduce((sum, val) => sum + val * val, 0));
    const magnitude2 = Math.sqrt(vec2.reduce((sum, val) => sum + val * val, 0));
    return dotProduct / (magnitude1 * magnitude2);
  }
}
