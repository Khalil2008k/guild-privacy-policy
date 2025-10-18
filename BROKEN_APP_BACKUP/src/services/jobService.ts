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
  Timestamp,
  increment
} from 'firebase/firestore';
import { db } from '../config/firebase';
import * as Notifications from 'expo-notifications';

export interface Job {
  id?: string;
  title: string;
  description: string;
  category: string;
  budget: string | {
    min: number;
    max: number;
    currency: string;
  };
  location: string | {
    address: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  timeNeeded: string;
  skills: string[];
  isUrgent: boolean;
  status: JobStatus;
  clientId: string;
  clientName: string;
  clientAvatar?: string;
  freelancerId?: string;
  freelancerName?: string;
  freelancerAvatar?: string;
  offers: Offer[];
  acceptedOffer?: Offer;
  escrowId?: string;
  createdAt: Date | string;
  updatedAt: Date;
  completedAt?: Date;
  disputeReason?: string;
  autoReleaseDate?: Date;
  schedule?: Date | string;
  distance?: number | null;
}

export interface Offer {
  id?: string;
  jobId: string;
  freelancerId: string;
  freelancerName: string;
  freelancerAvatar?: string;
  price: number;
  message: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Date;
  acceptedAt?: Date;
}

export interface EscrowTransaction {
  id?: string;
  jobId: string;
  offerId: string;
  clientId: string;
  freelancerId: string;
  amount: number;
  clientFee: number;
  freelancerFee: number;
  zakat: number;
  status: 'pending' | 'held' | 'released' | 'disputed';
  createdAt: Date;
  releasedAt?: Date;
  autoReleaseDate: Date;
}

export type JobStatus = 
  | 'draft'
  | 'open'
  | 'offered'
  | 'accepted'
  | 'in-progress'
  | 'submitted'
  | 'completed'
  | 'cancelled'
  | 'disputed';

class JobService {
  private jobsCollection = collection(db, 'jobs');
  private offersCollection = collection(db, 'offers');
  private escrowCollection = collection(db, 'escrow');

  // Create a new job (draft)
  async createJob(jobData: Omit<Job, 'id' | 'status' | 'offers' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const job: Omit<Job, 'id'> = {
        ...jobData,
        status: 'draft',
        offers: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const docRef = await addDoc(this.jobsCollection, job);
      await this.sendNotification(jobData.clientId, 'Job Created', 'Your job draft has been saved successfully.');
      
      return docRef.id;
    } catch (error) {
      console.error('Error creating job:', error);
      throw new Error('Failed to create job');
    }
  }

  // Post a job (change status from draft to open)
  async postJob(jobId: string): Promise<void> {
    try {
      const jobRef = doc(this.jobsCollection, jobId);
      await updateDoc(jobRef, {
        status: 'open',
        updatedAt: new Date(),
      });

      await this.sendNotification(jobId, 'Job Posted', 'Your job has been posted and is now visible to freelancers.');
    } catch (error) {
      console.error('Error posting job:', error);
      throw new Error('Failed to post job');
    }
  }

  // Submit an offer for a job
  async submitOffer(offerData: Omit<Offer, 'id' | 'status' | 'createdAt'>): Promise<string> {
    try {
      const offer: Omit<Offer, 'id'> = {
        ...offerData,
        status: 'pending',
        createdAt: new Date(),
      };

      const docRef = await addDoc(this.offersCollection, offer);
      
      // Update job offers count
      const jobRef = doc(this.jobsCollection, offerData.jobId);
      const jobDoc = await getDoc(jobRef);
      if (jobDoc.exists()) {
        const jobData = jobDoc.data() as Job;
        await updateDoc(jobRef, {
          offers: [...jobData.offers, { id: docRef.id, ...offer }],
          status: 'offered',
          updatedAt: new Date(),
        });
      }

      // Notify client about new offer
      await this.sendNotification(offerData.jobId, 'New Offer Received', `You have received a new offer for ${offerData.price} QR.`);
      
      return docRef.id;
    } catch (error) {
      console.error('Error submitting offer:', error);
      throw new Error('Failed to submit offer');
    }
  }

  // Accept an offer and create escrow
  async acceptOffer(jobId: string, offerId: string): Promise<string> {
    try {
      // Get job and offer details
      const jobRef = doc(this.jobsCollection, jobId);
      const offerRef = doc(this.offersCollection, offerId);
      
      const [jobDoc, offerDoc] = await Promise.all([
        getDoc(jobRef),
        getDoc(offerRef)
      ]);

      if (!jobDoc.exists() || !offerDoc.exists()) {
        throw new Error('Job or offer not found');
      }

      const jobData = jobDoc.data() as Job;
      const offerData = offerDoc.data() as Offer;

      // Calculate fees and zakat
      const clientFee = offerData.price * 0.05; // 5% client fee
      const freelancerFee = offerData.price * 0.10; // 10% freelancer fee
      const zakat = offerData.price * 0.025; // 2.5% zakat (optional)

      // Create escrow transaction
      const escrowData: Omit<EscrowTransaction, 'id'> = {
        jobId,
        offerId,
        clientId: jobData.clientId,
        freelancerId: offerData.freelancerId,
        amount: offerData.price,
        clientFee,
        freelancerFee,
        zakat,
        status: 'held',
        createdAt: new Date(),
        autoReleaseDate: new Date(Date.now() + 72 * 60 * 60 * 1000), // 72 hours from now
      };

      const escrowRef = await addDoc(this.escrowCollection, escrowData);

      // Update job status and accepted offer
      await updateDoc(jobRef, {
        status: 'accepted',
        freelancerId: offerData.freelancerId,
        freelancerName: offerData.freelancerName,
        freelancerAvatar: offerData.freelancerAvatar,
        acceptedOffer: { id: offerId, ...offerData },
        escrowId: escrowRef.id,
        updatedAt: new Date(),
      });

      // Update offer status
      await updateDoc(offerRef, {
        status: 'accepted',
        acceptedAt: new Date(),
      });

      // Notify freelancer about accepted offer
      await this.sendNotification(offerData.freelancerId, 'Offer Accepted', `Your offer for "${jobData.title}" has been accepted!`);

      return escrowRef.id;
    } catch (error) {
      console.error('Error accepting offer:', error);
      throw new Error('Failed to accept offer');
    }
  }

  // Start work (change status to in-progress)
  async startWork(jobId: string): Promise<void> {
    try {
      const jobRef = doc(this.jobsCollection, jobId);
      await updateDoc(jobRef, {
        status: 'in-progress',
        updatedAt: new Date(),
      });

      await this.sendNotification(jobId, 'Work Started', 'The freelancer has started working on your job.');
    } catch (error) {
      console.error('Error starting work:', error);
      throw new Error('Failed to start work');
    }
  }

  // Submit work for review
  async submitWork(jobId: string, submissionDetails?: string): Promise<void> {
    try {
      const jobRef = doc(this.jobsCollection, jobId);
      await updateDoc(jobRef, {
        status: 'submitted',
        updatedAt: new Date(),
      });

      await this.sendNotification(jobId, 'Work Submitted', 'The freelancer has submitted the completed work for your review.');
    } catch (error) {
      console.error('Error submitting work:', error);
      throw new Error('Failed to submit work');
    }
  }

  // Approve work and release escrow
  async approveWork(jobId: string): Promise<void> {
    try {
      const jobRef = doc(this.jobsCollection, jobId);
      const jobDoc = await getDoc(jobRef);
      
      if (!jobDoc.exists()) {
        throw new Error('Job not found');
      }

      const jobData = jobDoc.data() as Job;
      
      if (!jobData.escrowId) {
        throw new Error('No escrow found for this job');
      }

      // Update job status
      await updateDoc(jobRef, {
        status: 'completed',
        completedAt: new Date(),
        updatedAt: new Date(),
      });

      // Release escrow
      const escrowRef = doc(this.escrowCollection, jobData.escrowId);
      await updateDoc(escrowRef, {
        status: 'released',
        releasedAt: new Date(),
      });

      await this.sendNotification(jobId, 'Work Approved', 'The work has been approved and payment has been released.');
    } catch (error) {
      console.error('Error approving work:', error);
      throw new Error('Failed to approve work');
    }
  }

  // Dispute work
  async disputeWork(jobId: string, reason: string): Promise<void> {
    try {
      const jobRef = doc(this.jobsCollection, jobId);
      await updateDoc(jobRef, {
        status: 'disputed',
        disputeReason: reason,
        updatedAt: new Date(),
      });

      // Update escrow status
      const jobDoc = await getDoc(jobRef);
      if (jobDoc.exists()) {
        const jobData = jobDoc.data() as Job;
        if (jobData.escrowId) {
          const escrowRef = doc(this.escrowCollection, jobData.escrowId);
          await updateDoc(escrowRef, {
            status: 'disputed',
          });
        }
      }

      await this.sendNotification(jobId, 'Work Disputed', 'A dispute has been raised for this job. Our support team will review the case.');
    } catch (error) {
      console.error('Error disputing work:', error);
      throw new Error('Failed to dispute work');
    }
  }

  // Auto-release escrow after 72 hours if no client response
  async autoReleaseEscrow(jobId: string): Promise<void> {
    try {
      const jobRef = doc(this.jobsCollection, jobId);
      const jobDoc = await getDoc(jobRef);
      
      if (!jobDoc.exists()) {
        return;
      }

      const jobData = jobDoc.data() as Job;
      
      if (jobData.status === 'submitted' && jobData.escrowId) {
        // Auto-approve and release escrow
        await this.approveWork(jobId);
        await this.sendNotification(jobId, 'Auto-Release', 'Payment has been automatically released after 72 hours of no response.');
      }
    } catch (error) {
      console.error('Error auto-releasing escrow:', error);
    }
  }

  // Get jobs by status
  async getJobsByStatus(status: JobStatus, userId?: string): Promise<Job[]> {
    try {
      let q = query(this.jobsCollection, where('status', '==', status), orderBy('createdAt', 'desc'));
      
      if (userId) {
        q = query(q, where('clientId', '==', userId));
      }

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Job));
    } catch (error) {
      console.error('Error getting jobs by status:', error);
      throw new Error('Failed to get jobs');
    }
  }

  // Get open jobs for freelancers
  async getOpenJobs(location?: { latitude: number; longitude: number }, category?: string): Promise<Job[]> {
    try {
      let q = query(this.jobsCollection, where('status', '==', 'open'), orderBy('createdAt', 'desc'));
      
      if (category) {
        q = query(q, where('category', '==', category));
      }

      const querySnapshot = await getDocs(q);
      let jobs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Job));

      // Filter by location if provided
      if (location) {
        jobs = jobs.filter(job => {
          if (typeof job.location === 'string' || !job.location.coordinates) return true;
          const distance = this.calculateDistance(
            location.latitude,
            location.longitude,
            job.location.coordinates.latitude,
            job.location.coordinates.longitude
          );
          return distance <= 50; // Within 50km
        });
      }

      return jobs;
    } catch (error) {
      console.error('Error getting open jobs:', error);
      throw new Error('Failed to get open jobs');
    }
  }

  // Get job details
  async getJobById(jobId: string): Promise<Job | null> {
    try {
      const jobRef = doc(this.jobsCollection, jobId);
      const jobDoc = await getDoc(jobRef);
      
      if (!jobDoc.exists()) {
        return null;
      }

      return { id: jobDoc.id, ...jobDoc.data() } as Job;
    } catch (error) {
      console.error('Error getting job by ID:', error);
      throw new Error('Failed to get job details');
    }
  }

  // Get offers for a job
  async getOffersForJob(jobId: string): Promise<Offer[]> {
    try {
      const q = query(this.offersCollection, where('jobId', '==', jobId), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Offer));
    } catch (error) {
      console.error('Error getting offers for job:', error);
      throw new Error('Failed to get offers');
    }
  }

  // Cancel a job
  async cancelJob(jobId: string, reason?: string): Promise<void> {
    try {
      const jobRef = doc(this.jobsCollection, jobId);
      await updateDoc(jobRef, {
        status: 'cancelled',
        updatedAt: new Date(),
      });

      await this.sendNotification(jobId, 'Job Cancelled', reason || 'The job has been cancelled.');
    } catch (error) {
      console.error('Error cancelling job:', error);
      throw new Error('Failed to cancel job');
    }
  }

  // Calculate distance between two points (Haversine formula)
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI/180);
  }

  // Send push notification
  private async sendNotification(userId: string, title: string, body: string): Promise<void> {
    try {
      // In a real app, you would get the user's push token from your database
      // and send the notification through a push service
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: 'default',
        },
        trigger: null, // Send immediately
      });
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }

  // Increment offers count for a job
  async incrementOffers(jobId: string): Promise<void> {
    try {
      const jobRef = doc(this.jobsCollection, jobId);
      await updateDoc(jobRef, {
        offersCount: increment(1),
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error('Error incrementing offers count:', error);
      throw new Error('Failed to increment offers count');
    }
  }

  // Update job status
  async updateJobStatus(jobId: string, status: JobStatus): Promise<void> {
    try {
      const jobRef = doc(this.jobsCollection, jobId);
      await updateDoc(jobRef, {
        status,
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error('Error updating job status:', error);
      throw new Error('Failed to update job status');
    }
  }

  // Get job statistics
  async getJobStats(userId: string): Promise<{
    totalJobs: number;
    completedJobs: number;
    activeJobs: number;
    totalEarnings: number;
    averageRating: number;
  }> {
    try {
      const jobs = await this.getJobsByStatus('completed', userId);
      const activeJobs = await this.getJobsByStatus('in-progress', userId);
      
      const totalJobs = jobs.length + activeJobs.length;
      const completedJobs = jobs.length;
      const totalEarnings = jobs.reduce((sum, job) => sum + (job.acceptedOffer?.price || 0), 0);
      
      return {
        totalJobs,
        completedJobs,
        activeJobs: activeJobs.length,
        totalEarnings,
        averageRating: 4.8, // This would come from a ratings collection
      };
    } catch (error) {
      console.error('Error getting job stats:', error);
      throw new Error('Failed to get job statistics');
    }
  }
}

export { JobService };
export const jobService = new JobService();
export default jobService;


