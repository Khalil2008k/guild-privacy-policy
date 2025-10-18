/**
 * Demo Mode Sync Service - Admin Portal
 * Real-time synchronization with backend demo mode service
 * Uses WebSocket for instant updates
 */

import { io, Socket } from 'socket.io-client';

interface DemoModeStatus {
  isEnabled: boolean;
  config: any;
  stats: any;
  timestamp: Date;
}

interface DemoTransaction {
  id: string;
  type: string;
  amount: number;
  status: string;
  timestamp: Date;
}

type StatusCallback = (status: DemoModeStatus) => void;
type TransactionCallback = (transaction: DemoTransaction) => void;
type ErrorCallback = (error: any) => void;

class DemoModeSyncService {
  private static instance: DemoModeSyncService;
  private socket: Socket | null = null;
  private isConnected: boolean = false;
  private statusCallbacks: Set<StatusCallback> = new Set();
  private transactionCallbacks: Set<TransactionCallback> = new Set();
  private errorCallbacks: Set<ErrorCallback> = new Set();

  private constructor() {
    // Private constructor for singleton
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): DemoModeSyncService {
    if (!DemoModeSyncService.instance) {
      DemoModeSyncService.instance = new DemoModeSyncService();
    }
    return DemoModeSyncService.instance;
  }

  /**
   * Connect to backend WebSocket
   */
  public connect(): void {
    if (this.socket && this.isConnected) {
      console.log('🔌 Already connected to demo mode sync');
      return;
    }

    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
      
      console.log('🔌 Connecting to demo mode sync...');

      this.socket = io(backendUrl, {
        path: '/demo-mode-socket',
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: Infinity
      });

      // Connection established
      this.socket.on('connect', () => {
        console.log('✅ Connected to demo mode sync');
        this.isConnected = true;
        
        // Request current status
        this.requestStatus();
      });

      // Connection error
      this.socket.on('connect_error', (error) => {
        console.error('❌ Demo mode sync connection error:', error);
        this.isConnected = false;
        this.notifyError(error);
      });

      // Disconnected
      this.socket.on('disconnect', (reason) => {
        console.warn('⚠️ Disconnected from demo mode sync:', reason);
        this.isConnected = false;
      });

      // Reconnecting
      this.socket.on('reconnecting', (attemptNumber) => {
        console.log(`🔄 Reconnecting to demo mode sync (attempt ${attemptNumber})...`);
      });

      // Reconnected
      this.socket.on('reconnect', (attemptNumber) => {
        console.log(`✅ Reconnected to demo mode sync (after ${attemptNumber} attempts)`);
        this.isConnected = true;
        this.requestStatus();
      });

      // Receive demo mode status
      this.socket.on('demo-mode-status', (data: DemoModeStatus) => {
        console.log('📊 Received demo mode status:', data.isEnabled ? 'ENABLED' : 'DISABLED');
        this.notifyStatusUpdate(data);
      });

      // Receive transaction update
      this.socket.on('demo-transaction-update', (data: { transaction: DemoTransaction }) => {
        console.log('💳 Received transaction update:', data.transaction.id);
        this.notifyTransactionUpdate(data.transaction);
      });

      // Receive demo data cleared
      this.socket.on('demo-data-cleared', () => {
        console.log('🗑️ Demo data cleared');
        this.requestStatus();
      });

      // Receive error
      this.socket.on('error', (error: any) => {
        console.error('❌ Demo mode sync error:', error);
        this.notifyError(error);
      });

    } catch (error) {
      console.error('Failed to connect to demo mode sync:', error);
      this.notifyError(error);
    }
  }

  /**
   * Disconnect from backend WebSocket
   */
  public disconnect(): void {
    if (this.socket) {
      console.log('🔌 Disconnecting from demo mode sync...');
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  /**
   * Request current demo mode status
   */
  public requestStatus(): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('request-status');
    }
  }

  /**
   * Toggle demo mode (notify backend)
   */
  public toggleDemoMode(enabled: boolean, adminId: string): void {
    if (this.socket && this.isConnected) {
      console.log(`🔄 Toggling demo mode: ${enabled ? 'ENABLE' : 'DISABLE'}`);
      this.socket.emit('toggle-demo-mode', { enabled, adminId });
    } else {
      console.warn('⚠️ Cannot toggle demo mode: not connected to sync service');
    }
  }

  /**
   * Subscribe to status updates
   */
  public onStatusUpdate(callback: StatusCallback): () => void {
    this.statusCallbacks.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.statusCallbacks.delete(callback);
    };
  }

  /**
   * Subscribe to transaction updates
   */
  public onTransactionUpdate(callback: TransactionCallback): () => void {
    this.transactionCallbacks.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.transactionCallbacks.delete(callback);
    };
  }

  /**
   * Subscribe to errors
   */
  public onError(callback: ErrorCallback): () => void {
    this.errorCallbacks.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.errorCallbacks.delete(callback);
    };
  }

  /**
   * Notify all status update callbacks
   */
  private notifyStatusUpdate(status: DemoModeStatus): void {
    this.statusCallbacks.forEach(callback => {
      try {
        callback(status);
      } catch (error) {
        console.error('Error in status update callback:', error);
      }
    });
  }

  /**
   * Notify all transaction update callbacks
   */
  private notifyTransactionUpdate(transaction: DemoTransaction): void {
    this.transactionCallbacks.forEach(callback => {
      try {
        callback(transaction);
      } catch (error) {
        console.error('Error in transaction update callback:', error);
      }
    });
  }

  /**
   * Notify all error callbacks
   */
  private notifyError(error: any): void {
    this.errorCallbacks.forEach(callback => {
      try {
        callback(error);
      } catch (error) {
        console.error('Error in error callback:', error);
      }
    });
  }

  /**
   * Check if connected
   */
  public getIsConnected(): boolean {
    return this.isConnected;
  }
}

// Export singleton instance
export const demoModeSyncService = DemoModeSyncService.getInstance();
export default demoModeSyncService;

