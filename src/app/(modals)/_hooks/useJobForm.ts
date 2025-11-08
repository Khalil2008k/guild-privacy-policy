/**
 * useJobForm Hook
 * 
 * COMMENT: PRIORITY 1 - File Modularization
 * Extracted from add-job.tsx (lines 130-200, 220-240)
 * Purpose: Manages job form state, navigation, and validation
 */

import { useState, useCallback } from 'react';
import { router } from 'expo-router';
import { jobService } from '../../../services/jobService';
import { CustomAlertService } from '../../../services/CustomAlertService';
import { logger } from '../../../utils/logger';
import { useI18n } from '../../../contexts/I18nProvider';
import { useAuth } from '../../../contexts/AuthContext';
import { db } from '../../../config/firebase';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';

interface JobFormData {
  // Basic Info
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  category: string;
  
  // Budget & Timeline
  budget: string;
  budgetType: 'fixed' | 'hourly' | 'negotiable';
  duration: string;
  isUrgent: boolean;
  
  // Location
  location: string;
  locationAr: string;
  isRemote: boolean;
  showOnMap: boolean;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  
  // Advanced Options
  experienceLevel: 'beginner' | 'intermediate' | 'expert';
  skills: string[];
  requirements: string;
  requirementsAr: string;
  deliverables: string;
  deliverablesAr: string;
  
  // Visibility & Promotion
  visibility: 'public' | 'guild_only' | 'premium';
  featured: boolean;
  boost: boolean;
  
  // Language Settings
  primaryLanguage: 'en' | 'ar' | 'both';
}

interface UseJobFormReturn {
  formData: JobFormData;
  currentStep: number;
  isSubmitting: boolean;
  focusedField: string | null;
  showLanguageSelector: boolean;
  handleInputChange: (field: keyof JobFormData, value: any) => void;
  handleNextStep: () => void;
  handlePrevStep: () => void;
  setFocusedField: (field: string | null) => void;
  setShowLanguageSelector: (show: boolean) => void;
  handleSubmit: (calculatePromotionCost: () => number, notifyAdmins: (jobId: string, jobTitle: string) => Promise<void>) => Promise<void>;
}

const initialFormData: JobFormData = {
  title: '',
  titleAr: '',
  description: '',
  descriptionAr: '',
  category: '',
  budget: '',
  budgetType: 'fixed',
  duration: '',
  isUrgent: false,
  location: '',
  locationAr: '',
  isRemote: false,
  showOnMap: false,
  experienceLevel: 'intermediate',
  skills: [],
  requirements: '',
  requirementsAr: '',
  deliverables: '',
  deliverablesAr: '',
  visibility: 'public',
  featured: false,
  boost: false,
  primaryLanguage: 'both',
};

export const useJobForm = (): UseJobFormReturn => {
  const { isRTL } = useI18n();
  const { user } = useAuth();
  const [formData, setFormData] = useState<JobFormData>(initialFormData);
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);

  const handleInputChange = useCallback((field: keyof JobFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleNextStep = useCallback(() => {
    if (currentStep < 4) {
      setCurrentStep(prev => prev + 1);
    }
  }, [currentStep]);

  const handlePrevStep = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const handleSubmit = useCallback(async (
    calculatePromotionCost: () => number,
    notifyAdmins: (jobId: string, jobTitle: string) => Promise<void>
  ) => {
    setIsSubmitting(true);

    try {
      if (!user) {
        throw new Error('User not authenticated');
      }

      const jobData = {
        title: formData.primaryLanguage === 'ar' ? formData.titleAr : formData.title,
        description: formData.primaryLanguage === 'ar' ? formData.descriptionAr : formData.description,
        category: formData.category,
        budget: formData.budget,
        budgetType: formData.budgetType,
        location: formData.primaryLanguage === 'ar' ? formData.locationAr : formData.location,
        timeNeeded: formData.duration,
        isUrgent: formData.isUrgent,
        isRemote: formData.isRemote,
        experienceLevel: formData.experienceLevel,
        skills: formData.skills,
        requirements: formData.primaryLanguage === 'ar' ? formData.requirementsAr : formData.requirements,
        deliverables: formData.primaryLanguage === 'ar' ? formData.deliverablesAr : formData.deliverables,
        visibility: formData.visibility,
        featured: formData.featured,
        boost: formData.boost,
        promotionCost: calculatePromotionCost(),
        clientId: user.uid,
        clientName: user.displayName || user.email || 'Anonymous Client',
        clientAvatar: user.photoURL || undefined,
        showOnMap: formData.showOnMap,
        coordinates: formData.coordinates,
        adminStatus: 'pending_review' as const,
        // Bilingual support
        titleAr: formData.titleAr,
        descriptionAr: formData.descriptionAr,
        locationAr: formData.locationAr,
        requirementsAr: formData.requirementsAr,
        deliverablesAr: formData.deliverablesAr,
        primaryLanguage: formData.primaryLanguage,
      };

      const result = await jobService.createJob(jobData);
      
      // Notify admins about the new job
      if (result.job?.id) {
        await notifyAdmins(result.job.id, jobData.title);
      }
      
      CustomAlertService.showSuccess(
        isRTL ? 'تم إرسال الوظيفة' : 'Job Submitted',
        isRTL ? 'تم إرسال وظيفتك للمراجعة. ستظهر للمستقلين بعد الموافقة.' : 'Your job has been submitted for review. It will be visible after admin approval.',
        [
          {
            text: isRTL ? 'موافق' : 'OK',
            style: 'default',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      // COMMENT: PRIORITY 1 - Replace console.error with logger
      logger.error('Error posting job:', error);
      CustomAlertService.showError(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'فشل في نشر الوظيفة. يرجى المحاولة مرة أخرى.' : 'Failed to post job. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, user, isRTL]);

  return {
    formData,
    currentStep,
    isSubmitting,
    focusedField,
    showLanguageSelector,
    handleInputChange,
    handleNextStep,
    handlePrevStep,
    setFocusedField,
    setShowLanguageSelector,
    handleSubmit,
  };
};








