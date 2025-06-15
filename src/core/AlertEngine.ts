import { db } from '../lib/supabase';

export type AlertType = 'test_confidence' | 'bounce_spike' | 'rewrite_ready' | 'framework_evolve';

export interface Alert<T = Record<string, unknown>> {
  brandId: string;
  type: AlertType;
  message: string;
  data?: T;
  timestamp: Date;
  sentVia: ('in-app' | 'slack' | 'email')[];
}

export class AlertEngine {
  /**
   * Trigger and log an alert.
   */
  static async triggerAlert<T = Record<string, unknown>>(alert: Alert<T>): Promise<boolean> {
    try {
      await db.from('alerts').upsert({
        brand_id: alert.brandId,
        type: alert.type,
        message: alert.message,
        data: alert.data,
        sent_via: alert.sentVia,
        timestamp: alert.timestamp,
        created_at: alert.timestamp
      });
      // TODO: Send via Slack/Email if connected
      return true;
    } catch (error) {
      console.error('Error triggering alert:', error);
      return false;
    }
  }

  /**
   * Retrieve alerts for a brand.
   */
  static async getAlerts<T = Record<string, unknown>>(brandId: string): Promise<Alert<T>[]> {
    try {
      const { data, error } = await db
        .from('alerts')
        .select('*')
        .eq('brand_id', brandId)
        .order('timestamp', { ascending: false });
      if (error) {
        console.error('Error fetching alerts:', error);
        return [];
      }
      return (data || []).map((row: any) => ({
        brandId: row.brand_id,
        type: row.type,
        message: row.message,
        data: row.data,
        timestamp: new Date(row.timestamp),
        sentVia: row.sent_via
      }));
    } catch (error) {
      console.error('Error retrieving alerts:', error);
      return [];
    }
  }
} 