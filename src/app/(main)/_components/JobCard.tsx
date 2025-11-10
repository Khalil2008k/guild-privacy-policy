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
  const { theme, isDarkMode } = useTheme();
  const { t, isRTL, language } = useI18n();
  const [posterProfile, setPosterProfile] = useState<PosterProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  // Get job content in current language (Arabic if available and language is Arabic)
  const jobTitle = (language === 'ar' && job.titleAr) ? job.titleAr : (job.title || '');
  
  // Get description - check for Arabic field first, then fallback to English
  let jobDescription = job.description || '';
  if (language === 'ar' && job.descriptionAr && job.descriptionAr.trim()) {
    jobDescription = job.descriptionAr;
  }
  
  // Get location - check for Arabic field first, handle object/string location
  let jobLocation = '';
  if (language === 'ar' && job.locationAr) {
    jobLocation = job.locationAr;
  } else if (typeof job.location === 'object' && job.location?.address) {
    jobLocation = job.location.address || '';
  } else if (typeof job.location === 'string') {
    jobLocation = job.location;
  }

  // Translate time units (e.g., "3 days" -> "3 أيام")
  const translateTimeUnit = (timeStr: string): string => {
    if (!timeStr || language !== 'ar') return timeStr;
    
    // Match patterns like "3 days", "2 weeks", "1 month", etc.
    const timeMatch = timeStr.match(/(\d+)\s*(day|days|week|weeks|month|months|hour|hours|hr|hrs)/i);
    if (!timeMatch) return timeStr;
    
    const number = timeMatch[1];
    const unit = timeMatch[2].toLowerCase();
    
    const unitMap: Record<string, string> = {
      'day': 'يوم',
      'days': 'أيام',
      'week': 'أسبوع',
      'weeks': 'أسابيع',
      'month': 'شهر',
      'months': 'أشهر',
      'hour': 'ساعة',
      'hours': 'ساعات',
      'hr': 'ساعة',
      'hrs': 'ساعات',
    };
    
    const arabicUnit = unitMap[unit] || unit;
    return `${number} ${arabicUnit}`;
  };

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
        {/* Rating in corner - Always show */}
        <View style={[
          styles.ratingContainer,
          { [isRTL ? 'left' : 'right']: 10.56 } // 12 * 0.88 = 10.56 (12% reduction)
        ]}>
          <Ionicons name="star" size={10.56} color={isDarkMode ? theme.primary : '#000000'} /> {/* Black in light mode, theme color in dark mode */}
          <Text style={[styles.ratingText, { color: theme.textSecondary }]}>
            {(posterProfile?.rating || job.rating || 0).toFixed(1)}
          </Text>
        </View>

        {/* Price tag in bottom corner - RTL support */}
        <View style={[
          styles.priceTagBottom,
          { 
            backgroundColor: theme.primary,
            [isRTL ? 'left' : 'right']: 10.56, // 12 * 0.88 = 10.56 (12% reduction)
            flexDirection: isRTL ? 'row-reverse' : 'row',
          },
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
            { color: '#000000', textAlign: isRTL ? 'right' : 'left' },
            isHighlighted && {
              fontSize: 13,
              color: '#000000', // Black in both modes
              fontWeight: '700',
            }
          ]}>
            {budgetDisplay}
          </Text>
          <Text style={[
            styles.currencyLabel, 
            { 
              color: '#000000', // Black in both modes
              [isRTL ? 'marginRight' : 'marginLeft']: 4,
            }
          ]}>
            {t('qr')}
          </Text>
        </View>

        {/* Header Row: Poster Info with Avatar and GID - RTL support */}
        <View style={[styles.cardHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <View style={[styles.companyInfo, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={[
              styles.authorAvatar,
              { [isRTL ? 'marginLeft' : 'marginRight']: 10.56 } // 12 * 0.88 = 10.56 (12% reduction)
            ]}>
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
              <Text style={[
                styles.jobAuthor, 
                { 
                  color: theme.textSecondary,
                  textAlign: isRTL ? 'right' : 'left'
                }
              ]} numberOfLines={1}>
                {job.clientName || 'Unknown User'}
              </Text>
                     {/* Always show GID, even if loading */}
                     <Text style={[
                       styles.posterGID, 
                       { 
                         color: theme.textSecondary,
                         textAlign: isRTL ? 'right' : 'left'
                       }
                     ]}>
                       GID: {posterProfile?.idNumber || job.posterGID || 'N/A'}
                     </Text>
            </View>
          </View>
        </View>

        {/* Job Title - RTL support */}
        <Text style={[
          styles.jobTitle, 
          { 
            color: theme.textPrimary,
            textAlign: isRTL ? 'right' : 'left'
          }
        ]} numberOfLines={2}>
          {jobTitle || ''}
        </Text>

        {/* Job Description - RTL support */}
        {jobDescription && (
          <Text style={[
            styles.jobDescription, 
            { 
              color: theme.textSecondary,
              textAlign: isRTL ? 'right' : 'left'
            }
          ]} numberOfLines={2}>
            {jobDescription}
          </Text>
        )}

        {/* Job Meta Info - Location - RTL support */}
        {job.location && (
          <View style={[styles.jobMetaRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={[styles.metaItem, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Ionicons 
                name="location-outline" 
                size={10.56} 
                color={theme.textSecondary}
                style={{ [isRTL ? 'marginLeft' : 'marginRight']: 3.52 }} // 12 * 0.88 = 10.56, 4 * 0.88 = 3.52 (12% reduction)
              />
              <Text style={[
                styles.metaText, 
                { 
                  color: theme.textSecondary,
                  textAlign: isRTL ? 'right' : 'left'
                }
              ]}>
                {t('location')}: {jobLocation || (language === 'ar' ? 'عن بُعد' : 'Remote')}
              </Text>
            </View>
          </View>
        )}

        {/* Footer: Time - RTL support with translation */}
        {(job.timeNeeded || job.duration) && (
          <View style={[styles.jobFooter, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={[styles.metaItem, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Ionicons 
                name="time-outline" 
                size={10.56} 
                color={theme.textSecondary}
                style={{ [isRTL ? 'marginLeft' : 'marginRight']: 3.52 }} // 12 * 0.88 = 10.56, 4 * 0.88 = 3.52 (12% reduction)
              />
              <Text style={[
                styles.metaText, 
                { 
                  color: theme.textSecondary,
                  textAlign: isRTL ? 'right' : 'left'
                }
              ]}>
                {t('time')}: {translateTimeUnit(job.timeNeeded || job.duration || '')}
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
    borderRadius: 10.56, // 12 * 0.88 = 10.56 (12% reduction)
    marginBottom: 10.56, // 12 * 0.88 = 10.56 (12% reduction)
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1.76 }, // 2 * 0.88 = 1.76 (12% reduction)
    shadowOpacity: 0.08,
    shadowRadius: 7.04, // 8 * 0.88 = 7.04 (12% reduction)
    elevation: 4,
    padding: 14.08, // 16 * 0.88 = 14.08 (12% reduction)
    position: 'relative',
  },
  ratingContainer: {
    position: 'absolute',
    top: 10.56, // 12 * 0.88 = 10.56 (12% reduction)
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3.52, // 4 * 0.88 = 3.52 (12% reduction)
  },
  priceTagBottom: {
    position: 'absolute',
    bottom: 10.56, // 12 * 0.88 = 10.56 (12% reduction)
    paddingHorizontal: 5.28, // 6 * 0.88 = 5.28 (12% reduction)
    paddingVertical: 1.76, // 2 * 0.88 = 1.76 (12% reduction)
    borderRadius: 5.28, // 6 * 0.88 = 5.28 (12% reduction)
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 0.88 }, // 1 * 0.88 = 0.88 (12% reduction)
    shadowOpacity: 0.1,
    shadowRadius: 2.64, // 3 * 0.88 = 2.64 (12% reduction)
    elevation: 2,
    alignItems: 'center',
    minWidth: 44, // 50 * 0.88 = 44 (12% reduction)
  },
  ratingText: {
    fontSize: 9.68, // 11 * 0.88 = 9.68 (12% reduction)
    fontWeight: '600',
  },
  currentPrice: {
    fontSize: 10.56, // 12 * 0.88 = 10.56 (12% reduction)
    fontWeight: '700',
  },
  currencyLabel: {
    fontSize: 9.68, // 11 * 0.88 = 9.68 (12% reduction)
    fontWeight: '600',
    marginLeft: 3.52, // 4 * 0.88 = 3.52 (12% reduction)
  },
  cardHeader: {
    alignItems: 'center',
    marginBottom: 10.56, // 12 * 0.88 = 10.56 (12% reduction)
  },
  companyInfo: {
    alignItems: 'center',
    flex: 1,
  },
  authorAvatar: {
    width: 35.2, // 40 * 0.88 = 35.2 (12% reduction)
    height: 35.2, // 40 * 0.88 = 35.2 (12% reduction)
    borderRadius: 17.6, // 20 * 0.88 = 17.6 (12% reduction)
    backgroundColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10.56, // 12 * 0.88 = 10.56 (12% reduction)
  },
  avatarImage: {
    width: 35.2, // 40 * 0.88 = 35.2 (12% reduction)
    height: 35.2, // 40 * 0.88 = 35.2 (12% reduction)
    borderRadius: 17.6, // 20 * 0.88 = 17.6 (12% reduction)
  },
  authorInitial: {
    fontSize: 15.84, // 18 * 0.88 = 15.84 (12% reduction)
    fontWeight: '700',
  },
  companyDetails: {
    flex: 1,
  },
  jobAuthor: {
    fontSize: 12.32, // 14 * 0.88 = 12.32 (12% reduction)
    fontWeight: '600',
    marginBottom: 1.76, // 2 * 0.88 = 1.76 (12% reduction)
  },
  posterGID: {
    fontSize: 9.68, // 11 * 0.88 = 9.68 (12% reduction)
    opacity: 0.7,
  },
  jobTitle: {
    fontSize: 14.08, // 16 * 0.88 = 14.08 (12% reduction)
    fontWeight: '700',
    marginBottom: 5.28, // 6 * 0.88 = 5.28 (12% reduction)
    lineHeight: 17.6, // 20 * 0.88 = 17.6 (12% reduction)
  },
  jobDescription: {
    fontSize: 11.44, // 13 * 0.88 = 11.44 (12% reduction)
    lineHeight: 15.84, // 18 * 0.88 = 15.84 (12% reduction)
    marginBottom: 7.04, // 8 * 0.88 = 7.04 (12% reduction)
  },
  jobFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 3.52, // 4 * 0.88 = 3.52 (12% reduction)
  },
  jobMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10.56, // 12 * 0.88 = 10.56 (12% reduction)
    flex: 1,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3.52, // 4 * 0.88 = 3.52 (12% reduction)
  },
  metaText: {
    fontSize: 10.56, // 12 * 0.88 = 10.56 (12% reduction)
  },
  urgentBadge: {
    position: 'absolute',
    top: 10.56, // 12 * 0.88 = 10.56 (12% reduction)
    left: 10.56, // 12 * 0.88 = 10.56 (12% reduction)
    paddingHorizontal: 5.28, // 6 * 0.88 = 5.28 (12% reduction)
    paddingVertical: 1.76, // 2 * 0.88 = 1.76 (12% reduction)
    borderRadius: 3.52, // 4 * 0.88 = 3.52 (12% reduction)
  },
  urgentText: {
    color: '#FFFFFF',
    fontSize: 8.8, // 10 * 0.88 = 8.8 (12% reduction)
    fontWeight: '700',
  },
});
