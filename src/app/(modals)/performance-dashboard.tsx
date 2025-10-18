import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useI18n } from '../../contexts/I18nProvider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { 
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Briefcase,
  Star,
  Target,
  Award,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { BackendUserService, BackendAnalyticsService } from '../../config/backend';

const { width } = Dimensions.get('window');
const FONT_FAMILY = 'Signika Negative SC';

// Advanced Light Mode Color Helper
const getAdaptiveColors = (theme: any, isDark: boolean) => ({
  background: isDark ? theme.background : '#F5F5F5',
  cardBackground: isDark ? theme.surface : '#FFFFFF',
  cardBorder: isDark ? theme.border : 'rgba(0, 0, 0, 0.08)',
  primaryText: isDark ? theme.textPrimary : '#000000',
  secondaryText: isDark ? theme.textSecondary : '#666666',
  iconColor: isDark ? theme.textSecondary : '#666666',
  cardShadow: isDark 
    ? { shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8 }
    : { shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 12 },
});

interface PerformanceMetric {
  label: string;
  value: string;
  change: number;
  icon: string;
  color: string;
}

interface ChartData {
  label: string;
  value: number;
  color: string;
}

// Helper function to get Lucide icon component
const getLucideIcon = (iconName: string, color: string, size: number = 20) => {
  const iconProps = { size, color };
  
  switch(iconName) {
    case 'checkmark-circle':
    case 'check-circle':
      return <Award {...iconProps} />;
    case 'star':
      return <Star {...iconProps} />;
    case 'wallet':
    case 'cash':
      return <DollarSign {...iconProps} />;
    case 'briefcase':
      return <Briefcase {...iconProps} />;
    case 'time':
    case 'clock':
      return <Activity {...iconProps} />;
    case 'trophy':
      return <Award {...iconProps} />;
    case 'heart':
      return <Star {...iconProps} />;
    case 'flash':
    case 'zap':
      return <Activity {...iconProps} />;
    case 'analytics':
      return <BarChart3 {...iconProps} />;
    case 'people':
      return <Users {...iconProps} />;
    case 'trending-up':
      return <TrendingUp {...iconProps} />;
    case 'trending-down':
      return <TrendingDown {...iconProps} />;
    default:
      return <Activity {...iconProps} />;
  }
};

export default function PerformanceDashboardScreen() {
  const { theme, isDarkMode } = useTheme();
  const { t, isRTL } = useI18n();
  const insets = useSafeAreaInsets();
  
  const adaptiveColors = React.useMemo(() => getAdaptiveColors(theme, isDarkMode), [theme, isDarkMode]);

  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [selectedTab, setSelectedTab] = useState<'overview' | 'revenue' | 'clients' | 'market'>('overview');
  const [performanceData, setPerformanceData] = useState<PerformanceMetric[]>([]);
  const [loading, setLoading] = useState(true);

  // Load performance data from backend
  React.useEffect(() => {
    const loadPerformanceData = async () => {
      try {
        setLoading(true);
        const userId = 'current-user-id'; // Get from auth context
        const endDate = new Date().toISOString();
        const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days ago
        
        const analytics = await BackendUserService.getUserAnalytics(userId, startDate, endDate);
        
        if (analytics) {
          // Transform backend data to performance metrics
          const metrics = transformAnalyticsToMetrics(analytics);
          setPerformanceData(metrics);
        } else {
          // Fallback to mock data
          setPerformanceData(mockPerformanceMetrics);
        }
      } catch (error) {
        console.log('Backend not available, using mock data:', error);
        setPerformanceData(mockPerformanceMetrics);
      } finally {
        setLoading(false);
      }
    };

    loadPerformanceData();
  }, [selectedPeriod]);

  // Transform backend analytics to UI metrics
  const transformAnalyticsToMetrics = (analytics: any): PerformanceMetric[] => {
    return [
      {
        label: 'Success Rate',
        value: `${analytics.successRate || 94.5}%`,
        change: analytics.successRateChange || +2.3,
        icon: 'checkmark-circle',
        color: theme.success
      },
      {
        label: 'Avg. Rating',
        value: `${analytics.averageRating || 4.8}/5`,
        change: analytics.ratingChange || +0.2,
        icon: 'star',
        color: theme.warning
      },
      {
        label: 'Total Earnings',
        value: `$${analytics.totalEarnings || 12450}`,
        change: analytics.earningsChange || +15.7,
        icon: 'wallet',
        color: theme.primary
      },
      {
        label: 'Jobs Completed',
        value: `${analytics.completedJobs || 28}`,
        change: analytics.jobsChange || +4,
        icon: 'briefcase',
        color: theme.info
      }
    ];
  };

  // Mock performance data (fallback)
  const mockPerformanceMetrics: PerformanceMetric[] = [
    {
      label: 'Success Rate',
      value: '94.5%',
      change: +2.3,
      icon: 'checkmark-circle',
      color: theme.success
    },
    {
      label: 'Avg. Rating',
      value: '4.8/5',
      change: +0.2,
      icon: 'star',
      color: theme.warning
    },
    {
      label: 'Response Time',
      value: '2.4h',
      change: -0.5,
      icon: 'time',
      color: theme.info
    },
    {
      label: 'Completion Rate',
      value: '98.2%',
      change: +1.1,
      icon: 'trophy',
      color: theme.primary
    }
  ];

  // Mock earnings data for chart
  const earningsData: ChartData[] = [
    { label: 'Jan', value: 12500, color: theme.primary },
    { label: 'Feb', value: 15800, color: theme.primary },
    { label: 'Mar', value: 18200, color: theme.primary },
    { label: 'Apr', value: 16900, color: theme.primary },
    { label: 'May', value: 21300, color: theme.primary },
    { label: 'Jun', value: 19750, color: theme.primary },
  ];

  // Mock skill performance
  const skillPerformance = [
    { skill: 'React Native', demand: 95, earnings: 28500, projects: 12, rating: 4.9 },
    { skill: 'UI/UX Design', demand: 88, earnings: 22300, projects: 8, rating: 4.8 },
    { skill: 'Node.js', demand: 82, earnings: 19800, projects: 6, rating: 4.7 },
    { skill: 'Flutter', demand: 76, earnings: 15600, projects: 4, rating: 4.6 },
    { skill: 'GraphQL', demand: 71, earnings: 12400, projects: 3, rating: 4.8 },
  ];

  // Mock recent achievements
  const recentAchievements = [
    {
      id: '1',
      title: 'Top Performer',
      description: 'Ranked in top 5% this month',
      date: '2024-01-15',
      icon: 'trophy',
      color: theme.warning
    },
    {
      id: '2',
      title: 'Client Favorite',
      description: '10 five-star reviews in a row',
      date: '2024-01-12',
      icon: 'heart',
      color: theme.error
    },
    {
      id: '3',
      title: 'Speed Demon',
      description: 'Delivered 3 projects ahead of schedule',
      date: '2024-01-10',
      icon: 'flash',
      color: theme.info
    }
  ];

  // Mock revenue analytics data
  const revenueAnalytics = {
    totalRevenue: 125400,
    monthlyGrowth: 12.5,
    averageProjectValue: 2850,
    topPayingClients: [
      { name: 'TechCorp Solutions', revenue: 15600, projects: 3 },
      { name: 'Digital Innovations', revenue: 12800, projects: 2 },
      { name: 'StartupHub', revenue: 9200, projects: 4 },
    ],
    revenueByCategory: [
      { category: 'Mobile Development', revenue: 45600, percentage: 36.4 },
      { category: 'Web Development', revenue: 32800, percentage: 26.2 },
      { category: 'UI/UX Design', revenue: 28200, percentage: 22.5 },
      { category: 'Consulting', revenue: 18800, percentage: 15.0 },
    ]
  };

  // Mock client analytics data
  const clientAnalytics = {
    totalClients: 47,
    activeClients: 23,
    newClientsThisMonth: 8,
    clientRetentionRate: 89.4,
    clientSatisfactionScore: 4.8,
    clientsByRegion: [
      { region: 'Qatar', count: 18, percentage: 38.3 },
      { region: 'UAE', count: 12, percentage: 25.5 },
      { region: 'Saudi Arabia', count: 9, percentage: 19.1 },
      { region: 'Kuwait', count: 5, percentage: 10.6 },
      { region: 'Other', count: 3, percentage: 6.4 },
    ]
  };

  // Mock market insights data
  const marketInsights = {
    marketDemand: 'High',
    competitionLevel: 'Medium',
    averageMarketRate: 3200,
    yourRate: 2850,
    marketPosition: 'Top 15%',
    trendingSkills: [
      { skill: 'React Native', demand: '+25%', growth: 'rising' },
      { skill: 'Flutter', demand: '+18%', growth: 'rising' },
      { skill: 'Node.js', demand: '+12%', growth: 'stable' },
      { skill: 'GraphQL', demand: '+8%', growth: 'stable' },
      { skill: 'Vue.js', demand: '-5%', growth: 'declining' },
    ],
    upcomingOpportunities: [
      { title: 'E-commerce Platform', budget: '15,000-25,000 QR', deadline: '2 weeks' },
      { title: 'Healthcare App', budget: '20,000-30,000 QR', deadline: '1 month' },
      { title: 'FinTech Dashboard', budget: '12,000-18,000 QR', deadline: '3 weeks' },
    ]
  };

  const periods = [
    { key: 'week', label: 'Week' },
    { key: 'month', label: 'Month' },
    { key: 'quarter', label: 'Quarter' },
    { key: 'year', label: 'Year' },
  ];

  const maxEarnings = Math.max(...earningsData.map(d => d.value));

  const renderBarChart = () => {
    return (
      <View style={styles.chartContainer}>
        <View style={styles.chartBars}>
          {earningsData.map((data, index) => {
            const height = (data.value / maxEarnings) * 120;
            return (
              <View key={index} style={styles.barContainer}>
                <View style={[styles.barBackground, { height: 120 }]}>
                  <LinearGradient
                    colors={[data.color, data.color + '80']}
                    style={[styles.bar, { height }]}
                  />
                </View>
                <Text style={[styles.barLabel, { color: theme.textSecondary }]}>
                  {data.label}
                </Text>
                <Text style={[styles.barValue, { color: theme.textPrimary }]}>
                  {(data.value / 1000).toFixed(1)}k
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: adaptiveColors.background, paddingTop: insets.top + 10 }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.back();
            }}
          >
            <ArrowLeft size={24} color={theme.primary} />
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <Activity size={24} color={theme.primary} />
            <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
              Performance
            </Text>
          </View>
          
          <TouchableOpacity
            style={styles.headerActionButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/(modals)/performance-benchmarks');
            }}
          >
            <BarChart3 size={24} color={theme.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Period Selector */}
        <View style={[styles.section, { backgroundColor: adaptiveColors.cardBackground, borderColor: theme.border }]}>
          <View style={styles.periodSelector}>
            {periods.map((period) => (
              <TouchableOpacity
                key={period.key}
                style={[
                  styles.periodButton,
                  { 
                    backgroundColor: selectedPeriod === period.key ? theme.primary + '20' : 'transparent',
                    borderColor: selectedPeriod === period.key ? theme.primary : theme.border,
                  }
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedPeriod(period.key as any);
                }}
              >
                <Text style={[
                  styles.periodButtonText,
                  { color: selectedPeriod === period.key ? theme.primary : theme.textSecondary }
                ]}>
                  {period.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Tab Navigation */}
        <View style={[styles.tabContainer, { backgroundColor: adaptiveColors.cardBackground, borderColor: theme.border }]}>
          {[
            { key: 'overview', label: 'Overview', icon: 'analytics' },
            { key: 'revenue', label: 'Revenue', icon: 'cash' },
            { key: 'clients', label: 'Clients', icon: 'people' },
            { key: 'market', label: 'Market', icon: 'trending-up' },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tab,
                selectedTab === tab.key && { backgroundColor: theme.primary }
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSelectedTab(tab.key as any);
              }}
              activeOpacity={0.7}
            >
              {getLucideIcon(
                tab.icon,
                selectedTab === tab.key ? '#000000' : theme.textSecondary,
                16
              )}
              <Text style={[
                styles.tabText,
                { color: selectedTab === tab.key ? '#000000' : theme.textSecondary }
              ]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Conditional Content */}
        {selectedTab === 'overview' && (
          <>
        {/* Performance Metrics */}
        <View style={[styles.section, { backgroundColor: adaptiveColors.cardBackground, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
            Key Metrics
          </Text>
          
          <View style={styles.metricsGrid}>
            {(performanceData.length > 0 ? performanceData : mockPerformanceMetrics).map((metric, index) => (
              <View key={index} style={[styles.metricCard, { backgroundColor: adaptiveColors.background, borderColor: theme.border }]}>
                <View style={[styles.metricHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  <View style={[styles.metricIcon, { backgroundColor: metric.color + '20' }]}>
                    {getLucideIcon(metric.icon, metric.color, 20)}
                  </View>
                  <View style={[
                    styles.changeIndicator,
                    { 
                      backgroundColor: metric.change >= 0 ? theme.success + '20' : theme.error + '20',
                      flexDirection: isRTL ? 'row-reverse' : 'row'
                    }
                  ]}>
                    {metric.change >= 0 ? (
                      <TrendingUp size={12} color={theme.success} />
                    ) : (
                      <TrendingDown size={12} color={theme.error} />
                    )}
                    <Text style={[
                      styles.changeText,
                      { 
                        color: metric.change >= 0 ? theme.success : theme.error,
                        marginLeft: isRTL ? 0 : 4,
                        marginRight: isRTL ? 4 : 0
                      }
                    ]}>
                      {metric.change >= 0 ? '+' : ''}{metric.change}%
                    </Text>
                  </View>
                </View>
                
                <Text style={[styles.metricValue, { color: theme.textPrimary }]}>
                  {metric.value}
                </Text>
                <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>
                  {metric.label}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Earnings Chart */}
        <View style={[styles.section, { backgroundColor: adaptiveColors.cardBackground, borderColor: theme.border }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
              Earnings Trend
            </Text>
            <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
              Last 6 months
            </Text>
          </View>
          
          {renderBarChart()}
        </View>

        {/* Skill Performance */}
        <View style={[styles.section, { backgroundColor: adaptiveColors.cardBackground, borderColor: theme.border }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
              Skill Performance
            </Text>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                console.log('Navigate to skill analytics');
              }}
            >
              <Text style={[styles.viewAllText, { color: theme.primary }]}>
                View All
              </Text>
            </TouchableOpacity>
          </View>

          {skillPerformance.slice(0, 3).map((skill, index) => (
            <View key={index} style={[styles.skillItem, { borderColor: theme.border }]}>
              <View style={styles.skillLeft}>
                <Text style={[styles.skillName, { color: theme.textPrimary }]}>
                  {skill.skill}
                </Text>
                <View style={styles.skillStats}>
                  <View style={styles.skillStat}>
                    <TrendingUp size={14} color={theme.success} />
                    <Text style={[styles.skillStatText, { color: theme.success }]}>
                      {skill.demand}% demand
                    </Text>
                  </View>
                  <View style={styles.skillStat}>
                    <Star size={14} color={theme.warning} />
                    <Text style={[styles.skillStatText, { color: theme.textSecondary }]}>
                      {skill.rating}
                    </Text>
                  </View>
                </View>
              </View>
              
              <View style={styles.skillRight}>
                <Text style={[styles.skillEarnings, { color: theme.textPrimary }]}>
                  {(skill.earnings / 1000).toFixed(1)}k QAR
                </Text>
                <Text style={[styles.skillProjects, { color: theme.textSecondary }]}>
                  {skill.projects} projects
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Recent Achievements */}
        <View style={[styles.section, { backgroundColor: adaptiveColors.cardBackground, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
            Recent Achievements
          </Text>

          {recentAchievements.map((achievement) => (
            <View key={achievement.id} style={[styles.achievementItem, { borderColor: theme.border }]}>
              <View style={[styles.achievementIcon, { backgroundColor: achievement.color + '20' }]}>
                {getLucideIcon(achievement.icon, achievement.color, 20)}
              </View>
              
              <View style={styles.achievementContent}>
                <Text style={[styles.achievementTitle, { color: theme.textPrimary }]}>
                  {achievement.title}
                </Text>
                <Text style={[styles.achievementDescription, { color: theme.textSecondary }]}>
                  {achievement.description}
                </Text>
                <Text style={[styles.achievementDate, { color: theme.textSecondary }]}>
                  {new Date(achievement.date).toLocaleDateString()}
                </Text>
              </View>
            </View>
          ))}
        </View>

          </>
        )}

        {/* Revenue Analytics Tab */}
        {selectedTab === 'revenue' && (
          <View style={[styles.section, { backgroundColor: adaptiveColors.cardBackground, borderColor: theme.border }]}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
              Revenue Analytics
            </Text>
            
            {/* Revenue Summary */}
            <View style={styles.revenueGrid}>
              <View style={[styles.revenueCard, { backgroundColor: adaptiveColors.background, borderColor: theme.border }]}>
                <Text style={[styles.revenueValue, { color: theme.primary }]}>
                  QR {revenueAnalytics.totalRevenue.toLocaleString()}
                </Text>
                <Text style={[styles.revenueLabel, { color: theme.textSecondary }]}>
                  Total Revenue
                </Text>
              </View>
              <View style={[styles.revenueCard, { backgroundColor: adaptiveColors.background, borderColor: theme.border }]}>
                <Text style={[styles.revenueValue, { color: theme.success }]}>
                  +{revenueAnalytics.monthlyGrowth}%
                </Text>
                <Text style={[styles.revenueLabel, { color: theme.textSecondary }]}>
                  Monthly Growth
                </Text>
              </View>
            </View>

            {/* Revenue by Category */}
            <View style={[styles.categorySection, { backgroundColor: adaptiveColors.background, borderColor: theme.border }]}>
              <Text style={[styles.categoryTitle, { color: theme.textPrimary }]}>
                Revenue by Category
              </Text>
              {revenueAnalytics.revenueByCategory.map((category, index) => (
                <View key={index} style={styles.categoryItem}>
                  <View style={styles.categoryInfo}>
                    <Text style={[styles.categoryName, { color: theme.textPrimary }]}>
                      {category.category}
                    </Text>
                    <Text style={[styles.categoryRevenue, { color: theme.primary }]}>
                      QR {category.revenue.toLocaleString()}
                    </Text>
                  </View>
                  <View style={styles.categoryBar}>
                    <View 
                      style={[
                        styles.categoryProgress, 
                        { 
                          width: `${category.percentage}%`,
                          backgroundColor: theme.primary 
                        }
                      ]} 
                    />
                  </View>
                  <Text style={[styles.categoryPercentage, { color: theme.textSecondary }]}>
                    {category.percentage}%
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Client Analytics Tab */}
        {selectedTab === 'clients' && (
          <View style={[styles.section, { backgroundColor: adaptiveColors.cardBackground, borderColor: theme.border }]}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
              Client Analytics
            </Text>
            
            {/* Client Stats */}
            <View style={styles.clientStatsGrid}>
              <View style={[styles.clientStatCard, { backgroundColor: adaptiveColors.background, borderColor: theme.border }]}>
                <Text style={[styles.clientStatValue, { color: theme.primary }]}>
                  {clientAnalytics.totalClients}
                </Text>
                <Text style={[styles.clientStatLabel, { color: theme.textSecondary }]}>
                  Total Clients
                </Text>
              </View>
              <View style={[styles.clientStatCard, { backgroundColor: adaptiveColors.background, borderColor: theme.border }]}>
                <Text style={[styles.clientStatValue, { color: theme.success }]}>
                  {clientAnalytics.activeClients}
                </Text>
                <Text style={[styles.clientStatLabel, { color: theme.textSecondary }]}>
                  Active Clients
                </Text>
              </View>
              <View style={[styles.clientStatCard, { backgroundColor: adaptiveColors.background, borderColor: theme.border }]}>
                <Text style={[styles.clientStatValue, { color: theme.info }]}>
                  {clientAnalytics.clientRetentionRate}%
                </Text>
                <Text style={[styles.clientStatLabel, { color: theme.textSecondary }]}>
                  Retention Rate
                </Text>
              </View>
            </View>

            {/* Clients by Region */}
            <View style={[styles.regionSection, { backgroundColor: adaptiveColors.background, borderColor: theme.border }]}>
              <Text style={[styles.regionTitle, { color: theme.textPrimary }]}>
                Clients by Region
              </Text>
              {clientAnalytics.clientsByRegion.map((region, index) => (
                <View key={index} style={styles.regionItem}>
                  <Text style={[styles.regionName, { color: theme.textPrimary }]}>
                    {region.region}
                  </Text>
                  <View style={styles.regionStats}>
                    <Text style={[styles.regionCount, { color: theme.primary }]}>
                      {region.count}
                    </Text>
                    <Text style={[styles.regionPercentage, { color: theme.textSecondary }]}>
                      ({region.percentage}%)
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Market Insights Tab */}
        {selectedTab === 'market' && (
          <View style={[styles.section, { backgroundColor: adaptiveColors.cardBackground, borderColor: theme.border }]}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
              Market Insights
            </Text>
            
            {/* Market Overview */}
            <View style={[styles.marketOverview, { backgroundColor: adaptiveColors.background, borderColor: theme.border }]}>
              <View style={styles.marketStat}>
                <Text style={[styles.marketLabel, { color: theme.textSecondary }]}>Market Position</Text>
                <Text style={[styles.marketValue, { color: theme.primary }]}>
                  {marketInsights.marketPosition}
                </Text>
              </View>
              <View style={styles.marketStat}>
                <Text style={[styles.marketLabel, { color: theme.textSecondary }]}>Your Rate</Text>
                <Text style={[styles.marketValue, { color: theme.textPrimary }]}>
                  QR {marketInsights.yourRate}
                </Text>
              </View>
              <View style={styles.marketStat}>
                <Text style={[styles.marketLabel, { color: theme.textSecondary }]}>Market Average</Text>
                <Text style={[styles.marketValue, { color: theme.textSecondary }]}>
                  QR {marketInsights.averageMarketRate}
                </Text>
              </View>
            </View>

            {/* Trending Skills */}
            <View style={[styles.trendingSection, { backgroundColor: adaptiveColors.background, borderColor: theme.border }]}>
              <Text style={[styles.trendingTitle, { color: theme.textPrimary }]}>
                Trending Skills
              </Text>
              {marketInsights.trendingSkills.map((skill, index) => (
                <View key={index} style={styles.trendingItem}>
                  <Text style={[styles.trendingSkill, { color: theme.textPrimary }]}>
                    {skill.skill}
                  </Text>
                  <View style={styles.trendingStats}>
                    <Text style={[
                      styles.trendingDemand,
                      { color: skill.growth === 'rising' ? theme.success : skill.growth === 'stable' ? theme.info : theme.error }
                    ]}>
                      {skill.demand}
                    </Text>
                    {skill.growth === 'rising' ? (
                      <TrendingUp size={16} color={theme.success} />
                    ) : skill.growth === 'stable' ? (
                      <Activity size={16} color={theme.info} />
                    ) : (
                      <TrendingDown size={16} color={theme.error} />
                    )}
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={{ height: insets.bottom + 20 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
  },
  headerActionButton: {
    padding: 8,
    borderRadius: 20,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
  },
  sectionSubtitle: {
    fontSize: 14,
    fontFamily: FONT_FAMILY,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: FONT_FAMILY,
  },
  periodSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: FONT_FAMILY,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricCard: {
    flex: 1,
    minWidth: (width - 64) / 2,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  metricIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  changeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    gap: 2,
  },
  changeText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 14,
    fontFamily: FONT_FAMILY,
  },
  chartContainer: {
    height: 180,
    justifyContent: 'flex-end',
  },
  chartBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 160,
    paddingHorizontal: 8,
  },
  barContainer: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 2,
  },
  barBackground: {
    width: '80%',
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 4,
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  bar: {
    width: '100%',
    borderRadius: 4,
  },
  barLabel: {
    fontSize: 12,
    fontFamily: FONT_FAMILY,
    marginBottom: 2,
  },
  barValue: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
  },
  skillItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  skillLeft: {
    flex: 1,
  },
  skillName: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: FONT_FAMILY,
    marginBottom: 4,
  },
  skillStats: {
    flexDirection: 'row',
    gap: 12,
  },
  skillStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  skillStatText: {
    fontSize: 12,
    fontFamily: FONT_FAMILY,
  },
  skillRight: {
    alignItems: 'flex-end',
  },
  skillEarnings: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
    marginBottom: 2,
  },
  skillProjects: {
    fontSize: 12,
    fontFamily: FONT_FAMILY,
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  achievementIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  achievementContent: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
    marginBottom: 2,
  },
  achievementDescription: {
    fontSize: 14,
    fontFamily: FONT_FAMILY,
    marginBottom: 2,
  },
  achievementDate: {
    fontSize: 12,
    fontFamily: FONT_FAMILY,
  },
  // Tab styles
  tabContainer: {
    flexDirection: 'row',
    margin: 16,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  tabText: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '600',
  },
  // Revenue Analytics styles
  revenueGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  revenueCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  revenueValue: {
    fontFamily: FONT_FAMILY,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4,
  },
  revenueLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '500',
  },
  categorySection: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  categoryTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  categoryItem: {
    marginBottom: 16,
  },
  categoryInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryName: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: '500',
  },
  categoryRevenue: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: '700',
  },
  categoryBar: {
    height: 6,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 3,
    marginBottom: 4,
  },
  categoryProgress: {
    height: '100%',
    borderRadius: 3,
  },
  categoryPercentage: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'right',
  },
  // Client Analytics styles
  clientStatsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  clientStatCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  clientStatValue: {
    fontFamily: FONT_FAMILY,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  clientStatLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
  },
  regionSection: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  regionTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  regionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  regionName: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: '500',
  },
  regionStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  regionCount: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: '700',
  },
  regionPercentage: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '500',
  },
  // Market Insights styles
  marketOverview: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  marketStat: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  marketLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: '500',
  },
  marketValue: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: '700',
  },
  trendingSection: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  trendingTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  trendingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  trendingSkill: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: '500',
  },
  trendingStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  trendingDemand: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '600',
  },
});



