import { db } from '../lib/supabase';

interface ModelVersion {
  version: number;
  timestamp: Date;
  changes: string[];
  performance_metrics: {
    accuracy: number;
    confidence: number;
    sample_size: number;
  };
}

interface BrandModel {
  tone_preferences: {
    primary: string;
    secondary: string[];
    avoid: string[];
  };
  content_formats: {
    preferred_lengths: string[];
    successful_structures: string[];
    high_impact_elements: string[];
  };
  visual_preferences: {
    color_palette: string[];
    layout_types: string[];
    image_styles: string[];
  };
  audience_signals: {
    engagement_patterns: string[];
    conversion_triggers: string[];
    pain_points: string[];
  };
  industry_context: {
    competitive_angles: string[];
    market_trends: string[];
    seasonal_factors: string[];
  };
  version_history: ModelVersion[];
}

export class BrandDNA {
  private static instance: BrandDNA;
  private modelCache: Map<string, BrandModel>;
  
  private constructor() {
    this.modelCache = new Map();
  }

  public static getInstance(): BrandDNA {
    if (!BrandDNA.instance) {
      BrandDNA.instance = new BrandDNA();
    }
    return BrandDNA.instance;
  }

  public async getModel(brandId: string): Promise<BrandModel> {
    // Check cache first
    if (this.modelCache.has(brandId)) {
      return this.modelCache.get(brandId)!;
    }

    // Get model from database
    const { data: model } = await db.brand_models.getByBrandId(brandId);
    if (!model) {
      // Create new model if none exists
      const newModel = await this.initializeModel(brandId);
      this.modelCache.set(brandId, newModel);
      return newModel;
    }

    this.modelCache.set(brandId, model.data);
    return model.data;
  }

  public async updateModel(brandId: string, updates: Partial<BrandModel>): Promise<void> {
    const currentModel = await this.getModel(brandId);
    const newVersion: ModelVersion = {
      version: currentModel.version_history.length + 1,
      timestamp: new Date(),
      changes: this.generateChangeLog(updates),
      performance_metrics: await this.evaluateModelPerformance(brandId)
    };

    const updatedModel = {
      ...currentModel,
      ...updates,
      version_history: [...currentModel.version_history, newVersion]
    };

    // Update database
    await db.brand_models.update(brandId, {
      data: updatedModel,
      updated_at: new Date()
    });

    // Update cache
    this.modelCache.set(brandId, updatedModel);
  }

  public async processPerformanceData(brandId: string, data: any): Promise<void> {
    const model = await this.getModel(brandId);
    const updates = this.extractModelUpdates(data, model);
    
    if (Object.keys(updates).length > 0) {
      await this.updateModel(brandId, updates);
    }
  }

  private async initializeModel(brandId: string): Promise<BrandModel> {
    // Get brand configuration
    const { data: config } = await db.brand_configs.getByBrandId(brandId);
    if (!config) throw new Error('Brand configuration not found');

    // Get industry frameworks
    const { data: frameworks } = await db.brand_frameworks.getByCategory('optimization');

    const initialModel: BrandModel = {
      tone_preferences: {
        primary: config.tone,
        secondary: [],
        avoid: []
      },
      content_formats: {
        preferred_lengths: ['medium'],
        successful_structures: [],
        high_impact_elements: []
      },
      visual_preferences: {
        color_palette: [],
        layout_types: [],
        image_styles: []
      },
      audience_signals: {
        engagement_patterns: [],
        conversion_triggers: [],
        pain_points: []
      },
      industry_context: {
        competitive_angles: frameworks?.map(f => f.framework_data.principles).flat() || [],
        market_trends: [],
        seasonal_factors: []
      },
      version_history: [{
        version: 1,
        timestamp: new Date(),
        changes: ['Initial model creation'],
        performance_metrics: {
          accuracy: 0,
          confidence: 0,
          sample_size: 0
        }
      }]
    };

    // Store in database
    await db.brand_models.create({
      brand_id: brandId,
      data: initialModel,
      created_at: new Date()
    });

    return initialModel;
  }

  private generateChangeLog(updates: Partial<BrandModel>): string[] {
    const changes: string[] = [];

    Object.entries(updates).forEach(([key, value]) => {
      if (value && typeof value === 'object') {
        Object.entries(value).forEach(([subKey, subValue]) => {
          changes.push(`Updated ${key}.${subKey}`);
        });
      } else {
        changes.push(`Updated ${key}`);
      }
    });

    return changes;
  }

  private async evaluateModelPerformance(brandId: string): Promise<ModelVersion['performance_metrics']> {
    // Get recent performance data
    const { data: insights } = await db.performance_insights.getByBrandId(brandId);
    if (!insights?.length) {
      return {
        accuracy: 0,
        confidence: 0,
        sample_size: 0
      };
    }

    // Calculate metrics based on recent performance
    const recentInsights = insights[0];
    const sampleSize = this.calculateSampleSize(recentInsights);
    const accuracy = this.calculateAccuracy(recentInsights);
    const confidence = this.calculateConfidence(sampleSize, accuracy);

    return {
      accuracy,
      confidence,
      sample_size: sampleSize
    };
  }

  private calculateSampleSize(insights: any): number {
    return Object.values(insights.topPerformers || {})
      .reduce((sum: number, arr: any) => sum + (Array.isArray(arr) ? arr.length : 0), 0);
  }

  private calculateAccuracy(insights: any): number {
    const successRate = insights.trends
      ? Object.values(insights.trends).filter(trend => trend === 'up').length / 3
      : 0;
    return Math.min(successRate * 100, 100);
  }

  private calculateConfidence(sampleSize: number, accuracy: number): number {
    // Simple confidence calculation based on sample size and accuracy
    const baseLine = 0.5; // 50% baseline
    const sampleWeight = Math.min(sampleSize / 100, 1); // Cap at 100 samples
    return baseLine + (accuracy / 100 * sampleWeight * 0.5); // Max 100%
  }

  private extractModelUpdates(data: any, currentModel: BrandModel): Partial<BrandModel> {
    const updates: Partial<BrandModel> = {};

    // Update tone preferences
    if (data.copy_insights?.successful_tones) {
      updates.tone_preferences = {
        ...currentModel.tone_preferences,
        secondary: Array.from(new Set([
          ...currentModel.tone_preferences.secondary,
          ...data.copy_insights.successful_tones
        ]))
      };
    }

    // Update content formats
    if (data.content_patterns?.high_performing_elements) {
      updates.content_formats = {
        ...currentModel.content_formats,
        high_impact_elements: Array.from(new Set([
          ...currentModel.content_formats.high_impact_elements,
          ...data.content_patterns.high_performing_elements
        ]))
      };
    }

    // Update visual preferences
    if (data.visual_insights) {
      updates.visual_preferences = {
        ...currentModel.visual_preferences,
        layout_types: data.visual_insights.layout_preferences || currentModel.visual_preferences.layout_types,
        color_palette: data.visual_insights.color_patterns || currentModel.visual_preferences.color_palette
      };
    }

    // Update audience signals
    if (data.trends) {
      const patterns = Object.entries(data.trends)
        .filter(([_, trend]) => trend === 'up')
        .map(([metric]) => `High response to ${metric}`);

      if (patterns.length > 0) {
        updates.audience_signals = {
          ...currentModel.audience_signals,
          engagement_patterns: Array.from(new Set([
            ...currentModel.audience_signals.engagement_patterns,
            ...patterns
          ]))
        };
      }
    }

    return updates;
  }
} 