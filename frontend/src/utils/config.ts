export class ConfigManager {
  private static instance: ConfigManager;
  private config: Map<string, any>;
  private defaults: Map<string, any>;
  private subscribers: Map<string, Set<ConfigSubscriber>>;
  private readonly storageKey: string;

  private constructor() {
    this.config = new Map();
    this.defaults = new Map();
    this.subscribers = new Map();
    this.storageKey = 'app_config';
    this.loadFromStorage();
  }

  public static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  private loadFromStorage(): void {
    try {
      const storedConfig = localStorage.getItem(this.storageKey);
      if (storedConfig) {
        const parsedConfig = JSON.parse(storedConfig);
        Object.entries(parsedConfig).forEach(([key, value]) => {
          this.config.set(key, value);
        });
      }
    } catch (error) {
      console.error('Failed to load config from storage:', error);
    }
  }

  private saveToStorage(): void {
    try {
      const configObject = Object.fromEntries(this.config);
      localStorage.setItem(this.storageKey, JSON.stringify(configObject));
    } catch (error) {
      console.error('Failed to save config to storage:', error);
    }
  }

  public set<T>(
    key: string,
    value: T,
    options?: ConfigOptions
  ): void {
    const previousValue = this.config.get(key);
    this.config.set(key, value);
    this.saveToStorage();
    this.notifySubscribers(key, value, previousValue);

    if (options?.persist) {
      this.defaults.set(key, value);
    }
  }

  public get<T>(key: string, defaultValue?: T): T | undefined {
    return (this.config.get(key) ?? defaultValue) as T;
  }

  public has(key: string): boolean {
    return this.config.has(key);
  }

  public delete(key: string): void {
    const previousValue = this.config.get(key);
    this.config.delete(key);
    this.saveToStorage();
    this.notifySubscribers(key, undefined, previousValue);
  }

  public clear(): void {
    this.config.clear();
    this.saveToStorage();
    this.notifySubscribers('*', undefined, undefined);
  }

  public reset(): void {
    this.config.clear();
    this.defaults.forEach((value, key) => {
      this.config.set(key, value);
    });
    this.saveToStorage();
    this.notifySubscribers('*', undefined, undefined);
  }

  public subscribe(
    key: string,
    subscriber: ConfigSubscriber
  ): () => void {
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set());
    }
    this.subscribers.get(key)!.add(subscriber);

    return () => {
      const subscribers = this.subscribers.get(key);
      if (subscribers) {
        subscribers.delete(subscriber);
        if (subscribers.size === 0) {
          this.subscribers.delete(key);
        }
      }
    };
  }

  private notifySubscribers(
    key: string,
    newValue: any,
    previousValue: any
  ): void {
    // Notify specific key subscribers
    const keySubscribers = this.subscribers.get(key);
    if (keySubscribers) {
      keySubscribers.forEach(subscriber => {
        try {
          subscriber(newValue, previousValue);
        } catch (error) {
          console.error(`Error in config subscriber for ${key}:`, error);
        }
      });
    }

    // Notify wildcard subscribers
    const wildcardSubscribers = this.subscribers.get('*');
    if (wildcardSubscribers) {
      wildcardSubscribers.forEach(subscriber => {
        try {
          subscriber(newValue, previousValue);
        } catch (error) {
          console.error('Error in wildcard config subscriber:', error);
        }
      });
    }
  }

  public getKeys(): string[] {
    return Array.from(this.config.keys());
  }

  public getValues(): any[] {
    return Array.from(this.config.values());
  }

  public getDefaults(): Record<string, any> {
    return Object.fromEntries(this.defaults);
  }

  public async exportConfig(format: 'json' | 'csv'): Promise<string> {
    const config = Object.fromEntries(this.config);
    const defaults = Object.fromEntries(this.defaults);

    if (format === 'json') {
      return JSON.stringify({ config, defaults }, null, 2);
    } else {
      const headers = ['Key', 'Value', 'IsDefault'];
      const rows = Array.from(this.config.entries()).map(([key, value]) => [
        key,
        JSON.stringify(value),
        this.defaults.has(key).toString()
      ]);
      return [headers, ...rows].map(row => row.join(',')).join('\n');
    }
  }

  public async importConfig(data: string, format: 'json' | 'csv'): Promise<void> {
    try {
      let parsedConfig: Record<string, any>;
      let parsedDefaults: Record<string, any> = {};

      if (format === 'json') {
        const parsed = JSON.parse(data);
        parsedConfig = parsed.config;
        parsedDefaults = parsed.defaults || {};
      } else {
        const rows = data.split('\n').map(row => row.split(','));
        const headers = rows[0];
        parsedConfig = {};
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (row.length === headers.length) {
            const key = row[0];
            try {
              parsedConfig[key] = JSON.parse(row[1]);
              if (row[2] === 'true') {
                parsedDefaults[key] = parsedConfig[key];
              }
            } catch {
              parsedConfig[key] = row[1];
            }
          }
        }
      }

      // Clear existing config
      this.config.clear();
      this.defaults.clear();

      // Import new config
      Object.entries(parsedConfig).forEach(([key, value]) => {
        this.config.set(key, value);
      });

      // Import defaults
      Object.entries(parsedDefaults).forEach(([key, value]) => {
        this.defaults.set(key, value);
      });

      this.saveToStorage();
      this.notifySubscribers('*', undefined, undefined);
    } catch (error) {
      console.error('Failed to import config:', error);
      throw error;
    }
  }

  public getConfig(): Record<string, any> {
    return Object.fromEntries(this.config);
  }

  public setConfig(config: Record<string, any>): void {
    Object.entries(config).forEach(([key, value]) => {
      this.set(key, value);
    });
  }

  public validateConfig(schema: ConfigSchema): ValidationResult {
    const errors: string[] = [];

    for (const [key, rules] of Object.entries(schema)) {
      const value = this.get(key);

      if (rules.required && value === undefined) {
        errors.push(`${key} is required`);
        continue;
      }

      if (value !== undefined) {
        if (rules.type && typeof value !== rules.type) {
          errors.push(`${key} must be of type ${rules.type}`);
        }

        if (rules.min !== undefined && value != null && typeof value === 'number' && value < rules.min) {
          errors.push(`${key} must be greater than or equal to ${rules.min}`);
        }

        if (rules.max !== undefined && value != null && typeof value === 'number' && value > rules.max) {
          errors.push(`${key} must be less than or equal to ${rules.max}`);
        }

        if (rules.pattern && !rules.pattern.test(String(value))) {
          errors.push(`${key} must match pattern ${rules.pattern}`);
        }

        if (rules.enum && !rules.enum.includes(value)) {
          errors.push(`${key} must be one of: ${rules.enum.join(', ')}`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

type ConfigSubscriber = (newValue: any, previousValue: any) => void;

interface ConfigOptions {
  persist?: boolean;
}

interface ConfigSchema {
  [key: string]: {
    type?: string;
    required?: boolean;
    min?: number;
    max?: number;
    pattern?: RegExp;
    enum?: any[];
  };
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
} 