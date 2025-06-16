import { NetworkManager } from '../../../frontend/src/utils/network';
import { AIEvolutionLogger } from './AIEvolutionLogger';
import { BrandDNA } from './BrandDNA';
import { BrandDNAAnalyzer } from './BrandDNAAnalyzer';
import { EscalationEngine } from './EscalationEngine';
import { PromptTuner } from './PromptTuner';
import { ToneGuard } from './ToneGuard';

export interface FrameworkConfig {
  id: string;
  name: string;
  description: string;
  components: {
    type: string;
    id: string;
    config: Record<string, any>;
    enabled: boolean;
  }[];
  routing: {
    source: string;
    target: string;
    conditions: Record<string, any>;
    priority: number;
  }[];
  settings: {
    logging: boolean;
    monitoring: boolean;
    optimization: boolean;
    fallback: boolean;
  };
}

export interface FrameworkMetrics {
  id: string;
  timestamp: Date;
  performance: {
    responseTime: number;
    throughput: number;
    errorRate: number;
    resourceUsage: number;
  };
  routing: {
    totalRequests: number;
    successfulRoutes: number;
    failedRoutes: number;
    averageLatency: number;
  };
  components: Record<string, {
    status: 'active' | 'inactive' | 'error';
    metrics: Record<string, number>;
  }>;
}

export interface FrameworkEvent {
  id: string;
  type: 'routing' | 'component' | 'system' | 'error';
  timestamp: Date;
  source: string;
  target: string;
  details: {
    action: string;
    status: 'success' | 'failure' | 'warning';
    data: Record<string, any>;
  };
}

interface FrameworkRoute {
  id: string;
  frameworkId: string;
  path: string;
  handler: string;
  params: Record<string, any>;
  metadata: {
    created: number;
    updated: number;
    version: number;
    status: 'active' | 'inactive' | 'deprecated';
  };
}

interface RouteResult {
  success: boolean;
  data?: any;
  error?: string;
  metadata: {
    routeId: string;
    timestamp: number;
    duration: number;
  };
}

export class FrameworkRouter {
  private static instance: FrameworkRouter;
  private networkManager: NetworkManager;
  private configs: Map<string, FrameworkConfig> = new Map();
  private metrics: Map<string, FrameworkMetrics[]> = new Map();
  private events: Map<string, FrameworkEvent[]> = new Map();
  private components: Map<string, any> = new Map();
  private lastUpdate: Date = new Date();
  private routes: Map<string, FrameworkRoute>;

  private constructor() {
    this.networkManager = NetworkManager.getInstance();
    this.routes = new Map();
    this.initializeComponents();
  }

  private initializeComponents(): void {
    this.components.set('aiEvolutionLogger', AIEvolutionLogger.getInstance());
    this.components.set('brandDNA', BrandDNA.getInstance());
    this.components.set('brandDNAAnalyzer', BrandDNAAnalyzer.getInstance());
    this.components.set('escalationEngine', EscalationEngine.getInstance());
    this.components.set('promptTuner', PromptTuner.getInstance());
    this.components.set('toneGuard', ToneGuard.getInstance());
  }

  public static getInstance(): FrameworkRouter {
    if (!FrameworkRouter.instance) {
      FrameworkRouter.instance = new FrameworkRouter();
    }
    return FrameworkRouter.instance;
  }

  public async addConfig(config: FrameworkConfig): Promise<void> {
    this.configs.set(config.id, config);
    this.lastUpdate = new Date();

    try {
      await this.networkManager.request({
        method: 'POST',
        url: '/api/framework/configs',
        data: config,
        cache: false
      });
    } catch (error) {
      console.error('Failed to add framework config:', error);
      throw error;
    }
  }

  public async updateConfig(
    configId: string,
    updates: Partial<FrameworkConfig>
  ): Promise<void> {
    const config = this.configs.get(configId);
    if (!config) {
      throw new Error(`Config ${configId} not found`);
    }

    Object.assign(config, updates);
    this.lastUpdate = new Date();

    try {
      await this.networkManager.request({
        method: 'PUT',
        url: `/api/framework/configs/${configId}`,
        data: updates,
        cache: false
      });
    } catch (error) {
      console.error('Failed to update framework config:', error);
      throw error;
    }
  }

  public async routeRequest(
    configId: string,
    request: {
      source: string;
      type: string;
      data: Record<string, any>;
    }
  ): Promise<{
    target: string;
    result: any;
    metrics: FrameworkMetrics;
  }> {
    const config = this.configs.get(configId);
    if (!config) {
      throw new Error(`Config ${configId} not found`);
    }

    try {
      const response = await this.networkManager.request({
        method: 'POST',
        url: `/api/framework/${configId}/route`,
        data: request,
        cache: false
      });

      const result = response.data as {
        target: string;
        result: any;
        metrics: FrameworkMetrics;
      };

      if (!this.metrics.has(configId)) {
        this.metrics.set(configId, []);
      }
      this.metrics.get(configId)!.push(result.metrics);
      this.lastUpdate = new Date();

      return result;
    } catch (error) {
      console.error('Failed to route request:', error);
      throw error;
    }
  }

  public async logEvent(event: FrameworkEvent): Promise<void> {
    if (!this.events.has(event.source)) {
      this.events.set(event.source, []);
    }
    this.events.get(event.source)!.push(event);
    this.lastUpdate = new Date();

    try {
      await this.networkManager.request({
        method: 'POST',
        url: '/api/framework/events',
        data: event,
        cache: false
      });
    } catch (error) {
      console.error('Failed to log framework event:', error);
      throw error;
    }
  }

  public async analyzePerformance(
    configId: string,
    timeRange?: { start: Date; end: Date }
  ): Promise<{
    metrics: FrameworkMetrics[];
    trends: {
      metric: keyof FrameworkMetrics['performance'] | keyof FrameworkMetrics['routing'];
      values: { timestamp: Date; value: number }[];
    }[];
    recommendations: {
      type: string;
      description: string;
      impact: number;
    }[];
  }> {
    const config = this.configs.get(configId);
    if (!config) {
      throw new Error(`Config ${configId} not found`);
    }

    try {
      const response = await this.networkManager.request({
        method: 'GET',
        url: `/api/framework/${configId}/analyze`,
        params: timeRange,
        cache: false
      });

      return response.data as {
        metrics: FrameworkMetrics[];
        trends: {
          metric: keyof FrameworkMetrics['performance'] | keyof FrameworkMetrics['routing'];
          values: { timestamp: Date; value: number }[];
        }[];
        recommendations: {
          type: string;
          description: string;
          impact: number;
        }[];
      };
    } catch (error) {
      console.error('Failed to analyze framework performance:', error);
      throw error;
    }
  }

  public getConfigs(): FrameworkConfig[] {
    return Array.from(this.configs.values());
  }

  public getMetrics(configId: string): FrameworkMetrics[] {
    return this.metrics.get(configId) || [];
  }

  public getEvents(source: string): FrameworkEvent[] {
    return this.events.get(source) || [];
  }

  public getComponent<T>(type: string): T | undefined {
    return this.components.get(type) as T | undefined;
  }

  public getLastUpdate(): Date {
    return this.lastUpdate;
  }

  public async exportData(): Promise<string> {
    const exportData = {
      configs: Object.fromEntries(this.configs),
      metrics: Object.fromEntries(this.metrics),
      events: Object.fromEntries(this.events),
      routes: Array.from(this.routes.values()),
      lastUpdate: this.lastUpdate
    };
    return JSON.stringify(exportData, null, 2);
  }

  public async importData(dataJson: string): Promise<void> {
    try {
      const importedData = JSON.parse(dataJson);
      this.configs = new Map(Object.entries(importedData.configs));
      this.metrics = new Map(Object.entries(importedData.metrics));
      this.events = new Map(Object.entries(importedData.events));
      this.routes = new Map(importedData.routes.map((r: FrameworkRoute) => [r.id, r]));
      this.lastUpdate = new Date(importedData.lastUpdate);
    } catch (error) {
      console.error('Failed to import framework data:', error);
      throw error;
    }
  }

  public async route(
    frameworkId: string,
    data: any
  ): Promise<RouteResult> {
    const route = this.routes.get(frameworkId);
    if (!route) {
      throw new Error(`Framework route not found: ${frameworkId}`);
    }

    try {
      const startTime = Date.now();
      const result = await this.executeRoute(route, data);
      const duration = Date.now() - startTime;

      return {
        success: true,
        data: result,
        metadata: {
          routeId: route.id,
          timestamp: Date.now(),
          duration
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          routeId: route.id,
          timestamp: Date.now(),
          duration: 0
        }
      };
    }
  }

  private async executeRoute(
    route: FrameworkRoute,
    data: any
  ): Promise<any> {
    const response = await this.networkManager.request({
      method: 'POST',
      url: `/api/frameworks/${route.frameworkId}/execute`,
      data: {
        path: route.path,
        handler: route.handler,
        params: route.params,
        input: data
      }
    });
    return response.data;
  }

  public async addRoute(route: FrameworkRoute): Promise<FrameworkRoute> {
    this.validateRoute(route);

    const newRoute: FrameworkRoute = {
      ...route,
      metadata: {
        ...route.metadata,
        created: Date.now(),
        updated: Date.now(),
        version: 1,
        status: 'active'
      }
    };

    this.routes.set(newRoute.id, newRoute);
    this.lastUpdate = new Date();
    return newRoute;
  }

  private validateRoute(route: FrameworkRoute): void {
    if (!route.id || !route.frameworkId || !route.path || !route.handler) {
      throw new Error('Invalid route configuration');
    }
  }

  public async updateRoute(
    routeId: string,
    updates: Partial<FrameworkRoute>
  ): Promise<FrameworkRoute> {
    const route = this.routes.get(routeId);
    if (!route) {
      throw new Error(`Route not found: ${routeId}`);
    }

    const updatedRoute: FrameworkRoute = {
      ...route,
      ...updates,
      metadata: {
        ...route.metadata,
        updated: Date.now(),
        version: route.metadata.version + 1
      }
    };

    this.validateRoute(updatedRoute);
    this.routes.set(routeId, updatedRoute);
    this.lastUpdate = new Date();
    return updatedRoute;
  }

  public async removeRoute(routeId: string): Promise<void> {
    if (!this.routes.has(routeId)) {
      throw new Error(`Route not found: ${routeId}`);
    }

    this.routes.delete(routeId);
    this.lastUpdate = new Date();
  }

  public async getRoute(routeId: string): Promise<FrameworkRoute | undefined> {
    return this.routes.get(routeId);
  }

  public async getAllRoutes(): Promise<FrameworkRoute[]> {
    return Array.from(this.routes.values());
  }

  public async getFrameworkRoutes(
    frameworkId: string
  ): Promise<FrameworkRoute[]> {
    return Array.from(this.routes.values()).filter(
      route => route.frameworkId === frameworkId
    );
  }

  public getRouteCount(): number {
    return this.routes.size;
  }
} 