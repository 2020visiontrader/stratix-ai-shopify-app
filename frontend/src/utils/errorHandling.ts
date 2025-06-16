export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public originalError?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorLogs: Map<string, ErrorLog>;

  private constructor() {
    this.errorLogs = new Map();
  }

  public static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  public handleError(error: unknown): AppError {
    if (error instanceof AppError) {
      this.logError(error);
      return error;
    }

    if (error instanceof Error) {
      const appError = new AppError(
        'An unexpected error occurred',
        500,
        error.message
      );
      this.logError(appError);
      return appError;
    }

    const appError = new AppError(
      'An unknown error occurred',
      500,
      String(error)
    );
    this.logError(appError);
    return appError;
  }

  private logError(error: AppError): void {
    const errorLog: ErrorLog = {
      id: crypto.randomUUID(),
      message: error.message,
      statusCode: error.statusCode,
      originalError: error.originalError,
      timestamp: new Date(),
      stack: error.stack
    };

    this.errorLogs.set(errorLog.id, errorLog);
    console.error('Error logged:', errorLog);
  }

  public getErrorLog(id: string): ErrorLog {
    const log = this.errorLogs.get(id);
    if (!log) {
      throw new AppError('Error log not found', 404);
    }
    return { ...log };
  }

  public getAllErrorLogs(): ErrorLog[] {
    return Array.from(this.errorLogs.values());
  }

  public getRecentErrorLogs(limit: number = 10): ErrorLog[] {
    return this.getAllErrorLogs()
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  public getErrorsByStatusCode(statusCode: number): ErrorLog[] {
    return this.getAllErrorLogs().filter(log => log.statusCode === statusCode);
  }

  public async analyzeErrors(): Promise<ErrorAnalysis> {
    const logs = this.getAllErrorLogs();
    if (logs.length === 0) {
      return {
        totalErrors: 0,
        errorTypes: {},
        mostCommonErrors: [],
        recentTrends: []
      };
    }

    const errorTypes = this.categorizeErrors(logs);
    const mostCommonErrors = this.findMostCommonErrors(logs);
    const recentTrends = this.analyzeRecentTrends(logs);

    return {
      totalErrors: logs.length,
      errorTypes,
      mostCommonErrors,
      recentTrends
    };
  }

  private categorizeErrors(logs: ErrorLog[]): Record<string, number> {
    const categories: Record<string, number> = {};
    logs.forEach(log => {
      const category = this.getErrorCategory(log);
      categories[category] = (categories[category] || 0) + 1;
    });
    return categories;
  }

  private getErrorCategory(log: ErrorLog): string {
    if (log.statusCode >= 500) return 'Server Error';
    if (log.statusCode >= 400) return 'Client Error';
    if (log.statusCode >= 300) return 'Redirection';
    if (log.statusCode >= 200) return 'Success';
    return 'Unknown';
  }

  private findMostCommonErrors(logs: ErrorLog[]): Array<{ message: string; count: number }> {
    const messageCounts = new Map<string, number>();
    logs.forEach(log => {
      messageCounts.set(log.message, (messageCounts.get(log.message) || 0) + 1);
    });

    return Array.from(messageCounts.entries())
      .map(([message, count]) => ({ message, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  private analyzeRecentTrends(logs: ErrorLog[]): string[] {
    const recentLogs = logs
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 10);

    const trends: string[] = [];
    const errorCounts = new Map<string, number>();

    recentLogs.forEach(log => {
      const category = this.getErrorCategory(log);
      errorCounts.set(category, (errorCounts.get(category) || 0) + 1);
    });

    errorCounts.forEach((count, category) => {
      trends.push(`${category}: ${count} errors`);
    });

    return trends;
  }
}

interface ErrorLog {
  id: string;
  message: string;
  statusCode: number;
  originalError?: string;
  timestamp: Date;
  stack?: string;
}

interface ErrorAnalysis {
  totalErrors: number;
  errorTypes: Record<string, number>;
  mostCommonErrors: Array<{ message: string; count: number }>;
  recentTrends: string[];
} 