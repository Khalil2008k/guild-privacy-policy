import { collection, addDoc, updateDoc, doc, getDoc, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../config/firebase';

export interface Offer {
  id: string;
  jobId: string;
  freelancerId: string;
  price: number;
  message: string;
  status: 'Pending' | 'Accepted' | 'Rejected' | 'Withdrawn';
  createdAt: string;
  updatedAt: string;
}

export interface CreateOfferData {
  jobId: string;
  freelancerId: string;
  price: number;
  message: string;
}

export class OfferService {
  private static collectionName = 'offers';

  static async createOffer(offerData: CreateOfferData): Promise<string> {
    try {
      const now = new Date().toISOString();
      
      const offerDoc = {
        ...offerData,
        status: 'Pending' as const,
        createdAt: now,
        updatedAt: now,
      };

      const docRef = await addDoc(collection(db, this.collectionName), offerDoc);
      console.log('Offer created successfully with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error creating offer:', error);
      throw error;
    }
  }

  static async getOffersByJob(jobId: string): Promise<Offer[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('jobId', '==', jobId),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const offers: Offer[] = [];

      querySnapshot.forEach((doc) => {
        offers.push({
          id: doc.id,
          ...doc.data(),
        } as Offer);
      });

      return offers;
    } catch (error) {
      console.error('Error fetching offers by job:', error);
      throw error;
    }
  }

  static async getOffersByFreelancer(freelancerId: string): Promise<Offer[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('freelancerId', '==', freelancerId),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const offers: Offer[] = [];

      querySnapshot.forEach((doc) => {
        offers.push({
          id: doc.id,
          ...doc.data(),
        } as Offer);
      });

      return offers;
    } catch (error) {
      console.error('Error fetching offers by freelancer:', error);
      throw error;
    }
  }

  static async updateOfferStatus(offerId: string, status: Offer['status']): Promise<void> {
    try {
      const offerRef = doc(db, this.collectionName, offerId);
      await updateDoc(offerRef, {
        status,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error updating offer status:', error);
      throw error;
    }
  }

  static async getOfferById(offerId: string): Promise<Offer | null> {
    try {
      const offerRef = doc(db, this.collectionName, offerId);
      const offerDoc = await getDoc(offerRef);
      
      if (offerDoc.exists()) {
        return {
          id: offerDoc.id,
          ...offerDoc.data(),
        } as Offer;
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching offer by ID:', error);
      throw error;
    }
  }

  static async getPendingOffersByJob(jobId: string): Promise<Offer[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('jobId', '==', jobId),
        where('status', '==', 'Pending'),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const offers: Offer[] = [];

      querySnapshot.forEach((doc) => {
        offers.push({
          id: doc.id,
          ...doc.data(),
        } as Offer);
      });

      return offers;
    } catch (error) {
      console.error('Error fetching pending offers by job:', error);
      throw error;
    }
  }
}
