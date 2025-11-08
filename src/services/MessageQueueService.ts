/**
 * Message Queue Service
 * Handles offline queue and retry logic for failed messages
 * COMMENT: PRODUCTION HARDENING - Task 3.5 - Offline queue and error handling for message retries
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { logger } from '../utils/logger';
import { chatService } from './firebase/ChatService';

const STORAGE_KEY = '@guild_message_queue';

export interface QueuedMessage {
  id: string;
  chatId: string;
  text: string;
  senderId: string;
  type?: 'TEXT' | 'IMAGE' | 'FILE' | 'VOICE';
  attachments?: string[];
  status: 'pending' | 'retrying' | 'failed';
  retryAttempts: number;
  lastRetryAt?: number;
  createdAt: number;
  failureReason?: string;
  metadata?: Record<string, any>;
}

interface MessageQueueServiceClass {
  queue: QueuedMessage[];
  isOnline: boolean;
  retryInterval: NodeJS.Timeout | null;
  maxRetries: number;
  retryDelays: number[]; // Exponential backoff delays in ms
  networkUnsubscribe: (() => void) | null;
}

class MessageQueueServiceClass {
  queue: QueuedMessage[] = [];
  isOnline: boolean = true;
  retryInterval: NodeJS.Timeout | null = null;
  maxRetries: number = 5;
  retryDelays: number[] = [1000, 2000, 4000, 8000, 16000]; // Exponential backoff
  networkUnsubscribe: (() => void) | null = null;

  constructor() {
    this.setupNetworkListener();
  }

  /**
   * Setup network state listener
   * COMMENT: PRODUCTION HARDENING - Task 3.5 - Monitor network state for offline/online detection
   */
  private setupNetworkListener(): void {
    this.networkUnsubscribe = NetInfo.addEventListener(state => {
      const wasOffline = !this.isOnline;
      this.isOnline = state.isConnected ?? false;

      if (wasOffline && this.isOnline) {
        // Just came online - process queue
        logger.info('📶 Network online - processing message queue');
        this.processQueue();
      } else if (!this.isOnline) {
        // Went offline - stop retry interval
        logger.warn('📶 Network offline - pausing message queue');
        this.stopRetryInterval();
      }
    });

    // Check initial network state
    NetInfo.fetch().then(state => {
      this.isOnline = state.isConnected ?? false;
      if (this.isOnline) {
        this.processQueue();
      }
    });
  }

  /**
   * Initialize queue from AsyncStorage
   * COMMENT: PRODUCTION HARDENING - Task 3.5 - Load persisted queue on app start
   */
  async initialize(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.queue = JSON.parse(stored);
        logger.info(`📦 Loaded ${this.queue.length} queued messages`);
        
        // Process queue if online
        if (this.isOnline) {
          this.processQueue();
        }
      }
    } catch (error) {
      logger.error('Error initializing message queue:', error);
      this.queue = [];
    }
  }

  /**
   * Add message to queue
   * COMMENT: PRODUCTION HARDENING - Task 3.5 - Queue failed messages for retry
   */
  async addToQueue(message: Omit<QueuedMessage, 'id' | 'createdAt' | 'retryAttempts' | 'status'>): Promise<string> {
    const queuedMessage: QueuedMessage = {
      id: `queue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...message,
      status: 'pending',
      retryAttempts: 0,
      createdAt: Date.now(),
    };

    this.queue.push(queuedMessage);
    await this.persistQueue();

    logger.info(`📥 Added message to queue: ${queuedMessage.id} (${this.queue.length} total)`);

    // If online, try to send immediately
    if (this.isOnline) {
      this.processQueue();
    } else {
      // Start retry interval if offline (will retry when online)
      this.startRetryInterval();
    }

    return queuedMessage.id;
  }

  /**
   * Remove message from queue
   * COMMENT: PRODUCTION HARDENING - Task 3.5 - Remove successfully sent messages
   */
  async removeFromQueue(messageId: string): Promise<void> {
    const index = this.queue.findIndex(m => m.id === messageId);
    if (index >= 0) {
      this.queue.splice(index, 1);
      await this.persistQueue();
      logger.info(`✅ Removed message from queue: ${messageId} (${this.queue.length} remaining)`);
    }
  }

  /**
   * Process queue - attempt to send queued messages
   * COMMENT: PRODUCTION HARDENING - Task 3.5 - Process queued messages with retry logic
   */
  async processQueue(): Promise<void> {
    if (!this.isOnline || this.queue.length === 0) {
      return;
    }

    const pendingMessages = this.queue.filter(m => m.status === 'pending' || m.status === 'retrying');
    
    if (pendingMessages.length === 0) {
      this.stopRetryInterval();
      return;
    }

    logger.info(`🔄 Processing ${pendingMessages.length} queued messages`);

    // Process messages with exponential backoff
    for (const queuedMessage of pendingMessages) {
      // Check if enough time has passed since last retry
      if (queuedMessage.lastRetryAt) {
        const delay = this.retryDelays[Math.min(queuedMessage.retryAttempts, this.retryDelays.length - 1)];
        const timeSinceLastRetry = Date.now() - queuedMessage.lastRetryAt;
        if (timeSinceLastRetry < delay) {
          continue; // Skip if not enough time has passed
        }
      }

      // Check max retries
      if (queuedMessage.retryAttempts >= this.maxRetries) {
        queuedMessage.status = 'failed';
        logger.warn(`❌ Message ${queuedMessage.id} exceeded max retries (${this.maxRetries})`);
        await this.persistQueue();
        continue;
      }

      // Attempt to send
      await this.retryMessage(queuedMessage);
    }
  }

  /**
   * Retry sending a queued message
   * COMMENT: PRODUCTION HARDENING - Task 3.5 - Retry failed messages with exponential backoff
   */
  private async retryMessage(queuedMessage: QueuedMessage): Promise<void> {
    try {
      queuedMessage.status = 'retrying';
      queuedMessage.retryAttempts++;
      queuedMessage.lastRetryAt = Date.now();
      await this.persistQueue();

      logger.info(`🔄 Retrying message ${queuedMessage.id} (attempt ${queuedMessage.retryAttempts}/${this.maxRetries})`);

      // Attempt to send message
      const messageId = await chatService.sendMessage(
        queuedMessage.chatId,
        queuedMessage.text,
        queuedMessage.senderId
      );

      // Success - remove from queue
      await this.removeFromQueue(queuedMessage.id);
      logger.info(`✅ Successfully sent queued message: ${queuedMessage.id} -> ${messageId}`);

    } catch (error: any) {
      logger.warn(`❌ Retry failed for message ${queuedMessage.id}:`, error);
      
      queuedMessage.status = 'pending';
      queuedMessage.failureReason = error?.message || 'Unknown error';
      await this.persistQueue();

      // Schedule next retry
      if (queuedMessage.retryAttempts < this.maxRetries) {
        this.startRetryInterval();
      } else {
        logger.error(`❌ Message ${queuedMessage.id} failed after ${this.maxRetries} attempts`);
      }
    }
  }

  /**
   * Manually retry a failed message
   * COMMENT: PRODUCTION HARDENING - Task 3.5 - Manual retry for user-initiated retries
   */
  async retryFailedMessage(messageId: string): Promise<boolean> {
    const message = this.queue.find(m => m.id === messageId);
    if (!message) {
      logger.warn(`Message ${messageId} not found in queue`);
      return false;
    }

    // Reset retry attempts for manual retry
    message.retryAttempts = 0;
    message.status = 'pending';
    message.failureReason = undefined;
    await this.persistQueue();

    // Attempt to send immediately
    await this.retryMessage(message);
    return true;
  }

  /**
   * Get queue status
   * COMMENT: PRODUCTION HARDENING - Task 3.5 - Get queue statistics
   */
  getQueueStatus(): {
    total: number;
    pending: number;
    retrying: number;
    failed: number;
  } {
    return {
      total: this.queue.length,
      pending: this.queue.filter(m => m.status === 'pending').length,
      retrying: this.queue.filter(m => m.status === 'retrying').length,
      failed: this.queue.filter(m => m.status === 'failed').length,
    };
  }

  /**
   * Get failed messages
   * COMMENT: PRODUCTION HARDENING - Task 3.5 - Get list of failed messages for UI
   */
  getFailedMessages(): QueuedMessage[] {
    return this.queue.filter(m => m.status === 'failed');
  }

  /**
   * Start retry interval
   * COMMENT: PRODUCTION HARDENING - Task 3.5 - Periodic retry attempts
   */
  private startRetryInterval(): void {
    if (this.retryInterval) {
      return; // Already running
    }

    // Retry every 30 seconds
    this.retryInterval = setInterval(() => {
      if (this.isOnline && this.queue.length > 0) {
        this.processQueue();
      }
    }, 30000);

    logger.info('🔄 Started retry interval');
  }

  /**
   * Stop retry interval
   * COMMENT: PRODUCTION HARDENING - Task 3.5 - Stop periodic retries
   */
  private stopRetryInterval(): void {
    if (this.retryInterval) {
      clearInterval(this.retryInterval);
      this.retryInterval = null;
      logger.info('🛑 Stopped retry interval');
    }
  }

  /**
   * Persist queue to AsyncStorage
   * COMMENT: PRODUCTION HARDENING - Task 3.5 - Save queue to persistent storage
   */
  private async persistQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      logger.error('Error persisting message queue:', error);
    }
  }

  /**
   * Clear queue
   * COMMENT: PRODUCTION HARDENING - Task 3.5 - Clear all queued messages
   */
  async clearQueue(): Promise<void> {
    this.queue = [];
    await AsyncStorage.removeItem(STORAGE_KEY);
    this.stopRetryInterval();
    logger.info('🗑️ Cleared message queue');
  }

  /**
   * Cleanup - remove old failed messages
   * COMMENT: PRODUCTION HARDENING - Task 3.5 - Clean up old failed messages (older than 7 days)
   */
  async cleanup(): Promise<void> {
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const beforeCount = this.queue.length;
    
    this.queue = this.queue.filter(m => {
      // Keep pending/retrying messages, remove old failed messages
      if (m.status === 'failed' && m.createdAt < sevenDaysAgo) {
        return false;
      }
      return true;
    });

    const removed = beforeCount - this.queue.length;
    if (removed > 0) {
      await this.persistQueue();
      logger.info(`🧹 Cleaned up ${removed} old failed messages`);
    }
  }

  /**
   * Destroy - cleanup resources
   * COMMENT: PRODUCTION HARDENING - Task 3.5 - Cleanup on service destruction
   */
  destroy(): void {
    this.stopRetryInterval();
    if (this.networkUnsubscribe) {
      this.networkUnsubscribe();
      this.networkUnsubscribe = null;
    }
  }
}

// Export singleton instance
export const MessageQueueService = new MessageQueueServiceClass();
export default MessageQueueService;








