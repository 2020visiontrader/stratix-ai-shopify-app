import { db } from '../lib/supabase';

export interface CampaignPerformance {
  campaignId: string;
  title: string;
  cta: string;
  productType: string;
  ctr: number;
  conversionRate: number;
}

export interface CrossCampaignInsight {
  brandId: string;
  trend: string;
  recommendation: string;
  supportingCampaigns: string[];
  timestamp: Date;
}

export class CrossCampaignLearner {
  private brandId: string;

  constructor(brandId: string) {
    this.brandId = brandId;
  }

  /**
   * Aggregate performance data from all campaigns for this brand.
   */
  async aggregatePerformance(): Promise<CampaignPerformance[]> {
    try {
      // TODO: Query all campaigns for this brand
      // Placeholder: return dummy data
      return [
        { campaignId: 'c1', title: 'Sale', cta: 'Shop Now', productType: 'Shoes', ctr: 0.12, conversionRate: 0.04 },
        { campaignId: 'c2', title: 'New Arrivals', cta: 'See More', productType: 'Shoes', ctr: 0.15, conversionRate: 0.05 },
        { campaignId: 'c3', title: 'Sale', cta: 'Shop Now', productType: 'Bags', ctr: 0.18, conversionRate: 0.06 }
      ];
    } catch (error) {
      console.error('Error aggregating campaign performance:', error);
      return [];
    }
  }

  /**
   * Analyze for statistically significant trends and recommend changes.
   */
  async analyzeAndRecommend(): Promise<CrossCampaignInsight[]> {
    try {
      const performances = await this.aggregatePerformance();
      // TODO: Real statistical analysis
      // Example: Detect if "Shop Now" CTA performs better
      const shopNow = performances.filter(p => p.cta === 'Shop Now');
      const avgCtr = shopNow.reduce((sum, p) => sum + p.ctr, 0) / (shopNow.length || 1);
      const insight: CrossCampaignInsight = {
        brandId: this.brandId,
        trend: 'Shop Now CTA outperforms others',
        recommendation: 'Use "Shop Now" CTA on more product pages',
        supportingCampaigns: shopNow.map(p => p.campaignId),
        timestamp: new Date()
      };
      // Store in /brands/{brandId}/crossInsights
      try {
        await db.from('cross_campaign_insights').upsert({
          brand_id: this.brandId,
          data: insight,
          created_at: insight.timestamp
        });
      } catch (dbError) {
        console.error('Error storing cross-campaign insight:', dbError);
      }
      return [insight];
    } catch (error) {
      console.error('Error analyzing and recommending cross-campaign insights:', error);
      return [];
    }
  }

  /**
   * Retrieve cross-campaign insights for this brand.
   */
  async getInsights(): Promise<CrossCampaignInsight[]> {
    try {
      const { data, error } = await db
        .from('cross_campaign_insights')
        .select('data')
        .eq('brand_id', this.brandId)
        .order('created_at', { ascending: false });
      if (error) {
        console.error('Error fetching cross-campaign insights:', error);
        return [];
      }
      return (data || []).map((row: { data: CrossCampaignInsight }) => row.data);
    } catch (error) {
      console.error('Error retrieving cross-campaign insights:', error);
      return [];
    }
  }
} 