import React, { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useI18n } from '@/contexts/I18nProvider';
import { Job } from '@/services/jobService';
import { router } from 'expo-router';

interface JobCardProps {
  job: Job;
  onPress?: (job: Job) => void;
}

/**
 * Memoized JobCard component for optimal FlatList performance
 * Only re-renders when job data actually changes
 */
export const JobCardMemo = memo<JobCardProps>(
  ({ job, onPress }) => {
    const { theme } = useTheme();
    const { t, isRTL } = useI18n();

    const handlePress = () => {
      if (onPress) {
        onPress(job);
      } else {
        router.push(`/(modals)/job/${job.id}`);
      }
    };

    const formatDistance = (distance: number | null) => {
      if (distance === null) return t('distanceUnknown');
      if (distance < 1) return `${Math.round(distance * 1000)}m`;
      return `${distance.toFixed(1)}km`;
    };

    const formatBudget = (budget: any) => {
      if (typeof budget === 'string') return `$${budget}`;
      if (budget?.min && budget?.max) {
        return `$${budget.min} - $${budget.max}`;
      }
      return `$${budget?.max || '0'}`;
    };

    const getCategoryIcon = (category: string) => {
      const icons: Record<string, string> = {
        delivery: 'bicycle',
        moving: 'truck',
        cleaning: 'water',
        repair: 'hammer',
        shopping: 'cart',
        other: 'ellipsis-horizontal',
      };
      return icons[category] || 'ellipsis-horizontal';
    };

    return (
      <TouchableOpacity
        style={[styles.container, { backgroundColor: theme.surface }]}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <View style={styles.header}>
          <View style={[styles.categoryBadge, { backgroundColor: theme.primary + '20' }]}>
            <Ionicons
              name={getCategoryIcon(job.category) as any}
              size={20}
              color={theme.primary}
            />
            <Text style={[styles.categoryText, { color: theme.primary }]}>
              {t(job.category)}
            </Text>
          </View>
          {job.distance !== null && (
            <View style={styles.distanceBadge}>
              <MaterialIcons name="location-on" size={16} color={theme.textSecondary} />
              <Text style={[styles.distanceText, { color: theme.textSecondary }]}>
                {formatDistance(job.distance)}
              </Text>
            </View>
          )}
        </View>

        <Text style={[styles.title, { color: theme.text }]} numberOfLines={2}>
          {job.title}
        </Text>

        <Text style={[styles.description, { color: theme.textSecondary }]} numberOfLines={3}>
          {job.description}
        </Text>

        <View style={styles.footer}>
          <View style={styles.budgetContainer}>
            <Text style={[styles.budgetLabel, { color: theme.textSecondary }]}>
              {t('budget')}:
            </Text>
            <Text style={[styles.budgetAmount, { color: theme.success }]}>
              {formatBudget(job.budget)}
            </Text>
          </View>

          <View style={styles.metaContainer}>
            {job.status === 'urgent' && (
              <View style={[styles.urgentBadge, { backgroundColor: theme.error + '20' }]}>
                <MaterialIcons name="priority-high" size={14} color={theme.error} />
                <Text style={[styles.urgentText, { color: theme.error }]}>
                  {t('urgent')}
                </Text>
              </View>
            )}
            <Text style={[styles.timeAgo, { color: theme.textSecondary }]}>
              {job.timeAgo || t('justNow')}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison function for better performance
    // Only re-render if these specific properties change
    return (
      prevProps.job.id === nextProps.job.id &&
      prevProps.job.title === nextProps.job.title &&
      prevProps.job.description === nextProps.job.description &&
      prevProps.job.budget === nextProps.job.budget &&
      prevProps.job.distance === nextProps.job.distance &&
      prevProps.job.status === nextProps.job.status &&
      prevProps.job.timeAgo === nextProps.job.timeAgo
    );
  }
);

JobCardMemo.displayName = 'JobCardMemo';

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
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
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  distanceText: {
    fontSize: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  budgetContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  budgetLabel: {
    fontSize: 14,
  },
  budgetAmount: {
    fontSize: 18,
    fontWeight: '700',
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  urgentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  urgentText: {
    fontSize: 12,
    fontWeight: '500',
  },
  timeAgo: {
    fontSize: 12,
  },
});

export default JobCardMemo;

