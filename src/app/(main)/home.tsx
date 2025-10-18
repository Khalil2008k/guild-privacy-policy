import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, StatusBar, Animated, Dimensions, Modal, Image, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons, Feather, MaterialIcons } from '@expo/vector-icons';
import { Shield } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../contexts/ThemeContext';
import { useUserProfile } from '../../contexts/UserProfileContext';
import FilterModal from '../screens/leads-feed/FilterModal';
import { useI18n } from '../../contexts/I18nProvider';
import { useMemoizedValue, useRenderCounter } from '../../utils/performance';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { I18nManager } from 'react-native';
import { CustomAlertService } from '../../services/CustomAlertService';
import { jobService, Job } from '../../services/jobService';
import { JobMap } from '../../components/JobMap';
import { FakePaymentDisplay } from '../../components/FakePaymentDisplay';
import { 
  createButtonAccessibility, 
  createTextInputAccessibility, 
  createHeaderAccessibility,
  createSearchAccessibility,
  createListAccessibility,
  createListItemAccessibility
} from '../../utils/accessibility';

// Create a simple search screen component
const SearchScreen = React.memo(({ visible, onClose, searchQuery, onSearchChange, jobs }: any) => {
  const { theme } = useTheme();
  const { t, isRTL } = useI18n();

  if (!visible) return null;

  const filteredJobs = jobs.filter((job: any) =>
    job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.skills.some((skill: string) => skill.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.searchModal, { backgroundColor: theme.background }]}>
        <View style={[styles.searchHeader, { borderBottomColor: theme.border }]}>
          <TextInput
            style={[styles.searchInput, { backgroundColor: theme.surface, color: theme.textPrimary }]}
            placeholder={t('searchJobs')}
            placeholderTextColor={theme.textSecondary}
            value={searchQuery}
            onChangeText={onSearchChange}
            autoFocus
            {...createSearchAccessibility(
              t('searchJobs'),
              searchQuery,
              isRTL ? 'ابحث عن الوظائف بالعنوان أو الشركة أو المهارات' : 'Search jobs by title, company, or skills'
            )}
          />
          <TouchableOpacity 
            onPress={onClose} 
            style={styles.closeButton}
            {...createButtonAccessibility(
              isRTL ? 'إغلاق البحث' : 'Close search',
              isRTL ? 'اضغط لإغلاق شاشة البحث' : 'Tap to close search screen'
            )}
          >
            <Ionicons name="close" size={24} color={theme.textPrimary} />
          </TouchableOpacity>
        </View>
        <ScrollView 
          style={styles.searchResults}
          {...createListAccessibility(
            isRTL ? 'نتائج البحث' : 'Search results',
            filteredJobs.length
          )}
        >
          {filteredJobs.map((job: any, index: number) => (
            <TouchableOpacity
              key={job.id}
              style={[styles.searchResultItem, { backgroundColor: theme.surface, borderColor: theme.border }]}
              onPress={() => {
                onClose();
                router.push(`/(modals)/job/${job.id}`);
              }}
              {...createListItemAccessibility(
                `${job.title} ${isRTL ? 'في' : 'at'} ${job.company}`,
                index + 1,
                filteredJobs.length,
                isRTL ? `راتب: ${job.budget}, موقع: ${typeof job.location === 'object' ? job.location?.address || 'غير محدد' : job.location}` : `Budget: ${job.budget}, Location: ${typeof job.location === 'object' ? job.location?.address || 'Not specified' : job.location}`
              )}
            >
              <Text style={[styles.searchResultTitle, { color: theme.textPrimary }]}>{job.title}</Text>
              <Text style={[styles.searchResultCompany, { color: theme.textSecondary }]}>{job.company}</Text>
              <Text style={[styles.searchResultSalary, { color: theme.primary }]}>
                {typeof job.budget === 'string' ? job.budget : `${job.budget?.min || 0}-${job.budget?.max || 0} ${job.budget?.currency || 'QR'}`}
              </Text>
            </TouchableOpacity>
          ))}
          {filteredJobs.length === 0 && (
            <Text style={[styles.noResults, { color: theme.textSecondary }]}>{t('noJobsFound')}</Text>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
});

const { width, height } = Dimensions.get('window');
const FONT_FAMILY = 'Signika Negative SC';

export default function HomeScreen() {
  const { theme } = useTheme();
  const { t, isRTL, changeLanguage, language } = useI18n();
  const { profile } = useUserProfile();
  const insets = useSafeAreaInsets();
  // useRenderCounter('HomeScreen'); // Temporarily disabled
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [filterOptions, setFilterOptions] = useState({
    category: '',
    maxDistance: 50,
    minBudget: 0,
    maxBudget: 10000,
    sortBy: 'relevance' as 'distance' | 'budget' | 'datePosted' | 'relevance',
  });
  const scrollY = useRef(new Animated.Value(0)).current;

  // Firebase jobs state
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  
  // Fetch jobs from Firebase
  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    setLoadingJobs(true);
    try {
      const response = await jobService.getOpenJobs();
      setJobs(response.jobs || []);
    } catch (error) {
      console.error('Error loading jobs:', error);
    } finally {
      setLoadingJobs(false);
    }
  };

  // Keep language state for translations
  const stableLanguage = language || 'en';
  
  // First card = normal, Second card = special (admin-controlled)
  const availableJobs = jobs?.filter(job => job.adminStatus === 'approved') || [];

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
          console.log('📢 All Announcements:', announcements);
        } else {
          CustomAlertService.showAlert('No Announcements', 'No announcements have been sent by admin yet. Create one in the admin portal!');
        }
      } else {
        CustomAlertService.showAlert('Error', `Failed to fetch announcements (Status: ${response.status})`);
      }
    } catch (error) {
      console.error('Notification Test Error:', error);
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
          console.log('📜 All Platform Rules:', rules);
        } else {
          CustomAlertService.showAlert('No Rules', 'No platform rules have been set. Add rules in the admin portal!');
        }
      } else {
        CustomAlertService.showAlert('Error', `Failed to fetch rules (Status: ${response.status})`);
      }
    } catch (error) {
      console.error('Rules Test Error:', error);
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
        console.log('📄 Full Contract:', contract);
      } else {
        CustomAlertService.showAlert('Error', 'Failed to generate contract. Check if rules and guidelines are set in admin portal.');
      }
    } catch (error) {
      console.error('Contract Test Error:', error);
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
      
      console.log('📜 Platform Rules:', rules);
      console.log('📋 Guidelines:', guidelines);
      console.log('📢 Announcements:', announcements);
    } catch (error) {
      console.error('Terms Test Error:', error);
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
        description: 'Test Payment - Fatora PSP Integration',
      }
    });
  }, []);

  // Development function to toggle language (no restart needed!)
  const toggleLanguage = useCallback(async () => {
    console.log('Home screen language toggle requested');
    console.log('Current language:', language, 'isRTL:', isRTL);
    try {
      const newLang = isRTL ? 'en' : 'ar';
      console.log('Switching to:', newLang);
      await changeLanguage(newLang);
      console.log('Home screen language change completed');
      CustomAlertService.showSuccess(
        'Language Changed',
        `Language switched to ${newLang === 'en' ? 'English' : 'Arabic'}`,
        [{ text: 'OK', style: 'default' }]
      );
    } catch (error) {
      console.error('Error changing language:', error);
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
      <View style={[styles.mainHeaderCard, { paddingTop: insets.top + 14, marginHorizontal: 3 }]}>
        <View style={[styles.headerTop, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <View style={[styles.headerCenter, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Shield size={24} color={theme.buttonText} />
            <TouchableOpacity onPress={toggleLanguage}>
              <Text style={[styles.headerTitle, { color: theme.buttonText, marginLeft: isRTL ? 0 : 8, marginRight: isRTL ? 8 : 0 }]}>
                GUILD
              </Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.headerRight, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <TouchableOpacity
              style={styles.headerIconButton}
              onPress={handleNotifications}
              activeOpacity={0.7}
            >
              <Ionicons name="notifications-outline" size={20} color={theme.primary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.headerIconButton}
              onPress={handleChat}
              activeOpacity={0.7}
            >
              <Ionicons name="chatbubble-outline" size={20} color={theme.primary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.headerIconButton}
              onPress={() => router.push('/(main)/search')}
              activeOpacity={0.7}
            >
              <Ionicons name="search-outline" size={20} color={theme.primary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.headerIconButton}
              onPress={handleSettings}
              activeOpacity={0.7}
            >
              <Ionicons name="menu-outline" size={20} color={theme.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Beta Tester Badge */}
        <View style={styles.betaTesterContainer}>
          <Text style={styles.betaTesterText}>
            {isRTL ? 'مختبر بيتا' : 'Beta Tester'}
          </Text>
        </View>

        <View style={[styles.headerBottom, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <TouchableOpacity 
            style={[styles.userAvatar, { marginRight: isRTL ? 0 : 12, marginLeft: isRTL ? 12 : 0 }]}
            onPress={() => router.push('/(main)/profile')}
          >
            {profile?.profileImage ? (
              <Image 
                source={{ uri: profile.profileImage }} 
                style={styles.avatarImage}
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>👤</Text>
              </View>
            )}
          </TouchableOpacity>
          <View style={styles.userGreeting}>
            <Text style={[styles.greetingText, { color: theme.buttonText, textAlign: isRTL ? 'right' : 'left' }]}>
              {profile.fullName 
                ? (isRTL ? `هلا، ${profile.fullName.split(' ')[0]}!` : `Hi, ${profile.fullName.split(' ')[0]}!`)
                : (isRTL ? 'هلا!' : 'Hi!')
              }
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {/* Search Bar */}
        <View style={[styles.searchContainer, { marginTop: 8, alignItems: 'center' }]}>
          <TouchableOpacity
            style={[styles.searchBar, { backgroundColor: theme.surface, paddingVertical: 7.5, borderRadius: 25, width: '78%' }]}
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
        </View>

        {/* Action Buttons */}
        <View style={[styles.actionsContainer, { flexDirection: isRTL ? 'row-reverse' : 'row', flexWrap: 'wrap' }]}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border, borderWidth: 1 }]}
            onPress={handleAddJob}
            activeOpacity={0.7}
          >
            <Ionicons name="add-circle" size={20} color={theme.primary} />
            <Text style={[styles.actionButtonText, { color: theme.textPrimary }]}>{t('addJob')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border, borderWidth: 1 }]}
            onPress={handleGuildMap}
            activeOpacity={0.7}
          >
            <Feather name="map" size={20} color={theme.primary} />
            <Text style={[styles.actionButtonText, { color: theme.textPrimary }]}>{t('guildMap')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { 
              backgroundColor: theme.primary, 
              borderColor: theme.primary, 
              borderWidth: 1,
              shadowColor: theme.primary,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 4,
            }]}
            onPress={handleTestPayment}
            activeOpacity={0.7}
          >
            <Ionicons name="card" size={20} color="#000000" />
            <Text style={[styles.actionButtonText, { color: '#000000', fontWeight: '700' }]}>
              {isRTL ? 'اختبار الدفع' : 'Test Payment'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Admin Portal Test Buttons */}
        <View style={[styles.testSection, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border, borderWidth: 1 }]}>
          <Text style={[styles.testSectionTitle, { color: theme.textPrimary }]}>
            🧪 Admin Portal Connection Tests
          </Text>
          <Text style={[styles.testSectionSubtitle, { color: theme.textSecondary }]}>
            {isRTL 
              ? 'اختبر التحديثات الفورية من لوحة الإدارة' 
              : 'Test real-time updates from admin portal'
            }
          </Text>
          
          <View style={[styles.testButtonsContainer, { flexDirection: isRTL ? 'row-reverse' : 'row', flexWrap: 'wrap' }]}>
            <TouchableOpacity
              style={[styles.testButton, { backgroundColor: '#FFB020', borderColor: '#FFB020' }]}
              onPress={handleTestNotification}
              activeOpacity={0.7}
            >
              <Ionicons name="notifications" size={16} color="#000000" />
              <Text style={[styles.testButtonText, { color: '#000000' }]}>
                {isRTL ? 'الإعلانات' : 'Announcements'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.testButton, { backgroundColor: '#4A90E2', borderColor: '#4A90E2' }]}
              onPress={handleTestRules}
              activeOpacity={0.7}
            >
              <Ionicons name="document-text" size={16} color="#FFFFFF" />
              <Text style={[styles.testButtonText, { color: '#FFFFFF' }]}>
                {isRTL ? 'قواعد المنصة' : 'Platform Rules'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.testButton, { backgroundColor: '#8B5CF6', borderColor: '#8B5CF6' }]}
              onPress={handleTestContract}
              activeOpacity={0.7}
            >
              <Ionicons name="document" size={16} color="#FFFFFF" />
              <Text style={[styles.testButtonText, { color: '#FFFFFF' }]}>
                {isRTL ? 'إنشاء عقد' : 'Generate Contract'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.testButton, { backgroundColor: '#10B981', borderColor: '#10B981' }]}
              onPress={handleTestTerms}
              activeOpacity={0.7}
            >
              <Ionicons name="list" size={16} color="#FFFFFF" />
              <Text style={[styles.testButtonText, { color: '#FFFFFF' }]}>
                {isRTL ? 'كل الشروط' : 'All Terms'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>


        {/* Available Jobs */}
        <View style={styles.jobsSection}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
              {t('availableJobs')}
            </Text>
            <Text style={[styles.sectionCount, { color: theme.textSecondary }]}>
              {availableJobs.length} Jobs
            </Text>
          </View>

          {loadingJobs ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.primary} />
            </View>
          ) : availableJobs.length > 0 ? (
            availableJobs.map((job: any, index: number) => (
              <TouchableOpacity
              key={job.id}
              style={[
                styles.jobCard,
                { backgroundColor: theme.surface },
                index === 1 && {
                  shadowColor: theme.primary,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.15,
                  shadowRadius: 16,
                  elevation: 6,
                  borderWidth: 1,
                  borderColor: theme.primary + '30',
                }
              ]}
              onPress={() => router.push(`/(modals)/job/${job.id}`)}
              activeOpacity={0.7}
            >
              {/* Job Info */}
              <View style={styles.jobInfoContainer}>
                {/* Rating in corner */}
                <View style={styles.ratingContainer}>
                  <Ionicons name="star" size={12} color={theme.primary} />
                  <Text style={[styles.ratingText, { color: theme.textSecondary }]}>
                    {job.rating || '4.2'}
                  </Text>
                </View>

                {/* Price tag in bottom corner - Enhanced for second card */}
                <View style={[
                  styles.priceTagBottom,
                  { backgroundColor: theme.primary },
                  index === 1 && {
                    backgroundColor: theme.surface,
                    paddingVertical: 6,
                    paddingHorizontal: 10,
                    borderRadius: 8,
                    borderWidth: 2,
                    borderColor: theme.primary,
                  }
                ]}>
                  <Text style={[
                    styles.currentPrice,
                    { color: '#000000' },
                    index === 1 && {
                      fontSize: 13,
                      color: theme.primary,
                      fontWeight: '700',
                    }
                  ]}>
                    {typeof job.budget === 'string' ? job.budget.replace(' QR', '') : `${job.budget?.min || 0}-${job.budget?.max || 0}`}
                  </Text>
                  {index === 1 && (
                    <Text style={[styles.currencyLabel, { color: theme.primary }]}>
                      QR
                    </Text>
                  )}
                </View>
                
                {/* Header Row: Company + Salary */}
                <View style={styles.cardHeader}>
                  <View style={styles.companyInfo}>
                    <View style={styles.authorAvatar}>
                      {job.posterImage ? (
                        <Image 
                          source={{ uri: job.posterImage }} 
                          style={styles.avatarImage}
                        />
                      ) : (
                        <Text style={[styles.authorInitial, { color: theme.primary }]}>
                          {job.company?.charAt(0) || 'C'}
                        </Text>
                      )}
                    </View>
                    <View style={styles.companyDetails}>
                      <Text style={[styles.jobAuthor, { color: theme.textSecondary }]} numberOfLines={1}>
                        {job.company}
                      </Text>
                      <Text style={[styles.posterGID, { color: theme.textSecondary }]}>
                        GID: {job.posterGID || '12345'}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Job Title */}
                <Text style={[styles.jobTitle, { color: theme.textPrimary }]} numberOfLines={2}>
                  {job.title}
                </Text>

                {/* Job Description */}
                <Text style={[styles.jobDescription, { color: theme.textSecondary }]} numberOfLines={2}>
                  {job.description}
                </Text>

                {/* Job Meta Info */}
                <View style={styles.jobMetaRow}>
                  <View style={styles.metaItem}>
                    <Ionicons name="location-outline" size={12} color={theme.textSecondary} />
                    <Text style={[styles.metaText, { color: theme.textSecondary }]}>
                      {typeof job.location === 'object' ? job.location?.address || 'Remote' : job.location}
                    </Text>
                  </View>
                </View>

                {/* Footer: Time */}
                <View style={styles.jobFooter}>
                  <View style={styles.metaItem}>
                    <Ionicons name="time-outline" size={12} color={theme.textSecondary} />
                    <Text style={[styles.metaText, { color: theme.textSecondary }]}>
                      {job.timeNeeded}
                    </Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))
          ) : (
            <View style={styles.emptyContainer}>
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
    paddingVertical: 16,
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
    marginBottom: 20,
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
    fontSize: 16,
    marginRight: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionCount: {
    fontSize: 14,
    fontWeight: '500',
  },
  jobInfoContainer: {
    padding: 12,
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
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15.5,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  jobsSection: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    fontFamily: FONT_FAMILY,
  },
  jobCard: {
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
    lineHeight: 20,
  },
  jobDescription: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  jobFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  urgentBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
  },
  urgentText: {
    fontSize: 10,
    fontWeight: '700',
  },
  jobLocation: {
    fontSize: 11,
    fontWeight: '500',
  },
  jobTimeNeeded: {
    fontSize: 12,
  },
  bottomSpacer: {
    height: 100,
  },
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
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
    fontSize: 16,
    fontFamily: 'Signika Negative SC',
    marginBottom: 16,
  },
  refreshButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  refreshText: {
    fontSize: 14,
    fontFamily: 'Signika Negative SC',
    fontWeight: '600',
  },
});

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
      console.error('Error loading map jobs:', error);
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
      isRTL ? 'موقع' : 'Location',
      isRTL ? `تم تحديد الموقع: ${location.address}` : `Location selected: ${location.address}`
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
        {/* Header */}
        <View style={[guildModalStyles.mapHeader, { backgroundColor: theme.surface }]}>
          <View style={guildModalStyles.shieldIconContainer}>
            <Shield size={24} color={theme.primary} />
          </View>
          <Text style={[guildModalStyles.mapTitle, { color: theme.textPrimary }]}>
            {isRTL ? 'خريطة GUILD' : 'GUILD Map'}
          </Text>
          <TouchableOpacity
            onPress={onClose}
            style={guildModalStyles.closeButton}
          >
            <Ionicons name="close" size={24} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Real Map Content */}
        <View style={guildModalStyles.mapContent}>
          {loading ? (
            <View style={guildModalStyles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.primary} />
              <Text style={[guildModalStyles.loadingText, { color: theme.textSecondary }]}>
                {isRTL ? 'جاري تحميل الخريطة...' : 'Loading map...'}
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
