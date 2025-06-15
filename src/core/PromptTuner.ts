import { db } from '../lib/supabase';
import { AIEvolutionLogger } from './AIEvolutionLogger';

interface TuningConfig {
  voice_scale: number; // 0 (formal) to 1 (casual)
  cta_style: 'hard' | 'soft';
  positioning: 'luxury' | 'value' | 'experimental';
  custom_weights?: {
    tone_strength: number;
    framework_adherence: number;
    creativity: number;
  };
}

interface TuningPreset {
  name: string;
  description: string;
  config: TuningConfig;
  recommended_for: string[];
}

export class PromptTuner {
  private static instance: PromptTuner;
  private evolutionLogger: AIEvolutionLogger;
  
  private constructor() {
    this.evolutionLogger = AIEvolutionLogger.getInstance();
  }

  public static getInstance(): PromptTuner {
    if (!PromptTuner.instance) {
      PromptTuner.instance = new PromptTuner();
    }
    return PromptTuner.instance;
  }

  public async updateTuning(brandId: string, config: Partial<TuningConfig>): Promise<void> {
    try {
      // Get current config
      const { data: currentConfig } = await db.brand_tuning.getByBrandId(brandId);
      
      // Check plan eligibility
      const { data: brand } = await db.brands.getById(brandId);
      if (!brand || !this.isEligiblePlan(brand.plan)) {
        throw new Error('Plan upgrade required for prompt tuning');
      }

      // Validate and normalize config
      const validatedConfig = this.validateConfig({
        ...currentConfig,
        ...config
      });

      // Store before state for evolution tracking
      const beforeState = currentConfig || this.getDefaultConfig();

      // Update tuning config
      await db.brand_tuning.update(brandId, validatedConfig);

      // Log evolution
      await this.evolutionLogger.logEvolution(brandId, {
        type: 'ADMIN_TUNING',
        trigger: {
          source: 'prompt_tuner',
          action: 'update_tuning_config',
          metadata: { config_changes: Object.keys(config) }
        },
        changes: {
          before: beforeState,
          after: validatedConfig,
          impact_areas: this.identifyImpactAreas(config)
        }
      });

    } catch (error) {
      console.error('Error updating prompt tuning:', error);
      throw error;
    }
  }

  public async getTuningConfig(brandId: string): Promise<TuningConfig> {
    const { data: config } = await db.brand_tuning.getByBrandId(brandId);
    return config || this.getDefaultConfig();
  }

  public async getPresets(): Promise<TuningPreset[]> {
    return [
      {
        name: 'Professional Services',
        description: 'Formal tone with authoritative positioning',
        config: {
          voice_scale: 0.2,
          cta_style: 'soft',
          positioning: 'luxury',
          custom_weights: {
            tone_strength: 0.8,
            framework_adherence: 0.9,
            creativity: 0.3
          }
        },
        recommended_for: ['consulting', 'legal', 'financial']
      },
      {
        name: 'E-commerce Direct',
        description: 'Casual tone with strong CTAs',
        config: {
          voice_scale: 0.8,
          cta_style: 'hard',
          positioning: 'value',
          custom_weights: {
            tone_strength: 0.7,
            framework_adherence: 0.6,
            creativity: 0.8
          }
        },
        recommended_for: ['retail', 'fashion', 'consumer goods']
      },
      {
        name: 'Tech Innovation',
        description: 'Modern tone with experimental positioning',
        config: {
          voice_scale: 0.6,
          cta_style: 'soft',
          positioning: 'experimental',
          custom_weights: {
            tone_strength: 0.5,
            framework_adherence: 0.4,
            creativity: 1.0
          }
        },
        recommended_for: ['saas', 'tech', 'startups']
      }
    ];
  }

  private isEligiblePlan(plan: string): boolean {
    return ['growth', 'enterprise'].includes(plan.toLowerCase());
  }

  private getDefaultConfig(): TuningConfig {
    return {
      voice_scale: 0.5,
      cta_style: 'soft',
      positioning: 'value',
      custom_weights: {
        tone_strength: 0.5,
        framework_adherence: 0.5,
        creativity: 0.5
      }
    };
  }

  private validateConfig(config: TuningConfig): TuningConfig {
    const validated: TuningConfig = {
      voice_scale: this.clamp(config.voice_scale, 0, 1),
      cta_style: ['hard', 'soft'].includes(config.cta_style) ? config.cta_style : 'soft',
      positioning: ['luxury', 'value', 'experimental'].includes(config.positioning) 
        ? config.positioning 
        : 'value'
    };

    if (config.custom_weights) {
      validated.custom_weights = {
        tone_strength: this.clamp(config.custom_weights.tone_strength, 0, 1),
        framework_adherence: this.clamp(config.custom_weights.framework_adherence, 0, 1),
        creativity: this.clamp(config.custom_weights.creativity, 0, 1)
      };
    }

    return validated;
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }

  private identifyImpactAreas(changes: Partial<TuningConfig>): string[] {
    const impacts: string[] = [];

    if ('voice_scale' in changes) {
      impacts.push('tone_and_voice');
    }

    if ('cta_style' in changes) {
      impacts.push('conversion_elements');
    }

    if ('positioning' in changes) {
      impacts.push('brand_positioning');
    }

    if ('custom_weights' in changes) {
      impacts.push('generation_behavior');
    }

    return impacts;
  }
} 