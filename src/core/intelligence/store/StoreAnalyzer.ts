import { openai } from '../../../lib/openai';
import { db } from '../../../lib/supabase';
import { BrandDNAAnalyzer } from '../brand/BrandDNAAnalyzer';

interface StoreSnapshot {
  products: {
    id: string;
    title: string;
    description: string;
    images: string[];
    price_range: {
      min: number;
      max: number;
    };
    analysis: {
      word_count: number;
      tone_profile: {
        formality: number;
        emotion: string;
        persuasion_style: string;
      };
      cta_structure: {
        type: string;
        placement: string;
        language: string;
      };
    };
  }[];
  brand_tone: {
    voice_characteristics: string[];
    common_phrases: string[];
    writing_style: string;
  };
  visual_style: {
    color_palette: string[];
    image_style: string;
    layout_preferences: string[];
  };
  pricing_strategy: {
    tiers: {
      name: string;
      price_range: {
        min: number;
        max: number;
      };
      product_count: number;
    }[];
    average_price: number;
  };
}

export class StoreAnalyzer {
  private static instance: StoreAnalyzer;
  private brandAnalyzer: BrandDNAAnalyzer;

  private constructor() {
    this.brandAnalyzer = BrandDNAAnalyzer.getInstance();
  }

  public static getInstance(): StoreAnalyzer {
    if (!StoreAnalyzer.instance) {
      StoreAnalyzer.instance = new StoreAnalyzer();
    }
    return StoreAnalyzer.instance;
  }

  public async analyzeStore(brandId: string, shopId: string): Promise<void> {
    try {
      // Get all products for the shop
      const { data: products, error: productsError } = await db.shopify_products.listByShop(shopId);
      if (productsError) throw productsError;
      if (!products) throw new Error('No products found');

      const snapshot: StoreSnapshot = {
        products: await Promise.all(products.map(async product => {
          const analysis = await this.analyzeProduct(product);
          return {
            id: product.product_id.toString(),
            title: product.title,
            description: product.description || '',
            images: product.images.map((img: any) => img.src),
            price_range: this.calculatePriceRange(product.variants),
            analysis
          };
        })),
        brand_tone: await this.analyzeBrandTone(products),
        visual_style: await this.analyzeVisualStyle(products),
        pricing_strategy: this.analyzePricingStrategy(products)
      };

      // Save snapshot to database
      await db.brand_analyses.create({
        brand_id: brandId,
        analysis_type: 'store_snapshot',
        content: JSON.stringify(snapshot),
        results: snapshot,
        confidence: 0.85
      });

    } catch (error) {
      console.error('Error analyzing store:', error);
      throw error;
    }
  }

  private async analyzeProduct(product: any) {
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'Analyze the product content and extract key metrics and patterns.'
        },
        {
          role: 'user',
          content: JSON.stringify({
            title: product.title,
            description: product.description,
            type: product.product_type
          })
        }
      ],
      temperature: 0.3
    });

    const analysis = JSON.parse(completion.choices[0].message.content || '{}');
    return {
      word_count: (product.description || '').split(/\s+/).length,
      tone_profile: analysis.tone_profile,
      cta_structure: analysis.cta_structure
    };
  }

  private async analyzeBrandTone(products: any[]) {
    const allText = products
      .map(p => `${p.title} ${p.description || ''}`)
      .join(' ');

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'Analyze the collective product content to identify brand voice characteristics.'
        },
        {
          role: 'user',
          content: allText
        }
      ],
      temperature: 0.3
    });

    return JSON.parse(completion.choices[0].message.content || '{}');
  }

  private async analyzeVisualStyle(products: any[]) {
    const allImages = products.flatMap(p => p.images).map((img: any) => img.src);
    
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'Analyze the image URLs and identify visual style patterns.'
        },
        {
          role: 'user',
          content: JSON.stringify(allImages)
        }
      ],
      temperature: 0.3
    });

    return JSON.parse(completion.choices[0].message.content || '{}');
  }

  private analyzePricingStrategy(products: any[]) {
    const allPrices = products.flatMap(p => 
      p.variants.map((v: any) => parseFloat(v.price))
    );

    const tiers = this.calculatePricingTiers(allPrices);
    
    return {
      tiers,
      average_price: allPrices.reduce((a, b) => a + b, 0) / allPrices.length
    };
  }

  private calculatePriceRange(variants: any[]) {
    const prices = variants.map(v => parseFloat(v.price));
    return {
      min: Math.min(...prices),
      max: Math.max(...prices)
    };
  }

  private calculatePricingTiers(prices: number[]) {
    const sortedPrices = [...prices].sort((a, b) => a - b);
    const tierSize = Math.ceil(sortedPrices.length / 3);

    return [
      {
        name: 'Budget',
        price_range: {
          min: sortedPrices[0],
          max: sortedPrices[tierSize - 1]
        },
        product_count: tierSize
      },
      {
        name: 'Mid-range',
        price_range: {
          min: sortedPrices[tierSize],
          max: sortedPrices[2 * tierSize - 1]
        },
        product_count: tierSize
      },
      {
        name: 'Premium',
        price_range: {
          min: sortedPrices[2 * tierSize],
          max: sortedPrices[sortedPrices.length - 1]
        },
        product_count: sortedPrices.length - (2 * tierSize)
      }
    ];
  }
} 