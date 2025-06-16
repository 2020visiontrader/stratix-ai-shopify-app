export class SecurityManager {
  private static instance: SecurityManager;
  private readonly tokenKey: string;
  private readonly refreshTokenKey: string;
  private readonly csrfTokenKey: string;
  private readonly tokenExpiryKey: string;
  private subscribers: Map<string, Set<SecuritySubscriber>>;

  private constructor() {
    this.tokenKey = 'auth_token';
    this.refreshTokenKey = 'refresh_token';
    this.csrfTokenKey = 'csrf_token';
    this.tokenExpiryKey = 'token_expiry';
    this.subscribers = new Map();
  }

  public static getInstance(): SecurityManager {
    if (!SecurityManager.instance) {
      SecurityManager.instance = new SecurityManager();
    }
    return SecurityManager.instance;
  }

  public setToken(token: string, expiry?: number): void {
    localStorage.setItem(this.tokenKey, token);
    if (expiry) {
      localStorage.setItem(this.tokenExpiryKey, expiry.toString());
    }
    this.notifySubscribers('token', token, null);
  }

  public getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  public setRefreshToken(token: string): void {
    localStorage.setItem(this.refreshTokenKey, token);
    this.notifySubscribers('refreshToken', token, null);
  }

  public getRefreshToken(): string | null {
    return localStorage.getItem(this.refreshTokenKey);
  }

  public setCsrfToken(token: string): void {
    localStorage.setItem(this.csrfTokenKey, token);
    this.notifySubscribers('csrfToken', token, null);
  }

  public getCsrfToken(): string | null {
    return localStorage.getItem(this.csrfTokenKey);
  }

  public clearTokens(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.refreshTokenKey);
    localStorage.removeItem(this.csrfTokenKey);
    localStorage.removeItem(this.tokenExpiryKey);
    this.notifySubscribers('clear', null, null);
  }

  public isTokenValid(): boolean {
    const token = this.getToken();
    const expiry = localStorage.getItem(this.tokenExpiryKey);
    if (!token || !expiry) {
      return false;
    }
    return Date.now() < parseInt(expiry);
  }

  public subscribe(
    event: SecurityEvent,
    subscriber: SecuritySubscriber
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
    event: SecurityEvent,
    data: any,
    previousData: any
  ): void {
    const subscribers = this.subscribers.get(event);
    if (subscribers) {
      subscribers.forEach(subscriber => {
        try {
          subscriber(data, previousData);
        } catch (error) {
          console.error(`Error in security subscriber for ${event}:`, error);
        }
      });
    }
  }

  public async hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  public async verifyPassword(
    password: string,
    hash: string
  ): Promise<boolean> {
    const hashedPassword = await this.hashPassword(password);
    return hashedPassword === hash;
  }

  public generateRandomToken(length: number = 32): string {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  public async encryptData(
    data: string,
    key: string
  ): Promise<string> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const keyBuffer = await this.deriveKey(key);

    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encryptedData = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv
      },
      keyBuffer,
      dataBuffer
    );

    const result = new Uint8Array(iv.length + encryptedData.byteLength);
    result.set(iv);
    result.set(new Uint8Array(encryptedData), iv.length);

    return btoa(String.fromCharCode(...result));
  }

  public async decryptData(
    encryptedData: string,
    key: string
  ): Promise<string> {
    const data = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
    const keyBuffer = await this.deriveKey(key);

    const iv = data.slice(0, 12);
    const encryptedContent = data.slice(12);

    const decryptedData = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv
      },
      keyBuffer,
      encryptedContent
    );

    return new TextDecoder().decode(decryptedData);
  }

  private async deriveKey(key: string): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(key);

    const hash = await crypto.subtle.digest('SHA-256', keyData);
    return crypto.subtle.importKey(
      'raw',
      hash,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  public sanitizeInput(input: string): string {
    return input
      .replace(/[<>]/g, '') // Remove < and >
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove on* attributes
      .trim();
  }

  public validatePassword(password: string): ValidationResult {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  public async exportSecurityState(): Promise<string> {
    const state = {
      token: this.getToken(),
      refreshToken: this.getRefreshToken(),
      csrfToken: this.getCsrfToken(),
      tokenExpiry: localStorage.getItem(this.tokenExpiryKey)
    };
    return JSON.stringify(state, null, 2);
  }

  public async importSecurityState(state: string): Promise<void> {
    try {
      const parsedState = JSON.parse(state);
      if (parsedState.token) {
        this.setToken(parsedState.token, parseInt(parsedState.tokenExpiry));
      }
      if (parsedState.refreshToken) {
        this.setRefreshToken(parsedState.refreshToken);
      }
      if (parsedState.csrfToken) {
        this.setCsrfToken(parsedState.csrfToken);
      }
    } catch (error) {
      console.error('Failed to import security state:', error);
      throw error;
    }
  }
}

type SecuritySubscriber = (data: any, previousData: any) => void;

type SecurityEvent = 'token' | 'refreshToken' | 'csrfToken' | 'clear';

interface ValidationResult {
  isValid: boolean;
  errors: string[];
} 