import { db } from '../lib/supabase';

interface EvolutionEvent {
  type: 'STRATEGY_UPDATE' | 'PROMPT_PERFORMANCE' | 'ADMIN_TUNING' | 'MODEL_ADJUSTMENT';
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
    sample_size?: number;
  };
  timestamp: Date;
}

interface EvolutionSummary {
  total_changes: number;
  performance_trend: 'improving' | 'stable' | 'declining';
  key_milestones: Array<{
    date: Date;
    description: string;
    impact: number;
  }>;
  current_state: {
    active_strategies: string[];
    performance_score: number;
    last_updated: Date;
  };
}

export class AIEvolutionLogger {
  private static instance: AIEvolutionLogger;
  
  private constructor() {}

  public static getInstance(): AIEvolutionLogger {
    if (!AIEvolutionLogger.instance) {
      AIEvolutionLogger.instance = new AIEvolutionLogger();
    }
    return AIEvolutionLogger.instance;
  }

  public async logEvolution(brandId: string, event: Omit<EvolutionEvent, 'timestamp'>): Promise<void> {
    try {
      // Create evolution record
      const evolutionEvent: EvolutionEvent = {
        ...event,
        timestamp: new Date()
      };

      // Store in database
      await db.evolution_logs.create({
        brand_id: brandId,
        event_type: event.type,
        trigger: event.trigger,
        changes: event.changes,
        metrics: event.metrics,
        timestamp: evolutionEvent.timestamp
      });

      // Update summary metrics
      await this.updateEvolutionSummary(brandId, evolutionEvent);

      // Trigger notifications if significant changes
      if (this.isSignificantChange(event)) {
        await this.notifyStakeholders(brandId, evolutionEvent);
      }

    } catch (error) {
      console.error('Error logging AI evolution:', error);
      throw error;
    }
  }

  public async getEvolutionHistory(brandId: string, options: {
    startDate?: Date;
    endDate?: Date;
    eventTypes?: EvolutionEvent['type'][];
    limit?: number;
  } = {}): Promise<EvolutionEvent[]> {
    let query = db.evolution_logs.getByBrandId(brandId);

    if (options.startDate) {
      query = query.gte('timestamp', options.startDate.toISOString());
    }

    if (options.endDate) {
      query = query.lte('timestamp', options.endDate.toISOString());
    }

    if (options.eventTypes?.length) {
      query = query.in('event_type', options.eventTypes);
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    const { data: events } = await query;
    return events || [];
  }

  public async getEvolutionSummary(brandId: string): Promise<EvolutionSummary> {
    const { data: summary } = await db.evolution_summaries.getByBrandId(brandId);
    
    if (!summary) {
      return this.initializeEvolutionSummary(brandId);
    }

    return summary;
  }

  private async initializeEvolutionSummary(brandId: string): Promise<EvolutionSummary> {
    const summary: EvolutionSummary = {
      total_changes: 0,
      performance_trend: 'stable',
      key_milestones: [],
      current_state: {
        active_strategies: [],
        performance_score: 0,
        last_updated: new Date()
      }
    };

    await db.evolution_summaries.create({
      brand_id: brandId,
      ...summary
    });

    return summary;
  }

  private async updateEvolutionSummary(brandId: string, event: EvolutionEvent): Promise<void> {
    const { data: summary } = await db.evolution_summaries.getByBrandId(brandId);
    
    if (!summary) {
      return;
    }

    const updates: Partial<EvolutionSummary> = {
      total_changes: summary.total_changes + 1,
      current_state: {
        ...summary.current_state,
        last_updated: event.timestamp
      }
    };

    // Update performance trend
    if (event.metrics?.performance_delta) {
      updates.performance_trend = this.calculatePerformanceTrend(
        summary.current_state.performance_score,
        event.metrics.performance_delta
      );
      
      updates.current_state.performance_score = 
        summary.current_state.performance_score + event.metrics.performance_delta;
    }

    // Add to key milestones if significant
    if (this.isSignificantChange(event)) {
      updates.key_milestones = [
        ...summary.key_milestones,
        {
          date: event.timestamp,
          description: this.generateMilestoneDescription(event),
          impact: event.metrics?.performance_delta || 0
        }
      ].slice(-10); // Keep last 10 milestones
    }

    // Update active strategies
    if (event.type === 'STRATEGY_UPDATE') {
      updates.current_state = {
        ...updates.current_state,
        active_strategies: this.updateActiveStrategies(
          summary.current_state.active_strategies,
          event.changes
        )
      };
    }

    await db.evolution_summaries.update(brandId, updates);
  }

  private calculatePerformanceTrend(
    currentScore: number,
    delta: number
  ): EvolutionSummary['performance_trend'] {
    const THRESHOLD = 0.05; // 5% change threshold
    const percentageChange = Math.abs(delta / currentScore);

    if (percentageChange < THRESHOLD) return 'stable';
    return delta > 0 ? 'improving' : 'declining';
  }

  private updateActiveStrategies(current: string[], changes: EvolutionEvent['changes']): string[] {
    const removed = changes.before.strategies || [];
    const added = changes.after.strategies || [];

    return [...new Set([
      ...current.filter(s => !removed.includes(s)),
      ...added
    ])];
  }

  private isSignificantChange(event: Omit<EvolutionEvent, 'timestamp'>): boolean {
    if (!event.metrics) return false;

    const SIGNIFICANCE_THRESHOLDS = {
      performance_delta: 0.1, // 10% change
      confidence_score: 0.8, // 80% confidence
      sample_size: 100 // Minimum sample size
    };

    return (
      Math.abs(event.metrics.performance_delta || 0) >= SIGNIFICANCE_THRESHOLDS.performance_delta &&
      (event.metrics.confidence_score || 0) >= SIGNIFICANCE_THRESHOLDS.confidence_score &&
      (event.metrics.sample_size || 0) >= SIGNIFICANCE_THRESHOLDS.sample_size
    );
  }

  private generateMilestoneDescription(event: EvolutionEvent): string {
    const descriptions: Record<EvolutionEvent['type'], string> = {
      STRATEGY_UPDATE: 'New strategy implementation',
      PROMPT_PERFORMANCE: 'Significant performance change detected',
      ADMIN_TUNING: 'Manual optimization by admin',
      MODEL_ADJUSTMENT: 'Automated model adjustment'
    };

    return `${descriptions[event.type]}: ${event.trigger.action}`;
  }

  private async notifyStakeholders(brandId: string, event: EvolutionEvent): Promise<void> {
    // Get brand admins
    const { data: admins } = await db.brand_admins.getByBrandId(brandId);
    
    if (!admins?.length) return;

    // Prepare notification
    const notification = {
      type: 'AI_EVOLUTION',
      title: 'Significant AI Evolution Detected',
      message: this.generateMilestoneDescription(event),
      metadata: {
        event_type: event.type,
        changes: event.changes,
        metrics: event.metrics
      },
      timestamp: event.timestamp
    };

    // Send notifications
    await Promise.all(
      admins.map(admin =>
        db.notifications.create({
          user_id: admin.user_id,
          ...notification
        })
      )
    );
  }
} 