import { db } from '../lib/supabase';

export interface CampaignTag {
  campaignId: string;
  tag: string; // e.g., 'CTA_SHORT/SALE_TARGET/MIDFUNNEL'
  attachedBy: string;
  timestamp: Date;
}

export class TaggingEngine {
  /**
   * Attach a tag to a campaign.
   */
  static async attachTag(campaignId: string, tag: string, attachedBy: string): Promise<boolean> {
    try {
      await db.from('campaign_tags').upsert({
        campaign_id: campaignId,
        tag,
        attached_by: attachedBy,
        timestamp: new Date(),
        created_at: new Date()
      });
      return true;
    } catch (error) {
      console.error('Error attaching tag:', error);
      return false;
    }
  }

  /**
   * Retrieve tags for a campaign.
   */
  static async getTags(campaignId: string): Promise<CampaignTag[]> {
    try {
      const { data, error } = await db
        .from('campaign_tags')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('timestamp', { ascending: false });
      if (error) {
        console.error('Error fetching campaign tags:', error);
        return [];
      }
      return (data || []).map((row: any) => ({
        campaignId: row.campaign_id,
        tag: row.tag,
        attachedBy: row.attached_by,
        timestamp: new Date(row.timestamp)
      }));
    } catch (error) {
      console.error('Error retrieving campaign tags:', error);
      return [];
    }
  }
} 