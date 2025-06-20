import { BrandConfig, BrandDNA } from '../types';
import { AppError } from '../utils/errors';
import { AIService } from './AIService';
import { DatabaseService } from './DatabaseService';

interface SEOAnalysis {
  title: {
    length: number;
    hasKeywords: boolean;
    score: number;
  };
  description: {
    length: number;
    hasKeywords: boolean;
    score: number;
  };
  content: {
    wordCount: number;
    keywordDensity: number;
    readability: number;
    score: number;
  };
  images: {
    count: number;
    hasAltText: boolean;
    score: number;
  };
  overall: {
    score: number;
    suggestions: string[];
  };
}

interface ContentOptimizationResult {
  original: string;
  optimized: string;
  seoAnalysis: SEOAnalysis;
  improvements: string[];
  confidence: number;
}

export class ContentOptimizer {
  private static instance: ContentOptimizer;
  private ai: AIService;
  private db: DatabaseService;

  private constructor() {
    this.ai = AIService.getInstance();
    this.db = DatabaseService.getInstance();
  }

  public static getInstance(): ContentOptimizer {
    if (!ContentOptimizer.instance) {
      ContentOptimizer.instance = new ContentOptimizer();
    }
    return ContentOptimizer.instance;
  }

  async optimizeContent(
    brandId: string,
    type: 'product' | 'collection' | 'page',
    content: string,
    metadata: {
      title?: string;
      description?: string;
      keywords?: string[];
      images?: { alt?: string }[];
    } = {}
  ): Promise<ContentOptimizationResult> {
    try {
      const brandConfig = await this.db.getById('brand_configs', brandId) as unknown as BrandConfig;
      if (!brandConfig.settings.content_optimization) {
        throw new AppError(403, 'CONTENT_OPTIMIZATION_DISABLED', 'Content optimization is not enabled for this brand');
      }

      const brandDNA = await this.getBrandDNA(brandId);
      const seoAnalysis = await this.analyzeSEO(content, metadata);
      const optimization = await this.ai.optimizeContent(content, brandDNA, type);

      const result: ContentOptimizationResult = {
        original: content,
        optimized: optimization.optimized,
        seoAnalysis,
        improvements: [
          ...optimization.improvements,
          ...seoAnalysis.overall.suggestions
        ],
        confidence: optimization.confidence
      };

      // Log the optimization event
      await this.db.create('events', {
        brand_id: brandId,
        type: 'content_optimization',
        data: {
          content_type: type,
          seo_analysis: seoAnalysis,
          improvements: result.improvements
        },
        created_at: new Date().toISOString()
      });

      return result;
    } catch (error) {
      throw new AppError(500, 'CONTENT_OPTIMIZATION_FAILED', 'Failed to optimize content', error);
    }
  }

  private async getBrandDNA(brandId: string): Promise<BrandDNA> {
    try {
      const brand = await this.db.getById('brands', brandId);
      if (!brand) {
        throw new AppError(404, 'BRAND_NOT_FOUND', 'Brand not found');
      }

      // Get recent products to analyze brand DNA
      const products = await this.db.list('products', {
        brand_id: brandId,
        limit: 10,
        order: { created_at: 'desc' }
      });

      return this.ai.analyzeBrandDNA(products as unknown as any[]);
    } catch (error) {
      throw new AppError(500, 'BRAND_DNA_FAILED', 'Failed to get brand DNA', error);
    }
  }

  private async analyzeSEO(
    content: string,
    metadata: {
      title?: string;
      description?: string;
      keywords?: string[];
      images?: { alt?: string }[];
    }
  ): Promise<SEOAnalysis> {
    const analysis: SEOAnalysis = {
      title: {
        length: metadata.title?.length || 0,
        hasKeywords: this.checkKeywordsInText(metadata.title || '', metadata.keywords || []),
        score: 0
      },
      description: {
        length: metadata.description?.length || 0,
        hasKeywords: this.checkKeywordsInText(metadata.description || '', metadata.keywords || []),
        score: 0
      },
      content: {
        wordCount: this.countWords(content),
        keywordDensity: this.calculateKeywordDensity(content, metadata.keywords || []),
        readability: this.calculateReadability(content),
        score: 0
      },
      images: {
        count: metadata.images?.length || 0,
        hasAltText: this.checkImagesAltText(metadata.images || []),
        score: 0
      },
      overall: {
        score: 0,
        suggestions: []
      }
    };

    // Calculate scores
    analysis.title.score = this.calculateTitleScore(analysis.title);
    analysis.description.score = this.calculateDescriptionScore(analysis.description);
    analysis.content.score = this.calculateContentScore(analysis.content);
    analysis.images.score = this.calculateImagesScore(analysis.images);

    // Calculate overall score
    analysis.overall.score = this.calculateOverallScore(analysis);

    // Generate suggestions
    analysis.overall.suggestions = this.generateSuggestions(analysis);

    return analysis;
  }

  private checkKeywordsInText(text: string, keywords: string[]): boolean {
    return keywords.some(keyword =>
      text.toLowerCase().includes(keyword.toLowerCase())
    );
  }

  private countWords(text: string): number {
    return text.trim().split(/\s+/).length;
  }

  private calculateKeywordDensity(text: string, keywords: string[]): number {
    const wordCount = this.countWords(text);
    if (wordCount === 0) return 0;

    const keywordCount = keywords.reduce((count, keyword) => {
      const regex = new RegExp(keyword, 'gi');
      const matches = text.match(regex);
      return count + (matches ? matches.length : 0);
    }, 0);

    return (keywordCount / wordCount) * 100;
  }

  private calculateReadability(text: string): number {
    // Simple Flesch Reading Ease score
    const words = text.split(/\s+/);
    const sentences = text.split(/[.!?]+/).filter(Boolean);
    const syllables = this.countSyllables(text);

    if (sentences.length === 0 || words.length === 0) return 0;

    return (
      206.835 -
      1.015 * (words.length / sentences.length) -
      84.6 * (syllables / words.length)
    );
  }

  private countSyllables(text: string): number {
    // Simple syllable counting
    return text
      .toLowerCase()
      .replace(/[^a-z]/g, '')
      .split('')
      .filter(char => 'aeiou'.includes(char)).length;
  }

  private checkImagesAltText(images: { alt?: string }[]): boolean {
    return images.every(image => image.alt && image.alt.length > 0);
  }

  private calculateTitleScore(title: SEOAnalysis['title']): number {
    let score = 0;
    if (title.length >= 30 && title.length <= 60) score += 50;
    if (title.hasKeywords) score += 50;
    return score;
  }

  private calculateDescriptionScore(description: SEOAnalysis['description']): number {
    let score = 0;
    if (description.length >= 120 && description.length <= 160) score += 50;
    if (description.hasKeywords) score += 50;
    return score;
  }

  private calculateContentScore(content: SEOAnalysis['content']): number {
    let score = 0;
    if (content.wordCount >= 300) score += 30;
    if (content.keywordDensity >= 1 && content.keywordDensity <= 3) score += 30;
    if (content.readability >= 60) score += 40;
    return score;
  }

  private calculateImagesScore(images: SEOAnalysis['images']): number {
    let score = 0;
    if (images.count > 0) score += 50;
    if (images.hasAltText) score += 50;
    return score;
  }

  private calculateOverallScore(analysis: SEOAnalysis): number {
    return (
      analysis.title.score * 0.2 +
      analysis.description.score * 0.2 +
      analysis.content.score * 0.4 +
      analysis.images.score * 0.2
    );
  }

  private generateSuggestions(analysis: SEOAnalysis): string[] {
    const suggestions: string[] = [];

    // Title suggestions
    if (analysis.title.length < 30) {
      suggestions.push('Title is too short. Aim for 30-60 characters.');
    } else if (analysis.title.length > 60) {
      suggestions.push('Title is too long. Keep it under 60 characters.');
    }
    if (!analysis.title.hasKeywords) {
      suggestions.push('Include target keywords in the title.');
    }

    // Description suggestions
    if (analysis.description.length < 120) {
      suggestions.push('Meta description is too short. Aim for 120-160 characters.');
    } else if (analysis.description.length > 160) {
      suggestions.push('Meta description is too long. Keep it under 160 characters.');
    }
    if (!analysis.description.hasKeywords) {
      suggestions.push('Include target keywords in the meta description.');
    }

    // Content suggestions
    if (analysis.content.wordCount < 300) {
      suggestions.push('Content is too short. Aim for at least 300 words.');
    }
    if (analysis.content.keywordDensity < 1) {
      suggestions.push('Increase keyword density to at least 1%.');
    } else if (analysis.content.keywordDensity > 3) {
      suggestions.push('Reduce keyword density to avoid keyword stuffing.');
    }
    if (analysis.content.readability < 60) {
      suggestions.push('Improve content readability for better user engagement.');
    }

    // Image suggestions
    if (analysis.images.count === 0) {
      suggestions.push('Add relevant images to improve engagement.');
    }
    if (!analysis.images.hasAltText) {
      suggestions.push('Add alt text to all images for better accessibility and SEO.');
    }

    return suggestions;
  }
} 