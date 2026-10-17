/**
 * Centralized Application Logger
 */

import { env } from '@/config/env';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
  private isEnabled = env.enableDebugLogs ?? true;

  private formatMessage(level: LogLevel, context: string, message: string): string {
    const timestamp = new Date().toISOString().split('T')[1].slice(0, 8);
    return `[${timestamp}] [${level.toUpperCase()}] [${context}] ${message}`;
  }

  debug(contextOrMsg: string, msgOrData?: any, optionalData?: any): void {
    if (!this.isEnabled) return;
    if (optionalData !== undefined || typeof msgOrData === 'string') {
      console.log(this.formatMessage('debug', contextOrMsg, msgOrData), optionalData ?? '');
    } else {
      console.log(this.formatMessage('debug', 'App', contextOrMsg), msgOrData ?? '');
    }
  }

  info(contextOrMsg: string, msgOrData?: any, optionalData?: any): void {
    if (!this.isEnabled) return;
    if (optionalData !== undefined || typeof msgOrData === 'string') {
      console.info(this.formatMessage('info', contextOrMsg, msgOrData), optionalData ?? '');
    } else {
      console.info(this.formatMessage('info', 'App', contextOrMsg), msgOrData ?? '');
    }
  }

  warn(contextOrMsg: string, msgOrData?: any, optionalData?: any): void {
    if (optionalData !== undefined || typeof msgOrData === 'string') {
      console.warn(this.formatMessage('warn', contextOrMsg, msgOrData), optionalData ?? '');
    } else {
      console.warn(this.formatMessage('warn', 'App', contextOrMsg), msgOrData ?? '');
    }
  }

  error(contextOrMsg: string, msgOrData?: any, optionalData?: any): void {
    if (optionalData !== undefined || typeof msgOrData === 'string') {
      console.error(this.formatMessage('error', contextOrMsg, msgOrData), optionalData ?? '');
    } else {
      console.error(this.formatMessage('error', 'App', contextOrMsg), msgOrData ?? '');
    }
  }
}

export const logger = new Logger();
export default logger;
