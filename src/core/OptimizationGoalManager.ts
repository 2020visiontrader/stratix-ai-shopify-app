import { db } from '../lib/supabase';

export type OptimizationGoal = 'awareness' | 'conversion' | 'engagement';

export interface OptimizationMode {
  campaignId: string;
  goal: OptimizationGoal;
  setBy: string;
  timestamp: Date;
}

export class OptimizationGoalManager {
  /**
   * Set optimization mode for a campaign.
   */
  static async setGoalMode(campaignId: string, goal: OptimizationGoal, setBy: string) {
    await db.from('campaign_optimization_modes').upsert({
      campaign_id: campaignId,
      goal,
      set_by: setBy,
      timestamp: new Date(),
      created_at: new Date()
    });
  }

  /**
   * Get optimization mode for a campaign.
   */
  static async getGoalMode(campaignId: string): Promise<OptimizationMode | null> {
    const { data } = await db
      .from('campaign_optimization_modes')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('timestamp', { ascending: false })
      .single();
    return data || null;
  }
} 