export class WebSocketManager {
  private static instance: WebSocketManager;
  private socket: WebSocket | null;
  private url: string;
  private protocols: string | string[];
  private reconnectAttempts: number;
  private maxReconnectAttempts: number;
  private reconnectInterval: number;
  private subscribers: Map<string, Set<WebSocketSubscriber>>;
  private messageQueue: Message[];
  private isConnected: boolean;
  private heartbeatInterval: number;
  private heartbeatTimer: NodeJS.Timeout | null;

  private constructor(
    url: string,
    protocols?: string | string[],
    options?: WebSocketOptions
  ) {
    this.url = url;
    this.protocols = protocols || [];
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = options?.maxReconnectAttempts || 5;
    this.reconnectInterval = options?.reconnectInterval || 3000;
    this.subscribers = new Map();
    this.messageQueue = [];
    this.isConnected = false;
    this.socket = null;
    this.heartbeatInterval = options?.heartbeatInterval || 30000;
    this.heartbeatTimer = null;
  }

  public static getInstance(
    url: string,
    protocols?: string | string[],
    options?: WebSocketOptions
  ): WebSocketManager {
    if (!WebSocketManager.instance) {
      WebSocketManager.instance = new WebSocketManager(url, protocols, options);
    }
    return WebSocketManager.instance;
  }

  public connect(): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      console.warn('WebSocket is already connected');
      return;
    }

    try {
      this.socket = new WebSocket(this.url, this.protocols);
      this.setupEventListeners();
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      this.handleReconnect();
    }
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.onopen = () => {
      console.log('WebSocket connection established');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.startHeartbeat();
      this.flushMessageQueue();
      this.notifySubscribers('open', null);
    };

    this.socket.onclose = (event) => {
      console.log('WebSocket connection closed:', event);
      this.isConnected = false;
      this.stopHeartbeat();
      this.notifySubscribers('close', event);
      this.handleReconnect();
    };

    this.socket.onerror = (event) => {
      console.error('WebSocket error:', event);
      this.notifySubscribers('error', event);
    };

    this.socket.onmessage = (event) => {
      try {
        const message = this.parseMessage(event.data);
        this.notifySubscribers('message', message);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
        this.notifySubscribers('error', error);
      }
    };
  }

  private parseMessage(data: any): WebSocketMessage {
    try {
      if (typeof data === 'string') {
        return JSON.parse(data);
      }
      return data;
    } catch (error) {
      return {
        type: 'raw',
        data
      };
    }
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      this.notifySubscribers('maxReconnectAttemptsReached', null);
      return;
    }

    this.reconnectAttempts++;
    console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);

    setTimeout(() => {
      this.connect();
    }, this.reconnectInterval);
  }

  private startHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }

    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected) {
        this.send({ type: 'ping' });
      }
    }, this.heartbeatInterval);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private flushMessageQueue(): void {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      if (message) {
        this.send(message);
      }
    }
  }

  public send(message: WebSocketMessage): void {
    if (!this.isConnected) {
      this.messageQueue.push(message);
      return;
    }

    try {
      const data = JSON.stringify(message);
      this.socket?.send(data);
    } catch (error) {
      console.error('Failed to send WebSocket message:', error);
      this.notifySubscribers('error', error);
    }
  }

  public subscribe(
    event: WebSocketEvent,
    subscriber: WebSocketSubscriber
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
    event: WebSocketEvent,
    data: any
  ): void {
    const subscribers = this.subscribers.get(event);
    if (subscribers) {
      subscribers.forEach(subscriber => {
        try {
          subscriber(data);
        } catch (error) {
          console.error(`Error in WebSocket subscriber for ${event}:`, error);
        }
      });
    }
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.isConnected = false;
    this.stopHeartbeat();
    this.messageQueue = [];
  }

  public getConnectionState(): WebSocketState {
    if (!this.socket) {
      return WebSocketState.CLOSED;
    }

    switch (this.socket.readyState) {
      case WebSocket.CONNECTING:
        return WebSocketState.CONNECTING;
      case WebSocket.OPEN:
        return WebSocketState.OPEN;
      case WebSocket.CLOSING:
        return WebSocketState.CLOSING;
      case WebSocket.CLOSED:
        return WebSocketState.CLOSED;
      default:
        return WebSocketState.CLOSED;
    }
  }

  public isConnectionOpen(): boolean {
    return this.isConnected;
  }

  public getReconnectAttempts(): number {
    return this.reconnectAttempts;
  }

  public setMaxReconnectAttempts(attempts: number): void {
    this.maxReconnectAttempts = attempts;
  }

  public setReconnectInterval(interval: number): void {
    this.reconnectInterval = interval;
  }

  public setHeartbeatInterval(interval: number): void {
    this.heartbeatInterval = interval;
    if (this.isConnected) {
      this.startHeartbeat();
    }
  }

  public async exportConfig(): Promise<string> {
    const config = {
      url: this.url,
      protocols: this.protocols,
      options: {
        maxReconnectAttempts: this.maxReconnectAttempts,
        reconnectInterval: this.reconnectInterval,
        heartbeatInterval: this.heartbeatInterval
      }
    };
    return JSON.stringify(config, null, 2);
  }

  public async importConfig(config: string): Promise<void> {
    try {
      const parsedConfig = JSON.parse(config);
      this.url = parsedConfig.url;
      this.protocols = parsedConfig.protocols;
      this.maxReconnectAttempts = parsedConfig.options.maxReconnectAttempts;
      this.reconnectInterval = parsedConfig.options.reconnectInterval;
      this.heartbeatInterval = parsedConfig.options.heartbeatInterval;
    } catch (error) {
      console.error('Failed to import WebSocket config:', error);
    }
  }
}

type WebSocketSubscriber = (data: any) => void;

type WebSocketEvent =
  | 'open'
  | 'close'
  | 'message'
  | 'error'
  | 'maxReconnectAttemptsReached';

interface WebSocketMessage {
  type: string;
  data?: any;
}

interface WebSocketOptions {
  maxReconnectAttempts?: number;
  reconnectInterval?: number;
  heartbeatInterval?: number;
}

interface Message {
  type: string;
  data?: any;
}

enum WebSocketState {
  CONNECTING = 'CONNECTING',
  OPEN = 'OPEN',
  CLOSING = 'CLOSING',
  CLOSED = 'CLOSED'
} 