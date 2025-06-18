import { BrandConfig } from '../types';
import { AppError } from '../utils/errors';
import { AIService } from './AIService';
import { DatabaseService } from './DatabaseService';

interface SocialMediaPost {
  id: string;
  brand_id: string;
  platform: 'facebook' | 'instagram' | 'twitter' | 'linkedin';
  content: {
    text: string;
    media?: {
      type: 'image' | 'video';
      url: string;
      alt_text?: string;
    }[];
  };
  schedule: {
    planned_time: string;
    status: 'scheduled' | 'published' | 'failed';
    published_time?: string;
  };
  metrics?: {
    reach: number;
    engagement: number;
    clicks: number;
    conversions: number;
  };
  created_at: string;
  updated_at: string;
}

interface SocialMediaAnalytics {
  platform: string;
  period: 'daily' | 'weekly' | 'monthly';
  metrics: {
    followers: number;
    engagement: number;
    reach: number;
    clicks: number;
    conversions: number;
  };
  trends: {
    follower_growth: number;
    engagement_rate: number;
    conversion_rate: number;
  };
  top_posts: SocialMediaPost[];
}

export class SocialMediaManager {
  private static instance: SocialMediaManager;
  private db: DatabaseService;
  private ai: AIService;

  private constructor() {
    this.db = DatabaseService.getInstance();
    this.ai = AIService.getInstance();
  }

  public static getInstance(): SocialMediaManager {
    if (!SocialMediaManager.instance) {
      SocialMediaManager.instance = new SocialMediaManager();
    }
    return SocialMediaManager.instance;
  }

  async createPost(
    brandId: string,
    platform: SocialMediaPost['platform'],
    content: SocialMediaPost['content'],
    scheduleTime?: string
  ): Promise<SocialMediaPost> {
    try {
      const brandConfig = await this.db.getById('brand_configs', brandId) as BrandConfig;
      if (!brandConfig.settings.social_media_integration) {
        throw new AppError('Social media integration is not enabled for this brand');
      }

      // Optimize content for the platform
      const optimizedContent = await this.optimizeContentForPlatform(
        content,
        platform,
        brandId
      );

      const post: Omit<SocialMediaPost, 'id'> = {
        brand_id: brandId,
        platform,
        content: optimizedContent,
        schedule: {
          planned_time: scheduleTime || new Date().toISOString(),
          status: 'scheduled'
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const createdPost = await this.db.create('social_media_posts', post);

      // Schedule the post
      if (scheduleTime) {
        await this.schedulePost(createdPost.id, scheduleTime);
      } else {
        await this.publishPost(createdPost.id);
      }

      return createdPost as SocialMediaPost;
    } catch (error) {
      throw new AppError('Failed to create social media post', error);
    }
  }

  async getAnalytics(
    brandId: string,
    platform: string,
    period: SocialMediaAnalytics['period'] = 'monthly',
    startDate: string,
    endDate: string
  ): Promise<SocialMediaAnalytics> {
    try {
      const brandConfig = await this.db.getById('brand_configs', brandId) as BrandConfig;
      if (!brandConfig.settings.social_media_integration) {
        throw new AppError('Social media integration is not enabled for this brand');
      }

      const posts = await this.db.list('social_media_posts', {
        brand_id: brandId,
        platform,
        'schedule.published_time': {
          gte: startDate,
          lte: endDate
        }
      });

      const metrics = await this.db.list('social_media_metrics', {
        brand_id: brandId,
        platform,
        period,
        date: {
          gte: startDate,
          lte: endDate
        }
      });

      const analytics: SocialMediaAnalytics = {
        platform,
        period,
        metrics: this.calculateMetrics(metrics),
        trends: this.calculateTrends(metrics),
        top_posts: this.getTopPosts(posts as SocialMediaPost[])
      };

      return analytics;
    } catch (error) {
      throw new AppError('Failed to get social media analytics', error);
    }
  }

  private async optimizeContentForPlatform(
    content: SocialMediaPost['content'],
    platform: SocialMediaPost['platform'],
    brandId: string
  ): Promise<SocialMediaPost['content']> {
    try {
      const brandDNA = await this.getBrandDNA(brandId);
      const prompt = `Optimize the following content for ${platform}:
        Content: ${content.text}
        Brand DNA:
        - Tone: ${brandDNA.tone}
        - Style: ${brandDNA.style}
        - Values: ${brandDNA.values.join(', ')}
        - Target Audience: ${brandDNA.targetAudience}
        - Key Messages: ${brandDNA.keyMessages.join(', ')}

        Please provide optimized content that:
        1. Follows platform best practices
        2. Maintains brand voice
        3. Maximizes engagement
        4. Includes relevant hashtags
        5. Optimizes for the platform's character limit`;

      const response = await this.ai.analyzeContent(prompt);
      const optimizedText = response.suggestions[0];

      return {
        text: optimizedText,
        media: content.media
      };
    } catch (error) {
      throw new AppError('Failed to optimize content for platform', error);
    }
  }

  private async schedulePost(postId: string, scheduleTime: string): Promise<void> {
    try {
      await this.db.update('social_media_posts', postId, {
        'schedule.planned_time': scheduleTime,
        'schedule.status': 'scheduled',
        updated_at: new Date().toISOString()
      });

      // Create a scheduled task
      await this.db.create('scheduled_tasks', {
        type: 'social_media_post',
        post_id: postId,
        scheduled_time: scheduleTime,
        status: 'pending',
        created_at: new Date().toISOString()
      });
    } catch (error) {
      throw new AppError('Failed to schedule post', error);
    }
  }

  private async publishPost(postId: string): Promise<void> {
    try {
      const post = await this.db.getById('social_media_posts', postId) as SocialMediaPost;
      if (!post) {
        throw new AppError('Post not found');
      }

      // Publish to the social media platform
      await this.publishToPlatform(post);

      // Update post status
      await this.db.update('social_media_posts', postId, {
        'schedule.status': 'published',
        'schedule.published_time': new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      // Log the publishing event
      await this.db.create('events', {
        brand_id: post.brand_id,
        type: 'social_media_post_published',
        data: {
          post_id: postId,
          platform: post.platform
        },
        created_at: new Date().toISOString()
      });
    } catch (error) {
      // Update post status to failed
      await this.db.update('social_media_posts', postId, {
        'schedule.status': 'failed',
        updated_at: new Date().toISOString()
      });

      throw new AppError('Failed to publish post', error);
    }
  }

  private async publishToPlatform(post: SocialMediaPost): Promise<void> {
    // Implement platform-specific publishing logic here
    // This would typically involve calling the respective social media platform's API
    switch (post.platform) {
      case 'facebook':
        // Implement Facebook publishing
        break;
      case 'instagram':
        // Implement Instagram publishing
        break;
      case 'twitter':
        // Implement Twitter publishing
        break;
      case 'linkedin':
        // Implement LinkedIn publishing
        break;
      default:
        throw new AppError(`Unsupported platform: ${post.platform}`);
    }
  }

  private async getBrandDNA(brandId: string): Promise<any> {
    try {
      const brand = await this.db.getById('brands', brandId);
      if (!brand) {
        throw new AppError('Brand not found');
      }

      const products = await this.db.list('products', {
        brand_id: brandId,
        limit: 10,
        order: { created_at: 'desc' }
      });

      return this.ai.analyzeBrandDNA(products);
    } catch (error) {
      throw new AppError('Failed to get brand DNA', error);
    }
  }

  private calculateMetrics(metrics: any[]): SocialMediaAnalytics['metrics'] {
    const latestMetrics = metrics[metrics.length - 1] || {};
    return {
      followers: latestMetrics.followers || 0,
      engagement: latestMetrics.engagement || 0,
      reach: latestMetrics.reach || 0,
      clicks: latestMetrics.clicks || 0,
      conversions: latestMetrics.conversions || 0
    };
  }

  private calculateTrends(metrics: any[]): SocialMediaAnalytics['trends'] {
    if (metrics.length < 2) {
      return {
        follower_growth: 0,
        engagement_rate: 0,
        conversion_rate: 0
      };
    }

    const firstMetrics = metrics[0];
    const lastMetrics = metrics[metrics.length - 1];

    return {
      follower_growth: this.calculateGrowthRate(
        firstMetrics.followers,
        lastMetrics.followers
      ),
      engagement_rate: this.calculateEngagementRate(lastMetrics),
      conversion_rate: this.calculateConversionRate(lastMetrics)
    };
  }

  private getTopPosts(posts: SocialMediaPost[]): SocialMediaPost[] {
    return posts
      .filter(post => post.metrics)
      .sort((a, b) => {
        const aScore = this.calculatePostScore(a.metrics!);
        const bScore = this.calculatePostScore(b.metrics!);
        return bScore - aScore;
      })
      .slice(0, 5);
  }

  private calculateGrowthRate(start: number, end: number): number {
    if (start === 0) return end > 0 ? 100 : 0;
    return ((end - start) / start) * 100;
  }

  private calculateEngagementRate(metrics: any): number {
    if (!metrics.followers || metrics.followers === 0) return 0;
    return (metrics.engagement / metrics.followers) * 100;
  }

  private calculateConversionRate(metrics: any): number {
    if (!metrics.clicks || metrics.clicks === 0) return 0;
    return (metrics.conversions / metrics.clicks) * 100;
  }

  private calculatePostScore(metrics: any): number {
    return (
      metrics.reach * 0.3 +
      metrics.engagement * 0.4 +
      metrics.clicks * 0.2 +
      metrics.conversions * 0.1
    );
  }
} 