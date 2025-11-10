/**
 * COMMENT: PRODUCTION HARDENING - Task 3.2 - Socket.IO removed from production
 * Socket.IO Service - DEPRECATED
 * 
 * This service is no longer used in production. Chat system now uses Firestore onSnapshot
 * for real-time messaging. This file is kept for reference only.
 * 
 * @deprecated Use Firestore onSnapshot via chatService.listenToMessages() instead
 */

/*
/**
 * Socket.IO Service - Production-grade real-time communication
 * Following 2025 best practices for React Native Socket.IO implementation
 * 
 * Features:
 * - Auto-reconnection with exponential backoff
 * - Connection state management
 * - Event queuing for offline support
 * - Type-safe event handling
 * - Token refresh on reconnect
 * - Network state monitoring
 * 
 * COMMENT: PRODUCTION HARDENING - Task 3.2 - Socket.IO removed from production
 * @deprecated Use Firestore onSnapshot instead
 */

import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { secureStorage } from './secureStorage'; // ✅ ADDED: Task 6
import { config } from '../config/environment';
import { maybeConnectSocket, disconnectSocketSafely } from './socket';
// COMMENT: PRIORITY 1 - Replace console statements with logger (deprecated service but still has active code)
import { logger } from '../utils/logger';

// Event types for type safety
export interface SocketEvents {
  // Connection events
  'connection:success': (data: { userId: string; socketId: string; serverTime: Date }) => void;
  'error': (error: { message: string }) => void;
  
  // Chat events
  'chat:message:new': (data: any) => void;
  'chat:message:sent': (data: any) => void;
  'chat:message:optimistic': (data: any) => void;
  'chat:message:delivered': (data: any) => void;
  'chat:message:read': (data: any) => void;
  'chat:typing:update': (data: { chatId: string; userId: string; isTyping: boolean }) => void;
  'chat:user:joined': (data: any) => void;
  'chat:user:left': (data: any) => void;
  'chat:messages:history': (data: any) => void;
  'chat:error': (error: any) => void;
  
  // Call events
  'chat:call:incoming': (data: any) => void;
  'chat:call:initiated': (data: any) => void;
  'chat:call:participant:joined': (data: any) => void;
  'chat:call:rejected': (data: any) => void;
  'chat:call:ended': (data: any) => void;
  
  // Notification events
  'notification:new': (data: any) => void;
  'notification:batch': (data: any) => void;
  'notification:count': (data: { count: number }) => void;
  
  // User status events
  'user:status': (data: { userId: string; status: string; lastSeen?: Date }) => void;
  'user:status:response': (data: Record<string, any>) => void;
  
  // Guild events
  'guild:member:online': (data: any) => void;
  'guild:announcement': (data: any) => void;
}

export type SocketEventName = keyof SocketEvents;

class SocketService {
  private socket: Socket | null = null;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 10;
  private reconnectDelay: number = 1000;
  private eventQueue: Array<{ event: string; data: any }> = [];
  private listeners: Map<string, Set<Function>> = new Map();
  private networkUnsubscribe: (() => void) | null = null;

  constructor() {
    this.setupNetworkListener();
  }

  /**
   * Initialize socket connection (with strict auth token requirement) - SAFE VERSION
   */
  async connect(): Promise<void> {
    try {
      // Use safe socket connection that only connects with valid token
      this.socket = await maybeConnectSocket();
      
      if (this.socket) {
        this.setupEventHandlers();
        logger.debug('✅ Socket connection initiated with authenticated token');
      } else {
        logger.debug('Socket connection skipped (no token/offline)');
      }
    } catch (error) {
      logger.error('❌ Socket connection error:', error);
    }
  }

  /**
   * Setup core event handlers
   */
  private setupEventHandlers(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      logger.debug('Socket connected:', this.socket?.id);
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.processEventQueue();
      this.emit('connected', { socketId: this.socket?.id });
    });

    this.socket.on('disconnect', (reason) => {
      logger.debug('Socket disconnected:', reason);
      this.isConnected = false;
      this.emit('disconnected', { reason });
    });

    this.socket.on('connect_error', (error) => {
      logger.error('Socket connection error:', error.message);
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        this.emit('max_reconnect_attempts_reached', {});
      }
    });

    // Handle token refresh
    this.socket.on('connect', async () => {
      // ✅ FIXED: Use secureStorage instead of AsyncStorage (Task 6)
      const newToken = await secureStorage.getItem('auth_token');
      if (newToken && this.socket) {
        this.socket.auth = { token: newToken };
      }
    });

    // Setup typed event listeners
    this.setupTypedEventListeners();
  }

  /**
   * Setup typed event listeners for all socket events
   */
  private setupTypedEventListeners(): void {
    if (!this.socket) return;

    // Connection success
    this.socket.on('connection:success', (data) => {
      this.emit('connection:success', data);
    });

    // Error handling
    this.socket.on('error', (error) => {
      logger.error('Socket error:', error);
      this.emit('error', error);
    });

    // Chat events
    this.socket.on('chat:message:new', (data) => {
      this.emit('chat:message:new', data);
    });

    this.socket.on('chat:message:sent', (data) => {
      this.emit('chat:message:sent', data);
    });

    this.socket.on('chat:typing:update', (data) => {
      this.emit('chat:typing:update', data);
    });

    // Notification events
    this.socket.on('notification:new', (data) => {
      this.emit('notification:new', data);
    });

    this.socket.on('notification:count', (data) => {
      this.emit('notification:count', data);
    });

    // User status events
    this.socket.on('user:status', (data) => {
      this.emit('user:status', data);
    });
  }

  /**
   * Setup network state listener
   */
  private setupNetworkListener(): void {
    this.networkUnsubscribe = NetInfo.addEventListener(state => {
      if (state.isConnected && !this.isConnected && this.socket) {
        logger.debug('Network reconnected, attempting socket reconnection');
        this.socket.connect();
      }
    });
  }

  /**
   * Emit event with queuing support
   */
  emit(event: string, data: any): void {
    if (this.isConnected && this.socket) {
      this.socket.emit(event, data);
    } else {
      // Queue event for later
      this.eventQueue.push({ event, data });
      logger.debug(`Event queued: ${event}`);
    }
  }

  /**
   * Type-safe event emission
   */
  emitTyped<K extends SocketEventName>(
    event: K,
    ...args: Parameters<SocketEvents[K]>
  ): void {
    this.emit(event, ...args);
  }

  /**
   * Listen to events with type safety
   */
  on<K extends SocketEventName>(
    event: K,
    callback: SocketEvents[K]
  ): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    
    this.listeners.get(event)?.add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  /**
   * Internal event emitter
   */
  private emit(event: string, data: any): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          logger.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Process queued events
   */
  private processEventQueue(): void {
    if (!this.isConnected || !this.socket) return;

    logger.debug(`Processing ${this.eventQueue.length} queued events`);
    
    while (this.eventQueue.length > 0) {
      const { event, data } = this.eventQueue.shift()!;
      this.socket.emit(event, data);
    }
  }

  /**
   * Join a chat room
   */
  joinChat(chatId: string): void {
    this.emit('chat:join', { chatId });
  }

  /**
   * Leave a chat room
   */
  leaveChat(chatId: string): void {
    this.emit('chat:leave', { chatId });
  }

  /**
   * Send a message
   */
  sendMessage(chatId: string, message: {
    text: string;
    type?: 'TEXT' | 'IMAGE' | 'FILE' | 'VOICE';
    attachments?: string[];
  }): void {
    this.emit('chat:message:send', { chatId, message });
  }

  /**
   * Start typing indicator
   */
  startTyping(chatId: string): void {
    this.emit('chat:typing:start', { chatId });
  }

  /**
   * Stop typing indicator
   */
  stopTyping(chatId: string): void {
    this.emit('chat:typing:stop', { chatId });
  }

  /**
   * Mark messages as read
   */
  markMessagesAsRead(chatId: string): void {
    this.emit('chat:message:read', { chatId });
  }

  /**
   * Update user status
   */
  updateUserStatus(status: 'online' | 'away' | 'busy'): void {
    this.emit('user:status:update', { status });
  }

  /**
   * Get user statuses
   */
  getUserStatuses(userIds: string[]): void {
    this.emit('user:status:get', { userIds });
  }

  /**
   * Join guild room
   */
  joinGuild(guildId: string): void {
    this.emit('guild:join', { guildId });
  }

  /**
   * Subscribe to job updates
   */
  subscribeToJob(jobId: string): void {
    this.emit('job:subscribe', { jobId });
  }

  /**
   * Initiate voice call
   */
  initiateCall(chatId: string, recipientId: string): void {
    this.emit('chat:call:initiate', { chatId, recipientId });
  }

  /**
   * Accept voice call
   */
  acceptCall(roomId: string): void {
    this.emit('chat:call:accept', { roomId });
  }

  /**
   * Reject voice call
   */
  rejectCall(roomId: string): void {
    this.emit('chat:call:reject', { roomId });
  }

  /**
   * End voice call
   */
  endCall(roomId: string): void {
    this.emit('chat:call:end', { roomId });
  }

  /**
   * Get connection status
   */
  isSocketConnected(): boolean {
    return this.isConnected;
  }

  /**
   * Disconnect socket safely
   */
  disconnect(): void {
    // Use safe disconnect method
    disconnectSocketSafely(this.socket);
    this.socket = null;
    
    if (this.networkUnsubscribe) {
      this.networkUnsubscribe();
      this.networkUnsubscribe = null;
    }

    this.isConnected = false;
    this.listeners.clear();
    this.eventQueue = [];
  }

  /**
   * Reconnect socket
   */
  async reconnect(): Promise<void> {
    this.disconnect();
    await this.connect();
  }

  /**
   * Send heartbeat
   */
  ping(): void {
    if (this.isConnected && this.socket) {
      this.socket.emit('ping');
    }
  }
}

// Export singleton instance
// COMMENT: PRODUCTION HARDENING - Task 3.2 - Socket.IO removed from production
/*
export const socketService = new SocketService();

// Export types
export type { SocketEvents, SocketEventName };
*/

// Export placeholder to maintain compatibility
export const socketService = {
  connect: async () => {},
  disconnect: () => {},
  on: () => {},
  off: () => {},
  emit: () => {},
  sendMessage: () => {},
  markMessagesAsRead: () => {},
  joinChat: () => {},
  leaveChat: () => {},
  startTyping: () => {},
  stopTyping: () => {},
  initiateCall: () => {},
  acceptCall: () => {},
  rejectCall: () => {},
  endCall: () => {},
};

// Export placeholder types
export type SocketEvents = Record<string, any>;
export type SocketEventName = string;

