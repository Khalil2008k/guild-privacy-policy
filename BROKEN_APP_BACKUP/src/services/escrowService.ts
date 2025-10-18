import { collection, addDoc, updateDoc, doc, getDoc, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';

export interface Escrow {
  id: string;
  jobId: string;
  offerId: string;
  clientId: string;
  freelancerId: string;
  amount: number;
  status: 'Pending' | 'Funded' | 'Released' | 'Refunded' | 'Disputed';
  createdAt: string;
  updatedAt: string;
  releaseDate?: string;
  disputeReason?: string;
}

export interface CreateEscrowData {
  jobId: string;
  offerId: string;
  clientId: string;
  freelancerId: string;
  amount: number;
}

export class EscrowService {
  private static collectionName = 'escrows';

  static async createEscrow(escrowData: CreateEscrowData): Promise<string> {
    try {
      const now = new Date().toISOString();
      
      const escrowDoc = {
        ...escrowData,
        status: 'Pending' as const,
        createdAt: now,
        updatedAt: now,
      };

      const docRef = await addDoc(collection(db, this.collectionName), escrowDoc);
      console.log('Escrow created successfully with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error creating escrow:', error);
      throw error;
    }
  }

  static async fundEscrow(escrowId: string): Promise<void> {
    try {
      const escrowRef = doc(db, this.collectionName, escrowId);
      await updateDoc(escrowRef, {
        status: 'Funded',
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error funding escrow:', error);
      throw error;
    }
  }

  static async releaseEscrow(escrowId: string): Promise<void> {
    try {
      const escrowRef = doc(db, this.collectionName, escrowId);
      await updateDoc(escrowRef, {
        status: 'Released',
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error releasing escrow:', error);
      throw error;
    }
  }

  static async refundEscrow(escrowId: string): Promise<void> {
    try {
      const escrowRef = doc(db, this.collectionName, escrowId);
      await updateDoc(escrowRef, {
        status: 'Refunded',
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error refunding escrow:', error);
      throw error;
    }
  }

  static async disputeEscrow(escrowId: string, reason: string): Promise<void> {
    try {
      const escrowRef = doc(db, this.collectionName, escrowId);
      await updateDoc(escrowRef, {
        status: 'Disputed',
        disputeReason: reason,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error disputing escrow:', error);
      throw error;
    }
  }

  static async getEscrowById(escrowId: string): Promise<Escrow | null> {
    try {
      const escrowRef = doc(db, this.collectionName, escrowId);
      const escrowDoc = await getDoc(escrowRef);
      
      if (escrowDoc.exists()) {
        return {
          id: escrowDoc.id,
          ...escrowDoc.data(),
        } as Escrow;
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching escrow by ID:', error);
      throw error;
    }
  }

  static async getEscrowsByJob(jobId: string): Promise<Escrow[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('jobId', '==', jobId),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const escrows: Escrow[] = [];

      querySnapshot.forEach((doc) => {
        escrows.push({
          id: doc.id,
          ...doc.data(),
        } as Escrow);
      });

      return escrows;
    } catch (error) {
      console.error('Error fetching escrows by job:', error);
      throw error;
    }
  }

  static async getEscrowsByClient(clientId: string): Promise<Escrow[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('clientId', '==', clientId),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const escrows: Escrow[] = [];

      querySnapshot.forEach((doc) => {
        escrows.push({
          id: doc.id,
          ...doc.data(),
        } as Escrow);
      });

      return escrows;
    } catch (error) {
      console.error('Error fetching escrows by client:', error);
      throw error;
    }
  }

  static async getEscrowsByFreelancer(freelancerId: string): Promise<Escrow[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('freelancerId', '==', freelancerId),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const escrows: Escrow[] = [];

      querySnapshot.forEach((doc) => {
        escrows.push({
          id: doc.id,
          ...doc.data(),
        } as Escrow);
      });

      return escrows;
    } catch (error) {
      console.error('Error fetching escrows by freelancer:', error);
      throw error;
    }
  }
}
