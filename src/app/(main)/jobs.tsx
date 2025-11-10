import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  FlatList,
} from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nProvider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { jobService, Job } from '@/services/jobService';
import { Briefcase, Plus, UserCheck, Users, History } from 'lucide-react-native';
import JobCard from '@/components/JobCard';
import { logger } from '@/utils/logger'; // COMMENT: FINAL STABILIZATION - Task 7 - Replace console.log with logger
// ✅ TASK 14: iPad responsive layout components
import { ResponsiveFlatList } from '@/components/ResponsiveFlatList';
import { ResponsiveContainer } from '@/components/ResponsiveContainer';
import { useResponsive, getResponsiveColumns } from '@/utils/responsive';

type UserRole = 'poster' | 'doer';
type TabType = 'browse' | 'my-jobs' | 'my-offers' | 'active' | 'history';

// Advanced Light Mode Color Helper - Tailored for Jobs Screen
const getAdaptiveColors = (theme: any, isDark: boolean) => ({
  // Backgrounds
  contentBackground: isDark ? theme.background : '#F5F5F5',
  cardBackground: isDark ? theme.surface : '#FFFFFF',
  cardBorder: isDark ? theme.border : 'rgba(0, 0, 0, 0.08)',
  
  // Text - NEVER theme color in light mode
  primaryText: isDark ? theme.textPrimary : '#000000',
  secondaryText: isDark ? theme.textSecondary : '#666666',
  
  // Tabs
  tabBackground: isDark ? theme.surface : '#FFFFFF',
  tabBorder: isDark ? theme.border : 'rgba(0, 0, 0, 0.08)',
  activeTabIndicator: theme.primary,
  tabIconActive: isDark ? theme.primary : '#000000',
  tabIconInactive: isDark ? theme.textSecondary : '#999999',
  tabTextActive: isDark ? theme.primary : '#000000',
  tabTextInactive: isDark ? theme.textSecondary : '#666666',
  
  // Shadows
  cardShadow: isDark 
    ? { shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8 }
    : { shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 12 },
});

export default function JobsIndex() {
  const { theme, isDarkMode } = useTheme();
  const { user } = useAuth();
  const { t, isRTL } = useI18n();
  const insets = useSafeAreaInsets();
  // ✅ TASK 14: Get responsive dimensions for iPad layout
  const { isTablet, isLargeDevice, deviceType } = useResponsive();

  const [role, setRole] = useState<UserRole>('doer');
  const [activeTab, setActiveTab] = useState<TabType>('browse');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  // Adaptive colors for light mode
  const adaptiveColors = React.useMemo(() => getAdaptiveColors(theme, isDarkMode), [theme, isDarkMode]);

  // Real-time listener for jobs (Firestore onSnapshot)
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const setupRealtimeListener = async () => {
      setLoading(true);

      try {
        // For browse tab, use real-time listener
        if (activeTab === 'browse') {
          const { db } = await import('@/config/firebase');
          const { collection, query, where, orderBy, onSnapshot } = await import('firebase/firestore');

          const jobsRef = collection(db, 'jobs');
          const q = query(
            jobsRef,
            where('status', '==', 'open'),
            where('adminStatus', '==', 'approved'),
            orderBy('createdAt', 'desc')
          );

          unsubscribe = onSnapshot(
            q,
            (snapshot) => {
              const fetchedJobs = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
              })) as Job[];
              setJobs(fetchedJobs);
              setLoading(false);
            },
            (error) => {
              logger.error('Error in real-time listener:', error);
              setLoading(false);
              // Fallback to regular fetch
              loadJobs();
            }
          );
        } else {
          // For other tabs, use regular fetch
          await loadJobs();
        }
      } catch (error) {
        logger.error('Error setting up listener:', error);
        setLoading(false);
        // Fallback to regular fetch
        await loadJobs();
      }
    };

    setupRealtimeListener();

    // Cleanup function
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [activeTab, role, user?.uid]);

  const loadJobs = async () => {
    setLoading(true);
    try {
      // COMMENT: FINAL STABILIZATION - Skip loading jobs if user is not authenticated
      if (!user) {
        logger.debug('🔥 JOBS: User not authenticated, skipping job load');
        setLoading(false);
        setJobs([]);
        return;
      }
      
      let fetchedJobs: Job[] = [];

      switch (activeTab) {
        case 'browse':
          // COMMENT: FINAL STABILIZATION - getOpenJobs() returns { jobs: Job[] }, not Job[]
          const response = await jobService.getOpenJobs();
          fetchedJobs = response.jobs || [];
          break;

        case 'my-jobs':
          if (user?.uid) {
            const draftJobs = await jobService.getJobsByStatus('draft', user.uid) || [];
            const openJobs = await jobService.getJobsByStatus('open', user.uid) || [];
            const offeredJobs = await jobService.getJobsByStatus('offered', user.uid) || [];
            fetchedJobs = [...draftJobs, ...openJobs, ...offeredJobs];
          }
          break;

        case 'my-offers':
          // TODO: Implement getOffersByFreelancer in jobService
          fetchedJobs = [];
          break;

        case 'active':
          if (user?.uid) {
            const acceptedJobs = await jobService.getJobsByStatus('accepted', user.uid) || [];
            const inProgressJobs = await jobService.getJobsByStatus('in-progress', user.uid) || [];
            const submittedJobs = await jobService.getJobsByStatus('submitted', user.uid) || [];
            fetchedJobs = [...acceptedJobs, ...inProgressJobs, ...submittedJobs];
          }
          break;

        case 'history':
          if (user?.uid) {
            const completedJobs = await jobService.getJobsByStatus('completed', user.uid) || [];
            const cancelledJobs = await jobService.getJobsByStatus('cancelled', user.uid) || [];
            fetchedJobs = [...completedJobs, ...cancelledJobs];
          }
          break;
      }

      // COMMENT: FINAL STABILIZATION - Ensure fetchedJobs is always an array
      if (!Array.isArray(fetchedJobs)) {
        logger.warn('🔥 JOBS: fetchedJobs is not an array, defaulting to empty array');
        fetchedJobs = [];
      }

      // Deduplicate jobs by ID (remove duplicates)
      const uniqueJobs = Array.from(
        new Map(fetchedJobs.map(job => [job.id, job])).values()
      );

      setJobs(uniqueJobs);
    } catch (error) {
      logger.error('Error loading jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPosterTabs = (): { key: TabType; label: string; icon: any }[] => [
    { key: 'my-jobs', label: isRTL ? 'وظائفي' : 'My Jobs', icon: Briefcase },
    { key: 'active', label: isRTL ? 'نشطة' : 'Active', icon: UserCheck },
    { key: 'history', label: isRTL ? 'السجل' : 'History', icon: History },
  ];

  const getDoerTabs = (): { key: TabType; label: string; icon: any }[] => [
    { key: 'browse', label: isRTL ? 'تصفح' : 'Browse', icon: Briefcase },
    { key: 'my-offers', label: isRTL ? 'عروضي' : 'My Offers', icon: Users },
    { key: 'active', label: isRTL ? 'نشطة' : 'Active', icon: UserCheck },
    { key: 'history', label: isRTL ? 'السجل' : 'History', icon: History },
  ];

  const tabs = role === 'poster' ? getPosterTabs() : getDoerTabs();

  const handleJobPress = (job: Job) => {
    router.push(`/(modals)/job/${job.id}`);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={theme.dark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 12,
            backgroundColor: theme.primary,
            borderBottomLeftRadius: 20,
          },
        ]}
      >
        <Text style={[styles.headerTitle, { color: theme.buttonText }]}>
          {isRTL ? 'الوظائف' : 'Jobs'}
        </Text>

        {/* Role Toggle */}
        <View style={[styles.roleToggle, { backgroundColor: theme.background + '20', flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <TouchableOpacity
            onPress={() => {
              setRole('poster');
              setActiveTab('my-jobs');
            }}
            style={[
              styles.roleButton,
              role === 'poster' && {
                backgroundColor: theme.buttonText,
              },
            ]}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.roleText,
                {
                  color: role === 'poster' ? theme.primary : theme.buttonText,
                },
              ]}
            >
              {isRTL ? 'ناشر' : 'Poster'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              setRole('doer');
              setActiveTab('browse');
            }}
            style={[
              styles.roleButton,
              role === 'doer' && {
                backgroundColor: theme.buttonText,
              },
            ]}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.roleText,
                {
                  color: role === 'doer' ? theme.primary : theme.buttonText,
                },
              ]}
            >
              {isRTL ? 'عامل' : 'Doer'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs - Enhanced for Light Mode */}
      <View style={[styles.tabs, { 
        backgroundColor: adaptiveColors.tabBackground, 
        borderBottomColor: adaptiveColors.tabBorder,
        borderBottomWidth: 1
      }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContent}
        >
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              style={[
                styles.tab,
                { flexDirection: isRTL ? 'row-reverse' : 'row' },
                activeTab === tab.key && {
                  borderBottomColor: adaptiveColors.activeTabIndicator,
                  borderBottomWidth: 2,
                },
              ]}
              activeOpacity={0.7}
            >
              <tab.icon
                size={20}
                color={activeTab === tab.key ? adaptiveColors.tabIconActive : adaptiveColors.tabIconInactive}
              />
              <Text
                style={[
                  styles.tabText,
                  {
                    color: activeTab === tab.key ? adaptiveColors.tabTextActive : adaptiveColors.tabTextInactive,
                    fontWeight: activeTab === tab.key ? '700' : '500',
                    textAlign: isRTL ? 'right' : 'left',
                    marginLeft: isRTL ? 0 : 8,
                    marginRight: isRTL ? 8 : 0,
                  },
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Content - ✅ TASK 14: Responsive FlatList for iPad grid layout */}
      {loading ? (
        <View style={[styles.loadingContainer, { flex: 1 }]}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: adaptiveColors.secondaryText }]}>
            {isRTL ? 'جارٍ التحميل...' : 'Loading...'}
          </Text>
        </View>
      ) : (
        <ResponsiveFlatList
          data={jobs}
          renderItem={({ item }) => (
            <JobCard job={item} onPress={() => handleJobPress(item)} showStatus />
          )}
          keyExtractor={(item) => item.id}
          minColumns={1}
          maxColumns={3}
          itemSpacing={12}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Briefcase size={64} color={adaptiveColors.secondaryText} />
              <Text style={[styles.emptyTitle, { color: adaptiveColors.primaryText }]}>
                {isRTL ? 'لا توجد وظائف' : 'No Jobs Found'}
              </Text>
              <Text style={[styles.emptyText, { color: adaptiveColors.secondaryText }]}>
                {activeTab === 'browse'
                  ? isRTL
                    ? 'لا توجد وظائف متاحة حالياً'
                    : 'No jobs available right now'
                  : isRTL
                  ? 'ليس لديك وظائف في هذا القسم'
                  : 'You have no jobs in this section'}
              </Text>
              {activeTab === 'my-jobs' && role === 'poster' && (
                <TouchableOpacity
                  style={[styles.emptyButton, { backgroundColor: theme.primary }]}
                  onPress={() => router.push('/(modals)/add-job')}
                >
                  <Text style={[styles.emptyButtonText, { color: '#000000' }]}>
                    {isRTL ? 'نشر وظيفة' : 'Post a Job'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          }
          contentContainerStyle={{
            paddingBottom: insets.bottom + 100,
            flexGrow: 1,
          }}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Floating Action Button (Post Job - Poster only) */}
      {role === 'poster' && (
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: theme.primary }]}
          onPress={() => router.push('/(modals)/add-job')}
          activeOpacity={0.8}
        >
          <Plus size={24} color={theme.buttonText} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 16,
  },
  roleToggle: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  roleButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  roleText: {
    fontSize: 14,
    fontWeight: '700',
  },
  tabs: {
    borderBottomWidth: 1,
  },
  tabsContent: {
    paddingHorizontal: 16,
    gap: 24,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  tabText: {
    fontSize: 14,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  emptyButton: {
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  fab: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});
