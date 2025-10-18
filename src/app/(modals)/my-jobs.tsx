import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  Text, 
  TouchableOpacity, 
  StatusBar,
  RefreshControl,
  ActivityIndicator
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { 
  ArrowLeft,
  Briefcase,
  Clock,
  MapPin,
  DollarSign,
  User,
  CheckCircle,
  AlertCircle,
  Loader
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useI18n } from '@/contexts/I18nProvider';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/config/firebase';

const FONT_FAMILY = 'Signika Negative SC';

// Advanced Light Mode Color Helper
const getAdaptiveColors = (theme: any, isDark: boolean) => ({
  background: isDark ? theme.background : '#F5F5F5',
  cardBackground: isDark ? theme.surface : '#FFFFFF',
  cardBorder: isDark ? theme.border : 'rgba(0, 0, 0, 0.08)',
  primaryText: isDark ? theme.textPrimary : '#000000',
  secondaryText: isDark ? theme.textSecondary : '#666666',
  tabActiveText: isDark ? theme.primary : '#000000',
  tabInactiveText: isDark ? theme.textSecondary : '#666666',
  iconColor: isDark ? theme.textSecondary : '#666666',
  cardShadow: isDark 
    ? { shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8 }
    : { shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 12 },
});

interface Job {
  id: string;
  title: string;
  description: string;
  status: 'open' | 'in-progress' | 'completed';
  budget: number;
  location?: string;
  category: string;
  createdAt: Date;
  clientId?: string;
  workerId?: string;
}

export default function MyJobsScreen() {
  const insets = useSafeAreaInsets();
  const { theme, isDarkMode } = useTheme();
  const { t, isRTL } = useI18n();
  const { user } = useAuth();
  
  const adaptiveColors = React.useMemo(() => getAdaptiveColors(theme, isDarkMode), [theme, isDarkMode]);
  
  const [tab, setTab] = useState<'open' | 'in-progress' | 'completed'>('open');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadJobs();
  }, [tab, user]);

  const loadJobs = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Query jobs from Firebase where user is either client or worker
      const jobsRef = collection(db, 'jobs');
      const q = query(
        jobsRef,
        where('status', '==', tab),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        const jobsData = snapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date(),
          })) as Job[];
        
        // Filter to only show user's jobs (as client or worker)
        const userJobs = jobsData.filter(job => 
          job.clientId === user.uid || job.workerId === user.uid
        );
        
        setJobs(userJobs);
      } else {
        setJobs([]);
      }
    } catch (error) {
      console.error('Error loading jobs:', error);
      // Fallback to mock data for beta testing
      setJobs(getMockJobs());
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadJobs();
    setRefreshing(false);
  };

  const getMockJobs = (): Job[] => [
    {
      id: 'mock-1',
      title: isRTL ? 'تطوير تطبيق موبايل' : 'Mobile App Development',
      description: isRTL ? 'تطبيق iOS/Android' : 'iOS/Android application',
      status: tab,
      budget: 5000,
      location: isRTL ? 'الدوحة' : 'Doha',
      category: 'development',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      clientId: user?.uid,
    },
    {
      id: 'mock-2',
      title: isRTL ? 'تصميم شعار' : 'Logo Design',
      description: isRTL ? 'شعار احترافي' : 'Professional logo',
      status: tab,
      budget: 500,
      location: isRTL ? 'الدوحة' : 'Doha',
      category: 'design',
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      clientId: user?.uid,
    },
  ];

  const getStatusIcon = (status: Job['status']) => {
    switch (status) {
      case 'open':
        return <AlertCircle size={18} color={theme.primary} />;
      case 'in-progress':
        return <Loader size={18} color="#F59E0B" />;
      case 'completed':
        return <CheckCircle size={18} color="#10B981" />;
    }
  };

  const getStatusColor = (status: Job['status']) => {
    switch (status) {
      case 'open':
        return theme.primary;
      case 'in-progress':
        return '#F59E0B';
      case 'completed':
        return '#10B981';
    }
  };

  const formatDate = (date: Date) => {
    const now = Date.now();
    const diff = now - date.getTime();
    const days = Math.floor(diff / (24 * 60 * 60 * 1000));

    if (days === 0) {
      return isRTL ? 'اليوم' : 'Today';
    } else if (days === 1) {
      return isRTL ? 'أمس' : 'Yesterday';
    } else if (days < 7) {
      return isRTL ? `منذ ${days} أيام` : `${days} days ago`;
    } else {
      return date.toLocaleDateString(isRTL ? 'ar' : 'en');
    }
  };

  const handleBack = () => {
    router.back();
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: adaptiveColors.background,
    },
    header: {
      paddingTop: insets.top + 12,
      paddingBottom: 16,
      paddingHorizontal: 18,
      backgroundColor: theme.primary,
      borderBottomLeftRadius: 26,
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
    },
    backButton: {
      width: 42,
      height: 42,
      borderRadius: 12,
      backgroundColor: 'transparent',
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerTitle: {
      color: '#000000',
      fontSize: 24,
      fontWeight: '900',
      fontFamily: FONT_FAMILY,
      flex: 1,
      textAlign: 'center',
      marginHorizontal: 16,
    },
    headerSpacer: {
      width: 42,
    },
    tabsContainer: {
      flexDirection: 'row',
      gap: 8,
      paddingHorizontal: 16,
      paddingVertical: 16,
      backgroundColor: adaptiveColors.background,
    },
    tabButton: {
      flex: 1,
      backgroundColor: adaptiveColors.cardBackground,
      borderRadius: 12,
      paddingVertical: 12,
      alignItems: 'center',
      borderWidth: isDarkMode ? 2 : 1,
      borderColor: isDarkMode ? 'transparent' : adaptiveColors.cardBorder,
      elevation: isDarkMode ? 2 : 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDarkMode ? 0.08 : 0.12,
      shadowRadius: isDarkMode ? 4 : 6,
    },
    tabButtonActive: {
      borderColor: theme.primary,
      backgroundColor: isDarkMode ? theme.primary + '20' : theme.primary + '10',
      elevation: isDarkMode ? 4 : 6,
      shadowOpacity: isDarkMode ? 0.15 : 0.18,
    },
    tabText: {
      color: adaptiveColors.tabInactiveText,
      fontWeight: '700',
      fontFamily: FONT_FAMILY,
      fontSize: 14,
    },
    tabTextActive: {
      color: adaptiveColors.tabActiveText,
      fontWeight: '900',
    },
    content: {
      flex: 1,
    },
    scrollContent: {
      padding: 16,
    },
    jobCard: {
      backgroundColor: adaptiveColors.cardBackground,
      borderRadius: 20,
      borderBottomLeftRadius: 4,
      padding: 16,
      marginBottom: 12,
      ...adaptiveColors.cardShadow,
      shadowOffset: { width: 0, height: 3 },
      elevation: isDarkMode ? 4 : 6,
      borderWidth: 1,
      borderColor: adaptiveColors.cardBorder,
    },
    jobHeader: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    jobTitleRow: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      gap: 8,
      flex: 1,
    },
    jobTitle: {
      fontSize: 16,
      fontWeight: '700',
      fontFamily: FONT_FAMILY,
      color: adaptiveColors.primaryText,
      flex: 1,
      textAlign: isRTL ? 'right' : 'left',
    },
    statusBadge: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
    },
    statusText: {
      fontSize: 11,
      fontWeight: '700',
      fontFamily: FONT_FAMILY,
      textTransform: 'capitalize',
    },
    jobDescription: {
      fontSize: 14,
      fontFamily: FONT_FAMILY,
      color: adaptiveColors.secondaryText,
      marginBottom: 12,
      textAlign: isRTL ? 'right' : 'left',
    },
    jobMeta: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 12,
    },
    metaItem: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      gap: 4,
    },
    metaText: {
      fontSize: 13,
      fontFamily: FONT_FAMILY,
      color: adaptiveColors.secondaryText,
    },
    budgetText: {
      fontSize: 14,
      fontWeight: '700',
      fontFamily: FONT_FAMILY,
      color: isDarkMode ? theme.primary : '#000000',
    },
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 60,
    },
    emptyIcon: {
      marginBottom: 16,
    },
    emptyText: {
      fontSize: 16,
      fontFamily: FONT_FAMILY,
      color: adaptiveColors.primaryText,
      textAlign: 'center',
      marginBottom: 8,
    },
    emptySubtext: {
      fontSize: 14,
      fontFamily: FONT_FAMILY,
      color: adaptiveColors.secondaryText,
      textAlign: 'center',
    },
    loadingContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    bottomSpacer: {
      height: 100,
    },
  });

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
          <ArrowLeft size={24} color="#000000" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          {t('myJobs')}
        </Text>

        <View style={styles.headerSpacer} />
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {(['open', 'in-progress', 'completed'] as const).map(tabKey => (
          <TouchableOpacity
            key={tabKey}
            style={[styles.tabButton, tab === tabKey && styles.tabButtonActive]}
            onPress={() => setTab(tabKey)}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, tab === tabKey && styles.tabTextActive]}>
              {tabKey === 'open' 
                ? (isRTL ? 'مفتوح' : 'Open')
                : tabKey === 'in-progress'
                ? (isRTL ? 'قيد التنفيذ' : 'In Progress')
                : (isRTL ? 'مكتمل' : 'Completed')
              }
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Jobs List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : (
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
          {jobs.length > 0 ? (
            jobs.map(job => {
              const statusColor = getStatusColor(job.status);
              return (
                <TouchableOpacity
                  key={job.id}
                  style={styles.jobCard}
                  onPress={() => router.push(`/(modals)/job-details?id=${job.id}`)}
                  activeOpacity={0.7}
                >
                  {/* Header with title and status */}
                  <View style={styles.jobHeader}>
                    <View style={styles.jobTitleRow}>
                      <Text style={styles.jobTitle} numberOfLines={1}>
                        {job.title}
                      </Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
                      {getStatusIcon(job.status)}
                      <Text style={[styles.statusText, { color: statusColor }]}>
                        {job.status}
                      </Text>
                    </View>
                  </View>

                  {/* Description */}
                  <Text style={styles.jobDescription} numberOfLines={2}>
                    {job.description}
                  </Text>

                  {/* Meta info */}
                  <View style={styles.jobMeta}>
                    <View style={styles.metaItem}>
                      <DollarSign size={16} color={theme.primary} />
                      <Text style={styles.budgetText}>
                        {job.budget} {isRTL ? 'ر.ق' : 'QAR'}
                      </Text>
                    </View>

                    {job.location && (
                      <View style={styles.metaItem}>
                        <MapPin size={14} color={adaptiveColors.iconColor} />
                        <Text style={styles.metaText}>{job.location}</Text>
                      </View>
                    )}

                    <View style={styles.metaItem}>
                      <Clock size={14} color={adaptiveColors.iconColor} />
                      <Text style={styles.metaText}>{formatDate(job.createdAt)}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          ) : (
            <View style={styles.emptyState}>
              <Briefcase size={64} color={adaptiveColors.secondaryText} style={styles.emptyIcon} />
              <Text style={styles.emptyText}>
                {isRTL ? 'لا توجد وظائف' : 'No jobs found'}
              </Text>
              <Text style={styles.emptySubtext}>
                {tab === 'open' && (isRTL ? 'ليس لديك وظائف مفتوحة حاليًا' : 'You don\'t have any open jobs')}
                {tab === 'in-progress' && (isRTL ? 'ليس لديك وظائف قيد التنفيذ' : 'You don\'t have any jobs in progress')}
                {tab === 'completed' && (isRTL ? 'ليس لديك وظائف مكتملة بعد' : 'You haven\'t completed any jobs yet')}
              </Text>
            </View>
          )}

          <View style={styles.bottomSpacer} />
        </ScrollView>
      )}
    </View>
  );
}
