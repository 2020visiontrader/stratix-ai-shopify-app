import { db } from '../lib/supabase';

export class FreezeManager {
  static async setFreeze(brandId: string, freeze: boolean): Promise<boolean> {
    try {
      await db.from('automation_settings').upsert({
        brand_id: brandId,
        freeze,
        updated_at: new Date()
      });
      return true;
    } catch (error) {
      console.error('Error setting freeze flag:', error);
      return false;
    }
  }

  static async getFreeze(brandId: string): Promise<boolean> {
    try {
      const { data, error } = await db
        .from('automation_settings')
        .select('freeze')
        .eq('brand_id', brandId)
        .single();
      if (error) {
        console.error('Error fetching freeze flag:', error);
        return false;
      }
      return !!data?.freeze;
    } catch (error) {
      console.error('Error retrieving freeze flag:', error);
      return false;
    }
  }
} 