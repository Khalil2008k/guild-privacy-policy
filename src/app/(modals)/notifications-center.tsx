import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useI18n } from '../../contexts/I18nProvider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const FONT_FAMILY = 'Signika Negative SC';

interface Notification {
  id: string;
  type: 'job' | 'guild' | 'payment' | 'system' | 'message';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
  priority: 'low' | 'medium' | 'high';
}

export default function NotificationsCenterScreen() {
  const { theme } = useTheme();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();

  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'unread' | 'job' | 'guild' | 'payment'>('all');

  // Mock notifications data
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'job',
      title: 'New Job Application',
      message: 'Sarah Ahmed applied for your "Mobile App Development" project',
      timestamp: '2 minutes ago',
      read: false,
      priority: 'high',
      actionUrl: '/(modals)/job/123'
    },
    {
      id: '2',
      type: 'guild',
      title: 'Guild Invitation',
      message: 'You have been invited to join "Tech Masters" guild',
      timestamp: '15 minutes ago',
      read: false,
      priority: 'medium',
      actionUrl: '/(modals)/guild-invitation/456'
    },
    {
      id: '3',
      type: 'payment',
      title: 'Payment Received',
      message: 'You received 2,500 QAR for "Website Design" project',
      timestamp: '1 hour ago',
      read: true,
      priority: 'high',
      actionUrl: '/(modals)/payment-details/789'
    },
    {
      id: '4',
      type: 'message',
      title: 'New Message',
      message: 'Ahmed Mohamed: "Can we discuss the project timeline?"',
      timestamp: '2 hours ago',
      read: false,
      priority: 'medium',
      actionUrl: '/(main)/chat'
    },
    {
      id: '5',
      type: 'system',
      title: 'Profile Update',
      message: 'Your profile verification has been approved',
      timestamp: '1 day ago',
      read: true,
      priority: 'low'
    },
    {
      id: '6',
      type: 'guild',
      title: 'Guild Workshop',
      message: 'New workshop "Advanced React Native" is now available',
      timestamp: '2 days ago',
      read: true,
      priority: 'medium',
      actionUrl: '/(modals)/workshop/101'
    }
  ]);

  const filters = [
    { key: 'all', label: 'All', icon: 'notifications' },
    { key: 'unread', label: 'Unread', icon: 'radio-button-on' },
    { key: 'job', label: 'Jobs', icon: 'briefcase' },
    { key: 'guild', label: 'Guild', icon: 'people' },
    { key: 'payment', label: 'Payments', icon: 'card' },
  ];

  const getFilteredNotifications = () => {
    switch (selectedFilter) {
      case 'unread':
        return notifications.filter(n => !n.read);
      case 'job':
        return notifications.filter(n => n.type === 'job');
      case 'guild':
        return notifications.filter(n => n.type === 'guild');
      case 'payment':
        return notifications.filter(n => n.type === 'payment');
      default:
        return notifications;
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'job': return 'briefcase';
      case 'guild': return 'people';
      case 'payment': return 'card';
      case 'message': return 'chatbubble';
      case 'system': return 'settings';
      default: return 'notifications';
    }
  };

  const getNotificationColor = (type: string, priority: string) => {
    if (priority === 'high') return theme.error;
    switch (type) {
      case 'job': return theme.primary;
      case 'guild': return theme.info;
      case 'payment': return theme.success;
      case 'message': return theme.warning;
      default: return theme.textSecondary;
    }
  };

  const handleNotificationPress = (notification: Notification) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Mark as read
    setNotifications(prev => 
      prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
    );

    // Navigate to action URL if available
    if (notification.actionUrl) {
      router.push(notification.actionUrl as any);
    }
  };

  const markAllAsRead = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearAllNotifications = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setNotifications([]);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    // Simulate API call
    setTimeout(() => setRefreshing(false), 1000);
  };

  const filteredNotifications = getFilteredNotifications();
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.background, paddingTop: insets.top + 10 }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.back();
            }}
          >
            <Ionicons name="arrow-back" size={24} color={theme.primary} />
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <MaterialIcons name="notifications" size={24} color={theme.primary} />
            <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
              Notifications
            </Text>
            {unreadCount > 0 && (
              <View style={[styles.unreadBadge, { backgroundColor: theme.error }]}>
                <Text style={[styles.unreadBadgeText, { color: theme.buttonText }]}>
                  {unreadCount}
                </Text>
              </View>
            )}
          </View>
          
          <TouchableOpacity
            style={styles.headerActionButton}
            onPress={markAllAsRead}
          >
            <Ionicons name="checkmark-done" size={24} color={theme.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={[styles.filterContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.filterTab,
                { 
                  backgroundColor: selectedFilter === filter.key ? theme.primary + '20' : 'transparent',
                  borderColor: selectedFilter === filter.key ? theme.primary : theme.border,
                }
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSelectedFilter(filter.key as any);
              }}
            >
              <MaterialIcons 
                name={filter.icon as any} 
                size={18} 
                color={selectedFilter === filter.key ? theme.primary : theme.textSecondary} 
              />
              <Text style={[
                styles.filterText,
                { color: selectedFilter === filter.key ? theme.primary : theme.textSecondary }
              ]}>
                {filter.label}
              </Text>
              {filter.key === 'unread' && unreadCount > 0 && (
                <View style={[styles.filterBadge, { backgroundColor: theme.error }]}>
                  <Text style={[styles.filterBadgeText, { color: theme.buttonText }]}>
                    {unreadCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Notifications List */}
      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {filteredNotifications.length === 0 ? (
          <View style={[styles.emptyState, { backgroundColor: theme.surface }]}>
            <MaterialIcons name="notifications-none" size={64} color={theme.textSecondary} />
            <Text style={[styles.emptyStateTitle, { color: theme.textPrimary }]}>
              No Notifications
            </Text>
            <Text style={[styles.emptyStateMessage, { color: theme.textSecondary }]}>
              {selectedFilter === 'unread' 
                ? "You're all caught up! No unread notifications."
                : "You don't have any notifications yet."}
            </Text>
          </View>
        ) : (
          filteredNotifications.map((notification) => (
            <TouchableOpacity
              key={notification.id}
              style={[
                styles.notificationItem,
                { 
                  backgroundColor: notification.read ? theme.background : theme.surface,
                  borderColor: theme.border,
                }
              ]}
              onPress={() => handleNotificationPress(notification)}
            >
              <View style={styles.notificationLeft}>
                <View style={[
                  styles.notificationIcon,
                  { backgroundColor: getNotificationColor(notification.type, notification.priority) + '20' }
                ]}>
                  <MaterialIcons 
                    name={getNotificationIcon(notification.type) as any} 
                    size={20} 
                    color={getNotificationColor(notification.type, notification.priority)} 
                  />
                </View>
                
                <View style={styles.notificationContent}>
                  <View style={styles.notificationHeader}>
                    <Text style={[
                      styles.notificationTitle,
                      { 
                        color: theme.textPrimary,
                        fontWeight: notification.read ? '500' : '600'
                      }
                    ]}>
                      {notification.title}
                    </Text>
                    {notification.priority === 'high' && (
                      <View style={[styles.priorityBadge, { backgroundColor: theme.error }]}>
                        <Ionicons name="flash" size={12} color={theme.buttonText} />
                      </View>
                    )}
                  </View>
                  
                  <Text style={[
                    styles.notificationMessage,
                    { color: theme.textSecondary }
                  ]}>
                    {notification.message}
                  </Text>
                  
                  <Text style={[styles.notificationTime, { color: theme.textSecondary }]}>
                    {notification.timestamp}
                  </Text>
                </View>
              </View>

              <View style={styles.notificationRight}>
                {!notification.read && (
                  <View style={[styles.unreadDot, { backgroundColor: theme.primary }]} />
                )}
                <Ionicons name="chevron-forward" size={16} color={theme.textSecondary} />
              </View>
            </TouchableOpacity>
          ))
        )}

        {/* Clear All Button */}
        {filteredNotifications.length > 0 && (
          <TouchableOpacity
            style={[styles.clearAllButton, { backgroundColor: theme.error + '15', borderColor: theme.error }]}
            onPress={clearAllNotifications}
          >
            <Ionicons name="trash-outline" size={20} color={theme.error} />
            <Text style={[styles.clearAllText, { color: theme.error }]}>
              Clear All Notifications
            </Text>
          </TouchableOpacity>
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
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  unreadBadgeText: {
    fontSize: 12,
    fontWeight: '600',
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
  filterContainer: {
    borderBottomWidth: 1,
    paddingVertical: 12,
  },
  filterScroll: {
    paddingHorizontal: 16,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
    gap: 6,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: FONT_FAMILY,
  },
  filterBadge: {
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  filterBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    borderRadius: 12,
    marginTop: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
    marginTop: 16,
  },
  emptyStateMessage: {
    fontSize: 16,
    fontFamily: FONT_FAMILY,
    textAlign: 'center',
    marginTop: 8,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  notificationLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    gap: 12,
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 16,
    fontFamily: FONT_FAMILY,
    flex: 1,
  },
  priorityBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationMessage: {
    fontSize: 14,
    fontFamily: FONT_FAMILY,
    lineHeight: 20,
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 12,
    fontFamily: FONT_FAMILY,
  },
  notificationRight: {
    alignItems: 'center',
    gap: 8,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  clearAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 16,
    gap: 8,
  },
  clearAllText: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: FONT_FAMILY,
  },
});



