import { NetworkManager } from '../../../frontend/src/utils/network';

interface UIElement {
  id: string;
  type: 'button' | 'tab' | 'page' | 'modal' | 'dropdown';
  label: string;
  action: string;
  metadata: {
    created: number;
    updated: number;
    status: 'active' | 'disabled' | 'hidden';
    category: string;
    tags: string[];
  };
  style: {
    theme: 'primary' | 'secondary' | 'accent' | 'neutral';
    variant: 'solid' | 'outline' | 'ghost' | 'link';
    size: 'sm' | 'md' | 'lg';
    icon?: string;
  };
  state: {
    loading: boolean;
    error?: string;
    data?: any;
  };
}

interface UIEvent {
  elementId: string;
  timestamp: number;
  type: 'click' | 'hover' | 'focus' | 'blur' | 'change';
  data?: any;
  metadata: {
    page: string;
    section: string;
    userAgent: string;
  };
}

export class UIManager {
  private static instance: UIManager;
  private networkManager: NetworkManager;
  private elements: Map<string, UIElement>;
  private events: Map<string, UIEvent[]>;
  private activePage: string;
  private activeTab: string;
  private lastUpdate: number;

  private constructor() {
    this.networkManager = NetworkManager.getInstance();
    this.elements = new Map();
    this.events = new Map();
    this.activePage = 'dashboard';
    this.activeTab = 'overview';
    this.lastUpdate = Date.now();
  }

  public static getInstance(): UIManager {
    if (!UIManager.instance) {
      UIManager.instance = new UIManager();
    }
    return UIManager.instance;
  }

  public async initialize(): Promise<void> {
    try {
      // Load UI elements from API
      const response = await this.networkManager.request<UIElement[]>({
        method: 'GET',
        url: '/api/ui/elements'
      });

      // Initialize elements
      response.data.forEach(element => {
        this.elements.set(element.id, element);
      });

      this.lastUpdate = Date.now();
    } catch (error) {
      console.error('Error initializing UI:', error);
      throw error;
    }
  }

  public async handleClick(elementId: string): Promise<void> {
    const element = this.elements.get(elementId);
    if (!element) {
      throw new Error(`UI element not found: ${elementId}`);
    }

    if (element.metadata.status === 'disabled') {
      return;
    }

    try {
      element.state.loading = true;
      this.elements.set(elementId, element);

      // Record event
      const event: UIEvent = {
        elementId,
        timestamp: Date.now(),
        type: 'click',
        metadata: {
          page: this.activePage,
          section: element.metadata.category,
          userAgent: navigator.userAgent
        }
      };
      this.addEvent(elementId, event);

      // Handle action
      await this.executeAction(element);

      element.state.loading = false;
      this.elements.set(elementId, element);
    } catch (error) {
      element.state.loading = false;
      element.state.error = error instanceof Error ? error.message : 'Unknown error';
      this.elements.set(elementId, element);
      throw error;
    }
  }

  private async executeAction(element: UIElement): Promise<void> {
    switch (element.action) {
      case 'navigate':
        await this.navigateToPage(element.state.data?.page);
        break;
      case 'switchTab':
        await this.switchTab(element.state.data?.tab);
        break;
      case 'openModal':
        await this.openModal(element.state.data?.modal);
        break;
      case 'submit':
        await this.submitForm(element.state.data?.form);
        break;
      case 'refresh':
        await this.refreshData(element.state.data?.target);
        break;
      default:
        throw new Error(`Unknown action: ${element.action}`);
    }
  }

  private async navigateToPage(page: string): Promise<void> {
    try {
      const response = await this.networkManager.request<{ success: boolean }>({
        method: 'POST',
        url: '/api/ui/navigate',
        data: { page }
      });

      if (response.data.success) {
        this.activePage = page;
        this.lastUpdate = Date.now();
      }
    } catch (error) {
      console.error(`Error navigating to page ${page}:`, error);
      throw error;
    }
  }

  private async switchTab(tab: string): Promise<void> {
    try {
      const response = await this.networkManager.request<{ success: boolean }>({
        method: 'POST',
        url: '/api/ui/tab',
        data: { tab }
      });

      if (response.data.success) {
        this.activeTab = tab;
        this.lastUpdate = Date.now();
      }
    } catch (error) {
      console.error(`Error switching to tab ${tab}:`, error);
      throw error;
    }
  }

  private async openModal(modal: string): Promise<void> {
    try {
      const response = await this.networkManager.request<{ success: boolean }>({
        method: 'POST',
        url: '/api/ui/modal',
        data: { modal }
      });

      if (!response.data.success) {
        throw new Error(`Failed to open modal: ${modal}`);
      }
    } catch (error) {
      console.error(`Error opening modal ${modal}:`, error);
      throw error;
    }
  }

  private async submitForm(form: any): Promise<void> {
    try {
      const response = await this.networkManager.request<{ success: boolean }>({
        method: 'POST',
        url: '/api/ui/submit',
        data: { form }
      });

      if (!response.data.success) {
        throw new Error('Form submission failed');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      throw error;
    }
  }

  private async refreshData(target: string): Promise<void> {
    try {
      const response = await this.networkManager.request<{ success: boolean }>({
        method: 'POST',
        url: '/api/ui/refresh',
        data: { target }
      });

      if (!response.data.success) {
        throw new Error(`Failed to refresh data for ${target}`);
      }
    } catch (error) {
      console.error(`Error refreshing data for ${target}:`, error);
      throw error;
    }
  }

  private addEvent(elementId: string, event: UIEvent): void {
    const events = this.events.get(elementId) || [];
    events.push(event);
    this.events.set(elementId, events);
  }

  public async getElement(elementId: string): Promise<UIElement | undefined> {
    return this.elements.get(elementId);
  }

  public async getAllElements(): Promise<UIElement[]> {
    return Array.from(this.elements.values());
  }

  public async getElementsByType(type: UIElement['type']): Promise<UIElement[]> {
    return Array.from(this.elements.values()).filter(
      element => element.type === type
    );
  }

  public async getElementsByCategory(
    category: string
  ): Promise<UIElement[]> {
    return Array.from(this.elements.values()).filter(
      element => element.metadata.category === category
    );
  }

  public async getElementEvents(
    elementId: string
  ): Promise<UIEvent[]> {
    return this.events.get(elementId) || [];
  }

  public getActivePage(): string {
    return this.activePage;
  }

  public getActiveTab(): string {
    return this.activeTab;
  }

  public async updateElement(
    elementId: string,
    updates: Partial<UIElement>
  ): Promise<UIElement> {
    const element = this.elements.get(elementId);
    if (!element) {
      throw new Error(`UI element not found: ${elementId}`);
    }

    const updatedElement: UIElement = {
      ...element,
      ...updates,
      metadata: {
        ...element.metadata,
        updated: Date.now()
      }
    };

    this.elements.set(elementId, updatedElement);
    this.lastUpdate = Date.now();
    return updatedElement;
  }

  public async exportData(): Promise<string> {
    const data = {
      elements: Array.from(this.elements.values()),
      events: Object.fromEntries(this.events),
      activePage: this.activePage,
      activeTab: this.activeTab,
      lastUpdate: this.lastUpdate
    };
    return JSON.stringify(data, null, 2);
  }

  public async importData(data: string): Promise<void> {
    try {
      const parsedData = JSON.parse(data);
      this.elements = new Map(
        parsedData.elements.map((e: UIElement) => [e.id, e])
      );
      this.events = new Map(Object.entries(parsedData.events));
      this.activePage = parsedData.activePage;
      this.activeTab = parsedData.activeTab;
      this.lastUpdate = parsedData.lastUpdate;
    } catch (error) {
      console.error('Failed to import UI manager data:', error);
      throw error;
    }
  }

  public getLastUpdate(): number {
    return this.lastUpdate;
  }

  public getElementCount(): number {
    return this.elements.size;
  }

  public getEventCount(): number {
    return Array.from(this.events.values()).reduce(
      (sum, events) => sum + events.length,
      0
    );
  }
} 