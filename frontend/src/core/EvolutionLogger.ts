import { db } from '../lib/supabase';

export interface EvolutionLog {
  id?: string;
  brand_id: string;
  timestamp: Date;
  type: 'CONTENT_CHANGE' | 'STRATEGY_UPDATE' | 'PROMPT_PERFORMANCE' | 'MODEL_ADJUSTMENT';
  trigger: {
    source: string;
    action: string;
    metadata: Record<string, any>;
  };
  changes: {
    before: Record<string, any>;
    after: Record<string, any>;
    impact_areas: string[];
  };
  metrics?: {
    performance_delta?: number;
    confidence_score?: number;
  };
}

export class EvolutionLogger {
  private brandId: string;

  constructor(brandId: string) {
    this.brandId = brandId;
  }

  async log(entry: Omit<EvolutionLog, 'id' | 'brand_id'>): Promise<EvolutionLog | null> {
    const timestamp = new Date();
    const logEntry = {
      ...entry,
      brand_id: this.brandId,
      timestamp: entry.timestamp || timestamp
    };

    try {
      const { data, error } = await db
        .from('evolution_logs')
        .insert(logEntry)
        .select()
        .single();

      if (error) {
        console.error('Failed to log evolution:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error logging evolution:', error);
      return null;
    }
  }

  async getLogsByType(type: EvolutionLog['type'], limit = 10): Promise<EvolutionLog[]> {
    try {
      const { data, error } = await db
        .from('evolution_logs')
        .select('*')
        .eq('brand_id', this.brandId)
        .eq('type', type)
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Failed to fetch logs:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching logs:', error);
      return [];
    }
  }

  async getLatestLogs(limit = 10): Promise<EvolutionLog[]> {
    try {
      const { data, error } = await db
        .from('evolution_logs')
        .select('*')
        .eq('brand_id', this.brandId)
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Failed to fetch logs:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching logs:', error);
      return [];
    }
  }
}