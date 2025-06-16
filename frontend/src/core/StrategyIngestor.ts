import { AppError } from '@/utils/errorHandling';

interface Strategy {
  id: string;
  name: string;
  description: string;
  rules: StrategyRule[];
  priority: number;
  isActive: boolean;
}

interface StrategyRule {
  condition: string;
  action: string;
  parameters: Record<string, any>;
}

export class StrategyIngestor {
  private static instance: StrategyIngestor;
  private strategies: Map<string, Strategy>;

  private constructor() {
    this.strategies = new Map();
  }

  public static getInstance(): StrategyIngestor {
    if (!StrategyIngestor.instance) {
      StrategyIngestor.instance = new StrategyIngestor();
    }
    return StrategyIngestor.instance;
  }

  public ingestStrategy(strategy: Strategy): void {
    if (!strategy.id || !strategy.name) {
      throw new AppError('Strategy must have an ID and name', 400);
    }

    if (this.strategies.has(strategy.id)) {
      throw new AppError('Strategy with this ID already exists', 409);
    }

    this.strategies.set(strategy.id, {
      ...strategy,
      isActive: strategy.isActive ?? true
    });
  }

  public updateStrategy(id: string, updates: Partial<Strategy>): void {
    const strategy = this.strategies.get(id);
    if (!strategy) {
      throw new AppError('Strategy not found', 404);
    }

    this.strategies.set(id, {
      ...strategy,
      ...updates
    });
  }

  public getStrategy(id: string): Strategy {
    const strategy = this.strategies.get(id);
    if (!strategy) {
      throw new AppError('Strategy not found', 404);
    }
    return { ...strategy };
  }

  public deleteStrategy(id: string): void {
    if (!this.strategies.has(id)) {
      throw new AppError('Strategy not found', 404);
    }
    this.strategies.delete(id);
  }

  public getAllStrategies(): Strategy[] {
    return Array.from(this.strategies.values());
  }

  public getActiveStrategies(): Strategy[] {
    return this.getAllStrategies().filter(s => s.isActive);
  }

  public evaluateStrategy(id: string, context: Record<string, any>): boolean {
    const strategy = this.getStrategy(id);
    return strategy.rules.every(rule => {
      try {
        // Simple rule evaluation - in production, use a proper rule engine
        const condition = new Function('context', `return ${rule.condition}`)(context);
        return condition === true;
      } catch (error) {
        console.error(`Error evaluating rule: ${error}`);
        return false;
      }
    });
  }
}
