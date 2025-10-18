import React, { useState, useCallback, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  Text, 
  StatusBar, 
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Modal,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { 
  ArrowLeft,
  ArrowRight,
  Filter, 
  MoreVertical, 
  Briefcase, 
  Wallet, 
  Bell, 
  MessageCircle, 
  Award, 
  Shield, 
  Gift,
  Clock,
  Settings,
  Trash2,
  Check,
  X,
  Users,
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useI18n } from '@/contexts/I18nProvider';
import { useAuth } from '@/contexts/AuthContext';
import { CustomAlertService } from '@/services/CustomAlertService';
import { firebaseNotificationService, Notification, NotificationType } from '@/services/firebaseNotificationService';
import { notificationService } from '@/services/notificationService';

const FONT_FAMILY = 'Signika Negative SC';

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const top = insets?.top || 0;
  const { theme, isDarkMode } = useTheme();
  const { t, isRTL } = useI18n();
  const { user } = useAuth();
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'important'>('all');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showOptionsModal, setShowOptionsModal] = useState(false);

  // Load notifications on mount
  useEffect(() => {
    if (!user) return;
    
    loadNotifications();
    
    // Set up real-time listener
    const unsubscribe = firebaseNotificationService.subscribeToNotifications(
      user.uid,
      (updatedNotifications) => {
        setNotifications(updatedNotifications);
        updateBadgeCount();
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Update badge count when notifications change
  const updateBadgeCount = async () => {
    if (!user) return;
    const count = await firebaseNotificationService.getUnreadCount(user.uid);
    await notificationService.setBadgeCount(count);
  };

  const loadNotifications = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const fetchedNotifications = await firebaseNotificationService.getUserNotifications(
        user.uid,
        100
      );
      setNotifications(fetchedNotifications);
      await updateBadgeCount();
    } catch (error) {
      console.error('Error loading notifications:', error);
      CustomAlertService.showError(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'فشل تحميل الإشعارات' : 'Failed to load notifications'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.push('/(main)/home');
    }
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
    
    CustomAlertService.showSuccess(
      isRTL ? 'تم التحديث' : 'Refreshed',
      isRTL ? 'تم تحديث الإشعارات' : 'Notifications updated'
    );
  }, [user]);

  const handleNotificationPress = useCallback(async (notification: Notification) => {
    if (!user) return;

    // Mark as read
    if (!notification.isRead) {
      await firebaseNotificationService.markAsRead(notification.id, user.uid);
      await updateBadgeCount();
    }

    // Log action
    await firebaseNotificationService.logAction(notification.id, user.uid, 'clicked');

    // Navigate to action URL if available
    if (notification.actionUrl) {
      router.push(notification.actionUrl as any);
    }
  }, [user]);

  const markAllAsRead = useCallback(async () => {
    if (!user) return;

    try {
      await firebaseNotificationService.markAllAsRead(user.uid);
      await updateBadgeCount();
      
      CustomAlertService.showSuccess(
        isRTL ? 'تم وضع العلامات' : 'Marked',
        isRTL ? 'تم وضع علامة على جميع الإشعارات كمقروءة' : 'All notifications marked as read'
      );
    } catch (error) {
      CustomAlertService.showError(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'فشل وضع العلامات' : 'Failed to mark notifications'
      );
    }
  }, [user]);

  const handleDeleteNotification = useCallback(async (notificationId: string) => {
    if (!user) return;

    CustomAlertService.showConfirmation(
      isRTL ? 'حذف الإشعار' : 'Delete Notification',
      isRTL ? 'هل أنت متأكد أنك تريد حذف هذا الإشعار؟' : 'Are you sure you want to delete this notification?',
      async () => {
        const success = await firebaseNotificationService.deleteNotification(notificationId, user.uid);
        if (success) {
          CustomAlertService.showSuccess(
            isRTL ? 'تم الحذف' : 'Deleted',
            isRTL ? 'تم حذف الإشعار' : 'Notification deleted'
          );
        } else {
          CustomAlertService.showError(
            isRTL ? 'خطأ' : 'Error',
            isRTL ? 'فشل حذف الإشعار' : 'Failed to delete notification'
          );
        }
      },
      undefined,
      isRTL
    );
  }, [user]);

  const handleClearAll = useCallback(async () => {
    if (!user) return;

    CustomAlertService.showConfirmation(
      isRTL ? 'مسح الكل' : 'Clear All',
      isRTL ? 'هل أنت متأكد أنك تريد حذف جميع الإشعارات المقروءة؟' : 'Are you sure you want to delete all read notifications?',
      async () => {
        try {
          const readNotifications = notifications.filter(n => n.isRead);
          const deletePromises = readNotifications.map(n => 
            firebaseNotificationService.deleteNotification(n.id, user.uid)
          );
          await Promise.all(deletePromises);
          
          CustomAlertService.showSuccess(
            isRTL ? 'تم المسح' : 'Cleared',
            isRTL ? 'تم حذف جميع الإشعارات المقروءة' : 'All read notifications deleted'
          );
        } catch (error) {
          CustomAlertService.showError(
            isRTL ? 'خطأ' : 'Error',
            isRTL ? 'فشل مسح الإشعارات' : 'Failed to clear notifications'
          );
        }
      },
      undefined,
      isRTL
    );
  }, [user, notifications]);

  const getNotificationIcon = useCallback((type: NotificationType, priority: string) => {
    const iconColor = priority === 'high' || priority === 'urgent' ? theme.primary : '#FFFFFF';
    const size = 20;

    switch (type) {
      case 'offer':
      case 'job':
        return <Briefcase size={size} color={iconColor} />;
      case 'payment':
        return <Wallet size={size} color={iconColor} />;
      case 'message':
        return <MessageCircle size={size} color={iconColor} />;
      case 'achievement':
        return <Award size={size} color={iconColor} />;
      case 'system':
      case 'dispute':
        return <Shield size={size} color={iconColor} />;
      case 'promotion':
        return <Gift size={size} color={iconColor} />;
      case 'guild':
        return <Users size={size} color={iconColor} />;
      default:
        return <Bell size={size} color={iconColor} />;
    }
  }, [theme]);

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.isRead;
    if (filter === 'important') return n.priority === 'high' || n.priority === 'urgent';
    return true;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Format time
  const formatTime = (timestamp: any): string => {
    if (!timestamp) return '';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return isRTL ? 'الآن' : 'Now';
    if (diffMins < 60) return isRTL ? `منذ ${diffMins} د` : `${diffMins}m ago`;
    if (diffHours < 24) return isRTL ? `منذ ${diffHours} س` : `${diffHours}h ago`;
    if (diffDays < 7) return isRTL ? `منذ ${diffDays} ي` : `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };

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
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: isDarkMode ? '#262626' : theme.border,
    },
    filterButtonActive: {
      backgroundColor: theme.primary + '20',
      borderColor: theme.primary,
    },
    filterButtonText: {
      color: theme.textSecondary,
      fontSize: 13,
      fontFamily: FONT_FAMILY,
      fontWeight: '700',
    },
    filterButtonTextActive: {
      color: theme.primary,
    },
    summaryCard: {
      backgroundColor: isDarkMode ? '#1b1b1b' : theme.surface,
      borderRadius: 18,
      borderWidth: 1.5,
      borderColor: isDarkMode ? '#262626' : theme.border,
      padding: 16,
      marginHorizontal: 16,
      marginBottom: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      elevation: 3,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 6,
    },
    summaryText: {
      color: theme.textPrimary,
      fontSize: 15,
      fontFamily: FONT_FAMILY,
      fontWeight: '700',
    },
    markAllButton: {
      backgroundColor: theme.primary + '20',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: theme.primary,
    },
    markAllButtonText: {
      color: theme.primary,
      fontSize: 13,
      fontFamily: FONT_FAMILY,
      fontWeight: '800',
    },
    notificationsList: {
      paddingHorizontal: 16,
    },
    notificationCard: { 
      backgroundColor: isDarkMode ? '#1b1b1b' : theme.surface,
      borderRadius: 20, 
      borderBottomLeftRadius: 4,
      borderWidth: 1.5, 
      borderColor: isDarkMode ? '#262626' : theme.border,
      padding: 16, 
      marginBottom: 12,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 4,
    },
    unreadCard: {
      borderLeftWidth: 4,
      borderLeftColor: theme.primary,
    },
    highPriorityCard: {
      borderColor: theme.primary,
      borderWidth: 2,
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
      borderWidth: 1.5,
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
      paddingHorizontal: 10,
      paddingVertical: 5,
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
    deleteButton: {
      padding: 8,
      borderRadius: 8,
    },
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 80,
      paddingHorizontal: 32,
    },
    emptyStateIcon: {
      marginBottom: 16,
    },
    emptyStateTitle: {
      color: theme.textPrimary,
      fontSize: 20,
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
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 60,
    },
    bottomSpacer: {
      height: 100,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: isDarkMode ? '#1b1b1b' : theme.surface,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingBottom: insets.bottom + 20,
      maxHeight: '50%',
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? '#262626' : theme.border,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '900',
      fontFamily: FONT_FAMILY,
      color: theme.textPrimary,
    },
    closeButton: {
      padding: 8,
    },
    modalOption: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      gap: 16,
    },
    modalOptionText: {
      fontSize: 16,
      fontFamily: FONT_FAMILY,
      color: theme.textPrimary,
      flex: 1,
    },
    modalOptionDanger: {
      color: theme.error,
    },
  });

  return (
    <View style={styles.screen}>
      <StatusBar 
        barStyle={isDarkMode ? "dark-content" : "dark-content"} 
        backgroundColor={theme.primary} 
      />
      
      {/* Header */}
      <View style={[styles.header, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          activeOpacity={0.7}
        >
          {isRTL ? <ArrowRight size={20} color={theme.primary} /> : <ArrowLeft size={20} color={theme.primary} />}
        </TouchableOpacity>
        
        <Text style={[styles.headerTitle, { textAlign: isRTL ? 'right' : 'center', marginRight: isRTL ? 0 : 42, marginLeft: isRTL ? 42 : 0 }]}>
          {t('notifications') || (isRTL ? 'الإشعارات' : 'Notifications')}
        </Text>

        <View style={[styles.headerActions, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <TouchableOpacity 
            style={styles.headerActionButton}
            onPress={() => setShowFilterModal(true)}
            activeOpacity={0.7}
          >
            <Filter size={18} color={theme.primary} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerActionButton}
            onPress={() => setShowOptionsModal(true)}
            activeOpacity={0.7}
          >
            <MoreVertical size={18} color={theme.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.emptyStateText, { marginTop: 16 }]}>
            {isRTL ? 'جاري التحميل...' : 'Loading notifications...'}
          </Text>
        </View>
      ) : (
        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={handleRefresh}
              tintColor={theme.primary}
              colors={[theme.primary]}
            />
          }
        >
          {/* Filter Buttons */}
          <View style={styles.filterContainer}>
            {(['all', 'unread', 'important'] as const).map((filterType) => (
              <TouchableOpacity
                key={filterType}
                style={[
                  styles.filterButton,
                  filter === filterType && styles.filterButtonActive
                ]}
                onPress={() => setFilter(filterType)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.filterButtonText,
                  filter === filterType && styles.filterButtonTextActive
                ]}>
                  {filterType === 'all' ? (isRTL ? 'الكل' : 'All') : 
                   filterType === 'unread' ? (isRTL ? 'غير مقروء' : 'Unread') : 
                   (isRTL ? 'مهم' : 'Important')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Summary Card */}
          {unreadCount > 0 && (
            <View style={styles.summaryCard}>
              <Text style={styles.summaryText}>
                {unreadCount} {isRTL ? 'إشعار غير مقروء' : 'Unread'}
              </Text>
              <TouchableOpacity
                style={styles.markAllButton}
                onPress={markAllAsRead}
                activeOpacity={0.7}
              >
                <Text style={styles.markAllButtonText}>
                  {isRTL ? 'وضع علامة على الكل' : 'Mark All Read'}
                </Text>
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
                    (notification.priority === 'high' || notification.priority === 'urgent') && styles.highPriorityCard,
                  ]}
                  onPress={() => handleNotificationPress(notification)}
                  onLongPress={() => handleDeleteNotification(notification.id)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.notificationHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                    <View style={[styles.iconContainer, { marginRight: isRTL ? 0 : 12, marginLeft: isRTL ? 12 : 0 }]}>
                      {getNotificationIcon(notification.type, notification.priority)}
                      {!notification.isRead && <View style={styles.unreadDot} />}
                    </View>
                    
                    <View style={[styles.notificationContent, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
                      <Text style={[styles.notificationTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
                        {notification.title}
                      </Text>
                      <Text style={[styles.notificationDescription, { textAlign: isRTL ? 'right' : 'left' }]}>
                        {notification.description}
                      </Text>
                      
                      <View style={[styles.notificationMeta, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                        <View style={styles.timeContainer}>
                          <Clock size={12} color={theme.textSecondary} />
                          <Text style={styles.notificationTime}>
                            {formatTime(notification.createdAt)}
                          </Text>
                        </View>
                        
                        {(notification.priority === 'high' || notification.priority === 'urgent') && (
                          <View style={styles.priorityBadge}>
                            <Text style={styles.priorityText}>
                              {isRTL ? 'مهم' : 'Priority'}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Bell size={56} color={theme.textSecondary} style={styles.emptyStateIcon} />
                <Text style={styles.emptyStateTitle}>
                  {isRTL ? 'لا توجد إشعارات' : 'No Notifications'}
                </Text>
                <Text style={styles.emptyStateText}>
                  {filter === 'unread' 
                    ? (isRTL ? 'أنت على اطلاع على كل شيء!' : "You're all caught up!")
                    : filter === 'important'
                    ? (isRTL ? 'لا توجد إشعارات مهمة' : "No important notifications")
                    : (isRTL ? 'ليس لديك أي إشعارات حتى الآن' : "You don't have any notifications yet")}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      )}

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => setShowFilterModal(false)}
        >
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {isRTL ? 'التصفية' : 'Filter Options'}
              </Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowFilterModal(false)}
              >
                <X size={24} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity 
              style={styles.modalOption}
              onPress={() => {
                setFilter('all');
                setShowFilterModal(false);
              }}
            >
              <Check size={20} color={filter === 'all' ? theme.primary : 'transparent'} />
              <Text style={styles.modalOptionText}>
                {isRTL ? 'جميع الإشعارات' : 'All Notifications'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.modalOption}
              onPress={() => {
                setFilter('unread');
                setShowFilterModal(false);
              }}
            >
              <Check size={20} color={filter === 'unread' ? theme.primary : 'transparent'} />
              <Text style={styles.modalOptionText}>
                {isRTL ? 'غير مقروء فقط' : 'Unread Only'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.modalOption}
              onPress={() => {
                setFilter('important');
                setShowFilterModal(false);
              }}
            >
              <Check size={20} color={filter === 'important' ? theme.primary : 'transparent'} />
              <Text style={styles.modalOptionText}>
                {isRTL ? 'مهم فقط' : 'Important Only'}
              </Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Options Modal */}
      <Modal
        visible={showOptionsModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowOptionsModal(false)}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => setShowOptionsModal(false)}
        >
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {isRTL ? 'خيارات' : 'Options'}
              </Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowOptionsModal(false)}
              >
                <X size={24} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity 
              style={styles.modalOption}
              onPress={() => {
                setShowOptionsModal(false);
                router.push('/(modals)/notification-preferences');
              }}
            >
              <Settings size={20} color={theme.textPrimary} />
              <Text style={styles.modalOptionText}>
                {isRTL ? 'إعدادات الإشعارات' : 'Notification Settings'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.modalOption}
              onPress={() => {
                setShowOptionsModal(false);
                markAllAsRead();
              }}
            >
              <Check size={20} color={theme.textPrimary} />
              <Text style={styles.modalOptionText}>
                {isRTL ? 'وضع علامة على الكل كمقروء' : 'Mark All as Read'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.modalOption}
              onPress={() => {
                setShowOptionsModal(false);
                handleClearAll();
              }}
            >
              <Trash2 size={20} color={theme.error} />
              <Text style={[styles.modalOptionText, styles.modalOptionDanger]}>
                {isRTL ? 'مسح المقروءة' : 'Clear Read'}
              </Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
