import { Shopify } from '@shopify/shopify-api';

interface SectionMetrics {
  viewRate: number;
  engagementRate: number;
  conversionImpact: number;
}

export class ShopifyAnalytics {
  private static instance: ShopifyAnalytics;
  private shopify: Shopify;

  private constructor() {
    // Initialize Shopify client
    this.shopify = new Shopify({
      apiKey: process.env.SHOPIFY_API_KEY || '',
      apiSecretKey: process.env.SHOPIFY_API_SECRET || '',
      scopes: ['read_analytics'],
      hostName: process.env.SHOPIFY_SHOP_URL || ''
    });
  }

  public static getInstance(): ShopifyAnalytics {
    if (!ShopifyAnalytics.instance) {
      ShopifyAnalytics.instance = new ShopifyAnalytics();
    }
    return ShopifyAnalytics.instance;
  }

  public async getPageMetrics(pageId: string): Promise<{
    bounceRate: number;
    avgScrollDepth: number;
    ctaClickRate: number;
    avgSessionTime: number;
    sampleSize: number;
  }> {
    try {
      // Get analytics data from Shopify
      const response = await this.shopify.get(`/admin/api/2024-01/analytics/reports/${pageId}.json`);
      const data = response.body as any;

      return {
        bounceRate: data.bounce_rate || 0,
        avgScrollDepth: data.scroll_depth || 0,
        ctaClickRate: data.cta_click_rate || 0,
        avgSessionTime: data.avg_session_time || 0,
        sampleSize: data.visitors || 0
      };
    } catch (error) {
      console.error('Error fetching page metrics:', error);
      throw error;
    }
  }

  public async getSectionMetrics(pageId: string, section: string): Promise<SectionMetrics> {
    try {
      // Get section-specific analytics from Shopify
      const response = await this.shopify.get(
        `/admin/api/2024-01/analytics/reports/${pageId}/sections/${section}.json`
      );
      const data = response.body as any;

      return {
        viewRate: data.view_rate || 0,
        engagementRate: data.engagement_rate || 0,
        conversionImpact: data.conversion_impact || 0
      };
    } catch (error) {
      console.error('Error fetching section metrics:', error);
      throw error;
    }
  }

  public async trackCustomEvent(pageId: string, eventName: string, metadata: Record<string, any>): Promise<void> {
    try {
      await this.shopify.post('/admin/api/2024-01/analytics/events.json', {
        event: {
          name: eventName,
          page_id: pageId,
          ...metadata
        }
      });
    } catch (error) {
      console.error('Error tracking custom event:', error);
      throw error;
    }
  }
} 