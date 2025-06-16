import { NetworkManager } from '../../../frontend/src/utils/network';

interface ServiceConfig {
  id: string;
  name: string;
  type: string;
  dependencies: string[];
  settings: {
    enabled: boolean;
    autoStart: boolean;
    restartOnFailure: boolean;
    maxRestarts: number;
    healthCheckInterval: number;
  };
  metadata: {
    created: number;
    updated: number;
    lastStart?: number;
    lastStop?: number;
    status: 'running' | 'stopped' | 'error';
    restartCount: number;
  };
}

interface ServiceHealth {
  serviceId: string;
  timestamp: number;
  status: 'healthy' | 'unhealthy' | 'degraded';
  metrics: {
    cpu: number;
    memory: number;
    responseTime: number;
  };
  details?: {
    message: string;
    error?: string;
  };
}

export class ServiceManager {
  private static instance: ServiceManager;
  private networkManager: NetworkManager;
  private services: Map<string, ServiceConfig>;
  private healthChecks: Map<string, ServiceHealth>;
  private lastUpdate: number;
  private healthCheckIntervals: Map<string, NodeJS.Timeout>;

  private constructor() {
    this.networkManager = NetworkManager.getInstance();
    this.services = new Map();
    this.healthChecks = new Map();
    this.healthCheckIntervals = new Map();
    this.lastUpdate = Date.now();
  }

  public static getInstance(): ServiceManager {
    if (!ServiceManager.instance) {
      ServiceManager.instance = new ServiceManager();
    }
    return ServiceManager.instance;
  }

  public async registerService(config: ServiceConfig): Promise<ServiceConfig> {
    this.validateServiceConfig(config);

    const service: ServiceConfig = {
      ...config,
      metadata: {
        ...config.metadata,
        created: Date.now(),
        updated: Date.now(),
        status: 'stopped',
        restartCount: 0
      }
    };

    this.services.set(service.id, service);
    this.lastUpdate = Date.now();

    if (service.settings.autoStart) {
      await this.startService(service.id);
    }

    return service;
  }

  private validateServiceConfig(config: ServiceConfig): void {
    if (!config.id || !config.name || !config.type) {
      throw new Error('Invalid service configuration');
    }

    // Check for circular dependencies
    const visited = new Set<string>();
    const checkDependencies = (serviceId: string) => {
      if (visited.has(serviceId)) {
        throw new Error(`Circular dependency detected: ${serviceId}`);
      }
      visited.add(serviceId);
      const service = this.services.get(serviceId);
      if (service) {
        service.dependencies.forEach(depId => checkDependencies(depId));
      }
    };
    config.dependencies.forEach(depId => checkDependencies(depId));
  }

  public async startService(serviceId: string): Promise<void> {
    const service = this.services.get(serviceId);
    if (!service) {
      throw new Error(`Service not found: ${serviceId}`);
    }

    // Start dependencies first
    for (const depId of service.dependencies) {
      const depService = this.services.get(depId);
      if (depService && depService.metadata.status !== 'running') {
        await this.startService(depId);
      }
    }

    try {
      await this.executeServiceStart(service);
      service.metadata.status = 'running';
      service.metadata.lastStart = Date.now();
      this.services.set(serviceId, service);

      // Start health check if enabled
      if (service.settings.healthCheckInterval > 0) {
        this.startHealthCheck(service);
      }
    } catch (error) {
      service.metadata.status = 'error';
      this.services.set(serviceId, service);
      throw error;
    }
  }

  private async executeServiceStart(service: ServiceConfig): Promise<void> {
    // Implementation would depend on the service type
    // This is a placeholder that would be replaced with actual start logic
  }

  public async stopService(serviceId: string): Promise<void> {
    const service = this.services.get(serviceId);
    if (!service) {
      throw new Error(`Service not found: ${serviceId}`);
    }

    // Stop health check if running
    this.stopHealthCheck(serviceId);

    try {
      await this.executeServiceStop(service);
      service.metadata.status = 'stopped';
      service.metadata.lastStop = Date.now();
      this.services.set(serviceId, service);
    } catch (error) {
      service.metadata.status = 'error';
      this.services.set(serviceId, service);
      throw error;
    }
  }

  private async executeServiceStop(service: ServiceConfig): Promise<void> {
    // Implementation would depend on the service type
    // This is a placeholder that would be replaced with actual stop logic
  }

  private startHealthCheck(service: ServiceConfig): void {
    const interval = setInterval(async () => {
      try {
        const health = await this.checkServiceHealth(service);
        this.healthChecks.set(service.id, health);

        if (health.status === 'unhealthy' && service.settings.restartOnFailure) {
          if (service.metadata.restartCount < service.settings.maxRestarts) {
            await this.restartService(service.id);
          } else {
            await this.stopService(service.id);
          }
        }
      } catch (error) {
        console.error(`Health check failed for service ${service.id}:`, error);
      }
    }, service.settings.healthCheckInterval);

    this.healthCheckIntervals.set(service.id, interval);
  }

  private stopHealthCheck(serviceId: string): void {
    const interval = this.healthCheckIntervals.get(serviceId);
    if (interval) {
      clearInterval(interval);
      this.healthCheckIntervals.delete(serviceId);
    }
  }

  private async checkServiceHealth(service: ServiceConfig): Promise<ServiceHealth> {
    // Implementation would depend on the service type
    // This is a placeholder that would be replaced with actual health check logic
    return {
      serviceId: service.id,
      timestamp: Date.now(),
      status: 'healthy',
      metrics: {
        cpu: 0,
        memory: 0,
        responseTime: 0
      }
    };
  }

  public async restartService(serviceId: string): Promise<void> {
    await this.stopService(serviceId);
    const service = this.services.get(serviceId);
    if (service) {
      service.metadata.restartCount++;
      this.services.set(serviceId, service);
    }
    await this.startService(serviceId);
  }

  public async getService(serviceId: string): Promise<ServiceConfig | undefined> {
    return this.services.get(serviceId);
  }

  public async getAllServices(): Promise<ServiceConfig[]> {
    return Array.from(this.services.values());
  }

  public async getServiceHealth(serviceId: string): Promise<ServiceHealth | undefined> {
    return this.healthChecks.get(serviceId);
  }

  public async exportData(): Promise<string> {
    const data = {
      services: Array.from(this.services.values()),
      healthChecks: Array.from(this.healthChecks.values()),
      lastUpdate: this.lastUpdate
    };
    return JSON.stringify(data, null, 2);
  }

  public async importData(data: string): Promise<void> {
    try {
      const parsedData = JSON.parse(data);
      this.services = new Map(
        parsedData.services.map((s: ServiceConfig) => [s.id, s])
      );
      this.healthChecks = new Map(
        parsedData.healthChecks.map((h: ServiceHealth) => [h.serviceId, h])
      );
      this.lastUpdate = parsedData.lastUpdate;

      // Restart health checks for running services
      this.services.forEach(service => {
        if (service.metadata.status === 'running' && service.settings.healthCheckInterval > 0) {
          this.startHealthCheck(service);
        }
      });
    } catch (error) {
      console.error('Failed to import service data:', error);
      throw error;
    }
  }

  public getLastUpdate(): number {
    return this.lastUpdate;
  }

  public getServiceCount(): number {
    return this.services.size;
  }

  public getRunningServiceCount(): number {
    return Array.from(this.services.values()).filter(
      service => service.metadata.status === 'running'
    ).length;
  }
} 