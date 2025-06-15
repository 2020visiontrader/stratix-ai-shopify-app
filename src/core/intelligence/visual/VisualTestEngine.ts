import { openai } from '../../../lib/openai';
import { db } from '../../../lib/supabase';

interface VisualAnalysis {
  style: string;
  composition: string;
  color_palette: string[];
  focal_points: string[];
  emotional_impact: string;
  brand_alignment: number;
}

interface VisualTest {
  brand_id: string;
  test_type: 'brand' | 'competitor' | 'ad' | 'reference';
  image_url: string;
  user_rating: number;
  analysis: VisualAnalysis;
}

interface VisualPreferences {
  preferred_styles: {
    style: string;
    confidence: number;
  }[];
  color_preferences: {
    palette: string[];
    confidence: number;
  }[];
  composition_patterns: {
    pattern: string;
    frequency: number;
  }[];
  successful_elements: string[];
}

interface BrandAnalysisResult {
  analysis_type: string;
  results: VisualTest;
  user_rating: number;
}

export class VisualTestEngine {
  private static instance: VisualTestEngine;

  private constructor() {}

  public static getInstance(): VisualTestEngine {
    if (!VisualTestEngine.instance) {
      VisualTestEngine.instance = new VisualTestEngine();
    }
    return VisualTestEngine.instance;
  }

  public async processVisualInput(
    brandId: string,
    input: {
      type: 'brand' | 'competitor' | 'ad' | 'reference';
      url: string;
    }
  ): Promise<VisualTest> {
    try {
      const analysis = await this.analyzeImage(input.url);
      
      const test: VisualTest = {
        brand_id: brandId,
        test_type: input.type,
        image_url: input.url,
        user_rating: 0, // Will be updated when user rates
        analysis
      };

      await db.brand_analyses.create({
        brand_id: brandId,
        analysis_type: 'visual_test',
        content: input.url,
        results: test,
        confidence: 0.8
      });

      return test;
    } catch (error) {
      console.error('Error processing visual input:', error);
      throw error;
    }
  }

  public async recordUserRating(
    brandId: string,
    testId: string,
    rating: number
  ): Promise<void> {
    try {
      const { data: test } = await db.brand_analyses.getById(testId);
      if (!test) throw new Error('Test not found');

      await db.brand_analyses.update(testId, {
        results: {
          ...test.results,
          user_rating: rating
        }
      });

      // After 20 ratings, generate preferences
      const { data: tests } = await db.brand_analyses.getByBrandId(brandId);
      const visualTests = tests?.filter((t: BrandAnalysisResult) => 
        t.analysis_type === 'visual_test' && 
        t.results.user_rating > 0
      );

      if (visualTests && visualTests.length >= 20) {
        await this.generateVisualPreferences(brandId, visualTests);
      }
    } catch (error) {
      console.error('Error recording user rating:', error);
      throw error;
    }
  }

  private async analyzeImage(imageUrl: string): Promise<VisualAnalysis> {
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'Analyze the image URL and extract visual characteristics and patterns.'
        },
        {
          role: 'user',
          content: imageUrl
        }
      ],
      temperature: 0.3
    });

    const analysis = JSON.parse(completion.choices[0].message.content || '{}');
    return {
      style: analysis.style,
      composition: analysis.composition,
      color_palette: analysis.color_palette,
      focal_points: analysis.focal_points,
      emotional_impact: analysis.emotional_impact,
      brand_alignment: analysis.brand_alignment
    };
  }

  private async generateVisualPreferences(
    brandId: string,
    tests: BrandAnalysisResult[]
  ): Promise<void> {
    const highlyRatedTests = tests.filter(t => t.results.user_rating >= 4);
    
    const preferences: VisualPreferences = {
      preferred_styles: this.extractPreferredStyles(highlyRatedTests),
      color_preferences: this.extractColorPreferences(highlyRatedTests),
      composition_patterns: this.extractCompositionPatterns(highlyRatedTests),
      successful_elements: this.extractSuccessfulElements(highlyRatedTests)
    };

    await db.brand_analyses.create({
      brand_id: brandId,
      analysis_type: 'visual_preferences',
      content: JSON.stringify(preferences),
      results: preferences,
      confidence: 0.9
    });
  }

  private extractPreferredStyles(tests: BrandAnalysisResult[]): { style: string; confidence: number }[] {
    const styles = tests.map(t => t.results.analysis.style);
    const frequencies = this.calculateFrequencyWithConfidence(styles);
    return frequencies.map(f => ({
      style: f.item,
      confidence: f.confidence
    }));
  }

  private extractColorPreferences(tests: BrandAnalysisResult[]): { palette: string[]; confidence: number }[] {
    const palettes = tests.map(t => t.results.analysis.color_palette);
    const frequencies = this.calculateFrequencyWithConfidence(palettes);
    return frequencies.map(f => ({
      palette: f.item,
      confidence: f.confidence
    }));
  }

  private extractCompositionPatterns(tests: BrandAnalysisResult[]): { pattern: string; frequency: number }[] {
    const patterns = tests.map(t => t.results.analysis.composition);
    return this.calculateFrequency(patterns);
  }

  private extractSuccessfulElements(tests: BrandAnalysisResult[]): string[] {
    return Array.from(new Set(
      tests.flatMap(t => t.results.analysis.focal_points)
    ));
  }

  private calculateFrequencyWithConfidence<T>(items: T[]): { item: T; confidence: number }[] {
    const frequency = items.reduce((acc, item) => {
      acc[String(item)] = (acc[String(item)] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(frequency)
      .map(([item, count]) => ({
        item: JSON.parse(item) as T,
        confidence: count / items.length
      }))
      .sort((a, b) => b.confidence - a.confidence);
  }

  private calculateFrequency<T>(items: T[]): { pattern: string; frequency: number }[] {
    const frequency = items.reduce((acc, item) => {
      acc[String(item)] = (acc[String(item)] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(frequency)
      .map(([pattern, count]) => ({
        pattern,
        frequency: count / items.length
      }))
      .sort((a, b) => b.frequency - a.frequency);
  }
} 