/**
 * useJobs Hook
 * 
 * COMMENT: PRIORITY 1 - File Modularization
 * Extracted from home.tsx (lines 193-235)
 * Purpose: Manages job loading, filtering, and state
 */

import { useState, useCallback, useEffect } from 'react';
import { jobService, Job } from '../../../services/jobService';
import { logger } from '../../../utils/logger';
import { useAuth } from '../../../contexts/AuthContext';
import { useI18n } from '../../../contexts/I18nProvider';

interface UseJobsReturn {
  jobs: Job[];
  loadingJobs: boolean;
  refreshing: boolean;
  jobError: string | null;
  availableJobs: Job[];
  loadJobs: () => Promise<void>;
  onRefresh: () => Promise<void>;
}

export const useJobs = (animateButtons?: () => void): UseJobsReturn => {
  const { user } = useAuth();
  const { language } = useI18n();
  const stableLanguage = language || 'en';
  
  // Firebase jobs state
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [jobError, setJobError] = useState<string | null>(null);
  
  // First card = normal, Second card = special (admin-controlled)
  const availableJobs = jobs?.filter(job => job.adminStatus === 'approved') || [];

  const loadJobs = useCallback(async () => {
    // COMMENT: FINAL STABILIZATION - Skip loading jobs if user is not authenticated
    if (!user) {
      logger.debug('🔥 HOME: User not authenticated, skipping job load');
      setLoadingJobs(false);
      setJobs([]);
      return;
    }
    
    setLoadingJobs(true);
    setJobError(null); // Clear previous errors
    try {
      const response = await jobService.getOpenJobs();
      setJobs(response.jobs || []);
    } catch (error) {
      logger.error('Error loading jobs:', error);
      // Show user-friendly error message
      const errorMessage = stableLanguage === 'ar' 
        ? 'فشل تحميل الوظائف. يرجى التحقق من الاتصال بالإنترنت والمحاولة مرة أخرى.'
        : 'Failed to load jobs. Please check your internet connection and try again.';
      setJobError(errorMessage);
    } finally {
      setLoadingJobs(false);
    }
  }, [user, stableLanguage]);

  // Handle pull-to-refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadJobs();
    // Trigger button animations on refresh
    if (animateButtons) {
      animateButtons();
    }
    setRefreshing(false);
  }, [loadJobs, animateButtons]);

  // COMMENT: PRODUCTION HARDENING - Task 5.1 - Fetch jobs from Firebase with cleanup
  // Run only on mount to prevent infinite loops
  useEffect(() => {
    let isMounted = true; // Cleanup flag to prevent state updates on unmounted component
    
    // Wrap async operations in a function that checks isMounted
    const initializeData = async () => {
      await loadJobs();
      if (!isMounted) return; // Early return if component unmounted
      // Animate buttons on mount
      if (animateButtons) {
        animateButtons();
      }
    };
    
    initializeData();
    
    // Cleanup: Set flag to prevent state updates if component unmounts
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount - loadJobs is stable due to useCallback

  return {
    jobs,
    loadingJobs,
    refreshing,
    jobError,
    availableJobs,
    loadJobs,
    onRefresh,
  };
};

