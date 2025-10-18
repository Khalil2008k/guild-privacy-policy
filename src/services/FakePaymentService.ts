/**
 * Fake Payment Service - For Beta Testing
 * Simulates payment system with fake Guild Coins
 */

import { BackendAPI } from '../config/backend';
import { CustomAlertService } from './CustomAlertService';

export interface FakeWallet {
  userId: string;
  balance: number;
  currency: 'Guild Coins' | 'QR';
  transactions: FakeTransaction[];
  createdAt: Date;
  updatedAt: Date;
}

export interface FakeTransaction {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  jobId?: string;
  status: 'completed' | 'pending' | 'failed';
  createdAt: Date;
  reference?: string;
}

export interface FakePaymentRequest {
  amount: number;
  jobId: string;
  description: string;
  recipientId: string;
}

export interface FakePaymentResponse {
  success: boolean;
  transactionId: string;
  newBalance: number;
  message: string;
}

class FakePaymentService {
  private readonly INITIAL_BALANCE = 300; // 300 Guild Coins for beta users
  private readonly CURRENCY = 'Guild Coins';
  
  /**
   * Initialize fake wallet for new user
   */
  async initializeWallet(userId: string): Promise<FakeWallet> {
    try {
      const wallet: FakeWallet = {
        userId,
        balance: this.INITIAL_BALANCE,
        currency: this.CURRENCY,
        transactions: [{
          id: `welcome_${Date.now()}`,
          type: 'credit',
          amount: this.INITIAL_BALANCE,
          description: 'Welcome Bonus - Beta Testing',
          status: 'completed',
          createdAt: new Date(),
          reference: 'WELCOME_BONUS'
        }],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Store in backend (simulated)
      await this.saveWallet(wallet);
      
      return wallet;
    } catch (error) {
      console.error('Error initializing fake wallet:', error);
      throw new Error('Failed to initialize wallet');
    }
  }

  /**
   * Get user's fake wallet
   */
  async getWallet(userId: string): Promise<FakeWallet | null> {
    try {
      // Try to get from backend first
      const response = await BackendAPI.get(`/fake-payment/wallet/${userId}`);
      if (response.data.success) {
        return response.data.wallet;
      }
      
      // If no wallet exists, create one
      return await this.initializeWallet(userId);
    } catch (error) {
      console.warn('Error getting fake wallet (using offline mode):', error);
      // Return default wallet for offline mode (authentication failed or no backend)
      return {
        userId,
        balance: this.INITIAL_BALANCE,
        currency: this.CURRENCY,
        transactions: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }
  }

  /**
   * Process fake payment
   */
  async processPayment(paymentRequest: FakePaymentRequest): Promise<FakePaymentResponse> {
    try {
      const { amount, jobId, description, recipientId } = paymentRequest;
      
      // Get sender's wallet
      const senderWallet = await this.getWallet(recipientId);
      if (!senderWallet) {
        throw new Error('Sender wallet not found');
      }

      // Check if sender has sufficient balance
      if (senderWallet.balance < amount) {
        return {
          success: false,
          transactionId: '',
          newBalance: senderWallet.balance,
          message: 'Insufficient Guild Coins balance'
        };
      }

      // Create transaction
      const transaction: FakeTransaction = {
        id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'debit',
        amount,
        description,
        jobId,
        status: 'completed',
        createdAt: new Date(),
        reference: `JOB_${jobId}`
      };

      // Update sender's wallet
      senderWallet.balance -= amount;
      senderWallet.transactions.push(transaction);
      senderWallet.updatedAt = new Date();

      // Save updated wallet
      await this.saveWallet(senderWallet);

      // Get recipient's wallet and credit them
      const recipientWallet = await this.getWallet(recipientId);
      if (recipientWallet) {
        const creditTransaction: FakeTransaction = {
          id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'credit',
          amount,
          description: `Payment received for: ${description}`,
          jobId,
          status: 'completed',
          createdAt: new Date(),
          reference: `JOB_${jobId}`
        };

        recipientWallet.balance += amount;
        recipientWallet.transactions.push(creditTransaction);
        recipientWallet.updatedAt = new Date();

        await this.saveWallet(recipientWallet);
      }

      return {
        success: true,
        transactionId: transaction.id,
        newBalance: senderWallet.balance,
        message: `Payment of ${amount} ${this.CURRENCY} processed successfully`
      };

    } catch (error) {
      console.error('Error processing fake payment:', error);
      return {
        success: false,
        transactionId: '',
        newBalance: 0,
        message: 'Payment processing failed'
      };
    }
  }

  /**
   * Award Guild Coins for job completion
   */
  async awardJobCompletion(userId: string, jobId: string, amount: number = 50): Promise<FakePaymentResponse> {
    try {
      const wallet = await this.getWallet(userId);
      if (!wallet) {
        throw new Error('Wallet not found');
      }

      const transaction: FakeTransaction = {
        id: `reward_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'credit',
        amount,
        description: `Job Completion Reward - Job ${jobId}`,
        jobId,
        status: 'completed',
        createdAt: new Date(),
        reference: `JOB_COMPLETION_${jobId}`
      };

      wallet.balance += amount;
      wallet.transactions.push(transaction);
      wallet.updatedAt = new Date();

      await this.saveWallet(wallet);

      return {
        success: true,
        transactionId: transaction.id,
        newBalance: wallet.balance,
        message: `Earned ${amount} ${this.CURRENCY} for job completion!`
      };

    } catch (error) {
      console.error('Error awarding job completion:', error);
      return {
        success: false,
        transactionId: '',
        newBalance: 0,
        message: 'Failed to award job completion'
      };
    }
  }

  /**
   * Deduct Guild Coins for job posting
   */
  async deductJobPosting(userId: string, jobId: string, amount: number = 25): Promise<FakePaymentResponse> {
    try {
      const wallet = await this.getWallet(userId);
      if (!wallet) {
        throw new Error('Wallet not found');
      }

      if (wallet.balance < amount) {
        return {
          success: false,
          transactionId: '',
          newBalance: wallet.balance,
          message: 'Insufficient Guild Coins to post job'
        };
      }

      const transaction: FakeTransaction = {
        id: `posting_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'debit',
        amount,
        description: `Job Posting Fee - Job ${jobId}`,
        jobId,
        status: 'completed',
        createdAt: new Date(),
        reference: `JOB_POSTING_${jobId}`
      };

      wallet.balance -= amount;
      wallet.transactions.push(transaction);
      wallet.updatedAt = new Date();

      await this.saveWallet(wallet);

      return {
        success: true,
        transactionId: transaction.id,
        newBalance: wallet.balance,
        message: `Job posted successfully! ${amount} ${this.CURRENCY} deducted.`
      };

    } catch (error) {
      console.error('Error deducting job posting fee:', error);
      return {
        success: false,
        transactionId: '',
        newBalance: 0,
        message: 'Failed to process job posting fee'
      };
    }
  }

  /**
   * Get transaction history
   */
  async getTransactionHistory(userId: string, limit: number = 50): Promise<FakeTransaction[]> {
    try {
      const wallet = await this.getWallet(userId);
      if (!wallet) {
        return [];
      }

      return wallet.transactions
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, limit);
    } catch (error) {
      console.error('Error getting transaction history:', error);
      return [];
    }
  }

  /**
   * Save wallet to backend
   */
  private async saveWallet(wallet: FakeWallet): Promise<void> {
    try {
      await BackendAPI.post('/fake-payment/wallet', wallet);
    } catch (error) {
      console.error('Error saving wallet to backend:', error);
      // Continue without throwing - this is for offline mode
    }
  }

  /**
   * Format balance for display
   */
  formatBalance(balance: number): string {
    return `${balance.toLocaleString()} ${this.CURRENCY}`;
  }

  /**
   * Get balance display with icon
   */
  getBalanceDisplay(balance: number): string {
    return `🪙 ${this.formatBalance(balance)}`;
  }
}

export const fakePaymentService = new FakePaymentService();


