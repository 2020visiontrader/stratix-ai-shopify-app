export interface Feature {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  dependencies?: string[];
  category?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class FeatureManager {
  private static instance: FeatureManager;
  private features: Map<string, Feature> = new Map();
  private lastUpdate: Date = new Date();

  private constructor() {}

  public static getInstance(): FeatureManager {
    if (!FeatureManager.instance) {
      FeatureManager.instance = new FeatureManager();
    }
    return FeatureManager.instance;
  }

  public addFeature(feature: Feature): void {
    this.features.set(feature.id, { ...feature, createdAt: new Date(), updatedAt: new Date() });
    this.lastUpdate = new Date();
  }

  public updateFeature(id: string, updates: Partial<Feature>): void {
    const feature = this.features.get(id);
    if (!feature) throw new Error(`Feature ${id} not found`);
    this.features.set(id, { ...feature, ...updates, updatedAt: new Date() });
    this.lastUpdate = new Date();
  }

  public removeFeature(id: string): void {
    this.features.delete(id);
    this.lastUpdate = new Date();
  }

  public getFeature(id: string): Feature | undefined {
    return this.features.get(id);
  }

  public getAllFeatures(): Feature[] {
    return Array.from(this.features.values());
  }

  public toggleFeature(id: string, enabled: boolean): void {
    const feature = this.features.get(id);
    if (!feature) throw new Error(`Feature ${id} not found`);
    this.features.set(id, { ...feature, enabled, updatedAt: new Date() });
    this.lastUpdate = new Date();
  }

  public getFeaturesByCategory(category: string): Feature[] {
    return Array.from(this.features.values()).filter(f => f.category === category);
  }

  public getLastUpdate(): Date {
    return this.lastUpdate;
  }

  public async exportData(): Promise<string> {
    const data = {
      features: Array.from(this.features.entries()),
      lastUpdate: this.lastUpdate,
    };
    return JSON.stringify(data);
  }

  public async importData(dataJson: string): Promise<void> {
    const data = JSON.parse(dataJson);
    this.features = new Map(data.features);
    this.lastUpdate = new Date(data.lastUpdate);
  }
} 