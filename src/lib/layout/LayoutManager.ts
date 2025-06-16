import { NetworkManager } from '../../../frontend/src/utils/network';

interface LayoutConfig {
  id: string;
  name: string;
  type: 'page' | 'section' | 'component';
  structure: {
    elements: Array<{
      id: string;
      type: string;
      props: Record<string, any>;
      children?: string[];
      style?: Record<string, any>;
    }>;
  };
  metadata: {
    created: number;
    updated: number;
    version: number;
    status: 'draft' | 'published' | 'archived';
  };
}

interface LayoutTheme {
  id: string;
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  typography: {
    fontFamily: string;
    fontSize: {
      small: string;
      medium: string;
      large: string;
    };
    fontWeight: {
      normal: number;
      bold: number;
    };
  };
  spacing: {
    small: string;
    medium: string;
    large: string;
  };
  breakpoints: {
    mobile: string;
    tablet: string;
    desktop: string;
  };
}

export class LayoutManager {
  private static instance: LayoutManager;
  private networkManager: NetworkManager;
  private layouts: Map<string, LayoutConfig>;
  private themes: Map<string, LayoutTheme>;
  private activeTheme: string;
  private lastUpdate: number;

  private constructor() {
    this.networkManager = NetworkManager.getInstance();
    this.layouts = new Map();
    this.themes = new Map();
    this.activeTheme = 'default';
    this.lastUpdate = Date.now();
    this.initializeDefaultTheme();
  }

  public static getInstance(): LayoutManager {
    if (!LayoutManager.instance) {
      LayoutManager.instance = new LayoutManager();
    }
    return LayoutManager.instance;
  }

  private initializeDefaultTheme(): void {
    const defaultTheme: LayoutTheme = {
      id: 'default',
      name: 'Default Theme',
      colors: {
        primary: '#6B46C1', // Purple
        secondary: '#805AD5',
        accent: '#D69E2E', // Gold
        background: '#FFFFFF',
        text: '#1A202C'
      },
      typography: {
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: {
          small: '0.875rem',
          medium: '1rem',
          large: '1.25rem'
        },
        fontWeight: {
          normal: 400,
          bold: 600
        }
      },
      spacing: {
        small: '0.5rem',
        medium: '1rem',
        large: '2rem'
      },
      breakpoints: {
        mobile: '320px',
        tablet: '768px',
        desktop: '1024px'
      }
    };

    this.themes.set('default', defaultTheme);
  }

  public async createLayout(config: LayoutConfig): Promise<LayoutConfig> {
    this.validateLayoutConfig(config);

    const layout: LayoutConfig = {
      ...config,
      metadata: {
        ...config.metadata,
        created: Date.now(),
        updated: Date.now(),
        version: 1,
        status: 'draft'
      }
    };

    this.layouts.set(layout.id, layout);
    this.lastUpdate = Date.now();
    return layout;
  }

  private validateLayoutConfig(config: LayoutConfig): void {
    if (!config.id || !config.name || !config.type) {
      throw new Error('Invalid layout configuration');
    }

    // Validate element structure
    const elementIds = new Set<string>();
    config.structure.elements.forEach(element => {
      if (elementIds.has(element.id)) {
        throw new Error(`Duplicate element ID: ${element.id}`);
      }
      elementIds.add(element.id);

      if (element.children) {
        element.children.forEach(childId => {
          if (!elementIds.has(childId)) {
            throw new Error(`Invalid child element reference: ${childId}`);
          }
        });
      }
    });
  }

  public async updateLayout(
    layoutId: string,
    updates: Partial<LayoutConfig>
  ): Promise<LayoutConfig> {
    const layout = this.layouts.get(layoutId);
    if (!layout) {
      throw new Error(`Layout not found: ${layoutId}`);
    }

    const updatedLayout: LayoutConfig = {
      ...layout,
      ...updates,
      metadata: {
        ...layout.metadata,
        updated: Date.now(),
        version: layout.metadata.version + 1
      }
    };

    this.validateLayoutConfig(updatedLayout);
    this.layouts.set(layoutId, updatedLayout);
    this.lastUpdate = Date.now();
    return updatedLayout;
  }

  public async publishLayout(layoutId: string): Promise<LayoutConfig> {
    const layout = this.layouts.get(layoutId);
    if (!layout) {
      throw new Error(`Layout not found: ${layoutId}`);
    }

    layout.metadata.status = 'published';
    layout.metadata.updated = Date.now();
    this.layouts.set(layoutId, layout);
    this.lastUpdate = Date.now();
    return layout;
  }

  public async archiveLayout(layoutId: string): Promise<LayoutConfig> {
    const layout = this.layouts.get(layoutId);
    if (!layout) {
      throw new Error(`Layout not found: ${layoutId}`);
    }

    layout.metadata.status = 'archived';
    layout.metadata.updated = Date.now();
    this.layouts.set(layoutId, layout);
    this.lastUpdate = Date.now();
    return layout;
  }

  public async addTheme(theme: LayoutTheme): Promise<LayoutTheme> {
    this.validateTheme(theme);
    this.themes.set(theme.id, theme);
    this.lastUpdate = Date.now();
    return theme;
  }

  private validateTheme(theme: LayoutTheme): void {
    if (!theme.id || !theme.name) {
      throw new Error('Invalid theme configuration');
    }

    // Validate color values
    Object.entries(theme.colors).forEach(([key, value]) => {
      if (!this.isValidColor(value)) {
        throw new Error(`Invalid color value for ${key}: ${value}`);
      }
    });
  }

  private isValidColor(color: string): boolean {
    return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
  }

  public setActiveTheme(themeId: string): void {
    if (!this.themes.has(themeId)) {
      throw new Error(`Theme not found: ${themeId}`);
    }
    this.activeTheme = themeId;
    this.lastUpdate = Date.now();
  }

  public getActiveTheme(): LayoutTheme {
    const theme = this.themes.get(this.activeTheme);
    if (!theme) {
      throw new Error('Active theme not found');
    }
    return theme;
  }

  public async getLayout(layoutId: string): Promise<LayoutConfig | undefined> {
    return this.layouts.get(layoutId);
  }

  public async getAllLayouts(): Promise<LayoutConfig[]> {
    return Array.from(this.layouts.values());
  }

  public async getTheme(themeId: string): Promise<LayoutTheme | undefined> {
    return this.themes.get(themeId);
  }

  public async getAllThemes(): Promise<LayoutTheme[]> {
    return Array.from(this.themes.values());
  }

  public async exportData(): Promise<string> {
    const data = {
      layouts: Array.from(this.layouts.values()),
      themes: Array.from(this.themes.values()),
      activeTheme: this.activeTheme,
      lastUpdate: this.lastUpdate
    };
    return JSON.stringify(data, null, 2);
  }

  public async importData(data: string): Promise<void> {
    try {
      const parsedData = JSON.parse(data);
      this.layouts = new Map(
        parsedData.layouts.map((l: LayoutConfig) => [l.id, l])
      );
      this.themes = new Map(
        parsedData.themes.map((t: LayoutTheme) => [t.id, t])
      );
      this.activeTheme = parsedData.activeTheme;
      this.lastUpdate = parsedData.lastUpdate;
    } catch (error) {
      console.error('Failed to import layout data:', error);
      throw error;
    }
  }

  public getLastUpdate(): number {
    return this.lastUpdate;
  }

  public getLayoutCount(): number {
    return this.layouts.size;
  }

  public getThemeCount(): number {
    return this.themes.size;
  }
} 