export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR'
}

interface LogEntry {
  id: string;
  level: LogLevel;
  message: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

interface LogAnalysis {
  totalLogs: number;
  levelDistribution: Record<LogLevel, number>;
  recentLogs: LogEntry[];
  commonMessages: Array<{ message: string; count: number }>;
}

export class Logger {
  private static instance: Logger;
  private logs: Map<string, LogEntry>;
  private readonly maxLogs: number;

  private constructor(maxLogs: number = 1000) {
    this.logs = new Map();
    this.maxLogs = maxLogs;
  }

  public static getInstance(maxLogs?: number): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger(maxLogs);
    }
    return Logger.instance;
  }

  public debug(message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, metadata);
  }

  public info(message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, metadata);
  }

  public warn(message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, metadata);
  }

  public error(message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.ERROR, message, metadata);
  }

  private log(level: LogLevel, message: string, metadata?: Record<string, any>): void {
    const logEntry: LogEntry = {
      id: crypto.randomUUID(),
      level,
      message,
      timestamp: new Date(),
      metadata
    };

    this.logs.set(logEntry.id, logEntry);
    this.cleanupOldLogs();

    // Console output with color coding
    const color = this.getColorForLevel(level);
    console.log(
      `%c${level}%c ${message}`,
      `color: ${color}; font-weight: bold;`,
      'color: inherit;'
    );

    if (metadata) {
      console.log('Metadata:', metadata);
    }
  }

  private getColorForLevel(level: LogLevel): string {
    switch (level) {
      case LogLevel.DEBUG:
        return '#6c757d'; // Gray
      case LogLevel.INFO:
        return '#0dcaf0'; // Cyan
      case LogLevel.WARN:
        return '#ffc107'; // Yellow
      case LogLevel.ERROR:
        return '#dc3545'; // Red
      default:
        return '#000000'; // Black
    }
  }

  private cleanupOldLogs(): void {
    if (this.logs.size > this.maxLogs) {
      const logsArray = Array.from(this.logs.entries());
      const logsToRemove = logsArray
        .sort((a, b) => a[1].timestamp.getTime() - b[1].timestamp.getTime())
        .slice(0, logsArray.length - this.maxLogs);

      logsToRemove.forEach(([id]) => this.logs.delete(id));
    }
  }

  public getLog(id: string): LogEntry {
    const log = this.logs.get(id);
    if (!log) {
      throw new Error('Log not found');
    }
    return { ...log };
  }

  public getAllLogs(): LogEntry[] {
    return Array.from(this.logs.values());
  }

  public getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.getAllLogs().filter(log => log.level === level);
  }

  public getRecentLogs(limit: number = 10): LogEntry[] {
    return this.getAllLogs()
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  public async analyzeLogs(): Promise<LogAnalysis> {
    const logs = this.getAllLogs();
    if (logs.length === 0) {
      return {
        totalLogs: 0,
        levelDistribution: {
          [LogLevel.DEBUG]: 0,
          [LogLevel.INFO]: 0,
          [LogLevel.WARN]: 0,
          [LogLevel.ERROR]: 0
        },
        recentLogs: [],
        commonMessages: []
      };
    }

    const levelDistribution = this.calculateLevelDistribution(logs);
    const recentLogs = this.getRecentLogs(10);
    const commonMessages = this.findCommonMessages(logs);

    return {
      totalLogs: logs.length,
      levelDistribution,
      recentLogs,
      commonMessages
    };
  }

  private calculateLevelDistribution(logs: LogEntry[]): Record<LogLevel, number> {
    const distribution: Record<LogLevel, number> = {
      [LogLevel.DEBUG]: 0,
      [LogLevel.INFO]: 0,
      [LogLevel.WARN]: 0,
      [LogLevel.ERROR]: 0
    };

    logs.forEach(log => {
      distribution[log.level]++;
    });

    return distribution;
  }

  private findCommonMessages(logs: LogEntry[]): Array<{ message: string; count: number }> {
    const messageCounts = new Map<string, number>();
    logs.forEach(log => {
      messageCounts.set(log.message, (messageCounts.get(log.message) || 0) + 1);
    });

    return Array.from(messageCounts.entries())
      .map(([message, count]) => ({ message, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  public async exportLogs(format: 'json' | 'csv'): Promise<string> {
    const logs = this.getAllLogs();
    if (format === 'json') {
      return JSON.stringify(logs, null, 2);
    } else {
      const headers = ['ID', 'Level', 'Message', 'Timestamp', 'Metadata'];
      const rows = logs.map(log => [
        log.id,
        log.level,
        log.message,
        log.timestamp.toISOString(),
        JSON.stringify(log.metadata || {})
      ]);
      return [headers, ...rows].map(row => row.join(',')).join('\n');
    }
  }

  public clearLogs(): void {
    this.logs.clear();
  }
} 