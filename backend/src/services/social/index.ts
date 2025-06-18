import { supabase } from '../../db';
import { AppError } from '../../utils/errors';
import { logger } from '../../utils/logger';
import { AIService } from '../ai';

export interface SocialPost {
  id: string;
  product_id: string;
  platform: 'facebook' | 'instagram' | 'twitter' | 'linkedin';
  content: string;
  media_url?: string;
  scheduled_time?: Date;
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  metrics?: {
    reach: number;
    engagement: number;
    clicks: number;
  };
}

export class SocialMediaManager {
  private aiService: AIService;

  constructor() {
    this.aiService = new AIService();
  }

  async generatePost(
    productId: string,
    platform: 'facebook' | 'instagram' | 'twitter' | 'linkedin',
    productInfo: {
      title: string;
      description: string;
      price: number;
      images: string[];
    }
  ): Promise<SocialPost> {
    try {
      // Generate platform-specific content
      const content = await this.generatePlatformContent(platform, productInfo);

      // Create post record
      const { data, error } = await supabase
        .from('social_posts')
        .insert({
          product_id: productId,
          platform,
          content: content,
          status: 'draft',
          created_at: new Date()
        })
        .select()
        .single();

      if (error) throw error;
      return data as SocialPost;
    } catch (error) {
      logger.error('Error generating post:', error);
      throw new AppError(500, 'SOCIAL_ERROR', 'Failed to generate post', error);
    }
  }

  private async generatePlatformContent(
    platform: 'facebook' | 'instagram' | 'twitter' | 'linkedin',
    productInfo: {
      title: string;
      description: string;
      price: number;
      images: string[];
    }
  ): Promise<string> {
    const prompt = this.getPlatformPrompt(platform, productInfo);
    
    try {
      const aiResponse = await this.aiService.generateContent(
        prompt,
        'description',
        'gpt-4'
      );

      return aiResponse.content;
    } catch (error) {
      logger.error('Error generating platform content:', error);
      throw new AppError(500, 'AI_ERROR', 'Failed to generate platform content', error);
    }
  }

  private getPlatformPrompt(
    platform: 'facebook' | 'instagram' | 'twitter' | 'linkedin',
    productInfo: {
      title: string;
      description: string;
      price: number;
      images: string[];
    }
  ): string {
    const basePrompt = `
      Create a social media post for ${platform} about this product:
      Title: ${productInfo.title}
      Description: ${productInfo.description}
      Price: $${productInfo.price}
      Number of images: ${productInfo.images.length}
    `;

    switch (platform) {
      case 'facebook':
        return `${basePrompt}
          Requirements:
          - Engaging and conversational tone
          - Include a call-to-action
          - Highlight key benefits
          - Keep it under 200 characters`;
      case 'instagram':
        return `${basePrompt}
          Requirements:
          - Use emojis appropriately
          - Include relevant hashtags
          - Focus on visual appeal
          - Keep it under 150 characters`;
      case 'twitter':
        return `${basePrompt}
          Requirements:
          - Concise and impactful
          - Use relevant hashtags
          - Include a link
          - Keep it under 280 characters`;
      case 'linkedin':
        return `${basePrompt}
          Requirements:
          - Professional tone
          - Focus on business value
          - Include industry insights
          - Keep it under 200 characters`;
      default:
        throw new Error('Invalid platform');
    }
  }

  async schedulePost(
    postId: string,
    scheduledTime: Date
  ): Promise<SocialPost> {
    try {
      const { data, error } = await supabase
        .from('social_posts')
        .update({
          scheduled_time: scheduledTime,
          status: 'scheduled'
        })
        .eq('id', postId)
        .select()
        .single();

      if (error) throw error;
      return data as SocialPost;
    } catch (error) {
      logger.error('Error scheduling post:', error);
      throw new AppError(500, 'DATABASE_ERROR', 'Failed to schedule post', error);
    }
  }

  async publishPost(postId: string): Promise<SocialPost> {
    try {
      // In a real implementation, this would integrate with social media APIs
      const { data, error } = await supabase
        .from('social_posts')
        .update({
          status: 'published',
          published_at: new Date()
        })
        .eq('id', postId)
        .select()
        .single();

      if (error) throw error;
      return data as SocialPost;
    } catch (error) {
      logger.error('Error publishing post:', error);
      throw new AppError(500, 'SOCIAL_ERROR', 'Failed to publish post', error);
    }
  }

  async getScheduledPosts(
    productId: string,
    platform?: 'facebook' | 'instagram' | 'twitter' | 'linkedin'
  ): Promise<SocialPost[]> {
    try {
      let query = supabase
        .from('social_posts')
        .select('*')
        .eq('product_id', productId)
        .eq('status', 'scheduled')
        .order('scheduled_time', { ascending: true });

      if (platform) {
        query = query.eq('platform', platform);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as SocialPost[];
    } catch (error) {
      logger.error('Error getting scheduled posts:', error);
      throw new AppError(500, 'DATABASE_ERROR', 'Failed to get scheduled posts', error);
    }
  }

  async updatePostMetrics(
    postId: string,
    metrics: {
      reach: number;
      engagement: number;
      clicks: number;
    }
  ): Promise<SocialPost> {
    try {
      const { data, error } = await supabase
        .from('social_posts')
        .update({
          metrics,
          updated_at: new Date()
        })
        .eq('id', postId)
        .select()
        .single();

      if (error) throw error;
      return data as SocialPost;
    } catch (error) {
      logger.error('Error updating post metrics:', error);
      throw new AppError(500, 'DATABASE_ERROR', 'Failed to update post metrics', error);
    }
  }
} 