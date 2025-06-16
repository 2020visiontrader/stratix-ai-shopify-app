import { NetworkManager } from '../../../frontend/src/utils/network';

interface IntegrationConfig {
  id: string;
  name: string;
  type: 'api' | 'webhook' | 'oauth' | 'custom';
  credentials: {
    apiKey?: string;
    secret?: string;
    token?: string;
    endpoint?: string;
  };
  settings: {
    enabled: boolean;
    retryAttempts: number;
    timeout: number;
    rateLimit?: {
      requests: number;
      period: number;
    };
  };
  metadata: {
    created: number;
    updated: number;
    lastSync?: number;
    status: 'active' | 'inactive' | 'error';
  };
}

interface IntegrationEvent {
  id: string;
  integrationId: string;
  type: string;
  data: any;
  timestamp: number;
  status: 'success' | 'error' | 'pending';
  error?: string;
}

export class IntegrationManager {
  private static instance: IntegrationManager;
  private networkManager: NetworkManager;
  private integrations: Map<string, IntegrationConfig>;
  private events: Map<string, IntegrationEvent>;
  private lastUpdate: number;

  private constructor() {
    this.networkManager = NetworkManager.getInstance();
    this.integrations = new Map();
    this.events = new Map();
    this.lastUpdate = Date.now();
  }

  public static getInstance(): IntegrationManager {
    if (!IntegrationManager.instance) {
      IntegrationManager.instance = new IntegrationManager();
    }
    return IntegrationManager.instance;
  }

  public async addIntegration(config: IntegrationConfig): Promise<IntegrationConfig> {
    this.validateIntegrationConfig(config);

    const integration: IntegrationConfig = {
      ...config,
      metadata: {
        ...config.metadata,
        created: Date.now(),
        updated: Date.now(),
        status: 'active'
      }
    };

    this.integrations.set(integration.id, integration);
    this.lastUpdate = Date.now();
    return integration;
  }

  private validateIntegrationConfig(config: IntegrationConfig): void {
    if (!config.id || !config.name || !config.type) {
      throw new Error('Invalid integration configuration');
    }

    switch (config.type) {
      case 'api':
        if (!config.credentials.apiKey || !config.credentials.endpoint) {
          throw new Error('API integration requires apiKey and endpoint');
        }
        break;
      case 'oauth':
        if (!config.credentials.clientId || !config.credentials.clientSecret) {
          throw new Error('OAuth integration requires clientId and clientSecret');
        }
        break;
      case 'webhook':
        if (!config.credentials.endpoint) {
          throw new Error('Webhook integration requires endpoint');
        }
        break;
    }
  }

  public async updateIntegration(
    integrationId: string,
    updates: Partial<IntegrationConfig>
  ): Promise<IntegrationConfig> {
    const integration = this.integrations.get(integrationId);
    if (!integration) {
      throw new Error(`Integration not found: ${integrationId}`);
    }

    const updatedIntegration: IntegrationConfig = {
      ...integration,
      ...updates,
      metadata: {
        ...integration.metadata,
        updated: Date.now()
      }
    };

    this.validateIntegrationConfig(updatedIntegration);
    this.integrations.set(integrationId, updatedIntegration);
    this.lastUpdate = Date.now();
    return updatedIntegration;
  }

  public async removeIntegration(integrationId: string): Promise<void> {
    if (!this.integrations.has(integrationId)) {
      throw new Error(`Integration not found: ${integrationId}`);
    }

    this.integrations.delete(integrationId);
    this.lastUpdate = Date.now();
  }

  public async syncIntegration(integrationId: string): Promise<void> {
    const integration = this.integrations.get(integrationId);
    if (!integration) {
      throw new Error(`Integration not found: ${integrationId}`);
    }

    try {
      await this.executeSync(integration);
      integration.metadata.lastSync = Date.now();
      integration.metadata.status = 'active';
      this.integrations.set(integrationId, integration);
    } catch (error) {
      integration.metadata.status = 'error';
      this.integrations.set(integrationId, integration);
      throw error;
    }
  }

  private async executeSync(integration: IntegrationConfig): Promise<void> {
    // Implementation would depend on the integration type
    // This is a placeholder that would be replaced with actual sync logic
    switch (integration.type) {
      case 'api':
        await this.syncApiIntegration(integration);
        break;
      case 'webhook':
        await this.syncWebhookIntegration(integration);
        break;
      case 'oauth':
        await this.syncOAuthIntegration(integration);
        break;
      default:
        throw new Error(`Unsupported integration type: ${integration.type}`);
    }
  }

  private async syncApiIntegration(integration: IntegrationConfig): Promise<void> {
    // Placeholder for API sync implementation
  }

  private async syncWebhookIntegration(integration: IntegrationConfig): Promise<void> {
    // Placeholder for webhook sync implementation
  }

  private async syncOAuthIntegration(integration: IntegrationConfig): Promise<void> {
    // Placeholder for OAuth sync implementation
  }

  public async recordEvent(
    integrationId: string,
    type: string,
    data: any
  ): Promise<IntegrationEvent> {
    const event: IntegrationEvent = {
      id: crypto.randomUUID(),
      integrationId,
      type,
      data,
      timestamp: Date.now(),
      status: 'pending'
    };

    this.events.set(event.id, event);
    return event;
  }

  public async getIntegration(integrationId: string): Promise<IntegrationConfig | undefined> {
    return this.integrations.get(integrationId);
  }

  public async getAllIntegrations(): Promise<IntegrationConfig[]> {
    return Array.from(this.integrations.values());
  }

  public async getEvents(integrationId: string): Promise<IntegrationEvent[]> {
    return Array.from(this.events.values()).filter(
      event => event.integrationId === integrationId
    );
  }

  public async exportData(): Promise<string> {
    const data = {
      integrations: Array.from(this.integrations.values()),
      events: Array.from(this.events.values()),
      lastUpdate: this.lastUpdate
    };
    return JSON.stringify(data, null, 2);
  }

  public async importData(data: string): Promise<void> {
    try {
      const parsedData = JSON.parse(data);
      this.integrations = new Map(
        parsedData.integrations.map((i: IntegrationConfig) => [i.id, i])
      );
      this.events = new Map(
        parsedData.events.map((e: IntegrationEvent) => [e.id, e])
      );
      this.lastUpdate = parsedData.lastUpdate;
    } catch (error) {
      console.error('Failed to import integration data:', error);
      throw error;
    }
  }

  public getLastUpdate(): number {
    return this.lastUpdate;
  }

  public getIntegrationCount(): number {
    return this.integrations.size;
  }

  public getEventCount(): number {
    return this.events.size;
  }
} 