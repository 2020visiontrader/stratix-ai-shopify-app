export interface Layout {
  id: string;
  name: string;
  description: string;
  config: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}

export class LayoutManager {
  private static instance: LayoutManager;
  private layouts: Map<string, Layout> = new Map();
  private lastUpdate: Date = new Date();

  private constructor() {}

  public static getInstance(): LayoutManager {
    if (!LayoutManager.instance) {
      LayoutManager.instance = new LayoutManager();
    }
    return LayoutManager.instance;
  }

  public addLayout(layout: Layout): void {
    this.layouts.set(layout.id, { ...layout, createdAt: new Date(), updatedAt: new Date() });
    this.lastUpdate = new Date();
  }

  public updateLayout(id: string, updates: Partial<Layout>): void {
    const layout = this.layouts.get(id);
    if (!layout) throw new Error(`Layout ${id} not found`);
    this.layouts.set(id, { ...layout, ...updates, updatedAt: new Date() });
    this.lastUpdate = new Date();
  }

  public removeLayout(id: string): void {
    this.layouts.delete(id);
    this.lastUpdate = new Date();
  }

  public getLayout(id: string): Layout | undefined {
    return this.layouts.get(id);
  }

  public getAllLayouts(): Layout[] {
    return Array.from(this.layouts.values());
  }

  public getLastUpdate(): Date {
    return this.lastUpdate;
  }

  public async exportData(): Promise<string> {
    const data = {
      layouts: Array.from(this.layouts.entries()),
      lastUpdate: this.lastUpdate.getTime(),
    };
    return JSON.stringify(data);
  }

  public async importData(dataJson: string): Promise<void> {
    const data = JSON.parse(dataJson);
    this.layouts = new Map(data.layouts);
    this.lastUpdate = new Date(data.lastUpdate);
  }
} 