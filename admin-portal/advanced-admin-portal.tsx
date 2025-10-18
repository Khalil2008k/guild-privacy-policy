import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '../src/contexts/ThemeContext';
import { useI18n } from '../src/contexts/I18nProvider';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { CustomAlertService } from '../src/services/CustomAlertService';
import { BackendAPI } from '../src/config/backend';

const { width } = Dimensions.get('window');

interface SystemMetrics {
  totalUsers: number;
  activeUsers: number;
  totalJobs: number;
  activeJobs: number;
  totalGuilds: number;
  activeGuilds: number;
  totalRevenue: number;
  systemHealth: 'healthy' | 'warning' | 'critical';
  serverUptime: number;
  memoryUsage: number;
  cpuUsage: number;
  responseTime: number;
}

interface SecurityMetrics {
  failedLogins: number;
  blockedIPs: number;
  suspiciousActivities: number;
  securityAlerts: number;
  lastSecurityScan: string;
}

interface PerformanceMetrics {
  avgResponseTime: number;
  errorRate: number;
  throughput: number;
  cacheHitRate: number;
  databaseConnections: number;
}

export default function AdvancedAdminPortal() {
  const { theme } = useTheme();
  const { t, isRTL } = useI18n();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'security' | 'performance' | 'users' | 'system'>('overview');
  const [refreshing, setRefreshing] = useState(false);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null);
  const [securityMetrics, setSecurityMetrics] = useState<SecurityMetrics | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);
  const [realTimeData, setRealTimeData] = useState<any[]>([]);

  useEffect(() => {
    loadAdminData();
    // Set up real-time updates
    const interval = setInterval(loadAdminData, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const loadAdminData = async () => {
    try {
      // Load system metrics
      const systemResponse = await BackendAPI.get('/admin/system-metrics');
      setSystemMetrics(systemResponse.data);

      // Load security metrics
      const securityResponse = await BackendAPI.get('/admin/security-metrics');
      setSecurityMetrics(securityResponse.data);

      // Load performance metrics
      const performanceResponse = await BackendAPI.get('/admin/performance-metrics');
      setPerformanceMetrics(performanceResponse.data);

      // Load real-time activity
      const realTimeResponse = await BackendAPI.get('/admin/real-time-activity');
      setRealTimeData(realTimeResponse.data);
    } catch (error) {
      console.error('Error loading admin data:', error);
      CustomAlertService.showError(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'فشل تحميل بيانات الإدارة' : 'Failed to load admin data'
      );
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAdminData();
    setRefreshing(false);
  };

  const handleSystemAction = async (action: string, params?: any) => {
    try {
      await BackendAPI.post(`/admin/system/${action}`, params);
      CustomAlertService.showSuccess(
        isRTL ? 'نجح' : 'Success',
        isRTL ? `تم تنفيذ ${action} بنجاح` : `${action} executed successfully`
      );
      loadAdminData();
    } catch (error) {
      console.error(`Error executing ${action}:`, error);
      CustomAlertService.showError(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? `فشل تنفيذ ${action}` : `Failed to execute ${action}`
      );
    }
  };

  const renderOverviewTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {/* System Health Status */}
      <View style={[styles.card, { backgroundColor: theme.surface }]}>
        <View style={styles.cardHeader}>
          <Ionicons name="pulse" size={24} color={theme.primary} />
          <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>
            {isRTL ? 'حالة النظام' : 'System Health'}
          </Text>
        </View>
        {systemMetrics && (
          <View style={styles.healthGrid}>
            <View style={styles.healthItem}>
              <Text style={[styles.healthLabel, { color: theme.textSecondary }]}>
                {isRTL ? 'الحالة' : 'Status'}
              </Text>
              <View style={[
                styles.healthStatus,
                { backgroundColor: systemMetrics.systemHealth === 'healthy' ? '#4CAF50' : 
                  systemMetrics.systemHealth === 'warning' ? '#FF9800' : '#F44336' }
              ]}>
                <Text style={styles.healthStatusText}>
                  {systemMetrics.systemHealth.toUpperCase()}
                </Text>
              </View>
            </View>
            <View style={styles.healthItem}>
              <Text style={[styles.healthLabel, { color: theme.textSecondary }]}>
                {isRTL ? 'وقت التشغيل' : 'Uptime'}
              </Text>
              <Text style={[styles.healthValue, { color: theme.textPrimary }]}>
                {Math.floor(systemMetrics.serverUptime / 3600)}h
              </Text>
            </View>
            <View style={styles.healthItem}>
              <Text style={[styles.healthLabel, { color: theme.textSecondary }]}>
                {isRTL ? 'الذاكرة' : 'Memory'}
              </Text>
              <Text style={[styles.healthValue, { color: theme.textPrimary }]}>
                {systemMetrics.memoryUsage.toFixed(1)}%
              </Text>
            </View>
            <View style={styles.healthItem}>
              <Text style={[styles.healthLabel, { color: theme.textSecondary }]}>
                {isRTL ? 'المعالج' : 'CPU'}
              </Text>
              <Text style={[styles.healthValue, { color: theme.textPrimary }]}>
                {systemMetrics.cpuUsage.toFixed(1)}%
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Key Metrics */}
      <View style={[styles.card, { backgroundColor: theme.surface }]}>
        <View style={styles.cardHeader}>
          <Ionicons name="analytics" size={24} color={theme.primary} />
          <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>
            {isRTL ? 'المقاييس الرئيسية' : 'Key Metrics'}
          </Text>
        </View>
        {systemMetrics && (
          <View style={styles.metricsGrid}>
            <View style={styles.metricItem}>
              <Text style={[styles.metricValue, { color: theme.primary }]}>
                {systemMetrics.totalUsers.toLocaleString()}
              </Text>
              <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>
                {isRTL ? 'المستخدمين' : 'Users'}
              </Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={[styles.metricValue, { color: theme.primary }]}>
                {systemMetrics.totalJobs.toLocaleString()}
              </Text>
              <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>
                {isRTL ? 'الوظائف' : 'Jobs'}
              </Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={[styles.metricValue, { color: theme.primary }]}>
                {systemMetrics.totalGuilds.toLocaleString()}
              </Text>
              <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>
                {isRTL ? 'النقابات' : 'Guilds'}
              </Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={[styles.metricValue, { color: theme.primary }]}>
                ${systemMetrics.totalRevenue.toLocaleString()}
              </Text>
              <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>
                {isRTL ? 'الإيرادات' : 'Revenue'}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Real-time Activity */}
      <View style={[styles.card, { backgroundColor: theme.surface }]}>
        <View style={styles.cardHeader}>
          <Ionicons name="time" size={24} color={theme.primary} />
          <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>
            {isRTL ? 'النشاط المباشر' : 'Real-time Activity'}
          </Text>
        </View>
        <ScrollView style={styles.activityList} showsVerticalScrollIndicator={false}>
          {realTimeData.map((activity, index) => (
            <View key={index} style={styles.activityItem}>
              <View style={[styles.activityIcon, { backgroundColor: theme.primary + '20' }]}>
                <Ionicons name={activity.icon} size={16} color={theme.primary} />
              </View>
              <View style={styles.activityContent}>
                <Text style={[styles.activityText, { color: theme.textPrimary }]}>
                  {activity.description}
                </Text>
                <Text style={[styles.activityTime, { color: theme.textSecondary }]}>
                  {activity.timestamp}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    </ScrollView>
  );

  const renderAnalyticsTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {/* Advanced Analytics */}
      <View style={[styles.card, { backgroundColor: theme.surface }]}>
        <View style={styles.cardHeader}>
          <Ionicons name="bar-chart" size={24} color={theme.primary} />
          <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>
            {isRTL ? 'التحليلات المتقدمة' : 'Advanced Analytics'}
          </Text>
        </View>
        <View style={styles.analyticsGrid}>
          <TouchableOpacity 
            style={[styles.analyticsButton, { backgroundColor: theme.primary + '20' }]}
            onPress={() => router.push('/(modals)/admin-analytics-dashboard')}
          >
            <Ionicons name="trending-up" size={24} color={theme.primary} />
            <Text style={[styles.analyticsButtonText, { color: theme.primary }]}>
              {isRTL ? 'لوحة التحليلات' : 'Analytics Dashboard'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.analyticsButton, { backgroundColor: theme.primary + '20' }]}
            onPress={() => router.push('/(modals)/admin-reports')}
          >
            <Ionicons name="document-text" size={24} color={theme.primary} />
            <Text style={[styles.analyticsButtonText, { color: theme.primary }]}>
              {isRTL ? 'التقارير' : 'Reports'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.analyticsButton, { backgroundColor: theme.primary + '20' }]}
            onPress={() => router.push('/(modals)/admin-predictions')}
          >
            <Ionicons name="analytics" size={24} color={theme.primary} />
            <Text style={[styles.analyticsButtonText, { color: theme.primary }]}>
              {isRTL ? 'التنبؤات' : 'Predictions'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.analyticsButton, { backgroundColor: theme.primary + '20' }]}
            onPress={() => router.push('/(modals)/admin-insights')}
          >
            <Ionicons name="bulb" size={24} color={theme.primary} />
            <Text style={[styles.analyticsButtonText, { color: theme.primary }]}>
              {isRTL ? 'الرؤى' : 'Insights'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );

  const renderSecurityTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {/* Security Overview */}
      <View style={[styles.card, { backgroundColor: theme.surface }]}>
        <View style={styles.cardHeader}>
          <Ionicons name="shield-checkmark" size={24} color={theme.primary} />
          <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>
            {isRTL ? 'الأمان' : 'Security'}
          </Text>
        </View>
        {securityMetrics && (
          <View style={styles.securityGrid}>
            <View style={styles.securityItem}>
              <Text style={[styles.securityValue, { color: '#F44336' }]}>
                {securityMetrics.failedLogins}
              </Text>
              <Text style={[styles.securityLabel, { color: theme.textSecondary }]}>
                {isRTL ? 'محاولات دخول فاشلة' : 'Failed Logins'}
              </Text>
            </View>
            <View style={styles.securityItem}>
              <Text style={[styles.securityValue, { color: '#FF9800' }]}>
                {securityMetrics.blockedIPs}
              </Text>
              <Text style={[styles.securityLabel, { color: theme.textSecondary }]}>
                {isRTL ? 'عناوين محظورة' : 'Blocked IPs'}
              </Text>
            </View>
            <View style={styles.securityItem}>
              <Text style={[styles.securityValue, { color: '#9C27B0' }]}>
                {securityMetrics.suspiciousActivities}
              </Text>
              <Text style={[styles.securityLabel, { color: theme.textSecondary }]}>
                {isRTL ? 'أنشطة مشبوهة' : 'Suspicious Activities'}
              </Text>
            </View>
            <View style={styles.securityItem}>
              <Text style={[styles.securityValue, { color: '#E91E63' }]}>
                {securityMetrics.securityAlerts}
              </Text>
              <Text style={[styles.securityLabel, { color: theme.textSecondary }]}>
                {isRTL ? 'تنبيهات أمنية' : 'Security Alerts'}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Security Actions */}
      <View style={[styles.card, { backgroundColor: theme.surface }]}>
        <View style={styles.cardHeader}>
          <Ionicons name="settings" size={24} color={theme.primary} />
          <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>
            {isRTL ? 'إجراءات الأمان' : 'Security Actions'}
          </Text>
        </View>
        <View style={styles.actionGrid}>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: theme.primary + '20' }]}
            onPress={() => handleSystemAction('security-scan')}
          >
            <Ionicons name="scan" size={20} color={theme.primary} />
            <Text style={[styles.actionButtonText, { color: theme.primary }]}>
              {isRTL ? 'فحص أمني' : 'Security Scan'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: theme.primary + '20' }]}
            onPress={() => handleSystemAction('block-suspicious-ips')}
          >
            <Ionicons name="ban" size={20} color={theme.primary} />
            <Text style={[styles.actionButtonText, { color: theme.primary }]}>
              {isRTL ? 'حظر عناوين' : 'Block IPs'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: theme.primary + '20' }]}
            onPress={() => handleSystemAction('clear-security-logs')}
          >
            <Ionicons name="trash" size={20} color={theme.primary} />
            <Text style={[styles.actionButtonText, { color: theme.primary }]}>
              {isRTL ? 'مسح السجلات' : 'Clear Logs'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: theme.primary + '20' }]}
            onPress={() => router.push('/(modals)/admin-security-dashboard')}
          >
            <Ionicons name="shield" size={20} color={theme.primary} />
            <Text style={[styles.actionButtonText, { color: theme.primary }]}>
              {isRTL ? 'لوحة الأمان' : 'Security Dashboard'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );

  const renderPerformanceTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {/* Performance Metrics */}
      <View style={[styles.card, { backgroundColor: theme.surface }]}>
        <View style={styles.cardHeader}>
          <Ionicons name="speedometer" size={24} color={theme.primary} />
          <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>
            {isRTL ? 'أداء النظام' : 'System Performance'}
          </Text>
        </View>
        {performanceMetrics && (
          <View style={styles.performanceGrid}>
            <View style={styles.performanceItem}>
              <Text style={[styles.performanceValue, { color: theme.primary }]}>
                {performanceMetrics.avgResponseTime}ms
              </Text>
              <Text style={[styles.performanceLabel, { color: theme.textSecondary }]}>
                {isRTL ? 'وقت الاستجابة' : 'Response Time'}
              </Text>
            </View>
            <View style={styles.performanceItem}>
              <Text style={[styles.performanceValue, { color: theme.primary }]}>
                {performanceMetrics.errorRate.toFixed(2)}%
              </Text>
              <Text style={[styles.performanceLabel, { color: theme.textSecondary }]}>
                {isRTL ? 'معدل الخطأ' : 'Error Rate'}
              </Text>
            </View>
            <View style={styles.performanceItem}>
              <Text style={[styles.performanceValue, { color: theme.primary }]}>
                {performanceMetrics.throughput.toLocaleString()}
              </Text>
              <Text style={[styles.performanceLabel, { color: theme.textSecondary }]}>
                {isRTL ? 'الإنتاجية' : 'Throughput'}
              </Text>
            </View>
            <View style={styles.performanceItem}>
              <Text style={[styles.performanceValue, { color: theme.primary }]}>
                {performanceMetrics.cacheHitRate.toFixed(1)}%
              </Text>
              <Text style={[styles.performanceLabel, { color: theme.textSecondary }]}>
                {isRTL ? 'معدل التخزين المؤقت' : 'Cache Hit Rate'}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Performance Actions */}
      <View style={[styles.card, { backgroundColor: theme.surface }]}>
        <View style={styles.cardHeader}>
          <Ionicons name="settings" size={24} color={theme.primary} />
          <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>
            {isRTL ? 'إجراءات الأداء' : 'Performance Actions'}
          </Text>
        </View>
        <View style={styles.actionGrid}>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: theme.primary + '20' }]}
            onPress={() => handleSystemAction('clear-cache')}
          >
            <Ionicons name="refresh" size={20} color={theme.primary} />
            <Text style={[styles.actionButtonText, { color: theme.primary }]}>
              {isRTL ? 'مسح التخزين المؤقت' : 'Clear Cache'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: theme.primary + '20' }]}
            onPress={() => handleSystemAction('optimize-database')}
          >
            <Ionicons name="construct" size={20} color={theme.primary} />
            <Text style={[styles.actionButtonText, { color: theme.primary }]}>
              {isRTL ? 'تحسين قاعدة البيانات' : 'Optimize DB'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: theme.primary + '20' }]}
            onPress={() => handleSystemAction('restart-services')}
          >
            <Ionicons name="reload" size={20} color={theme.primary} />
            <Text style={[styles.actionButtonText, { color: theme.primary }]}>
              {isRTL ? 'إعادة تشغيل الخدمات' : 'Restart Services'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: theme.primary + '20' }]}
            onPress={() => router.push('/(modals)/admin-performance-dashboard')}
          >
            <Ionicons name="analytics" size={20} color={theme.primary} />
            <Text style={[styles.actionButtonText, { color: theme.primary }]}>
              {isRTL ? 'لوحة الأداء' : 'Performance Dashboard'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );

  const renderUsersTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {/* User Management */}
      <View style={[styles.card, { backgroundColor: theme.surface }]}>
        <View style={styles.cardHeader}>
          <Ionicons name="people" size={24} color={theme.primary} />
          <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>
            {isRTL ? 'إدارة المستخدمين' : 'User Management'}
          </Text>
        </View>
        <View style={styles.actionGrid}>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: theme.primary + '20' }]}
            onPress={() => router.push('/(modals)/admin-user-management')}
          >
            <Ionicons name="person" size={20} color={theme.primary} />
            <Text style={[styles.actionButtonText, { color: theme.primary }]}>
              {isRTL ? 'إدارة المستخدمين' : 'Manage Users'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: theme.primary + '20' }]}
            onPress={() => router.push('/(modals)/admin-user-analytics')}
          >
            <Ionicons name="bar-chart" size={20} color={theme.primary} />
            <Text style={[styles.actionButtonText, { color: theme.primary }]}>
              {isRTL ? 'تحليلات المستخدمين' : 'User Analytics'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: theme.primary + '20' }]}
            onPress={() => router.push('/(modals)/admin-user-reports')}
          >
            <Ionicons name="document" size={20} color={theme.primary} />
            <Text style={[styles.actionButtonText, { color: theme.primary }]}>
              {isRTL ? 'تقارير المستخدمين' : 'User Reports'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: theme.primary + '20' }]}
            onPress={() => handleSystemAction('export-user-data')}
          >
            <Ionicons name="download" size={20} color={theme.primary} />
            <Text style={[styles.actionButtonText, { color: theme.primary }]}>
              {isRTL ? 'تصدير البيانات' : 'Export Data'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );

  const renderSystemTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {/* System Control */}
      <View style={[styles.card, { backgroundColor: theme.surface }]}>
        <View style={styles.cardHeader}>
          <Ionicons name="settings" size={24} color={theme.primary} />
          <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>
            {isRTL ? 'التحكم في النظام' : 'System Control'}
          </Text>
        </View>
        <View style={styles.actionGrid}>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: '#4CAF50' + '20' }]}
            onPress={() => handleSystemAction('backup-system')}
          >
            <Ionicons name="save" size={20} color="#4CAF50" />
            <Text style={[styles.actionButtonText, { color: '#4CAF50' }]}>
              {isRTL ? 'نسخ احتياطي' : 'Backup System'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: '#FF9800' + '20' }]}
            onPress={() => handleSystemAction('maintenance-mode')}
          >
            <Ionicons name="construct" size={20} color="#FF9800" />
            <Text style={[styles.actionButtonText, { color: '#FF9800' }]}>
              {isRTL ? 'وضع الصيانة' : 'Maintenance Mode'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: '#F44336' + '20' }]}
            onPress={() => handleSystemAction('emergency-shutdown')}
          >
            <Ionicons name="power" size={20} color="#F44336" />
            <Text style={[styles.actionButtonText, { color: '#F44336' }]}>
              {isRTL ? 'إغلاق طارئ' : 'Emergency Shutdown'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: theme.primary + '20' }]}
            onPress={() => router.push('/(modals)/admin-system-logs')}
          >
            <Ionicons name="list" size={20} color={theme.primary} />
            <Text style={[styles.actionButtonText, { color: theme.primary }]}>
              {isRTL ? 'سجلات النظام' : 'System Logs'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverviewTab();
      case 'analytics':
        return renderAnalyticsTab();
      case 'security':
        return renderSecurityTab();
      case 'performance':
        return renderPerformanceTab();
      case 'users':
        return renderUsersTab();
      case 'system':
        return renderSystemTab();
      default:
        return renderOverviewTab();
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.surface }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
          {isRTL ? 'لوحة الإدارة المتقدمة' : 'Advanced Admin Portal'}
        </Text>
        <TouchableOpacity onPress={onRefresh}>
          <Ionicons name="refresh" size={24} color={theme.primary} />
        </TouchableOpacity>
      </View>

      {/* Tab Navigation */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.tabContainer}
        contentContainerStyle={styles.tabContentContainer}
      >
        {[
          { key: 'overview', label: isRTL ? 'نظرة عامة' : 'Overview', icon: 'home' },
          { key: 'analytics', label: isRTL ? 'التحليلات' : 'Analytics', icon: 'analytics' },
          { key: 'security', label: isRTL ? 'الأمان' : 'Security', icon: 'shield' },
          { key: 'performance', label: isRTL ? 'الأداء' : 'Performance', icon: 'speedometer' },
          { key: 'users', label: isRTL ? 'المستخدمين' : 'Users', icon: 'people' },
          { key: 'system', label: isRTL ? 'النظام' : 'System', icon: 'settings' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab,
              { backgroundColor: activeTab === tab.key ? theme.primary : theme.surface }
            ]}
            onPress={() => setActiveTab(tab.key as any)}
          >
            <Ionicons 
              name={tab.icon as any} 
              size={16} 
              color={activeTab === tab.key ? '#FFFFFF' : theme.textSecondary} 
            />
            <Text style={[
              styles.tabText,
              { color: activeTab === tab.key ? '#FFFFFF' : theme.textSecondary }
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Tab Content */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {renderTabContent()}
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
  tabContainer: {
    maxHeight: 60,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  tabContentContainer: {
    paddingHorizontal: 16,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    marginVertical: 8,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  content: {
    flex: 1,
  },
  tabContent: {
    padding: 16,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  healthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  healthItem: {
    width: (width - 80) / 2,
    alignItems: 'center',
    marginBottom: 16,
  },
  healthLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  healthValue: {
    fontSize: 18,
    fontWeight: '600',
  },
  healthStatus: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  healthStatusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricItem: {
    width: (width - 80) / 2,
    alignItems: 'center',
    marginBottom: 16,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  activityList: {
    maxHeight: 200,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: 14,
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 12,
  },
  analyticsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  analyticsButton: {
    width: (width - 80) / 2,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  analyticsButtonText: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 8,
    textAlign: 'center',
  },
  securityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  securityItem: {
    width: (width - 80) / 2,
    alignItems: 'center',
    marginBottom: 16,
  },
  securityValue: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  securityLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: (width - 80) / 2,
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  performanceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  performanceItem: {
    width: (width - 80) / 2,
    alignItems: 'center',
    marginBottom: 16,
  },
  performanceValue: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  performanceLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
});
