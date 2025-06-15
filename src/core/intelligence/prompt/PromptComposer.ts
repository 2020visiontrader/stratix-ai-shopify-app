import { openai } from '../../../lib/openai';
import { db } from '../../../lib/supabase';
import { BrandDNA } from '../../../types';

interface OptimizationResult {
  optimized_content: string;
  improvements: string[];
  seo_suggestions: string[];
  performance_prediction: {
    expected_improvement: number;
    confidence: number;
  };
}

interface ContentType {
  type: 'product_description' | 'ad_copy' | 'landing_page' | 'email' | 'social_post';
  target_platform?: string;
  character_limit?: number;
  tone_override?: string;
}

export class PromptComposer {
  private static instance: PromptComposer;

  private constructor() {}

  public static getInstance(): PromptComposer {
    if (!PromptComposer.instance) {
      PromptComposer.instance = new PromptComposer();
    }
    return PromptComposer.instance;
  }

  private async getBrandContext(brandId: string): Promise<BrandDNA> {
    const { data: brand } = await db.brands.getById(brandId);
    if (!brand) throw new Error('Brand not found');
    return brand;
  }

  public async optimizeContent(
    brandId: string,
    content: string,
    contentType: ContentType
  ): Promise<OptimizationResult> {
    try {
      const brand = await this.getBrandContext(brandId);

      const completion = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are an expert content optimizer. Optimize the provided content while:
            1. Maintaining brand voice and style
            2. Improving conversion potential
            3. Enhancing SEO where applicable
            4. Respecting content type constraints
            
            Brand Context:
            ${JSON.stringify(brand, null, 2)}
            
            Content Type:
            ${JSON.stringify(contentType, null, 2)}
            
            Format response as JSON:
            {
              "optimized_content": "string",
              "improvements": ["string"],
              "seo_suggestions": ["string"],
              "performance_prediction": {
                "expected_improvement": number,
                "confidence": number
              }
            }`
          },
          {
            role: 'user',
            content
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      });

      const result = completion.choices[0].message.content;
      const optimization = JSON.parse(result || '{}') as OptimizationResult;

      // Store optimization in database
      await db.content_optimizations.create({
        brand_id: brandId,
        content_type: contentType.type,
        original_content: content,
        optimized_content: optimization.optimized_content,
        performance_metrics: {
          expected_improvement: optimization.performance_prediction.expected_improvement,
          confidence: optimization.performance_prediction.confidence,
          improvements: optimization.improvements,
          seo_suggestions: optimization.seo_suggestions
        }
      });

      return optimization;
    } catch (error: unknown) {
      console.error('Error optimizing content:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to optimize content: ${error.message}`);
      }
      throw new Error('Failed to optimize content: Unknown error occurred');
    }
  }

  public async generateContent(
    brandId: string,
    prompt: string,
    contentType: ContentType
  ): Promise<string> {
    try {
      const brand = await this.getBrandContext(brandId);

      const completion = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are an expert content creator. Generate content that:
            1. Matches the brand voice and style
            2. Is optimized for the content type
            3. Follows best practices for the platform
            4. Is designed for maximum engagement
            
            Brand Context:
            ${JSON.stringify(brand, null, 2)}
            
            Content Type:
            ${JSON.stringify(contentType, null, 2)}`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.8,
        max_tokens: 2000
      });

      return completion.choices[0].message.content || '';
    } catch (error: unknown) {
      console.error('Error generating content:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to generate content: ${error.message}`);
      }
      throw new Error('Failed to generate content: Unknown error occurred');
    }
  }

  public async generateVariations(
    brandId: string,
    content: string,
    contentType: ContentType,
    count: number = 3
  ): Promise<string[]> {
    try {
      const brand = await this.getBrandContext(brandId);

      const completion = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `Generate ${count} variations of the provided content that:
            1. Maintain the core message
            2. Use different approaches/angles
            3. Match the brand voice
            4. Are optimized for the content type
            
            Brand Context:
            ${JSON.stringify(brand, null, 2)}
            
            Content Type:
            ${JSON.stringify(contentType, null, 2)}
            
            Return variations as a JSON array of strings.`
          },
          {
            role: 'user',
            content
          }
        ],
        temperature: 0.8,
        max_tokens: 2000
      });

      const result = completion.choices[0].message.content;
      return JSON.parse(result || '[]');
    } catch (error: unknown) {
      console.error('Error generating content variations:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to generate content variations: ${error.message}`);
      }
      throw new Error('Failed to generate content variations: Unknown error occurred');
    }
  }
} 