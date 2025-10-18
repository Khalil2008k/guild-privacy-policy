import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { router } from 'expo-router';
import { useI18n } from '@/contexts/I18nProvider';
import { RTLText, RTLView, RTLButton } from '@/app/components/primitives/primitives';
import { Job } from '@/services/jobService';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

interface LocationData {
  latitude: number;
  longitude: number;
}

interface JobCardProps {
  job: Job & { distance?: number | null };
  onPress: () => void;
  location: LocationData | null;
}

export default function JobCard({ job, onPress, location }: JobCardProps) {
  const { t, isRTL } = useI18n();
  const { theme } = useTheme();

  // Format time ago
  const formatTimeAgo = (dateString: string): string => {
    const now = new Date();
    const jobDate = new Date(dateString);
    const diffInMs = now.getTime() - jobDate.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    const diffInWeeks = Math.floor(diffInDays / 7);
    const diffInMonths = Math.floor(diffInDays / 30);

    if (diffInMinutes < 60) {
      return `${diffInMinutes} ${t('minutes')} ${t('ago')}`;
    } else if (diffInHours < 24) {
      return `${diffInHours} ${t('hours')} ${t('ago')}`;
    } else if (diffInDays < 7) {
      return `${diffInDays} ${t('days')} ${t('ago')}`;
    } else if (diffInWeeks < 4) {
      return `${diffInWeeks} ${t('weeks')} ${t('ago')}`;
    } else {
      return `${diffInMonths} ${t('months')} ${t('ago')}`;
    }
  };

  // Format budget
  const formatBudget = (budget: string): string => {
    const amount = parseFloat(budget);
    return `${amount.toLocaleString()} QAR`;
  };

  // Format distance
  const formatDistance = (distance: number | null): string => {
    if (distance === null) return t('locationUnavailable');
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`;
    }
    return `${distance.toFixed(1)} ${t('km')}`;
  };

  // Get category icon
  const getCategoryIcon = (category: string): string => {
    const icons: { [key: string]: string } = {
      'نقل': '🚚',
      'تنظيف': '🧹',
      'صيانة': '🔧',
      'توصيل': '📦',
      'تصميم': '🎨',
      'برمجة': '💻',
      'كتابة': '✍️',
      'تدريس': '📚',
      'تصوير': '📸',
      'أخرى': '📋',
    };
    return icons[category] || '📋';
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { backgroundColor: theme.surface, borderColor: theme.primary }
      ]}
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={`${t('jobCard')}: ${job.title}`}
    >
      <RTLView style={styles.header}>
        <RTLView style={styles.categorySection}>
          <RTLText style={styles.categoryIcon}>{getCategoryIcon(job.category)}</RTLText>
          <RTLText style={styles.categoryText}>{t(job.category)}</RTLText>
        </RTLView>
        <RTLText style={styles.timeAgo}>{formatTimeAgo(typeof job.createdAt === 'string' ? job.createdAt : job.createdAt.toISOString())}</RTLText>
      </RTLView>

      <RTLText style={[styles.title, { color: theme.textPrimary }]} numberOfLines={2}>
        {job.title}
      </RTLText>

      <RTLText style={[styles.description, { color: theme.textSecondary }]} numberOfLines={3}>
        {job.description}
      </RTLText>

      <RTLView style={styles.details}>
        <RTLView style={styles.detailItem}>
          <Ionicons name="cash-outline" size={16} color="#1E90FF" />
          <RTLText style={styles.detailText}>{formatBudget(typeof job.budget === 'string' ? job.budget : `${job.budget.min}-${job.budget.max} ${job.budget.currency}`)}</RTLText>
        </RTLView>

        {location && job.distance !== null && (
          <RTLView style={styles.detailItem}>
            <Ionicons name="location-outline" size={16} color="#1E90FF" />
            <RTLText style={styles.detailText}>{formatDistance(job.distance)}</RTLText>
          </RTLView>
        )}

        {job.schedule && (
          <RTLView style={styles.detailItem}>
            <Ionicons name="time-outline" size={16} color="#1E90FF" />
            <RTLText style={styles.detailText}>
              {new Date(typeof job.schedule === 'string' ? job.schedule : job.schedule.toISOString()).toLocaleDateString()}
            </RTLText>
          </RTLView>
        )}
      </RTLView>

      {job.location && (
        <RTLView style={styles.locationSection}>
          <Ionicons name="location-outline" size={14} color="#666666" />
          <RTLText style={styles.locationText} numberOfLines={1}>
            {typeof job.location === 'string' ? job.location : job.location.address}
          </RTLText>
        </RTLView>
      )}

      <RTLView style={styles.actions}>
        <RTLButton
          variant="outline"
          size="small"
          onPress={onPress}
          style={styles.viewButton}
        >
          <RTLText style={styles.viewButtonText}>{t('viewDetails')}</RTLText>
        </RTLButton>
        
                 <RTLButton
           onPress={() => router.push(`/(modals)/offer-submission?jobId=${job.id}`)}
           style={styles.offerButton}
         >
           <RTLText style={styles.offerButtonText}>{t('submitOffer')}</RTLText>
         </RTLButton>
      </RTLView>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categorySection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E90FF',
  },
  timeAgo: {
    fontSize: 12,
    color: '#999999',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 8,
    lineHeight: 24,
  },
  description: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 16,
    lineHeight: 20,
  },
  details: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  locationSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 16,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#F5F5F5',
    borderRadius: 6,
  },
  locationText: {
    fontSize: 12,
    color: '#666666',
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  viewButton: {
    flex: 1,
    height: 40,
  },
  viewButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E90FF',
  },
  offerButton: {
    flex: 2,
    height: 40,
  },
  offerButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
