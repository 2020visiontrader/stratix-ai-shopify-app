import { Feature, ManagerState } from './CoreTypes';

export class FeatureManager {
  private static instance: FeatureManager;
  private features: Map<string, Feature> = new Map();
  private state: ManagerState = {
    lastUpdate: new Date(),
    version: '1.0.0',
    status: 'active'
  };

  private constructor() {}

  public static getInstance(): FeatureManager {
    if (!FeatureManager.instance) {
      FeatureManager.instance = new FeatureManager();
    }
    return FeatureManager.instance;
  }

  public addFeature(feature: Feature): void {
    this.features.set(feature.id, { 
      ...feature,
      state: {
        enabled: feature.state.enabled,
        visible: feature.state.visible ?? true,
        loading: false
      },
      metadata: {
        ...feature.metadata,
        updated: Date.now()
      }
    });
    this.state.lastUpdate = new Date();
  }

  public updateFeature(id: string, updates: Partial<Feature>): void {
    const feature = this.features.get(id);
    if (!feature) throw new Error(`Feature ${id} not found`);
    this.features.set(id, { 
      ...feature, 
      ...updates,
      metadata: {
        ...feature.metadata,
        ...updates.metadata,
        updated: Date.now()
      }
    });
    this.state.lastUpdate = new Date();
  }

  public removeFeature(id: string): void {
    this.features.delete(id);
    this.state.lastUpdate = new Date();
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
    this.features.set(id, { 
      ...feature, 
      state: {
        ...feature.state,
        enabled,
        loading: false
      },
      metadata: {
        ...feature.metadata,
        updated: Date.now()
      }
    });
    this.state.lastUpdate = new Date();
  }

  public getFeaturesByType(type: Feature['type']): Feature[] {
    return Array.from(this.features.values()).filter(f => f.type === type);
  }

  public getLastUpdate(): Date {
    return this.state.lastUpdate;
  }

  public getState(): ManagerState {
    return { ...this.state };
  }

  public async exportData(): Promise<string> {
    const data = {
      features: Array.from(this.features.entries()),
      state: this.state
    };
    return JSON.stringify(data);
  }

  public async importData(dataJson: string): Promise<void> {
    const data = JSON.parse(dataJson);
    this.features = new Map(data.features);
    this.state = data.state;
  }
} 