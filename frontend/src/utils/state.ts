export class StateManager {
  private static instance: StateManager;
  private state: Map<string, any>;
  private subscribers: Map<string, Set<StateSubscriber>>;
  private history: StateHistory[];
  private readonly maxHistory: number;

  private constructor() {
    this.state = new Map();
    this.subscribers = new Map();
    this.history = [];
    this.maxHistory = 100;
  }

  public static getInstance(): StateManager {
    if (!StateManager.instance) {
      StateManager.instance = new StateManager();
    }
    return StateManager.instance;
  }

  public setState<T>(key: string, value: T): void {
    const previousValue = this.state.get(key);
    this.state.set(key, value);
    this.addToHistory(key, previousValue, value);
    this.notifySubscribers(key, previousValue, value);
  }

  public getState<T>(key: string): T | undefined {
    return this.state.get(key) as T;
  }

  public subscribe(
    key: string,
    subscriber: StateSubscriber
  ): () => void {
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set());
    }
    this.subscribers.get(key)!.add(subscriber);

    return () => {
      const subscribers = this.subscribers.get(key);
      if (subscribers) {
        subscribers.delete(subscriber);
        if (subscribers.size === 0) {
          this.subscribers.delete(key);
        }
      }
    };
  }

  private notifySubscribers(
    key: string,
    previousValue: any,
    newValue: any
  ): void {
    const subscribers = this.subscribers.get(key);
    if (subscribers) {
      subscribers.forEach(subscriber => {
        try {
          subscriber(newValue, previousValue);
        } catch (error) {
          console.error(`Error in state subscriber for ${key}:`, error);
        }
      });
    }
  }

  private addToHistory(
    key: string,
    previousValue: any,
    newValue: any
  ): void {
    const historyEntry: StateHistory = {
      id: crypto.randomUUID(),
      key,
      previousValue,
      newValue,
      timestamp: new Date()
    };

    this.history.push(historyEntry);
    this.cleanupHistory();
  }

  private cleanupHistory(): void {
    if (this.history.length > this.maxHistory) {
      this.history = this.history.slice(-this.maxHistory);
    }
  }

  public getHistory(): StateHistory[] {
    return [...this.history];
  }

  public getHistoryByKey(key: string): StateHistory[] {
    return this.history.filter(entry => entry.key === key);
  }

  public async analyzeState(): Promise<StateAnalysis> {
    const state = Object.fromEntries(this.state);
    const history = this.history;
    const subscribers = Object.fromEntries(
      Array.from(this.subscribers.entries()).map(([key, set]) => [
        key,
        set.size
      ])
    );

    return {
      stateSize: this.calculateStateSize(state),
      historySize: history.length,
      subscriberCount: Object.values(subscribers).reduce(
        (sum, count) => sum + count,
        0
      ),
      mostChangedKeys: this.findMostChangedKeys(history),
      recentChanges: this.getRecentChanges(history)
    };
  }

  private calculateStateSize(state: Record<string, any>): number {
    return JSON.stringify(state).length;
  }

  private findMostChangedKeys(history: StateHistory[]): Array<{
    key: string;
    changes: number;
  }> {
    const changes = new Map<string, number>();
    history.forEach(entry => {
      changes.set(entry.key, (changes.get(entry.key) || 0) + 1);
    });

    return Array.from(changes.entries())
      .map(([key, changes]) => ({ key, changes }))
      .sort((a, b) => b.changes - a.changes)
      .slice(0, 5);
  }

  private getRecentChanges(history: StateHistory[]): StateHistory[] {
    return history
      .slice()
      .reverse()
      .slice(0, 10);
  }

  public async exportState(format: 'json' | 'csv'): Promise<string> {
    const state = Object.fromEntries(this.state);
    if (format === 'json') {
      return JSON.stringify(state, null, 2);
    } else {
      const headers = ['Key', 'Value'];
      const rows = Object.entries(state).map(([key, value]) => [
        key,
        JSON.stringify(value)
      ]);
      return [headers, ...rows].map(row => row.join(',')).join('\n');
    }
  }

  public async importState(data: string, format: 'json' | 'csv'): Promise<void> {
    try {
      let parsedState: Record<string, any>;

      if (format === 'json') {
        parsedState = JSON.parse(data);
      } else {
        const rows = data.split('\n').map(row => row.split(','));
        const headers = rows[0];
        parsedState = {};
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (row.length === headers.length) {
            const key = row[0];
            try {
              parsedState[key] = JSON.parse(row[1]);
            } catch {
              parsedState[key] = row[1];
            }
          }
        }
      }

      Object.entries(parsedState).forEach(([key, value]) => {
        this.setState(key, value);
      });
    } catch (error) {
      console.error('Failed to import state:', error);
    }
  }

  public clearState(): void {
    this.state.clear();
    this.history = [];
    this.subscribers.clear();
  }

  public getKeys(): string[] {
    return Array.from(this.state.keys());
  }

  public getValues(): any[] {
    return Array.from(this.state.values());
  }

  public has(key: string): boolean {
    return this.state.has(key);
  }

  public remove(key: string): void {
    const previousValue = this.state.get(key);
    this.state.delete(key);
    this.addToHistory(key, previousValue, undefined);
    this.notifySubscribers(key, previousValue, undefined);
  }
}

type StateSubscriber = (newValue: any, previousValue: any) => void;

interface StateHistory {
  id: string;
  key: string;
  previousValue: any;
  newValue: any;
  timestamp: Date;
}

interface StateAnalysis {
  stateSize: number;
  historySize: number;
  subscriberCount: number;
  mostChangedKeys: Array<{ key: string; changes: number }>;
  recentChanges: StateHistory[];
} 