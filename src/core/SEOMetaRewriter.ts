import { ShopifyAPI } from '../integrations/shopify/ShopifyAPI';
import { db } from '../lib/supabase';
import { BrandDNA } from '../types/database';
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
      },
      timestamp: new Date()
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
    // ... keyword density calculation logic
    return 0; // Placeholder
  }

  private async checkBrandToneAlignment(meta: SEOMetadata): Promise<number> {
    // Compare with brand DNA tone preferences
    const tone = this.brandDNA.tone_preferences;
    // ... tone alignment calculation logic
    return 0; // Placeholder
  }

  private async analyzeCompetitorMeta(meta: SEOMetadata) {
    // Get competitor meta data and analyze patterns
    // ... competitor analysis logic
    return {}; // Placeholder
  }

  private async optimizeTitle(title: string, analysis: any): Promise<string> {
    // Apply optimization rules based on analysis
    // ... title optimization logic
    return title; // Placeholder
  }

  private async optimizeDescription(
    description: string,
    analysis: any
  ): Promise<string> {
    // Apply optimization rules based on analysis
    // ... description optimization logic
    return description; // Placeholder
  }

  private async optimizeH1(h1: string, analysis: any): Promise<string> {
    // Apply optimization rules based on analysis
    // ... h1 optimization logic
    return h1; // Placeholder
  }

  private enforceCharacterLimits(text: string, limit: number): string {
    if (text.length <= limit) return text;
    return text.substring(0, limit - 3) + '...';
  }
} 