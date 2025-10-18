import { 
  collection, 
  doc, 
  getDocs, 
  getDoc,
  query, 
  where, 
  orderBy, 
  limit as firestoreLimit,
  startAfter,
  DocumentSnapshot,
  Timestamp
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, collections, functions } from '../utils/firebase';

export interface Job {
  id: string;
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
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
  completedAt?: Date | Timestamp;
  disputeReason?: string;
  autoReleaseDate?: Date | Timestamp;
  schedule?: Date | string;
  distance?: number | null;
  rejectionReason?: string;
  reviewedBy?: string;
  reviewedAt?: Date | Timestamp;
}

export interface Offer {
  id?: string;
  jobId: string;
  freelancerId: string;
  freelancerName: string;
  freelancerAvatar?: string;
  amount: number;
  currency: string;
  message: string;
  deliveryTime: string;
  createdAt: Date | Timestamp;
}

export type JobStatus = 
  | 'draft'
  | 'open'
  | 'offered'
  | 'accepted'
  | 'in_progress'
  | 'submitted'
  | 'completed'
  | 'cancelled'
  | 'disputed';

export interface JobStats {
  totalJobs: number;
  pendingReview: number;
  approvedJobs: number;
  rejectedJobs: number;
  activeJobs: number;
  completedJobs: number;
  disputedJobs: number;
  jobsToday: number;
  jobsThisWeek: number;
  jobsThisMonth: number;
}

export interface JobFilters {
  status?: string;
  adminStatus?: string;
  category?: string;
  isUrgent?: boolean;
  search?: string;
  clientId?: string;
}

class JobService {
  private jobsCollection = collection(db, collections.jobs);
  private offersCollection = collection(db, collections.offers);

  async getJobs(
    filters: JobFilters = {}, 
    pageSize: number = 20, 
    lastDoc?: DocumentSnapshot
  ): Promise<{ jobs: Job[], lastDoc: DocumentSnapshot | null, hasMore: boolean }> {
    try {
      let q = query(this.jobsCollection, orderBy('createdAt', 'desc'));

      // Apply filters
      if (filters.status) {
        q = query(q, where('status', '==', filters.status));
      }
      if (filters.adminStatus) {
        q = query(q, where('adminStatus', '==', filters.adminStatus));
      }
      if (filters.category) {
        q = query(q, where('category', '==', filters.category));
      }
      if (filters.isUrgent !== undefined) {
        q = query(q, where('isUrgent', '==', filters.isUrgent));
      }
      if (filters.clientId) {
        q = query(q, where('clientId', '==', filters.clientId));
      }

      // Pagination
      if (lastDoc) {
        q = query(q, startAfter(lastDoc));
      }
      
      q = query(q, firestoreLimit(pageSize + 1));

      const snapshot = await getDocs(q);
      const docs = snapshot.docs;
      
      const hasMore = docs.length > pageSize;
      const jobsToReturn = hasMore ? docs.slice(0, pageSize) : docs;
      const newLastDoc = jobsToReturn.length > 0 ? jobsToReturn[jobsToReturn.length - 1] : null;

      const jobs: Job[] = await Promise.all(
        jobsToReturn.map(async (doc) => {
          const jobData = doc.data();
          
          // Get offers for this job
          const offersQuery = query(this.offersCollection, where('jobId', '==', doc.id));
          const offersSnapshot = await getDocs(offersQuery);
          const offers = offersSnapshot.docs.map(offerDoc => ({
            id: offerDoc.id,
            ...offerDoc.data()
          })) as Offer[];

          return {
            id: doc.id,
            title: jobData.title || '',
            description: jobData.description || '',
            category: jobData.category || 'Other',
            budget: jobData.budget || '0',
            location: jobData.location || '',
            timeNeeded: jobData.timeNeeded || '',
            skills: jobData.skills || [],
            isUrgent: jobData.isUrgent || false,
            status: jobData.status || 'draft',
            adminStatus: jobData.adminStatus || 'pending_review',
            clientId: jobData.clientId || '',
            clientName: jobData.clientName || 'Unknown Client',
            clientAvatar: jobData.clientAvatar || undefined,
            freelancerId: jobData.freelancerId || null,
            freelancerName: jobData.freelancerName || null,
            freelancerAvatar: jobData.freelancerAvatar || null,
            offers,
            acceptedOffer: jobData.acceptedOffer || null,
            escrowId: jobData.escrowId || null,
            createdAt: jobData.createdAt || new Date(),
            updatedAt: jobData.updatedAt || new Date(),
            completedAt: jobData.completedAt || null,
            disputeReason: jobData.disputeReason || null,
            autoReleaseDate: jobData.autoReleaseDate || null,
            schedule: jobData.schedule || null,
            distance: jobData.distance || null,
            rejectionReason: jobData.rejectionReason || null,
            reviewedBy: jobData.reviewedBy || null,
            reviewedAt: jobData.reviewedAt || null,
          } as Job;
        })
      );

      // Apply search filter (client-side)
      let filteredJobs = jobs;
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        filteredJobs = filteredJobs.filter(job => 
          job.title.toLowerCase().includes(searchTerm) ||
          job.description.toLowerCase().includes(searchTerm) ||
          job.clientName.toLowerCase().includes(searchTerm)
        );
      }

      return {
        jobs: filteredJobs,
        lastDoc: newLastDoc,
        hasMore
      };
    } catch (error) {
      console.error('Error fetching jobs:', error);
      
      // If it's an index error, provide helpful message but still throw
      if ((error as any).message?.includes('requires an index')) {
        console.error('🔥 Firestore Index Required - Please create the index using the link in the error above');
      }
      
      throw error;
    }
  }

  async getJobById(jobId: string): Promise<Job | null> {
    try {
      const jobDoc = await getDoc(doc(this.jobsCollection, jobId));
      if (!jobDoc.exists()) {
        return null;
      }

      const jobData = jobDoc.data();
      
      // Get offers for this job
      const offersQuery = query(this.offersCollection, where('jobId', '==', jobId));
      const offersSnapshot = await getDocs(offersQuery);
      const offers = offersSnapshot.docs.map(offerDoc => ({
        id: offerDoc.id,
        ...offerDoc.data()
      })) as Offer[];

      return {
        id: jobId,
        title: jobData.title || '',
        description: jobData.description || '',
        category: jobData.category || 'Other',
        budget: jobData.budget || '0',
        location: jobData.location || '',
        timeNeeded: jobData.timeNeeded || '',
        skills: jobData.skills || [],
        isUrgent: jobData.isUrgent || false,
        status: jobData.status || 'draft',
        adminStatus: jobData.adminStatus || 'pending_review',
        clientId: jobData.clientId || '',
        clientName: jobData.clientName || 'Unknown Client',
        clientAvatar: jobData.clientAvatar || undefined,
        freelancerId: jobData.freelancerId || null,
        freelancerName: jobData.freelancerName || null,
        freelancerAvatar: jobData.freelancerAvatar || null,
        offers,
        acceptedOffer: jobData.acceptedOffer || null,
        escrowId: jobData.escrowId || null,
        createdAt: jobData.createdAt || new Date(),
        updatedAt: jobData.updatedAt || new Date(),
        completedAt: jobData.completedAt || null,
        disputeReason: jobData.disputeReason || null,
        autoReleaseDate: jobData.autoReleaseDate || null,
        schedule: jobData.schedule || null,
        distance: jobData.distance || null,
        rejectionReason: jobData.rejectionReason || null,
        reviewedBy: jobData.reviewedBy || null,
        reviewedAt: jobData.reviewedAt || null,
      } as Job;
    } catch (error) {
      console.error('Error fetching job:', error);
      throw error;
    }
  }

  async approveJob(jobId: string, adminId: string): Promise<void> {
    try {
      // Use Cloud Function for admin actions
      const approveJobFunction = httpsCallable(functions, 'approveJob');
      const result = await approveJobFunction({ jobId });
      
      if (!(result.data as any).success) {
        throw new Error('Failed to approve job');
      }
    } catch (error) {
      console.error('Error approving job:', error);
      throw error;
    }
  }

  async rejectJob(jobId: string, adminId: string, reason: string): Promise<void> {
    try {
      // Use Cloud Function for admin actions
      const rejectJobFunction = httpsCallable(functions, 'rejectJob');
      const result = await rejectJobFunction({ jobId, reason });
      
      if (!(result.data as any).success) {
        throw new Error('Failed to reject job');
      }
    } catch (error) {
      console.error('Error rejecting job:', error);
      throw error;
    }
  }

  async getJobStats(): Promise<JobStats> {
    try {
      const allJobsSnapshot = await getDocs(this.jobsCollection);
      const totalJobs = allJobsSnapshot.size;

      let pendingReview = 0;
      let approvedJobs = 0;
      let rejectedJobs = 0;
      let activeJobs = 0;
      let completedJobs = 0;
      let disputedJobs = 0;
      let jobsToday = 0;
      let jobsThisWeek = 0;
      let jobsThisMonth = 0;

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      allJobsSnapshot.forEach(doc => {
        const data = doc.data();
        
        if (data.adminStatus === 'pending_review') pendingReview++;
        if (data.adminStatus === 'approved') approvedJobs++;
        if (data.adminStatus === 'rejected') rejectedJobs++;
        if (['open', 'offered', 'accepted', 'in_progress'].includes(data.status)) activeJobs++;
        if (data.status === 'completed') completedJobs++;
        if (data.status === 'disputed') disputedJobs++;

        const createdAt = data.createdAt?.toDate() || new Date(0);
        if (createdAt >= today) jobsToday++;
        if (createdAt >= weekAgo) jobsThisWeek++;
        if (createdAt >= monthAgo) jobsThisMonth++;
      });

      return {
        totalJobs,
        pendingReview,
        approvedJobs,
        rejectedJobs,
        activeJobs,
        completedJobs,
        disputedJobs,
        jobsToday,
        jobsThisWeek,
        jobsThisMonth,
      };
    } catch (error) {
      console.error('Error getting job stats:', error);
      throw error;
    }
  }

  async getPendingJobs(limit: number = 10): Promise<Job[]> {
    try {
      const q = query(
        this.jobsCollection,
        where('adminStatus', '==', 'pending_review'),
        orderBy('createdAt', 'asc'),
        firestoreLimit(limit)
      );

      const snapshot = await getDocs(q);
      const jobs = await Promise.all(
        snapshot.docs.map(async (doc) => {
          const jobData = doc.data();
          
          // Get offers for this job
          const offersQuery = query(this.offersCollection, where('jobId', '==', doc.id));
          const offersSnapshot = await getDocs(offersQuery);
          const offers = offersSnapshot.docs.map(offerDoc => ({
            id: offerDoc.id,
            ...offerDoc.data()
          })) as Offer[];

          return {
            id: doc.id,
            ...jobData,
            offers
          } as Job;
        })
      );

      return jobs;
    } catch (error) {
      console.error('Error getting pending jobs:', error);
      
      // If it's an index error, provide helpful message but still throw
      if ((error as any).message?.includes('requires an index')) {
        console.error('🔥 Firestore Index Required for Pending Jobs - Please create the index using the link in the error above');
      }
      
      throw error;
    }
  }
}

const jobService = new JobService();
export default jobService;
