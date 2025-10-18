import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';

export interface Transaction {
  id?: string;
  userId: string;
  type: 'earning' | 'withdrawal' | 'bonus' | 'fee';
  title: string;
  description?: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  date: Date | Timestamp;
  relatedJobId?: string;
  relatedGuildId?: string;
  paymentMethod?: string;
  createdAt?: Date | Timestamp;
  updatedAt?: Date | Timestamp;
}

export interface WalletBalance {
  userId: string;
  balance: number;
  currency: string;
  pendingEarnings: number;
  totalEarned: number;
  totalWithdrawn: number;
  lastUpdated: Date | Timestamp;
}

class TransactionService {
  private transactionsCollection = 'transactions';
  private walletsCollection = 'wallets';

  async getUserTransactions(userId: string, limitCount: number = 20): Promise<Transaction[]> {
    try {
      const transactionsRef = collection(db, this.transactionsCollection);
      const q = query(
        transactionsRef,
        where('userId', '==', userId),
        orderBy('date', 'desc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate?.() || doc.data().date,
        createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
        updatedAt: doc.data().updatedAt?.toDate?.() || doc.data().updatedAt,
      } as Transaction));
    } catch (error) {
      console.error('Error fetching transactions:', error);
      return [];
    }
  }

  async getWalletBalance(userId: string): Promise<WalletBalance | null> {
    try {
      const walletDoc = await getDoc(doc(db, this.walletsCollection, userId));
      
      if (!walletDoc.exists()) {
        // Create initial wallet for new user
        const initialWallet: WalletBalance = {
          userId,
          balance: 0,
          currency: 'QAR',
          pendingEarnings: 0,
          totalEarned: 0,
          totalWithdrawn: 0,
          lastUpdated: serverTimestamp() as Timestamp
        };
        
        await updateDoc(doc(db, this.walletsCollection, userId), initialWallet);
        return initialWallet;
      }

      const data = walletDoc.data();
      return {
        ...data,
        lastUpdated: data.lastUpdated?.toDate?.() || data.lastUpdated,
      } as WalletBalance;
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
      return null;
    }
  }

  async createTransaction(transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<string | null> {
    try {
      const transactionsRef = collection(db, this.transactionsCollection);
      const newTransaction = {
        ...transaction,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(transactionsRef, newTransaction);

      // Update wallet balance if transaction is completed
      if (transaction.status === 'completed') {
        await this.updateWalletBalance(transaction.userId, transaction.amount, transaction.type);
      }

      return docRef.id;
    } catch (error) {
      console.error('Error creating transaction:', error);
      return null;
    }
  }

  async updateTransactionStatus(transactionId: string, status: Transaction['status']): Promise<boolean> {
    try {
      const transactionRef = doc(db, this.transactionsCollection, transactionId);
      const transactionDoc = await getDoc(transactionRef);
      
      if (!transactionDoc.exists()) {
        console.error('Transaction not found');
        return false;
      }

      const transaction = transactionDoc.data() as Transaction;
      const oldStatus = transaction.status;

      await updateDoc(transactionRef, {
        status,
        updatedAt: serverTimestamp(),
      });

      // Update wallet balance if status changed to completed
      if (oldStatus !== 'completed' && status === 'completed') {
        await this.updateWalletBalance(transaction.userId, transaction.amount, transaction.type);
      }

      return true;
    } catch (error) {
      console.error('Error updating transaction status:', error);
      return false;
    }
  }

  private async updateWalletBalance(userId: string, amount: number, type: Transaction['type']): Promise<void> {
    try {
      const walletRef = doc(db, this.walletsCollection, userId);
      const walletDoc = await getDoc(walletRef);
      
      const currentData = walletDoc.exists() ? walletDoc.data() as WalletBalance : {
        userId,
        balance: 0,
        currency: 'QAR',
        pendingEarnings: 0,
        totalEarned: 0,
        totalWithdrawn: 0,
      };

      let updates: Partial<WalletBalance> = {
        lastUpdated: serverTimestamp() as Timestamp,
      };

      switch (type) {
        case 'earning':
        case 'bonus':
          updates.balance = currentData.balance + amount;
          updates.totalEarned = currentData.totalEarned + amount;
          break;
        case 'withdrawal':
          updates.balance = currentData.balance - Math.abs(amount);
          updates.totalWithdrawn = currentData.totalWithdrawn + Math.abs(amount);
          break;
        case 'fee':
          updates.balance = currentData.balance - Math.abs(amount);
          break;
      }

      if (walletDoc.exists()) {
        await updateDoc(walletRef, updates);
      } else {
        await updateDoc(walletRef, { ...currentData, ...updates });
      }
    } catch (error) {
      console.error('Error updating wallet balance:', error);
    }
  }

  async requestWithdrawal(userId: string, amount: number, paymentMethod: string): Promise<string | null> {
    try {
      // Check if user has sufficient balance
      const wallet = await this.getWalletBalance(userId);
      if (!wallet || wallet.balance < amount) {
        throw new Error('Insufficient balance');
      }

      // Create withdrawal transaction
      const transactionId = await this.createTransaction({
        userId,
        type: 'withdrawal',
        title: 'Withdrawal Request',
        description: `Withdrawal to ${paymentMethod}`,
        amount: -amount,
        currency: wallet.currency,
        status: 'pending',
        date: serverTimestamp() as Timestamp,
        paymentMethod,
      });

      return transactionId;
    } catch (error) {
      console.error('Error requesting withdrawal:', error);
      return null;
    }
  }

  async getTransactionsByJob(jobId: string): Promise<Transaction[]> {
    try {
      const transactionsRef = collection(db, this.transactionsCollection);
      const q = query(
        transactionsRef,
        where('relatedJobId', '==', jobId),
        orderBy('date', 'desc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate?.() || doc.data().date,
      } as Transaction));
    } catch (error) {
      console.error('Error fetching job transactions:', error);
      return [];
    }
  }
}

export const transactionService = new TransactionService();




