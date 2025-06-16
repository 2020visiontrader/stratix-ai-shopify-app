import { AppError } from '@/utils/errorHandling';
import OpenAI from 'openai';

interface OpenAIConfig {
  apiKey: string;
  organization?: string;
}

interface CompletionOptions {
  model: string;
  prompt: string;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
}

interface EmbeddingOptions {
  model: string;
  input: string | string[];
}

export class OpenAIClient {
  private static instance: OpenAIClient;
  private client: OpenAI | null = null;

  private constructor() {}

  public static getInstance(): OpenAIClient {
    if (!OpenAIClient.instance) {
      OpenAIClient.instance = new OpenAIClient();
    }
    return OpenAIClient.instance;
  }

  public initialize(config: OpenAIConfig): void {
    this.client = new OpenAI({
      apiKey: config.apiKey,
      organization: config.organization,
    });
  }

  public async createCompletion(options: CompletionOptions): Promise<string> {
    if (!this.client) {
      throw new AppError('OpenAI client not initialized', 500);
    }

    try {
      const response = await this.client.chat.completions.create({
        model: options.model || 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: options.prompt }],
        max_tokens: options.maxTokens,
        temperature: options.temperature,
        top_p: options.topP,
        frequency_penalty: options.frequencyPenalty,
        presence_penalty: options.presencePenalty,
      });

      return response.choices[0]?.message?.content?.trim() || '';
    } catch (error) {
      throw new AppError(
        'Failed to create completion',
        500,
        error instanceof Error ? error.message : undefined
      );
    }
  }

  public async createEmbedding(options: EmbeddingOptions): Promise<number[][]> {
    if (!this.client) {
      throw new AppError('OpenAI client not initialized', 500);
    }

    try {
      const response = await this.client.embeddings.create({
        model: options.model,
        input: options.input,
      });

      return response.data.map((item: any) => item.embedding);
    } catch (error) {
      throw new AppError(
        'Failed to create embedding',
        500,
        error instanceof Error ? error.message : undefined
      );
    }
  }

  public async createChatCompletion(
    messages: Array<{ role: string; content: string }>,
    options: {
      model?: string;
      temperature?: number;
      maxTokens?: number;
    } = {}
  ): Promise<string> {
    if (!this.client) {
      throw new AppError('OpenAI client not initialized', 500);
    }

    try {
      const response = await this.client.chat.completions.create({
        model: options.model || 'gpt-3.5-turbo',
        messages: messages as any,
        temperature: options.temperature,
        max_tokens: options.maxTokens,
      });

      return response.choices[0]?.message?.content || '';
    } catch (error) {
      throw new AppError(
        'Failed to create chat completion',
        500,
        error instanceof Error ? error.message : undefined
      );
    }
  }

  public async moderateContent(input: string): Promise<{
    flagged: boolean;
    categories: Record<string, boolean>;
  }> {
    if (!this.client) {
      throw new AppError('OpenAI client not initialized', 500);
    }

    try {
      const response = await this.client.moderations.create({
        input,
      });

      const result = response.results[0];
      return {
        flagged: result.flagged,
        categories: result.categories as unknown as Record<string, boolean>,
      };
    } catch (error) {
      throw new AppError(
        'Failed to moderate content',
        500,
        error instanceof Error ? error.message : undefined
      );
    }
  }
}
