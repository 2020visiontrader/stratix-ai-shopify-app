import { NetworkManager } from '../../../frontend/src/utils/network';

export interface EscalationRule {
  id: string;
  name: string;
  description: string;
  conditions: {
    metric: string;
    operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte' | 'contains' | 'matches';
    value: any;
    duration?: number;
  }[];
  actions: {
    type: 'notification' | 'alert' | 'action' | 'integration';
    target: string;
    message: string;
    data?: Record<string, any>;
  }[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'inactive' | 'testing';
}

export interface EscalationEvent {
  id: string;
  ruleId: string;
  timestamp: Date;
  status: 'triggered' | 'acknowledged' | 'resolved' | 'failed';
  details: {
    conditions: Record<string, any>;
    actions: {
      type: string;
      status: 'pending' | 'success' | 'failed';
      result?: any;
    }[];
    context: Record<string, any>;
  };
}

export interface EscalationMetrics {
  totalEvents: number;
  activeEvents: number;
  averageResolutionTime: number;
  successRate: number;
  byPriority: Record<string, number>;
  byStatus: Record<string, number>;
}

export class EscalationEngine {
  private static instance: EscalationEngine;
  private networkManager: NetworkManager;
  private rules: Map<string, EscalationRule> = new Map();
  private events: Map<string, EscalationEvent[]> = new Map();
  private lastUpdate: Date = new Date();

  private constructor() {
    this.networkManager = NetworkManager.getInstance();
  }

  public static getInstance(): EscalationEngine {
    if (!EscalationEngine.instance) {
      EscalationEngine.instance = new EscalationEngine();
    }
    return EscalationEngine.instance;
  }

  public async addRule(rule: EscalationRule): Promise<void> {
    this.rules.set(rule.id, rule);
    this.lastUpdate = new Date();

    try {
      await this.networkManager.request({
        method: 'POST',
        url: '/api/escalation/rules',
        data: rule,
        cache: false
      });
    } catch (error) {
      console.error('Failed to add escalation rule:', error);
      throw error;
    }
  }

  public async updateRule(
    ruleId: string,
    updates: Partial<EscalationRule>
  ): Promise<void> {
    const rule = this.rules.get(ruleId);
    if (!rule) {
      throw new Error(`Rule ${ruleId} not found`);
    }

    Object.assign(rule, updates);
    this.lastUpdate = new Date();

    try {
      await this.networkManager.request({
        method: 'PUT',
        url: `/api/escalation/rules/${ruleId}`,
        data: updates,
        cache: false
      });
    } catch (error) {
      console.error('Failed to update escalation rule:', error);
      throw error;
    }
  }

  public async evaluateConditions(
    ruleId: string,
    context: Record<string, any>
  ): Promise<boolean> {
    const rule = this.rules.get(ruleId);
    if (!rule) {
      throw new Error(`Rule ${ruleId} not found`);
    }

    try {
      const response = await this.networkManager.request({
        method: 'POST',
        url: `/api/escalation/rules/${ruleId}/evaluate`,
        data: { context },
        cache: false
      });

      return response.data as boolean;
    } catch (error) {
      console.error('Failed to evaluate conditions:', error);
      throw error;
    }
  }

  public async triggerEscalation(
    ruleId: string,
    context: Record<string, any>
  ): Promise<EscalationEvent> {
    const rule = this.rules.get(ruleId);
    if (!rule) {
      throw new Error(`Rule ${ruleId} not found`);
    }

    try {
      const response = await this.networkManager.request({
        method: 'POST',
        url: `/api/escalation/trigger`,
        data: { ruleId, context },
        cache: false
      });

      const event = response.data as EscalationEvent;
      if (!this.events.has(ruleId)) {
        this.events.set(ruleId, []);
      }
      this.events.get(ruleId)!.push(event);
      this.lastUpdate = new Date();

      return event;
    } catch (error) {
      console.error('Failed to trigger escalation:', error);
      throw error;
    }
  }

  public async updateEventStatus(
    eventId: string,
    status: EscalationEvent['status']
  ): Promise<void> {
    let found = false;
    for (const events of this.events.values()) {
      const event = events.find(e => e.id === eventId);
      if (event) {
        event.status = status;
        found = true;
        break;
      }
    }

    if (!found) {
      throw new Error(`Event ${eventId} not found`);
    }

    this.lastUpdate = new Date();

    try {
      await this.networkManager.request({
        method: 'PUT',
        url: `/api/escalation/events/${eventId}/status`,
        data: { status },
        cache: false
      });
    } catch (error) {
      console.error('Failed to update event status:', error);
      throw error;
    }
  }

  public async getMetrics(): Promise<EscalationMetrics> {
    try {
      const response = await this.networkManager.request({
        method: 'GET',
        url: '/api/escalation/metrics',
        cache: false
      });

      return response.data as EscalationMetrics;
    } catch (error) {
      console.error('Failed to get escalation metrics:', error);
      throw error;
    }
  }

  public getRules(): EscalationRule[] {
    return Array.from(this.rules.values());
  }

  public getEvents(ruleId: string): EscalationEvent[] {
    return this.events.get(ruleId) || [];
  }

  public getLastUpdate(): Date {
    return this.lastUpdate;
  }

  public async exportData(): Promise<string> {
    const exportData = {
      rules: Object.fromEntries(this.rules),
      events: Object.fromEntries(this.events),
      lastUpdate: this.lastUpdate
    };
    return JSON.stringify(exportData, null, 2);
  }

  public async importData(dataJson: string): Promise<void> {
    try {
      const importedData = JSON.parse(dataJson);
      this.rules = new Map(Object.entries(importedData.rules));
      this.events = new Map(Object.entries(importedData.events));
      this.lastUpdate = new Date(importedData.lastUpdate);
    } catch (error) {
      console.error('Failed to import escalation data:', error);
      throw error;
    }
  }
} 