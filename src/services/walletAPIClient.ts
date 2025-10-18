/**
 * 🏦 ENTERPRISE WALLET API CLIENT
 * 
 * Type-safe, production-grade API client for wallet operations
 * 
 * Features:
 * - Axios-based HTTP client with interceptors
 * - Automatic JWT token injection
 * - Error handling with retry logic
 * - Request/response type safety
 * - Real-time balance updates
 * - Receipt verification
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import { auth } from '../config/firebase';
import { config } from '../config/environment';

// Use environment config for API base URL (includes /api/v1)
const API_BASE_URL = config.apiUrl;

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface WalletBalance {
  userId: string;
  guildId: string;
  govId: string;
  fullName: string;
  available: number;
  hold: number;
  released: number;
  totalReceived: number;
  totalWithdrawn: number;
  currency: string;
  createdAt: any;
  updatedAt: any;
}

export interface Transaction {
  id: string;
  userId: string;
  guildId: string;
  fullName: string;
  govId?: string;
  type: 'PSP_TOPUP' | 'ESCROW_HOLD' | 'ESCROW_RELEASE' | 'WITHDRAWAL' | 'FEE' | 'REFUND';
  amount: number;
  currency: string;
  status: 'SUCCESS' | 'PENDING' | 'FAILED' | 'DISPUTED';
  fromAccount?: string;
  toAccount?: string;
  pspTransactionId?: string;
  pspSessionId?: string;
  description: string;
  notes?: string;
  receiptNumber?: string;
  createdAt: any;
}

export interface Receipt {
  id: string;
  receiptNumber: string;
  transactionId: string;
  userId: string;
  guildId: string;
  fullName: string;
  govId?: string;
  amount: number;
  currency: string;
  type: string;
  status: string;
  fees?: {
    platform: number;
    escrow: number;
    zakat: number;
    total: number;
  };
  digitalSignature: string;
  issuedBy: string;
  issuedAt: any;
  createdAt: any;
}

interface APIResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

// ============================================================================
// AXIOS INSTANCE WITH INTERCEPTORS
// ============================================================================

class WalletAPIClient {
  private client: AxiosInstance;
  
  constructor() {
    this.client = axios.create({
      baseURL: `${API_BASE_URL}/wallet`, // API_BASE_URL already includes /api/v1
      validateStatus: (status) => status < 500, // Don't reject on 4xx errors
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    // Request interceptor: Add JWT token
    this.client.interceptors.request.use(
      async (config) => {
        try {
          const currentUser = auth.currentUser;
          if (currentUser) {
            const token = await currentUser.getIdToken();
            config.headers.Authorization = `Bearer ${token}`;
          }
        } catch (error) {
          console.error('Failed to get auth token:', error);
        }
        return config;
      },
      (error) => Promise.reject(error)
    );
    
    // Response interceptor: Handle errors
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Token expired or user not authenticated
          const currentUser = auth.currentUser;
          
          if (!currentUser) {
            // User not logged in - this is expected, don't log as error
            console.log('[WalletAPI] 401: User not authenticated - login required');
            return Promise.reject(new Error('Authentication required. Please sign in.'));
          }
          
          try {
            // Try to refresh token
            await currentUser.getIdToken(true); // Force refresh
            // Retry original request with new token
            if (error.config) {
              return this.client.request(error.config);
            }
          } catch (refreshError) {
            console.warn('[WalletAPI] Token refresh failed, user may need to re-authenticate');
            return Promise.reject(new Error('Session expired. Please sign in again.'));
          }
        }
        return Promise.reject(error);
      }
    );
  }
  
  // ==========================================================================
  // WALLET BALANCE
  // ==========================================================================
  
  /**
   * Get user's wallet balance
   * Real-time: Available | Hold | Released
   */
  async getBalance(userId: string): Promise<WalletBalance> {
    try {
      // Check if user is authenticated
      if (!auth.currentUser) {
        throw new Error('User not authenticated');
      }
      
      const response = await this.client.get<APIResponse<{ wallet: WalletBalance }>>(
        `/${userId}`
      );
      
      // Handle 401 gracefully
      if (response.status === 401) {
        throw new Error('Access denied. Authentication required.');
      }
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to get wallet balance');
      }
      
      return response.data.data.wallet;
    } catch (error: any) {
      // Don't log 401 errors as they're expected when not logged in
      if (error.message?.includes('Authentication required') || error.message?.includes('Access denied')) {
        console.log('[WalletAPI] User authentication required for balance fetch');
      } else {
        console.error('[WalletAPI] Error fetching wallet balance:', error);
      }
      throw this.handleError(error);
    }
  }
  
  // ==========================================================================
  // TRANSACTIONS
  // ==========================================================================
  
  /**
   * Get transaction history with filters
   */
  async getTransactions(options?: {
    type?: string;
    status?: string;
    limit?: number;
    startDate?: Date;
    endDate?: Date;
  }): Promise<Transaction[]> {
    try {
      const params: any = {};
      
      if (options?.type) params.type = options.type;
      if (options?.status) params.status = options.status;
      if (options?.limit) params.limit = options.limit;
      if (options?.startDate) params.startDate = options.startDate.toISOString();
      if (options?.endDate) params.endDate = options.endDate.toISOString();
      
      const response = await this.client.get<APIResponse<{ transactions: Transaction[]; count: number }>>(
        '/transactions',
        { params }
      );
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to get transactions');
      }
      
      return response.data.data.transactions;
    } catch (error) {
      console.error('Error fetching transactions:', error);
      throw this.handleError(error);
    }
  }
  
  // ==========================================================================
  // RECEIPTS
  // ==========================================================================
  
  /**
   * Get all receipts for user
   */
  async getReceipts(limit?: number): Promise<Receipt[]> {
    try {
      const params = limit ? { limit } : {};
      
      const response = await this.client.get<APIResponse<{ receipts: Receipt[]; count: number }>>(
        '/receipts',
        { params }
      );
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to get receipts');
      }
      
      return response.data.data.receipts;
    } catch (error) {
      console.error('Error fetching receipts:', error);
      throw this.handleError(error);
    }
  }
  
  /**
   * Get specific receipt by transaction ID
   */
  async getReceipt(transactionId: string): Promise<Receipt> {
    try {
      const response = await this.client.get<APIResponse<{ receipt: Receipt }>>(
        `/receipt/${transactionId}`
      );
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to get receipt');
      }
      
      return response.data.data.receipt;
    } catch (error) {
      console.error('Error fetching receipt:', error);
      throw this.handleError(error);
    }
  }
  
  /**
   * Verify receipt authenticity
   */
  async verifyReceipt(receiptNumber: string, digitalSignature: string): Promise<{
    receiptNumber: string;
    isValid: boolean;
    verified: boolean;
    message: string;
  }> {
    try {
      const response = await this.client.post<APIResponse<any>>(
        `/receipt/${receiptNumber}/verify`,
        { digitalSignature }
      );
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to verify receipt');
      }
      
      return response.data.data;
    } catch (error) {
      console.error('Error verifying receipt:', error);
      throw this.handleError(error);
    }
  }
  
  // ==========================================================================
  // WITHDRAWAL
  // ==========================================================================
  
  /**
   * Request withdrawal to external bank
   */
  async requestWithdrawal(amount: number, bankAccountId?: string): Promise<{
    success: boolean;
    transactionId: string;
    status: string;
    message: string;
  }> {
    try {
      const response = await this.client.post<APIResponse<any>>(
        '/withdraw',
        { amount, bankAccountId }
      );
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to request withdrawal');
      }
      
      return response.data.data;
    } catch (error) {
      console.error('Error requesting withdrawal:', error);
      throw this.handleError(error);
    }
  }
  
  // ==========================================================================
  // ERROR HANDLING
  // ==========================================================================
  
  private handleError(error: any): Error {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<any>;
      
      if (axiosError.response) {
        // Server responded with error
        return new Error(
          axiosError.response.data?.error || 
          axiosError.response.statusText || 
          'Server error'
        );
      } else if (axiosError.request) {
        // Request made but no response
        return new Error('Network error: No response from server');
      }
    }
    
    return error instanceof Error ? error : new Error('Unknown error occurred');
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const walletAPIClient = new WalletAPIClient();

