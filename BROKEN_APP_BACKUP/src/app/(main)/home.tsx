import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, StatusBar, Animated, Dimensions, Modal, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons, Feather, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../contexts/ThemeContext';
import FilterModal from '../screens/leads-feed/FilterModal';
import { useI18n } from '../../contexts/I18nProvider';
import { useMemoizedValue, useRenderCounter } from '../../utils/performance';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { I18nManager, Alert } from 'react-native';
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
                isRTL ? `راتب: ${job.salary}, موقع: ${job.location}` : `Salary: ${job.salary}, Location: ${job.location}`
              )}
            >
              <Text style={[styles.searchResultTitle, { color: theme.textPrimary }]}>{job.title}</Text>
              <Text style={[styles.searchResultCompany, { color: theme.textSecondary }]}>{job.company}</Text>
              <Text style={[styles.searchResultSalary, { color: theme.primary }]}>{job.salary}</Text>
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
  const insets = useSafeAreaInsets();
  useRenderCounter('HomeScreen');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [filterOptions, setFilterOptions] = useState({
    category: '',
    maxDistance: 50,
    minBudget: 0,
    maxBudget: 10000,
    sortBy: 'relevance' as const,
  });
  const scrollY = useRef(new Animated.Value(0)).current;

  // Mock data for demonstration - memoized to prevent unnecessary re-computations
  // Use stable language with fallback to prevent empty dependency arrays
  const stableLanguage = language || 'en';
  const jobs = useMemoizedValue(() => {
    const currentLang = stableLanguage;
    return [
    // Featured Jobs
    {
      id: 1,
      title: currentLang === 'ar' ? 'مطور React Native أول' : 'Senior React Native Developer',
      company: currentLang === 'ar' ? 'شركة التقنية المحدودة' : 'TechCorp Inc.',
      location: currentLang === 'ar' ? 'نيويورك، نيويورك' : 'New York, NY',
      salary: currentLang === 'ar' ? '120-150 ألف ق.ر' : 'QR 120k - 150k',
      skills: currentLang === 'ar' ? ['React Native', 'TypeScript', 'Node.js', 'GraphQL'] : ['React Native', 'TypeScript', 'Node.js', 'GraphQL'],
      category: 'Development',
      description: currentLang === 'ar' ? 'نبحث عن مطور React Native ذو خبرة للانضمام إلى فريق التطبيقات المحمولة.' : 'Looking for an experienced React Native developer to join our mobile team.',
      featured: true
    },
    {
      id: 2,
      title: currentLang === 'ar' ? 'مصمم تجربة المستخدم' : 'UX/UI Designer',
      company: currentLang === 'ar' ? 'استوديو التصميم' : 'DesignStudio',
      location: currentLang === 'ar' ? 'سان فرانسيسكو، كاليفورنيا' : 'San Francisco, CA',
      salary: currentLang === 'ar' ? '90-120 ألف ق.ر' : 'QR 90k - 120k',
      skills: currentLang === 'ar' ? ['Figma', 'Sketch', 'Adobe XD', 'النماذج الأولية'] : ['Figma', 'Sketch', 'Adobe XD', 'Prototyping'],
      category: 'Design',
      description: currentLang === 'ar' ? 'مصمم تجربة مستخدم مبدع مطلوب لمشاريع تطبيقات محمولة مبتكرة.' : 'Creative UX/UI designer needed for innovative mobile app projects.',
      featured: true
    },
    {
      id: 3,
      title: currentLang === 'ar' ? 'مطور Full Stack' : 'Full Stack Developer',
      company: currentLang === 'ar' ? 'شركة StartupXYZ' : 'StartupXYZ',
      location: currentLang === 'ar' ? 'أوستن، تكساس' : 'Austin, TX',
      salary: currentLang === 'ar' ? '100-130 ألف ق.ر' : 'QR 100k - 130k',
      skills: currentLang === 'ar' ? ['React', 'Node.js', 'MongoDB', 'AWS'] : ['React', 'Node.js', 'MongoDB', 'AWS'],
      category: 'Development',
      description: currentLang === 'ar' ? 'مطور Full Stack مطلوب لشركة ناشئة سريعة النمو.' : 'Full stack developer wanted for fast-growing startup.',
      featured: true
    },
    // Available Jobs (Non-Featured)
    {
      id: 19,
      title: currentLang === 'ar' ? 'مطور واجهات أمامية مبتدئ' : 'Junior Frontend Developer',
      company: currentLang === 'ar' ? 'مركز الشركات الناشئة' : 'StartupHub',
      location: currentLang === 'ar' ? 'أوستن، تكساس' : 'Austin, TX',
      salary: currentLang === 'ar' ? '65-85 ألف ق.ر' : 'QR 65k - 85k',
      skills: currentLang === 'ar' ? ['HTML', 'CSS', 'JavaScript', 'React'] : ['HTML', 'CSS', 'JavaScript', 'React'],
      category: 'Development',
      description: currentLang === 'ar' ? 'منصب مبتدئ لمطوري الواجهات الأمامية المتحمسين.' : 'Entry-level position for passionate frontend developers.',
      featured: false
    },
    {
      id: 20,
      title: currentLang === 'ar' ? 'كاتب محتوى' : 'Content Writer',
      company: currentLang === 'ar' ? 'شركة المدونات' : 'BlogCorp',
      location: currentLang === 'ar' ? 'عن بُعد' : 'Remote',
      salary: currentLang === 'ar' ? '45-65 ألف ق.ر' : 'QR 45k - 65k',
      skills: currentLang === 'ar' ? ['الكتابة', 'تحسين محركات البحث', 'استراتيجية المحتوى', 'WordPress'] : ['Writing', 'SEO', 'Content Strategy', 'WordPress'],
      category: 'Content',
      description: currentLang === 'ar' ? 'إنشاء محتوى جذاب للمدونات التقنية والمواقع الإلكترونية.' : 'Create engaging content for tech blogs and websites.',
      featured: false
    },
  ];
  }, [stableLanguage], 'jobsData');

  const handleAddJob = useCallback(() => {
    router.push('/(modals)/add-job');
  }, []);

  const handleGuildMap = useCallback(() => {
    router.push('/(modals)/guild-map');
  }, []);

  const handleNotifications = useCallback(() => {
    router.push('/(modals)/notifications');
  }, []);

  const handleSettings = useCallback(() => {
    router.push('/(modals)/settings');
  }, []);

  const handleChat = useCallback(() => {
    router.push('/(main)/chat');
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
      Alert.alert(
        'Language Changed',
        `Language switched to ${newLang === 'en' ? 'English' : 'Arabic'}`,
        [{ text: 'OK' }]
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
            <MaterialIcons name="security" size={28} color={theme.buttonText} />
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
              <Bell size={20} color={theme.primary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.headerIconButton}
              onPress={handleChat}
              activeOpacity={0.7}
            >
              <MessageCircle size={20} color={theme.primary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.headerIconButton}
              onPress={handleSettings}
              activeOpacity={0.7}
            >
              <Menu size={20} color={theme.primary} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.headerBottom, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <View style={[styles.userAvatar, { marginRight: isRTL ? 0 : 12, marginLeft: isRTL ? 12 : 0 }]}>
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>👤</Text>
            </View>
          </View>
          <View style={styles.userGreeting}>
            <Text style={[styles.greetingText, { color: theme.buttonText, textAlign: isRTL ? 'right' : 'left' }]}>
              {isRTL ? 'هلا, احمد!' : 'Hi, Himanshu!'}
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

        {/* Featured Section */}
        <View style={styles.featuredSection}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
            {t('featuredJobs')}
          </Text>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.featuredScroll}>
            {jobs.slice(0, 3).map((job: any, index: number) => (
              <TouchableOpacity
                key={job.id}
                style={[styles.featuredCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
                onPress={() => router.push(`/(modals)/job/${job.id}`)}
                activeOpacity={0.7}
              >
                <View style={styles.featuredCardHeader}>
                  <Text style={[styles.featuredTitle, { color: theme.textPrimary }]} numberOfLines={2}>
                    {job.title}
                  </Text>
                  <Text style={[styles.featuredCompany, { color: theme.textSecondary }]}>
                    {job.company}
                  </Text>
                </View>
                <Text style={[styles.featuredSalary, { color: theme.primary }]}>
                  {job.salary}
                </Text>
                <View style={styles.featuredSkills}>
                  {job.skills.slice(0, 2).map((skill: string, skillIndex: number) => (
                    <View key={skillIndex} style={[styles.featuredSkillTag, { backgroundColor: theme.primary + '20', borderColor: theme.primary }]}>
                      <Text style={[styles.featuredSkillText, { color: theme.primary }]}>{skill}</Text>
                    </View>
                  ))}
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Action Buttons */}
        <View style={[styles.actionsContainer, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.surfaceSecondary, borderColor: theme.primary }]}
            onPress={handleAddJob}
            activeOpacity={0.7}
          >
            <Ionicons name="add-circle" size={20} color={theme.primary} />
            <Text style={[styles.actionButtonText, { color: theme.textPrimary }]}>{t('addJob')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.surfaceSecondary, borderColor: theme.primary }]}
            onPress={handleGuildMap}
            activeOpacity={0.7}
          >
            <Feather name="map" size={20} color={theme.primary} />
            <Text style={[styles.actionButtonText, { color: theme.textPrimary }]}>{t('guildMap')}</Text>
          </TouchableOpacity>
        </View>

        {/* Available Jobs */}
        <View style={styles.jobsSection}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
            {t('availableJobs')}
          </Text>

          {jobs.filter((job: any) => !job.featured).map((job: any, index: number) => (
            <TouchableOpacity
              key={job.id}
              style={[styles.jobCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
              onPress={() => router.push(`/(modals)/job/${job.id}`)}
              activeOpacity={0.7}
            >
              <View style={styles.jobHeader}>
                <View style={styles.jobTitleContainer}>
                  <Text style={[styles.jobTitle, { color: theme.textPrimary }]}>
                    {job.title}
                  </Text>
                  <Text style={[styles.jobCompany, { color: theme.textSecondary }]}>
                    {job.company}
                  </Text>
                </View>
                <Text style={[styles.jobSalary, { color: theme.primary }]}>
                  {job.salary}
                </Text>
              </View>

              <Text style={[styles.jobDescription, { color: theme.textSecondary }]}>
                {job.description}
              </Text>

              <View style={styles.jobFooter}>
                <View style={styles.skillsContainer}>
                  {job.skills.slice(0, 3).map((skill: string, skillIndex: number) => (
                    <View key={skillIndex} style={[styles.skillTag, { backgroundColor: theme.primary + '20', borderColor: theme.primary }]}>
                      <Text style={[styles.skillText, { color: theme.primary }]}>{skill}</Text>
                    </View>
                  ))}
                  {job.skills.length > 3 && (
                    <Text style={[styles.moreSkills, { color: theme.textSecondary }]}>
                      +{job.skills.length - 3} more
                    </Text>
                  )}
                </View>
                <Text style={[styles.jobLocation, { color: theme.textSecondary }]}>
                  {job.location}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
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
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 12,
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
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000000', // Keep black for contrast on neon green
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
  featuredSection: {
    marginBottom: 12,
  },
  featuredScroll: {
    paddingLeft: 16,
  },
  featuredCard: {
    width: 280,
    padding: 16,
    borderRadius: 16,
    marginRight: 12,
    borderWidth: 1,
  },
  featuredCardHeader: {
    marginBottom: 8,
  },
  featuredTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  featuredCompany: {
    fontSize: 14,
  },
  featuredSalary: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  featuredSkills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  featuredSkillTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  featuredSkillText: {
    fontSize: 12,
    fontWeight: '500',
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
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    fontFamily: FONT_FAMILY,
    marginBottom: 16,
  },
  jobCard: {
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  jobTitleContainer: {
    flex: 1,
    marginRight: 12,
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  jobCompany: {
    fontSize: 14,
  },
  jobSalary: {
    fontSize: 16,
    fontWeight: '600',
  },
  jobDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  jobFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    flex: 1,
    gap: 6,
    marginRight: 12,
  },
  skillTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  skillText: {
    fontSize: 12,
    fontWeight: '500',
  },
  moreSkills: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  jobLocation: {
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
});
