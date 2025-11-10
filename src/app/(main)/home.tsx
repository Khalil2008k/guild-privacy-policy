import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, StatusBar, Animated, Dimensions, Modal, Image, ActivityIndicator, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons, Feather, MaterialIcons } from '@expo/vector-icons';
import { Shield } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../contexts/ThemeContext';
import { useUserProfile } from '../../contexts/UserProfileContext';
import FilterModal from '../screens/leads-feed/FilterModal';
import { useI18n } from '../../contexts/I18nProvider';
import { useChat } from '../../contexts/ChatContext';
import { useAuth } from '../../contexts/AuthContext';
import { useMemoizedValue, useRenderCounter } from '../../utils/performance';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { I18nManager } from 'react-native';
import { CustomAlertService } from '../../services/CustomAlertService';
import { jobService, Job } from '../../services/jobService';
import { logger } from '../../utils/logger'; // COMMENT: FINAL STABILIZATION - Task 7 - Replace console.log with logger
import { JobMap } from '../../components/JobMap';
// COMMENT: PRODUCTION HARDENING - FakePaymentDisplay disabled per Task 2.1
// import { FakePaymentDisplay } from '../../components/FakePaymentDisplay';
import { 
  createButtonAccessibility, 
  createTextInputAccessibility, 
  createHeaderAccessibility,
  createSearchAccessibility,
  createListAccessibility,
  createListItemAccessibility
} from '../../utils/accessibility';
// COMMENT: PRODUCTION HARDENING - Task 4.9 - Import OptimizedImage for image optimization
import OptimizedImage from '../../components/OptimizedImage';
// COMMENT: PRODUCTION HARDENING - Task 4.10 - Import responsive utilities
import { useResponsive, getMaxContentWidth } from '../../utils/responsive';
// COMMENT: PRIORITY 1 - File Modularization - Import extracted components (underscore prefix prevents Expo Router from treating as routes)
import { SearchScreen } from './_components/SearchScreen';
import { GuildMapModal } from './_components/GuildMapModal';
import { HomeHeader } from './_components/HomeHeader';
import { HomeHeaderCard } from './_components/HomeHeaderCard';
import { HomeActionButtons } from './_components/HomeActionButtons';
import { JobCard } from './_components/JobCard';
import { roundToProperCoinValue } from '../../utils/coinUtils';
// COMMENT: PRIORITY 1 - File Modularization - Import extracted hooks (underscore prefix prevents Expo Router from treating as routes)
import { useHomeAnimations } from './_hooks/useHomeAnimations';
import { useJobs } from './_hooks/useJobs';
import { useAdminTestHandlers } from './_hooks/useAdminTestHandlers';
import { BackendAPI } from '../../config/backend';

const { width, height } = Dimensions.get('window');
const FONT_FAMILY = 'Signika Negative SC';

// COMMENT: PRIORITY 1 - File Modularization - roundToProperCoinValue utility function extracted to utils/coinUtils.ts

export default function HomeScreen() {
  const { theme, isDarkMode } = useTheme();
  // COMMENT: PRODUCTION HARDENING - Task 4.10 - Get responsive dimensions
  const { isTablet, isLargeDevice, width } = useResponsive();
  const { t, isRTL, changeLanguage, language } = useI18n();
  const { profile } = useUserProfile();
  const { chats } = useChat();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  
  // Calculate total unread messages
  const totalUnread = chats.reduce((sum, chat: any) => {
    const unreadCount = typeof chat.unreadCount === 'object' 
      ? (chat.unreadCount[user?.uid || ''] || 0)
      : (chat.unreadCount || 0);
    return sum + unreadCount;
  }, 0);
  // useRenderCounter('HomeScreen'); // Temporarily disabled
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  
  // Top Announcement State - Initialize with current user
  const [topGuild, setTopGuild] = useState<{ name: string; rank: string }>({ name: 'SOLOS', rank: 'A' });
  const [topFreelancer, setTopFreelancer] = useState<{ name: string; rank: string }>(() => {
    // Initialize with current user's name
    if (profile?.fullName) {
      return { name: profile.fullName, rank: 'G' };
    } else if (user?.displayName) {
      return { name: user.displayName, rank: 'G' };
    } else {
      return { name: user?.email?.split('@')[0] || user?.uid?.substring(0, 8) || 'Elite Pro', rank: 'G' };
    }
  });
  const [currentAnnouncement, setCurrentAnnouncement] = useState<'guild' | 'freelancer'>('guild');
  
  // Fetch top guild and update current user as top ranker
  useEffect(() => {
    const fetchTopData = async () => {
      try {
        // Fetch top guild from leaderboard
        try {
          const guildResponse = await BackendAPI.get('/api/guilds/leaderboard?limit=1');
          if (guildResponse?.success && guildResponse?.data?.length > 0) {
            const topGuildData = guildResponse.data[0];
            setTopGuild({
              name: topGuildData.guildName || 'SOLOS',
              rank: topGuildData.guildRank || 'G',
            });
          } else {
            // Fallback data
            setTopGuild({
              name: 'SOLOS',
              rank: 'A',
            });
          }
        } catch (guildError) {
          logger.error('Failed to fetch top guild:', guildError);
          // Fallback data
          setTopGuild({
            name: 'SOLOS',
            rank: 'A',
          });
        }
        
        // Set current user as top ranker
        if (profile?.fullName) {
          setTopFreelancer({
            name: profile.fullName,
            rank: profile.currentRank || 'G',
          });
        } else if (user?.displayName) {
          setTopFreelancer({
            name: user.displayName,
            rank: 'G',
          });
        } else {
          // Fallback to current user's email or uid
          setTopFreelancer({
            name: user?.email?.split('@')[0] || user?.uid?.substring(0, 8) || 'Elite Pro',
            rank: 'G',
          });
        }
      } catch (error) {
        logger.error('Failed to fetch top data:', error);
        // Set fallback data if all fails
        if (!topGuild) {
          setTopGuild({ name: 'SOLOS', rank: 'A' });
        }
        // Always update top ranker to current user
        if (profile?.fullName) {
          setTopFreelancer({ name: profile.fullName, rank: 'G' });
        } else if (user?.displayName) {
          setTopFreelancer({ name: user.displayName, rank: 'G' });
        } else if (user?.email || user?.uid) {
          setTopFreelancer({ name: user?.email?.split('@')[0] || user?.uid?.substring(0, 8) || 'Elite Pro', rank: 'G' });
        }
      }
    };
    
    fetchTopData();
    
    // Refresh data every 30 seconds
    const refreshInterval = setInterval(fetchTopData, 30000);
    
    return () => clearInterval(refreshInterval);
  }, []);
  
  // Update top ranker when profile or user changes
  useEffect(() => {
    if (profile?.fullName) {
      setTopFreelancer({ name: profile.fullName, rank: 'G' });
    } else if (user?.displayName) {
      setTopFreelancer({ name: user.displayName, rank: 'G' });
    } else if (user?.email || user?.uid) {
      setTopFreelancer({ name: user?.email?.split('@')[0] || user?.uid?.substring(0, 8) || 'Elite Pro', rank: 'G' });
    }
  }, [profile?.fullName, user?.displayName, user?.email, user?.uid]);
  
  // Rotate announcement every 10 seconds
  useEffect(() => {
    const rotationInterval = setInterval(() => {
      setCurrentAnnouncement((prev) => prev === 'guild' ? 'freelancer' : 'guild');
    }, 10000);
    
    return () => clearInterval(rotationInterval);
  }, []);
  const [showFilter, setShowFilter] = useState(false);
  const [filterOptions, setFilterOptions] = useState({
    category: '',
    maxDistance: 50,
    minBudget: 0,
    maxBudget: 10000,
    sortBy: 'relevance' as 'distance' | 'budget' | 'datePosted' | 'relevance',
  });
  const scrollY = useRef(new Animated.Value(0)).current;
  
  // COMMENT: PRIORITY 1 - File Modularization - Use extracted hooks
  const {
    button1Anim,
    button2Anim,
    headerButton1Anim,
    headerButton2Anim,
    headerButton3Anim,
    headerButton4Anim,
    jobCardAnims,
    animateButtons,
    animationTimeoutRef,
  } = useHomeAnimations();

  const {
    jobs,
    loadingJobs,
    refreshing,
    jobError,
    availableJobs,
    loadJobs,
    onRefresh,
  } = useJobs(animateButtons);

  const {
    handleTestNotification,
    handleTestRules,
    handleTestContract,
    handleTestTerms,
    handleTestPayment,
  } = useAdminTestHandlers();

  // Keep language state for translations
  const stableLanguage = language || 'en';

  // COMMENT: PRIORITY 1 - File Modularization - Old animation and jobs logic commented out - now in extracted hooks
  /*
  // Animation refs for action buttons
  const button1Anim = useRef(new Animated.Value(0)).current;
  const button2Anim = useRef(new Animated.Value(0)).current;
  
  // Animation refs for header buttons
  const headerButton1Anim = useRef(new Animated.Value(0)).current;
  const headerButton2Anim = useRef(new Animated.Value(0)).current;
  const headerButton3Anim = useRef(new Animated.Value(0)).current;
  const headerButton4Anim = useRef(new Animated.Value(0)).current;
  
  // Animation refs for job cards (support up to 10 cards)
  const jobCardAnims = useRef(
    Array.from({ length: 10 }, () => new Animated.Value(0))
  ).current;

  // COMMENT: PRODUCTION HARDENING - Task 5.1 - Animation timeout ref for cleanup (declared before useEffect)
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Firebase jobs state
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // COMMENT: PRODUCTION HARDENING - Task 5.1 - Fetch jobs from Firebase with cleanup
  useEffect(() => {
    let isMounted = true; // Cleanup flag to prevent state updates on unmounted component
    
    // Wrap async operations in a function that checks isMounted
    const initializeData = async () => {
      await loadJobs();
      if (!isMounted) return; // Early return if component unmounted
      // Animate buttons on mount
      animateButtons();
    };
    
    initializeData();
    
    // Cleanup: Set flag to prevent state updates if component unmounts, clear animation timeout
    return () => {
      isMounted = false;
      // COMMENT: PRODUCTION HARDENING - Task 5.1 - Clear animation timeout on unmount
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
        animationTimeoutRef.current = null;
      }
    };
  }, []);

  // Animation function for buttons
  const animateButtons = () => {
    // COMMENT: PRODUCTION HARDENING - Task 5.1 - Clear any existing animation timeout
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
      animationTimeoutRef.current = null;
    }

    // Reset animation values
    button1Anim.setValue(0);
    button2Anim.setValue(0);
    headerButton1Anim.setValue(0);
    headerButton2Anim.setValue(0);
    headerButton3Anim.setValue(0);
    headerButton4Anim.setValue(0);
    jobCardAnims.forEach(anim => anim.setValue(0));
    
    // Animate header buttons one by one: 1 → 2 → 3 → 4
    Animated.stagger(100, [ // 100ms delay between each button
      Animated.timing(headerButton1Anim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(headerButton2Anim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(headerButton3Anim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(headerButton4Anim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
    
    // Then animate action buttons together (same speed as header buttons)
    Animated.parallel([
      Animated.timing(button1Anim, {
        toValue: 1,
        duration: 300, // Same duration as header buttons
        useNativeDriver: true,
      }),
      Animated.timing(button2Anim, {
        toValue: 1,
        duration: 300, // Same duration as header buttons
        useNativeDriver: true,
      }),
    ]).start();
    
    // COMMENT: PRODUCTION HARDENING - Task 5.1 - Store timeout ID for cleanup
    // Animate job cards with stagger (one by one, same speed)
    animationTimeoutRef.current = setTimeout(() => {
      animationTimeoutRef.current = null;
      Animated.stagger(100, 
        jobCardAnims.map(anim => 
          Animated.timing(anim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          })
        )
      ).start();
    }, 100); // Small delay after buttons
  };

  const [jobError, setJobError] = useState<string | null>(null);

  const loadJobs = async () => {
    // COMMENT: FINAL STABILIZATION - Skip loading jobs if user is not authenticated
    if (!user) {
      logger.debug('🔥 HOME: User not authenticated, skipping job load');
      setLoadingJobs(false);
      setJobs([]);
      return;
    }
    
    setLoadingJobs(true);
    setJobError(null); // Clear previous errors
    try {
      const response = await jobService.getOpenJobs();
      setJobs(response.jobs || []);
    } catch (error) {
      logger.error('Error loading jobs:', error);
      // Show user-friendly error message
      const errorMessage = stableLanguage === 'ar' 
        ? 'فشل تحميل الوظائف. يرجى التحقق من الاتصال بالإنترنت والمحاولة مرة أخرى.'
        : 'Failed to load jobs. Please check your internet connection and try again.';
      setJobError(errorMessage);
    } finally {
      setLoadingJobs(false);
    }
  };

  // Handle pull-to-refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await loadJobs();
    // Trigger button animations on refresh
    animateButtons();
    setRefreshing(false);
  };

  // Keep language state for translations
  const stableLanguage = language || 'en';
  
  // First card = normal, Second card = special (admin-controlled)
  const availableJobs = jobs?.filter(job => job.adminStatus === 'approved') || [];
  */

  const handleAddJob = useCallback(() => {
    router.push('/(modals)/add-job');
  }, []);

  const handleGuildMap = useCallback(() => {
    setShowGuildMapModal(true);
  }, []);

  const handleCloseGuildMapModal = useCallback(() => {
    setShowGuildMapModal(false);
  }, []);

  const [showGuildMapModal, setShowGuildMapModal] = useState(false);

  const handleNotifications = useCallback(() => {
    router.push('/(modals)/notifications');
  }, []);

  // const handleNotificationTest = useCallback(() => {
  //   router.push('/(modals)/notification-test');
  // }, []);

  const handleSettings = useCallback(() => {
    router.push('/(modals)/settings');
  }, []);

  const handleChat = useCallback(() => {
    router.push('/(main)/chat');
  }, []);

  // COMMENT: PRIORITY 1 - File Modularization - Admin test handlers extracted to useAdminTestHandlers hook
  // Old handlers commented out - now imported from _hooks/useAdminTestHandlers.ts
  /*
  // Admin Portal Test Functions - Testing actual features from admin portal
  const handleTestNotification = useCallback(async () => {
    try {
      // Fetch announcements from admin portal
      const response = await fetch('https://guild-yf7q.onrender.com/api/admin/announcements', {
        method: 'GET'
      });
      
      if (response.ok) {
        const announcements = await response.json();
        if (announcements.length > 0) {
          const latest = announcements[0];
          CustomAlertService.showAlert(
            '📢 Latest Announcement', 
            `${latest.title}\n\n${latest.message}\n\nSent by Admin at ${new Date(latest.createdAt).toLocaleString()}`
          );
          logger.debug('📢 All Announcements:', announcements);
        } else {
          CustomAlertService.showAlert('No Announcements', 'No announcements have been sent by admin yet. Create one in the admin portal!');
        }
      } else {
        CustomAlertService.showAlert('Error', `Failed to fetch announcements (Status: ${response.status})`);
      }
    } catch (error) {
      logger.error('Notification Test Error:', error);
      CustomAlertService.showAlert('Error', 'Cannot connect to admin announcements API.');
    }
  }, []);

  const handleTestRules = useCallback(async () => {
    try {
      // Fetch platform rules from admin portal
      const response = await fetch('https://guild-yf7q.onrender.com/api/admin/contract-terms/rules', {
        method: 'GET'
      });
      
      if (response.ok) {
        const rules = await response.json();
        if (rules.length > 0) {
          const rulesList = rules.map((rule: any, index: number) => 
            `${index + 1}. ${rule.text}`
          ).join('\n\n');
          CustomAlertService.showAlert('📜 Platform Rules', rulesList);
          logger.debug('📜 All Platform Rules:', rules);
        } else {
          CustomAlertService.showAlert('No Rules', 'No platform rules have been set. Add rules in the admin portal!');
        }
      } else {
        CustomAlertService.showAlert('Error', `Failed to fetch rules (Status: ${response.status})`);
      }
    } catch (error) {
      logger.error('Rules Test Error:', error);
      CustomAlertService.showAlert('Error', 'Cannot connect to platform rules API.');
    }
  }, []);

  const handleTestContract = useCallback(async () => {
    try {
      // Fetch contract template with all rules and guidelines
      const [rulesResponse, guidelinesResponse] = await Promise.all([
        fetch('https://guild-yf7q.onrender.com/api/admin/contract-terms/rules'),
        fetch('https://guild-yf7q.onrender.com/api/admin/contract-terms/guidelines')
      ]);
      
      if (rulesResponse.ok && guidelinesResponse.ok) {
        const rules = await rulesResponse.json();
        const guidelines = await guidelinesResponse.json();
        
        // Generate a sample contract with current rules
        const contract = {
          jobId: 'TEST-JOB-001',
          jobTitle: 'Sample Mobile App Development',
          clientName: 'Test Client',
          freelancerName: 'Test Freelancer',
          amount: 5000,
          currency: 'QAR',
          platformRules: rules,
          guidelines: guidelines,
          generatedAt: new Date().toISOString()
        };
        
        const contractSummary = `
📄 Contract Generated

Job: ${contract.jobTitle}
Amount: ${contract.amount} ${contract.currency}

Platform Rules: ${rules.length}
Guidelines: ${guidelines.length}

✅ This contract includes all current rules and guidelines from the admin portal.

Check console for full contract details.
        `.trim();
        
        CustomAlertService.showAlert('Contract Preview', contractSummary);
        logger.debug('📄 Full Contract:', contract);
      } else {
        CustomAlertService.showAlert('Error', 'Failed to generate contract. Check if rules and guidelines are set in admin portal.');
      }
    } catch (error) {
      logger.error('Contract Test Error:', error);
      CustomAlertService.showAlert('Error', 'Cannot generate contract from admin portal data.');
    }
  }, []);

  const handleTestTerms = useCallback(async () => {
    try {
      // Fetch all terms, rules, and guidelines
      const [rulesResponse, guidelinesResponse, announcementsResponse] = await Promise.all([
        fetch('https://guild-yf7q.onrender.com/api/admin/contract-terms/rules'),
        fetch('https://guild-yf7q.onrender.com/api/admin/contract-terms/guidelines'),
        fetch('https://guild-yf7q.onrender.com/api/admin/announcements')
      ]);
      
      const rules = rulesResponse.ok ? await rulesResponse.json() : [];
      const guidelines = guidelinesResponse.ok ? await guidelinesResponse.json() : [];
      const announcements = announcementsResponse.ok ? await announcementsResponse.json() : [];
      
      const termsSummary = `
📚 Platform Terms & Rules

📜 Platform Rules: ${rules.length}
📋 Guidelines: ${guidelines.length}
📢 Announcements: ${announcements.length}

All terms are managed through the Admin Portal and update in real-time.

Check console for full details.
      `.trim();
      
      CustomAlertService.showAlert('Terms & Guidelines', termsSummary);
      
      logger.debug('📜 Platform Rules:', rules);
      logger.debug('📋 Guidelines:', guidelines);
      logger.debug('📢 Announcements:', announcements);
    } catch (error) {
      logger.error('Terms Test Error:', error);
      CustomAlertService.showAlert('Error', 'Cannot fetch terms and guidelines from admin portal.');
    }
  }, []);

  // Test payment function
  const handleTestPayment = useCallback(() => {
    // Navigate to payment screen with test data
    router.push({
      pathname: '/(modals)/payment',
      params: {
        amount: '100',
        orderId: `TEST-${Date.now()}`,
        jobId: 'test-job-123',
        description: 'Test Payment - Sadad PSP Integration',
      }
    });
  }, []);
  */

  // Development function to toggle language (no restart needed!)
  const toggleLanguage = useCallback(async () => {
    logger.debug('Home screen language toggle requested');
    logger.debug('Current language:', language, 'isRTL:', isRTL);
    try {
      const newLang = isRTL ? 'en' : 'ar';
      logger.debug('Switching to:', newLang);
      await changeLanguage(newLang);
      logger.debug('Home screen language change completed');
      CustomAlertService.showSuccess(
        'Language Changed',
        `Language switched to ${newLang === 'en' ? 'English' : 'Arabic'}`,
        [{ text: 'OK', style: 'default' }]
      );
    } catch (error) {
      logger.error('Error changing language:', error);
    }
  }, [isRTL, changeLanguage, language]);

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.9],
    extrapolate: 'clamp',
  });

  return (
    <LinearGradient
      colors={[theme.background, theme.surfaceSecondary]}
      style={[styles.container, { paddingHorizontal: 12 }]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
      />

      {/* Main Header Card */}
      <HomeHeaderCard
        totalUnread={totalUnread}
        headerButton1Anim={headerButton1Anim}
        headerButton2Anim={headerButton2Anim}
        headerButton3Anim={headerButton3Anim}
        headerButton4Anim={headerButton4Anim}
        onToggleLanguage={toggleLanguage}
        onNotificationsPress={handleNotifications}
        onChatPress={handleChat}
        onSearchPress={() => router.push('/(main)/search')}
        onSettingsPress={handleSettings}
      />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.primary}
            colors={[theme.primary]}
          />
        }
      >
        {/* Row 1: Search Bar + Add Job Button */}
        <View style={[styles.searchContainer, { marginTop: 8, flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'flex-start', gap: 8 }]}>
          <TouchableOpacity
            style={[styles.searchBar, { 
              backgroundColor: theme.surface, 
              paddingVertical: 10.416, 
              borderRadius: 25, 
              flex: 1,
              borderWidth: isDarkMode ? 0 : 0.5, // Thinner border in light mode only
              borderColor: isDarkMode ? 'transparent' : '#000000' // Black border in light mode only
            }]}
            onPress={() => setShowSearch(true)}
            activeOpacity={0.7}
          >
            <View style={[styles.searchContent, { 
              justifyContent: 'space-between',
              flexDirection: isRTL ? 'row-reverse' : 'row'
            }]}>
              <Text style={[styles.searchPlaceholder, { 
                flex: 1, 
                color: theme.textSecondary, 
                fontWeight: '500',
                textAlign: isRTL ? 'right' : 'left'
              }]}>
                {t('searchJobs')}
              </Text>
              <Ionicons name="search" size={20} color={theme.textSecondary} />
            </View>
          </TouchableOpacity>

          {/* Add Job Button */}
          <TouchableOpacity
            style={[
              styles.guildMapButton,
              {
                backgroundColor: theme.primary,
                borderColor: theme.primary,
                width: 108, // 10% reduced width
              },
            ]}
            onPress={handleAddJob}
            activeOpacity={0.8}
          >
            <Ionicons name="add-circle" size={16} color="#000000" />
            <Text style={[styles.guildMapButtonText, { color: '#000000' }]}>
              {t('addJob')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Row 2: Rotating Top Announcement (Guild/Freelancer) + Guild Map Button */}
        <View style={[styles.announcementRow, { paddingHorizontal: 14.08, flexDirection: isRTL ? 'row-reverse' : 'row', gap: 8 }]}>
          {/* Rotating Top Announcement - Shows both Guild and Freelancer */}
          <View style={[styles.announcementContent, { 
            backgroundColor: theme.surface, 
            borderColor: theme.primary, 
            flex: 1,
            flexDirection: 'row' // Always LTR, no RTL
          }]}>
            <Ionicons 
              name={currentAnnouncement === 'guild' ? 'people' : 'person'} 
              size={16} 
              color={isDarkMode ? theme.primary : '#000000'} // Black in light mode, theme color in dark mode
              style={{ marginRight: 8 }}
            />
            <Text 
              style={[styles.announcementText, { 
                color: theme.textPrimary,
                textAlign: 'left' // Always left-aligned, no RTL
              }]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {currentAnnouncement === 'guild' 
                ? `Top GUILD: ${topGuild?.name || 'SOLOS'}`
                : `Top RANKER: ${topFreelancer?.name || 'Elite Pro'}`
              }
            </Text>
          </View>

          {/* Guild Map Button */}
          <TouchableOpacity
            style={[
              styles.guildMapButton,
              {
                borderWidth: isDarkMode ? 0 : 0.5, // Thinner border in light mode only
                borderColor: isDarkMode ? 'transparent' : '#000000', // Black border in light mode only
                backgroundColor: theme.surface,
                width: 108, // 10% reduced width
              },
            ]}
            onPress={handleGuildMap}
            activeOpacity={0.8}
          >
            <Ionicons name="map" size={16} color={theme.textPrimary} />
            <Text style={[styles.guildMapButtonText, { color: theme.textPrimary }]}>
              {t('guildMap')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Admin Portal Test Buttons - REMOVED FOR PRODUCTION */}


        {/* Available Jobs */}
        <View style={styles.jobsSection}>
          <View style={[styles.sectionHeader, { 
            flexDirection: isRTL ? 'row-reverse' : 'row',
            justifyContent: 'space-between' // Re-add for proper spacing
          }]}>
            <Text style={[styles.sectionTitle, { 
              color: theme.textPrimary,
              textAlign: isRTL ? 'right' : 'left'
            }]}>
              {t('availableJobs')}
            </Text>
            <Text style={[styles.sectionCount, { 
              color: theme.textSecondary,
              textAlign: isRTL ? 'right' : 'left'
            }]}>
              {availableJobs.length} {isRTL ? 'مهمات' : 'Jobs'}
            </Text>
          </View>

          {loadingJobs ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.primary} />
            </View>
          ) : availableJobs.length > 0 ? (
            availableJobs.map((job: any, index: number) => (
              <JobCard
                key={job.id}
                job={job}
                index={index}
                animValue={jobCardAnims[index] || new Animated.Value(1)}
              />
            ))
          ) : (
            <View style={styles.emptyContainer}>
              {jobError ? (
                <>
                  <Ionicons name="alert-circle-outline" size={42.24} color={theme.error} /> {/* 48 * 0.88 = 42.24 (12% reduction) */}
                  <Text style={[styles.emptyText, { color: theme.textPrimary, marginTop: 14.08 }]}> {/* 16 * 0.88 = 14.08 (12% reduction) */}
                    {jobError}
                  </Text>
                  <TouchableOpacity 
                    style={[styles.refreshButton, { backgroundColor: theme.primary, marginTop: 14.08 }]}> {/* 16 * 0.88 = 14.08 (12% reduction) */}
                    onPress={loadJobs}
                  >
                    <Text style={[styles.refreshText, { color: theme.buttonText }]}>
                      {stableLanguage === 'ar' ? 'إعادة المحاولة' : 'Try Again'}
                    </Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                    {stableLanguage === 'ar' ? 'لا توجد وظائف متاحة' : 'No available jobs'}
                  </Text>
                  <TouchableOpacity 
                    style={[styles.refreshButton, { backgroundColor: theme.primary }]}
                    onPress={loadJobs}
                  >
                    <Text style={[styles.refreshText, { color: theme.buttonText }]}>
                      {stableLanguage === 'ar' ? 'تحديث' : 'Refresh'}
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          )}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Search Modal */}
      <SearchScreen
        visible={showSearch}
        onClose={() => setShowSearch(false)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        jobs={jobs}
      />

      {/* Filter Modal */}
      <FilterModal
        visible={showFilter}
        filterOptions={filterOptions}
        onClose={() => setShowFilter(false)}
        onApply={(options) => {
          setFilterOptions(options);
          setShowFilter(false);
        }}
      />

      {/* Custom Guild Map Coming Soon Modal */}
      <GuildMapModal
        visible={showGuildMapModal}
        onClose={handleCloseGuildMapModal}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mainHeaderCard: {
    backgroundColor: '#BCFF31', // Keep neon green for header card
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 26, // Increased from 16 to 26 (+10px)
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  betaTesterContainer: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  betaTesterText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#000000',
    letterSpacing: 1,
    textTransform: 'uppercase',
    opacity: 0.6,
  },
  headerTop: {
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    fontFamily: FONT_FAMILY,
  },
  headerRight: {
    gap: 5,
  },
  headerIconButton: {
    backgroundColor: '#000000', // Keep black for contrast on neon green
    borderRadius: 12,
    padding: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#000000',
  },
  notificationDotText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '700',
  },
  headerBottom: {
    alignItems: 'center',
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 20,
  },
  userGreeting: {
    flex: 1,
  },
  greetingText: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
  },
  scrollView: {
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 12, // 12px distance to next row
  },
  searchBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  searchPlaceholder: {
    fontSize: 11.2, // 16 * 0.7 = 11.2 (30% reduction)
    marginRight: 8,
  },
  userPicsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 12,
    paddingVertical: 8,
  },
  userPicWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  userPic: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  userPicPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userPicText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  announcementRow: {
    marginTop: 0, // No top margin, spacing handled by searchContainer marginBottom
    marginBottom: 12,
    alignItems: 'center',
  },
  announcementContainer: {
    marginTop: 0,
    marginBottom: 12,
  },
  announcementContent: {
    // flexDirection removed - set dynamically based on RTL
    alignItems: 'center',
    paddingVertical: 10.416,
    paddingHorizontal: 12,
    borderRadius: 25, // Same as search bar
    borderWidth: 1,
    opacity: 0.9, // High opacity
  },
  announcementText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  guildMapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10.416,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  guildMapButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  sectionHeader: {
    // flexDirection and justifyContent removed - set dynamically based on RTL
    alignItems: 'center',
    paddingHorizontal: 14.08, // 16 * 0.88 = 14.08 (12% reduction)
    marginBottom: 14.08, // 16 * 0.88 = 14.08 (12% reduction)
  },
  sectionCount: {
    fontSize: 12.32, // 14 * 0.88 = 12.32 (12% reduction)
    fontWeight: '500',
  },
  jobInfoContainer: {
    padding: 10.56, // 12 * 0.88 = 10.56 (12% reduction)
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  companyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  authorAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  authorInitial: {
    fontSize: 12,
    fontWeight: '600',
  },
  companyDetails: {
    flex: 1,
  },
  jobAuthor: {
    fontSize: 11,
    fontWeight: '500',
  },
  posterGID: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 1,
  },
  jobMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 11,
    fontWeight: '500',
  },
  priceTag: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    alignItems: 'center',
  },
  currentPrice: {
    fontSize: 12,
    fontWeight: '700',
  },
  currencyLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
  },
  ratingContainer: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  priceTagBottom: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    alignItems: 'center',
    minWidth: 50,
    flexDirection: 'row',
    gap: 4,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '600',
  },
  actionsContainer: {
    paddingHorizontal: 14.08, // 16 * 0.88 = 14.08 (12% reduction)
    marginBottom: 10.56, // 12 * 0.88 = 10.56 (12% reduction)
    gap: 10.56, // 12 * 0.88 = 10.56 (12% reduction)
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18.6, // 15.5 * 1.2 = 18.6 (20% increase for buttons)
    borderRadius: 14.4, // 12 * 1.2 = 14.4 (20% increase for buttons)
    borderWidth: 1,
    gap: 9.6, // 8 * 1.2 = 9.6 (20% increase for buttons)
  },
  actionButtonText: {
    fontSize: 19.2, // 16 * 1.2 = 19.2 (20% increase for buttons)
    fontWeight: '600',
  },
  jobsSection: {
    paddingHorizontal: 14.08, // 16 * 0.88 = 14.08 (12% reduction)
    marginBottom: 17.6, // 20 * 0.88 = 17.6 (12% reduction)
  },
  sectionTitle: {
    fontSize: 15.84, // 18 * 0.88 = 15.84 (12% reduction)
    fontWeight: '900',
    fontFamily: FONT_FAMILY,
  },
  jobCard: {
    borderRadius: 10.56, // 12 * 0.88 = 10.56 (12% reduction)
    marginBottom: 10.56, // 12 * 0.88 = 10.56 (12% reduction)
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1.76 }, // 2 * 0.88 = 1.76 (12% reduction)
    shadowOpacity: 0.08,
    shadowRadius: 7.04, // 8 * 0.88 = 7.04 (12% reduction)
    elevation: 4,
  },
  jobTitle: {
    fontSize: 14.08, // 16 * 0.88 = 14.08 (12% reduction)
    fontWeight: '700',
    marginBottom: 5.28, // 6 * 0.88 = 5.28 (12% reduction)
    lineHeight: 17.6, // 20 * 0.88 = 17.6 (12% reduction)
  },
  jobDescription: {
    fontSize: 11.44, // 13 * 0.88 = 11.44 (12% reduction)
    lineHeight: 15.84, // 18 * 0.88 = 15.84 (12% reduction)
    marginBottom: 7.04, // 8 * 0.88 = 7.04 (12% reduction)
  },
  jobFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 3.52, // 4 * 0.88 = 3.52 (12% reduction)
  },
  urgentBadge: {
    position: 'absolute',
    top: 10.56, // 12 * 0.88 = 10.56 (12% reduction)
    left: 10.56, // 12 * 0.88 = 10.56 (12% reduction)
    paddingHorizontal: 5.28, // 6 * 0.88 = 5.28 (12% reduction)
    paddingVertical: 2.64, // 3 * 0.88 = 2.64 (12% reduction)
    borderRadius: 7.04, // 8 * 0.88 = 7.04 (12% reduction)
  },
  urgentText: {
    fontSize: 8.8, // 10 * 0.88 = 8.8 (12% reduction)
    fontWeight: '700',
  },
  jobLocation: {
    fontSize: 9.68, // 11 * 0.88 = 9.68 (12% reduction)
    fontWeight: '500',
  },
  jobTimeNeeded: {
    fontSize: 10.56, // 12 * 0.88 = 10.56 (12% reduction)
  },
  bottomSpacer: {
    height: 88, // 100 * 0.88 = 88 (12% reduction)
  },
  // COMMENT: PRIORITY 1 - File Modularization - Search modal styles moved to _components/SearchScreen.tsx
  // Old styles commented out - now in extracted component file
  /*
  // Search Modal Styles
  searchModal: {
    flex: 1,
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  searchInput: {
    flex: 1,
    height: 40,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginRight: 12,
  },
  closeButton: {
    padding: 8,
  },
  searchResults: {
    flex: 1,
    padding: 16,
  },
  searchResultItem: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
  },
  searchResultTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  searchResultCompany: {
    fontSize: 14,
    marginBottom: 4,
  },
  searchResultSalary: {
    fontSize: 14,
    fontWeight: '600',
  },
  noResults: {
    textAlign: 'center',
    fontSize: 16,
    marginTop: 40,
  },
  */
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 44, // 50 * 0.88 = 44 (12% reduction)
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 35.2, // 40 * 0.88 = 35.2 (12% reduction)
  },
  testSection: {
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 16,
    borderRadius: 12,
  },
  testSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  testSectionSubtitle: {
    fontSize: 12,
    marginBottom: 16,
    lineHeight: 16,
  },
  testButtonsContainer: {
    gap: 8,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 120,
    marginBottom: 8,
  },
  testButtonText: {
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
  },
  emptyText: {
    fontSize: 14.08, // 16 * 0.88 = 14.08 (12% reduction)
    fontFamily: 'Signika Negative SC',
    marginBottom: 14.08, // 16 * 0.88 = 14.08 (12% reduction)
  },
  refreshButton: {
    paddingHorizontal: 28.8, // 24 * 1.2 = 28.8 (20% increase for buttons)
    paddingVertical: 14.4, // 12 * 1.2 = 14.4 (20% increase for buttons)
    borderRadius: 24, // 20 * 1.2 = 24 (20% increase for buttons)
  },
  refreshText: {
    fontSize: 16.8, // 14 * 1.2 = 16.8 (20% increase for buttons)
    fontFamily: 'Signika Negative SC',
    fontWeight: '600',
  },
});

// COMMENT: PRIORITY 1 - File Modularization - GuildMapModal component extracted to _components/GuildMapModal.tsx
// Old component definition commented out - now imported from _components/GuildMapModal.tsx
/*
// Real Guild Map Modal with actual map component
const GuildMapModal = React.memo(({ visible, onClose }: { visible: boolean; onClose: () => void }) => {
  const { theme } = useTheme();
  const { t, isRTL } = useI18n();
  const [mapJobs, setMapJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (visible) {
      loadMapJobs();
    }
  }, [visible]);

  const loadMapJobs = async () => {
    setLoading(true);
    try {
      // Load jobs with location data for the map
      const response = await jobService.getOpenJobs();
      const jobsWithLocation = (response.jobs || []).filter(job => 
        typeof job.location === 'object' && job.location?.coordinates?.latitude && job.location?.coordinates?.longitude
      );
      setMapJobs(jobsWithLocation);
    } catch (error) {
      logger.error('Error loading map jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJobPress = (job: any) => {
    onClose();
    router.push({
      pathname: '/(modals)/job-details',
      params: { jobData: JSON.stringify(job) }
    });
  };

  const handleLocationPress = (location: { latitude: number; longitude: number; address: string }) => {
    CustomAlertService.showInfo(
      t('location'),
      `${t('location')}: ${location.address}`
    );
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={guildModalStyles.mapContainer}>
        <View style={[guildModalStyles.mapHeader, { backgroundColor: theme.surface }]}>
          <View style={guildModalStyles.shieldIconContainer}>
            <Shield size={24} color={theme.primary} />
          </View>
          <Text style={[guildModalStyles.mapTitle, { color: theme.textPrimary }]}>
            {t('guildMap')}
          </Text>
          <TouchableOpacity
            onPress={onClose}
            style={guildModalStyles.closeButton}
          >
            <Ionicons name="close" size={24} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={guildModalStyles.mapContent}>
          {loading ? (
            <View style={guildModalStyles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.primary} />
              <Text style={[guildModalStyles.loadingText, { color: theme.textSecondary }]}>
                {t('loadingMap')}
              </Text>
            </View>
          ) : (
            <JobMap
              jobs={mapJobs}
              onJobPress={handleJobPress}
              onLocationPress={handleLocationPress}
            />
          )}
        </View>
      </View>
    </Modal>
  );
});
*/

// COMMENT: PRIORITY 1 - File Modularization - guildModalStyles moved to _components/GuildMapModal.tsx
// Old styles commented out - now in extracted component file
/*
const guildModalStyles = StyleSheet.create({
  mapContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  mapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
    zIndex: 1000,
  },
  shieldIconContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapContent: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
});
*/
