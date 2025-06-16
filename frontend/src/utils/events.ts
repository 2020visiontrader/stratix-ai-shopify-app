export class EventManager {
  private static instance: EventManager;
  private events: Map<string, Set<EventHandler>>;
  private onceEvents: Map<string, Set<EventHandler>>;
  private eventHistory: EventHistory[];
  private maxHistory: number;

  private constructor() {
    this.events = new Map();
    this.onceEvents = new Map();
    this.eventHistory = [];
    this.maxHistory = 1000;
  }

  public static getInstance(): EventManager {
    if (!EventManager.instance) {
      EventManager.instance = new EventManager();
    }
    return EventManager.instance;
  }

  public on(
    event: string,
    handler: EventHandler
  ): () => void {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }
    this.events.get(event)!.add(handler);

    return () => {
      const handlers = this.events.get(event);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          this.events.delete(event);
        }
      }
    };
  }

  public once(
    event: string,
    handler: EventHandler
  ): () => void {
    if (!this.onceEvents.has(event)) {
      this.onceEvents.set(event, new Set());
    }
    this.onceEvents.get(event)!.add(handler);

    return () => {
      const handlers = this.onceEvents.get(event);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          this.onceEvents.delete(event);
        }
      }
    };
  }

  public emit(event: string, data?: any): void {
    const timestamp = new Date();
    this.addToHistory(event, data, timestamp);

    // Handle regular event handlers
    const handlers = this.events.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error);
        }
      });
    }

    // Handle once event handlers
    const onceHandlers = this.onceEvents.get(event);
    if (onceHandlers) {
      onceHandlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in once event handler for ${event}:`, error);
        }
      });
      this.onceEvents.delete(event);
    }

    // Handle wildcard event handlers
    const wildcardHandlers = this.events.get('*');
    if (wildcardHandlers) {
      wildcardHandlers.forEach(handler => {
        try {
          handler({ event, data });
        } catch (error) {
          console.error('Error in wildcard event handler:', error);
        }
      });
    }
  }

  private addToHistory(
    event: string,
    data: any,
    timestamp: Date
  ): void {
    const historyEntry: EventHistory = {
      id: crypto.randomUUID(),
      event,
      data,
      timestamp
    };

    this.eventHistory.push(historyEntry);
    this.cleanupHistory();
  }

  private cleanupHistory(): void {
    if (this.eventHistory.length > this.maxHistory) {
      this.eventHistory = this.eventHistory.slice(-this.maxHistory);
    }
  }

  public getHistory(): EventHistory[] {
    return [...this.eventHistory];
  }

  public getHistoryByEvent(event: string): EventHistory[] {
    return this.eventHistory.filter(entry => entry.event === event);
  }

  public removeAllListeners(event?: string): void {
    if (event) {
      this.events.delete(event);
      this.onceEvents.delete(event);
    } else {
      this.events.clear();
      this.onceEvents.clear();
    }
  }

  public listenerCount(event: string): number {
    const regularCount = this.events.get(event)?.size || 0;
    const onceCount = this.onceEvents.get(event)?.size || 0;
    return regularCount + onceCount;
  }

  public getEventNames(): string[] {
    const eventNames = new Set<string>();
    this.events.forEach((_, event) => eventNames.add(event));
    this.onceEvents.forEach((_, event) => eventNames.add(event));
    return Array.from(eventNames);
  }

  public async exportHistory(format: 'json' | 'csv'): Promise<string> {
    if (format === 'json') {
      return JSON.stringify(this.eventHistory, null, 2);
    } else {
      const headers = ['ID', 'Event', 'Data', 'Timestamp'];
      const rows = this.eventHistory.map(entry => [
        entry.id,
        entry.event,
        JSON.stringify(entry.data),
        entry.timestamp.toISOString()
      ]);
      return [headers, ...rows].map(row => row.join(',')).join('\n');
    }
  }

  public async importHistory(data: string, format: 'json' | 'csv'): Promise<void> {
    try {
      let parsedHistory: EventHistory[];

      if (format === 'json') {
        parsedHistory = JSON.parse(data);
      } else {
        const rows = data.split('\n').map(row => row.split(','));
        const headers = rows[0];
        parsedHistory = [];
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (row.length === headers.length) {
            parsedHistory.push({
              id: row[0],
              event: row[1],
              data: JSON.parse(row[2]),
              timestamp: new Date(row[3])
            });
          }
        }
      }

      this.eventHistory = parsedHistory;
      this.cleanupHistory();
    } catch (error) {
      console.error('Failed to import event history:', error);
      throw error;
    }
  }

  public setMaxHistory(size: number): void {
    this.maxHistory = size;
    this.cleanupHistory();
  }

  public getMaxHistory(): number {
    return this.maxHistory;
  }

  public clearHistory(): void {
    this.eventHistory = [];
  }

  public async analyzeEvents(): Promise<EventAnalysis> {
    const eventCounts = new Map<string, number>();
    const eventDataTypes = new Map<string, Set<string>>();
    const eventTimestamps = new Map<string, number[]>();

    this.eventHistory.forEach(entry => {
      // Count event occurrences
      eventCounts.set(entry.event, (eventCounts.get(entry.event) || 0) + 1);

      // Track data types
      const dataType = typeof entry.data;
      if (!eventDataTypes.has(entry.event)) {
        eventDataTypes.set(entry.event, new Set());
      }
      eventDataTypes.get(entry.event)!.add(dataType);

      // Track timestamps
      if (!eventTimestamps.has(entry.event)) {
        eventTimestamps.set(entry.event, []);
      }
      eventTimestamps.get(entry.event)!.push(entry.timestamp.getTime());
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
      totalEvents: this.eventHistory.length,
      uniqueEvents: eventCounts.size,
      eventCounts: Object.fromEntries(eventCounts),
      eventDataTypes: Object.fromEntries(
        Array.from(eventDataTypes.entries()).map(([event, types]) => [
          event,
          Array.from(types)
        ])
      ),
      eventFrequencies: Object.fromEntries(eventFrequencies)
    };
  }
}

type EventHandler = (data?: any) => void;

interface EventHistory {
  id: string;
  event: string;
  data: any;
  timestamp: Date;
}

interface EventAnalysis {
  totalEvents: number;
  uniqueEvents: number;
  eventCounts: Record<string, number>;
  eventDataTypes: Record<string, string[]>;
  eventFrequencies: Record<string, number>;
} 