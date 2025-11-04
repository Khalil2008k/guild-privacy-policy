/**
 * JobCard Component
 * 
 * COMMENT: PRIORITY 1 - File Modularization
 * Extracted from home.tsx (lines ~800-980)
 * Purpose: Renders a single job card with all job information
 */

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../contexts/ThemeContext';
import { useI18n } from '../../../contexts/I18nProvider';
import { Job } from '../../../services/jobService';
import { roundToProperCoinValue } from '../../../utils/coinUtils';
import OptimizedImage from '../../../components/OptimizedImage';
import { createListItemAccessibility } from '../../../utils/accessibility';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../config/firebase';

interface JobCardProps {
  job: Job;
  index: number;
  animValue: Animated.Value;
}

interface PosterProfile {
  idNumber?: string;
  rating?: number;
  profileImage?: string;
}

export const JobCard: React.FC<JobCardProps> = ({ job, index, animValue }) => {
  const { theme } = useTheme();
  const { t, isRTL, language } = useI18n();
  const [posterProfile, setPosterProfile] = useState<PosterProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  // Get job content in current language (Arabic if available and language is Arabic)
  const jobTitle = (language === 'ar' && (job as any).titleAr) ? (job as any).titleAr : job.title;
  const jobDescription = (language === 'ar' && (job as any).descriptionAr) ? (job as any).descriptionAr : job.description;

  // Fetch poster profile data for GID and rating
  useEffect(() => {
    if (job.clientId) {
      loadPosterProfile();
    }
  }, [job.clientId]);

  const loadPosterProfile = async () => {
    if (!job.clientId || loadingProfile) return;
    
    try {
      setLoadingProfile(true);
      const profileDoc = await getDoc(doc(db, 'userProfiles', job.clientId));
      if (profileDoc.exists()) {
        const profileData = profileDoc.data();
        setPosterProfile({
          idNumber: profileData.idNumber || undefined,
          rating: profileData.rating || profileData.averageRating || undefined,
          profileImage: profileData.profileImage || profileData.processedImage || undefined,
        });
      }
    } catch (error) {
      // Silent fail - profile data is optional
    } finally {
      setLoadingProfile(false);
    }
  };

  const budgetDisplay = typeof job.budget === 'string' 
    ? (() => {
        const numbers = job.budget.match(/\d+/g);
        if (numbers && numbers.length > 0) {
          const amount = parseInt(numbers[0]);
          return roundToProperCoinValue(amount);
        }
        return job.budget.replace(/Coins/gi, '').trim();
      })()
    : `${roundToProperCoinValue(job.budget?.min || 0)}-${roundToProperCoinValue(job.budget?.max || 0)}`;

  const isHighlighted = index === 1;

  return (
    <Animated.View
      style={{
        opacity: animValue,
        transform: [{ translateY: animValue.interpolate({
          inputRange: [0, 1],
          outputRange: [20, 0],
        })}],
      }}
    >
      <TouchableOpacity
        style={[
          styles.jobCard,
          { backgroundColor: theme.surface },
          isHighlighted && {
            shadowColor: theme.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 16,
            elevation: 6,
            borderWidth: 1,
            borderColor: theme.primary + '30',
          }
        ]}
        onPress={() => router.push(`/(modals)/job/${job.id}`)}
        activeOpacity={0.7}
        {...createListItemAccessibility(`Job: ${job.title || 'Untitled'}`, 'button')}
      >
        {/* Rating in corner */}
        {(posterProfile?.rating || job.rating) && (
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={12} color={theme.primary} />
            <Text style={[styles.ratingText, { color: theme.textSecondary }]}>
              {(posterProfile?.rating || job.rating || 0).toFixed(1)}
            </Text>
          </View>
        )}

        {/* Price tag in bottom corner */}
        <View style={[
          styles.priceTagBottom,
          { backgroundColor: theme.primary },
          isHighlighted && {
            backgroundColor: theme.surface,
            paddingVertical: 6,
            paddingHorizontal: 10,
            borderRadius: 8,
            borderWidth: 2,
            borderColor: theme.primary,
          }
        ]}>
          <Text style={[
            styles.currentPrice,
            { color: '#000000' },
            isHighlighted && {
              fontSize: 13,
              color: theme.primary,
              fontWeight: '700',
            }
          ]}>
            {budgetDisplay}
          </Text>
          <Text style={[
            styles.currencyLabel, 
            { color: isHighlighted ? theme.primary : '#000000' }
          ]}>
            QR
          </Text>
        </View>

        {/* Header Row: Poster Info with Avatar and GID */}
        <View style={styles.cardHeader}>
          <View style={styles.companyInfo}>
            <View style={styles.authorAvatar}>
              {(job.clientAvatar || posterProfile?.profileImage) ? (
                <OptimizedImage 
                  source={{ uri: job.clientAvatar || posterProfile?.profileImage }}
                  compression={{ maxWidth: 800, maxHeight: 600, quality: 0.85 }}
                  resizeMode="cover" 
                  style={styles.avatarImage}
                />
              ) : (
                <Text style={[styles.authorInitial, { color: theme.primary }]}>
                  {job.clientName?.charAt(0) || 'U'}
                </Text>
              )}
            </View>
            <View style={styles.companyDetails}>
              <Text style={[styles.jobAuthor, { color: theme.textSecondary }]} numberOfLines={1}>
                {job.clientName || 'Unknown User'}
              </Text>
              {posterProfile?.idNumber && (
                <Text style={[styles.posterGID, { color: theme.textSecondary }]}>
                  GID: {posterProfile.idNumber}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Job Title */}
        <Text style={[styles.jobTitle, { color: theme.textPrimary }]} numberOfLines={2}>
          {jobTitle}
        </Text>

        {/* Job Description */}
        {jobDescription && (
          <Text style={[styles.jobDescription, { color: theme.textSecondary }]} numberOfLines={2}>
            {jobDescription}
          </Text>
        )}

        {/* Job Meta Info - Location */}
        {job.location && (
          <View style={styles.jobMetaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="location-outline" size={12} color={theme.textSecondary} />
              <Text style={[styles.metaText, { color: theme.textSecondary }]}>
                {t('location')}: {typeof job.location === 'object' ? (job.location?.address || (isRTL ? 'عن بُعد' : 'Remote')) : job.location}
              </Text>
            </View>
          </View>
        )}

        {/* Footer: Time */}
        {(job.timeNeeded || job.duration) && (
          <View style={styles.jobFooter}>
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={12} color={theme.textSecondary} />
              <Text style={[styles.metaText, { color: theme.textSecondary }]}>
                {t('time')}: {job.timeNeeded || job.duration}
              </Text>
            </View>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  jobCard: {
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    padding: 16,
    position: 'relative',
  },
  ratingContainer: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  priceTagBottom: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    alignItems: 'center',
    minWidth: 50,
    flexDirection: 'row',
    gap: 4,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '600',
  },
  currentPrice: {
    fontSize: 12,
    fontWeight: '700',
  },
  currencyLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  companyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  authorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  authorInitial: {
    fontSize: 18,
    fontWeight: '700',
  },
  companyDetails: {
    flex: 1,
  },
  jobAuthor: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  posterGID: {
    fontSize: 11,
    opacity: 0.7,
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
    lineHeight: 20,
  },
  jobDescription: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  jobFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  jobMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
  },
  urgentBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  urgentText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
});
