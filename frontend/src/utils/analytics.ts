export class AnalyticsManager {
  private static instance: AnalyticsManager;
  private events: AnalyticsEvent[];
  private subscribers: Map<string, Set<AnalyticsSubscriber>>;
  private readonly maxEvents: number;
  private batchSize: number;
  private flushInterval: number;
  private flushTimer: NodeJS.Timeout | null;
  private isEnabled: boolean;

  private constructor(options?: AnalyticsOptions) {
    this.events = [];
    this.subscribers = new Map();
    this.maxEvents = options?.maxEvents || 1000;
    this.batchSize = options?.batchSize || 50;
    this.flushInterval = options?.flushInterval || 30000; // 30 seconds
    this.flushTimer = null;
    this.isEnabled = options?.enabled ?? true;
    this.startFlushTimer();
  }

  public static getInstance(options?: AnalyticsOptions): AnalyticsManager {
    if (!AnalyticsManager.instance) {
      AnalyticsManager.instance = new AnalyticsManager(options);
    }
    return AnalyticsManager.instance;
  }

  public trackEvent(
    name: string,
    properties?: Record<string, any>
  ): void {
    if (!this.isEnabled) {
      return;
    }

    const event: AnalyticsEvent = {
      id: crypto.randomUUID(),
      name,
      properties: properties || {},
      timestamp: new Date()
    };

    this.events.push(event);
    this.notifySubscribers('event', event);

    if (this.events.length >= this.batchSize) {
      this.flush();
    }

    this.cleanupEvents();
  }

  public trackPageView(
    path: string,
    properties?: Record<string, any>
  ): void {
    this.trackEvent('page_view', {
      path,
      ...properties
    });
  }

  public trackError(
    error: Error,
    properties?: Record<string, any>
  ): void {
    this.trackEvent('error', {
      message: error.message,
      stack: error.stack,
      ...properties
    });
  }

  public trackUserAction(
    action: string,
    properties?: Record<string, any>
  ): void {
    this.trackEvent('user_action', {
      action,
      ...properties
    });
  }

  private cleanupEvents(): void {
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }
  }

  private startFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.flushInterval);
  }

  public async flush(): Promise<void> {
    if (this.events.length === 0) {
      return;
    }

    const eventsToFlush = this.events.splice(0, this.batchSize);
    this.notifySubscribers('flush', eventsToFlush);

    try {
      // Here you would typically send the events to your analytics backend
      // For example:
      // await fetch('/api/analytics', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(eventsToFlush)
      // });
    } catch (error) {
      console.error('Failed to flush analytics events:', error);
      // Put the events back in the queue
      this.events.unshift(...eventsToFlush);
    }
  }

  public subscribe(
    event: AnalyticsEventType,
    subscriber: AnalyticsSubscriber
  ): () => void {
    if (!this.subscribers.has(event)) {
      this.subscribers.set(event, new Set());
    }
    this.subscribers.get(event)!.add(subscriber);

    return () => {
      const subscribers = this.subscribers.get(event);
      if (subscribers) {
        subscribers.delete(subscriber);
        if (subscribers.size === 0) {
          this.subscribers.delete(event);
        }
      }
    };
  }

  private notifySubscribers(
    event: AnalyticsEventType,
    data: any
  ): void {
    const subscribers = this.subscribers.get(event);
    if (subscribers) {
      subscribers.forEach(subscriber => {
        try {
          subscriber(data);
        } catch (error) {
          console.error(`Error in analytics subscriber for ${event}:`, error);
        }
      });
    }
  }

  public getEvents(): AnalyticsEvent[] {
    return [...this.events];
  }

  public clearEvents(): void {
    this.events = [];
    this.notifySubscribers('clear', null);
  }

  public enable(): void {
    this.isEnabled = true;
    this.notifySubscribers('enable', null);
  }

  public disable(): void {
    this.isEnabled = false;
    this.notifySubscribers('disable', null);
  }

  public isAnalyticsEnabled(): boolean {
    return this.isEnabled;
  }

  public setBatchSize(size: number): void {
    this.batchSize = size;
  }

  public setFlushInterval(interval: number): void {
    this.flushInterval = interval;
    this.startFlushTimer();
  }

  public async exportEvents(format: 'json' | 'csv'): Promise<string> {
    if (format === 'json') {
      return JSON.stringify(this.events, null, 2);
    } else {
      const headers = ['ID', 'Name', 'Properties', 'Timestamp'];
      const rows = this.events.map(event => [
        event.id,
        event.name,
        JSON.stringify(event.properties),
        event.timestamp.toISOString()
      ]);
      return [headers, ...rows].map(row => row.join(',')).join('\n');
    }
  }

  public async importEvents(data: string, format: 'json' | 'csv'): Promise<void> {
    try {
      let parsedEvents: AnalyticsEvent[];

      if (format === 'json') {
        parsedEvents = JSON.parse(data);
      } else {
        const rows = data.split('\n').map(row => row.split(','));
        const headers = rows[0];
        parsedEvents = [];
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (row.length === headers.length) {
            parsedEvents.push({
              id: row[0],
              name: row[1],
              properties: JSON.parse(row[2]),
              timestamp: new Date(row[3])
            });
          }
        }
      }

      this.events.push(...parsedEvents);
      this.cleanupEvents();
    } catch (error) {
      console.error('Failed to import analytics events:', error);
      throw error;
    }
  }

  public async analyzeEvents(): Promise<AnalyticsReport> {
    const eventCounts = new Map<string, number>();
    const eventProperties = new Map<string, Set<string>>();
    const eventTimestamps = new Map<string, number[]>();

    this.events.forEach(event => {
      // Count event occurrences
      eventCounts.set(event.name, (eventCounts.get(event.name) || 0) + 1);

      // Track property names
      if (!eventProperties.has(event.name)) {
        eventProperties.set(event.name, new Set());
      }
      Object.keys(event.properties).forEach(prop => {
        eventProperties.get(event.name)!.add(prop);
      });

      // Track timestamps
      if (!eventTimestamps.has(event.name)) {
        eventTimestamps.set(event.name, []);
      }
      eventTimestamps.get(event.name)!.push(event.timestamp.getTime());
    });

    // Calculate event frequencies
    const eventFrequencies = new Map<string, number>();
    eventTimestamps.forEach((timestamps, event) => {
      if (timestamps.length > 1) {
        const timeSpan = timestamps[timestamps.length - 1] - timestamps[0];
        const frequency = (timestamps.length / timeSpan) * 1000; // events per second
        eventFrequencies.set(event, frequency);
      }
    });

    return {
      totalEvents: this.events.length,
      uniqueEvents: eventCounts.size,
      eventCounts: Object.fromEntries(eventCounts),
      eventProperties: Object.fromEntries(
        Array.from(eventProperties.entries()).map(([event, props]) => [
          event,
          Array.from(props)
        ])
      ),
      eventFrequencies: Object.fromEntries(eventFrequencies)
    };
  }
}

interface AnalyticsEvent {
  id: string;
  name: string;
  properties: Record<string, any>;
  timestamp: Date;
}

type AnalyticsSubscriber = (data: any) => void;

type AnalyticsEventType = 'event' | 'flush' | 'clear' | 'enable' | 'disable';

interface AnalyticsOptions {
  maxEvents?: number;
  batchSize?: number;
  flushInterval?: number;
  enabled?: boolean;
}

interface AnalyticsReport {
  totalEvents: number;
  uniqueEvents: number;
  eventCounts: Record<string, number>;
  eventProperties: Record<string, string[]>;
  eventFrequencies: Record<string, number>;
} 