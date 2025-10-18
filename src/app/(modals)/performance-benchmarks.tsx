import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { ArrowLeft, TrendingUp, Award, Target, BarChart3, Activity, ChevronRight } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { useI18n } from '../../contexts/I18nProvider';
import { useCustomAlert } from '../../components/CustomAlert';
import { getContrastTextColor } from '../../utils/colorUtils';

const FONT_FAMILY = 'SignikaNegative_400Regular';
const { width } = Dimensions.get('window');

interface GuildPerformanceMetrics {
  guildId: string;
  guildName: string;
  memberCount: number;
  totalEarnings: number;
  completedTasks: number;
  averageRating: number;
  responseTime: number; // hours
  completionRate: number; // percentage
  clientSatisfaction: number; // percentage
  monthlyGrowth: number; // percentage
  rank: number;
  category: 'top_performer' | 'above_average' | 'average' | 'below_average';
}

interface BenchmarkComparison {
  metric: string;
  yourGuild: number;
  industryAverage: number;
  topPerformer: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  changePercent: number;
}

interface MemberPerformance {
  memberId: string;
  memberName: string;
  role: string;
  tasksCompleted: number;
  earnings: number;
  rating: number;
  responseTime: number;
  efficiency: number; // percentage
}

const SAMPLE_GUILD_METRICS: GuildPerformanceMetrics = {
  guildId: 'guild_001',
  guildName: 'Tech Innovators Qatar',
  memberCount: 24,
  totalEarnings: 485000,
  completedTasks: 156,
  averageRating: 4.7,
  responseTime: 2.3,
  completionRate: 94,
  clientSatisfaction: 92,
  monthlyGrowth: 18.5,
  rank: 7,
  category: 'top_performer'
};

const SAMPLE_BENCHMARKS: BenchmarkComparison[] = [
  {
    metric: 'Average Response Time',
    yourGuild: 2.3,
    industryAverage: 4.8,
    topPerformer: 1.2,
    unit: 'hours',
    trend: 'down',
    changePercent: -15.2
  },
  {
    metric: 'Task Completion Rate',
    yourGuild: 94,
    industryAverage: 87,
    topPerformer: 98,
    unit: '%',
    trend: 'up',
    changePercent: 8.3
  },
  {
    metric: 'Client Satisfaction',
    yourGuild: 92,
    industryAverage: 85,
    topPerformer: 96,
    unit: '%',
    trend: 'up',
    changePercent: 5.7
  },
  {
    metric: 'Monthly Revenue Growth',
    yourGuild: 18.5,
    industryAverage: 12.3,
    topPerformer: 25.8,
    unit: '%',
    trend: 'up',
    changePercent: 12.4
  },
  {
    metric: 'Average Project Value',
    yourGuild: 3109,
    industryAverage: 2450,
    topPerformer: 4200,
    unit: 'QAR',
    trend: 'up',
    changePercent: 22.1
  },
  {
    metric: 'Member Retention Rate',
    yourGuild: 89,
    industryAverage: 78,
    topPerformer: 94,
    unit: '%',
    trend: 'stable',
    changePercent: 2.1
  }
];

const SAMPLE_MEMBER_PERFORMANCE: MemberPerformance[] = [
  {
    memberId: 'member_001',
    memberName: 'Ahmed Hassan',
    role: 'Guild Master',
    tasksCompleted: 28,
    earnings: 45600,
    rating: 4.9,
    responseTime: 1.2,
    efficiency: 96
  },
  {
    memberId: 'member_002',
    memberName: 'Sarah Al-Mahmoud',
    role: 'Vice Master',
    tasksCompleted: 24,
    earnings: 38200,
    rating: 4.8,
    responseTime: 1.8,
    efficiency: 94
  },
  {
    memberId: 'member_003',
    memberName: 'Omar Khalil',
    role: 'Senior Member',
    tasksCompleted: 22,
    earnings: 35400,
    rating: 4.6,
    responseTime: 2.1,
    efficiency: 91
  },
  {
    memberId: 'member_004',
    memberName: 'Fatima Al-Zahra',
    role: 'Member',
    tasksCompleted: 19,
    earnings: 28900,
    rating: 4.5,
    responseTime: 2.8,
    efficiency: 87
  },
  {
    memberId: 'member_005',
    memberName: 'Khalid Rahman',
    role: 'Member',
    tasksCompleted: 16,
    earnings: 24300,
    rating: 4.3,
    responseTime: 3.2,
    efficiency: 83
  }
];

export default function PerformanceBenchmarksScreen() {
  const insets = useSafeAreaInsets();
  const { theme, isDarkMode } = useTheme();
  const { t } = useI18n();
  const { showAlert, AlertComponent } = useCustomAlert();
  
  const adaptiveColors = {
    background: isDarkMode ? theme.background : '#FFFFFF',
    text: isDarkMode ? theme.text : '#1A1A1A',
    textSecondary: isDarkMode ? theme.textSecondary : '#666666',
    surface: isDarkMode ? theme.surface : '#F8F9FA',
    border: isDarkMode ? theme.border : 'rgba(0,0,0,0.08)',
    primary: theme.primary,
    buttonText: '#000000',
  };

  // State
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [selectedTab, setSelectedTab] = useState<'overview' | 'benchmarks' | 'members'>('overview');
  const [guildMetrics, setGuildMetrics] = useState<GuildPerformanceMetrics>(SAMPLE_GUILD_METRICS);
  const [benchmarks, setBenchmarks] = useState<BenchmarkComparison[]>(SAMPLE_BENCHMARKS);
  const [memberPerformance, setMemberPerformance] = useState<MemberPerformance[]>(SAMPLE_MEMBER_PERFORMANCE);

  // Handle refresh data
  const handleRefreshData = async () => {
    try {
      setRefreshing(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      showAlert('Data Updated', 'Performance data has been refreshed successfully.', 'success');
    } catch (error) {
      console.error('Error refreshing data:', error);
      showAlert('Refresh Error', 'Failed to refresh performance data. Please try again.', 'error');
    } finally {
      setRefreshing(false);
    }
  };

  // Get category color
  const getCategoryColor = (category: GuildPerformanceMetrics['category']) => {
    switch (category) {
      case 'top_performer': return theme.success;
      case 'above_average': return theme.info;
      case 'average': return theme.warning;
      case 'below_average': return theme.error;
      default: return theme.textSecondary;
    }
  };

  // Get category label
  const getCategoryLabel = (category: GuildPerformanceMetrics['category']) => {
    const labels = {
      top_performer: 'Top Performer',
      above_average: 'Above Average',
      average: 'Average',
      below_average: 'Below Average'
    };
    return labels[category];
  };

  // Get trend color
  const getTrendColor = (trend: BenchmarkComparison['trend']) => {
    switch (trend) {
      case 'up': return theme.success;
      case 'down': return theme.error;
      case 'stable': return theme.warning;
      default: return theme.textSecondary;
    }
  };

  // Get trend icon
  const getTrendIcon = (trend: BenchmarkComparison['trend']) => {
    switch (trend) {
      case 'up': return 'trending-up';
      case 'down': return 'trending-down';
      case 'stable': return 'remove';
      default: return 'help';
    }
  };

  // Format number
  const formatNumber = (value: number, unit: string) => {
    if (unit === 'QAR') {
      return `${value.toLocaleString()} ${unit}`;
    }
    if (unit === '%') {
      return `${value.toFixed(1)}%`;
    }
    if (unit === 'hours') {
      return `${value.toFixed(1)}h`;
    }
    return `${value.toLocaleString()} ${unit}`;
  };

  // Calculate performance score
  const calculatePerformanceScore = (metrics: GuildPerformanceMetrics) => {
    const weights = {
      rating: 0.25,
      completionRate: 0.25,
      clientSatisfaction: 0.25,
      responseTime: 0.25 // inverted - lower is better
    };
    
    const normalizedResponseTime = Math.max(0, 100 - (metrics.responseTime * 10));
    
    return Math.round(
      (metrics.averageRating * 20 * weights.rating) +
      (metrics.completionRate * weights.completionRate) +
      (metrics.clientSatisfaction * weights.clientSatisfaction) +
      (normalizedResponseTime * weights.responseTime)
    );
  };

  const performanceScore = calculatePerformanceScore(guildMetrics);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
      paddingBottom: insets.bottom,
    },
    content: {
      flex: 1,
    },
    header: {
      backgroundColor: theme.surface,
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.textPrimary,
      fontFamily: FONT_FAMILY,
      marginBottom: 8,
    },
    headerDescription: {
      fontSize: 14,
      color: theme.textSecondary,
      fontFamily: FONT_FAMILY,
      lineHeight: 20,
      marginBottom: 16,
    },
    headerActions: {
      flexDirection: 'row',
      gap: 12,
    },
    headerButton: {
      flex: 1,
      backgroundColor: theme.primary,
      borderRadius: 8,
      paddingVertical: 10,
      paddingHorizontal: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerButtonSecondary: {
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
    },
    headerButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: getContrastTextColor(theme.primary),
      fontFamily: FONT_FAMILY,
      marginLeft: 6,
    },
    headerButtonTextSecondary: {
      color: theme.textPrimary,
    },
    tabContainer: {
      backgroundColor: theme.surface,
      flexDirection: 'row',
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    tab: {
      flex: 1,
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 20,
      alignItems: 'center',
      marginHorizontal: 4,
    },
    tabActive: {
      backgroundColor: theme.primary,
    },
    tabText: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.textSecondary,
      fontFamily: FONT_FAMILY,
    },
    tabTextActive: {
      color: getContrastTextColor(theme.primary),
    },
    periodSelector: {
      backgroundColor: theme.surface,
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    periodRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    periodLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.textPrimary,
      fontFamily: FONT_FAMILY,
    },
    periodButtons: {
      flexDirection: 'row',
      gap: 8,
    },
    periodButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      backgroundColor: theme.background,
      borderWidth: 1,
      borderColor: theme.border,
    },
    periodButtonActive: {
      backgroundColor: theme.primary,
      borderColor: theme.primary,
    },
    periodButtonText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.textSecondary,
      fontFamily: FONT_FAMILY,
      textTransform: 'capitalize',
    },
    periodButtonTextActive: {
      color: getContrastTextColor(theme.primary),
    },
    scrollContent: {
      padding: 20,
    },
    overviewCard: {
      backgroundColor: theme.surface,
      borderRadius: 16,
      padding: 20,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: theme.border,
    },
    guildHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    guildIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: theme.primary + '20',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 16,
    },
    guildInfo: {
      flex: 1,
    },
    guildName: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.textPrimary,
      fontFamily: FONT_FAMILY,
      marginBottom: 4,
    },
    guildRank: {
      fontSize: 14,
      color: theme.textSecondary,
      fontFamily: FONT_FAMILY,
    },
    categoryBadge: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      alignItems: 'center',
    },
    categoryText: {
      fontSize: 12,
      fontWeight: '600',
      color: 'white',
      fontFamily: FONT_FAMILY,
      textTransform: 'uppercase',
    },
    performanceScore: {
      alignItems: 'center',
      marginBottom: 20,
    },
    scoreCircle: {
      width: 100,
      height: 100,
      borderRadius: 50,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 8,
    },
    scoreText: {
      fontSize: 32,
      fontWeight: 'bold',
      color: 'white',
      fontFamily: FONT_FAMILY,
    },
    scoreLabel: {
      fontSize: 14,
      color: theme.textSecondary,
      fontFamily: FONT_FAMILY,
    },
    metricsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    metricCard: {
      backgroundColor: theme.background,
      borderRadius: 12,
      padding: 16,
      width: (width - 64) / 2,
      alignItems: 'center',
    },
    metricValue: {
      fontSize: 24,
      fontWeight: 'bold',
      fontFamily: FONT_FAMILY,
      marginBottom: 4,
    },
    metricLabel: {
      fontSize: 12,
      color: theme.textSecondary,
      fontFamily: FONT_FAMILY,
      textAlign: 'center',
    },
    benchmarkCard: {
      backgroundColor: theme.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.border,
    },
    benchmarkHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    benchmarkTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.textPrimary,
      fontFamily: FONT_FAMILY,
      flex: 1,
    },
    trendBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    trendText: {
      fontSize: 11,
      fontWeight: '600',
      color: 'white',
      fontFamily: FONT_FAMILY,
      marginLeft: 4,
    },
    benchmarkValues: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    benchmarkValue: {
      alignItems: 'center',
      flex: 1,
    },
    benchmarkValueLabel: {
      fontSize: 11,
      color: theme.textSecondary,
      fontFamily: FONT_FAMILY,
      marginBottom: 4,
    },
    benchmarkValueText: {
      fontSize: 16,
      fontWeight: '600',
      fontFamily: FONT_FAMILY,
    },
    memberCard: {
      backgroundColor: theme.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.border,
    },
    memberHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    memberAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    memberAvatarText: {
      fontSize: 16,
      fontWeight: 'bold',
      color: getContrastTextColor(theme.primary),
      fontFamily: FONT_FAMILY,
    },
    memberInfo: {
      flex: 1,
    },
    memberName: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.textPrimary,
      fontFamily: FONT_FAMILY,
    },
    memberRole: {
      fontSize: 13,
      color: theme.textSecondary,
      fontFamily: FONT_FAMILY,
    },
    memberStats: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    memberStat: {
      alignItems: 'center',
      flex: 1,
    },
    memberStatValue: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.textPrimary,
      fontFamily: FONT_FAMILY,
    },
    memberStatLabel: {
      fontSize: 11,
      color: theme.textSecondary,
      fontFamily: FONT_FAMILY,
      marginTop: 2,
    },
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 60,
    },
    emptyIcon: {
      marginBottom: 16,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.textPrimary,
      fontFamily: FONT_FAMILY,
      marginBottom: 8,
    },
    emptyDescription: {
      fontSize: 14,
      color: theme.textSecondary,
      fontFamily: FONT_FAMILY,
      textAlign: 'center',
      lineHeight: 20,
    },
  });

  const renderOverview = () => (
    <View>
      {/* Guild Overview */}
      <View style={styles.overviewCard}>
        <View style={styles.guildHeader}>
          <View style={styles.guildIcon}>
            <Ionicons name="people" size={24} color={theme.primary} />
          </View>
          <View style={styles.guildInfo}>
            <Text style={styles.guildName}>{guildMetrics.guildName}</Text>
            <Text style={styles.guildRank}>Rank #{guildMetrics.rank} in Qatar</Text>
          </View>
          <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(guildMetrics.category) }]}>
            <Text style={styles.categoryText}>{getCategoryLabel(guildMetrics.category)}</Text>
          </View>
        </View>

        {/* Performance Score */}
        <View style={styles.performanceScore}>
          <View style={[
            styles.scoreCircle,
            { backgroundColor: performanceScore >= 80 ? theme.success : performanceScore >= 60 ? theme.warning : theme.error }
          ]}>
            <Text style={styles.scoreText}>{performanceScore}</Text>
          </View>
          <Text style={styles.scoreLabel}>Overall Performance Score</Text>
        </View>

        {/* Key Metrics */}
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <Text style={[styles.metricValue, { color: theme.primary }]}>
              {guildMetrics.memberCount}
            </Text>
            <Text style={styles.metricLabel}>Active Members</Text>
          </View>

          <View style={styles.metricCard}>
            <Text style={[styles.metricValue, { color: theme.success }]}>
              {guildMetrics.completedTasks}
            </Text>
            <Text style={styles.metricLabel}>Tasks Completed</Text>
          </View>

          <View style={styles.metricCard}>
            <Text style={[styles.metricValue, { color: theme.warning }]}>
              {guildMetrics.averageRating.toFixed(1)}
            </Text>
            <Text style={styles.metricLabel}>Average Rating</Text>
          </View>

          <View style={styles.metricCard}>
            <Text style={[styles.metricValue, { color: theme.info }]}>
              {formatNumber(guildMetrics.totalEarnings, 'QAR')}
            </Text>
            <Text style={styles.metricLabel}>Total Earnings</Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderBenchmarks = () => (
    <View>
      {benchmarks.map((benchmark, index) => (
        <View key={index} style={styles.benchmarkCard}>
          <View style={styles.benchmarkHeader}>
            <Text style={styles.benchmarkTitle}>{benchmark.metric}</Text>
            <View style={[styles.trendBadge, { backgroundColor: getTrendColor(benchmark.trend) }]}>
              <Ionicons 
                name={getTrendIcon(benchmark.trend)} 
                size={12} 
                color="white" 
              />
              <Text style={styles.trendText}>
                {benchmark.changePercent > 0 ? '+' : ''}{benchmark.changePercent.toFixed(1)}%
              </Text>
            </View>
          </View>

          <View style={styles.benchmarkValues}>
            <View style={styles.benchmarkValue}>
              <Text style={styles.benchmarkValueLabel}>Your Guild</Text>
              <Text style={[styles.benchmarkValueText, { color: theme.primary }]}>
                {formatNumber(benchmark.yourGuild, benchmark.unit)}
              </Text>
            </View>

            <View style={styles.benchmarkValue}>
              <Text style={styles.benchmarkValueLabel}>Industry Avg</Text>
              <Text style={[styles.benchmarkValueText, { color: theme.textSecondary }]}>
                {formatNumber(benchmark.industryAverage, benchmark.unit)}
              </Text>
            </View>

            <View style={styles.benchmarkValue}>
              <Text style={styles.benchmarkValueLabel}>Top Performer</Text>
              <Text style={[styles.benchmarkValueText, { color: theme.success }]}>
                {formatNumber(benchmark.topPerformer, benchmark.unit)}
              </Text>
            </View>
          </View>
        </View>
      ))}
    </View>
  );

  const renderMembers = () => (
    <View>
      {memberPerformance.map((member, index) => (
        <View key={member.memberId} style={styles.memberCard}>
          <View style={styles.memberHeader}>
            <View style={styles.memberAvatar}>
              <Text style={styles.memberAvatarText}>
                {member.memberName.split(' ').map(n => n[0]).join('')}
              </Text>
            </View>
            <View style={styles.memberInfo}>
              <Text style={styles.memberName}>{member.memberName}</Text>
              <Text style={styles.memberRole}>{member.role}</Text>
            </View>
          </View>

          <View style={styles.memberStats}>
            <View style={styles.memberStat}>
              <Text style={styles.memberStatValue}>{member.tasksCompleted}</Text>
              <Text style={styles.memberStatLabel}>Tasks</Text>
            </View>

            <View style={styles.memberStat}>
              <Text style={[styles.memberStatValue, { color: theme.success }]}>
                {formatNumber(member.earnings, 'QAR')}
              </Text>
              <Text style={styles.memberStatLabel}>Earnings</Text>
            </View>

            <View style={styles.memberStat}>
              <Text style={[styles.memberStatValue, { color: theme.warning }]}>
                {member.rating.toFixed(1)}
              </Text>
              <Text style={styles.memberStatLabel}>Rating</Text>
            </View>

            <View style={styles.memberStat}>
              <Text style={[styles.memberStatValue, { color: theme.info }]}>
                {member.efficiency}%
              </Text>
              <Text style={styles.memberStatLabel}>Efficiency</Text>
            </View>
          </View>
        </View>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Performance Benchmarks',
          headerStyle: { backgroundColor: theme.surface },
          headerTintColor: theme.textPrimary,
          headerTitleStyle: { fontFamily: FONT_FAMILY },
        }}
      />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Guild Performance Analytics</Text>
        <Text style={styles.headerDescription}>
          Compare your guild's performance against industry benchmarks and track member productivity.
        </Text>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.headerButton, styles.headerButtonSecondary]}
            onPress={() => router.push('/(modals)/guild-analytics')}
          >
            <Ionicons name="analytics-outline" size={16} color={theme.textPrimary} />
            <Text style={[styles.headerButtonText, styles.headerButtonTextSecondary]}>
              Full Analytics
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleRefreshData}
            disabled={refreshing}
          >
            {refreshing ? (
              <ActivityIndicator size="small" color={getContrastTextColor(theme.primary)} />
            ) : (
              <Ionicons name="refresh" size={16} color={getContrastTextColor(theme.primary)} />
            )}
            <Text style={styles.headerButtonText}>
              {refreshing ? 'Refreshing...' : 'Refresh Data'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        {(['overview', 'benchmarks', 'members'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, selectedTab === tab && styles.tabActive]}
            onPress={() => setSelectedTab(tab)}
          >
            <Text style={[
              styles.tabText,
              selectedTab === tab && styles.tabTextActive
            ]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Period Selector */}
      <View style={styles.periodSelector}>
        <View style={styles.periodRow}>
          <Text style={styles.periodLabel}>Time Period</Text>
          <View style={styles.periodButtons}>
            {(['week', 'month', 'quarter', 'year'] as const).map((period) => (
              <TouchableOpacity
                key={period}
                style={[
                  styles.periodButton,
                  selectedPeriod === period && styles.periodButtonActive
                ]}
                onPress={() => setSelectedPeriod(period)}
              >
                <Text style={[
                  styles.periodButtonText,
                  selectedPeriod === period && styles.periodButtonTextActive
                ]}>
                  {period}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {selectedTab === 'overview' && renderOverview()}
        {selectedTab === 'benchmarks' && renderBenchmarks()}
        {selectedTab === 'members' && renderMembers()}
      </ScrollView>

      <AlertComponent />
    </View>
  );
}
