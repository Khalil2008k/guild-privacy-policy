import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  TextInput,
  Modal,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { useI18n } from '@/contexts/I18nProvider';
import { useAuth } from '@/contexts/AuthContext';
import { 
  ArrowLeft,
  Search,
  Book,
  Briefcase,
  CreditCard,
  Users,
  Shield,
  Settings,
  ChevronRight,
  FileText,
  HelpCircle,
  Bookmark,
  BookmarkCheck,
  Eye,
  Clock,
  X,
  ChevronDown,
  ChevronUp,
  Sparkles
} from 'lucide-react-native';
import { collection, getDocs, query, orderBy, doc, updateDoc, arrayUnion, arrayRemove, getDoc, where } from 'firebase/firestore';
import { db } from '@/config/firebase';

const FONT_FAMILY = 'Signika Negative SC';

interface Article {
  id: string;
  title: string;
  titleAr: string;
  content: string;
  contentAr: string;
  category: string;
  readTime: string;
  views: number;
  isBookmarked?: boolean;
}

interface Category {
  id: string;
  title: string;
  titleAr: string;
  icon: any;
  color: string;
  articleCount: number;
}

interface FAQ {
  id: string;
  question: string;
  questionAr: string;
  answer: string;
  answerAr: string;
  category: string;
}

export default function KnowledgeBaseScreen() {
  const insets = useSafeAreaInsets();
  const { theme, isDarkMode } = useTheme();
  const { t, isRTL } = useI18n();
  const { user } = useAuth();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [faqs, setFAQs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
  const [recentViews, setRecentViews] = useState<string[]>([]);

  const categories: Category[] = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      titleAr: 'البدء',
      icon: Book,
      color: '#3B82F6',
      articleCount: 0,
    },
    {
      id: 'jobs',
      title: 'Jobs & Contracts',
      titleAr: 'الوظائف والعقود',
      icon: Briefcase,
      color: '#F59E0B',
      articleCount: 0,
    },
    {
      id: 'payments',
      title: 'Payments & Wallet',
      titleAr: 'المدفوعات والمحفظة',
      icon: CreditCard,
      color: '#8B5CF6',
      articleCount: 0,
    },
    {
      id: 'guilds',
      title: 'Guilds & Teams',
      titleAr: 'النقابات والفرق',
      icon: Users,
      color: '#EC4899',
      articleCount: 0,
    },
    {
      id: 'security',
      title: 'Security & Privacy',
      titleAr: 'الأمان والخصوصية',
      icon: Shield,
      color: '#10B981',
      articleCount: 0,
    },
    {
      id: 'settings',
      title: 'Settings & Account',
      titleAr: 'الإعدادات والحساب',
      icon: Settings,
      color: '#6366F1',
      articleCount: 0,
    },
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadArticles(),
        loadFAQs(),
        loadUserBookmarks(),
      ]);
    } catch (error) {
      console.log('Error loading knowledge base:', error);
      // Fallback to mock data
      setArticles(getMockArticles());
      setFAQs(getMockFAQs());
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const loadArticles = async () => {
    try {
      const articlesRef = collection(db, 'knowledgeBase');
      const q = query(articlesRef, orderBy('views', 'desc'));
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Article[];
        setArticles(data);
      } else {
        setArticles(getMockArticles());
      }
    } catch (error) {
      console.log('Loading articles from Firebase failed, using mock data');
      setArticles(getMockArticles());
    }
  };

  const loadFAQs = async () => {
    try {
      const faqsRef = collection(db, 'faqs');
      const snapshot = await getDocs(faqsRef);
      
      if (!snapshot.empty) {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as FAQ[];
        setFAQs(data);
      } else {
        setFAQs(getMockFAQs());
      }
    } catch (error) {
      console.log('Loading FAQs failed, using mock data');
      setFAQs(getMockFAQs());
    }
  };

  const loadUserBookmarks = async () => {
    if (!user?.uid) return;
    
    try {
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const bookmarks = userDoc.data().bookmarkedArticles || [];
        setBookmarkedIds(bookmarks);
      }
    } catch (error) {
      console.log('Error loading bookmarks:', error);
    }
  };

  const getMockArticles = (): Article[] => [
    {
      id: '1',
      title: 'How to get started with GUILD',
      titleAr: 'كيف أبدأ في استخدام GUILD',
      content: 'Welcome to GUILD! This guide will help you set up your profile, understand the platform, and start finding jobs or posting them. First, complete your profile with accurate information...',
      contentAr: 'مرحباً بك في GUILD! سيساعدك هذا الدليل على إعداد ملفك الشخصي وفهم المنصة والبدء في البحث عن الوظائف أو نشرها. أولاً، أكمل ملفك الشخصي بمعلومات دقيقة...',
      category: 'getting-started',
      readTime: '5 min',
      views: 1234,
    },
    {
      id: '2',
      title: 'Posting your first job',
      titleAr: 'نشر وظيفتك الأولى',
      content: 'Ready to post a job? Here\'s everything you need to know. Start by clicking the "Post Job" button on the home screen. Fill in the job title, description, budget, and timeline...',
      contentAr: 'هل أنت مستعد لنشر وظيفة؟ إليك كل ما تحتاج إلى معرفته. ابدأ بالنقر على زر "نشر وظيفة" في الشاشة الرئيسية. املأ عنوان الوظيفة والوصف والميزانية والجدول الزمني...',
      category: 'jobs',
      readTime: '3 min',
      views: 892,
    },
    {
      id: '3',
      title: 'Understanding the beta payment system',
      titleAr: 'فهم نظام العملات التجريبي',
      content: 'During beta testing, GUILD uses Guild Coins as test currency. Every user receives 300 Guild Coins to test the platform. You can use these coins to post jobs and pay for completed work...',
      contentAr: 'خلال الاختبار التجريبي، يستخدم GUILD عملات GUILD كعملة اختبار. يحصل كل مستخدم على 300 عملة GUILD لاختبار المنصة. يمكنك استخدام هذه العملات لنشر الوظائف ودفع ثمن العمل المكتمل...',
      category: 'payments',
      readTime: '4 min',
      views: 756,
    },
    {
      id: '4',
      title: 'Creating and managing a guild',
      titleAr: 'إنشاء وإدارة نقابة',
      content: 'Guilds are teams of professionals working together. To create a guild, go to the Guilds tab and click "Create Guild". Choose a name, description, and invite members...',
      contentAr: 'النقابات هي فرق من المحترفين يعملون معاً. لإنشاء نقابة، انتقل إلى تبويب النقابات وانقر على "إنشاء نقابة". اختر اسماً ووصفاً وادع الأعضاء...',
      category: 'guilds',
      readTime: '7 min',
      views: 543,
    },
    {
      id: '5',
      title: 'Securing your account',
      titleAr: 'تأمين حسابك',
      content: 'Keep your account safe with these best practices: Use a strong, unique password. Enable two-factor authentication. Never share your password or verification codes...',
      contentAr: 'حافظ على أمان حسابك باتباع هذه الممارسات الجيدة: استخدم كلمة مرور قوية وفريدة. فعّل المصادقة الثنائية. لا تشارك كلمة المرور أو رموز التحقق أبداً...',
      category: 'security',
      readTime: '6 min',
      views: 678,
    },
    {
      id: '6',
      title: 'Customizing profile settings',
      titleAr: 'تخصيص إعدادات الملف الشخصي',
      content: 'Make your profile stand out! Add a professional photo, write a compelling bio, list your skills, and showcase your portfolio. A complete profile gets 5x more job offers...',
      contentAr: 'اجعل ملفك الشخصي مميزاً! أضف صورة احترافية، واكتب سيرة ذاتية مقنعة، وسرد مهاراتك، واعرض أعمالك. الملف الشخصي الكامل يحصل على 5 أضعاف عروض العمل...',
      category: 'settings',
      readTime: '4 min',
      views: 445,
    },
  ];

  const getMockFAQs = (): FAQ[] => [
    {
      id: 'faq1',
      question: 'What is GUILD?',
      questionAr: 'ما هو GUILD؟',
      answer: 'GUILD is a freelance marketplace connecting professionals in Qatar. It uses a beta payment system with Guild Coins for testing.',
      answerAr: 'GUILD هو سوق للعمل الحر يربط المحترفين في قطر. يستخدم نظام دفع تجريبي بعملات GUILD للاختبار.',
      category: 'general',
    },
    {
      id: 'faq2',
      question: 'How do Guild Coins work?',
      questionAr: 'كيف تعمل عملات GUILD؟',
      answer: 'Guild Coins are test currency for beta. Each user gets 300 coins free. Use them to post jobs and pay for work during testing.',
      answerAr: 'عملات GUILD هي عملة اختبار للنسخة التجريبية. يحصل كل مستخدم على 300 عملة مجاناً. استخدمها لنشر الوظائف ودفع ثمن العمل أثناء الاختبار.',
      category: 'payments',
    },
    {
      id: 'faq3',
      question: 'How do I post a job?',
      questionAr: 'كيف أنشر وظيفة؟',
      answer: 'Tap the "Post Job" button, fill in details (title, description, budget, deadline), and submit. Your job will be reviewed and posted within 24 hours.',
      answerAr: 'اضغط على زر "نشر وظيفة"، املأ التفاصيل (العنوان، الوصف، الميزانية، الموعد النهائي)، وأرسل. ستتم مراجعة وظيفتك ونشرها في غضون 24 ساعة.',
      category: 'jobs',
    },
    {
      id: 'faq4',
      question: 'Is my data secure?',
      questionAr: 'هل بياناتي آمنة؟',
      answer: 'Yes! We use Firebase encryption, secure authentication, and follow Qatar data protection laws. Your data is never shared without permission.',
      answerAr: 'نعم! نستخدم تشفير Firebase ومصادقة آمنة ونتبع قوانين حماية البيانات في قطر. لن تتم مشاركة بياناتك أبداً بدون إذن.',
      category: 'security',
    },
    {
      id: 'faq5',
      question: 'Can I join multiple guilds?',
      questionAr: 'هل يمكنني الانضمام إلى نقابات متعددة؟',
      answer: 'Yes! You can join up to 5 guilds simultaneously. Each guild has its own projects and team dynamics.',
      answerAr: 'نعم! يمكنك الانضمام إلى 5 نقابات في وقت واحد. كل نقابة لها مشاريعها وديناميكيات فريقها الخاصة.',
      category: 'guilds',
    },
  ];

  const toggleBookmark = async (articleId: string) => {
    if (!user?.uid) return;

    try {
      const userRef = doc(db, 'users', user.uid);
      const isBookmarked = bookmarkedIds.includes(articleId);

      if (isBookmarked) {
        await updateDoc(userRef, {
          bookmarkedArticles: arrayRemove(articleId)
        });
        setBookmarkedIds(bookmarkedIds.filter(id => id !== articleId));
      } else {
        await updateDoc(userRef, {
          bookmarkedArticles: arrayUnion(articleId)
        });
        setBookmarkedIds([...bookmarkedIds, articleId]);
      }
    } catch (error) {
      console.log('Error toggling bookmark:', error);
    }
  };

  const openArticle = async (article: Article) => {
    setSelectedArticle(article);
    
    // Track view
    try {
      const articleRef = doc(db, 'knowledgeBase', article.id);
      await updateDoc(articleRef, {
        views: article.views + 1
      });
      
      // Update local state
      setArticles(articles.map(a => 
        a.id === article.id ? { ...a, views: a.views + 1 } : a
      ));
    } catch (error) {
      console.log('Error tracking view:', error);
    }
  };

  const filteredArticles = selectedCategory
    ? articles.filter(a => a.category === selectedCategory)
    : searchQuery.trim()
    ? articles.filter(a => {
        const searchLower = searchQuery.toLowerCase();
        return (
          a.title.toLowerCase().includes(searchLower) ||
          a.titleAr.includes(searchQuery) ||
          a.content.toLowerCase().includes(searchLower)
        );
      })
    : articles;

  const handleBack = () => {
    router.back();
  };

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(selectedCategory === categoryId ? null : categoryId);
    setSearchQuery('');
  };

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
    content: {
      flex: 1,
    },
    scrollContent: {
      padding: 16,
    },
    searchContainer: {
      backgroundColor: isDarkMode ? '#1b1b1b' : theme.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: isDarkMode ? '#262626' : theme.border,
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 14,
      marginBottom: 20,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 6,
    },
    searchIcon: {
      marginRight: isRTL ? 0 : 12,
      marginLeft: isRTL ? 12 : 0,
    },
    searchInput: {
      flex: 1,
      color: theme.textPrimary,
      fontSize: 16,
      fontFamily: FONT_FAMILY,
      textAlign: isRTL ? 'right' : 'left',
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '900',
      fontFamily: FONT_FAMILY,
      color: theme.textPrimary,
      marginBottom: 16,
      textAlign: isRTL ? 'right' : 'left',
    },
    categoriesGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      marginBottom: 24,
    },
    categoryCard: {
      width: '48%',
      backgroundColor: isDarkMode ? '#1b1b1b' : theme.surface,
      borderRadius: 18,
      padding: 18,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.25,
      shadowRadius: 12,
      elevation: 8,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    categoryCardSelected: {
      borderColor: theme.primary,
      shadowOpacity: 0.4,
      shadowRadius: 16,
      elevation: 12,
    },
    categoryIconContainer: {
      width: 52,
      height: 52,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
    },
    categoryHeader: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    categoryTitle: {
      fontSize: 15,
      fontWeight: '700',
      fontFamily: FONT_FAMILY,
      color: theme.textPrimary,
      flex: 1,
      textAlign: isRTL ? 'right' : 'left',
    },
    articleCount: {
      fontSize: 12,
      fontWeight: '600',
      fontFamily: FONT_FAMILY,
      color: theme.textSecondary,
      marginTop: 4,
      textAlign: isRTL ? 'right' : 'left',
    },
    faqSection: {
      backgroundColor: isDarkMode ? '#1b1b1b' : theme.surface,
      borderRadius: 18,
      padding: 20,
      marginBottom: 24,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.25,
      shadowRadius: 12,
      elevation: 8,
      borderWidth: 1,
      borderColor: isDarkMode ? '#262626' : theme.border,
    },
    faqItem: {
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? '#262626' : theme.borderLight,
      paddingVertical: 16,
    },
    faqQuestion: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    faqQuestionText: {
      flex: 1,
      fontSize: 15,
      fontWeight: '700',
      fontFamily: FONT_FAMILY,
      color: theme.textPrimary,
      textAlign: isRTL ? 'right' : 'left',
    },
    faqAnswer: {
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: theme.primary + '30',
    },
    faqAnswerText: {
      fontSize: 14,
      fontFamily: FONT_FAMILY,
      color: theme.textSecondary,
      lineHeight: 22,
      textAlign: isRTL ? 'right' : 'left',
    },
    articlesSection: {
      marginBottom: 24,
    },
    articleCard: {
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
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
    },
    articleIcon: {
      width: 52,
      height: 52,
      borderRadius: 14,
      backgroundColor: theme.primary + '20',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: isRTL ? 0 : 14,
      marginLeft: isRTL ? 14 : 0,
    },
    articleContent: {
      flex: 1,
    },
    articleTitle: {
      fontSize: 16,
      fontWeight: '800',
      fontFamily: FONT_FAMILY,
      color: theme.textPrimary,
      marginBottom: 8,
      textAlign: isRTL ? 'right' : 'left',
    },
    articleMeta: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      gap: 10,
    },
    articleMetaText: {
      fontSize: 12,
      fontFamily: FONT_FAMILY,
      color: theme.textSecondary,
    },
    bookmarkButton: {
      padding: 8,
    },
    popularSection: {
      backgroundColor: theme.primary + '15',
      borderRadius: 18,
      borderWidth: 2,
      borderColor: theme.primary,
      padding: 20,
      marginBottom: 24,
      shadowColor: theme.primary,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 8,
    },
    popularTitle: {
      fontSize: 18,
      fontWeight: '900',
      fontFamily: FONT_FAMILY,
      color: theme.textPrimary,
      marginBottom: 16,
      textAlign: isRTL ? 'right' : 'left',
      flexDirection: isRTL ? 'row-reverse' : 'row',
    },
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 60,
    },
    emptyIcon: {
      marginBottom: 16,
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
      padding: 40,
    },
    // Modal styles
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      justifyContent: 'center',
      padding: 20,
    },
    modalContent: {
      backgroundColor: isDarkMode ? '#1b1b1b' : theme.surface,
      borderRadius: 24,
      maxHeight: '90%',
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.5,
      shadowRadius: 20,
      elevation: 20,
    },
    modalHeader: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? '#262626' : theme.border,
    },
    modalTitle: {
      flex: 1,
      fontSize: 20,
      fontWeight: '900',
      fontFamily: FONT_FAMILY,
      color: theme.textPrimary,
      textAlign: isRTL ? 'right' : 'left',
      marginRight: isRTL ? 0 : 12,
      marginLeft: isRTL ? 12 : 0,
    },
    closeButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: isDarkMode ? '#262626' : theme.borderLight,
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalBody: {
      padding: 20,
    },
    modalMeta: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      gap: 16,
      marginBottom: 20,
      paddingBottom: 20,
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? '#262626' : theme.borderLight,
    },
    modalMetaItem: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      gap: 6,
    },
    modalContentText: {
      fontSize: 16,
      fontFamily: FONT_FAMILY,
      color: theme.textPrimary,
      lineHeight: 26,
      textAlign: isRTL ? 'right' : 'left',
    },
    bottomSpacer: {
      height: 40,
    },
  });

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={theme.primary} />
        <View style={styles.header}>
          <View style={styles.backButton} />
          <Text style={styles.headerTitle}>
            {isRTL ? 'قاعدة المعرفة' : 'Knowledge Base'}
          </Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.emptyText, { marginTop: 16 }]}>
            {isRTL ? 'جاري التحميل...' : 'Loading articles...'}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.primary} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          activeOpacity={0.7}
        >
          <ArrowLeft size={22} color={theme.primary} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          {isRTL ? 'قاعدة المعرفة' : 'Knowledge Base'}
        </Text>

        <View style={styles.headerSpacer} />
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
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Search size={22} color={theme.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={isRTL ? 'ابحث في المقالات...' : 'Search articles...'}
            placeholderTextColor={theme.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Categories */}
        {!searchQuery && (
          <>
            <Text style={styles.sectionTitle}>
              {isRTL ? 'تصفح حسب الفئة' : 'Browse by Category'}
            </Text>
            <View style={styles.categoriesGrid}>
              {categories.map((category) => {
                const Icon = category.icon;
                const isSelected = selectedCategory === category.id;
                const count = articles.filter(a => a.category === category.id).length;
                return (
                  <TouchableOpacity
                    key={category.id}
                    style={[styles.categoryCard, isSelected && styles.categoryCardSelected]}
                    onPress={() => handleCategorySelect(category.id)}
                    activeOpacity={0.7}
                  >
                    <View 
                      style={[
                        styles.categoryIconContainer, 
                        { backgroundColor: category.color + '20' }
                      ]}
                    >
                      <Icon size={26} color={category.color} />
                    </View>
                    <View style={styles.categoryHeader}>
                      <Text style={styles.categoryTitle}>
                        {isRTL ? category.titleAr : category.title}
                      </Text>
                    </View>
                    <Text style={styles.articleCount}>
                      {count} {isRTL ? 'مقال' : 'articles'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}

        {/* FAQs */}
        {!searchQuery && !selectedCategory && (
          <>
            <Text style={styles.sectionTitle}>
              {isRTL ? '❓ الأسئلة الشائعة' : '❓ Frequently Asked Questions'}
            </Text>
            <View style={styles.faqSection}>
              {faqs.slice(0, 5).map((faq, index) => (
                <TouchableOpacity
                  key={faq.id}
                  style={[styles.faqItem, index === faqs.length - 1 && { borderBottomWidth: 0 }]}
                  onPress={() => setExpandedFAQ(expandedFAQ === faq.id ? null : faq.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.faqQuestion}>
                    <Text style={styles.faqQuestionText}>
                      {isRTL ? faq.questionAr : faq.question}
                    </Text>
                    {expandedFAQ === faq.id ? (
                      <ChevronUp size={20} color={theme.primary} />
                    ) : (
                      <ChevronDown size={20} color={theme.textSecondary} />
                    )}
                  </View>
                  {expandedFAQ === faq.id && (
                    <View style={styles.faqAnswer}>
                      <Text style={styles.faqAnswerText}>
                        {isRTL ? faq.answerAr : faq.answer}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* Most Popular */}
        {!searchQuery && !selectedCategory && (
          <View style={styles.popularSection}>
            <Text style={styles.popularTitle}>
              {isRTL ? '⭐ الأكثر مشاهدة' : '⭐ Most Popular'}
            </Text>
            {articles.slice(0, 3).map((article, index) => (
              <TouchableOpacity
                key={article.id}
                style={{ marginBottom: index < 2 ? 16 : 0 }}
                onPress={() => openArticle(article)}
                activeOpacity={0.7}
              >
                <Text style={[styles.articleTitle, { marginBottom: 6 }]}>
                  {isRTL ? article.titleAr : article.title}
                </Text>
                <View style={styles.articleMeta}>
                  <Clock size={14} color={theme.textSecondary} />
                  <Text style={styles.articleMetaText}>
                    {article.readTime} {isRTL ? 'قراءة' : 'read'}
                  </Text>
                  <Text style={styles.articleMetaText}>•</Text>
                  <Eye size={14} color={theme.textSecondary} />
                  <Text style={styles.articleMetaText}>
                    {article.views}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Articles */}
        <View style={styles.articlesSection}>
          <Text style={styles.sectionTitle}>
            {selectedCategory 
              ? (isRTL ? 'المقالات' : 'Articles')
              : searchQuery 
              ? (isRTL ? 'نتائج البحث' : 'Search Results')
              : (isRTL ? 'جميع المقالات' : 'All Articles')
            }
          </Text>

          {filteredArticles.length > 0 ? (
            filteredArticles.map((article) => (
              <TouchableOpacity
                key={article.id}
                style={styles.articleCard}
                onPress={() => openArticle(article)}
                activeOpacity={0.7}
              >
                <View style={styles.articleIcon}>
                  <FileText size={26} color={theme.primary} />
                </View>
                <View style={styles.articleContent}>
                  <Text style={styles.articleTitle}>
                    {isRTL ? article.titleAr : article.title}
                  </Text>
                  <View style={styles.articleMeta}>
                    <Clock size={14} color={theme.textSecondary} />
                    <Text style={styles.articleMetaText}>
                      {article.readTime}
                    </Text>
                    <Text style={styles.articleMetaText}>•</Text>
                    <Eye size={14} color={theme.textSecondary} />
                    <Text style={styles.articleMetaText}>
                      {article.views}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.bookmarkButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    toggleBookmark(article.id);
                  }}
                  activeOpacity={0.7}
                >
                  {bookmarkedIds.includes(article.id) ? (
                    <BookmarkCheck size={22} color={theme.primary} />
                  ) : (
                    <Bookmark size={22} color={theme.textSecondary} />
                  )}
                </TouchableOpacity>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <HelpCircle size={80} color={theme.textSecondary} style={styles.emptyIcon} />
              <Text style={styles.emptyText}>
                {isRTL ? 'لم يتم العثور على مقالات' : 'No articles found'}
              </Text>
              <Text style={[styles.articleMetaText, { marginTop: 8 }]}>
                {isRTL ? 'جرب مصطلح بحث آخر' : 'Try a different search term'}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Article Detail Modal */}
      <Modal
        visible={selectedArticle !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedArticle(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedArticle && (isRTL ? selectedArticle.titleAr : selectedArticle.title)}
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setSelectedArticle(null)}
                activeOpacity={0.7}
              >
                <X size={20} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {selectedArticle && (
                <>
                  <View style={styles.modalMeta}>
                    <View style={styles.modalMetaItem}>
                      <Clock size={16} color={theme.textSecondary} />
                      <Text style={styles.articleMetaText}>{selectedArticle.readTime}</Text>
                    </View>
                    <View style={styles.modalMetaItem}>
                      <Eye size={16} color={theme.textSecondary} />
                      <Text style={styles.articleMetaText}>{selectedArticle.views}</Text>
                    </View>
                  </View>
                  
                  <Text style={styles.modalContentText}>
                    {isRTL ? selectedArticle.contentAr : selectedArticle.content}
                  </Text>
                </>
              )}
              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
