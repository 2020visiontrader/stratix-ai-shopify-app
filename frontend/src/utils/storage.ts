export class StorageManager {
  private static instance: StorageManager;
  private storage: Storage;
  private prefix: string;
  private subscribers: Map<string, Set<StorageSubscriber>>;

  private constructor(prefix: string = 'app_') {
    this.storage = window.localStorage;
    this.prefix = prefix;
    this.subscribers = new Map();
  }

  public static getInstance(prefix?: string): StorageManager {
    if (!StorageManager.instance) {
      StorageManager.instance = new StorageManager(prefix);
    }
    return StorageManager.instance;
  }

  public setItem<T>(key: string, value: T): void {
    const prefixedKey = this.getPrefixedKey(key);
    const serializedValue = JSON.stringify(value);
    const previousValue = this.getItem(key);

    try {
      this.storage.setItem(prefixedKey, serializedValue);
      this.notifySubscribers(key, value, previousValue);
    } catch (error) {
      console.error(`Failed to set item ${key}:`, error);
      throw error;
    }
  }

  public getItem<T>(key: string): T | null {
    const prefixedKey = this.getPrefixedKey(key);
    const serializedValue = this.storage.getItem(prefixedKey);

    if (serializedValue === null) {
      return null;
    }

    try {
      return JSON.parse(serializedValue) as T;
    } catch (error) {
      console.error(`Failed to parse item ${key}:`, error);
      return null;
    }
  }

  public removeItem(key: string): void {
    const prefixedKey = this.getPrefixedKey(key);
    const previousValue = this.getItem(key);

    try {
      this.storage.removeItem(prefixedKey);
      this.notifySubscribers(key, null, previousValue);
    } catch (error) {
      console.error(`Failed to remove item ${key}:`, error);
      throw error;
    }
  }

  public clear(): void {
    try {
      this.storage.clear();
      this.notifySubscribers('*', null, null);
    } catch (error) {
      console.error('Failed to clear storage:', error);
      throw error;
    }
  }

  public subscribe(
    key: string,
    subscriber: StorageSubscriber
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
          console.error(`Error in storage subscriber for ${key}:`, error);
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
          console.error('Error in wildcard storage subscriber:', error);
        }
      });
    }
  }

  private getPrefixedKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  public getKeys(): string[] {
    const keys: string[] = [];
    for (let i = 0; i < this.storage.length; i++) {
      const key = this.storage.key(i);
      if (key && key.startsWith(this.prefix)) {
        keys.push(key.slice(this.prefix.length));
      }
    }
    return keys;
  }

  public getSize(): number {
    let size = 0;
    for (let i = 0; i < this.storage.length; i++) {
      const key = this.storage.key(i);
      if (key && key.startsWith(this.prefix)) {
        const value = this.storage.getItem(key);
        size += (key.length + (value?.length || 0)) * 2; // UTF-16 encoding
      }
    }
    return size;
  }

  public async exportData(format: 'json' | 'csv'): Promise<string> {
    const data: Record<string, any> = {};
    this.getKeys().forEach(key => {
      data[key] = this.getItem(key);
    });

    if (format === 'json') {
      return JSON.stringify(data, null, 2);
    } else {
      const headers = ['Key', 'Value'];
      const rows = Object.entries(data).map(([key, value]) => [
        key,
        JSON.stringify(value)
      ]);
      return [headers, ...rows].map(row => row.join(',')).join('\n');
    }
  }

  public async importData(data: string, format: 'json' | 'csv'): Promise<void> {
    try {
      let parsedData: Record<string, any>;

      if (format === 'json') {
        parsedData = JSON.parse(data);
      } else {
        const rows = data.split('\n').map(row => row.split(','));
        const headers = rows[0];
        parsedData = {};
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (row.length === headers.length) {
            const key = row[0];
            try {
              parsedData[key] = JSON.parse(row[1]);
            } catch {
              parsedData[key] = row[1];
            }
          }
        }
      }

      Object.entries(parsedData).forEach(([key, value]) => {
        this.setItem(key, value);
      });
    } catch (error) {
      console.error('Failed to import storage data:', error);
      throw error;
    }
  }

  public setPrefix(prefix: string): void {
    const oldPrefix = this.prefix;
    this.prefix = prefix;

    // Migrate existing data
    const keys = this.getKeys();
    keys.forEach(key => {
      const value = this.getItem(key);
      this.storage.removeItem(`${oldPrefix}${key}`);
      this.setItem(key, value);
    });
  }

  public getPrefix(): string {
    return this.prefix;
  }

  public useSessionStorage(): void {
    this.storage = window.sessionStorage;
  }

  public useLocalStorage(): void {
    this.storage = window.localStorage;
  }

  public getStorageType(): 'localStorage' | 'sessionStorage' {
    return this.storage === window.localStorage ? 'localStorage' : 'sessionStorage';
  }
}

type StorageSubscriber = (newValue: any, previousValue: any) => void; 