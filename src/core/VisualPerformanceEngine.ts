import { db } from '../lib/supabase';

export interface ImageVariant {
  id: string;
  productId: string;
  position: string;
  background: string;
  focus: string;
  imageUrl: string;
}

export interface HeatmapStats {
  variantId: string;
  clicks: number;
  scrollDepth: number;
  zones: Record<string, number>; // e.g., { 'top-right': 42 }
}

export class VisualPerformanceEngine {
  /**
   * Run image variant tests and log stats.
   */
  async runVariantTest(productId: string, variants: ImageVariant[]): Promise<void> {
    // TODO: Assign variants to users and collect stats
    // Placeholder: log each variant with dummy stats
    for (const variant of variants) {
      await this.logHeatmapStats({
        variantId: variant.id,
        clicks: Math.floor(Math.random() * 100),
        scrollDepth: Math.random(),
        zones: { 'top-right': Math.floor(Math.random() * 50) }
      });
    }
  }

  /**
   * Log heatmap stats for a variant.
   */
  async logHeatmapStats(stats: HeatmapStats): Promise<boolean> {
    try {
      await db.from('image_test_variants').upsert({
        variant_id: stats.variantId,
        data: stats,
        created_at: new Date()
      });
      return true;
    } catch (error) {
      console.error('Error logging heatmap stats:', error);
      return false;
    }
  }

  /**
   * Recommend the best performing variant.
   */
  async recommendBestVariant(productId: string): Promise<ImageVariant | null> {
    try {
      const { data, error } = await db
        .from('image_test_variants')
        .select('data')
        .order('data->clicks', { ascending: false })
        .limit(1);
      if (error) {
        console.error('Error fetching best image variant:', error);
        return null;
      }
      return data?.[0]?.data || null;
    } catch (error) {
      console.error('Error recommending best image variant:', error);
      return null;
    }
  }
} 