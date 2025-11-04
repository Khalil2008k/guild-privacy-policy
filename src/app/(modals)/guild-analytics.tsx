import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, TrendingUp, Users, Briefcase, DollarSign, Star, Activity, BarChart3 } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../contexts/ThemeContext';
import { useI18n } from '../../contexts/I18nProvider';
import { useGuild } from '../../contexts/GuildContext';
import { analyticsService } from '../../services/analyticsService';
// COMMENT: PRIORITY 1 - Replace console statements with logger
import { logger } from '../../utils/logger';

const { width } = Dimensions.get('window');

interface AnalyticsData {
  totalMembers: number;
  activeMembers: number;
  totalJobs: number;
  completedJobs: number;
  totalEarnings: number;
  monthlyGrowth: number;
  memberRetention: number;
  averageRating: number;
  topSkills: Array<{ skill: string; count: number }>;
  monthlyStats: Array<{ month: string; members: number; jobs: number; earnings: number }>;
}

type TimeRange = '7d' | '30d' | '90d' | '1y';

export default function GuildAnalytics() {
  const { top, bottom } = useSafeAreaInsets();
  const { theme, isDarkMode } = useTheme();
  const { t, isRTL } = useI18n();
  const { currentGuild, currentMembership } = useGuild();
  
  const adaptiveColors = {
    background: isDarkMode ? theme.background : '#FFFFFF',
    text: isDarkMode ? theme.text : '#1A1A1A',
    textSecondary: isDarkMode ? theme.textSecondary : '#666666',
    surface: isDarkMode ? theme.surface : '#F8F9FA',
    border: isDarkMode ? theme.border : 'rgba(0,0,0,0.08)',
    primary: theme.primary,
    buttonText: '#000000',
  };

  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>('30d');
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);

  // Check if user has permission to view analytics
  const canViewFullAnalytics = currentMembership?.role === 'Guild Master' || currentMembership?.role === 'Vice Master';

  useEffect(() => {
    loadAnalyticsData();
  }, [selectedTimeRange]);

  const loadAnalyticsData = async () => {
    setLoading(true);
    try {
      // Load real analytics data
      if (currentGuild?.id) {
        const analyticsData = await analyticsService.getGuildAnalytics(currentGuild.id);
        setAnalyticsData(analyticsData);
      } else {
        // Default empty state
        setAnalyticsData({
          totalMembers: 0,
          activeMembers: 0,
          totalJobs: 0,
          completedJobs: 0,
          totalEarnings: 0,
          monthlyGrowth: 0,
          memberRetention: 0,
          averageRating: 0,
          topSkills: [],
          monthlyStats: []
        });
      }
    } catch (error) {
      // COMMENT: PRIORITY 1 - Replace console.error with logger
      logger.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleTimeRangeChange = async (range: TimeRange) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedTimeRange(range);
  };

  const renderMetricCard = (title: string, value: string, subtitle?: string, icon?: string, trend?: number) => (
    <View style={[styles.metricCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={styles.metricHeader}>
        <View style={styles.metricInfo}>
          <Text style={[styles.metricTitle, { color: theme.textSecondary }]}>{title}</Text>
          <Text style={[styles.metricValue, { color: theme.textPrimary }]}>{value}</Text>
          {subtitle && (
            <Text style={[styles.metricSubtitle, { color: theme.textSecondary }]}>{subtitle}</Text>
          )}
        </View>
        {icon && (
          <View style={[styles.metricIcon, { backgroundColor: theme.primary + '20' }]}>
            <Ionicons name={icon as any} size={24} color={theme.primary} />
          </View>
        )}
      </View>
      {trend !== undefined && (
        <View style={styles.trendContainer}>
          <Ionicons 
            name={trend >= 0 ? "trending-up" : "trending-down"} 
            size={16} 
            color={trend >= 0 ? "#4CAF50" : "#F44336"} 
          />
          <Text style={[
            styles.trendText, 
            { color: trend >= 0 ? "#4CAF50" : "#F44336" }
          ]}>
            {Math.abs(trend)}% {trend >= 0 ? 'increase' : 'decrease'}
          </Text>
        </View>
      )}
    </View>
  );

  const renderTopSkills = () => (
    <View style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
        Top Skills in Guild
      </Text>
      {analyticsData?.topSkills.map((skill, index) => (
        <View key={skill.skill} style={styles.skillRow}>
          <View style={styles.skillInfo}>
            <Text style={[styles.skillName, { color: theme.textPrimary }]}>
              {skill.skill}
            </Text>
            <Text style={[styles.skillCount, { color: theme.textSecondary }]}>
              {skill.count} members
            </Text>
          </View>
          <View style={styles.skillBar}>
            <View 
              style={[
                styles.skillBarFill, 
                { 
                  backgroundColor: theme.primary,
                  width: `${(skill.count / (analyticsData?.topSkills[0]?.count || 1)) * 100}%`
                }
              ]} 
            />
          </View>
        </View>
      ))}
    </View>
  );

  const renderTimeRangeSelector = () => (
    <View style={styles.timeRangeContainer}>
      {(['7d', '30d', '90d', '1y'] as TimeRange[]).map((range) => (
        <TouchableOpacity
          key={range}
          style={[
            styles.timeRangeButton,
            {
              backgroundColor: selectedTimeRange === range ? theme.primary : theme.surface,
              borderColor: theme.border,
            }
          ]}
          onPress={() => handleTimeRangeChange(range)}
        >
          <Text style={[
            styles.timeRangeText,
            {
              color: selectedTimeRange === range ? '#000' : theme.textPrimary
            }
          ]}>
            {range === '7d' ? '7 Days' : 
             range === '30d' ? '30 Days' : 
             range === '90d' ? '90 Days' : '1 Year'}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderRestrictedView = () => (
    <View style={styles.restrictedContainer}>
      <Ionicons name="lock-closed" size={64} color={theme.textSecondary} />
      <Text style={[styles.restrictedTitle, { color: theme.textPrimary }]}>
        Limited Access
      </Text>
      <Text style={[styles.restrictedDescription, { color: theme.textSecondary }]}>
        Full analytics are only available to Guild Masters and Vice Masters. 
        Contact your guild leadership for detailed insights.
      </Text>
      
      {/* Show basic stats for members */}
      <View style={styles.basicStats}>
        <View style={[styles.basicStatCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.basicStatValue, { color: theme.textPrimary }]}>
            {analyticsData?.totalMembers || 0}
          </Text>
          <Text style={[styles.basicStatLabel, { color: theme.textSecondary }]}>
            Total Members
          </Text>
        </View>
        
        <View style={[styles.basicStatCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.basicStatValue, { color: theme.textPrimary }]}>
            {analyticsData?.averageRating || 0}
          </Text>
          <Text style={[styles.basicStatLabel, { color: theme.textSecondary }]}>
            Guild Rating
          </Text>
        </View>
      </View>
    </View>
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    header: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: top + 10,
      paddingBottom: 15,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    backButton: {
      padding: 8,
      marginRight: isRTL ? 0 : 12,
      marginLeft: isRTL ? 12 : 0,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.textPrimary,
    },
    content: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: 20,
      paddingVertical: 20,
      paddingBottom: bottom + 20,
    },
    timeRangeContainer: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      marginBottom: 24,
      gap: 8,
    },
    timeRangeButton: {
      flex: 1,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 8,
      borderWidth: 1,
      alignItems: 'center',
    },
    timeRangeText: {
      fontSize: 14,
      fontWeight: '500',
    },
    metricsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      marginBottom: 24,
    },
    metricCard: {
      width: (width - 52) / 2,
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
    },
    metricHeader: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 8,
    },
    metricInfo: {
      flex: 1,
    },
    metricTitle: {
      fontSize: 12,
      fontWeight: '500',
      marginBottom: 4,
    },
    metricValue: {
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 2,
    },
    metricSubtitle: {
      fontSize: 11,
    },
    metricIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    trendContainer: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      gap: 4,
    },
    trendText: {
      fontSize: 12,
      fontWeight: '500',
    },
    section: {
      padding: 20,
      borderRadius: 12,
      borderWidth: 1,
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 16,
    },
    skillRow: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    skillInfo: {
      flex: 1,
      marginRight: isRTL ? 0 : 12,
      marginLeft: isRTL ? 12 : 0,
    },
    skillName: {
      fontSize: 14,
      fontWeight: '500',
      marginBottom: 2,
    },
    skillCount: {
      fontSize: 12,
    },
    skillBar: {
      width: 80,
      height: 6,
      backgroundColor: theme.surface,
      borderRadius: 3,
      overflow: 'hidden',
    },
    skillBarFill: {
      height: '100%',
      borderRadius: 3,
    },
    restrictedContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 40,
    },
    restrictedTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      marginTop: 24,
      marginBottom: 12,
      textAlign: 'center',
    },
    restrictedDescription: {
      fontSize: 16,
      lineHeight: 24,
      textAlign: 'center',
      marginBottom: 32,
    },
    basicStats: {
      flexDirection: 'row',
      gap: 16,
    },
    basicStatCard: {
      padding: 20,
      borderRadius: 12,
      borderWidth: 1,
      alignItems: 'center',
      minWidth: 100,
    },
    basicStatValue: {
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 4,
    },
    basicStatLabel: {
      fontSize: 12,
      textAlign: 'center',
    },
    loadingContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    loadingText: {
      fontSize: 16,
      color: theme.textSecondary,
      marginTop: 16,
    },
  });

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons 
              name={isRTL ? "chevron-forward" : "chevron-back"} 
              size={24} 
              color={theme.textPrimary} 
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {t('guildManagement.analytics.title')}
          </Text>
        </View>
        
        <View style={styles.loadingContainer}>
          <Ionicons name="analytics" size={64} color={theme.textSecondary} />
          <Text style={styles.loadingText}>Loading analytics...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons 
            name={isRTL ? "chevron-forward" : "chevron-back"} 
            size={24} 
            color={theme.textPrimary} 
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {t('guildManagement.analytics.title')}
        </Text>
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {!canViewFullAnalytics ? (
          renderRestrictedView()
        ) : (
          <>
            {/* Time Range Selector */}
            {renderTimeRangeSelector()}

            {/* Metrics Grid */}
            <View style={styles.metricsGrid}>
              {renderMetricCard(
                'Total Members',
                analyticsData?.totalMembers.toString() || '0',
                `${analyticsData?.activeMembers || 0} active`,
                'people',
                analyticsData?.monthlyGrowth
              )}
              
              {renderMetricCard(
                'Completed Jobs',
                analyticsData?.completedJobs.toString() || '0',
                `${analyticsData?.totalJobs || 0} total`,
                'checkmark-circle',
                15.2
              )}
              
              {renderMetricCard(
                'Total Earnings',
                `QAR ${analyticsData?.totalEarnings?.toLocaleString() || '0'}`,
                'This period',
                'wallet',
                8.7
              )}
              
              {renderMetricCard(
                'Guild Rating',
                analyticsData?.averageRating?.toFixed(1) || '0.0',
                'Average rating',
                'star',
                2.1
              )}
              
              {renderMetricCard(
                'Member Retention',
                `${analyticsData?.memberRetention?.toFixed(1) || '0'}%`,
                'Last 90 days',
                'people-circle',
                -1.2
              )}
              
              {renderMetricCard(
                'Growth Rate',
                `${analyticsData?.monthlyGrowth?.toFixed(1) || '0'}%`,
                'Monthly growth',
                'trending-up',
                analyticsData?.monthlyGrowth
              )}
            </View>

            {/* Top Skills */}
            {renderTopSkills()}
          </>
        )}
      </ScrollView>
    </View>
  );
}


