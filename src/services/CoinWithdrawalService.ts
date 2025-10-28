/**
 * Coin Withdrawal Service
 * Handles withdrawal requests to the backend
 */

import { BackendAPI } from '../config/backend';

export interface WithdrawalRequest {
  amount: number;
  bankDetails: string;
  note?: string;
}

export interface WithdrawalResponse {
  success: boolean;
  data?: {
    withdrawalId: string;
    status: string;
    estimatedCompletionDate: string;
  };
  error?: string;
}

export class CoinWithdrawalService {
  /**
   * Request a withdrawal
   */
  static async requestWithdrawal(request: WithdrawalRequest): Promise<WithdrawalResponse> {
    try {
      const response = await BackendAPI.post('/coins/withdrawals/request', request);
      return response;
    } catch (error: any) {
      console.error('Error requesting withdrawal:', error);
      throw new Error(error.message || 'Failed to request withdrawal');
    }
  }

  /**
   * Get withdrawal history
   */
  static async getWithdrawals() {
    try {
      const response = await BackendAPI.get('/coins/withdrawals');
      return response;
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
      throw error;
    }
  }

  /**
   * Get withdrawal status
   */
  static async getWithdrawalStatus(withdrawalId: string) {
    try {
      const response = await BackendAPI.get(`/coins/withdrawals/${withdrawalId}`);
      return response;
    } catch (error) {
      console.error('Error fetching withdrawal status:', error);
      throw error;
    }
  }
}

