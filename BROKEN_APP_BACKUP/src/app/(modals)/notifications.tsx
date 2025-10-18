import React, { useState, useCallback } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  Text, 
  StatusBar, 
  TouchableOpacity,
  RefreshControl 
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useI18n } from '@/contexts/I18nProvider';
import CustomAlert from '@/app/components/CustomAlert';

const FONT_FAMILY = 'Signika Negative SC';

interface Notification {
  id: string;
  type: 'offer' | 'payment' | 'job' | 'message' | 'achievement' | 'system' | 'promotion';
  title: string;
  description: string;
  time: string;
  isRead: boolean;
  priority: 'low' | 'medium' | 'high';
  actionUrl?: string;
  metadata?: {
    amount?: number;
    jobId?: string;
    userId?: string;
    badgeName?: string;
  };
}

// Function to get multilingual notifications
const getMockNotifications = (t: (key: string) => string, isRTL: boolean): Notification[] => [
  {
    id: 'n1',
    type: 'offer',
    title: isRTL ? 'عرض جديد مستلم' : 'New Offer Received',
    description: isRTL ? 'أحمد حسن أرسل عرضاً لمشروع تحليل البيانات - 1,800 ق.ر' : 'Ahmed Hassan sent an offer for your Data Analysis project - QR 1,800',
    time: isRTL ? 'منذ دقيقتين' : '2 minutes ago',
    isRead: false,
    priority: 'high',
    actionUrl: '/job/1',
    metadata: { amount: 1800, jobId: '1', userId: 'user123' }
  },
  {
    id: 'n2',
    type: 'payment',
    title: isRTL ? 'تم إطلاق الدفع' : 'Payment Released',
    description: isRTL ? 'تم إطلاق 1,200 ق.ر إلى محفظتك لمشروع "تطوير الموقع"' : 'QR 1,200 has been released to your wallet for "Website Development"',
    time: isRTL ? 'منذ 15 دقيقة' : '15 minutes ago',
    isRead: false,
    priority: 'high',
    actionUrl: '/wallet/1',
    metadata: { amount: 1200 }
  },
  {
    id: 'n3',
    type: 'job',
    title: isRTL ? 'تم نشر الوظيفة بنجاح' : 'Job Posted Successfully',
    description: isRTL ? 'وظيفتك "تصميم واجهة التطبيق المحمول" نشطة الآن وتستقبل الطلبات' : 'Your job "Mobile App UI Design" is now live and receiving applications',
    time: isRTL ? 'منذ ساعة' : '1 hour ago',
    isRead: true,
    priority: 'medium',
    actionUrl: '/job/2',
    metadata: { jobId: '2' }
  },
  {
    id: 'n4',
    type: 'message',
    title: isRTL ? 'رسالة جديدة' : 'New Message',
    description: isRTL ? 'سارة أحمد: "مرحباً! لدي بعض الأسئلة حول الجدول الزمني للمشروع..."' : 'Sarah Ahmed: "Hi! I have some questions about the project timeline..."',
    time: isRTL ? 'منذ ساعتين' : '2 hours ago',
    isRead: true,
    priority: 'medium',
    actionUrl: '/chat/user456',
    metadata: { userId: 'user456' }
  },
  {
    id: 'n5',
    type: 'achievement',
    title: isRTL ? 'تم فتح إنجاز!' : 'Achievement Unlocked!',
    description: isRTL ? 'حصلت على شارة "الأداء المتميز" للحفاظ على تقييم 4.9+' : 'You earned the "Top Performer" badge for maintaining 4.9+ rating',
    time: isRTL ? 'منذ يوم' : '1 day ago',
    isRead: true,
    priority: 'low',
    metadata: { badgeName: 'Top Performer' }
  },
  {
    id: 'n6',
    type: 'system',
    title: isRTL ? 'تنبيه أمني' : 'Security Alert',
    description: isRTL ? 'تم اكتشاف تسجيل دخول جديد من iPhone في الدوحة، قطر في 2:30 مساءً' : 'New login detected from iPhone in Doha, Qatar at 2:30 PM',
    time: isRTL ? 'منذ يومين' : '2 days ago',
    isRead: true,
    priority: 'high'
  },
  {
    id: 'n7',
    type: 'promotion',
    title: isRTL ? 'مكافأة نهاية الأسبوع!' : 'Weekend Bonus!',
    description: isRTL ? 'أكمل 3 وظائف في نهاية الأسبوع واحصل على مكافأة 20% على جميع المدفوعات' : 'Complete 3 jobs this weekend and earn 20% bonus on all payments',
    time: isRTL ? 'منذ 3 أيام' : '3 days ago',
    isRead: true,
    priority: 'medium'
  }
];

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const top = insets?.top || 0;
  const bottom = insets?.bottom || 0;
  const { theme, isDarkMode } = useTheme();
  const { t, isRTL } = useI18n();
  
  const [notifications, setNotifications] = useState(() => getMockNotifications(t, isRTL));
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread' | 'important'>('all');
  
  // Custom Alert States
  const [showFilterAlert, setShowFilterAlert] = useState(false);
  const [showOptionsAlert, setShowOptionsAlert] = useState(false);

  // Update notifications when language changes
  React.useEffect(() => {
    setNotifications(getMockNotifications(t, isRTL));
  }, [t, isRTL]);

  const handleBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.push('/(main)/home');
    }
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  }, []);

  const handleNotificationPress = useCallback((notification: Notification) => {
    // Mark as read
    setNotifications(prev => 
      prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n)
    );

    // Navigate to action URL if available
    if (notification.actionUrl) {
      router.push(notification.actionUrl);
    }
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  }, []);

  const getNotificationIcon = useCallback((type: Notification['type'], priority: string) => {
    const iconColor = priority === 'high' ? '#BCFF31' : '#FFFFFF';
    const size = 20;

    switch (type) {
      case 'offer':
        return <Ionicons name="briefcase-outline" size={size} color={iconColor} />;
      case 'payment':
        return <Ionicons name="cash-outline" size={size} color={iconColor} />;
      case 'job':
        return <Ionicons name="notifications-outline" size={size} color={iconColor} />;
      case 'message':
        return <Ionicons name="chatbox-outline" size={size} color={iconColor} />;
      case 'achievement':
        return <Ionicons name="star-outline" size={size} color={iconColor} />;
      case 'system':
        return <MaterialIcons name="security" size={size} color={iconColor} />;
      case 'promotion':
        return <Ionicons name="gift-outline" size={size} color={iconColor} />;
      default:
        return <Ionicons name="notifications-outline" size={size} color={iconColor} />;
    }
  }, []);

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.isRead;
    if (filter === 'important') return n.priority === 'high';
    return true;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const styles = StyleSheet.create({
    screen: { 
      flex: 1, 
      backgroundColor: isDarkMode ? '#000000' : theme.background 
    },
    header: { 
      paddingTop: top + 12, 
      paddingBottom: 16, 
      paddingHorizontal: 18, 
      backgroundColor: theme.primary,
      borderBottomLeftRadius: 26,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between'
    },
    backButton: {
      width: 42,
      height: 42,
      borderRadius: 12,
      backgroundColor: isDarkMode ? '#000000' : '#FFFFFF',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: isDarkMode ? '#2a2a2a' : '#E0E0E0',
    },
    headerTitle: { 
      color: isDarkMode ? '#000000' : '#000000', 
      fontSize: 24, 
      fontWeight: '900', 
      fontFamily: FONT_FAMILY,
      flex: 1,
      textAlign: 'center',
      marginRight: 42
    },
    headerActions: {
      flexDirection: 'row',
      gap: 8,
    },
    headerActionButton: {
      width: 42,
      height: 42,
      borderRadius: 12,
      backgroundColor: isDarkMode ? '#000000' : '#FFFFFF',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: isDarkMode ? '#2a2a2a' : '#E0E0E0',
    },
    content: { 
      flex: 1, 
      backgroundColor: isDarkMode ? '#111111' : theme.surface
    },
    filterContainer: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      paddingVertical: 12,
      gap: 8,
    },
    filterButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#262626',
    },
    filterButtonActive: {
      backgroundColor: theme.primary + '20',
      borderColor: theme.primary,
    },
    filterButtonText: {
      color: theme.textSecondary,
      fontSize: 12,
      fontFamily: FONT_FAMILY,
      fontWeight: '700',
    },
    filterButtonTextActive: {
      color: theme.primary,
    },
    summaryCard: {
      backgroundColor: isDarkMode ? '#1b1b1b' : theme.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: isDarkMode ? '#262626' : theme.border,
      padding: 16,
      marginHorizontal: 16,
      marginBottom: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    summaryText: {
      color: theme.textPrimary,
      fontSize: 14,
      fontFamily: FONT_FAMILY,
      fontWeight: '700',
    },
    markAllButton: {
      backgroundColor: theme.primary + '20',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.primary,
    },
    markAllButtonText: {
      color: theme.primary,
      fontSize: 12,
      fontFamily: FONT_FAMILY,
      fontWeight: '800',
    },
    notificationsList: {
      paddingHorizontal: 16,
    },
    notificationCard: { 
      backgroundColor: isDarkMode ? '#1b1b1b' : theme.surface,
      borderRadius: 18, 
      borderWidth: 1, 
      borderColor: isDarkMode ? '#262626' : theme.border,
      padding: 16, 
      marginBottom: 12,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.4,
      shadowRadius: 12,
      elevation: 12,
    },
    unreadCard: {
      borderLeftWidth: 4,
      borderLeftColor: theme.primary,
    },
    highPriorityCard: {
      borderColor: theme.primary,
      borderWidth: 1.5,
    },
    notificationHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 8,
    },
    iconContainer: { 
      width: 44, 
      height: 44, 
      borderRadius: 12, 
      backgroundColor: isDarkMode ? '#000000' : theme.surfaceSecondary,
      alignItems: 'center', 
      justifyContent: 'center', 
      marginRight: 12,
      borderWidth: 1,
      borderColor: isDarkMode ? '#2f2f2f' : theme.borderLight,
    },
    notificationContent: {
      flex: 1,
    },
    notificationTitle: { 
      color: theme.textPrimary,
      fontSize: 16,
      fontWeight: '900', 
      fontFamily: FONT_FAMILY,
      marginBottom: 4,
    },
    notificationDescription: {
      color: theme.textSecondary,
      fontSize: 14,
      fontFamily: FONT_FAMILY,
      lineHeight: 20,
      marginBottom: 8,
    },
    notificationMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    timeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    notificationTime: { 
      color: theme.textSecondary,
      fontSize: 12,
      fontFamily: FONT_FAMILY,
      fontWeight: '600',
    },
    priorityBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
      backgroundColor: theme.primary + '20',
    },
    priorityText: {
      color: theme.primary,
      fontSize: 10,
      fontFamily: FONT_FAMILY,
      fontWeight: '800',
      textTransform: 'uppercase',
    },
    unreadDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: theme.primary,
      position: 'absolute',
      top: -2,
      right: -2,
    },
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 60,
    },
    emptyStateIcon: {
      marginBottom: 16,
    },
    emptyStateTitle: {
      color: theme.textPrimary,
      fontSize: 18,
      fontFamily: FONT_FAMILY,
      fontWeight: '900',
      marginBottom: 8,
    },
    emptyStateText: {
      color: theme.textSecondary,
      fontSize: 14,
      fontFamily: FONT_FAMILY,
      textAlign: 'center',
      lineHeight: 20,
    },
    bottomSpacer: {
      height: 100,
    },
  });

  return (
    <View style={styles.screen}>
      <StatusBar 
        barStyle={isDarkMode ? "dark-content" : "dark-content"} 
        backgroundColor={theme.primary} 
      />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={20} color={theme.primary} />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>
          {t('notifications') || 'Notifications'}
        </Text>
        
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.headerActionButton}
            onPress={() => setShowFilterAlert(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="filter-outline" size={18} color={theme.primary} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerActionButton}
            onPress={() => setShowOptionsAlert(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="ellipsis-vertical" size={18} color={theme.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Filter Buttons */}
        <View style={styles.filterContainer}>
          {['all', 'unread', 'important'].map((filterType) => (
            <TouchableOpacity
              key={filterType}
              style={[
                styles.filterButton,
                filter === filterType && styles.filterButtonActive
              ]}
              onPress={() => setFilter(filterType as any)}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.filterButtonText,
                filter === filterType && styles.filterButtonTextActive
              ]}>
                {filterType === 'all' ? t('all') : 
                 filterType === 'unread' ? t('unread') : t('important')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Summary Card */}
        {unreadCount > 0 && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryText}>
              {unreadCount} {t('unreadNotifications')}
            </Text>
            <TouchableOpacity
              style={styles.markAllButton}
              onPress={markAllAsRead}
              activeOpacity={0.7}
            >
              <Text style={styles.markAllButtonText}>{t('markAllRead')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Notifications List */}
        <View style={styles.notificationsList}>
          {filteredNotifications.length > 0 ? (
            filteredNotifications.map((notification) => (
              <TouchableOpacity
                key={notification.id}
                style={[
                  styles.notificationCard,
                  !notification.isRead && styles.unreadCard,
                  notification.priority === 'high' && styles.highPriorityCard,
                ]}
                onPress={() => handleNotificationPress(notification)}
                activeOpacity={0.7}
              >
                <View style={styles.notificationHeader}>
                  <View style={styles.iconContainer}>
                    {getNotificationIcon(notification.type, notification.priority)}
                    {!notification.isRead && <View style={styles.unreadDot} />}
                  </View>
                  
                  <View style={styles.notificationContent}>
                    <Text style={styles.notificationTitle}>
                      {notification.title}
                    </Text>
                    <Text style={styles.notificationDescription}>
                      {notification.description}
                    </Text>
                    
                    <View style={styles.notificationMeta}>
                      <View style={styles.timeContainer}>
                        <Ionicons name="time-outline" size={12} color={theme.textSecondary} />
                        <Text style={styles.notificationTime}>
                          {notification.time}
                        </Text>
                      </View>
                      
                      {notification.priority === 'high' && (
                        <View style={styles.priorityBadge}>
                          <Text style={styles.priorityText}>Priority</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="notifications-outline" size={48} color={theme.textSecondary} style={styles.emptyStateIcon} />
              <Text style={styles.emptyStateTitle}>No Notifications</Text>
              <Text style={styles.emptyStateText}>
                {filter === 'unread' 
                  ? "You're all caught up! No unread notifications."
                  : filter === 'important'
                  ? "No important notifications at the moment."
                  : "You don't have any notifications yet."}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Custom Alerts */}
      <CustomAlert
        visible={showFilterAlert}
        title={t('filter')}
        message="Notification filter options would be implemented here. You can filter by type, date, read status, or importance level."
        buttons={[{ text: 'OK', onPress: () => setShowFilterAlert(false) }]}
        onDismiss={() => setShowFilterAlert(false)}
      />

      <CustomAlert
        visible={showOptionsAlert}
        title={t('options')}
        message="Notification options menu would be implemented here. You can manage notification preferences, mark all as read, or clear notification history."
        buttons={[{ text: 'OK', onPress: () => setShowOptionsAlert(false) }]}
        onDismiss={() => setShowOptionsAlert(false)}
      />
    </View>
  );
}