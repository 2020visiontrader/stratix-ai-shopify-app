import { OpenAIClient } from '@/lib/openai';
import { AppError } from '@/utils/errorHandling';

interface Framework {
  id: string;
  name: string;
  description: string;
  components: FrameworkComponent[];
  effectiveness: number;
  usageCount: number;
}

interface FrameworkComponent {
  name: string;
  description: string;
  importance: number;
  examples: string[];
}

interface ExtractionResult {
  frameworks: Framework[];
  bestMatch: Framework;
  confidence: number;
  suggestions: string[];
}

export class FrameworkExtractor {
  private static instance: FrameworkExtractor;
  private readonly openai: OpenAIClient;
  private frameworks: Map<string, Framework>;

  private constructor() {
    this.openai = OpenAIClient.getInstance();
    this.frameworks = new Map();
    this.initializeDefaultFrameworks();
  }

  public static getInstance(): FrameworkExtractor {
    if (!FrameworkExtractor.instance) {
      FrameworkExtractor.instance = new FrameworkExtractor();
    }
    return FrameworkExtractor.instance;
  }

  private initializeDefaultFrameworks(): void {
    const defaultFrameworks: Framework[] = [
      {
        id: 'aida',
        name: 'AIDA',
        description: 'Attention, Interest, Desire, Action framework for sales copy',
        components: [
          {
            name: 'Attention',
            description: 'Grab the reader\'s attention with a compelling headline or opening',
            importance: 1,
            examples: ['How to double your sales in 30 days', 'The secret to successful e-commerce']
          },
          {
            name: 'Interest',
            description: 'Build interest by highlighting benefits and features',
            importance: 0.8,
            examples: ['Discover how our solution can transform your business', 'Learn the proven strategies']
          },
          {
            name: 'Desire',
            description: 'Create desire by showing value and solving problems',
            importance: 0.9,
            examples: ['Imagine the possibilities', 'Experience the difference']
          },
          {
            name: 'Action',
            description: 'Drive action with clear calls-to-action',
            importance: 1,
            examples: ['Get started today', 'Claim your free trial']
          }
        ],
        effectiveness: 0.85,
        usageCount: 0
      },
      {
        id: 'pas',
        name: 'PAS',
        description: 'Problem, Agitation, Solution framework for persuasive writing',
        components: [
          {
            name: 'Problem',
            description: 'Identify the problem or pain point',
            importance: 1,
            examples: ['Struggling with low conversion rates?', 'Tired of wasted ad spend?']
          },
          {
            name: 'Agitation',
            description: 'Amplify the problem and its consequences',
            importance: 0.9,
            examples: ['Every day you delay costs you money', 'Your competitors are already ahead']
          },
          {
            name: 'Solution',
            description: 'Present your solution',
            importance: 1,
            examples: ['Our proven system solves this', 'Here\'s how we can help']
          }
        ],
        effectiveness: 0.8,
        usageCount: 0
      }
    ];

    defaultFrameworks.forEach(framework => {
      this.frameworks.set(framework.id, framework);
    });
  }

  public async extractFrameworks(content: string): Promise<ExtractionResult> {
    try {
      // Analyze content for framework patterns
      const analysis = await this.analyzeContent(content);

      // Match content against known frameworks
      const matches = await this.matchFrameworks(analysis);

      // Generate suggestions for improvement
      const suggestions = await this.generateSuggestions(content, matches);

      // Update framework usage counts
      matches.forEach(framework => {
        const existing = this.frameworks.get(framework.id);
        if (existing) {
          this.frameworks.set(framework.id, {
            ...existing,
            usageCount: existing.usageCount + 1
          });
        }
      });

      return {
        frameworks: matches,
        bestMatch: matches[0],
        confidence: this.calculateConfidence(matches),
        suggestions
      };
    } catch (error) {
      throw new AppError(
        'Failed to extract frameworks',
        500,
        error instanceof Error ? error.message : undefined
      );
    }
  }

  private async analyzeContent(content: string): Promise<string> {
    const prompt = `
      Analyze the following content for marketing and sales frameworks:
      ${content}

      Identify any patterns, structures, or frameworks used in the content.
      Focus on common frameworks like AIDA, PAS, FAB, etc.
    `;

    return await this.openai.createCompletion({
      model: 'gpt-4',
      prompt,
      maxTokens: 500,
      temperature: 0.7
    });
  }

  private async matchFrameworks(analysis: string): Promise<Framework[]> {
    const prompt = `
      Based on the following analysis, match the content to known marketing frameworks:
      ${analysis}

      Available frameworks:
      ${Array.from(this.frameworks.values()).map(f => f.name).join(', ')}

      Provide a detailed match for each framework found, including confidence level.
    `;

    const response = await this.openai.createCompletion({
      model: 'gpt-4',
      prompt,
      maxTokens: 500,
      temperature: 0.7
    });

    // Parse framework matches from response
    const matches: Framework[] = [];
    const lines = response.split('\n');

    for (const line of lines) {
      const frameworkName = line.split(':')[0]?.trim();
      if (frameworkName) {
        const framework = Array.from(this.frameworks.values())
          .find(f => f.name.toLowerCase() === frameworkName.toLowerCase());
        if (framework) {
          matches.push(framework);
        }
      }
    }

    return matches;
  }

  private async generateSuggestions(
    content: string,
    matches: Framework[]
  ): Promise<string[]> {
    const prompt = `
      Based on the following content and matched frameworks, provide specific suggestions for improvement:
      Content: ${content}
      Matched Frameworks: ${matches.map(m => m.name).join(', ')}

      Focus on how to better align the content with the frameworks and improve effectiveness.
    `;

    const response = await this.openai.createCompletion({
      model: 'gpt-4',
      prompt,
      maxTokens: 300,
      temperature: 0.7
    });

    return response
      .split('\n')
      .filter(line => line.trim().startsWith('-'))
      .map(line => line.trim().substring(1).trim());
  }

  private calculateConfidence(matches: Framework[]): number {
    if (matches.length === 0) return 0;

    const totalEffectiveness = matches.reduce(
      (sum, framework) => sum + framework.effectiveness,
      0
    );

    return totalEffectiveness / matches.length;
  }

  public getFramework(id: string): Framework {
    const framework = this.frameworks.get(id);
    if (!framework) {
      throw new AppError('Framework not found', 404);
    }
    return { ...framework };
  }

  public getAllFrameworks(): Framework[] {
    return Array.from(this.frameworks.values());
  }

  public async addFramework(framework: Omit<Framework, 'id' | 'usageCount'>): Promise<Framework> {
    const id = crypto.randomUUID();
    const newFramework: Framework = {
      id,
      ...framework,
      usageCount: 0
    };

    this.frameworks.set(id, newFramework);
    return newFramework;
  }
}
