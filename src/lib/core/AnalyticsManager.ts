import { AnalyticsData, AnalyticsEvent, ManagerState } from './CoreTypes';
import { NetworkManager } from './NetworkManager';

export class AnalyticsManager {
  private static instance: AnalyticsManager;
  private networkManager: NetworkManager;
  private state: ManagerState = {
    lastUpdate: new Date(),
    version: '1.0.0',
    status: 'active',
  };
  private events: AnalyticsEvent[] = [];
  private data: AnalyticsData[] = [];

  private constructor() {
    this.networkManager = NetworkManager.getInstance();
  }

  public static getInstance(): AnalyticsManager {
    if (!AnalyticsManager.instance) {
      AnalyticsManager.instance = new AnalyticsManager();
    }
    return AnalyticsManager.instance;
  }

  public async trackEvent(event: AnalyticsEvent): Promise<void> {
    this.events.push(event);
    try {
      await this.networkManager.request({
        method: 'POST',
        url: '/api/analytics/events',
        data: event,
        cache: false,
      });
    } catch (error) {
      console.error('Failed to track event:', error);
      throw error;
    }
  }

  public async getAnalytics(query: { type: string; startDate?: string; endDate?: string }): Promise<AnalyticsData[]> {
    try {
      const response = await this.networkManager.request<AnalyticsData[]> ({
        method: 'GET',
        url: '/api/analytics',
        params: query,
        cache: true,
      });
      this.data = response.data;
      return response.data;
    } catch (error) {
      console.error('Failed to fetch analytics data:', error);
      throw error;
    }
  }

  public getState(): ManagerState {
    return { ...this.state };
  }

  public async exportData(): Promise<string> {
    const data = {
      events: this.events,
      data: this.data,
      state: this.state,
    };
    return JSON.stringify(data);
  }

  public async importData(dataJson: string): Promise<void> {
    const data = JSON.parse(dataJson);
    this.events = data.events;
    this.data = data.data;
    this.state = data.state;
  }

} 