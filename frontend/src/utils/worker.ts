export class WorkerManager {
  private static instance: WorkerManager;
  private workers: Map<string, Worker>;
  private messageHandlers: Map<string, Set<MessageHandler>>;
  private errorHandlers: Map<string, Set<ErrorHandler>>;
  private maxWorkers: number;

  private constructor() {
    this.workers = new Map();
    this.messageHandlers = new Map();
    this.errorHandlers = new Map();
    this.maxWorkers = navigator.hardwareConcurrency || 4;
  }

  public static getInstance(): WorkerManager {
    if (!WorkerManager.instance) {
      WorkerManager.instance = new WorkerManager();
    }
    return WorkerManager.instance;
  }

  public createWorker(
    id: string,
    script: string | URL,
    options?: WorkerOptions
  ): Worker {
    if (this.workers.has(id)) {
      console.warn(`Worker with ID ${id} already exists`);
      return this.workers.get(id)!;
    }

    if (this.workers.size >= this.maxWorkers) {
      throw new Error(`Maximum number of workers (${this.maxWorkers}) reached`);
    }

    try {
      const worker = new Worker(script, options);
      this.workers.set(id, worker);
      this.setupWorkerEventListeners(id, worker);
      return worker;
    } catch (error) {
      console.error(`Failed to create worker ${id}:`, error);
      throw error;
    }
  }

  private setupWorkerEventListeners(id: string, worker: Worker): void {
    worker.onmessage = (event) => {
      const handlers = this.messageHandlers.get(id);
      if (handlers) {
        handlers.forEach(handler => {
          try {
            handler(event.data);
          } catch (error) {
            console.error(`Error in message handler for worker ${id}:`, error);
          }
        });
      }
    };

    worker.onerror = (error) => {
      const handlers = this.errorHandlers.get(id);
      if (handlers) {
        handlers.forEach(handler => {
          try {
            handler(error);
          } catch (handlerError) {
            console.error(`Error in error handler for worker ${id}:`, handlerError);
          }
        });
      }
    };
  }

  public terminateWorker(id: string): void {
    const worker = this.workers.get(id);
    if (worker) {
      worker.terminate();
      this.workers.delete(id);
      this.messageHandlers.delete(id);
      this.errorHandlers.delete(id);
    }
  }

  public postMessage(id: string, message: any): void {
    const worker = this.workers.get(id);
    if (worker) {
      worker.postMessage(message);
    } else {
      console.warn(`Worker ${id} not found`);
    }
  }

  public subscribeToMessages(
    id: string,
    handler: MessageHandler
  ): () => void {
    if (!this.messageHandlers.has(id)) {
      this.messageHandlers.set(id, new Set());
    }
    this.messageHandlers.get(id)!.add(handler);

    return () => {
      const handlers = this.messageHandlers.get(id);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          this.messageHandlers.delete(id);
        }
      }
    };
  }

  public subscribeToErrors(
    id: string,
    handler: ErrorHandler
  ): () => void {
    if (!this.errorHandlers.has(id)) {
      this.errorHandlers.set(id, new Set());
    }
    this.errorHandlers.get(id)!.add(handler);

    return () => {
      const handlers = this.errorHandlers.get(id);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          this.errorHandlers.delete(id);
        }
      }
    };
  }

  public getWorker(id: string): Worker | undefined {
    return this.workers.get(id);
  }

  public getWorkerIds(): string[] {
    return Array.from(this.workers.keys());
  }

  public getActiveWorkerCount(): number {
    return this.workers.size;
  }

  public getMaxWorkerCount(): number {
    return this.maxWorkers;
  }

  public setMaxWorkerCount(count: number): void {
    if (count < this.workers.size) {
      throw new Error(`Cannot set max workers to ${count} as there are ${this.workers.size} active workers`);
    }
    this.maxWorkers = count;
  }

  public async executeTask<T>(
    id: string,
    task: WorkerTask
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const worker = this.workers.get(id);
      if (!worker) {
        reject(new Error(`Worker ${id} not found`));
        return;
      }

      const messageHandler = (data: any) => {
        if (data.type === 'result' && data.taskId === task.id) {
          this.unsubscribeFromMessages(id, messageHandler);
          resolve(data.result);
        }
      };

      const errorHandler = (error: ErrorEvent) => {
        if (error.message.includes(task.id)) {
          this.unsubscribeFromErrors(id, errorHandler);
          reject(error);
        }
      };

      this.subscribeToMessages(id, messageHandler);
      this.subscribeToErrors(id, errorHandler);

      worker.postMessage({
        type: 'task',
        taskId: task.id,
        task: task
      });
    });
  }

  private unsubscribeFromMessages(
    id: string,
    handler: MessageHandler
  ): void {
    const handlers = this.messageHandlers.get(id);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  private unsubscribeFromErrors(
    id: string,
    handler: ErrorHandler
  ): void {
    const handlers = this.errorHandlers.get(id);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  public async terminateAllWorkers(): Promise<void> {
    const terminationPromises = Array.from(this.workers.entries()).map(
      ([id, worker]) => {
        return new Promise<void>((resolve) => {
          worker.onmessage = () => resolve();
          worker.terminate();
        });
      }
    );

    await Promise.all(terminationPromises);
    this.workers.clear();
    this.messageHandlers.clear();
    this.errorHandlers.clear();
  }

  public async exportWorkerState(id: string): Promise<string> {
    const worker = this.workers.get(id);
    if (!worker) {
      throw new Error(`Worker ${id} not found`);
    }

    const state = {
      id,
      messageHandlers: this.messageHandlers.get(id)?.size || 0,
      errorHandlers: this.errorHandlers.get(id)?.size || 0
    };

    return JSON.stringify(state, null, 2);
  }

  public async importWorkerState(
    id: string,
    state: string
  ): Promise<void> {
    try {
      const parsedState = JSON.parse(state);
      if (parsedState.id !== id) {
        throw new Error('Worker ID mismatch');
      }

      // Note: We can't restore the actual handlers, but we can track the counts
      if (!this.messageHandlers.has(id)) {
        this.messageHandlers.set(id, new Set());
      }
      if (!this.errorHandlers.has(id)) {
        this.errorHandlers.set(id, new Set());
      }
    } catch (error) {
      console.error(`Failed to import worker state for ${id}:`, error);
    }
  }
}

type MessageHandler = (data: any) => void;
type ErrorHandler = (error: ErrorEvent) => void;

interface WorkerTask {
  id: string;
  type: string;
  data?: any;
}

interface WorkerOptions {
  name?: string;
  type?: 'classic' | 'module';
  credentials?: 'omit' | 'same-origin' | 'include';
} 