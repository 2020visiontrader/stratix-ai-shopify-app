import { ShopifyAPI } from '../integrations/shopify/ShopifyAPI';
import { db } from '../lib/supabase';
import { BrandDNA } from '../types';
import { EvolutionLogger } from './EvolutionLogger';

interface SEOMetadata {
  title: string;
  description: string;
  h1: string;
  url: string;
  productId: string;
}

interface SEORewriteResult {
  original: SEOMetadata;
  rewritten: SEOMetadata;
  metrics: {
    titleLength: number;
    descriptionLength: number;
    keywordDensity: number;
    brandToneScore: number;
  };
  timestamp: Date;
}

export class SEOMetaRewriter {
  private shopify: ShopifyAPI;
  private evolutionLogger: EvolutionLogger;
  private brandDNA!: BrandDNA;
  private brandId: string;

  constructor(brandId: string) {
    this.brandId = brandId;
    this.shopify = new ShopifyAPI(brandId);
    this.evolutionLogger = new EvolutionLogger(brandId);
  }

  async initialize() {
    // Load brand DNA for tone and strategy
    const { data: brand } = await db
      .from('brands')
      .select('*')
      .eq('id', this.brandId)
      .single();

    if (!brand) {
      throw new Error('Brand not found');
    }

    this.brandDNA = brand;
  }

  async rewriteProductMeta(productId: string): Promise<SEORewriteResult> {
    if (!this.brandDNA) {
      await this.initialize();
    }

    // Get current product metadata
    const original = await this.getProductMetadata(productId);

    // Analyze current content
    const analysis = await this.analyzeMetadata(original);

    // Generate new content
    const rewritten = await this.generateOptimizedMeta(original, analysis);

    // Log the evolution
    await this.evolutionLogger.log({
      type: 'CONTENT_CHANGE',
      timestamp: new Date(),
      trigger: {
        source: 'meta_rewriter',
        action: 'optimize_product_meta',
        metadata: { productId }
      },
      changes: {
        before: original,
        after: rewritten,
        impact_areas: ['product_meta', 'seo']
      },
      metrics: {
        performance_delta:
          (rewritten.title.length - original.title.length) / (original.title.length || 1)
      }
    });

    return {
      original,
      rewritten,
      metrics: {
        titleLength: rewritten.title.length,
        descriptionLength: rewritten.description.length,
        keywordDensity: analysis.keywordDensity,
        brandToneScore: analysis.brandToneScore
      },
      timestamp: new Date()
    };
  }

  private async getProductMetadata(productId: string): Promise<SEOMetadata> {
    const product = await this.shopify.getProduct(productId);
    return {
      title: product.metafields?.seo_title || product.title,
      description: product.metafields?.seo_description || product.description,
      h1: product.title,
      url: product.handle,
      productId
    };
  }

  private async analyzeMetadata(meta: SEOMetadata) {
    // Analyze keyword density
    const keywordDensity = this.calculateKeywordDensity(meta);

    // Check brand tone alignment
    const brandToneScore = await this.checkBrandToneAlignment(meta);

    // Get competitor analysis
    const competitorInsights = await this.analyzeCompetitorMeta(meta);

    return {
      keywordDensity,
      brandToneScore,
      competitorInsights
    };
  }

  private async generateOptimizedMeta(
    original: SEOMetadata,
    analysis: any
  ): Promise<SEOMetadata> {
    // Apply brand tone and competitor insights
    const optimizedTitle = await this.optimizeTitle(original.title, analysis);
    const optimizedDescription = await this.optimizeDescription(
      original.description,
      analysis
    );
    const optimizedH1 = await this.optimizeH1(original.h1, analysis);

    return {
      ...original,
      title: this.enforceCharacterLimits(optimizedTitle, 60),
      description: this.enforceCharacterLimits(optimizedDescription, 160),
      h1: optimizedH1
    };
  }

  private calculateKeywordDensity(meta: SEOMetadata): number {
    // Implementation for keyword density calculation
    const text = `${meta.title} ${meta.description} ${meta.h1}`.toLowerCase();
    // Simple keyword density calculation
    const words = text.split(/\s+/);
    const wordCount = words.length;
    const uniqueWords = new Set(words);
    return uniqueWords.size / wordCount;
  }

  private async checkBrandToneAlignment(meta: SEOMetadata): Promise<number> {
    // Compare with brand DNA tone preferences
    if (!this.brandDNA?.tone_preferences) {
      return 0.5; // Default neutral score
    }
    
    // Simple tone alignment calculation
    const text = `${meta.title} ${meta.description}`.toLowerCase();
    const toneKeywords = this.brandDNA.tone_preferences.preferred_words || [];
    
    let matches = 0;
    toneKeywords.forEach((keyword: string) => {
      if (text.includes(keyword.toLowerCase())) {
        matches++;
      }
    });
    
    return Math.min(matches / Math.max(toneKeywords.length, 1), 1);
  }

  private async analyzeCompetitorMeta(meta: SEOMetadata) {
    // Placeholder for competitor analysis
    return {
      avgTitleLength: 50,
      avgDescriptionLength: 140,
      commonKeywords: []
    };
  }

  private async optimizeTitle(title: string, analysis: any): Promise<string> {
    // Apply optimization rules based on analysis
    let optimized = title;
    
    // Ensure title is within optimal length
    if (title.length < 30) {
      optimized = `${title} - ${this.brandDNA?.name || 'Premium Quality'}`;
    }
    
    return optimized;
  }

  private async optimizeDescription(
    description: string,
    analysis: any
  ): Promise<string> {
    // Apply optimization rules based on analysis
    let optimized = description;
    
    // Ensure description has call-to-action if missing
    if (!description.toLowerCase().includes('buy') && 
        !description.toLowerCase().includes('shop') &&
        !description.toLowerCase().includes('order')) {
      optimized = `${description} Shop now for the best deals!`;
    }
    
    return optimized;
  }

  private async optimizeH1(h1: string, analysis: any): Promise<string> {
    // Apply optimization rules based on analysis
    return h1; // Keep H1 simple for now
  }

  private enforceCharacterLimits(text: string, limit: number): string {
    if (text.length <= limit) return text;
    return text.substring(0, limit - 3) + '...';
  }
}