import OpenAI from 'openai';
import { db } from '../lib/supabase';
import { AIEvolutionLogger } from './AIEvolutionLogger';

interface Framework {
  id: string;
  category: 'hook' | 'copy' | 'cta' | 'positioning';
  title: string;
  description: string;
  structure: string;
  examples: string[];
  source: {
    text_id: string;
    context: string;
  };
  metadata: {
    effectiveness_score: number;
    complexity_score: number;
    versatility_score: number;
    extracted_date: Date;
  };
}

interface TextBlock {
  id: string;
  content: string;
  embedding: number[];
  metadata?: Record<string, any>;
}

export class FrameworkExtractor {
  private static instance: FrameworkExtractor;
  private evolutionLogger: AIEvolutionLogger;
  private openai: OpenAI;
  
  private constructor() {
    this.evolutionLogger = AIEvolutionLogger.getInstance();
    this.openai = new OpenAI();
  }

  public static getInstance(): FrameworkExtractor {
    if (!FrameworkExtractor.instance) {
      FrameworkExtractor.instance = new FrameworkExtractor();
    }
    return FrameworkExtractor.instance;
  }

  public async extractFrameworks(textBlock: TextBlock): Promise<Framework[]> {
    try {
      // Vectorize text for similarity search
      const textEmbedding = await this.generateEmbedding(textBlock.content);

      // Identify potential frameworks
      const frameworks = await this.identifyFrameworks(textBlock);

      // Store frameworks
      await this.storeFrameworks(frameworks);

      // Log extraction
      await this.logExtraction(textBlock.id, frameworks);

      return frameworks;

    } catch (error) {
      console.error('Error extracting frameworks:', error);
      throw error;
    }
  }

  private async identifyFrameworks(textBlock: TextBlock): Promise<Framework[]> {
    const frameworks: Framework[] = [];

    // Identify hooks (AIDA, PAS, etc.)
    const hookFrameworks = await this.extractHookFrameworks(textBlock);
    frameworks.push(...hookFrameworks);

    // Identify copy templates
    const copyFrameworks = await this.extractCopyFrameworks(textBlock);
    frameworks.push(...copyFrameworks);

    // Identify CTA structures
    const ctaFrameworks = await this.extractCTAFrameworks(textBlock);
    frameworks.push(...ctaFrameworks);

    // Identify positioning models
    const positioningFrameworks = await this.extractPositioningFrameworks(textBlock);
    frameworks.push(...positioningFrameworks);

    return frameworks;
  }

  private async extractHookFrameworks(textBlock: TextBlock): Promise<Framework[]> {
    const prompt = `Identify any AIDA (Attention, Interest, Desire, Action) or PAS (Problem, Agitation, Solution) frameworks in this text. Extract the structure and examples.

Text: "${textBlock.content.substring(0, 1000)}..."

Respond in JSON format:
{
  "frameworks": [{
    "type": "AIDA|PAS",
    "structure": "step by step structure",
    "examples": ["example1", "example2"]
  }]
}`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 500
    });

    try {
      const result = JSON.parse(response.choices[0].message.content);
      return result.frameworks.map((f: any) => ({
        id: this.generateFrameworkId('hook', f.type),
        category: 'hook',
        title: f.type,
        description: this.generateFrameworkDescription(f),
        structure: f.structure,
        examples: f.examples,
        source: {
          text_id: textBlock.id,
          context: textBlock.content.substring(0, 200)
        },
        metadata: {
          effectiveness_score: this.calculateEffectivenessScore(f),
          complexity_score: this.calculateComplexityScore(f),
          versatility_score: this.calculateVersatilityScore(f),
          extracted_date: new Date()
        }
      }));
    } catch (error) {
      console.error('Error parsing hook frameworks:', error);
      return [];
    }
  }

  private async extractCopyFrameworks(textBlock: TextBlock): Promise<Framework[]> {
    const prompt = `Identify reusable copywriting templates or patterns in this text. Look for structures that could be applied to different products or services.

Text: "${textBlock.content.substring(0, 1000)}..."

Respond in JSON format:
{
  "templates": [{
    "name": "template name",
    "structure": "template structure",
    "examples": ["example1", "example2"]
  }]
}`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 500
    });

    try {
      const result = JSON.parse(response.choices[0].message.content);
      return result.templates.map((t: any) => ({
        id: this.generateFrameworkId('copy', t.name),
        category: 'copy',
        title: t.name,
        description: this.generateFrameworkDescription(t),
        structure: t.structure,
        examples: t.examples,
        source: {
          text_id: textBlock.id,
          context: textBlock.content.substring(0, 200)
        },
        metadata: {
          effectiveness_score: this.calculateEffectivenessScore(t),
          complexity_score: this.calculateComplexityScore(t),
          versatility_score: this.calculateVersatilityScore(t),
          extracted_date: new Date()
        }
      }));
    } catch (error) {
      console.error('Error parsing copy frameworks:', error);
      return [];
    }
  }

  private async extractCTAFrameworks(textBlock: TextBlock): Promise<Framework[]> {
    const prompt = `Identify call-to-action (CTA) patterns or structures in this text. Look for effective ways to prompt action.

Text: "${textBlock.content.substring(0, 1000)}..."

Respond in JSON format:
{
  "cta_patterns": [{
    "name": "pattern name",
    "structure": "pattern structure",
    "examples": ["example1", "example2"]
  }]
}`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 500
    });

    try {
      const result = JSON.parse(response.choices[0].message.content);
      return result.cta_patterns.map((p: any) => ({
        id: this.generateFrameworkId('cta', p.name),
        category: 'cta',
        title: p.name,
        description: this.generateFrameworkDescription(p),
        structure: p.structure,
        examples: p.examples,
        source: {
          text_id: textBlock.id,
          context: textBlock.content.substring(0, 200)
        },
        metadata: {
          effectiveness_score: this.calculateEffectivenessScore(p),
          complexity_score: this.calculateComplexityScore(p),
          versatility_score: this.calculateVersatilityScore(p),
          extracted_date: new Date()
        }
      }));
    } catch (error) {
      console.error('Error parsing CTA frameworks:', error);
      return [];
    }
  }

  private async extractPositioningFrameworks(textBlock: TextBlock): Promise<Framework[]> {
    const prompt = `Identify brand positioning frameworks or models in this text (e.g., Blue Ocean Strategy, Challenger Brand, etc.).

Text: "${textBlock.content.substring(0, 1000)}..."

Respond in JSON format:
{
  "positioning_models": [{
    "name": "model name",
    "structure": "model structure",
    "examples": ["example1", "example2"]
  }]
}`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 500
    });

    try {
      const result = JSON.parse(response.choices[0].message.content);
      return result.positioning_models.map((m: any) => ({
        id: this.generateFrameworkId('positioning', m.name),
        category: 'positioning',
        title: m.name,
        description: this.generateFrameworkDescription(m),
        structure: m.structure,
        examples: m.examples,
        source: {
          text_id: textBlock.id,
          context: textBlock.content.substring(0, 200)
        },
        metadata: {
          effectiveness_score: this.calculateEffectivenessScore(m),
          complexity_score: this.calculateComplexityScore(m),
          versatility_score: this.calculateVersatilityScore(m),
          extracted_date: new Date()
        }
      }));
    } catch (error) {
      console.error('Error parsing positioning frameworks:', error);
      return [];
    }
  }

  private async generateEmbedding(text: string): Promise<number[]> {
    const response = await this.openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: text.substring(0, 8000) // Limit to ~2000 tokens
    });

    return response.data[0].embedding;
  }

  private generateFrameworkId(category: Framework['category'], name: string): string {
    return `${category}_${name.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`;
  }

  private generateFrameworkDescription(framework: any): string {
    const type = framework.type || framework.name;
    const structure = framework.structure;
    
    return `A ${type} framework that follows the structure: ${structure}`;
  }

  private calculateEffectivenessScore(framework: any): number {
    // Score based on structure completeness and example quality
    const structureScore = framework.structure ? 0.5 : 0;
    const exampleScore = (framework.examples?.length || 0) * 0.25;
    
    return Math.min(structureScore + exampleScore, 1);
  }

  private calculateComplexityScore(framework: any): number {
    // Score based on number of steps/components
    const steps = framework.structure.split(/[.,;]/).length;
    return Math.min(steps / 10, 1); // Normalize to 0-1
  }

  private calculateVersatilityScore(framework: any): number {
    // Score based on example variety and structure flexibility
    const exampleVariety = new Set(
      framework.examples?.map((e: string) => e.split(' ')[0].toLowerCase())
    ).size;
    
    return Math.min((exampleVariety * 0.2) + 0.4, 1);
  }

  private async storeFrameworks(frameworks: Framework[]): Promise<void> {
    await db.frameworks.createMany(frameworks);
  }

  private async logExtraction(textId: string, frameworks: Framework[]): Promise<void> {
    await this.evolutionLogger.logEvolution('system', {
      type: 'MODEL_ADJUSTMENT',
      trigger: {
        source: 'framework_extractor',
        action: 'framework_extraction',
        metadata: {
          text_id: textId,
          framework_count: frameworks.length,
          categories: frameworks.map(f => f.category)
        }
      },
      changes: {
        before: { frameworks: 'previous' },
        after: { frameworks: 'updated' },
        impact_areas: ['content_generation', 'strategic_reasoning']
      }
    });
  }
} 