import { NetworkManager } from '../../../frontend/src/utils/network';

interface Integration {
  id: string;
  name: string;
  type: 'api' | 'webhook' | 'oauth' | 'sdk';
  config: {
    endpoint?: string;
    credentials?: Record<string, string>;
    headers?: Record<string, string>;
    options?: Record<string, any>;
  };
  metadata: {
    created: number;
    updated: number;
    status: 'active' | 'inactive' | 'error';
    version: string;
    provider: string;
  };
  health: {
    status: 'healthy' | 'degraded' | 'unhealthy';
    lastCheck: number;
    errors: string[];
  };
}

interface IntegrationResult {
  integrationId: string;
  timestamp: number;
  operation: string;
  success: boolean;
  data?: any;
  error?: string;
  metadata: {
    duration: number;
    retries: number;
  };
}

export class IntegrationManager {
  private static instance: IntegrationManager;
  private networkManager: NetworkManager;
  private integrations: Map<string, Integration>;
  private results: Map<string, IntegrationResult[]>;
  private lastUpdate: number;

  private constructor() {
    this.networkManager = NetworkManager.getInstance();
    this.integrations = new Map();
    this.results = new Map();
    this.lastUpdate = Date.now();
  }

  public static getInstance(): IntegrationManager {
    if (!IntegrationManager.instance) {
      IntegrationManager.instance = new IntegrationManager();
    }
    return IntegrationManager.instance;
  }

  public async addIntegration(integration: Omit<Integration, 'id'>): Promise<Integration> {
    try {
      const newIntegration: Integration = {
        ...integration,
        id: crypto.randomUUID(),
        metadata: {
          ...integration.metadata,
          created: Date.now(),
          updated: Date.now()
        },
        health: {
          status: 'unhealthy',
          lastCheck: Date.now(),
          errors: []
        }
      };

      this.validateIntegration(newIntegration);
      this.integrations.set(newIntegration.id, newIntegration);
      this.lastUpdate = Date.now();

      // Test integration
      await this.testIntegration(newIntegration.id);

      return newIntegration;
    } catch (error) {
      console.error('Error adding integration:', error);
      throw error;
    }
  }

  private validateIntegration(integration: Integration): void {
    if (!integration.name || !integration.type || !integration.config) {
      throw new Error('Invalid integration data');
    }

    if (!integration.metadata || !integration.metadata.provider) {
      throw new Error('Integration must include metadata');
    }
  }

  public async updateIntegration(
    integrationId: string,
    updates: Partial<Integration>
  ): Promise<Integration> {
    const integration = this.integrations.get(integrationId);
    if (!integration) {
      throw new Error(`Integration not found: ${integrationId}`);
    }

    const updatedIntegration: Integration = {
      ...integration,
      ...updates,
      metadata: {
        ...integration.metadata,
        updated: Date.now()
      }
    };

    this.validateIntegration(updatedIntegration);
    this.integrations.set(integrationId, updatedIntegration);
    this.lastUpdate = Date.now();

    // Test updated integration
    await this.testIntegration(integrationId);

    return updatedIntegration;
  }

  private async testIntegration(integrationId: string): Promise<void> {
    const integration = this.integrations.get(integrationId);
    if (!integration) {
      throw new Error(`Integration not found: ${integrationId}`);
    }

    try {
      const result = await this.executeOperation(integrationId, 'test', {});
      if (result.success) {
        integration.health.status = 'healthy';
        integration.health.errors = [];
      } else {
        integration.health.status = 'unhealthy';
        integration.health.errors = [result.error || 'Unknown error'];
      }
    } catch (error) {
      integration.health.status = 'unhealthy';
      integration.health.errors = [error instanceof Error ? error.message : 'Unknown error'];
    }

    integration.health.lastCheck = Date.now();
    this.integrations.set(integrationId, integration);
  }

  public async executeOperation(
    integrationId: string,
    operation: string,
    data: any
  ): Promise<IntegrationResult> {
    const integration = this.integrations.get(integrationId);
    if (!integration) {
      throw new Error(`Integration not found: ${integrationId}`);
    }

    const startTime = Date.now();
    let retries = 0;
    const maxRetries = 3;

    while (retries < maxRetries) {
      try {
        const response = await this.networkManager.request<any>({
          method: 'POST',
          url: `/api/integrations/${integrationId}/execute`,
          data: {
            operation,
            data,
            config: integration.config
          }
        });

        const result: IntegrationResult = {
          integrationId,
          timestamp: Date.now(),
          operation,
          success: true,
          data: response.data,
          metadata: {
            duration: Date.now() - startTime,
            retries
          }
        };

        this.addResult(integrationId, result);
        return result;
      } catch (error) {
        retries++;
        if (retries === maxRetries) {
          const result: IntegrationResult = {
            integrationId,
            timestamp: Date.now(),
            operation,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            metadata: {
              duration: Date.now() - startTime,
              retries
            }
          };

          this.addResult(integrationId, result);
          throw error;
        }
        await new Promise(resolve => setTimeout(resolve, 1000 * retries));
      }
    }

    throw new Error('Operation failed after maximum retries');
  }

  private addResult(integrationId: string, result: IntegrationResult): void {
    const results = this.results.get(integrationId) || [];
    results.push(result);
    this.results.set(integrationId, results);
  }

  public async getIntegration(integrationId: string): Promise<Integration | undefined> {
    return this.integrations.get(integrationId);
  }

  public async getAllIntegrations(): Promise<Integration[]> {
    return Array.from(this.integrations.values());
  }

  public async getIntegrationsByType(type: Integration['type']): Promise<Integration[]> {
    return Array.from(this.integrations.values()).filter(
      integration => integration.type === type
    );
  }

  public async getIntegrationsByStatus(
    status: Integration['metadata']['status']
  ): Promise<Integration[]> {
    return Array.from(this.integrations.values()).filter(
      integration => integration.metadata.status === status
    );
  }

  public async getIntegrationResults(
    integrationId: string
  ): Promise<IntegrationResult[]> {
    return this.results.get(integrationId) || [];
  }

  public async checkHealth(integrationId: string): Promise<void> {
    await this.testIntegration(integrationId);
  }

  public async checkAllHealth(): Promise<void> {
    const integrations = Array.from(this.integrations.values());
    await Promise.all(integrations.map(i => this.checkHealth(i.id)));
  }

  public async exportData(): Promise<string> {
    const data = {
      integrations: Array.from(this.integrations.values()),
      results: Object.fromEntries(this.results),
      lastUpdate: this.lastUpdate
    };
    return JSON.stringify(data, null, 2);
  }

  public async importData(data: string): Promise<void> {
    try {
      const parsedData = JSON.parse(data);
      this.integrations = new Map(
        parsedData.integrations.map((i: Integration) => [i.id, i])
      );
      this.results = new Map(Object.entries(parsedData.results));
      this.lastUpdate = parsedData.lastUpdate;
    } catch (error) {
      console.error('Failed to import integration manager data:', error);
      throw error;
    }
  }

  public getLastUpdate(): number {
    return this.lastUpdate;
  }

  public getIntegrationCount(): number {
    return this.integrations.size;
  }

  public getResultCount(): number {
    return Array.from(this.results.values()).reduce(
      (sum, results) => sum + results.length,
      0
    );
  }
} 