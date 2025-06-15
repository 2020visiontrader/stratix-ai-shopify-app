import { db } from '../lib/supabase';

export interface WeeklyDigest {
  brandId: string;
  weekOf: Date;
  topCampaigns: string[];
  recommendedActions: string[];
  strategyShifts: string[];
  conversionLift: number;
  pdfUrl?: string;
  sentTo: string[];
  createdAt: Date;
}

export class WeeklyDigestBuilder {
  private brandId: string;

  constructor(brandId: string) {
    this.brandId = brandId;
  }

  /**
   * Generate a weekly digest for the brand.
   */
  async generateDigest(): Promise<WeeklyDigest | null> {
    try {
      const digest: WeeklyDigest = {
        brandId: this.brandId,
        weekOf: new Date(),
        topCampaigns: ['Campaign A', 'Campaign B'],
        recommendedActions: ['Increase budget on Campaign A'],
        strategyShifts: ['Shifted to urgency-based CTAs'],
        conversionLift: 0.12,
        sentTo: ['owner@example.com'],
        createdAt: new Date()
      };
      await db.from('weekly_digests').upsert({
        brand_id: this.brandId,
        data: digest,
        created_at: digest.createdAt
      });
      return digest;
    } catch (error) {
      console.error('Error generating weekly digest:', error);
      return null;
    }
  }

  /**
   * Retrieve weekly digests for the brand.
   */
  async getDigests(): Promise<WeeklyDigest[]> {
    try {
      const { data, error } = await db
        .from('weekly_digests')
        .select('data')
        .eq('brand_id', this.brandId)
        .order('created_at', { ascending: false });
      if (error) {
        console.error('Error fetching weekly digests:', error);
        return [];
      }
      return (data || []).map((row: { data: WeeklyDigest }) => row.data);
    } catch (error) {
      console.error('Error retrieving weekly digests:', error);
      return [];
    }
  }
} 