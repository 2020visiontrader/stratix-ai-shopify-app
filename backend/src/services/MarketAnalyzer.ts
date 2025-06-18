import { BrandConfig } from '../types';
import { AppError } from '../utils/errors';
import { AIService } from './AIService';
import { DatabaseService } from './DatabaseService';

interface Competitor {
  id: string;
  name: string;
  website: string;
  social_media: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    linkedin?: string;
  };
  products: {
    count: number;
    categories: string[];
    price_range: {
      min: number;
      max: number;
      average: number;
    };
  };
  content: {
    blog_posts: number;
    product_descriptions: number;
    social_posts: number;
  };
  performance: {
    traffic: number;
    engagement: number;
    conversion_rate: number;
  };
}

interface MarketTrend {
  category: string;
  trend: 'up' | 'down' | 'stable';
  growth_rate: number;
  seasonality: {
    peak_months: string[];
    low_months: string[];
  };
  consumer_behavior: {
    preferences: string[];
    pain_points: string[];
    buying_patterns: string[];
  };
  competitive_landscape: {
    market_share: Record<string, number>;
    key_players: string[];
    emerging_players: string[];
  };
}

interface MarketAnalysis {
  competitors: Competitor[];
  trends: MarketTrend[];
  opportunities: string[];
  threats: string[];
  recommendations: string[];
}

export class MarketAnalyzer {
  private static instance: MarketAnalyzer;
  private db: DatabaseService;
  private ai: AIService;

  private constructor() {
    this.db = DatabaseService.getInstance();
    this.ai = AIService.getInstance();
  }

  public static getInstance(): MarketAnalyzer {
    if (!MarketAnalyzer.instance) {
      MarketAnalyzer.instance = new MarketAnalyzer();
    }
    return MarketAnalyzer.instance;
  }

  async analyzeMarket(
    brandId: string,
    categories: string[],
    timeRange: {
      start: string;
      end: string;
    }
  ): Promise<MarketAnalysis> {
    try {
      const brandConfig = await this.db.getById('brand_configs', brandId) as BrandConfig;
      if (!brandConfig.features.competitor_analysis || !brandConfig.features.market_trends) {
        throw new AppError('Market analysis features are not enabled for this brand');
      }

      const competitors = await this.analyzeCompetitors(brandId, categories);
      const trends = await this.analyzeMarketTrends(categories, timeRange);
      const { opportunities, threats } = await this.identifyOpportunitiesAndThreats(
        competitors,
        trends
      );
      const recommendations = await this.generateRecommendations(
        competitors,
        trends,
        opportunities,
        threats
      );

      const analysis: MarketAnalysis = {
        competitors,
        trends,
        opportunities,
        threats,
        recommendations
      };

      // Log the market analysis event
      await this.db.create('events', {
        brand_id: brandId,
        type: 'market_analysis',
        data: {
          categories,
          time_range: timeRange,
          analysis
        },
        created_at: new Date().toISOString()
      });

      return analysis;
    } catch (error) {
      throw new AppError('Failed to analyze market', error);
    }
  }

  private async analyzeCompetitors(
    brandId: string,
    categories: string[]
  ): Promise<Competitor[]> {
    try {
      // Get brand's competitors from database
      const competitors = await this.db.list('competitors', {
        brand_id: brandId,
        categories: categories
      });

      // Analyze each competitor's data
      const analyzedCompetitors = await Promise.all(
        competitors.map(async (competitor) => {
          const products = await this.db.list('products', {
            competitor_id: competitor.id,
            categories: categories
          });

          const content = await this.db.list('content', {
            competitor_id: competitor.id,
            type: ['blog_post', 'product_description', 'social_post']
          });

          const performance = await this.db.list('performance_metrics', {
            competitor_id: competitor.id,
            period: 'monthly'
          });

          return {
            id: competitor.id,
            name: competitor.name,
            website: competitor.website,
            social_media: competitor.social_media,
            products: {
              count: products.length,
              categories: [...new Set(products.map(p => p.category))],
              price_range: this.calculatePriceRange(products)
            },
            content: {
              blog_posts: content.filter(c => c.type === 'blog_post').length,
              product_descriptions: content.filter(c => c.type === 'product_description').length,
              social_posts: content.filter(c => c.type === 'social_post').length
            },
            performance: this.calculateCompetitorPerformance(performance)
          };
        })
      );

      return analyzedCompetitors;
    } catch (error) {
      throw new AppError('Failed to analyze competitors', error);
    }
  }

  private async analyzeMarketTrends(
    categories: string[],
    timeRange: { start: string; end: string }
  ): Promise<MarketTrend[]> {
    try {
      const trends = await Promise.all(
        categories.map(async (category) => {
          const historicalData = await this.db.list('market_data', {
            category,
            date: {
              gte: timeRange.start,
              lte: timeRange.end
            }
          });

          const trend = this.calculateTrendDirection(historicalData);
          const growthRate = this.calculateGrowthRate(historicalData);
          const seasonality = this.analyzeSeasonality(historicalData);
          const consumerBehavior = await this.analyzeConsumerBehavior(category);
          const competitiveLandscape = await this.analyzeCompetitiveLandscape(category);

          return {
            category,
            trend,
            growth_rate: growthRate,
            seasonality,
            consumer_behavior: consumerBehavior,
            competitive_landscape: competitiveLandscape
          };
        })
      );

      return trends;
    } catch (error) {
      throw new AppError('Failed to analyze market trends', error);
    }
  }

  private async identifyOpportunitiesAndThreats(
    competitors: Competitor[],
    trends: MarketTrend[]
  ): Promise<{ opportunities: string[]; threats: string[] }> {
    try {
      const prompt = `Analyze the following market data and identify opportunities and threats:
        Competitors: ${JSON.stringify(competitors)}
        Market Trends: ${JSON.stringify(trends)}
        
        Please provide:
        1. List of market opportunities
        2. List of potential threats`;

      const response = await this.ai.analyzeContent(prompt);
      const analysis = JSON.parse(response.suggestions.join('\n'));

      return {
        opportunities: analysis.opportunities,
        threats: analysis.threats
      };
    } catch (error) {
      throw new AppError('Failed to identify opportunities and threats', error);
    }
  }

  private async generateRecommendations(
    competitors: Competitor[],
    trends: MarketTrend[],
    opportunities: string[],
    threats: string[]
  ): Promise<string[]> {
    try {
      const prompt = `Based on the following market analysis, generate strategic recommendations:
        Competitors: ${JSON.stringify(competitors)}
        Market Trends: ${JSON.stringify(trends)}
        Opportunities: ${JSON.stringify(opportunities)}
        Threats: ${JSON.stringify(threats)}
        
        Please provide actionable recommendations.`;

      const response = await this.ai.analyzeContent(prompt);
      return response.suggestions;
    } catch (error) {
      throw new AppError('Failed to generate recommendations', error);
    }
  }

  private calculatePriceRange(products: any[]): {
    min: number;
    max: number;
    average: number;
  } {
    const prices = products.map(p => parseFloat(p.price));
    return {
      min: Math.min(...prices),
      max: Math.max(...prices),
      average: prices.reduce((a, b) => a + b, 0) / prices.length
    };
  }

  private calculateCompetitorPerformance(metrics: any[]): {
    traffic: number;
    engagement: number;
    conversion_rate: number;
  } {
    const latestMetrics = metrics[metrics.length - 1];
    return {
      traffic: latestMetrics?.traffic || 0,
      engagement: latestMetrics?.engagement || 0,
      conversion_rate: latestMetrics?.conversion_rate || 0
    };
  }

  private calculateTrendDirection(data: any[]): 'up' | 'down' | 'stable' {
    if (data.length < 2) return 'stable';

    const firstValue = data[0].value;
    const lastValue = data[data.length - 1].value;
    const change = ((lastValue - firstValue) / firstValue) * 100;

    if (change > 5) return 'up';
    if (change < -5) return 'down';
    return 'stable';
  }

  private calculateGrowthRate(data: any[]): number {
    if (data.length < 2) return 0;

    const firstValue = data[0].value;
    const lastValue = data[data.length - 1].value;
    const timePeriod = data.length;

    return ((lastValue - firstValue) / firstValue / timePeriod) * 100;
  }

  private analyzeSeasonality(data: any[]): {
    peak_months: string[];
    low_months: string[];
  } {
    const monthlyAverages = new Map<string, number>();

    data.forEach(entry => {
      const month = new Date(entry.date).toLocaleString('default', { month: 'long' });
      monthlyAverages.set(month, (monthlyAverages.get(month) || 0) + entry.value);
    });

    const sortedMonths = Array.from(monthlyAverages.entries())
      .sort((a, b) => b[1] - a[1]);

    return {
      peak_months: sortedMonths.slice(0, 3).map(([month]) => month),
      low_months: sortedMonths.slice(-3).map(([month]) => month)
    };
  }

  private async analyzeConsumerBehavior(category: string): Promise<{
    preferences: string[];
    pain_points: string[];
    buying_patterns: string[];
  }> {
    try {
      const consumerData = await this.db.list('consumer_data', {
        category,
        type: ['preference', 'pain_point', 'buying_pattern']
      });

      return {
        preferences: consumerData
          .filter(d => d.type === 'preference')
          .map(d => d.description),
        pain_points: consumerData
          .filter(d => d.type === 'pain_point')
          .map(d => d.description),
        buying_patterns: consumerData
          .filter(d => d.type === 'buying_pattern')
          .map(d => d.description)
      };
    } catch (error) {
      throw new AppError('Failed to analyze consumer behavior', error);
    }
  }

  private async analyzeCompetitiveLandscape(category: string): Promise<{
    market_share: Record<string, number>;
    key_players: string[];
    emerging_players: string[];
  }> {
    try {
      const marketData = await this.db.list('market_data', {
        category,
        type: 'market_share'
      });

      const marketShare = marketData.reduce((acc, curr) => {
        acc[curr.player] = curr.share;
        return acc;
      }, {} as Record<string, number>);

      const sortedPlayers = Object.entries(marketShare)
        .sort((a, b) => b[1] - a[1]);

      return {
        market_share: marketShare,
        key_players: sortedPlayers.slice(0, 5).map(([player]) => player),
        emerging_players: sortedPlayers
          .filter(([_, share]) => share < 5)
          .map(([player]) => player)
      };
    } catch (error) {
      throw new AppError('Failed to analyze competitive landscape', error);
    }
  }
} 