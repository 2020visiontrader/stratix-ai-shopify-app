import { NetworkManager } from '../../../frontend/src/utils/network';

interface Config {
  id: string;
  key: string;
  value: any;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  metadata: {
    created: number;
    updated: number;
    version: string;
    description: string;
    tags: string[];
  };
  validation: {
    required: boolean;
    pattern?: string;
    min?: number;
    max?: number;
    enum?: any[];
  };
}

interface ConfigResult {
  configId: string;
  timestamp: number;
  operation: 'get' | 'set' | 'delete' | 'validate';
  success: boolean;
  value?: any;
  error?: string;
  metadata: {
    processingTime: number;
    source: string;
  };
}

export class ConfigManager {
  private static instance: ConfigManager;
  private networkManager: NetworkManager;
  private configs: Map<string, Config>;
  private results: Map<string, ConfigResult[]>;
  private lastUpdate: number;

  private constructor() {
    this.networkManager = NetworkManager.getInstance();
    this.configs = new Map();
    this.results = new Map();
    this.lastUpdate = Date.now();
  }

  public static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  public async set(
    key: string,
    value: any,
    options: Partial<Omit<Config, 'id' | 'key' | 'value'>> = {}
  ): Promise<Config> {
    try {
      const type = this.inferType(value);
      const config: Config = {
        id: crypto.randomUUID(),
        key,
        value,
        type,
        metadata: {
          created: Date.now(),
          updated: Date.now(),
          version: '1.0.0',
          description: options.metadata?.description || '',
          tags: options.metadata?.tags || []
        },
        validation: {
          required: options.validation?.required || false,
          pattern: options.validation?.pattern,
          min: options.validation?.min,
          max: options.validation?.max,
          enum: options.validation?.enum
        }
      };

      this.validateConfig(config);
      this.configs.set(config.id, config);
      this.lastUpdate = Date.now();

      // Record operation
      const result: ConfigResult = {
        configId: config.id,
        timestamp: Date.now(),
        operation: 'set',
        success: true,
        value: config.value,
        metadata: {
          processingTime: 0,
          source: 'local'
        }
      };
      this.addResult(config.id, result);

      return config;
    } catch (error) {
      console.error(`Error setting config ${key}:`, error);
      throw error;
    }
  }

  private inferType(value: any): Config['type'] {
    if (Array.isArray(value)) return 'array';
    if (value === null || value === undefined) return 'string';
    if (typeof value === 'object') return 'object';
    return typeof value as Config['type'];
  }

  private validateConfig(config: Config): void {
    if (!config.key || config.value === undefined) {
      throw new Error('Invalid config data');
    }

    // Type validation
    if (!this.validateType(config.value, config.type)) {
      throw new Error(`Invalid value type for ${config.key}`);
    }

    // Pattern validation
    if (config.validation.pattern && typeof config.value === 'string') {
      const regex = new RegExp(config.validation.pattern);
      if (!regex.test(config.value)) {
        throw new Error(`Value does not match pattern for ${config.key}`);
      }
    }

    // Range validation
    if (typeof config.value === 'number') {
      if (
        config.validation.min !== undefined &&
        config.value < config.validation.min
      ) {
        throw new Error(`Value below minimum for ${config.key}`);
      }
      if (
        config.validation.max !== undefined &&
        config.value > config.validation.max
      ) {
        throw new Error(`Value above maximum for ${config.key}`);
      }
    }

    // Enum validation
    if (
      config.validation.enum &&
      !config.validation.enum.includes(config.value)
    ) {
      throw new Error(`Invalid enum value for ${config.key}`);
    }
  }

  private validateType(value: any, type: Config['type']): boolean {
    switch (type) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number';
      case 'boolean':
        return typeof value === 'boolean';
      case 'object':
        return typeof value === 'object' && !Array.isArray(value);
      case 'array':
        return Array.isArray(value);
      default:
        return false;
    }
  }

  public async get(key: string): Promise<any> {
    const config = Array.from(this.configs.values()).find(c => c.key === key);
    if (!config) {
      throw new Error(`Config not found: ${key}`);
    }

    const result: ConfigResult = {
      configId: config.id,
      timestamp: Date.now(),
      operation: 'get',
      success: true,
      value: config.value,
      metadata: {
        processingTime: 0,
        source: 'local'
      }
    };
    this.addResult(config.id, result);

    return config.value;
  }

  public async delete(key: string): Promise<void> {
    const config = Array.from(this.configs.values()).find(c => c.key === key);
    if (!config) {
      throw new Error(`Config not found: ${key}`);
    }

    this.configs.delete(config.id);
    this.lastUpdate = Date.now();

    const result: ConfigResult = {
      configId: config.id,
      timestamp: Date.now(),
      operation: 'delete',
      success: true,
      metadata: {
        processingTime: 0,
        source: 'local'
      }
    };
    this.addResult(config.id, result);
  }

  private addResult(configId: string, result: ConfigResult): void {
    const results = this.results.get(configId) || [];
    results.push(result);
    this.results.set(configId, results);
  }

  public async getAllConfigs(): Promise<Config[]> {
    return Array.from(this.configs.values());
  }

  public async getConfigsByType(type: Config['type']): Promise<Config[]> {
    return Array.from(this.configs.values()).filter(
      config => config.type === type
    );
  }

  public async getConfigResults(configId: string): Promise<ConfigResult[]> {
    return this.results.get(configId) || [];
  }

  public async searchConfigs(query: string): Promise<Config[]> {
    return Array.from(this.configs.values()).filter(config =>
      config.key.toLowerCase().includes(query.toLowerCase())
    );
  }

  public async validateConfig(key: string): Promise<boolean> {
    const config = Array.from(this.configs.values()).find(c => c.key === key);
    if (!config) {
      throw new Error(`Config not found: ${key}`);
    }

    try {
      this.validateConfig(config);
      return true;
    } catch (error) {
      return false;
    }
  }

  public async exportData(): Promise<string> {
    const data = {
      configs: Array.from(this.configs.values()),
      results: Object.fromEntries(this.results),
      lastUpdate: this.lastUpdate
    };
    return JSON.stringify(data, null, 2);
  }

  public async importData(data: string): Promise<void> {
    try {
      const parsedData = JSON.parse(data);
      this.configs = new Map(
        parsedData.configs.map((c: Config) => [c.id, c])
      );
      this.results = new Map(Object.entries(parsedData.results));
      this.lastUpdate = parsedData.lastUpdate;
    } catch (error) {
      console.error('Failed to import config manager data:', error);
      throw error;
    }
  }

  public getLastUpdate(): number {
    return this.lastUpdate;
  }

  public getConfigCount(): number {
    return this.configs.size;
  }

  public getResultCount(): number {
    return Array.from(this.results.values()).reduce(
      (sum, results) => sum + results.length,
      0
    );
  }
} 