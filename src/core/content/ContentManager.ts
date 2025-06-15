import { db } from '../../lib/supabase';

interface ContentVersion {
  id: string;
  content_id: string;
  version: number;
  content: string;
  metadata: {
    author: string;
    changes: string[];
    approval_status: 'pending' | 'approved' | 'rejected';
    approved_by?: string;
    approved_at?: Date;
  };
  created_at: Date;
  updated_at: Date;
}

interface ContentSchedule {
  id: string;
  content_id: string;
  version_id: string;
  publish_at: Date;
  unpublish_at?: Date;
  channels: string[];
  status: 'scheduled' | 'published' | 'completed' | 'cancelled';
}

interface ContentDistribution {
  id: string;
  content_id: string;
  version_id: string;
  channel: string;
  status: 'pending' | 'published' | 'failed';
  metrics: {
    impressions: number;
    engagements: number;
    clicks: number;
    conversions: number;
  };
  published_at?: Date;
  error?: string;
}

export class ContentManager {
  private static instance: ContentManager;

  private constructor() {}

  public static getInstance(): ContentManager {
    if (!ContentManager.instance) {
      ContentManager.instance = new ContentManager();
    }
    return ContentManager.instance;
  }

  public async createVersion(
    contentId: string,
    content: string,
    author: string,
    changes: string[]
  ): Promise<ContentVersion> {
    try {
      // Get latest version number
      const { data: latest, error: latestError } = await db.content_versions.getLatestVersion(contentId);
      if (latestError) throw latestError;

      const nextVersion = latest ? latest.version + 1 : 1;

      const { data, error } = await db.content_versions.create({
        content_id: contentId,
        version: nextVersion,
        content,
        metadata: {
          author,
          changes,
          approval_status: 'pending'
        }
      });

      if (error) throw error;
      if (!data) throw new Error('Failed to create content version');

      return data;
    } catch (error: unknown) {
      console.error('Error creating content version:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to create content version: ${error.message}`);
      }
      throw new Error('Failed to create content version: Unknown error occurred');
    }
  }

  public async approveVersion(
    versionId: string,
    approver: string
  ): Promise<ContentVersion> {
    try {
      const { data, error } = await db.content_versions.update(versionId, {
        metadata: {
          approval_status: 'approved',
          approved_by: approver,
          approved_at: new Date()
        }
      });

      if (error) throw error;
      if (!data) throw new Error('Failed to approve content version');

      return data;
    } catch (error: unknown) {
      console.error('Error approving content version:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to approve content version: ${error.message}`);
      }
      throw new Error('Failed to approve content version: Unknown error occurred');
    }
  }

  public async scheduleContent(
    contentId: string,
    versionId: string,
    publishAt: Date,
    unpublishAt: Date | undefined,
    channels: string[]
  ): Promise<ContentSchedule> {
    try {
      const { data, error } = await db.content_schedules.create({
        content_id: contentId,
        version_id: versionId,
        publish_at: publishAt,
        unpublish_at: unpublishAt,
        channels,
        status: 'scheduled'
      });

      if (error) throw error;
      if (!data) throw new Error('Failed to schedule content');

      return data;
    } catch (error: unknown) {
      console.error('Error scheduling content:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to schedule content: ${error.message}`);
      }
      throw new Error('Failed to schedule content: Unknown error occurred');
    }
  }

  public async distributeContent(
    contentId: string,
    versionId: string,
    channel: string
  ): Promise<ContentDistribution> {
    try {
      // Create distribution record
      const { data, error } = await db.content_distributions.create({
        content_id: contentId,
        version_id: versionId,
        channel,
        status: 'pending',
        metrics: {
          impressions: 0,
          engagements: 0,
          clicks: 0,
          conversions: 0
        }
      });

      if (error) throw error;
      if (!data) throw new Error('Failed to create content distribution');

      // TODO: Implement actual distribution logic for different channels
      // This would involve integrating with various platforms' APIs

      // Update status to published
      const { data: updatedData, error: updateError } = await db.content_distributions.update(
        data.id,
        {
          status: 'published',
          published_at: new Date()
        }
      );

      if (updateError) throw updateError;
      if (!updatedData) throw new Error('Failed to update distribution status');

      return updatedData;
    } catch (error: unknown) {
      console.error('Error distributing content:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to distribute content: ${error.message}`);
      }
      throw new Error('Failed to distribute content: Unknown error occurred');
    }
  }

  public async updateDistributionMetrics(
    distributionId: string,
    metrics: Partial<ContentDistribution['metrics']>
  ): Promise<ContentDistribution> {
    try {
      const { data, error } = await db.content_distributions.updateMetrics(
        distributionId,
        metrics
      );

      if (error) throw error;
      if (!data) throw new Error('Failed to update distribution metrics');

      return data;
    } catch (error: unknown) {
      console.error('Error updating distribution metrics:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to update distribution metrics: ${error.message}`);
      }
      throw new Error('Failed to update distribution metrics: Unknown error occurred');
    }
  }
} 