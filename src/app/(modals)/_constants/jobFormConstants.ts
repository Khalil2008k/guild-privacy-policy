/**
 * Job Form Constants
 * 
 * COMMENT: PRIORITY 1 - File Modularization
 * Extracted from add-job.tsx (lines 197-219)
 * Purpose: Centralized job form data constants (categories, budget types, experience levels)
 */

import {
  Code, Palette, Megaphone, PenTool, Video, Briefcase, Heart,
  GraduationCap, Star, DollarSign, Clock, Users, User, Trophy
} from 'lucide-react-native';

export interface CategoryOption {
  key: string;
  label: string;
  labelAr: string;
  icon: typeof Code;
  color: string;
}

export interface BudgetTypeOption {
  key: 'fixed' | 'hourly' | 'negotiable';
  label: string;
  labelAr: string;
  icon: typeof DollarSign;
}

export interface ExperienceLevelOption {
  key: 'beginner' | 'intermediate' | 'expert';
  label: string;
  labelAr: string;
  icon: typeof User;
}

/**
 * Get categories list based on language
 */
export const getCategories = (isRTL: boolean): CategoryOption[] => [
  { key: 'technology', label: 'Technology', labelAr: 'التكنولوجيا', icon: Code, color: '#3B82F6' },
  { key: 'design', label: 'Design', labelAr: 'التصميم', icon: Palette, color: '#8B5CF6' },
  { key: 'marketing', label: 'Marketing', labelAr: 'التسويق', icon: Megaphone, color: '#F59E0B' },
  { key: 'writing', label: 'Writing', labelAr: 'الكتابة', icon: PenTool, color: '#10B981' },
  { key: 'video', label: 'Video & Audio', labelAr: 'الفيديو', icon: Video, color: '#EF4444' },
  { key: 'business', label: 'Business', labelAr: 'الأعمال', icon: Briefcase, color: '#6366F1' },
  { key: 'lifestyle', label: 'Lifestyle', labelAr: 'نمط الحياة', icon: Heart, color: '#EC4899' },
  { key: 'education', label: 'Education', labelAr: 'التعليم', icon: GraduationCap, color: '#06B6D4' },
  { key: 'other', label: 'Other', labelAr: 'أخرى', icon: Star, color: '#6B7280' },
].map(cat => ({
  ...cat,
  label: isRTL ? cat.labelAr : cat.label,
}));

/**
 * Get budget types list based on language
 */
export const getBudgetTypes = (isRTL: boolean) => {
  const budgetTypes: BudgetTypeOption[] = [
    { key: 'fixed', label: 'Fixed Price', labelAr: 'مبلغ ثابت', icon: DollarSign },
    { key: 'hourly', label: 'Hourly Rate', labelAr: 'ساعي', icon: Clock },
    { key: 'negotiable', label: 'Negotiable', labelAr: 'قابل للتفاوض', icon: Users },
  ];
  
  return budgetTypes.map(type => ({
    ...type,
    label: isRTL ? type.labelAr : type.label,
  }));
};

/**
 * Get experience levels list based on language and theme
 */
export const getExperienceLevels = (isRTL: boolean, primaryColor: string) => {
  const experienceLevels: ExperienceLevelOption[] = [
    { key: 'beginner', label: 'Beginner', labelAr: 'مبتدئ', icon: User },
    { key: 'intermediate', label: 'Intermediate', labelAr: 'متوسط', icon: Users },
    { key: 'expert', label: 'Expert', labelAr: 'خبير', icon: Trophy },
  ];
  
  return experienceLevels.map(level => ({
    ...level,
    label: isRTL ? level.labelAr : level.label,
  }));
};

