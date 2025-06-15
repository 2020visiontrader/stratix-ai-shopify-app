import { openai } from '../../../lib/openai';
import { db } from '../../../lib/supabase';
import { BrandDNAAnalyzer } from '../brand/BrandDNAAnalyzer';
import { ABTestEngine } from './ABTestEngine';

interface SimulationResult {
  variant_id: string;
  metrics: {
    conversion_potential: number;
    tone_alignment: number;
    brand_dna_match: number;
    overall_score: number;
  };
  analysis: string;
  confidence: number;
}

interface TrialLog {
  test_id: string;
  variant_id: string;
  simulation_result: SimulationResult;
  timestamp: Date;
}

export class TestSuite {
  private static instance: TestSuite;
  private abTestEngine: ABTestEngine;
  private brandAnalyzer: BrandDNAAnalyzer;

  private constructor() {
    this.abTestEngine = ABTestEngine.getInstance();
    this.brandAnalyzer = BrandDNAAnalyzer.getInstance();
  }

  public static getInstance(): TestSuite {
    if (!TestSuite.instance) {
      TestSuite.instance = new TestSuite();
    }
    return TestSuite.instance;
  }

  public async simulateTest(
    testId: string,
    brandId: string
  ): Promise<SimulationResult[]> {
    try {
      // Get test and brand data
      const { data: test, error: testError } = await db.tests.getById(testId);
      if (testError) throw testError;
      if (!test) throw new Error('Test not found');

      const { data: brand, error: brandError } = await db.brands.getById(brandId);
      if (brandError) throw brandError;
      if (!brand) throw new Error('Brand not found');

      // Simulate each variant
      const results: SimulationResult[] = [];
      
      // Simulate original content
      const originalResult = await this.simulateVariant(
        test.original_content,
        brand,
        'original'
      );
      results.push(originalResult);

      // Simulate each variant
      for (const variant of test.variants) {
        const variantResult = await this.simulateVariant(
          variant.content,
          brand,
          variant.id
        );
        results.push(variantResult);
      }

      // Log trial results
      await this.logTrial(testId, results);

      return results;
    } catch (error: unknown) {
      console.error('Error simulating test:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to simulate test: ${error.message}`);
      }
      throw new Error('Failed to simulate test: Unknown error occurred');
    }
  }

  private async simulateVariant(
    content: string,
    brand: any,
    variantId: string
  ): Promise<SimulationResult> {
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are an A/B testing simulation expert. Analyze the content and predict its performance based on:
          1. Conversion potential (0-1)
          2. Tone alignment with brand voice (0-1)
          3. Match with brand DNA (0-1)
          
          Brand Context:
          ${JSON.stringify(brand, null, 2)}
          
          Format response as JSON:
          {
            "metrics": {
              "conversion_potential": number,
              "tone_alignment": number,
              "brand_dna_match": number
            },
            "analysis": "detailed explanation",
            "confidence": number
          }`
        },
        {
          role: 'user',
          content
        }
      ],
      temperature: 0.3,
      max_tokens: 2000
    });

    const result = JSON.parse(completion.choices[0].message.content || '{}');
    const metrics = {
      ...result.metrics,
      overall_score: (
        result.metrics.conversion_potential +
        result.metrics.tone_alignment +
        result.metrics.brand_dna_match
      ) / 3
    };

    return {
      variant_id: variantId,
      metrics,
      analysis: result.analysis,
      confidence: result.confidence
    };
  }

  private async logTrial(testId: string, results: SimulationResult[]): Promise<void> {
    const timestamp = new Date();

    // Log each result as a trial
    for (const result of results) {
      await db.test_trials.create({
        test_id: testId,
        variant_id: result.variant_id,
        simulation_result: result,
        timestamp
      });
    }

    // Update test metrics based on simulation
    const bestVariant = results.reduce((best, current) => {
      return current.metrics.overall_score > best.metrics.overall_score ? current : best;
    });

    if (bestVariant.metrics.overall_score >= 0.8 && bestVariant.confidence >= 0.9) {
      await db.tests.update(testId, {
        winner_id: bestVariant.variant_id,
        status: 'completed',
        end_date: timestamp
      });
    }
  }
} 