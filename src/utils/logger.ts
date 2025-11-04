/**
 * Mobile App Logger
 * Simple logging utility for React Native
 * 
 * COMMENT: Upgraded per Production Hardening Task 1.7
 * - Disables console.log in production builds
 * - Only logs ERROR and WARN in production
 * - All logs disabled when __DEV__ is false
 */

interface LogLevel {
  ERROR: 0;
  WARN: 1;
  INFO: 2;
  DEBUG: 3;
}

const LOG_LEVELS: LogLevel = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
};

class Logger {
  private currentLevel: number;

  constructor() {
    // COMMENT: SECURITY - Disable logs in production per Task 1.7
    // In production, only log ERROR and WARN
    // In development, log everything (DEBUG level)
    this.currentLevel = __DEV__ ? LOG_LEVELS.DEBUG : LOG_LEVELS.WARN;
  }

  private shouldLog(level: number): boolean {
    // COMMENT: SECURITY - Never log in production except errors/warnings
    if (!__DEV__ && level > LOG_LEVELS.WARN) {
      return false;
    }
    return level <= this.currentLevel;
  }

  private formatMessage(level: string, message: string, ...args: any[]): void {
    // COMMENT: SECURITY - Don't format/log if not in development per Task 1.7
    if (!__DEV__ && level !== 'ERROR' && level !== 'WARN') {
      return;
    }
    
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level}]`;
    
    // COMMENT: SECURITY - Use conditional logging per Task 1.7
    // Only call console.log in development or for errors/warnings
    if (__DEV__ || level === 'ERROR' || level === 'WARN') {
      if (args.length > 0) {
        console.log(prefix, message, ...args);
      } else {
        console.log(prefix, message);
      }
    }
  }

  error(message: string, ...args: any[]): void {
    if (this.shouldLog(LOG_LEVELS.ERROR)) {
      this.formatMessage('ERROR', message, ...args);
    }
  }

  warn(message: string, ...args: any[]): void {
    if (this.shouldLog(LOG_LEVELS.WARN)) {
      this.formatMessage('WARN', message, ...args);
    }
  }

  info(message: string, ...args: any[]): void {
    if (this.shouldLog(LOG_LEVELS.INFO)) {
      this.formatMessage('INFO', message, ...args);
    }
  }

  debug(message: string, ...args: any[]): void {
    if (this.shouldLog(LOG_LEVELS.DEBUG)) {
      this.formatMessage('DEBUG', message, ...args);
    }
  }

  setLevel(level: keyof LogLevel): void {
    this.currentLevel = LOG_LEVELS[level];
  }
}

// Export singleton instance
export const logger = new Logger();

// Export default
export default logger;

