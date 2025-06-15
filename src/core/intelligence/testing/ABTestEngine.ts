import { openai } from '../../../lib/openai';
import { db } from '../../../lib/supabase';

interface TestVariant {
  id: string;
  content: string;
  rationale: string;
}

interface TestMetrics {
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
}

interface ABTest {
  id: string;
  brand_id: string;
  name: string;
  description: string;
  status: 'draft' | 'running' | 'completed' | 'stopped';
  original_content: string;
  variants: TestVariant[];
  metrics: {
    original: TestMetrics;
    variants: Record<string, TestMetrics>;
  };
  winner_id?: string;
  start_date?: Date;
  end_date?: Date;
  created_at: Date;
  updated_at: Date;
}

export class ABTestEngine {
  private static instance: ABTestEngine;

  private constructor() {}

  public static getInstance(): ABTestEngine {
    if (!ABTestEngine.instance) {
      ABTestEngine.instance = new ABTestEngine();
    }
    return ABTestEngine.instance;
  }

  public async generateVariants(
    originalContent: string,
    brandId: string,
    count: number = 3
  ): Promise<TestVariant[]> {
    try {
      // Get brand profile for context
      const { data: brand, error: brandError } = await db.brands.getById(brandId);
      if (brandError) throw brandError;
      if (!brand) throw new Error('Brand not found');

      const completion = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are an A/B testing expert. Generate ${count} variants of the provided content that:
            1. Maintain the core message and intent
            2. Test different approaches and hypotheses
            3. Follow the brand voice and style
            4. Are meaningfully different from each other
            
            Brand Context:
            ${JSON.stringify(brand, null, 2)}
            
            Format response as JSON array of objects with:
            {
              "id": "variant-1",
              "content": "variant content",
              "rationale": "explanation of changes and hypothesis"
            }`
          },
          {
            role: 'user',
            content: originalContent
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      });

      const result = completion.choices[0].message.content;
      return JSON.parse(result || '[]');
    } catch (error: unknown) {
      console.error('Error generating test variants:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to generate test variants: ${error.message}`);
      }
      throw new Error('Failed to generate test variants: Unknown error occurred');
    }
  }

  public async createTest(
    brandId: string,
    name: string,
    originalContent: string,
    variants: TestVariant[],
    description?: string
  ): Promise<ABTest> {
    try {
      const { data, error } = await db.tests.create({
        brand_id: brandId,
        name,
        description: description || '',
        status: 'draft',
        original_content: originalContent,
        variants,
        metrics: {
          original: {
            impressions: 0,
            clicks: 0,
            conversions: 0,
            revenue: 0
          },
          variants: Object.fromEntries(
            variants.map(v => [
              v.id,
              {
                impressions: 0,
                clicks: 0,
                conversions: 0,
                revenue: 0
              }
            ])
          )
        }
      });

      if (error) throw error;
      if (!data) throw new Error('Failed to create A/B test');
      return data;
    } catch (error: unknown) {
      console.error('Error creating A/B test:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to create A/B test: ${error.message}`);
      }
      throw new Error('Failed to create A/B test: Unknown error occurred');
    }
  }

  public async startTest(testId: string): Promise<ABTest> {
    try {
      const { data, error } = await db.tests.update(testId, {
        status: 'running',
        start_date: new Date()
      });

      if (error) throw error;
      if (!data) throw new Error('Failed to start A/B test');
      return data;
    } catch (error: unknown) {
      console.error('Error starting A/B test:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to start A/B test: ${error.message}`);
      }
      throw new Error('Failed to start A/B test: Unknown error occurred');
    }
  }

  public async updateMetrics(
    testId: string,
    variantId: string | 'original',
    metrics: Partial<TestMetrics>
  ): Promise<ABTest> {
    try {
      const { data: test, error: getError } = await db.tests.getById(testId);
      if (getError) throw getError;
      if (!test) throw new Error('Test not found');

      const updatedMetrics = {
        ...test.metrics,
        [variantId === 'original' ? 'original' : `variants.${variantId}`]: {
          ...(variantId === 'original'
            ? test.metrics.original
            : test.metrics.variants[variantId]),
          ...metrics
        }
      };

      const { data, error } = await db.tests.update(testId, {
        metrics: updatedMetrics
      });

      if (error) throw error;
      if (!data) throw new Error('Failed to update test metrics');
      return data;
    } catch (error: unknown) {
      console.error('Error updating test metrics:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to update test metrics: ${error.message}`);
      }
      throw new Error('Failed to update test metrics: Unknown error occurred');
    }
  }

  public async analyzeResults(testId: string): Promise<{
    winner: string;
    analysis: string;
    confidence: number;
  }> {
    try {
      const { data: test, error: getError } = await db.tests.getById(testId);
      if (getError) throw getError;
      if (!test) throw new Error('Test not found');

      const completion = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are an A/B testing analyst. Analyze the test results and determine:
            1. The winning variant (if any)
            2. Statistical significance and confidence
            3. Key insights and learnings
            4. Recommendations for future tests
            
            Format response as JSON:
            {
              "winner": "variant-id",
              "analysis": "detailed analysis",
              "confidence": 0.95
            }`
          },
          {
            role: 'user',
            content: JSON.stringify(test, null, 2)
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      });

      const result = completion.choices[0].message.content;
      const analysis = JSON.parse(result || '{}');

      // Update test with winner if confidence is high enough
      if (analysis.confidence >= 0.95) {
        await db.tests.update(testId, {
          winner_id: analysis.winner,
          status: 'completed',
          end_date: new Date()
        });
      }

      return analysis;
    } catch (error: unknown) {
      console.error('Error analyzing test results:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to analyze test results: ${error.message}`);
      }
      throw new Error('Failed to analyze test results: Unknown error occurred');
    }
  }
} 