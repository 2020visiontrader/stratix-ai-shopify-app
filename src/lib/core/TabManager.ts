import { NetworkManager } from '../../../frontend/src/utils/network';

interface Tab {
  id: string;
  name: string;
  pageId: string;
  components: {
    id: string;
    type: string;
    props: Record<string, any>;
  }[];
  metadata: {
    created: number;
    updated: number;
    status: 'active' | 'disabled' | 'hidden';
    order: number;
    tags: string[];
  };
  state: {
    loading: boolean;
    error?: string;
    data?: any;
  };
}

interface TabEvent {
  tabId: string;
  timestamp: number;
  type: 'activate' | 'deactivate' | 'update' | 'error';
  data?: any;
  metadata: {
    pageId: string;
    duration: number;
  };
}

export class TabManager {
  private static instance: TabManager;
  private networkManager: NetworkManager;
  private tabs: Map<string, Tab>;
  private events: Map<string, TabEvent[]>;
  private activeTabs: Map<string, string>;
  private lastUpdate: number;

  private constructor() {
    this.networkManager = NetworkManager.getInstance();
    this.tabs = new Map();
    this.events = new Map();
    this.activeTabs = new Map();
    this.lastUpdate = Date.now();
  }

  public static getInstance(): TabManager {
    if (!TabManager.instance) {
      TabManager.instance = new TabManager();
    }
    return TabManager.instance;
  }

  public async initialize(): Promise<void> {
    try {
      // Load tabs from API
      const response = await this.networkManager.request<Tab[]>({
        method: 'GET',
        url: '/api/tabs'
      });

      // Initialize tabs
      response.data.forEach(tab => {
        this.tabs.set(tab.id, tab);
      });

      this.lastUpdate = Date.now();
    } catch (error) {
      console.error('Error initializing tabs:', error);
      throw error;
    }
  }

  public async activateTab(tabId: string): Promise<Tab> {
    const tab = this.tabs.get(tabId);
    if (!tab) {
      throw new Error(`Tab not found: ${tabId}`);
    }

    if (tab.metadata.status === 'disabled') {
      throw new Error(`Tab is disabled: ${tabId}`);
    }

    try {
      tab.state.loading = true;
      this.tabs.set(tabId, tab);

      // Record event
      const startTime = Date.now();
      const event: TabEvent = {
        tabId,
        timestamp: Date.now(),
        type: 'activate',
        metadata: {
          pageId: tab.pageId,
          duration: 0
        }
      };

      // Load tab data
      const response = await this.networkManager.request<any>({
        method: 'GET',
        url: `/api/tabs/${tabId}/data`
      });

      tab.state.data = response.data;
      tab.state.loading = false;
      this.tabs.set(tabId, tab);

      // Update event
      event.metadata.duration = Date.now() - startTime;
      this.addEvent(tabId, event);

      // Update active tab
      this.activeTabs.set(tab.pageId, tabId);
      this.lastUpdate = Date.now();

      return tab;
    } catch (error) {
      tab.state.loading = false;
      tab.state.error = error instanceof Error ? error.message : 'Unknown error';
      this.tabs.set(tabId, tab);

      // Record error event
      const errorEvent: TabEvent = {
        tabId,
        timestamp: Date.now(),
        type: 'error',
        data: { error: tab.state.error },
        metadata: {
          pageId: tab.pageId,
          duration: 0
        }
      };
      this.addEvent(tabId, errorEvent);

      throw error;
    }
  }

  public async deactivateTab(tabId: string): Promise<void> {
    const tab = this.tabs.get(tabId);
    if (!tab) {
      throw new Error(`Tab not found: ${tabId}`);
    }

    // Record event
    const event: TabEvent = {
      tabId,
      timestamp: Date.now(),
      type: 'deactivate',
      metadata: {
        pageId: tab.pageId,
        duration: 0
      }
    };
    this.addEvent(tabId, event);

    // Clear tab state
    tab.state.data = undefined;
    tab.state.error = undefined;
    this.tabs.set(tabId, tab);

    // Remove from active tabs
    this.activeTabs.delete(tab.pageId);
  }

  public async updateTab(
    tabId: string,
    updates: Partial<Tab>
  ): Promise<Tab> {
    const tab = this.tabs.get(tabId);
    if (!tab) {
      throw new Error(`Tab not found: ${tabId}`);
    }

    const updatedTab: Tab = {
      ...tab,
      ...updates,
      metadata: {
        ...tab.metadata,
        updated: Date.now()
      }
    };

    this.tabs.set(tabId, updatedTab);
    this.lastUpdate = Date.now();

    // Record update event
    const event: TabEvent = {
      tabId,
      timestamp: Date.now(),
      type: 'update',
      data: updates,
      metadata: {
        pageId: tab.pageId,
        duration: 0
      }
    };
    this.addEvent(tabId, event);

    return updatedTab;
  }

  private addEvent(tabId: string, event: TabEvent): void {
    const events = this.events.get(tabId) || [];
    events.push(event);
    this.events.set(tabId, events);
  }

  public async getTab(tabId: string): Promise<Tab | undefined> {
    return this.tabs.get(tabId);
  }

  public async getAllTabs(): Promise<Tab[]> {
    return Array.from(this.tabs.values());
  }

  public async getTabsByPage(pageId: string): Promise<Tab[]> {
    return Array.from(this.tabs.values()).filter(
      tab => tab.pageId === pageId
    );
  }

  public async getTabsByStatus(
    status: Tab['metadata']['status']
  ): Promise<Tab[]> {
    return Array.from(this.tabs.values()).filter(
      tab => tab.metadata.status === status
    );
  }

  public async getTabEvents(tabId: string): Promise<TabEvent[]> {
    return this.events.get(tabId) || [];
  }

  public getActiveTab(pageId: string): string | undefined {
    return this.activeTabs.get(pageId);
  }

  public async refreshTab(tabId: string): Promise<Tab> {
    const tab = this.tabs.get(tabId);
    if (!tab) {
      throw new Error(`Tab not found: ${tabId}`);
    }

    try {
      tab.state.loading = true;
      this.tabs.set(tabId, tab);

      // Reload tab data
      const response = await this.networkManager.request<any>({
        method: 'GET',
        url: `/api/tabs/${tabId}/data`
      });

      tab.state.data = response.data;
      tab.state.loading = false;
      this.tabs.set(tabId, tab);

      this.lastUpdate = Date.now();
      return tab;
    } catch (error) {
      tab.state.loading = false;
      tab.state.error = error instanceof Error ? error.message : 'Unknown error';
      this.tabs.set(tabId, tab);
      throw error;
    }
  }

  public async exportData(): Promise<string> {
    const data = {
      tabs: Array.from(this.tabs.values()),
      events: Object.fromEntries(this.events),
      activeTabs: Object.fromEntries(this.activeTabs),
      lastUpdate: this.lastUpdate
    };
    return JSON.stringify(data, null, 2);
  }

  public async importData(data: string): Promise<void> {
    try {
      const parsedData = JSON.parse(data);
      this.tabs = new Map(
        parsedData.tabs.map((t: Tab) => [t.id, t])
      );
      this.events = new Map(Object.entries(parsedData.events));
      this.activeTabs = new Map(Object.entries(parsedData.activeTabs));
      this.lastUpdate = parsedData.lastUpdate;
    } catch (error) {
      console.error('Failed to import tab manager data:', error);
      throw error;
    }
  }

  public getLastUpdate(): number {
    return this.lastUpdate;
  }

  public getTabCount(): number {
    return this.tabs.size;
  }

  public getEventCount(): number {
    return Array.from(this.events.values()).reduce(
      (sum, events) => sum + events.length,
      0
    );
  }
} 