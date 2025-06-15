import { openai } from '../../../lib/openai';
import { db } from '../../../lib/supabase';
import { AIAnalysisResult, BrandDNA } from '../../../types';

export class BrandDNAAnalyzer {
  private static instance: BrandDNAAnalyzer;

  private constructor() {}

  public static getInstance(): BrandDNAAnalyzer {
    if (!BrandDNAAnalyzer.instance) {
      BrandDNAAnalyzer.instance = new BrandDNAAnalyzer();
    }
    return BrandDNAAnalyzer.instance;
  }

  public async analyzeBrandDocument(content: string): Promise<AIAnalysisResult> {
    try {
      const completion = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are a brand strategy expert. Analyze the provided content and extract key brand information.
            Format your response as JSON with the following structure:
            {
              "brandVoice": {
                "tone": string,
                "style": string,
                "keywords": string[]
              },
              "targetAudience": string[],
              "marketingStrategy": {
                "objectives": string[],
                "channels": string[],
                "keyMessages": string[]
              },
              "visualIdentity": {
                "colors": string[],
                "typography": string[],
                "imagery": string[]
              },
              "confidence": number (0-1),
              "suggestions": string[],
              "warnings": string[]
            }`
          },
          {
            role: 'user',
            content: content
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      });

      const result = completion.choices[0].message.content;
      return JSON.parse(result || '{}') as AIAnalysisResult;
    } catch (error: unknown) {
      console.error('Error analyzing brand document:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to analyze brand document: ${error.message}`);
      }
      throw new Error('Failed to analyze brand document: Unknown error occurred');
    }
  }

  public async createBrandProfile(
    name: string,
    industry: string,
    analysisResult: AIAnalysisResult
  ): Promise<BrandDNA> {
    try {
      // Convert camelCase to snake_case for database compatibility
      const brandData = {
        name,
        industry,
        target_audience: analysisResult.targetAudience || [],
        brand_voice: analysisResult.brandVoice || {},
        visual_identity: analysisResult.visualIdentity || {},
        marketing_strategy: {
          objectives: analysisResult.marketingStrategy?.objectives || [],
          channels: analysisResult.marketingStrategy?.channels || [],
          key_messages: analysisResult.marketingStrategy?.keyMessages || []
        },
        conversion_goals: {
          primary: 'increase_sales',
          secondary: ['brand_awareness', 'customer_retention'],
          metrics: [
            {
              name: 'conversion_rate',
              target: 0.05,
              unit: 'percentage'
            }
          ]
        }
      };

      const { data, error } = await db.brands.create(brandData);
      if (error) throw error;
      if (!data) throw new Error('Failed to create brand profile');

      // Create initial brand analysis record
      await db.analyses.create({
        brand_id: data.id,
        analysis_type: 'initial_profile',
        content: JSON.stringify(analysisResult),
        results: analysisResult,
        confidence: analysisResult.confidence || 0.8
      });

      return data;
    } catch (error: unknown) {
      console.error('Error creating brand profile:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to create brand profile: ${error.message}`);
      }
      throw new Error('Failed to create brand profile: Unknown error occurred');
    }
  }

  public async updateBrandProfile(
    brandId: string,
    updates: Partial<BrandDNA>
  ): Promise<BrandDNA> {
    try {
      const { data, error } = await db.brands.update(brandId, updates);
      if (error) throw error;
      if (!data) throw new Error('Failed to update brand profile');
      return data;
    } catch (error: unknown) {
      console.error('Error updating brand profile:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to update brand profile: ${error.message}`);
      }
      throw new Error('Failed to update brand profile: Unknown error occurred');
    }
  }

  public async getBrandProfile(brandId: string): Promise<BrandDNA> {
    try {
      const { data, error } = await db.brands.getById(brandId);
      if (error) throw error;
      if (!data) throw new Error('Brand not found');
      return data;
    } catch (error: unknown) {
      console.error('Error fetching brand profile:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to fetch brand profile: ${error.message}`);
      }
      throw new Error('Failed to fetch brand profile: Unknown error occurred');
    }
  }
} 