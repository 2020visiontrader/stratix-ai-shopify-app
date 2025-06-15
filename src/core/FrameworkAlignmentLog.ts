import { db } from '../lib/supabase';

export interface FrameworkChangeLog {
  brandId: string;
  versionHash: string;
  timestamp: Date;
  reason: string;
  details: string;
}

export class FrameworkAlignmentLog {
  private brandId: string;

  constructor(brandId: string) {
    this.brandId = brandId;
  }

  /**
   * Log a framework or prompt change.
   */
  async logChange(log: Omit<FrameworkChangeLog, 'brandId'>): Promise<boolean> {
    try {
      await db.from('framework_logs').upsert({
        brand_id: this.brandId,
        version_hash: log.versionHash,
        timestamp: log.timestamp,
        reason: log.reason,
        details: log.details,
        created_at: log.timestamp
      });
      return true;
    } catch (error) {
      console.error('Error logging framework change:', error);
      return false;
    }
  }

  /**
   * Retrieve change history for the brand.
   */
  async getChangeHistory(): Promise<FrameworkChangeLog[]> {
    try {
      const { data, error } = await db
        .from('framework_logs')
        .select('*')
        .eq('brand_id', this.brandId)
        .order('timestamp', { ascending: false });
      if (error) {
        console.error('Error fetching framework change history:', error);
        return [];
      }
      return (data || []).map((row: any) => ({
        brandId: row.brand_id,
        versionHash: row.version_hash,
        timestamp: new Date(row.timestamp),
        reason: row.reason,
        details: row.details
      }));
    } catch (error) {
      console.error('Error retrieving framework change history:', error);
      return [];
    }
  }
} 