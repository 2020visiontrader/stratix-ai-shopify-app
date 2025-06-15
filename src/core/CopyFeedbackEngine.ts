import { db } from '../lib/supabase';

export interface CopyPerformance {
  assetId: string;
  ctr: number;
  bounceRate: number;
  sessionTime: number;
  baseline: {
    ctr: number;
    bounceRate: number;
    sessionTime: number;
  };
}

export interface CopySuggestion {
  assetId: string;
  flaggedReason: string;
  suggestions: string[];
  weaknesses: string[];
  timestamp: Date;
}

export class CopyFeedbackEngine {
  /**
   * Monitor deployed copy and compare performance to baseline.
   */
  async monitorPerformance(performance: CopyPerformance): Promise<boolean> {
    try {
      // Compare against baseline
      const underperforming =
        performance.ctr < performance.baseline.ctr * 0.95 ||
        performance.bounceRate > performance.baseline.bounceRate * 1.05;
      return underperforming;
    } catch (error) {
      console.error('Error monitoring copy performance:', error);
      return false;
    }
  }

  /**
   * Flag underperforming copy and generate rewrite suggestions.
   */
  async flagAndSuggest(performance: CopyPerformance): Promise<CopySuggestion | null> {
    try {
      const isUnderperforming = await this.monitorPerformance(performance);
      if (!isUnderperforming) return null;

      // TODO: Analyze weaknesses (e.g., passive voice, missing CTA)
      const weaknesses = ['Passive voice', 'No benefit stated'];

      // TODO: Use AI to generate 2-3 rewrite options
      const suggestions = [
        'Rewrite for clarity and active voice.',
        'Add a clear benefit and strong CTA.',
        'Match brand tone and highlight urgency.'
      ];

      const suggestion: CopySuggestion = {
        assetId: performance.assetId,
        flaggedReason: 'Underperforming vs baseline',
        suggestions,
        weaknesses,
        timestamp: new Date()
      };

      // Store in /copySuggestions/{assetId}
      try {
        await db.from('copy_suggestions').upsert({
          asset_id: suggestion.assetId,
          data: suggestion,
          created_at: suggestion.timestamp
        });
      } catch (dbError) {
        console.error('Error storing copy suggestion:', dbError);
      }

      return suggestion;
    } catch (error) {
      console.error('Error flagging and suggesting copy:', error);
      return null;
    }
  }

  /**
   * Surface suggestions to dashboard for approval.
   */
  async getSuggestions(assetId: string): Promise<CopySuggestion | null> {
    try {
      const { data, error } = await db
        .from('copy_suggestions')
        .select('data')
        .eq('asset_id', assetId)
        .order('created_at', { ascending: false })
        .single();
      if (error) {
        console.error('Error fetching copy suggestions:', error);
        return null;
      }
      return data?.data || null;
    } catch (error) {
      console.error('Error retrieving copy suggestions:', error);
      return null;
    }
  }
} 