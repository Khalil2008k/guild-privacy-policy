import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useI18n } from '@/contexts/I18nProvider';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { CustomAlertService } from '@/services/CustomAlertService';
import { BackendAPI } from '@/config/backend';

const { width } = Dimensions.get('window');

interface AnalyticsData {
  userGrowth: {
    total: number;
    monthly: number;
    weekly: number;
    daily: number;
    growthRate: number;
  };
  jobMetrics: {
    total: number;
    completed: number;
    active: number;
    cancelled: number;
    completionRate: number;
  };
  revenueMetrics: {
    total: number;
    monthly: number;
    weekly: number;
    daily: number;
    growthRate: number;
  };
  guildMetrics: {
    total: number;
    active: number;
    newThisMonth: number;
    averageMembers: number;
  };
  performanceMetrics: {
    avgResponseTime: number;
    errorRate: number;
    uptime: number;
    userSatisfaction: number;
  };
  trends: {
    userEngagement: number[];
    jobPostings: number[];
    revenue: number[];
    guildActivity: number[];
  };
}

export default function AdminAnalyticsDashboard() {
  const { theme } = useTheme();
  const { t, isRTL } = useI18n();
  const insets = useSafeAreaInsets();
  const [activePeriod, setActivePeriod] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [refreshing, setRefreshing] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalyticsData();
  }, [activePeriod]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      const response = await BackendAPI.get(`/analytics/dashboard?period=${activePeriod}`);
      setAnalyticsData(response.data);
    } catch (error) {
      console.error('Error loading analytics data:', error);
      CustomAlertService.showError(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'فشل تحميل بيانات التحليلات' : 'Failed to load analytics data'
      );
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAnalyticsData();
    setRefreshing(false);
  };

  const exportAnalytics = async (format: 'pdf' | 'excel' | 'csv') => {
    try {
      const response = await BackendAPI.post('/analytics/export', {
        format,
        period: activePeriod,
        data: analyticsData
      });
      
      CustomAlertService.showSuccess(
        isRTL ? 'نجح' : 'Success',
        isRTL ? `تم تصدير البيانات بصيغة ${format.toUpperCase()}` : `Data exported as ${format.toUpperCase()}`
      );
    } catch (error) {
      console.error('Error exporting analytics:', error);
      CustomAlertService.showError(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'فشل تصدير البيانات' : 'Failed to export data'
      );
    }
  };

  const renderPeriodSelector = () => (
    <View style={styles.periodSelector}>
      {[
        { key: '7d', label: isRTL ? '7 أيام' : '7 Days' },
        { key: '30d', label: isRTL ? '30 يوم' : '30 Days' },
        { key: '90d', label: isRTL ? '90 يوم' : '90 Days' },
        { key: '1y', label: isRTL ? 'سنة' : '1 Year' },
      ].map((period) => (
        <TouchableOpacity
          key={period.key}
          style={[
            styles.periodButton,
            { 
              backgroundColor: activePeriod === period.key ? theme.primary : theme.surface,
              borderColor: theme.primary
            }
          ]}
          onPress={() => setActivePeriod(period.key as any)}
        >
          <Text style={[
            styles.periodButtonText,
            { color: activePeriod === period.key ? '#FFFFFF' : theme.primary }
          ]}>
            {period.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderMetricCard = (title: string, value: string | number, subtitle?: string, icon?: string, color?: string) => (
    <View style={[styles.metricCard, { backgroundColor: theme.surface }]}>
      <View style={styles.metricHeader}>
        {icon && (
          <View style={[styles.metricIcon, { backgroundColor: (color || theme.primary) + '20' }]}>
            <Ionicons name={icon as any} size={20} color={color || theme.primary} />
          </View>
        )}
        <Text style={[styles.metricTitle, { color: theme.textSecondary }]}>
          {title}
        </Text>
      </View>
      <Text style={[styles.metricValue, { color: theme.textPrimary }]}>
        {value}
      </Text>
      {subtitle && (
        <Text style={[styles.metricSubtitle, { color: theme.textSecondary }]}>
          {subtitle}
        </Text>
      )}
    </View>
  );

  const renderTrendChart = (title: string, data: number[], color: string) => (
    <View style={[styles.chartCard, { backgroundColor: theme.surface }]}>
      <Text style={[styles.chartTitle, { color: theme.textPrimary }]}>
        {title}
      </Text>
      <View style={styles.chartContainer}>
        <View style={styles.chart}>
          {data.map((value, index) => (
            <View
              key={index}
              style={[
                styles.chartBar,
                {
                  height: (value / Math.max(...data)) * 100,
                  backgroundColor: color,
                  width: `${100 / data.length}%`,
                }
              ]}
            />
          ))}
        </View>
        <View style={styles.chartLabels}>
          {data.map((_, index) => (
            <Text key={index} style={[styles.chartLabel, { color: theme.textSecondary }]}>
              {index + 1}
            </Text>
          ))}
        </View>
      </View>
    </View>
  );

  const renderUserGrowthSection = () => {
    if (!analyticsData) return null;

    return (
      <View style={[styles.section, { backgroundColor: theme.surface }]}>
        <View style={styles.sectionHeader}>
          <Ionicons name="people" size={24} color={theme.primary} />
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
            {isRTL ? 'نمو المستخدمين' : 'User Growth'}
          </Text>
        </View>
        <View style={styles.metricsGrid}>
          {renderMetricCard(
            isRTL ? 'إجمالي المستخدمين' : 'Total Users',
            analyticsData.userGrowth.total.toLocaleString(),
            `+${analyticsData.userGrowth.growthRate.toFixed(1)}% ${isRTL ? 'هذا الشهر' : 'this month'}`,
            'person',
            '#4CAF50'
          )}
          {renderMetricCard(
            isRTL ? 'مستخدمين جدد' : 'New Users',
            analyticsData.userGrowth.monthly.toLocaleString(),
            isRTL ? 'هذا الشهر' : 'This month',
            'person-add',
            '#2196F3'
          )}
          {renderMetricCard(
            isRTL ? 'نشط هذا الأسبوع' : 'Active This Week',
            analyticsData.userGrowth.weekly.toLocaleString(),
            isRTL ? 'هذا الأسبوع' : 'This week',
            'pulse',
            '#FF9800'
          )}
          {renderMetricCard(
            isRTL ? 'نشط اليوم' : 'Active Today',
            analyticsData.userGrowth.daily.toLocaleString(),
            isRTL ? 'اليوم' : 'Today',
            'today',
            '#9C27B0'
          )}
        </View>
        {renderTrendChart(
          isRTL ? 'اتجاه نمو المستخدمين' : 'User Growth Trend',
          analyticsData.trends.userEngagement,
          '#4CAF50'
        )}
      </View>
    );
  };

  const renderJobMetricsSection = () => {
    if (!analyticsData) return null;

    return (
      <View style={[styles.section, { backgroundColor: theme.surface }]}>
        <View style={styles.sectionHeader}>
          <Ionicons name="briefcase" size={24} color={theme.primary} />
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
            {isRTL ? 'مقاييس الوظائف' : 'Job Metrics'}
          </Text>
        </View>
        <View style={styles.metricsGrid}>
          {renderMetricCard(
            isRTL ? 'إجمالي الوظائف' : 'Total Jobs',
            analyticsData.jobMetrics.total.toLocaleString(),
            undefined,
            'briefcase',
            '#2196F3'
          )}
          {renderMetricCard(
            isRTL ? 'مكتملة' : 'Completed',
            analyticsData.jobMetrics.completed.toLocaleString(),
            `${analyticsData.jobMetrics.completionRate.toFixed(1)}% ${isRTL ? 'معدل الإنجاز' : 'completion rate'}`,
            'checkmark-circle',
            '#4CAF50'
          )}
          {renderMetricCard(
            isRTL ? 'نشطة' : 'Active',
            analyticsData.jobMetrics.active.toLocaleString(),
            isRTL ? 'قيد التنفيذ' : 'In progress',
            'play-circle',
            '#FF9800'
          )}
          {renderMetricCard(
            isRTL ? 'ملغية' : 'Cancelled',
            analyticsData.jobMetrics.cancelled.toLocaleString(),
            isRTL ? 'تم الإلغاء' : 'Cancelled',
            'close-circle',
            '#F44336'
          )}
        </View>
        {renderTrendChart(
          isRTL ? 'اتجاه نشر الوظائف' : 'Job Posting Trend',
          analyticsData.trends.jobPostings,
          '#2196F3'
        )}
      </View>
    );
  };

  const renderRevenueSection = () => {
    if (!analyticsData) return null;

    return (
      <View style={[styles.section, { backgroundColor: theme.surface }]}>
        <View style={styles.sectionHeader}>
          <Ionicons name="cash" size={24} color={theme.primary} />
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
            {isRTL ? 'مقاييس الإيرادات' : 'Revenue Metrics'}
          </Text>
        </View>
        <View style={styles.metricsGrid}>
          {renderMetricCard(
            isRTL ? 'إجمالي الإيرادات' : 'Total Revenue',
            `$${analyticsData.revenueMetrics.total.toLocaleString()}`,
            `+${analyticsData.revenueMetrics.growthRate.toFixed(1)}% ${isRTL ? 'نمو' : 'growth'}`,
            'cash',
            '#4CAF50'
          )}
          {renderMetricCard(
            isRTL ? 'هذا الشهر' : 'This Month',
            `$${analyticsData.revenueMetrics.monthly.toLocaleString()}`,
            isRTL ? 'إيرادات الشهر' : 'Monthly revenue',
            'calendar',
            '#2196F3'
          )}
          {renderMetricCard(
            isRTL ? 'هذا الأسبوع' : 'This Week',
            `$${analyticsData.revenueMetrics.weekly.toLocaleString()}`,
            isRTL ? 'إيرادات الأسبوع' : 'Weekly revenue',
            'time',
            '#FF9800'
          )}
          {renderMetricCard(
            isRTL ? 'اليوم' : 'Today',
            `$${analyticsData.revenueMetrics.daily.toLocaleString()}`,
            isRTL ? 'إيرادات اليوم' : 'Daily revenue',
            'today',
            '#9C27B0'
          )}
        </View>
        {renderTrendChart(
          isRTL ? 'اتجاه الإيرادات' : 'Revenue Trend',
          analyticsData.trends.revenue,
          '#4CAF50'
        )}
      </View>
    );
  };

  const renderGuildMetricsSection = () => {
    if (!analyticsData) return null;

    return (
      <View style={[styles.section, { backgroundColor: theme.surface }]}>
        <View style={styles.sectionHeader}>
          <Ionicons name="shield" size={24} color={theme.primary} />
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
            {isRTL ? 'مقاييس النقابات' : 'Guild Metrics'}
          </Text>
        </View>
        <View style={styles.metricsGrid}>
          {renderMetricCard(
            isRTL ? 'إجمالي النقابات' : 'Total Guilds',
            analyticsData.guildMetrics.total.toLocaleString(),
            undefined,
            'shield',
            '#9C27B0'
          )}
          {renderMetricCard(
            isRTL ? 'نشطة' : 'Active',
            analyticsData.guildMetrics.active.toLocaleString(),
            isRTL ? 'نقابات نشطة' : 'Active guilds',
            'checkmark-circle',
            '#4CAF50'
          )}
          {renderMetricCard(
            isRTL ? 'جديدة هذا الشهر' : 'New This Month',
            analyticsData.guildMetrics.newThisMonth.toLocaleString(),
            isRTL ? 'نقابات جديدة' : 'New guilds',
            'add-circle',
            '#2196F3'
          )}
          {renderMetricCard(
            isRTL ? 'متوسط الأعضاء' : 'Avg Members',
            analyticsData.guildMetrics.averageMembers.toFixed(1),
            isRTL ? 'عضو لكل نقابة' : 'members per guild',
            'people',
            '#FF9800'
          )}
        </View>
        {renderTrendChart(
          isRTL ? 'نشاط النقابات' : 'Guild Activity',
          analyticsData.trends.guildActivity,
          '#9C27B0'
        )}
      </View>
    );
  };

  const renderPerformanceSection = () => {
    if (!analyticsData) return null;

    return (
      <View style={[styles.section, { backgroundColor: theme.surface }]}>
        <View style={styles.sectionHeader}>
          <Ionicons name="speedometer" size={24} color={theme.primary} />
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
            {isRTL ? 'أداء النظام' : 'System Performance'}
          </Text>
        </View>
        <View style={styles.metricsGrid}>
          {renderMetricCard(
            isRTL ? 'وقت الاستجابة' : 'Response Time',
            `${analyticsData.performanceMetrics.avgResponseTime}ms`,
            isRTL ? 'متوسط الوقت' : 'Average time',
            'time',
            '#4CAF50'
          )}
          {renderMetricCard(
            isRTL ? 'معدل الخطأ' : 'Error Rate',
            `${analyticsData.performanceMetrics.errorRate.toFixed(2)}%`,
            isRTL ? 'نسبة الأخطاء' : 'Error percentage',
            'warning',
            '#F44336'
          )}
          {renderMetricCard(
            isRTL ? 'وقت التشغيل' : 'Uptime',
            `${analyticsData.performanceMetrics.uptime.toFixed(1)}%`,
            isRTL ? 'نسبة التشغيل' : 'Uptime percentage',
            'checkmark-circle',
            '#4CAF50'
          )}
          {renderMetricCard(
            isRTL ? 'رضا المستخدمين' : 'User Satisfaction',
            `${analyticsData.performanceMetrics.userSatisfaction.toFixed(1)}/5`,
            isRTL ? 'تقييم المستخدمين' : 'User rating',
            'star',
            '#FF9800'
          )}
        </View>
      </View>
    );
  };

  const renderExportSection = () => (
    <View style={[styles.section, { backgroundColor: theme.surface }]}>
      <View style={styles.sectionHeader}>
        <Ionicons name="download" size={24} color={theme.primary} />
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
          {isRTL ? 'تصدير البيانات' : 'Export Data'}
        </Text>
      </View>
      <View style={styles.exportGrid}>
        <TouchableOpacity 
          style={[styles.exportButton, { backgroundColor: '#F44336' + '20' }]}
          onPress={() => exportAnalytics('pdf')}
        >
          <Ionicons name="document-text" size={20} color="#F44336" />
          <Text style={[styles.exportButtonText, { color: '#F44336' }]}>
            PDF
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.exportButton, { backgroundColor: '#4CAF50' + '20' }]}
          onPress={() => exportAnalytics('excel')}
        >
          <Ionicons name="grid" size={20} color="#4CAF50" />
          <Text style={[styles.exportButtonText, { color: '#4CAF50' }]}>
            Excel
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.exportButton, { backgroundColor: '#2196F3' + '20' }]}
          onPress={() => exportAnalytics('csv')}
        >
          <Ionicons name="list" size={20} color="#2196F3" />
          <Text style={[styles.exportButtonText, { color: '#2196F3' }]}>
            CSV
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
        <View style={[styles.header, { backgroundColor: theme.surface }]}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={theme.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
            {isRTL ? 'لوحة التحليلات' : 'Analytics Dashboard'}
          </Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
            {isRTL ? 'جاري تحميل البيانات...' : 'Loading analytics data...'}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.surface }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
          {isRTL ? 'لوحة التحليلات' : 'Analytics Dashboard'}
        </Text>
        <TouchableOpacity onPress={onRefresh}>
          <Ionicons name="refresh" size={24} color={theme.primary} />
        </TouchableOpacity>
      </View>

      {/* Period Selector */}
      {renderPeriodSelector()}

      {/* Content */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {renderUserGrowthSection()}
        {renderJobMetricsSection()}
        {renderRevenueSection()}
        {renderGuildMetricsSection()}
        {renderPerformanceSection()}
        {renderExportSection()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  periodSelector: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 4,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  periodButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  section: {
    margin: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  metricCard: {
    width: (width - 80) / 2,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  metricTitle: {
    fontSize: 12,
    flex: 1,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  metricSubtitle: {
    fontSize: 10,
  },
  chartCard: {
    padding: 16,
    borderRadius: 8,
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  chartContainer: {
    height: 120,
  },
  chart: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  chartBar: {
    borderRadius: 2,
  },
  chartLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  chartLabel: {
    fontSize: 10,
    textAlign: 'center',
  },
  exportGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  exportButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  exportButtonText: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
});
