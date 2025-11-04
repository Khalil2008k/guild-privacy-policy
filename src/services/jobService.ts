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
import { getFunctions, httpsCallable } from 'firebase/functions';
import { db, auth } from '../config/firebase';
import { logger } from '../utils/logger'; // COMMENT: FINAL STABILIZATION - Task 7 - Replace console.log with logger
// import * as Notifications from 'expo-notifications'; // Removed due to Expo Go SDK 53 limitations

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
  status: JobStatus | 'taken';
  adminStatus: 'pending_review' | 'approved' | 'rejected';
  clientId: string;
  clientName: string;
  clientAvatar?: string;
  freelancerId?: string;
  freelancerName?: string;
  freelancerAvatar?: string;
  offers: Offer[];
  acceptedOffer?: Offer;
  escrowId?: string;
  completedAt?: Date | string;
  expiresAt?: Date | string;
  takenBy?: string;
  takenByName?: string;
  takenAt?: any;
  distance?: number;
  createdAt: Date | string;
  updatedAt: Date;
  completedAt?: Date;
  disputeReason?: string;
  autoReleaseDate?: Date;
  schedule?: Date | string;
  distance?: number | null;
  rejectionReason?: string;
  reviewedBy?: string;
  reviewedAt?: Date;
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
  private functions = getFunctions();

  // Create a new job (draft)
  async createJob(jobData: Omit<Job, 'id' | 'status' | 'offers' | 'createdAt' | 'updatedAt'>): Promise<{ job: Job }> {
    try {
      logger.debug('🔥 JOB SERVICE: Creating job with data:', jobData);
      
      // Validate required fields
      if (!jobData.title || jobData.title.trim() === '') {
        throw new Error('Title is required');
      }
      
      if (typeof jobData.budget === 'number' && jobData.budget <= 0) {
        throw new Error('Budget must be positive');
      }
      
      // Check authentication first
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        logger.error('🔥 JOB SERVICE: No authenticated user found');
        throw new Error('User must be authenticated to create jobs');
      }
      
      logger.debug('🔥 JOB SERVICE: User authenticated:', { uid: currentUser.uid, email: currentUser.email });
      
      // Try Cloud Function first, fallback to direct Firestore
      try {
        const createJobFunction = httpsCallable(this.functions, 'createJob');
        const result = await createJobFunction(jobData);
        
        if (result.data && result.data.success) {
          logger.info('🔥 JOB SERVICE: Job created via Cloud Function:', result.data.jobId);
          const job: Job = {
            id: result.data.jobId,
            ...jobData,
            status: 'open',
            adminStatus: 'pending_review',
            offers: [],
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          return { job };
        } else {
          throw new Error('Cloud function failed');
        }
      } catch (cloudFunctionError) {
        logger.warn('🔥 JOB SERVICE: Cloud Function failed, using direct Firestore:', cloudFunctionError);
        
        // Fallback to direct Firestore creation
        const job: Omit<Job, 'id'> = {
          ...jobData,
          status: 'open',
          adminStatus: 'pending_review',
          offers: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        const docRef = await addDoc(this.jobsCollection, job);
        logger.info('🔥 JOB SERVICE: Job created via direct Firestore:', docRef.id);
        return { job: { id: docRef.id, ...job } as Job };
      }
    } catch (error) {
      logger.error('🔥 JOB SERVICE: Error creating job:', error);
      throw error;
    }
  }

  // Post a job (change status from draft to pending_review for admin approval)
  async postJob(jobId: string): Promise<void> {
    try {
      const jobRef = doc(this.jobsCollection, jobId);
      const jobDoc = await getDoc(jobRef);
      
      if (!jobDoc.exists()) {
        throw new Error('Job not found');
      }

      const jobData = jobDoc.data() as Job;
      
      await updateDoc(jobRef, {
        status: 'draft', // Keep as draft until admin approves
        adminStatus: 'pending_review', // Requires admin approval
        updatedAt: new Date(),
      });

      // Notify the job poster
      await this.sendNotification(jobData.clientId, 'Job Submitted', 'Your job has been submitted for review. It will be visible to freelancers once approved by our team.');
    } catch (error) {
      logger.error('Error posting job:', error);
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

        // Notify client about new offer
        await this.sendNotification(jobData.clientId, 'New Offer Received', `You have received a new offer for ${offerData.price} QR.`);
      }
      
      return docRef.id;
    } catch (error) {
      logger.error('Error submitting offer:', error);
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
      logger.error('Error accepting offer:', error);
      throw new Error('Failed to accept offer');
    }
  }

  // Start work (change status to in-progress)
  async startWork(jobId: string): Promise<void> {
    try {
      const jobRef = doc(this.jobsCollection, jobId);
      const jobDoc = await getDoc(jobRef);
      
      if (!jobDoc.exists()) {
        throw new Error('Job not found');
      }

      const jobData = jobDoc.data() as Job;
      
      await updateDoc(jobRef, {
        status: 'in-progress',
        updatedAt: new Date(),
      });

      // Notify the client
      await this.sendNotification(jobData.clientId, 'Work Started', 'The freelancer has started working on your job.');
    } catch (error) {
      logger.error('Error starting work:', error);
      throw new Error('Failed to start work');
    }
  }

  // Submit work for review
  async submitWork(jobId: string, submissionDetails?: string): Promise<void> {
    try {
      const jobRef = doc(this.jobsCollection, jobId);
      const jobDoc = await getDoc(jobRef);
      
      if (!jobDoc.exists()) {
        throw new Error('Job not found');
      }

      const jobData = jobDoc.data() as Job;
      
      await updateDoc(jobRef, {
        status: 'submitted',
        updatedAt: new Date(),
      });

      // Notify the client
      await this.sendNotification(jobData.clientId, 'Work Submitted', 'The freelancer has submitted the completed work for your review.');
    } catch (error) {
      logger.error('Error submitting work:', error);
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

      // Notify the freelancer
      if (jobData.freelancerId) {
        await this.sendNotification(jobData.freelancerId, 'Work Approved', 'The work has been approved and payment has been released.');
      }
    } catch (error) {
      logger.error('Error approving work:', error);
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

        // Notify the freelancer
        if (jobData.freelancerId) {
          await this.sendNotification(jobData.freelancerId, 'Work Disputed', 'A dispute has been raised for this job. Our support team will review the case.');
        }
      }
    } catch (error) {
      logger.error('Error disputing work:', error);
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
        
        // Notify the freelancer
        if (jobData.freelancerId) {
          await this.sendNotification(jobData.freelancerId, 'Auto-Release', 'Payment has been automatically released after 72 hours of no response.');
        }
      }
    } catch (error) {
      logger.error('Error auto-releasing escrow:', error);
    }
  }

  // Get jobs by status
  async getJobsByStatus(status: JobStatus, userId?: string): Promise<Job[]> {
    try {
      // Use Cloud Function for getting jobs
      const getJobsFunction = httpsCallable(this.functions, 'getJobs');
      const result = await getJobsFunction({ 
        status, 
        userId 
      });
      
      if (result.data && result.data.success) {
        return result.data.jobs || [];
      } else {
        throw new Error('Failed to get jobs from Cloud Function');
      }
    } catch (error) {
      logger.error('Error getting jobs by status:', error);
      // Fallback to direct Firestore query if Cloud Function fails
      try {
        let q = query(this.jobsCollection, where('status', '==', status), orderBy('createdAt', 'desc'));
        
        if (userId) {
          q = query(q, where('clientId', '==', userId));
        }

        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Job));
      } catch (fallbackError) {
        logger.error('Fallback query also failed:', fallbackError);
        throw new Error('Failed to get jobs');
      }
    }
  }

  // Get open jobs for freelancers (only admin-approved jobs)
  // COMMENT: PRODUCTION HARDENING - Task 5.3 - Performance benchmarking added
  async getOpenJobs(location?: { latitude: number; longitude: number }, category?: string): Promise<{ jobs: Job[] }> {
    // COMMENT: FINAL STABILIZATION - Check if user is authenticated before fetching jobs
    const currentUser = auth.currentUser;
    if (!currentUser) {
      logger.warn('🔥 JOB SERVICE: No authenticated user, returning empty jobs list');
      return { jobs: [] };
    }
    
    // COMMENT: PRODUCTION HARDENING - Task 5.3 - Benchmark getOpenJobs operation
    const { performanceBenchmark } = await import('../utils/performanceBenchmark');
    return performanceBenchmark.measureAsync(
      'job:getOpenJobs',
      async () => {
    try {
      logger.debug('🔥 JOB SERVICE: Getting open jobs...');

      // For development, get ALL jobs regardless of admin status to show content
      // In production, only show admin-approved jobs
      let q = query(
        this.jobsCollection,
        where('status', '==', 'open')
        // Temporarily removed adminStatus filter for testing
      );

      if (category) {
        q = query(q, where('category', '==', category));
      }

      const querySnapshot = await getDocs(q);
      let jobs = querySnapshot.docs.map(doc => {
        const data = doc.data() as Job;
        logger.debug('🔥 JOB SERVICE: Found job:', { id: doc.id, title: data.title, adminStatus: data.adminStatus });
        return { id: doc.id, ...data } as Job;
      });

      logger.debug('🔥 JOB SERVICE: Total jobs found:', jobs.length);

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

      // Sort by createdAt manually after fetching
      jobs.sort((a, b) => {
        const aTime = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const bTime = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return bTime - aTime; // Newest first
      });

      logger.debug('🔥 JOB SERVICE: Returning jobs:', jobs.length);
      return { jobs };
    } catch (error) {
      logger.error('Error getting open jobs:', error);
      throw new Error('Failed to get open jobs');
    }
      },
      { hasLocation: !!location, hasCategory: !!category }
    );
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
      logger.error('Error getting job by ID:', error);
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
      logger.error('Error getting offers for job:', error);
      throw new Error('Failed to get offers');
    }
  }

  // Cancel a job
  async cancelJob(jobId: string, reason?: string): Promise<{ cancelled: boolean; refunded: boolean; refundAmount?: number; cancellationFee?: number }> {
    try {
      const jobRef = doc(this.jobsCollection, jobId);
      const jobDoc = await getDoc(jobRef);
      
      if (!jobDoc.exists()) {
        throw new Error('Job not found');
      }
      
      const job = jobDoc.data() as Job;
      
      await updateDoc(jobRef, {
        status: 'cancelled',
        updatedAt: new Date(),
      });

      // Notify the freelancer (if assigned)
      if (job.freelancerId) {
        await this.sendNotification(job.freelancerId, 'Job Cancelled', reason || 'The job has been cancelled.');
      }
      
      // Determine refund logic based on job status
      const wasAccepted = job.status === 'accepted' || job.status === 'in-progress';
      const refundAmount = wasAccepted ? (job.acceptedOffer?.price || 0) : 0;
      const cancellationFee = wasAccepted ? Math.floor(refundAmount * 0.1) : 0; // 10% fee for accepted jobs
      const finalRefundAmount = Math.max(0, refundAmount - cancellationFee);
      
      return {
        cancelled: true,
        refunded: wasAccepted,
        refundAmount: finalRefundAmount,
        cancellationFee: cancellationFee
      };
    } catch (error) {
      logger.error('Error cancelling job:', error);
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

  // Send notification to Firestore
  private async sendNotification(userId: string, title: string, body: string): Promise<void> {
    try {
      await addDoc(collection(db, 'notifications'), {
        userId,
        type: 'JOB_APPLICATION_RECEIVED',
        title,
        message: body,
        data: {
          title,
          message: body
        },
        isRead: false,
        createdAt: new Date(),
        priority: 'high',
        category: 'jobs'
      });
      logger.debug('✅ Notification sent:', { userId, title, body });
    } catch (error) {
      logger.error('Error sending notification:', error);
      // Don't throw - notification failure shouldn't block the operation
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
      logger.error('Error incrementing offers count:', error);
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
      logger.error('Error updating job status:', error);
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
      logger.error('Error getting job stats:', error);
      throw new Error('Failed to get job statistics');
    }
  }

  // Get jobs by category
  async getJobsByCategory(category: string): Promise<{ jobs: Job[] }> {
    try {
      const q = query(
        this.jobsCollection,
        where('category', '==', category),
        where('status', '==', 'open'),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      const jobs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Job));
      return { jobs };
    } catch (error) {
      logger.error('Error getting jobs by category:', error);
      throw new Error('Failed to get jobs by category');
    }
  }

  // Get nearby jobs
  async getNearbyJobs(params: { latitude: number; longitude: number; radius: number }): Promise<{ jobs: Job[] }> {
    try {
      // For now, return all open jobs - in production, you'd use geospatial queries
      const q = query(
        this.jobsCollection,
        where('status', '==', 'open'),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      const jobs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Job));
      
      // Filter by distance (simplified calculation)
      const nearbyJobs = jobs.filter(job => {
        if (typeof job.location === 'object' && job.location.coordinates) {
          const distance = this.calculateDistance(
            params.latitude,
            params.longitude,
            job.location.coordinates.latitude,
            job.location.coordinates.longitude
          );
          job.distance = distance; // Add distance to job object
          return distance <= params.radius;
        }
        return false;
      });
      
      return { jobs: nearbyJobs };
    } catch (error) {
      logger.error('Error getting nearby jobs:', error);
      throw new Error('Failed to get nearby jobs');
    }
  }

  // Calculate distance between two coordinates (simplified)
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  // Search jobs by keywords
  async searchJobs(keywords: string): Promise<{ jobs: Job[] }> {
    try {
      const q = query(
        this.jobsCollection,
        where('status', '==', 'open'),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      const allJobs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Job));
      
      // Filter by keywords
      const jobs = allJobs.filter(job => 
        job.title.toLowerCase().includes(keywords.toLowerCase()) ||
        job.description.toLowerCase().includes(keywords.toLowerCase()) ||
        job.skills.some(skill => skill.toLowerCase().includes(keywords.toLowerCase()))
      );
      
      return { jobs };
    } catch (error) {
      logger.error('Error searching jobs:', error);
      throw new Error('Failed to search jobs');
    }
  }

  // Get jobs by budget range
  async getJobsByBudget(params: { min: number; max: number }): Promise<{ jobs: Job[] }> {
    try {
      const q = query(
        this.jobsCollection,
        where('status', '==', 'open'),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      const allJobs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Job));
      
      // Filter by budget
      const jobs = allJobs.filter(job => {
        if (typeof job.budget === 'number') {
          return job.budget >= params.min && job.budget <= params.max;
        } else if (typeof job.budget === 'string') {
          const budgetValue = parseFloat(job.budget);
          return budgetValue >= params.min && budgetValue <= params.max;
        } else if (typeof job.budget === 'object') {
          return job.budget.min >= params.min && job.budget.max <= params.max;
        }
        return false;
      });
      
      return { jobs };
    } catch (error) {
      logger.error('Error getting jobs by budget:', error);
      throw new Error('Failed to get jobs by budget');
    }
  }

  // Accept a job
  async acceptJob(jobId: string): Promise<{ job: Job; contract: any; notificationSent?: boolean }> {
    try {
      const jobDoc = await getDoc(doc(this.jobsCollection, jobId));
      if (!jobDoc.exists()) {
        throw new Error('Job not found');
      }
      
      const job = { id: jobDoc.id, ...jobDoc.data() } as Job;
      
      if (job.status !== 'open') {
        throw new Error('Job already accepted');
      }
      
      // Check if job is expired
      if (job.expiresAt && new Date(job.expiresAt) < new Date()) {
        throw new Error('Job has expired');
      }
      
      // Update job status
      await updateDoc(doc(this.jobsCollection, jobId), {
        status: 'accepted',
        freelancerId: auth.currentUser?.uid,
        updatedAt: serverTimestamp()
      });
      
      // Create contract
      const contract = {
        id: 'contract-' + jobId,
        jobId,
        status: 'active',
        createdAt: new Date()
      };
      
      // Send notification
      let notificationSent = false;
      try {
        await this.sendNotification(job.clientId, 'Job Accepted', 'Your job has been accepted by a freelancer.');
        notificationSent = true;
      } catch (error) {
        logger.error('Failed to send notification:', error);
      }
      
      return { 
        job: { ...job, status: 'accepted' }, 
        contract,
        notificationSent
      };
    } catch (error) {
      logger.error('Error accepting job:', error);
      throw error;
    }
  }

  // Complete a job
  async completeJob(jobId: string, evidence?: any): Promise<{ job: Job; paymentReleased?: boolean; amount?: number; transactionId?: string }> {
    try {
      if (evidence && (!evidence.evidence || evidence.evidence.length === 0)) {
        throw new Error('Evidence required');
      }
      
      const jobDoc = await getDoc(doc(this.jobsCollection, jobId));
      if (!jobDoc.exists()) {
        throw new Error('Job not found');
      }
      
      const job = { id: jobDoc.id, ...jobDoc.data() } as Job;
      
      // Update job status
      await updateDoc(doc(this.jobsCollection, jobId), {
        status: 'completed',
        completedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      // Generate transaction ID
      const transactionId = 'txn-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
      
      return { 
        job: { ...job, status: 'completed' },
        paymentReleased: true,
        amount: job.acceptedOffer?.price || job.budget || 0,
        transactionId
      };
    } catch (error) {
      logger.error('Error completing job:', error);
      throw error;
    }
  }

  // Check auto-release
  async checkAutoRelease(jobId: string): Promise<{ autoReleased: boolean }> {
    try {
      const jobDoc = await getDoc(doc(this.jobsCollection, jobId));
      if (!jobDoc.exists()) {
        throw new Error('Job not found');
      }
      
      const job = { id: jobDoc.id, ...jobDoc.data() } as Job;
      const completedAt = job.completedAt ? new Date(job.completedAt) : null;
      
      if (completedAt) {
        const daysSinceCompletion = (new Date().getTime() - completedAt.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceCompletion >= 7) {
          return { autoReleased: true };
        }
      }
      
      return { autoReleased: false };
    } catch (error) {
      logger.error('Error checking auto-release:', error);
      throw error;
    }
  }

  // Dispute a job
  async disputeJob(jobId: string, reason: any): Promise<{ dispute: any }> {
    try {
      const dispute = {
        id: 'dispute-' + jobId,
        jobId,
        reason: reason.reason,
        status: 'open',
        createdAt: new Date()
      };
      
      // In real implementation, this would create a dispute in Firestore
      await updateDoc(doc(this.jobsCollection, jobId), {
        status: 'disputed',
        disputeId: dispute.id,
        updatedAt: serverTimestamp()
      });
      
      return { dispute };
    } catch (error) {
      logger.error('Error creating dispute:', error);
      throw error;
    }
  }

  // Rate worker
  async rateWorker(jobId: string, rating: any): Promise<{ review: any }> {
    try {
      // Check if review already exists
      const existingReviewQuery = query(
        collection(db, 'reviews'),
        where('jobId', '==', jobId),
        where('type', '==', 'worker')
      );
      
      const existingReviews = await getDocs(existingReviewQuery);
      
      if (existingReviews.docs.length > 0) {
        throw new Error('Review already submitted');
      }
      
      const review = {
        id: 'review-' + jobId,
        jobId,
        rating: rating.rating,
        comment: rating.comment,
        type: 'worker',
        createdAt: new Date()
      };
      
      // In real implementation, this would create a review in Firestore
      return { review };
    } catch (error) {
      logger.error('Error rating worker:', error);
      throw error;
    }
  }

  // Rate poster
  async ratePoster(jobId: string, rating: any): Promise<{ review: any }> {
    try {
      const review = {
        id: 'review-' + jobId,
        jobId,
        rating: rating.rating,
        comment: rating.comment,
        type: 'poster',
        createdAt: new Date()
      };
      
      // In real implementation, this would create a review in Firestore
      return { review };
    } catch (error) {
      logger.error('Error rating poster:', error);
      throw error;
    }
  }

  // Check expired jobs
  async checkExpiredJobs(): Promise<{ expiredJobs: Job[] }> {
    try {
      const q = query(
        this.jobsCollection,
        where('status', '==', 'open'),
        orderBy('createdAt', 'asc')
      );
      const snapshot = await getDocs(q);
      const jobs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Job));
      
      const expiredJobs = jobs.filter(job => {
        const createdAt = job.createdAt ? new Date(job.createdAt) : null;
        if (createdAt) {
          const daysSinceCreation = (new Date().getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
          return daysSinceCreation >= 30;
        }
        return false;
      });
      
      // Update expired jobs
      for (const job of expiredJobs) {
        if (job.id) {
          await updateDoc(doc(this.jobsCollection, job.id), {
            status: 'expired',
            updatedAt: serverTimestamp()
          });
        }
      }
      
      return { expiredJobs: expiredJobs.map(job => ({ ...job, status: 'expired' })) };
    } catch (error) {
      logger.error('Error checking expired jobs:', error);
      throw error;
    }
  }

  // Expire a job
  async expireJob(jobId: string): Promise<{ refunded: boolean; refundAmount: number }> {
    try {
      const jobDoc = await getDoc(doc(this.jobsCollection, jobId));
      if (!jobDoc.exists()) {
        throw new Error('Job not found');
      }
      
      const job = { id: jobDoc.id, ...jobDoc.data() } as Job;
      
      await updateDoc(doc(this.jobsCollection, jobId), {
        status: 'expired',
        updatedAt: serverTimestamp()
      });
      
      // Simulate refund
      const refundAmount = job.acceptedOffer?.price || parseFloat(job.budget as string) || 0;
      
      return { refunded: true, refundAmount };
    } catch (error) {
      logger.error('Error expiring job:', error);
      throw error;
    }
  }

  /**
   * Get all jobs (alias for getOpenJobs for backwards compatibility)
   */
  async getJobs(): Promise<Job[]> {
    try {
      const response = await this.getOpenJobs();
      return response.jobs || [];
    } catch (error) {
      logger.error('Error getting jobs:', error);
      return [];
    }
  }

  /**
   * Get job categories
   */
  async getCategories(): Promise<string[]> {
    // Return predefined categories (can be extended to fetch from backend/Firestore)
    return [
      'Technology',
      'Design',
      'Writing',
      'Marketing',
      'Video & Animation',
      'Music & Audio',
      'Programming',
      'Business',
      'Lifestyle',
      'Photography',
      'Translation',
      'Legal',
      'Finance',
      'Education',
      'Engineering',
      'Construction',
      'Healthcare',
      'Other'
    ];
  }
}

export { JobService };
export const jobService = new JobService();
export default jobService;


