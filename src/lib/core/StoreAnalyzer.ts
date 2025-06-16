export interface StoreMetrics {
  id: string;
  name: string;
  metrics: Record<string, number>;
  createdAt?: Date;
  updatedAt?: Date;
}

export class StoreAnalyzer {
  private static instance: StoreAnalyzer;
  private metrics: Map<string, StoreMetrics> = new Map();
  private lastUpdate: Date = new Date();

  private constructor() {}

  public static getInstance(): StoreAnalyzer {
    if (!StoreAnalyzer.instance) {
      StoreAnalyzer.instance = new StoreAnalyzer();
    }
    return StoreAnalyzer.instance;
  }

  public addMetrics(storeMetrics: StoreMetrics): void {
    this.metrics.set(storeMetrics.id, { ...storeMetrics, createdAt: new Date(), updatedAt: new Date() });
    this.lastUpdate = new Date();
  }

  public updateMetrics(id: string, updates: Partial<StoreMetrics>): void {
    const metrics = this.metrics.get(id);
    if (!metrics) throw new Error(`Metrics ${id} not found`);
    this.metrics.set(id, { ...metrics, ...updates, updatedAt: new Date() });
    this.lastUpdate = new Date();
  }

  public removeMetrics(id: string): void {
    this.metrics.delete(id);
    this.lastUpdate = new Date();
  }

  public getMetrics(id: string): StoreMetrics | undefined {
    return this.metrics.get(id);
  }

  public getAllMetrics(): StoreMetrics[] {
    return Array.from(this.metrics.values());
  }

  public getLastUpdate(): Date {
    return this.lastUpdate;
  }

  public async exportData(): Promise<string> {
    const data = {
      metrics: Array.from(this.metrics.entries()),
      lastUpdate: this.lastUpdate,
    };
    return JSON.stringify(data);
  }

  public async importData(dataJson: string): Promise<void> {
    const data = JSON.parse(dataJson);
    this.metrics = new Map(data.metrics);
    this.lastUpdate = new Date(data.lastUpdate);
  }
} 