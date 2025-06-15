import { openai } from '../../../lib/openai';
import { db } from '../../../lib/supabase';

export interface Framework {
  name: string;
  description: string;
  source: string;
  category: 'optimization' | 'testing' | 'cta' | 'landing_page';
  framework_data: {
    steps: string[];
    principles: string[];
    examples: string[];
    metrics: string[];
    industry_fit?: string[];
    brand_tier?: 'budget' | 'mid' | 'premium';
  };
}

export class FrameworkRouter {
  private static instance: FrameworkRouter;

  private constructor() {}

  public static getInstance(): FrameworkRouter {
    if (!FrameworkRouter.instance) {
      FrameworkRouter.instance = new FrameworkRouter();
    }
    return FrameworkRouter.instance;
  }

  public async extractFramework(
    content: string,
    source: string,
    category: Framework['category']
  ): Promise<Framework> {
    try {
      const completion = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `Extract a structured framework from the provided content. Focus on:
            1. Key steps or methodology
            2. Core principles
            3. Practical examples
            4. Success metrics
            5. Industry fit
            6. Brand tier applicability (budget/mid/premium)
            
            Format as JSON matching the Framework type.`
          },
          {
            role: 'user',
            content
          }
        ],
        temperature: 0.3
      });

      const framework: Framework = {
        ...JSON.parse(completion.choices[0].message.content || '{}'),
        source,
        category
      };

      await this.saveFramework(framework);
      return framework;
    } catch (error) {
      console.error('Error extracting framework:', error);
      throw error;
    }
  }

  public async getFrameworksByCategory(
    category: Framework['category']
  ): Promise<Framework[]> {
    try {
      const { data: frameworks } = await db.brand_frameworks.getByCategory(category);
      return frameworks || [];
    } catch (error) {
      console.error('Error getting frameworks:', error);
      throw error;
    }
  }

  public async getFrameworksByIndustry(industry: string): Promise<Framework[]> {
    try {
      const { data: frameworks } = await db.brand_frameworks.list();
      return frameworks?.filter((f: Framework) => 
        f.framework_data.industry_fit?.includes(industry)
      ) || [];
    } catch (error) {
      console.error('Error getting frameworks:', error);
      throw error;
    }
  }

  public async getFrameworksByBrandTier(tier: 'budget' | 'mid' | 'premium'): Promise<Framework[]> {
    try {
      const { data: frameworks } = await db.brand_frameworks.list();
      return frameworks?.filter((f: Framework) => 
        !f.framework_data.brand_tier || 
        f.framework_data.brand_tier === tier
      ) || [];
    } catch (error) {
      console.error('Error getting frameworks:', error);
      throw error;
    }
  }

  private async saveFramework(framework: Framework): Promise<void> {
    try {
      await db.brand_frameworks.create(framework);
    } catch (error) {
      console.error('Error saving framework:', error);
      throw error;
    }
  }

  public async searchFrameworks(query: string): Promise<Framework[]> {
    try {
      const completion = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'Convert the search query into relevant framework categories and keywords.'
          },
          {
            role: 'user',
            content: query
          }
        ],
        temperature: 0.3
      });

      const searchTerms = JSON.parse(completion.choices[0].message.content || '{}');
      const { data: frameworks } = await db.brand_frameworks.search(searchTerms);
      return frameworks || [];
    } catch (error) {
      console.error('Error searching frameworks:', error);
      throw error;
    }
  }
} 