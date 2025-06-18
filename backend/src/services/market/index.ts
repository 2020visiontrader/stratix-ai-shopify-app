import { supabase } from '../../db';
import { AppError } from '../../utils/errors';
import { logger } from '../../utils/logger';
import { AIService } from '../ai';

export interface MarketAnalysis {
  trends: {
    category: string;
    growth: number;
    seasonality: number;
    competition: number;
  };
  competitors: {
    name: string;
    price: number;
    rating: number;
    market_share: number;
  }[];
  recommendations: string[];
}

export class MarketAnalyzer {
  private aiService: AIService;

  constructor() {
    this.aiService = new AIService();
  }

  async analyzeMarket(
    productId: string,
    category: string
  ): Promise<MarketAnalysis> {
    try {
      // Get market data
      const marketData = await this.getMarketData(category);
      
      // Get competitor data
      const competitorData = await this.getCompetitorData(productId, category);

      // Generate AI analysis
      const analysis = await this.generateAnalysis(marketData, competitorData);

      // Store analysis results
      await this.storeAnalysis(productId, analysis);

      return analysis;
    } catch (error) {
      logger.error('Error analyzing market:', error);
      throw new AppError(500, 'ANALYSIS_ERROR', 'Failed to analyze market', error);
    }
  }

  private async getMarketData(category: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('market_data')
        .select('*')
        .eq('category', category)
        .order('timestamp', { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Error getting market data:', error);
      throw new AppError(500, 'DATABASE_ERROR', 'Failed to get market data', error);
    }
  }

  private async getCompetitorData(
    productId: string,
    category: string
  ): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('competitor_data')
        .select('*')
        .eq('category', category)
        .neq('product_id', productId)
        .order('market_share', { ascending: false })
        .limit(5);

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('Error getting competitor data:', error);
      throw new AppError(500, 'DATABASE_ERROR', 'Failed to get competitor data', error);
    }
  }

  private async generateAnalysis(
    marketData: any,
    competitorData: any[]
  ): Promise<MarketAnalysis> {
    try {
      // Prepare data for AI analysis
      const prompt = this.prepareAnalysisPrompt(marketData, competitorData);

      // Get AI analysis
      const aiResponse = await this.aiService.generateContent(
        prompt,
        'description',
        'gpt-4'
      );

      // Parse AI response
      const analysis = this.parseAnalysisResponse(aiResponse.content);

      return analysis;
    } catch (error) {
      logger.error('Error generating analysis:', error);
      throw new AppError(500, 'AI_ERROR', 'Failed to generate analysis', error);
    }
  }

  private prepareAnalysisPrompt(marketData: any, competitorData: any[]): string {
    return `
      Analyze the following market data and provide insights:
      
      Market Trends:
      - Category: ${marketData.category}
      - Growth Rate: ${marketData.growth_rate}%
      - Seasonality: ${marketData.seasonality}
      - Competition Level: ${marketData.competition_level}
      
      Top Competitors:
      ${competitorData.map(comp => `
        - ${comp.name}
        - Price: $${comp.price}
        - Rating: ${comp.rating}/5
        - Market Share: ${comp.market_share}%
      `).join('\n')}
      
      Please provide:
      1. Market trend analysis
      2. Competitive analysis
      3. Strategic recommendations
    `;
  }

  private parseAnalysisResponse(content: string): MarketAnalysis {
    // In a real implementation, this would parse the AI response
    // into a structured MarketAnalysis object
    return {
      trends: {
        category: '',
        growth: 0,
        seasonality: 0,
        competition: 0
      },
      competitors: [],
      recommendations: []
    };
  }

  private async storeAnalysis(
    productId: string,
    analysis: MarketAnalysis
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('market_analysis')
        .insert({
          product_id: productId,
          analysis: analysis,
          created_at: new Date()
        });

      if (error) throw error;
    } catch (error) {
      logger.error('Error storing analysis:', error);
      throw new AppError(500, 'DATABASE_ERROR', 'Failed to store analysis', error);
    }
  }

  async getHistoricalAnalysis(
    productId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<MarketAnalysis[]> {
    try {
      let query = supabase
        .from('market_analysis')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: false });

      if (startDate) {
        query = query.gte('created_at', startDate.toISOString());
      }

      if (endDate) {
        query = query.lte('created_at', endDate.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;
      return data.map(item => item.analysis as MarketAnalysis);
    } catch (error) {
      logger.error('Error getting historical analysis:', error);
      throw new AppError(500, 'DATABASE_ERROR', 'Failed to get historical analysis', error);
    }
  }
} 