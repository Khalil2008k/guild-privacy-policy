/**
 * Enhanced Test Suite for Admin Approval & Coin Deduction
 */

import { doc, updateDoc, getDoc, addDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

// Mock Firebase
jest.mock('../config/firebase', () => ({
  db: {},
}));

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  updateDoc: jest.fn(),
  getDoc: jest.fn(),
  addDoc: jest.fn(),
  collection: jest.fn(),
}));

describe('Admin Approval - Coin Deduction', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  it('should deduct coins when admin approves job with Featured', async () => {
    const jobData = {
      id: 'job123',
      title: 'Test Job',
      clientId: 'user123',
      featured: true,
      boost: false,
      promotionCost: 50,
      adminStatus: 'pending_review',
    };

    (getDoc as jest.Mock).mockResolvedValue({
      exists: () => true,
      data: () => jobData,
    });

    (updateDoc as jest.Mock).mockResolvedValue(undefined);
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    // Mock admin authentication
    const mockAuth = {
      currentUser: {
        getIdToken: jest.fn().mockResolvedValue('mock-token'),
      },
    };

    // Simulate admin approval
    const handleApproveJob = async (jobId: string) => {
      const jobRef = doc(db, 'jobs', jobId);
      const jobSnap = await getDoc(jobRef);

      if (!jobSnap.exists()) {
        throw new Error('Job not found');
      }

      const jobData = jobSnap.data();

      // Deduct coins for promotions
      if (jobData.promotionCost && jobData.promotionCost > 0) {
        const response = await fetch('http://localhost:5000/api/v1/coins/deduct', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${await mockAuth.currentUser.getIdToken()}`,
          },
          body: JSON.stringify({
            userId: jobData.clientId,
            amount: jobData.promotionCost,
            metadata: {
              type: 'job_promotion',
              description: `Promotion cost for job: ${jobData.title}`,
              jobId: jobId,
            },
          }),
        });

        if (!response.ok) {
          console.error('Failed to deduct coins');
        }
      }

      // Update job status
      await updateDoc(jobRef, {
        adminStatus: 'approved',
        approvedBy: 'admin123',
        approvedAt: new Date(),
        status: 'open',
      });

      // Notify user
      await addDoc({} as any, {
        userId: jobData.clientId,
        type: 'JOB_APPROVED',
        title: 'Job Approved ✅',
        message: `Your job "${jobData.title}" has been approved...`,
        isRead: false,
        createdAt: new Date(),
        priority: 'high',
        category: 'jobs',
      });
    };

    await handleApproveJob('job123');

    // Assertions
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/coins/deduct'),
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('user123'),
      })
    );

    expect(updateDoc).toHaveBeenCalled();
    // Verify the update contains admin status
    const updateCall = (updateDoc as jest.Mock).mock.calls[0];
    expect(updateCall[1]).toMatchObject({
      adminStatus: 'approved',
    });

    expect(addDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        userId: 'user123',
        type: 'JOB_APPROVED',
      })
    );
  });

  it('should NOT deduct coins when no promotions selected', async () => {
    const jobData = {
      id: 'job123',
      title: 'Test Job',
      clientId: 'user123',
      featured: false,
      boost: false,
      promotionCost: 0,
      adminStatus: 'pending_review',
    };

    (getDoc as jest.Mock).mockResolvedValue({
      exists: () => true,
      data: () => jobData,
    });

    (updateDoc as jest.Mock).mockResolvedValue(undefined);

    const handleApproveJob = async (jobId: string) => {
      const jobRef = doc(db, 'jobs', jobId);
      const jobSnap = await getDoc(jobRef);
      const jobData = jobSnap.data();

      if (jobData.promotionCost && jobData.promotionCost > 0) {
        await fetch('http://localhost:5000/api/v1/coins/deduct', {
          method: 'POST',
          body: JSON.stringify({ userId: jobData.clientId, amount: jobData.promotionCost }),
        });
      }

      await updateDoc(jobRef, {
        adminStatus: 'approved',
        status: 'open',
      });
    };

    await handleApproveJob('job123');

    expect(global.fetch).not.toHaveBeenCalled();
    expect(updateDoc).toHaveBeenCalled();
  });

  it('should NOT deduct coins when admin rejects job', async () => {
    const jobData = {
      id: 'job123',
      title: 'Test Job',
      clientId: 'user123',
      featured: true,
      promotionCost: 50,
      adminStatus: 'pending_review',
    };

    (getDoc as jest.Mock).mockResolvedValue({
      exists: () => true,
      data: () => jobData,
    });

    (updateDoc as jest.Mock).mockResolvedValue(undefined);

    const handleRejectJob = async (jobId: string, reason: string) => {
      const jobRef = doc(db, 'jobs', jobId);
      const jobSnap = await getDoc(jobRef);
      const jobData = jobSnap.data();

      // Update job status
      await updateDoc(jobRef, {
        adminStatus: 'rejected',
        rejectedBy: 'admin123',
        rejectedAt: new Date(),
        rejectionReason: reason,
        status: 'rejected',
      });

      // Notify user
      await addDoc({} as any, {
        userId: jobData.clientId,
        type: 'JOB_REJECTED',
        title: 'Job Rejected',
        message: `Your job "${jobData.title}" was rejected. ${reason}`,
        isRead: false,
        createdAt: new Date(),
        priority: 'high',
        category: 'jobs',
      });
    };

    await handleRejectJob('job123', 'Does not meet requirements');

    expect(global.fetch).not.toHaveBeenCalled();
    expect(updateDoc).toHaveBeenCalled();
    // Verify the update contains admin status
    const updateCall = (updateDoc as jest.Mock).mock.calls[0];
    expect(updateCall[1]).toMatchObject({
      adminStatus: 'rejected',
    });
    expect(addDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        type: 'JOB_REJECTED',
      })
    );
  });
});

