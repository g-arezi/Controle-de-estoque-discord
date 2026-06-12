import fs from 'fs';
import path from 'path';

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  data?: unknown;
}

class Logger {
  private logDir = './logs';

  constructor() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  private getLogFile(level: string): string {
    const date = new Date().toISOString().split('T')[0];
    return path.join(this.logDir, `${level}-${date}.log`);
  }

  private formatEntry(level: string, message: string, data?: unknown): LogEntry {
    const entry: any = {
      timestamp: new Date().toISOString(),
      level,
      message,
    };
    if (data) {
      entry.data = data;
    }
    return entry;
  }

  private writeLog(level: string, message: string, data?: unknown): void {
    const entry = this.formatEntry(level, message, data);
    const logFile = this.getLogFile(level);
    fs.appendFileSync(logFile, JSON.stringify(entry) + '\n');
  }

  info(message: string, data?: unknown): void {
    console.log(`[INFO] ${message}`, data ?? '');
    this.writeLog('info', message, data);
  }

  warn(message: string, data?: unknown): void {
    console.warn(`[WARN] ${message}`, data ?? '');
    this.writeLog('warn', message, data);
  }

  error(message: string, data?: unknown): void {
    console.error(`[ERROR] ${message}`, data ?? '');
    this.writeLog('error', message, data);
  }

  debug(message: string, data?: unknown): void {
    console.debug(`[DEBUG] ${message}`, data ?? '');
    this.writeLog('debug', message, data);
  }
}

export const logger = new Logger();
