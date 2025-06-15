import { db } from '../lib/supabase';

export interface AATestVariant {
  id: string;
  content: string;
}

export interface AATestResult {
  conversionsA: number;
  conversionsB: number;
  confidence: number;
  segments: Record<string, number>;
}

export interface AATestLog {
  campaign_id: string;
  variant_a: AATestVariant;
  variant_b: AATestVariant;
  result: AATestResult;
  created_at: Date;
}

export class SplitTestManager {
  static async logAATestResult(
    campaignId: string,
    variantA: AATestVariant,
    variantB: AATestVariant,
    result: AATestResult
  ): Promise<boolean> {
    try {
      await db.from('aa_tests').upsert({
        campaign_id: campaignId,
        variant_a: variantA,
        variant_b: variantB,
        result,
        created_at: new Date()
      });
      return true;
    } catch (error) {
      console.error('Error logging A/A test result:', error);
      return false;
    }
  }

  static async getAATestResult(campaignId: string): Promise<AATestLog | null> {
    try {
      const { data, error } = await db
        .from('aa_tests')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: false })
        .single();
      if (error) {
        console.error('Error fetching A/A test result:', error);
        return null;
      }
      return data as AATestLog;
    } catch (error) {
      console.error('Error retrieving A/A test result:', error);
      return null;
    }
  }
} 