import { NetworkManager } from '@/lib/core/NetworkManager';
import { Config, ConfigResult, ConfigType, ConfigValue, ManagerState } from './CoreTypes';

export class ConfigManager {
  private static instance: ConfigManager;
  private networkManager: NetworkManager;
  private configs: Map<string, Config>;
  private results: Map<string, ConfigResult[]>;
  private state: ManagerState = {
    lastUpdate: new Date(),
    version: '1.0.0',
    status: 'active'
  };

  private constructor() {
    this.networkManager = NetworkManager.getInstance();
    this.configs = new Map();
    this.results = new Map();
  }

  public static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  public async set(
    key: string,
    value: ConfigValue,
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
      this.state.lastUpdate = new Date();

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

  private inferType(value: ConfigValue): ConfigType {
    if (Array.isArray(value)) return 'array';
    if (value === null || value === undefined) return 'string';
    if (typeof value === 'object') return 'object';
    return typeof value as ConfigType;
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

  private validateType(value: ConfigValue, type: ConfigType): boolean {
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

  public async get(key: string): Promise<ConfigValue> {
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
    this.state.lastUpdate = new Date();

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

  public async getConfigsByType(type: ConfigType): Promise<Config[]> {
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

  public getLastUpdate(): Date {
    return this.state.lastUpdate;
  }

  public getState(): ManagerState {
    return { ...this.state };
  }

  public async exportData(): Promise<string> {
    const data = {
      configs: Array.from(this.configs.entries()),
      results: Array.from(this.results.entries()),
      state: this.state
    };
    return JSON.stringify(data);
  }

  public async importData(dataJson: string): Promise<void> {
    const data = JSON.parse(dataJson);
    this.configs = new Map(data.configs);
    this.results = new Map(data.results);
    this.state = data.state;
  }
} 