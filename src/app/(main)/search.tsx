import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Dimensions
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { 
  Search, 
  Filter, 
  MapPin, 
  Clock, 
  DollarSign, 
  ChevronLeft,
  ChevronRight,
  Star,
  Users,
  Briefcase,
  Zap,
  Heart,
  Bookmark,
  Share,
  ArrowUpDown,
  SlidersHorizontal,
  TrendingUp,
  Calendar,
  Building2,
  Globe,
  Award,
  Target,
  Sparkles,
  Eye,
  BookmarkCheck,
  Car
} from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useI18n } from '../../contexts/I18nProvider';
import { useAuth } from '../../contexts/AuthContext';
import { jobService, Job } from '../../services/jobService';
import { CustomAlertService } from '../../services/CustomAlertService';
// COMMENT: PRIORITY 1 - Replace console statements with logger
import { logger } from '../../utils/logger';

const { width } = Dimensions.get('window');
const FONT_FAMILY = 'SignikaNegative_400Regular';

interface Category {
  id: string;
  name: string;
  icon: string;
  count: number;
}

interface FilterOptions {
  category: string;
  budget: { min: number; max: number };
  location: string;
  timePosted: string;
  sortBy: 'recent' | 'budget' | 'popular';
}

export default function SearchScreen() {
  const { theme } = useTheme();
  const { t, isRTL } = useI18n();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  // Authentication check
  const isAuthenticated = !!user;

  const [searchQuery, setSearchQuery] = useState('');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [favoriteJobs, setFavoriteJobs] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<FilterOptions>({
    category: 'all',
    budget: { min: 0, max: 10000 },
    location: '',
    timePosted: 'all',
    sortBy: 'recent'
  });

  // Load categories from API
  const loadCategories = async () => {
    try {
      const categoriesData = await jobService.getCategories();
      // Transform string array to Category objects
      const transformedCategories = [
        { id: 'all', name: isRTL ? 'جميع الوظائف' : 'All Jobs', icon: '📋', count: 0 },
        ...categoriesData.map((category, index) => ({
          id: category.toLowerCase().replace(/\s+/g, '-'),
          name: category,
          icon: '📋',
          count: 0 // No dummy data - real counts will be calculated
        }))
      ];
      setCategories(transformedCategories);
    } catch (error) {
      // COMMENT: PRIORITY 1 - Replace console.error with logger
      logger.error('Error loading categories:', error);
      // Fallback to basic categories
      setCategories([
        { id: 'all', name: isRTL ? 'جميع الوظائف' : 'All Jobs', icon: '📋', count: 0 }
      ]);
    }
  };

  // Advanced Translation System for Job Cards
  const translateJobContent = React.useCallback((job: Job, targetLang: 'en' | 'ar'): Job => {
    const translations: Record<string, Record<string, string>> = {
      '1': {
        title: { en: 'React Native Developer Needed', ar: 'مطلوب مطور React Native' },
        description: { en: 'Looking for an experienced React Native developer to build a mobile app...', ar: 'نبحث عن مطور React Native ذو خبرة لبناء تطبيق جوال...' },
        location: { en: 'Remote', ar: 'عن بُعد' },
        timeNeeded: { en: '2-4 weeks', ar: '2-4 أسابيع' },
        clientName: { en: 'Tech Startup Inc.', ar: 'شركة التقنية الناشئة' }
      },
      '2': {
        title: { en: 'Logo Design for Restaurant', ar: 'تصميم شعار للمطعم' },
        description: { en: 'Need a modern logo design for a new restaurant opening soon...', ar: 'نحتاج تصميم شعار حديث لمطعم جديد يفتتح قريباً...' },
        location: { en: 'New York, NY', ar: 'نيويورك، نيويورك' },
        timeNeeded: { en: '1 week', ar: 'أسبوع واحد' },
        clientName: { en: 'Restaurant Owner', ar: 'صاحب المطعم' }
      },
      '3': {
        title: { en: 'Content Writer for Blog', ar: 'كاتب محتوى للمدونة' },
        description: { en: 'Looking for a skilled content writer to create engaging blog posts...', ar: 'نبحث عن كاتب محتوى ماهر لإنشاء مقالات مدونة جذابة...' },
        location: { en: 'Remote', ar: 'عن بُعد' },
        timeNeeded: { en: '2 weeks', ar: 'أسبوعان' },
        clientName: { en: 'Digital Agency', ar: 'الوكالة الرقمية' }
      }
    };

    const skillTranslations: Record<string, Record<string, string>> = {
      'React Native': { en: 'React Native', ar: 'React Native' },
      'TypeScript': { en: 'TypeScript', ar: 'TypeScript' },
      'Firebase': { en: 'Firebase', ar: 'Firebase' },
      'Logo Design': { en: 'Logo Design', ar: 'تصميم الشعار' },
      'Branding': { en: 'Branding', ar: 'الهوية التجارية' },
      'Adobe Illustrator': { en: 'Adobe Illustrator', ar: 'Adobe Illustrator' },
      'Content Writing': { en: 'Content Writing', ar: 'كتابة المحتوى' },
      'SEO': { en: 'SEO', ar: 'تحسين محركات البحث' },
      'Blogging': { en: 'Blogging', ar: 'التدوين' }
    };

    const jobTranslation = translations[job.id];
    if (!jobTranslation) return job;

    return {
      ...job,
      title: jobTranslation.title?.[targetLang] || job.title,
      description: jobTranslation.description?.[targetLang] || job.description,
      location: jobTranslation.location?.[targetLang] || job.location,
      timeNeeded: jobTranslation.timeNeeded?.[targetLang] || job.timeNeeded,
      clientName: jobTranslation.clientName?.[targetLang] || job.clientName,
      skills: job.skills.map(skill => 
        skillTranslations[skill]?.[targetLang] || skill
      )
    };
  }, []);

  // Load jobs from API
  const loadJobs = async () => {
    try {
      const jobsData = await jobService.getJobs();
      setJobs(jobsData);
      setFilteredJobs(jobsData);
    } catch (error) {
      // COMMENT: PRIORITY 1 - Replace console.error with logger
      logger.error('Error loading jobs:', error);
      CustomAlertService.showError('Error', 'Failed to load jobs');
    }
  };

  // Translated jobs based on current language
  const translatedJobs: Job[] = React.useMemo(() => {
    const currentLang = isRTL ? 'ar' : 'en';
    return jobs.map(job => translateJobContent(job, currentLang));
  }, [jobs, isRTL, translateJobContent]);

  useEffect(() => {
    if (isAuthenticated) {
      loadInitialData();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    filterJobs();
  }, [searchQuery, selectedCategory, filters, translatedJobs]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      // Load real data from API
      await Promise.all([
        loadCategories(),
        loadJobs()
      ]);
    } catch (error) {
      // COMMENT: PRIORITY 1 - Replace console.error with logger
      logger.error('Error loading data:', error);
      CustomAlertService.showError('Error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const filterJobs = () => {
    let filtered = [...jobs];

    // Search query filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(job =>
        job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(job => job.category === selectedCategory);
    }

    // Budget filter
    filtered = filtered.filter(job => {
      if (typeof job.budget === 'string') return true;
      return job.budget.min >= filters.budget.min && job.budget.max <= filters.budget.max;
    });

    // Location filter
    if (filters.location) {
      filtered = filtered.filter(job =>
        job.location.toLowerCase().includes(filters.location.toLowerCase())
      );
    }

    // Sort
    switch (filters.sortBy) {
      case 'budget':
        filtered.sort((a, b) => {
          const aBudget = typeof a.budget === 'string' ? 0 : a.budget.max;
          const bBudget = typeof b.budget === 'string' ? 0 : b.budget.max;
          return bBudget - aBudget;
        });
        break;
      case 'popular':
        // Mock popularity based on ID
        filtered.sort((a, b) => parseInt(b.id) - parseInt(a.id));
        break;
      default: // recent
        // Keep original order for recent
        break;
    }

    setFilteredJobs(filtered);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadInitialData();
    setRefreshing(false);
  };

  const handleJobPress = (job: Job) => {
    // Navigate to job details modal
    router.push(`/(modals)/job/${job.id}` as any);
  };

  const handleHeartPress = (job: Job) => {
    try {
      setFavoriteJobs(prev => {
        const newFavorites = new Set(prev);
        if (newFavorites.has(job.id)) {
          newFavorites.delete(job.id);
          // Show success message
          // COMMENT: PRIORITY 1 - Replace console.log with logger
          logger.debug('Job removed from favorites');
        } else {
          newFavorites.add(job.id);
          // Show success message
          // COMMENT: PRIORITY 1 - Replace console.log with logger
          logger.debug('Job added to favorites');
        }
        return newFavorites;
      });
    } catch (error) {
      // COMMENT: PRIORITY 1 - Replace console.error with logger
      logger.error('Error handling heart press:', error);
    }
  };

  const handleSharePress = (job: Job) => {
    // Share job
    CustomAlertService.showAlert(
      isRTL ? 'مشاركة الوظيفة' : 'Share Job',
      isRTL ? 'تم نسخ رابط الوظيفة' : 'Job link copied to clipboard'
    );
  };

  const handleCategoryPress = (categoryId: string) => {
    setSelectedCategory(categoryId);
  };

  const getCategoryIcon = (categoryId: string) => {
    const iconMap: { [key: string]: any } = {
      'all': Target,
      'tech': Sparkles,
      'design': Award,
      'writing': BookmarkCheck,
      'marketing': TrendingUp,
      'business': Building2,
      'education': Globe,
      'finance': DollarSign,
      'cleaning': Sparkles,
      'washing': Car,
      'ui-ux': Award,
      'dev': Zap,
      'photography': Eye,
      'video': Eye,
      'music': Heart,
      'translation': Globe,
      'customer-service': Users,
      'sales': TrendingUp,
      'data-entry': BookmarkCheck,
      'virtual-assistant': Sparkles,
      'social-media': Share,
      'content-creation': Sparkles,
      'ecommerce': Building2,
      'research': Eye,
      'consulting': Award,
      'project-management': BookmarkCheck,
      'quality-assurance': BookmarkCheck,
      'technical-support': Zap,
      'legal': Award,
      'accounting': DollarSign,
      'hr': Users,
      'logistics': Car,
      'security': Award,
      'maintenance': Zap,
      'gardening': Heart,
      'cooking': Heart,
      'delivery': Car,
      'tutoring': Globe,
      'coaching': Award,
      'event-planning': Heart,
      'interior-design': Award,
      'fashion': Award,
      'fitness': Heart,
      'beauty': Heart,
      'pet-care': Heart,
      'childcare': Users,
      'elderly-care': Users,
      'home-repair': Zap,
      'plumbing': Zap,
      'electrical': Zap,
      'painting': Award,
      'carpentry': Zap,
      'other': Briefcase,
    };
    return iconMap[categoryId] || Briefcase;
  };

  const renderCategoryItem = ({ item }: { item: Category }) => {
    const isSelected = selectedCategory === item.id;
    const CategoryIcon = getCategoryIcon(item.id);
    
    return (
      <TouchableOpacity
        style={[
          styles.categoryItem,
          {
            backgroundColor: isSelected ? theme.primary : theme.surface,
            borderColor: isSelected ? theme.primary : theme.border,
            shadowColor: isSelected ? theme.primary : theme.textSecondary,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: isSelected ? 0.3 : 0.1,
            shadowRadius: 4,
            elevation: isSelected ? 4 : 2,
          }
        ]}
        onPress={() => handleCategoryPress(item.id)}
        activeOpacity={0.7}
      >
        <View style={[
          styles.categoryIconContainer,
          { backgroundColor: 'transparent' }
        ]}>
          <CategoryIcon 
            size={20} 
            color={isSelected ? '#000000' : theme.primary} 
          />
        </View>
        <Text
          style={[
            styles.categoryName,
            {
              color: isSelected ? '#000000' : theme.textPrimary,
              fontWeight: isSelected ? '600' : '500',
            }
          ]}
        >
          {item.name}
        </Text>
        <View style={[
          styles.categoryCountContainer,
          { backgroundColor: isSelected ? 'rgba(0,0,0,0.1)' : theme.textSecondary + '15' }
        ]}>
          <Text
            style={[
              styles.categoryCount,
              {
                color: isSelected ? '#000000' : theme.textSecondary,
                fontWeight: '600',
              }
            ]}
          >
            {item.count}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  // Advanced RTL/LTR Detection and Auto-Layout
  const getJobCardLayout = React.useCallback((item: Job) => {
    const cardIsRTL = isRTL; // Auto-detect based on user preference
    const textDirection = cardIsRTL ? 'rtl' : 'ltr';
    const flexDirection = cardIsRTL ? 'row-reverse' : 'row';
    const textAlign = cardIsRTL ? 'right' : 'left';
    
    return {
      cardIsRTL,
      textDirection,
      flexDirection,
      textAlign,
      // Advanced spacing for RTL/LTR
      marginStart: cardIsRTL ? 0 : 16,
      marginEnd: cardIsRTL ? 16 : 0,
      paddingStart: cardIsRTL ? 0 : 12,
      paddingEnd: cardIsRTL ? 12 : 0,
    };
  }, [isRTL]);

  const renderJobItem = ({ item }: { item: Job }) => {
    const layout = getJobCardLayout(item);
    
    return (
      <TouchableOpacity
        style={[
          styles.jobCard, 
          { 
            backgroundColor: theme.surface, 
            borderColor: theme.border,
            shadowColor: theme.textSecondary,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 3,
            // Advanced RTL/LTR layout
            marginStart: layout.marginStart,
            marginEnd: layout.marginEnd,
          }
        ]}
        onPress={() => handleJobPress(item)}
        activeOpacity={0.7}
      >
      <View style={[styles.jobHeader, { flexDirection: layout.flexDirection }]}>
        <View style={[
          styles.jobTitleContainer, 
          { 
            flexDirection: layout.flexDirection,
            marginRight: layout.cardIsRTL ? 0 : 12,
            marginLeft: layout.cardIsRTL ? 12 : 0,
          }
        ]}>
          <Text 
            style={[
              styles.jobTitle, 
              { 
                color: theme.textPrimary,
                textAlign: layout.textAlign,
                writingDirection: layout.textDirection,
              }
            ]} 
            numberOfLines={2}
          >
            {item.title}
          </Text>
          {item.isUrgent && (
            <View style={[
              styles.urgentBadge, 
              { 
                backgroundColor: theme.error,
                shadowColor: theme.error,
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.3,
                shadowRadius: 2,
                elevation: 2,
                flexDirection: layout.flexDirection,
              }
            ]}>
              <Zap size={12} color="#FFFFFF" />
              <Text style={styles.urgentText}>{layout.cardIsRTL ? 'عاجل' : 'Urgent'}</Text>
            </View>
          )}
        </View>
        <TouchableOpacity 
          style={[
            styles.jobActions,
            { 
              backgroundColor: theme.primary,
              borderColor: theme.primary,
              borderWidth: 1,
            }
          ]}
          onPress={() => handleHeartPress(item)}
          activeOpacity={0.7}
        >
          <Heart 
            size={18} 
            color={favoriteJobs.has(item.id) ? "#000000" : "#FFFFFF"} 
            fill={favoriteJobs.has(item.id) ? "#000000" : "none"}
          />
        </TouchableOpacity>
      </View>

      <Text 
        style={[
          styles.jobDescription, 
          { 
            color: theme.textSecondary,
            textAlign: layout.textAlign,
            writingDirection: layout.textDirection,
          }
        ]} 
        numberOfLines={2}
      >
        {item.description}
      </Text>

      <View style={[styles.jobMeta, { flexDirection: layout.flexDirection }]}>
        <View style={[
          styles.jobMetaItem,
          { 
            backgroundColor: theme.primary,
            flexDirection: layout.flexDirection,
          }
        ]}>
          <DollarSign size={14} color="#000000" />
          <Text style={[styles.jobMetaText, { color: '#000000', fontWeight: '600' }]}>
            {typeof item.budget === 'string' ? item.budget : `$${item.budget.min}-${item.budget.max}`}
          </Text>
        </View>
        <View style={[
          styles.jobMetaItem,
          { 
            backgroundColor: theme.textSecondary,
            flexDirection: layout.flexDirection,
          }
        ]}>
          <MapPin size={14} color="#000000" />
          <Text style={[styles.jobMetaText, { color: '#000000' }]}>
            {typeof item.location === 'object' ? item.location?.address || 'Location not specified' : item.location}
          </Text>
        </View>
        <View style={[
          styles.jobMetaItem,
          { 
            backgroundColor: theme.textSecondary,
            flexDirection: layout.flexDirection,
          }
        ]}>
          <Calendar size={14} color="#000000" />
          <Text style={[styles.jobMetaText, { color: '#000000' }]}>
            {item.timeNeeded}
          </Text>
        </View>
      </View>

      <View style={[styles.jobFooter, { flexDirection: layout.flexDirection }]}>
        <View style={[styles.clientInfo, { flexDirection: layout.flexDirection }]}>
          <View style={[
            styles.clientAvatar, 
            { 
              backgroundColor: theme.primary,
              borderColor: theme.primary,
              borderWidth: 1,
            }
          ]}>
            <Building2 size={16} color="#000000" />
          </View>
          <Text 
            style={[
              styles.clientName, 
              { 
                color: theme.textPrimary, 
                fontWeight: '500',
                textAlign: layout.textAlign,
                writingDirection: layout.textDirection,
              }
            ]}
          >
            {item.clientName}
          </Text>
        </View>
        <View style={[styles.jobSkills, { flexDirection: layout.flexDirection }]}>
          {(Array.isArray(item?.skills) ? item.skills : []).slice(0, 2).map((skill, index) => (
            <View key={`${item.id}-skill-${index}`} style={[
              styles.skillTag, 
              { 
                backgroundColor: theme.primary,
                borderColor: theme.primary,
                borderWidth: 1,
                shadowColor: theme.primary,
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 2,
                elevation: 1,
              }
            ]}>
              <Text 
                style={[
                  styles.skillText, 
                  { 
                    color: '#000000', 
                    fontWeight: '500',
                    textAlign: layout.textAlign,
                    writingDirection: layout.textDirection,
                  }
                ]}
              >
                {skill}
              </Text>
            </View>
          ))}
          {(Array.isArray(item?.skills) ? item.skills.length : 0) > 2 && (
            <Text 
              style={[
                styles.moreSkills, 
                { 
                  color: theme.textSecondary,
                  textAlign: layout.textAlign,
                  writingDirection: layout.textDirection,
                }
              ]}
            >
              {layout.cardIsRTL ? `+${item.skills.length - 2} أخرى` : `+${item.skills.length - 2} more`}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          {isRTL ? (
            <ChevronRight size={24} color={theme.textPrimary} />
          ) : (
            <ChevronLeft size={24} color={theme.textPrimary} />
          )}
        </TouchableOpacity>
        
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
          {isRTL ? 'البحث عن الوظائف' : 'Search Jobs'}
        </Text>
        
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(!showFilters)}
          activeOpacity={0.7}
        >
          <Filter size={24} color={theme.primary} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={[
        styles.searchContainer, 
        { 
          backgroundColor: theme.surface, 
          borderColor: theme.primary + '30',
          shadowColor: theme.primary,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 3,
          flexDirection: isRTL ? 'row-reverse' : 'row',
        }
      ]}>
        <View style={[
          styles.searchIconContainer,
          { backgroundColor: 'transparent' }
        ]}>
          <Search size={18} color={theme.primary} />
        </View>
        <TextInput
          style={[styles.searchInput, { color: theme.textPrimary }]}
          placeholder={isRTL ? 'البحث عن الوظائف...' : 'Search for jobs...'}
          placeholderTextColor={theme.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          textAlign={isRTL ? 'right' : 'left'}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => setSearchQuery('')}
            activeOpacity={0.7}
          >
            <Text style={[styles.clearButtonText, { color: theme.textSecondary }]}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Panel */}
      {showFilters && (
        <View style={[
          styles.filterPanel,
          {
            backgroundColor: theme.surface,
            borderColor: theme.border,
            shadowColor: theme.textSecondary,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
          }
        ]}>
          <Text style={[styles.filterTitle, { color: theme.textPrimary }]}>
            {isRTL ? 'تصفية الوظائف' : 'Filter Jobs'}
          </Text>
          
          {/* Budget Filter */}
          <View style={styles.filterSection}>
            <Text style={[styles.filterLabel, { color: theme.textSecondary }]}>
              {isRTL ? 'الميزانية' : 'Budget'}
            </Text>
            <View style={styles.budgetRange}>
              <Text style={[styles.budgetText, { color: theme.textPrimary }]}>
                ${filters.budget.min} - ${filters.budget.max}
              </Text>
            </View>
          </View>

          {/* Sort Filter */}
          <View style={styles.filterSection}>
            <Text style={[styles.filterLabel, { color: theme.textSecondary }]}>
              {isRTL ? 'ترتيب حسب' : 'Sort By'}
            </Text>
            <View style={styles.sortOptions}>
              {(['recent', 'budget', 'popular'] as const).map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.sortOption,
                    {
                      backgroundColor: filters.sortBy === option ? theme.primary : theme.background,
                      borderColor: filters.sortBy === option ? theme.primary : theme.border,
                    }
                  ]}
                  onPress={() => setFilters(prev => ({ ...prev, sortBy: option }))}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.sortOptionText,
                    {
                      color: filters.sortBy === option ? '#000000' : theme.textPrimary,
                      fontWeight: filters.sortBy === option ? '600' : '400',
                    }
                  ]}>
                    {isRTL ? 
                      (option === 'recent' ? 'الأحدث' : 
                       option === 'budget' ? 'الميزانية' : 'الأكثر شعبية') :
                      (option === 'recent' ? 'Recent' : 
                       option === 'budget' ? 'Budget' : 'Popular')
                    }
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Filter Actions */}
          <View style={styles.filterActions}>
            <TouchableOpacity
              style={[styles.filterActionButton, { backgroundColor: theme.textSecondary }]}
              onPress={() => {
                setFilters({
                  category: 'all',
                  budget: { min: 0, max: 10000 },
                  location: '',
                  timePosted: 'all',
                  sortBy: 'recent'
                });
                setSelectedCategory('all');
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterActionText, { color: '#FFFFFF' }]}>
                {isRTL ? 'إعادة تعيين' : 'Reset'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.filterActionButton, { backgroundColor: theme.primary }]}
              onPress={() => setShowFilters(false)}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterActionText, { color: '#000000' }]}>
                {isRTL ? 'تطبيق' : 'Apply'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Categories */}
      <View style={styles.categoriesContainer}>
        <FlatList
          data={categories}
          renderItem={renderCategoryItem}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesList}
        />
      </View>

      {/* Jobs List */}
      <FlatList
        data={filteredJobs}
        renderItem={renderJobItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.jobsList}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Briefcase size={48} color={theme.textSecondary} />
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              {isRTL ? 'لا توجد وظائف متاحة' : 'No jobs found'}
            </Text>
            <Text style={[styles.emptySubtext, { color: theme.textSecondary }]}>
              {isRTL ? 'جرب البحث بكلمات مختلفة' : 'Try searching with different keywords'}
            </Text>
          </View>
        }
      />

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      )}
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
    paddingBottom: 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: FONT_FAMILY,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  filterButton: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 20,
    paddingHorizontal: 18,
    paddingVertical: 1, // Reduced from 16 to 1 (15px reduction)
    borderRadius: 20,
    borderWidth: 1.5,
    gap: 14,
  },
  searchIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: FONT_FAMILY,
    fontWeight: '500',
    lineHeight: 20,
  },
  clearButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  clearButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  categoriesContainer: {
    marginBottom: 20,
  },
  categoriesList: {
    paddingHorizontal: 20,
    gap: 14,
  },
  categoryItem: {
    alignItems: 'center',
    paddingVertical: -1, // Reduced from 14 to -1 (15px reduction)
    paddingHorizontal: 18,
    borderRadius: 16,
    borderWidth: 1.5,
    marginRight: 12,
    minWidth: 80,
    justifyContent: 'center',
  },
  categoryIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 12,
    fontFamily: FONT_FAMILY,
    textAlign: 'center',
    marginBottom: 6,
    fontWeight: '500',
  },
  categoryCountContainer: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 20,
  },
  categoryCount: {
    fontSize: 10,
    fontFamily: FONT_FAMILY,
    fontWeight: '600',
  },
  jobsList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  jobCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  jobTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginRight: 12,
  },
  jobTitle: {
    fontSize: 16,
    fontFamily: FONT_FAMILY,
    fontWeight: '600',
    flex: 1,
  },
  urgentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 2,
    marginTop: -17,
  },
  urgentText: {
    fontSize: 10,
    fontFamily: FONT_FAMILY,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  jobActions: {
    padding: 4,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  jobDescription: {
    fontSize: 14,
    fontFamily: FONT_FAMILY,
    lineHeight: 20,
    marginBottom: 12,
  },
  jobMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 12,
  },
  jobMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  jobMetaText: {
    fontSize: 12,
    fontFamily: FONT_FAMILY,
  },
  jobFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  clientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  clientAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clientName: {
    fontSize: 12,
    fontFamily: FONT_FAMILY,
  },
  jobSkills: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  skillTag: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  skillText: {
    fontSize: 10,
    fontFamily: FONT_FAMILY,
    fontWeight: '600',
  },
  moreSkills: {
    fontSize: 10,
    fontFamily: FONT_FAMILY,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: FONT_FAMILY,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    fontFamily: FONT_FAMILY,
    textAlign: 'center',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Filter Panel Styles
  filterPanel: {
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
  },
  filterTitle: {
    fontSize: 18,
    fontFamily: FONT_FAMILY,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  filterSection: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 14,
    fontFamily: FONT_FAMILY,
    fontWeight: '500',
    marginBottom: 8,
  },
  budgetRange: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
  },
  budgetText: {
    fontSize: 16,
    fontFamily: FONT_FAMILY,
    fontWeight: '600',
  },
  sortOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  sortOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  sortOptionText: {
    fontSize: 14,
    fontFamily: FONT_FAMILY,
  },
  filterActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  filterActionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  filterActionText: {
    fontSize: 14,
    fontFamily: FONT_FAMILY,
    fontWeight: '600',
  },
});
