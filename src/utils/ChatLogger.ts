/**
 * Enhanced Logging Configuration for Chat System Testing
 * Provides detailed logging for debugging and monitoring
 */

export const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
  TRACE: 4
};

export const LOG_CATEGORIES = {
  STORAGE: 'Storage',
  CHAT: 'Chat',
  PRESENCE: 'Presence',
  TYPING: 'Typing',
  UPLOAD: 'Upload',
  NOTIFICATION: 'Notification',
  PERFORMANCE: 'Performance',
  SECURITY: 'Security'
};

class ChatLogger {
  private logLevel: number;
  private isEnabled: boolean;

  constructor() {
    // Get log level from environment or default to INFO
    this.logLevel = this.getLogLevelFromEnv();
    this.isEnabled = true;
  }

  private getLogLevelFromEnv(): number {
    const envLevel = process.env.LOG_LEVEL || 'info';
    switch (envLevel.toLowerCase()) {
      case 'error': return LOG_LEVELS.ERROR;
      case 'warn': return LOG_LEVELS.WARN;
      case 'info': return LOG_LEVELS.INFO;
      case 'debug': return LOG_LEVELS.DEBUG;
      case 'trace': return LOG_LEVELS.TRACE;
      default: return LOG_LEVELS.INFO;
    }
  }

  private shouldLog(level: number): boolean {
    return this.isEnabled && level <= this.logLevel;
  }

  private formatMessage(category: string, level: string, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level}] ${category}:`;
    
    if (data) {
      return `${prefix} ${message} ${JSON.stringify(data)}`;
    }
    return `${prefix} ${message}`;
  }

  error(category: string, message: string, data?: any): void {
    if (this.shouldLog(LOG_LEVELS.ERROR)) {
      console.error(this.formatMessage(category, 'ERROR', message, data));
    }
  }

  warn(category: string, message: string, data?: any): void {
    if (this.shouldLog(LOG_LEVELS.WARN)) {
      console.warn(this.formatMessage(category, 'WARN', message, data));
    }
  }

  info(category: string, message: string, data?: any): void {
    if (this.shouldLog(LOG_LEVELS.INFO)) {
      console.log(this.formatMessage(category, 'INFO', message, data));
    }
  }

  debug(category: string, message: string, data?: any): void {
    if (this.shouldLog(LOG_LEVELS.DEBUG)) {
      console.log(this.formatMessage(category, 'DEBUG', message, data));
    }
  }

  trace(category: string, message: string, data?: any): void {
    if (this.shouldLog(LOG_LEVELS.TRACE)) {
      console.log(this.formatMessage(category, 'TRACE', message, data));
    }
  }

  // Performance monitoring
  startTimer(label: string): () => void {
    const startTime = Date.now();
    this.debug(LOG_CATEGORIES.PERFORMANCE, `Timer started: ${label}`);
    
    return () => {
      const duration = Date.now() - startTime;
      this.info(LOG_CATEGORIES.PERFORMANCE, `Timer completed: ${label}`, { duration: `${duration}ms` });
    };
  }

  // Storage operations logging
  logStorageOperation(operation: string, chatId: string, useFirestore: boolean, data?: any): void {
    const storageType = useFirestore ? 'Firestore' : 'Local';
    this.debug(LOG_CATEGORIES.STORAGE, `Storage → ${storageType}`, {
      operation,
      chatId,
      ...data
    });
  }

  // Chat operations logging
  logChatOperation(operation: string, chatId: string, data?: any): void {
    this.debug(LOG_CATEGORIES.CHAT, `Chat operation: ${operation}`, {
      chatId,
      ...data
    });
  }

  // Presence operations logging
  logPresenceOperation(operation: string, userId: string, data?: any): void {
    this.debug(LOG_CATEGORIES.PRESENCE, `Presence: ${operation}`, {
      userId,
      ...data
    });
  }

  // Typing operations logging
  logTypingOperation(operation: string, chatId: string, userId: string, data?: any): void {
    this.debug(LOG_CATEGORIES.TYPING, `Typing: ${operation}`, {
      chatId,
      userId,
      ...data
    });
  }

  // Upload operations logging
  logUploadOperation(operation: string, fileType: string, data?: any): void {
    this.info(LOG_CATEGORIES.UPLOAD, `Upload: ${operation}`, {
      fileType,
      ...data
    });
  }

  // Notification operations logging
  logNotificationOperation(operation: string, data?: any): void {
    this.debug(LOG_CATEGORIES.NOTIFICATION, `Notification: ${operation}`, data);
  }

  // Security operations logging
  logSecurityOperation(operation: string, data?: any): void {
    this.warn(LOG_CATEGORIES.SECURITY, `Security: ${operation}`, data);
  }

  // Enable/disable logging
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  setLogLevel(level: number): void {
    this.logLevel = level;
  }
}

// Export singleton instance
export const chatLogger = new ChatLogger();

// Export convenience functions
export const logError = (category: string, message: string, data?: any) => 
  chatLogger.error(category, message, data);

export const logWarn = (category: string, message: string, data?: any) => 
  chatLogger.warn(category, message, data);

export const logInfo = (category: string, message: string, data?: any) => 
  chatLogger.info(category, message, data);

export const logDebug = (category: string, message: string, data?: any) => 
  chatLogger.debug(category, message, data);

export const logTrace = (category: string, message: string, data?: any) => 
  chatLogger.trace(category, message, data);

export default chatLogger;















