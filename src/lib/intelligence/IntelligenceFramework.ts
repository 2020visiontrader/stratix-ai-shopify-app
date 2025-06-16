import { NetworkManager } from '../../../frontend/src/utils/network';

interface FrameworkRule {
  id: string;
  name: string;
  description: string;
  conditions: Array<{
    field: string;
    operator: 'equals' | 'contains' | 'greaterThan' | 'lessThan' | 'in';
    value: any;
  }>;
  actions: Array<{
    type: string;
    params: Record<string, any>;
  }>;
  priority: number;
  enabled: boolean;
}

interface FrameworkConfig {
  name: string;
  version: string;
  description: string;
  rules: FrameworkRule[];
  settings: {
    maxRules: number;
    ruleEvaluationOrder: 'priority' | 'sequential';
    defaultAction: {
      type: string;
      params: Record<string, any>;
    };
  };
}

export class IntelligenceFramework {
  private static instance: IntelligenceFramework;
  private networkManager: NetworkManager;
  private config: FrameworkConfig;
  private rules: Map<string, FrameworkRule>;
  private lastUpdate: number;

  private constructor(config: FrameworkConfig) {
    this.config = config;
    this.networkManager = NetworkManager.getInstance();
    this.rules = new Map();
    this.lastUpdate = Date.now();
    this.initializeRules();
  }

  public static getInstance(config: FrameworkConfig): IntelligenceFramework {
    if (!IntelligenceFramework.instance) {
      IntelligenceFramework.instance = new IntelligenceFramework(config);
    }
    return IntelligenceFramework.instance;
  }

  private initializeRules(): void {
    this.config.rules.forEach(rule => {
      this.rules.set(rule.id, rule);
    });
  }

  public async evaluateRules(data: Record<string, any>): Promise<Array<{
    ruleId: string;
    matched: boolean;
    actions: Array<{
      type: string;
      params: Record<string, any>;
    }>;
  }>> {
    const results: Array<{
      ruleId: string;
      matched: boolean;
      actions: Array<{
        type: string;
        params: Record<string, any>;
      }>;
    }> = [];
    const sortedRules = this.getSortedRules();

    for (const rule of sortedRules) {
      if (!rule.enabled) continue;

      const matched = this.evaluateRuleConditions(rule, data);
      if (matched) {
        results.push({
          ruleId: rule.id,
          matched: true,
          actions: rule.actions
        });
      }
    }

    return results;
  }

  private getSortedRules(): FrameworkRule[] {
    const rulesArray = Array.from(this.rules.values());
    if (this.config.settings.ruleEvaluationOrder === 'priority') {
      return rulesArray.sort((a, b) => b.priority - a.priority);
    }
    return rulesArray;
  }

  private evaluateRuleConditions(
    rule: FrameworkRule,
    data: Record<string, any>
  ): boolean {
    return rule.conditions.every(condition => {
      const value = data[condition.field];
      if (value === undefined) return false;

      switch (condition.operator) {
        case 'equals':
          return value === condition.value;
        case 'contains':
          return String(value).includes(String(condition.value));
        case 'greaterThan':
          return value > condition.value;
        case 'lessThan':
          return value < condition.value;
        case 'in':
          return Array.isArray(condition.value) && condition.value.includes(value);
        default:
          return false;
      }
    });
  }

  public async addRule(rule: FrameworkRule): Promise<void> {
    if (this.rules.size >= this.config.settings.maxRules) {
      throw new Error('Maximum number of rules reached');
    }

    this.rules.set(rule.id, rule);
    this.lastUpdate = Date.now();
  }

  public async updateRule(ruleId: string, updates: Partial<FrameworkRule>): Promise<void> {
    const rule = this.rules.get(ruleId);
    if (!rule) {
      throw new Error(`Rule not found: ${ruleId}`);
    }

    this.rules.set(ruleId, { ...rule, ...updates });
    this.lastUpdate = Date.now();
  }

  public async deleteRule(ruleId: string): Promise<void> {
    this.rules.delete(ruleId);
    this.lastUpdate = Date.now();
  }

  public getRule(ruleId: string): FrameworkRule | undefined {
    return this.rules.get(ruleId);
  }

  public getAllRules(): FrameworkRule[] {
    return Array.from(this.rules.values());
  }

  public async exportConfig(): Promise<string> {
    const config = {
      ...this.config,
      rules: Array.from(this.rules.values())
    };
    return JSON.stringify(config, null, 2);
  }

  public async importConfig(config: string): Promise<void> {
    try {
      const parsedConfig = JSON.parse(config) as FrameworkConfig;
      this.config = parsedConfig;
      this.initializeRules();
      this.lastUpdate = Date.now();
    } catch (error) {
      console.error('Failed to import framework config:', error);
      throw error;
    }
  }

  public getLastUpdate(): number {
    return this.lastUpdate;
  }

  public getRuleCount(): number {
    return this.rules.size;
  }
} 