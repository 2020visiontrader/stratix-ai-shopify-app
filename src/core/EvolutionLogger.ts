import { SupabaseClient } from '@supabase/supabase-js';
import { db } from '../lib/supabase';
import { Database, EvolutionLog } from '../types/database';

export class EvolutionLogger {
  private brandId: string;
  private client: SupabaseClient<Database>;

  constructor(brandId: string) {
    this.brandId = brandId;
    this.client = db;
  }

  async log(entry: Omit<EvolutionLog, 'id' | 'brand_id'>): Promise<EvolutionLog | null> {
    const timestamp = new Date();
    const logEntry = {
      ...entry,
      brand_id: this.brandId,
      timestamp: entry.timestamp || timestamp
    };

    const { data, error } = await this.client
      .from('evolution_logs')
      .insert(logEntry)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to log evolution: ${error.message}`);
    }

    return data;
  }

  async getLogsByType(type: EvolutionLog['type'], limit = 10): Promise<EvolutionLog[]> {
    const { data, error } = await this.client
      .from('evolution_logs')
      .select('*')
      .eq('brand_id', this.brandId)
      .eq('type', type)
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch logs: ${error.message}`);
    }

    return data || [];
  }

  async getLogsByDateRange(startDate: Date, endDate: Date): Promise<EvolutionLog[]> {
    const { data, error } = await this.client
      .from('evolution_logs')
      .select('*')
      .eq('brand_id', this.brandId)
      .gte('timestamp', startDate.toISOString())
      .lte('timestamp', endDate.toISOString())
      .order('timestamp', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch logs: ${error.message}`);
    }

    return data || [];
  }

  async getLatestLogs(limit = 10): Promise<EvolutionLog[]> {
    const { data, error } = await this.client
      .from('evolution_logs')
      .select('*')
      .eq('brand_id', this.brandId)
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch logs: ${error.message}`);
    }

    return data || [];
  }

  async getLogsByImpactedArea(area: string, limit = 10): Promise<EvolutionLog[]> {
    const { data, error } = await this.client
      .from('evolution_logs')
      .select('*')
      .eq('brand_id', this.brandId)
      .contains('changes->impact_areas', [area])
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch logs: ${error.message}`);
    }

    return data || [];
  }

  async getMetricsSummary(
    type: EvolutionLog['type'],
    startDate: Date,
    endDate: Date
  ): Promise<Record<string, number>> {
    const logs = await this.getLogsByDateRange(startDate, endDate);
    const filteredLogs = logs.filter(log => log.type === type);

    return filteredLogs.reduce((acc: Record<string, number>, log) => {
      if (log.metrics) {
        const metrics = log.metrics as Record<string, number>;
        Object.entries(metrics).forEach(([key, value]) => {
          acc[key] = (acc[key] || 0) + value;
        });
      }
      return acc;
    }, {});
  }

  public async getEvolutionHistory(
    brandId: string,
    options: {
      type?: EvolutionLog['type'];
      startDate?: Date;
      endDate?: Date;
      limit?: number;
    } = {}
  ): Promise<EvolutionLog[]> {
    try {
      let logs;

      if (options.startDate && options.endDate) {
        // Get logs by date range
        const { data } = await db.evolution_logs.getByDateRange(
          brandId,
          options.startDate,
          options.endDate
        );
        logs = data;
      } else if (options.type) {
        // Get logs by type
        const { data } = await db.evolution_logs.getByType(brandId, options.type);
        logs = data;
      } else {
        // Get latest logs
        const { data } = await db.evolution_logs.getLatest(brandId, options.limit);
        logs = data;
      }

      return logs || [];

    } catch (error) {
      console.error('Error getting evolution history:', error);
      throw error;
    }
  }

  public async getEvolutionSummary(
    brandId: string,
    timeframe: 'day' | 'week' | 'month' = 'week'
  ): Promise<{
    total_changes: number;
    performance_improvements: number;
    top_impact_areas: string[];
    confidence_trend: number;
  }> {
    try {
      // Get date range based on timeframe
      const endDate = new Date();
      const startDate = new Date();
      switch (timeframe) {
        case 'day':
          startDate.setDate(startDate.getDate() - 1);
          break;
        case 'week':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(startDate.getMonth() - 1);
          break;
      }

      // Get logs for timeframe
      const { data: logs } = await db.evolution_logs.getByDateRange(
        brandId,
        startDate,
        endDate
      );

      if (!logs?.length) {
        return {
          total_changes: 0,
          performance_improvements: 0,
          top_impact_areas: [],
          confidence_trend: 0
        };
      }

      // Calculate summary metrics
      const impactAreas = new Map<string, number>();
      let improvements = 0;
      let totalConfidence = 0;

      logs.forEach(log => {
        // Count impact areas
        log.changes.impact_areas.forEach(area => {
          impactAreas.set(area, (impactAreas.get(area) || 0) + 1);
        });

        // Count improvements
        if (log.metrics?.performance_delta && log.metrics.performance_delta > 0) {
          improvements++;
        }

        // Sum confidence scores
        if (log.metrics?.confidence_score) {
          totalConfidence += log.metrics.confidence_score;
        }
      });

      // Get top impact areas
      const topAreas = Array.from(impactAreas.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([area]) => area);

      return {
        total_changes: logs.length,
        performance_improvements: improvements,
        top_impact_areas: topAreas,
        confidence_trend: totalConfidence / logs.length
      };

    } catch (error) {
      console.error('Error getting evolution summary:', error);
      throw error;
    }
  }

  public async getSignificantChanges(
    brandId: string,
    threshold: number = 0.1
  ): Promise<EvolutionLog[]> {
    try {
      // Get all logs
      const { data: logs } = await db.evolution_logs.getByBrandId(brandId);
      if (!logs) return [];

      // Filter significant changes
      return logs.filter(log => {
        const delta = log.metrics?.performance_delta || 0;
        const confidence = log.metrics?.confidence_score || 0;
        return Math.abs(delta) >= threshold && confidence >= 0.7;
      });

    } catch (error) {
      console.error('Error getting significant changes:', error);
      throw error;
    }
  }

  public async getChangeExplanation(log: EvolutionLog): Promise<string> {
    const explanations: Record<EvolutionLog['type'], string> = {
      CONTENT_CHANGE: this.explainContentChange,
      STRATEGY_UPDATE: this.explainStrategyUpdate,
      PROMPT_PERFORMANCE: this.explainPromptPerformance,
      MODEL_ADJUSTMENT: this.explainModelAdjustment
    };

    const explainer = explanations[log.type];
    return explainer ? explainer(log) : 'No explanation available';
  }

  private explainContentChange(log: EvolutionLog): string {
    const { trigger, changes, metrics } = log;
    const improvement = metrics?.performance_delta || 0;
    const confidence = metrics?.confidence_score || 0;

    return `Content was updated based on ${trigger.source} ${trigger.action}. ` +
      `This change ${improvement > 0 ? 'improved' : 'affected'} performance by ${Math.abs(improvement * 100).toFixed(1)}% ` +
      `with ${(confidence * 100).toFixed(1)}% confidence. ` +
      `Impact areas: ${changes.impact_areas.join(', ')}.`;
  }

  private explainStrategyUpdate(log: EvolutionLog): string {
    const { trigger, changes } = log;
    
    return `Strategy was updated via ${trigger.source} ${trigger.action}. ` +
      `Changes affected: ${changes.impact_areas.join(', ')}. ` +
      `This update helps maintain brand consistency and performance.`;
  }

  private explainPromptPerformance(log: EvolutionLog): string {
    const { trigger, metrics } = log;
    const improvement = metrics?.performance_delta || 0;
    
    return `AI prompt performance was ${improvement > 0 ? 'improved' : 'adjusted'} ` +
      `based on ${trigger.source} feedback. ` +
      `This helps generate more effective content for your brand.`;
  }

  private explainModelAdjustment(log: EvolutionLog): string {
    const { trigger, changes } = log;
    
    return `AI model was adjusted based on ${trigger.source} insights. ` +
      `This improves: ${changes.impact_areas.join(', ')}. ` +
      `These adjustments help the AI better understand your brand.`;
  }
} 