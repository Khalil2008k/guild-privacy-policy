/**
 * GUILD Job Lifecycle Tests
 * Tests complete job flow: post → accept → work → complete → payment
 */

import { jobService } from '../../src/services/jobService';
import { 
  createMockUser, 
  createMockJob, 
  mockApiResponse, 
  mockApiError,
  generateId,
} from '../utils/testHelpers';

// Mock Firebase auth
jest.mock('../../src/config/firebase', () => ({
  auth: {
    currentUser: {
      uid: 'test-user-123',
      email: 'test@example.com',
      displayName: 'Test User'
    }
  },
  db: {}
}));

// Mock Firebase Firestore functions
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  addDoc: jest.fn(),
  updateDoc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  serverTimestamp: jest.fn(() => new Date()),
  Timestamp: {
    fromDate: jest.fn((date) => ({ toMillis: () => date.getTime() }))
  },
  increment: jest.fn()
}));

// Mock Firebase Functions
jest.mock('firebase/functions', () => ({
  getFunctions: jest.fn(() => ({})),
  httpsCallable: jest.fn(() => jest.fn().mockResolvedValue({
    data: { success: true, jobId: 'test-job-id' }
  }))
}));

describe('Job Lifecycle Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock Firestore responses
    const { getDoc, getDocs } = require('firebase/firestore');
    
    getDoc.mockResolvedValue({
      exists: () => true,
      data: () => createMockJob(),
      id: 'test-job-id'
    });
    
    // Mock getDocs for different collections
    getDocs.mockImplementation((query) => {
      // Mock reviews collection query (empty)
      if (query && query.toString().includes('reviews')) {
        return Promise.resolve({
          docs: [],
          empty: true
        });
      }
      
      // Mock jobs collection query
      return Promise.resolve({
        docs: [
          { id: 'job-1', data: () => createMockJob({ id: 'job-1' }) },
          { id: 'job-2', data: () => createMockJob({ id: 'job-2' }) },
          { id: 'job-3', data: () => createMockJob({ id: 'job-3' }) }
        ],
        empty: false
      });
    });
  });

  describe('Job Creation', () => {
    test('should successfully create a new job', async () => {
      const jobData = {
        title: 'Build Mobile App',
        description: 'Need a React Native developer',
        category: 'Development',
        budget: 5000,
        currency: 'QR',
        location: 'Doha, Qatar',
        requiredSkills: ['React Native', 'TypeScript'],
        urgent: false,
      };

      const mockJob = createMockJob(jobData);

      global.fetch = jest.fn().mockResolvedValue(
        mockApiResponse({ job: mockJob })
      );

      const result = await jobService.createJob(jobData);

      expect(result.job).toBeDefined();
      expect(result.job.title).toBe(jobData.title);
      expect(result.job.status).toBe('open');
    });

    test('should validate required fields', async () => {
      const invalidJobData = {
        title: '',
        description: '',
      };

      await expect(jobService.createJob(invalidJobData)).rejects.toThrow('Title is required');
    });

    test('should validate budget is positive', async () => {
      const jobData = createMockJob({ budget: -100 });

      await expect(jobService.createJob(jobData)).rejects.toThrow('Budget must be positive');
    });

    test('should set expiry date to 30 days', async () => {
      const jobData = createMockJob();
      const mockJob = {
        ...jobData,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      };

      global.fetch = jest.fn().mockResolvedValue(
        mockApiResponse({ job: mockJob })
      );

      const result = await jobService.createJob(jobData);

      const daysDiff = Math.floor(
        (result.job.expiresAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000)
      );

      expect(daysDiff).toBeGreaterThanOrEqual(29);
      expect(daysDiff).toBeLessThanOrEqual(30);
    });

    test('should create job with location coordinates', async () => {
      const jobData = createMockJob({
        latitude: 25.2854,
        longitude: 51.5310,
      });

      global.fetch = jest.fn().mockResolvedValue(
        mockApiResponse({ job: jobData })
      );

      const result = await jobService.createJob(jobData);

      expect(result.job.latitude).toBe(25.2854);
      expect(result.job.longitude).toBe(51.5310);
    });
  });

  describe('Job Discovery', () => {
    test('should fetch open jobs', async () => {
      const mockJobs = [
        createMockJob({ id: 'job-1', status: 'open' }),
        createMockJob({ id: 'job-2', status: 'open' }),
        createMockJob({ id: 'job-3', status: 'open' }),
      ];

      global.fetch = jest.fn().mockResolvedValue(
        mockApiResponse({ jobs: mockJobs })
      );

      const result = await jobService.getOpenJobs();

      expect(result.jobs).toHaveLength(3);
      expect(result.jobs.every(job => job.status === 'open')).toBe(true);
    });

    test('should filter jobs by category', async () => {
      const mockJobs = [
        createMockJob({ category: 'Development' }),
        createMockJob({ category: 'Development' }),
      ];

      // Mock Firestore query for getJobsByCategory
      const { getDocs } = require('firebase/firestore');
      getDocs.mockResolvedValueOnce({
        docs: mockJobs.map(job => ({ id: job.id, data: () => job }))
      });

      const result = await jobService.getJobsByCategory('Development');

      expect(result.jobs).toHaveLength(2);
      expect(result.jobs.every(job => job.category === 'Development')).toBe(true);
    });

    test('should filter jobs by location radius', async () => {
      const mockJobs = [
        createMockJob({ 
          latitude: 25.2854, 
          longitude: 51.5310,
          location: { coordinates: { latitude: 25.2854, longitude: 51.5310 } }
        }),
      ];

      // Mock Firestore query for getNearbyJobs
      const { getDocs } = require('firebase/firestore');
      getDocs.mockResolvedValueOnce({
        docs: mockJobs.map(job => ({ id: job.id, data: () => job }))
      });

      const result = await jobService.getNearbyJobs({
        latitude: 25.2854,
        longitude: 51.5310,
        radius: 5, // km
      });

      expect(result.jobs).toHaveLength(1);
      expect(result.jobs[0].distance).toBeLessThanOrEqual(5);
    });

    test('should search jobs by keywords', async () => {
      const mockJobs = [
        createMockJob({ title: 'React Native Developer' }),
        createMockJob({ title: 'React Developer' }),
      ];

      // Mock Firestore query for searchJobs
      const { getDocs } = require('firebase/firestore');
      getDocs.mockResolvedValueOnce({
        docs: mockJobs.map(job => ({ id: job.id, data: () => job }))
      });

      const result = await jobService.searchJobs('React');

      expect(result.jobs).toHaveLength(2);
      expect(result.jobs.every(job => job.title.includes('React'))).toBe(true);
    });

    test('should filter by budget range', async () => {
      const mockJobs = [
        createMockJob({ budget: 500 }),
        createMockJob({ budget: 750 }),
      ];

      // Mock Firestore query for getJobsByBudget
      const { getDocs } = require('firebase/firestore');
      getDocs.mockResolvedValueOnce({
        docs: mockJobs.map(job => ({ id: job.id, data: () => job }))
      });

      const result = await jobService.getJobsByBudget({ min: 500, max: 1000 });

      expect(result.jobs).toHaveLength(2);
      expect(result.jobs.every(job => job.budget >= 500 && job.budget <= 1000)).toBe(true);
    });
  });

  describe('Job Application & Acceptance', () => {
    test('should successfully accept a job', async () => {
      const mockJob = createMockJob({ status: 'accepted' });

      global.fetch = jest.fn().mockResolvedValue(
        mockApiResponse({ job: mockJob, contract: { id: 'contract-123' } })
      );

      const result = await jobService.acceptJob('job-123');

      expect(result.job.status).toBe('accepted');
      expect(result.contract).toBeDefined();
    });

    test('should fail to accept already accepted job', async () => {
      const mockJob = createMockJob({ status: 'accepted' });
      
      // Mock Firestore getDoc to return an already accepted job
      const { getDoc } = require('firebase/firestore');
      getDoc.mockResolvedValueOnce({
        exists: () => true,
        id: 'job-123',
        data: () => mockJob
      });

      await expect(jobService.acceptJob('job-123')).rejects.toThrow('Job already accepted');
    });

    test('should fail to accept expired job', async () => {
      const expiredDate = new Date();
      expiredDate.setDate(expiredDate.getDate() - 1); // Yesterday
      const mockJob = createMockJob({ 
        status: 'open',
        expiresAt: expiredDate
      });
      
      // Mock Firestore getDoc to return an expired job
      const { getDoc } = require('firebase/firestore');
      getDoc.mockResolvedValueOnce({
        exists: () => true,
        id: 'job-123',
        data: () => mockJob
      });

      await expect(jobService.acceptJob('job-123')).rejects.toThrow('Job has expired');
    });

    test('should create contract on job acceptance', async () => {
      const mockContract = {
        id: 'contract-123',
        jobId: 'job-123',
        workerId: 'user-123',
        posterId: 'user-456',
        status: 'active',
        createdAt: new Date(),
      };

      global.fetch = jest.fn().mockResolvedValue(
        mockApiResponse({ contract: mockContract })
      );

      const result = await jobService.acceptJob('job-123');

      expect(result.contract).toBeDefined();
      expect(result.contract.status).toBe('active');
    });

    test('should notify job poster when accepted', async () => {
      const mockJob = createMockJob({ status: 'open' });
      
      // Mock Firestore getDoc to return an open job
      const { getDoc } = require('firebase/firestore');
      getDoc.mockResolvedValueOnce({
        exists: () => true,
        id: 'job-123',
        data: () => mockJob
      });

      const result = await jobService.acceptJob('job-123');

      expect(result.notificationSent).toBe(true);
    });
  });

  describe('Job Completion & Payment', () => {
    test('should mark job as completed', async () => {
      const mockJob = createMockJob({ status: 'completed' });

      global.fetch = jest.fn().mockResolvedValue(
        mockApiResponse({ job: mockJob })
      );

      const result = await jobService.completeJob('job-123');

      expect(result.job.status).toBe('completed');
    });

    test('should require evidence for job completion', async () => {
      global.fetch = jest.fn().mockResolvedValue(
        mockApiError('Evidence required', 400)
      );

      await expect(
        jobService.completeJob('job-123', { evidence: [] })
      ).rejects.toThrow('Evidence required');
    });

    test('should release payment on job completion', async () => {
      const mockJob = createMockJob({ 
        status: 'accepted',
        budget: 500,
        acceptedOffer: { price: 500 }
      });
      
      // Mock Firestore getDoc to return the job
      const { getDoc } = require('firebase/firestore');
      getDoc.mockResolvedValueOnce({
        exists: () => true,
        id: 'job-123',
        data: () => mockJob
      });

      const result = await jobService.completeJob('job-123', {
        evidence: ['evidence-1', 'evidence-2'],
      });

      expect(result.paymentReleased).toBe(true);
      expect(result.amount).toBe(500);
      expect(result.transactionId).toBeDefined();
    });

    test('should auto-release payment after 7-14 days', async () => {
      const mockJob = createMockJob({
        status: 'completed',
        completedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), // 8 days ago
      });

      // Mock Firestore getDoc to return the completed job
      const { getDoc } = require('firebase/firestore');
      getDoc.mockResolvedValueOnce({
        exists: () => true,
        id: 'job-123',
        data: () => mockJob
      });

      const result = await jobService.checkAutoRelease('job-123');

      expect(result.autoReleased).toBe(true);
    });

    test('should handle disputed job completion', async () => {
      global.fetch = jest.fn().mockResolvedValue(
        mockApiResponse({ 
          dispute: {
            id: 'dispute-123',
            reason: 'Work not completed as agreed',
            status: 'open',
          }
        })
      );

      const result = await jobService.disputeJob('job-123', {
        reason: 'Work not completed as agreed',
      });

      expect(result.dispute).toBeDefined();
      expect(result.dispute.status).toBe('open');
    });
  });

  describe('Job Cancellation', () => {
    test('should cancel job before acceptance', async () => {
      global.fetch = jest.fn().mockResolvedValue(
        mockApiResponse({ cancelled: true, refunded: false })
      );

      const result = await jobService.cancelJob('job-123');

      expect(result.cancelled).toBe(true);
      expect(result.refunded).toBe(false);
    });

    test('should refund payment on cancellation after acceptance', async () => {
      const mockJob = createMockJob({ 
        status: 'accepted',
        acceptedOffer: { price: 500 }
      });
      
      // Mock Firestore getDoc to return the accepted job
      const { getDoc } = require('firebase/firestore');
      getDoc.mockResolvedValueOnce({
        exists: () => true,
        id: 'job-123',
        data: () => mockJob
      });

      const result = await jobService.cancelJob('job-123');

      expect(result.cancelled).toBe(true);
      expect(result.refunded).toBe(true);
      expect(result.refundAmount).toBe(450); // 500 - 50 (10% fee)
    });

    test('should apply cancellation fee for late cancellation', async () => {
      const mockJob = createMockJob({ 
        status: 'accepted',
        acceptedOffer: { price: 500 }
      });
      
      // Mock Firestore getDoc to return the accepted job
      const { getDoc } = require('firebase/firestore');
      getDoc.mockResolvedValueOnce({
        exists: () => true,
        id: 'job-123',
        data: () => mockJob
      });

      const result = await jobService.cancelJob('job-123');

      expect(result.cancellationFee).toBe(50);
      expect(result.refundAmount).toBe(450);
    });
  });

  describe('Job Expiry', () => {
    test('should auto-expire jobs after 30 days', async () => {
      const expiredJob = createMockJob({
        createdAt: new Date(Date.now() - 31 * 24 * 60 * 60 * 1000), // 31 days ago
        status: 'open',
      });

      // Mock Firestore getDocs to return expired jobs
      const { getDocs } = require('firebase/firestore');
      getDocs.mockResolvedValueOnce({
        docs: [{
          id: 'job-123',
          data: () => expiredJob
        }]
      });

      const result = await jobService.checkExpiredJobs();

      expect(result.expiredJobs).toBeDefined();
      expect(result.expiredJobs.some(job => job.status === 'expired')).toBe(true);
    });

    test('should refund payment on job expiry', async () => {
      global.fetch = jest.fn().mockResolvedValue(
        mockApiResponse({ 
          refunded: true,
          refundAmount: 500,
        })
      );

      const result = await jobService.expireJob('job-123');

      expect(result.refunded).toBe(true);
      expect(result.refundAmount).toBe(500);
    });
  });

  describe('Job Reviews & Ratings', () => {
    test('should allow poster to rate worker', async () => {
      // Mock Firestore getDocs to return no existing reviews
      const { getDocs } = require('firebase/firestore');
      getDocs.mockResolvedValueOnce({
        docs: [] // No existing reviews
      });

      const result = await jobService.rateWorker('job-123', {
        rating: 5,
        comment: 'Excellent work!',
      });

      expect(result.review.rating).toBe(5);
    });

    test('should allow worker to rate poster', async () => {
      global.fetch = jest.fn().mockResolvedValue(
        mockApiResponse({ 
          review: {
            rating: 4,
            comment: 'Good client',
            reviewerId: 'worker-123',
            revieweeId: 'poster-123',
          }
        })
      );

      const result = await jobService.ratePoster('job-123', {
        rating: 4,
        comment: 'Good client',
      });

      expect(result.review.rating).toBe(4);
    });

    test('should prevent duplicate reviews', async () => {
      global.fetch = jest.fn().mockResolvedValue(
        mockApiError('Review already submitted', 409)
      );

      await expect(
        jobService.rateWorker('job-123', { rating: 5 })
      ).rejects.toThrow('Review already submitted');
    });
  });
});


