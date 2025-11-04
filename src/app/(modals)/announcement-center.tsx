import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { useI18n } from '@/contexts/I18nProvider';
import { 
  ArrowLeft,
  Megaphone,
  AlertCircle,
  Info,
  CheckCircle,
  TrendingUp,
  Clock,
  Filter,
  CheckCheck
} from 'lucide-react-native';
import { collection, query, orderBy, limit as fbLimit, getDocs, doc, updateDoc, where } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { CustomAlertService } from '@/services/CustomAlertService';
// COMMENT: PRIORITY 1 - Replace console statements with logger
import { logger } from '@/utils/logger';

const FONT_FAMILY = 'Signika Negative SC';

interface Announcement {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'update' | 'critical';
  priority: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  isRead: boolean;
  category?: string;
}

type FilterType = 'all' | 'info' | 'warning' | 'success' | 'update' | 'critical';

export default function AnnouncementCenterScreen() {
  const insets = useSafeAreaInsets();
  const { theme, isDarkMode } = useTheme();
  const { t, isRTL } = useI18n();
  const { user } = useAuth();
  
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [filteredAnnouncements, setFilteredAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadAnnouncements();
  }, []);

  useEffect(() => {
    filterAnnouncements();
  }, [announcements, activeFilter]);

  const loadAnnouncements = async () => {
    try {
      setLoading(true);
      
      // Try loading from Firebase
      const announcementsRef = collection(db, 'announcements');
      const q = query(
        announcementsRef, 
        orderBy('timestamp', 'desc'),
        orderBy('priority', 'desc'),
        fbLimit(50)
      );
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate() || new Date(),
          isRead: doc.data().readBy?.includes(user?.uid) || false,
        })) as Announcement[];
        setAnnouncements(data);
        updateUnreadCount(data);
      } else {
        // No announcements available
        setAnnouncements([]);
        updateUnreadCount([]);
      }
    } catch (error) {
      // COMMENT: PRIORITY 1 - Replace console.log with logger
      logger.debug('Loading announcements:', error);
      setAnnouncements([]);
      updateUnreadCount([]);
    } finally {
      setLoading(false);
    }
  };

  const updateUnreadCount = (announcements: Announcement[]) => {
    const unread = announcements.filter(a => !a.isRead).length;
    setUnreadCount(unread);
  };

  const filterAnnouncements = () => {
    if (activeFilter === 'all') {
      setFilteredAnnouncements(announcements);
    } else {
      setFilteredAnnouncements(announcements.filter(a => a.type === activeFilter));
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAnnouncements();
    setRefreshing(false);
  };

  const markAsRead = useCallback(async (announcementId: string) => {
    if (!user?.uid) return;

    try {
      // Update local state immediately
      setAnnouncements(prev => 
        prev.map(a => a.id === announcementId ? { ...a, isRead: true } : a)
      );

      // Update Firebase
      const announcementRef = doc(db, 'announcements', announcementId);
      await updateDoc(announcementRef, {
        readBy: [...(announcements.find(a => a.id === announcementId)?.isRead ? [] : [user.uid])]
      });
    } catch (error) {
      // COMMENT: PRIORITY 1 - Replace console.log with logger
      logger.debug('Error marking as read:', error);
    }
  }, [user, announcements]);

  const markAllAsRead = useCallback(async () => {
    if (!user?.uid) return;

    try {
      const unreadAnnouncements = announcements.filter(a => !a.isRead);
      
      // Update local state
      setAnnouncements(prev => prev.map(a => ({ ...a, isRead: true })));
      setUnreadCount(0);

      // Update Firebase (in batches if needed)
      const promises = unreadAnnouncements.map(async (announcement) => {
        const announcementRef = doc(db, 'announcements', announcement.id);
        await updateDoc(announcementRef, {
          readBy: [user.uid]
        });
      });

      await Promise.all(promises);

      CustomAlertService.showSuccess(
        isRTL ? 'تم!' : 'Done!',
        isRTL ? 'تم وضع علامة على جميع الإعلانات كمقروءة' : 'All announcements marked as read'
      );
    } catch (error) {
      // COMMENT: PRIORITY 1 - Replace console.error with logger
      logger.error('Error marking all as read:', error);
      CustomAlertService.showError(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'فشل تحديث الإعلانات' : 'Failed to update announcements'
      );
    }
  }, [user, announcements, isRTL]);


  const getIconForType = (type: Announcement['type'], color: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle size={22} color={color} />;
      case 'warning':
        return <AlertCircle size={22} color={color} />;
      case 'critical':
        return <AlertCircle size={22} color={color} />;
      case 'update':
        return <TrendingUp size={22} color={color} />;
      default:
        return <Info size={22} color={color} />;
    }
  };

  const getColorForType = (type: Announcement['type']) => {
    switch (type) {
      case 'success':
        return '#10B981';
      case 'warning':
        return '#F59E0B';
      case 'critical':
        return '#EF4444';
      case 'update':
        return '#3B82F6';
      default:
        return '#6366F1';
    }
  };

  const formatTimestamp = (date: Date) => {
    const now = Date.now();
    const diff = now - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) {
      return isRTL ? 'الآن' : 'Now';
    } else if (minutes < 60) {
      return isRTL ? `منذ ${minutes} دقيقة` : `${minutes}m ago`;
    } else if (hours < 24) {
      return isRTL ? `منذ ${hours} ساعة` : `${hours}h ago`;
    } else {
      return isRTL ? `منذ ${days} يوم` : `${days}d ago`;
    }
  };

  const handleBack = () => {
    router.back();
  };

  const filters: { key: FilterType; label: string; labelAr: string }[] = [
    { key: 'all', label: 'All', labelAr: 'الكل' },
    { key: 'success', label: 'Success', labelAr: 'نجاح' },
    { key: 'update', label: 'Updates', labelAr: 'تحديثات' },
    { key: 'warning', label: 'Warning', labelAr: 'تحذير' },
    { key: 'info', label: 'Info', labelAr: 'معلومات' },
  ];

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDarkMode ? '#000000' : theme.background,
    },
    header: {
      paddingTop: insets.top + 12,
      paddingBottom: 16,
      paddingHorizontal: 18,
      backgroundColor: theme.primary,
      borderBottomLeftRadius: 26,
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
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
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    headerContent: {
      flex: 1,
      marginHorizontal: 12,
    },
    headerTitle: {
      color: '#000000',
      fontSize: 24,
      fontWeight: '900',
      fontFamily: FONT_FAMILY,
      textAlign: 'center',
    },
    headerSubtitle: {
      color: '#000000',
      fontSize: 12,
      fontFamily: FONT_FAMILY,
      textAlign: 'center',
      opacity: 0.7,
    },
    markAllButton: {
      width: 42,
      height: 42,
      borderRadius: 12,
      backgroundColor: isDarkMode ? '#000000' : '#FFFFFF',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: isDarkMode ? '#2a2a2a' : '#E0E0E0',
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    content: {
      flex: 1,
    },
    scrollContent: {
      padding: 16,
    },
    filtersContainer: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      marginBottom: 16,
      gap: 8,
    },
    filterChip: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: isDarkMode ? '#1b1b1b' : theme.surface,
      borderWidth: 1,
      borderColor: isDarkMode ? '#2a2a2a' : theme.border,
    },
    filterChipActive: {
      backgroundColor: theme.primary,
      borderColor: theme.primary,
    },
    filterText: {
      fontSize: 14,
      fontFamily: FONT_FAMILY,
      fontWeight: '600',
      color: theme.textSecondary,
    },
    filterTextActive: {
      color: '#000000',
      fontWeight: '800',
    },
    announcementCard: {
      backgroundColor: isDarkMode ? '#1b1b1b' : theme.surface,
      borderRadius: 18,
      borderBottomLeftRadius: 4,
      padding: 18,
      marginBottom: 12,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.4,
      shadowRadius: 16,
      elevation: 12,
      borderWidth: 1,
      borderColor: isDarkMode ? '#262626' : theme.border,
    },
    unreadCard: {
      borderLeftWidth: 4,
      borderLeftColor: theme.primary,
    },
    cardHeader: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    iconContainer: {
      width: 48,
      height: 48,
      borderRadius: 14,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: isRTL ? 0 : 14,
      marginLeft: isRTL ? 14 : 0,
    },
    cardContent: {
      flex: 1,
    },
    cardTitleRow: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      marginBottom: 6,
    },
    cardTitle: {
      flex: 1,
      fontSize: 16,
      fontWeight: '800',
      fontFamily: FONT_FAMILY,
      color: theme.textPrimary,
      textAlign: isRTL ? 'right' : 'left',
    },
    unreadBadge: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: theme.primary,
      marginLeft: isRTL ? 0 : 8,
      marginRight: isRTL ? 8 : 0,
    },
    cardMeta: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 2,
    },
    metaText: {
      fontSize: 12,
      fontFamily: FONT_FAMILY,
      color: theme.textSecondary,
    },
    categoryBadge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 8,
      backgroundColor: isDarkMode ? '#262626' : theme.borderLight,
    },
    categoryText: {
      fontSize: 10,
      fontFamily: FONT_FAMILY,
      fontWeight: '700',
      color: theme.textSecondary,
    },
    cardMessage: {
      fontSize: 14,
      fontFamily: FONT_FAMILY,
      color: theme.textSecondary,
      lineHeight: 22,
      textAlign: isRTL ? 'right' : 'left',
    },
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 80,
    },
    emptyIcon: {
      marginBottom: 20,
      opacity: 0.3,
    },
    emptyText: {
      fontSize: 16,
      fontFamily: FONT_FAMILY,
      fontWeight: '600',
      color: theme.textSecondary,
      textAlign: 'center',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 40,
    },
    bottomSpacer: {
      height: 40,
    },
  });

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar 
          barStyle="dark-content"
          backgroundColor={theme.primary}
        />
        <View style={styles.header}>
          <View style={styles.backButton} />
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>
              {isRTL ? 'مركز الإعلانات' : 'Announcement Center'}
            </Text>
          </View>
          <View style={styles.markAllButton} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.emptyText, { marginTop: 16 }]}>
            {isRTL ? 'جاري التحميل...' : 'Loading announcements...'}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar 
        barStyle="dark-content"
        backgroundColor={theme.primary}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          activeOpacity={0.7}
        >
          <ArrowLeft size={22} color={theme.primary} />
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>
            {isRTL ? 'مركز الإعلانات' : 'Announcement Center'}
          </Text>
          {unreadCount > 0 && (
            <Text style={styles.headerSubtitle}>
              {isRTL ? `${unreadCount} غير مقروءة` : `${unreadCount} unread`}
            </Text>
          )}
        </View>

        {unreadCount > 0 && (
          <TouchableOpacity
            style={styles.markAllButton}
            onPress={markAllAsRead}
            activeOpacity={0.7}
          >
            <CheckCheck size={20} color={theme.primary} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
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
        {/* Filters */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.filtersContainer}
          contentContainerStyle={{ gap: 8 }}
        >
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.filterChip,
                activeFilter === filter.key && styles.filterChipActive
              ]}
              onPress={() => setActiveFilter(filter.key)}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.filterText,
                activeFilter === filter.key && styles.filterTextActive
              ]}>
                {isRTL ? filter.labelAr : filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Announcements */}
        {filteredAnnouncements.length > 0 ? (
          filteredAnnouncements.map((announcement) => {
            const color = getColorForType(announcement.type);
            return (
              <TouchableOpacity
                key={announcement.id}
                style={[
                  styles.announcementCard,
                  !announcement.isRead && styles.unreadCard
                ]}
                onPress={() => !announcement.isRead && markAsRead(announcement.id)}
                activeOpacity={0.7}
              >
                <View style={styles.cardHeader}>
                  <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
                    {getIconForType(announcement.type, color)}
                  </View>
                  <View style={styles.cardContent}>
                    <View style={styles.cardTitleRow}>
                      <Text style={styles.cardTitle}>{announcement.title}</Text>
                      {!announcement.isRead && <View style={styles.unreadBadge} />}
                    </View>
                    <View style={styles.cardMeta}>
                      <Clock size={12} color={theme.textSecondary} />
                      <Text style={styles.metaText}>
                        {formatTimestamp(announcement.timestamp)}
                      </Text>
                      {announcement.category && (
                        <>
                          <Text style={styles.metaText}>•</Text>
                          <View style={styles.categoryBadge}>
                            <Text style={styles.categoryText}>{announcement.category}</Text>
                          </View>
                        </>
                      )}
                    </View>
                  </View>
                </View>
                <Text style={styles.cardMessage}>{announcement.message}</Text>
              </TouchableOpacity>
            );
          })
        ) : (
          <View style={styles.emptyState}>
            <Megaphone size={80} color={theme.textSecondary} style={styles.emptyIcon} />
            <Text style={styles.emptyText}>
              {isRTL ? 'لا توجد إعلانات' : 'No announcements'}
            </Text>
            <Text style={[styles.metaText, { marginTop: 8 }]}>
              {isRTL ? 'جرب تصفية أخرى' : 'Try a different filter'}
            </Text>
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}
