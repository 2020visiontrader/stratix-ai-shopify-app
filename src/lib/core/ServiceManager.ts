import { NetworkManager } from '../../../frontend/src/utils/network';

interface Service {
  id: string;
  name: string;
  type: 'ai' | 'analytics' | 'storage' | 'queue' | 'cache';
  config: {
    endpoint?: string;
    credentials?: Record<string, string>;
    options?: Record<string, any>;
  };
  metadata: {
    created: number;
    updated: number;
    status: 'running' | 'stopped' | 'error';
    version: string;
    dependencies: string[];
  };
  metrics: {
    uptime: number;
    requests: number;
    errors: number;
    latency: number;
  };
}

interface ServiceResult {
  serviceId: string;
  timestamp: number;
  operation: string;
  success: boolean;
  data?: any;
  error?: string;
  metadata: {
    duration: number;
    resources: {
      cpu: number;
      memory: number;
      network: number;
    };
  };
}

export class ServiceManager {
  private static instance: ServiceManager;
  private networkManager: NetworkManager;
  private services: Map<string, Service>;
  private results: Map<string, ServiceResult[]>;
  private lastUpdate: number;

  private constructor() {
    this.networkManager = NetworkManager.getInstance();
    this.services = new Map();
    this.results = new Map();
    this.lastUpdate = Date.now();
  }

  public static getInstance(): ServiceManager {
    if (!ServiceManager.instance) {
      ServiceManager.instance = new ServiceManager();
    }
    return ServiceManager.instance;
  }

  public async addService(service: Omit<Service, 'id'>): Promise<Service> {
    try {
      const newService: Service = {
        ...service,
        id: crypto.randomUUID(),
        metadata: {
          ...service.metadata,
          created: Date.now(),
          updated: Date.now()
        },
        metrics: {
          uptime: 0,
          requests: 0,
          errors: 0,
          latency: 0
        }
      };

      this.validateService(newService);
      this.services.set(newService.id, newService);
      this.lastUpdate = Date.now();

      // Initialize service
      await this.initializeService(newService.id);

      return newService;
    } catch (error) {
      console.error('Error adding service:', error);
      throw error;
    }
  }

  private validateService(service: Service): void {
    if (!service.name || !service.type || !service.config) {
      throw new Error('Invalid service data');
    }

    if (!service.metadata || !service.metadata.version) {
      throw new Error('Service must include metadata');
    }
  }

  public async updateService(
    serviceId: string,
    updates: Partial<Service>
  ): Promise<Service> {
    const service = this.services.get(serviceId);
    if (!service) {
      throw new Error(`Service not found: ${serviceId}`);
    }

    const updatedService: Service = {
      ...service,
      ...updates,
      metadata: {
        ...service.metadata,
        updated: Date.now()
      }
    };

    this.validateService(updatedService);
    this.services.set(serviceId, updatedService);
    this.lastUpdate = Date.now();

    // Reinitialize service
    await this.initializeService(serviceId);

    return updatedService;
  }

  private async initializeService(serviceId: string): Promise<void> {
    const service = this.services.get(serviceId);
    if (!service) {
      throw new Error(`Service not found: ${serviceId}`);
    }

    try {
      const result = await this.executeOperation(serviceId, 'initialize', {});
      if (result.success) {
        service.metadata.status = 'running';
      } else {
        service.metadata.status = 'error';
      }
    } catch (error) {
      service.metadata.status = 'error';
    }

    this.services.set(serviceId, service);
  }

  public async executeOperation(
    serviceId: string,
    operation: string,
    data: any
  ): Promise<ServiceResult> {
    const service = this.services.get(serviceId);
    if (!service) {
      throw new Error(`Service not found: ${serviceId}`);
    }

    const startTime = Date.now();
    const startMetrics = { ...service.metrics };

    try {
      const response = await this.networkManager.request<any>({
        method: 'POST',
        url: `/api/services/${serviceId}/execute`,
        data: {
          operation,
          data,
          config: service.config
        }
      });

      // Update metrics
      service.metrics.requests++;
      service.metrics.latency = (service.metrics.latency + (Date.now() - startTime)) / 2;

      const result: ServiceResult = {
        serviceId,
        timestamp: Date.now(),
        operation,
        success: true,
        data: response.data,
        metadata: {
          duration: Date.now() - startTime,
          resources: await this.getResourceUsage(serviceId)
        }
      };

      this.addResult(serviceId, result);
      this.services.set(serviceId, service);
      return result;
    } catch (error) {
      // Update error metrics
      service.metrics.errors++;
      service.metrics.requests++;

      const result: ServiceResult = {
        serviceId,
        timestamp: Date.now(),
        operation,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          duration: Date.now() - startTime,
          resources: await this.getResourceUsage(serviceId)
        }
      };

      this.addResult(serviceId, result);
      this.services.set(serviceId, service);
      throw error;
    }
  }

  private async getResourceUsage(
    serviceId: string
  ): Promise<ServiceResult['metadata']['resources']> {
    const response = await this.networkManager.request<
      ServiceResult['metadata']['resources']
    >({
      method: 'GET',
      url: `/api/services/${serviceId}/resources`
    });
    return response.data;
  }

  private addResult(serviceId: string, result: ServiceResult): void {
    const results = this.results.get(serviceId) || [];
    results.push(result);
    this.results.set(serviceId, results);
  }

  public async getService(serviceId: string): Promise<Service | undefined> {
    return this.services.get(serviceId);
  }

  public async getAllServices(): Promise<Service[]> {
    return Array.from(this.services.values());
  }

  public async getServicesByType(type: Service['type']): Promise<Service[]> {
    return Array.from(this.services.values()).filter(
      service => service.type === type
    );
  }

  public async getServicesByStatus(
    status: Service['metadata']['status']
  ): Promise<Service[]> {
    return Array.from(this.services.values()).filter(
      service => service.metadata.status === status
    );
  }

  public async getServiceResults(serviceId: string): Promise<ServiceResult[]> {
    return this.results.get(serviceId) || [];
  }

  public async startService(serviceId: string): Promise<void> {
    const service = this.services.get(serviceId);
    if (!service) {
      throw new Error(`Service not found: ${serviceId}`);
    }

    await this.executeOperation(serviceId, 'start', {});
    service.metadata.status = 'running';
    this.services.set(serviceId, service);
  }

  public async stopService(serviceId: string): Promise<void> {
    const service = this.services.get(serviceId);
    if (!service) {
      throw new Error(`Service not found: ${serviceId}`);
    }

    await this.executeOperation(serviceId, 'stop', {});
    service.metadata.status = 'stopped';
    this.services.set(serviceId, service);
  }

  public async restartService(serviceId: string): Promise<void> {
    await this.stopService(serviceId);
    await this.startService(serviceId);
  }

  public async exportData(): Promise<string> {
    const data = {
      services: Array.from(this.services.values()),
      results: Object.fromEntries(this.results),
      lastUpdate: this.lastUpdate
    };
    return JSON.stringify(data, null, 2);
  }

  public async importData(data: string): Promise<void> {
    try {
      const parsedData = JSON.parse(data);
      this.services = new Map(
        parsedData.services.map((s: Service) => [s.id, s])
      );
      this.results = new Map(Object.entries(parsedData.results));
      this.lastUpdate = parsedData.lastUpdate;
    } catch (error) {
      console.error('Failed to import service manager data:', error);
      throw error;
    }
  }

  public getLastUpdate(): number {
    return this.lastUpdate;
  }

  public getServiceCount(): number {
    return this.services.size;
  }

  public getResultCount(): number {
    return Array.from(this.results.values()).reduce(
      (sum, results) => sum + results.length,
      0
    );
  }
} 