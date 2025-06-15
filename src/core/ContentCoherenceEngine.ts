import { db } from '../lib/supabase';

export interface ContentComparison {
  adHeadline: string;
  landingH1: string;
  adVisual: string;
  storeHero: string;
  adPromo: string;
  storePromo: string;
}

export interface CoherenceReport {
  campaignId: string;
  mismatches: string[];
  suggestions: string[];
  timestamp: Date;
}

export class ContentCoherenceEngine {
  static checkCoherence(content: ContentComparison): CoherenceReport {
    const mismatches: string[] = [];
    const suggestions: string[] = [];
    if (content.adHeadline !== content.landingH1) {
      mismatches.push('Ad headline and landing H1 do not match.');
      suggestions.push('Align headline messaging.');
    }
    if (content.adPromo !== content.storePromo) {
      mismatches.push('Promo code/offer mismatch.');
      suggestions.push('Update store to match ad offer.');
    }
    return {
      campaignId: '',
      mismatches,
      suggestions,
      timestamp: new Date()
    };
  }

  static async logReport(campaignId: string, report: CoherenceReport): Promise<boolean> {
    try {
      await db.from('coherence_reports').upsert({
        campaign_id: campaignId,
        data: report,
        created_at: report.timestamp
      });
      return true;
    } catch (error) {
      console.error('Error logging coherence report:', error);
      return false;
    }
  }
} 