/**
 * useAdminNotifications Hook
 * 
 * COMMENT: PRIORITY 1 - File Modularization
 * Extracted from add-job.tsx (lines 375-417)
 * Purpose: Handles admin notification logic for new job postings
 */

import { useCallback } from 'react';
import { db } from '../../../config/firebase';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { logger } from '../../../utils/logger';

interface UseAdminNotificationsReturn {
  notifyAdmins: (jobId: string, jobTitle: string) => Promise<void>;
}

export const useAdminNotifications = (): UseAdminNotificationsReturn => {
  // Helper function to notify admins about pending job
  const notifyAdmins = useCallback(async (jobId: string, jobTitle: string) => {
    try {
      // Get all admin users
      const adminsQuery = query(
        collection(db, 'users'),
        where('role', '==', 'admin')
      );
      const adminsSnapshot = await getDocs(adminsQuery);
      
      if (adminsSnapshot.empty) {
        // COMMENT: PRIORITY 1 - Replace console.log with logger
        logger.debug('No admin users found');
        return;
      }

      // Create notification for each admin
      const notificationPromises = adminsSnapshot.docs.map(async (adminDoc) => {
        await addDoc(collection(db, 'notifications'), {
          userId: adminDoc.id,
          type: 'JOB_PENDING_REVIEW',
          title: 'New Job Pending Review',
          message: `Job "${jobTitle}" needs admin review`,
          data: {
            jobId,
            jobTitle,
            status: 'pending_review'
          },
          isRead: false,
          createdAt: new Date(),
          priority: 'high',
          category: 'jobs'
        });
      });

      await Promise.all(notificationPromises);
      // COMMENT: PRIORITY 1 - Replace console.log with logger
      logger.debug(`✅ Notified ${adminsSnapshot.size} admin(s) about new job`);
    } catch (error) {
      // COMMENT: PRIORITY 1 - Replace console.error with logger
      logger.error('Error notifying admins:', error);
      // Don't throw - notification failure shouldn't block job creation
    }
  }, []);

  return {
    notifyAdmins,
  };
};




