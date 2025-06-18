import OpenAI from 'openai';
import { config } from '../../config';
import { AppError } from '../../utils/errors';
import { logger } from '../../utils/logger';

export interface AIResponse {
  content: string;
  model: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class AIService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: config.get('AI_API_KEY')
    });
  }

  async generateContent(
    prompt: string,
    type: 'title' | 'description' | 'meta_description',
    model: string = config.get('AI_MODEL')
  ): Promise<AIResponse> {
    try {
      const systemPrompt = this.getSystemPrompt(type);
      const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ];

      const completion = await this.openai.chat.completions.create({
        model,
        messages,
        temperature: 0.7,
        max_tokens: this.getMaxTokens(type)
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response from AI model');
      }

      return {
        content: response,
        model: completion.model,
        usage: completion.usage || {
          prompt_tokens: 0,
          completion_tokens: 0,
          total_tokens: 0
        }
      };
    } catch (error) {
      logger.error('AI generation error:', error);
      throw new AppError(500, 'AI_ERROR', 'Failed to generate content', error);
    }
  }

  private getSystemPrompt(type: 'title' | 'description' | 'meta_description'): string {
    switch (type) {
      case 'title':
        return 'You are an expert e-commerce copywriter. Generate a compelling, SEO-optimized product title that is clear, concise, and engaging.';
      case 'description':
        return 'You are an expert e-commerce copywriter. Generate a detailed, persuasive product description that highlights key features, benefits, and unique selling points.';
      case 'meta_description':
        return 'You are an expert SEO copywriter. Generate a concise, keyword-rich meta description that accurately describes the product and encourages clicks.';
      default:
        throw new Error('Invalid content type');
    }
  }

  private getMaxTokens(type: 'title' | 'description' | 'meta_description'): number {
    switch (type) {
      case 'title':
        return 100;
      case 'description':
        return 1000;
      case 'meta_description':
        return 160;
      default:
        throw new Error('Invalid content type');
    }
  }
} 