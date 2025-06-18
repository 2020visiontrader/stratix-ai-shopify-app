import OpenAI from 'openai';
import { BrandDNA } from '../types';
import { AIError } from '../utils/errors';

interface ContentAnalysis {
  sentiment: 'positive' | 'negative' | 'neutral';
  tone: string;
  keywords: string[];
  readability: number;
  suggestions: string[];
}

interface ContentOptimization {
  original: string;
  optimized: string;
  improvements: string[];
  confidence: number;
}

export class AIService {
  private static instance: AIService;
  private openai: OpenAI;

  private constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  public static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  async analyzeContent(content: string): Promise<ContentAnalysis> {
    try {
      const prompt = `Analyze the following content and provide insights:
        Content: ${content}
        Please provide:
        1. Sentiment analysis
        2. Tone analysis
        3. Key keywords
        4. Readability score
        5. Improvement suggestions`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 500,
        temperature: 0.7,
      });

      const analysis = JSON.parse(response.choices[0].message.content || '{}');
      return {
        sentiment: analysis.sentiment,
        tone: analysis.tone,
        keywords: analysis.keywords,
        readability: analysis.readability,
        suggestions: analysis.suggestions
      };
    } catch (error) {
      throw new AIError('Failed to analyze content', error);
    }
  }

  async optimizeContent(
    content: string,
    brandDNA: BrandDNA,
    type: 'product' | 'collection' | 'page'
  ): Promise<ContentOptimization> {
    try {
      const prompt = `Optimize the following ${type} content to align with the brand DNA:
        Content: ${content}
        Brand DNA:
        - Tone: ${brandDNA.tone}
        - Style: ${brandDNA.style}
        - Values: ${brandDNA.values.join(', ')}
        - Target Audience: ${brandDNA.targetAudience}
        - Key Messages: ${brandDNA.keyMessages.join(', ')}

        Please provide:
        1. Optimized content
        2. List of improvements made
        3. Confidence score`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 1000,
        temperature: 0.7,
      });

      const optimization = JSON.parse(response.choices[0].message.content || '{}');
      return {
        original: content,
        optimized: optimization.content,
        improvements: optimization.improvements,
        confidence: optimization.confidence
      };
    } catch (error) {
      throw new AIError('Failed to optimize content', error);
    }
  }

  async generateContent(
    type: 'product' | 'collection' | 'page',
    brandDNA: BrandDNA,
    context?: string
  ): Promise<string[]> {
    try {
      const prompt = `Generate ${type} content based on the following brand DNA:
        Brand DNA:
        - Tone: ${brandDNA.tone}
        - Style: ${brandDNA.style}
        - Values: ${brandDNA.values.join(', ')}
        - Target Audience: ${brandDNA.targetAudience}
        - Key Messages: ${brandDNA.keyMessages.join(', ')}
        ${context ? `Context: ${context}` : ''}

        Please provide 3 different content variations.`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 1000,
        temperature: 0.8,
      });

      const variations = JSON.parse(response.choices[0].message.content || '[]');
      return variations;
    } catch (error) {
      throw new AIError('Failed to generate content', error);
    }
  }

  async analyzeBrandDNA(products: any[]): Promise<BrandDNA> {
    try {
      const productDescriptions = products
        .map(p => p.description)
        .join('\n\n');

      const prompt = `Analyze the following product descriptions and extract brand DNA:
        ${productDescriptions}

        Please provide:
        1. Brand tone
        2. Brand style
        3. Core values
        4. Target audience
        5. Key messages`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 500,
        temperature: 0.7,
      });

      const dna = JSON.parse(response.choices[0].message.content || '{}');
      return {
        brandId: products[0].shop_id,
        tone: dna.tone,
        style: dna.style,
        values: dna.values,
        targetAudience: dna.targetAudience,
        keyMessages: dna.keyMessages
      };
    } catch (error) {
      throw new AIError('Failed to analyze brand DNA', error);
    }
  }
} 