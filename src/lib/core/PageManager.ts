import { NetworkManager } from '../../../frontend/src/utils/network';

interface Page {
  id: string;
  name: string;
  path: string;
  components: {
    id: string;
    type: string;
    props: Record<string, any>;
  }[];
  metadata: {
    created: number;
    updated: number;
    status: 'active' | 'draft' | 'archived';
    version: string;
    tags: string[];
  };
  state: {
    loading: boolean;
    error?: string;
    data?: any;
  };
}

interface PageEvent {
  pageId: string;
  timestamp: number;
  type: 'load' | 'unload' | 'update' | 'error';
  data?: any;
  metadata: {
    userAgent: string;
    referrer: string;
    duration: number;
  };
}

export class PageManager {
  private static instance: PageManager;
  private networkManager: NetworkManager;
  private pages: Map<string, Page>;
  private events: Map<string, PageEvent[]>;
  private currentPage: string;
  private lastUpdate: number;

  private constructor() {
    this.networkManager = NetworkManager.getInstance();
    this.pages = new Map();
    this.events = new Map();
    this.currentPage = 'dashboard';
    this.lastUpdate = Date.now();
  }

  public static getInstance(): PageManager {
    if (!PageManager.instance) {
      PageManager.instance = new PageManager();
    }
    return PageManager.instance;
  }

  public async initialize(): Promise<void> {
    try {
      // Load pages from API
      const response = await this.networkManager.request<Page[]>({
        method: 'GET',
        url: '/api/pages'
      });

      // Initialize pages
      response.data.forEach(page => {
        this.pages.set(page.id, page);
      });

      this.lastUpdate = Date.now();
    } catch (error) {
      console.error('Error initializing pages:', error);
      throw error;
    }
  }

  public async loadPage(pageId: string): Promise<Page> {
    const page = this.pages.get(pageId);
    if (!page) {
      throw new Error(`Page not found: ${pageId}`);
    }

    try {
      page.state.loading = true;
      this.pages.set(pageId, page);

      // Record event
      const startTime = Date.now();
      const event: PageEvent = {
        pageId,
        timestamp: Date.now(),
        type: 'load',
        metadata: {
          userAgent: navigator.userAgent,
          referrer: document.referrer,
          duration: 0
        }
      };

      // Load page data
      const response = await this.networkManager.request<any>({
        method: 'GET',
        url: `/api/pages/${pageId}/data`
      });

      page.state.data = response.data;
      page.state.loading = false;
      this.pages.set(pageId, page);

      // Update event
      event.metadata.duration = Date.now() - startTime;
      this.addEvent(pageId, event);

      this.currentPage = pageId;
      this.lastUpdate = Date.now();

      return page;
    } catch (error) {
      page.state.loading = false;
      page.state.error = error instanceof Error ? error.message : 'Unknown error';
      this.pages.set(pageId, page);

      // Record error event
      const errorEvent: PageEvent = {
        pageId,
        timestamp: Date.now(),
        type: 'error',
        data: { error: page.state.error },
        metadata: {
          userAgent: navigator.userAgent,
          referrer: document.referrer,
          duration: 0
        }
      };
      this.addEvent(pageId, errorEvent);

      throw error;
    }
  }

  public async unloadPage(pageId: string): Promise<void> {
    const page = this.pages.get(pageId);
    if (!page) {
      throw new Error(`Page not found: ${pageId}`);
    }

    // Record event
    const event: PageEvent = {
      pageId,
      timestamp: Date.now(),
      type: 'unload',
      metadata: {
        userAgent: navigator.userAgent,
        referrer: document.referrer,
        duration: 0
      }
    };
    this.addEvent(pageId, event);

    // Clear page state
    page.state.data = undefined;
    page.state.error = undefined;
    this.pages.set(pageId, page);
  }

  public async updatePage(
    pageId: string,
    updates: Partial<Page>
  ): Promise<Page> {
    const page = this.pages.get(pageId);
    if (!page) {
      throw new Error(`Page not found: ${pageId}`);
    }

    const updatedPage: Page = {
      ...page,
      ...updates,
      metadata: {
        ...page.metadata,
        updated: Date.now()
      }
    };

    this.pages.set(pageId, updatedPage);
    this.lastUpdate = Date.now();

    // Record update event
    const event: PageEvent = {
      pageId,
      timestamp: Date.now(),
      type: 'update',
      data: updates,
      metadata: {
        userAgent: navigator.userAgent,
        referrer: document.referrer,
        duration: 0
      }
    };
    this.addEvent(pageId, event);

    return updatedPage;
  }

  private addEvent(pageId: string, event: PageEvent): void {
    const events = this.events.get(pageId) || [];
    events.push(event);
    this.events.set(pageId, events);
  }

  public async getPage(pageId: string): Promise<Page | undefined> {
    return this.pages.get(pageId);
  }

  public async getAllPages(): Promise<Page[]> {
    return Array.from(this.pages.values());
  }

  public async getPagesByStatus(
    status: Page['metadata']['status']
  ): Promise<Page[]> {
    return Array.from(this.pages.values()).filter(
      page => page.metadata.status === status
    );
  }

  public async getPageEvents(pageId: string): Promise<PageEvent[]> {
    return this.events.get(pageId) || [];
  }

  public getCurrentPage(): string {
    return this.currentPage;
  }

  public async refreshPage(pageId: string): Promise<Page> {
    const page = this.pages.get(pageId);
    if (!page) {
      throw new Error(`Page not found: ${pageId}`);
    }

    try {
      page.state.loading = true;
      this.pages.set(pageId, page);

      // Reload page data
      const response = await this.networkManager.request<any>({
        method: 'GET',
        url: `/api/pages/${pageId}/data`
      });

      page.state.data = response.data;
      page.state.loading = false;
      this.pages.set(pageId, page);

      this.lastUpdate = Date.now();
      return page;
    } catch (error) {
      page.state.loading = false;
      page.state.error = error instanceof Error ? error.message : 'Unknown error';
      this.pages.set(pageId, page);
      throw error;
    }
  }

  public async exportData(): Promise<string> {
    const data = {
      pages: Array.from(this.pages.entries()),
      events: Object.fromEntries(this.events),
      currentPage: this.currentPage,
      lastUpdate: this.lastUpdate.getTime()
    };
    return JSON.stringify(data, null, 2);
  }

  public async importData(data: string): Promise<void> {
    try {
      const parsedData = JSON.parse(data);
      this.pages = new Map(
        parsedData.pages.map((p: Page) => [p.id, p])
      );
      this.events = new Map(Object.entries(parsedData.events));
      this.currentPage = parsedData.currentPage;
      this.lastUpdate = new Date(parsedData.lastUpdate);
    } catch (error) {
      console.error('Failed to import page manager data:', error);
      throw error;
    }
  }

  public getLastUpdate(): number {
    return this.lastUpdate;
  }

  public getPageCount(): number {
    return this.pages.size;
  }

  public getEventCount(): number {
    return Array.from(this.events.values()).reduce(
      (sum, events) => sum + events.length,
      0
    );
  }
} 