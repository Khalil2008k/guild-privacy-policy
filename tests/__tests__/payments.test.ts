/**
 * GUILD Payment System Tests (Beta - Guild Coins)
 * Tests wallet, transactions, and Guild Coins system
 * 
 * NOTE: These tests are for legacy PaymentService
 * Current system uses CoinWalletAPIClient instead
 * Tests disabled pending migration
 */

// Commented out - using CoinWalletAPIClient instead
/*
import { PaymentService } from '../../src/services/paymentService';
import { 
  createMockUser, 
  createMockTransaction, 
  mockApiResponse, 
  mockApiError,
} from '../utils/testHelpers';

describe.skip('Payment System Tests (Guild Coins) - LEGACY', () => {
  let paymentService: PaymentService;

  beforeEach(() => {
    paymentService = new PaymentService();
    jest.clearAllMocks();
  });

  describe('Wallet Management', () => {
    test('should initialize wallet with 300 Guild Coins for new users', async () => {
      global.fetch = jest.fn().mockResolvedValue(
        mockApiResponse({ 
          wallet: {
            balance: 300,
            currency: 'Guild Coins',
          }
        })
      );

      const result = await paymentService.initializeWallet('user-123');

      expect(result.wallet.balance).toBe(300);
      expect(result.wallet.currency).toBe('Guild Coins');
    });

    test('should fetch current wallet balance', async () => {
      global.fetch = jest.fn().mockResolvedValue(
        mockApiResponse({ 
          balance: 250,
          currency: 'Guild Coins',
        })
      );

      const result = await paymentService.getWalletBalance('user-123');

      expect(result.balance).toBe(250);
    });

    test('should show transaction history', async () => {
      const mockTransactions = [
        createMockTransaction({ type: 'credit', amount: 300 }),
        createMockTransaction({ type: 'debit', amount: 50 }),
      ];

      global.fetch = jest.fn().mockResolvedValue(
        mockApiResponse({ transactions: mockTransactions })
      );

      const result = await paymentService.getTransactionHistory('user-123');

      expect(result.transactions).toHaveLength(2);
    });
  });

  describe('Job Payments', () => {
    test('should deduct Guild Coins when posting a job', async () => {
      global.fetch = jest.fn().mockResolvedValue(
        mockApiResponse({ 
          success: true,
          newBalance: 250,
          transaction: createMockTransaction({ amount: 50, type: 'debit' }),
        })
      );

      const result = await paymentService.processJobPayment({
        userId: 'user-123',
        jobId: 'job-123',
        amount: 50,
      });

      expect(result.success).toBe(true);
      expect(result.newBalance).toBe(250);
      expect(result.transaction.type).toBe('debit');
    });

    test('should fail payment if insufficient balance', async () => {
      global.fetch = jest.fn().mockResolvedValue(
        mockApiError('Insufficient balance', 400)
      );

      await expect(
        paymentService.processJobPayment({
          userId: 'user-123',
          jobId: 'job-123',
          amount: 500,
        })
      ).rejects.toThrow('Insufficient balance');
    });

    test('should hold payment until job completion', async () => {
      global.fetch = jest.fn().mockResolvedValue(
        mockApiResponse({ 
          held: true,
          holdAmount: 50,
          releaseDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        })
      );

      const result = await paymentService.holdPayment({
        jobId: 'job-123',
        amount: 50,
      });

      expect(result.held).toBe(true);
      expect(result.holdAmount).toBe(50);
    });

    test('should release payment to worker on job completion', async () => {
      global.fetch = jest.fn().mockResolvedValue(
        mockApiResponse({ 
          released: true,
          recipientId: 'worker-123',
          amount: 50,
        })
      );

      const result = await paymentService.releasePayment('job-123');

      expect(result.released).toBe(true);
      expect(result.amount).toBe(50);
    });

    test('should refund payment on job cancellation', async () => {
      global.fetch = jest.fn().mockResolvedValue(
        mockApiResponse({ 
          refunded: true,
          amount: 50,
          recipientId: 'poster-123',
        })
      );

      const result = await paymentService.refundPayment('job-123');

      expect(result.refunded).toBe(true);
      expect(result.amount).toBe(50);
    });
  });

  describe('Transaction Verification', () => {
    test('should verify transaction exists', async () => {
      const mockTxn = createMockTransaction();

      global.fetch = jest.fn().mockResolvedValue(
        mockApiResponse({ transaction: mockTxn })
      );

      const result = await paymentService.getTransaction('txn-123');

      expect(result.transaction).toBeDefined();
      expect(result.transaction.id).toBe('txn-123');
    });

    test('should validate transaction integrity', async () => {
      global.fetch = jest.fn().mockResolvedValue(
        mockApiResponse({ valid: true, verified: true })
      );

      const result = await paymentService.verifyTransaction('txn-123');

      expect(result.valid).toBe(true);
      expect(result.verified).toBe(true);
    });

    test('should detect fraudulent transactions', async () => {
      global.fetch = jest.fn().mockResolvedValue(
        mockApiError('Transaction flagged as suspicious', 403)
      );

      await expect(
        paymentService.processPayment({ amount: 10000 })
      ).rejects.toThrow('Transaction flagged as suspicious');
    });
  });

  describe('Payment Recovery', () => {
    test('should retry failed payment', async () => {
      global.fetch = jest.fn()
        .mockResolvedValueOnce(mockApiError('Payment failed', 500))
        .mockResolvedValueOnce(mockApiResponse({ success: true }));

      const result = await paymentService.retryPayment('txn-123');

      expect(result.success).toBe(true);
    });

    test('should rollback failed transaction', async () => {
      global.fetch = jest.fn().mockResolvedValue(
        mockApiResponse({ rolledBack: true, refunded: true })
      );

      const result = await paymentService.rollbackTransaction('txn-123');

      expect(result.rolledBack).toBe(true);
      expect(result.refunded).toBe(true);
    });
  });

  describe('Payment Analytics', () => {
    test('should calculate total earnings', async () => {
      global.fetch = jest.fn().mockResolvedValue(
        mockApiResponse({ 
          totalEarnings: 500,
          transactionCount: 10,
        })
      );

      const result = await paymentService.getTotalEarnings('user-123');

      expect(result.totalEarnings).toBe(500);
      expect(result.transactionCount).toBe(10);
    });

    test('should calculate total spending', async () => {
      global.fetch = jest.fn().mockResolvedValue(
        mockApiResponse({ 
          totalSpending: 200,
          transactionCount: 4,
        })
      );

      const result = await paymentService.getTotalSpending('user-123');

      expect(result.totalSpending).toBe(200);
      expect(result.transactionCount).toBe(4);
    });
  });
});
*/ // End of commented legacy PaymentService tests


