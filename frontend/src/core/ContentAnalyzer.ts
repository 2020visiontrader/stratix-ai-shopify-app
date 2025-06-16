import { OpenAIClient } from '@/lib/openai';
import { AppError } from '@/utils/errorHandling';

interface ContentAnalysis {
  id: string;
  content: string;
  metrics: ContentMetrics;
  suggestions: string[];
  timestamp: Date;
}

interface ContentMetrics {
  readability: number;
  engagement: number;
  seoScore: number;
  sentiment: number;
  keywordDensity: number;
  wordCount: number;
}

interface AnalysisResult {
  analysis: ContentAnalysis;
  improvements: string[];
  priority: 'high' | 'medium' | 'low';
}

export class ContentAnalyzer {
  private static instance: ContentAnalyzer;
  private readonly openai: OpenAIClient;
  private analyses: Map<string, ContentAnalysis>;

  private constructor() {
    this.openai = OpenAIClient.getInstance();
    this.analyses = new Map();
  }

  public static getInstance(): ContentAnalyzer {
    if (!ContentAnalyzer.instance) {
      ContentAnalyzer.instance = new ContentAnalyzer();
    }
    return ContentAnalyzer.instance;
  }

  public async analyzeContent(content: string): Promise<AnalysisResult> {
    try {
      // Generate content metrics
      const metrics = await this.generateMetrics(content);

      // Generate suggestions
      const suggestions = await this.generateSuggestions(content, metrics);

      // Create analysis
      const analysis: ContentAnalysis = {
        id: crypto.randomUUID(),
        content,
        metrics,
        suggestions,
        timestamp: new Date()
      };

      this.analyses.set(analysis.id, analysis);

      // Determine priority
      const priority = this.determinePriority(metrics);

      // Generate improvements
      const improvements = await this.generateImprovements(content, metrics, priority);

      return {
        analysis,
        improvements,
        priority
      };
    } catch (error) {
      throw new AppError(
        'Failed to analyze content',
        500,
        error instanceof Error ? error.message : undefined
      );
    }
  }

  private async generateMetrics(content: string): Promise<ContentMetrics> {
    const prompt = `
      Analyze the following content and provide metrics:
      ${content}

      Calculate:
      1. Readability score (0-100)
      2. Engagement score (0-100)
      3. SEO score (0-100)
      4. Sentiment score (-1 to 1)
      5. Keyword density (0-1)
      6. Word count

      Provide the metrics in JSON format.
    `;

    const response = await this.openai.createCompletion({
      model: 'gpt-4',
      prompt,
      maxTokens: 300,
      temperature: 0.7
    });

    try {
      return JSON.parse(response) as ContentMetrics;
    } catch (error) {
      throw new AppError('Failed to parse metrics', 500);
    }
  }

  private async generateSuggestions(
    content: string,
    metrics: ContentMetrics
  ): Promise<string[]> {
    const prompt = `
      Based on the following content and metrics, provide specific suggestions for improvement:
      Content: ${content}
      Metrics: ${JSON.stringify(metrics, null, 2)}

      Focus on actionable recommendations that will improve the content quality.
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

  private determinePriority(metrics: ContentMetrics): 'high' | 'medium' | 'low' {
    const scores = [
      metrics.readability,
      metrics.engagement,
      metrics.seoScore
    ];

    const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;

    if (averageScore < 50) return 'high';
    if (averageScore < 75) return 'medium';
    return 'low';
  }

  private async generateImprovements(
    content: string,
    metrics: ContentMetrics,
    priority: 'high' | 'medium' | 'low'
  ): Promise<string[]> {
    const prompt = `
      Based on the following content, metrics, and priority level, provide specific improvements:
      Content: ${content}
      Metrics: ${JSON.stringify(metrics, null, 2)}
      Priority: ${priority}

      Focus on the most critical improvements first, considering the priority level.
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

  public getAnalysis(id: string): ContentAnalysis {
    const analysis = this.analyses.get(id);
    if (!analysis) {
      throw new AppError('Analysis not found', 404);
    }
    return { ...analysis };
  }

  public getAllAnalyses(): ContentAnalysis[] {
    return Array.from(this.analyses.values());
  }

  public getRecentAnalyses(limit: number = 10): ContentAnalysis[] {
    return this.getAllAnalyses()
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  public async compareAnalyses(ids: string[]): Promise<{
    improvements: string[];
    trends: string[];
  }> {
    const analyses = ids.map(id => this.getAnalysis(id));
    if (analyses.length < 2) {
      throw new AppError('Need at least 2 analyses to compare', 400);
    }

    const prompt = `
      Compare the following content analyses and identify improvements and trends:
      ${JSON.stringify(analyses, null, 2)}

      Focus on:
      1. Key improvements made
      2. Emerging trends
      3. Areas still needing attention
    `;

    const response = await this.openai.createCompletion({
      model: 'gpt-4',
      prompt,
      maxTokens: 500,
      temperature: 0.7
    });

    try {
      const result = JSON.parse(response);
      return {
        improvements: result.improvements || [],
        trends: result.trends || []
      };
    } catch (error) {
      throw new AppError('Failed to parse comparison results', 500);
    }
  }
} 