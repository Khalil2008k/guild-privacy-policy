import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  TextInput,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { useI18n } from '@/contexts/I18nProvider';
import { 
  ArrowLeft, 
  Search, 
  HelpCircle, 
  MessageCircle, 
  Book, 
  Shield, 
  CreditCard, 
  Users, 
  Briefcase,
  Settings,
  ChevronRight,
  Mail,
  Phone,
  MessageSquare
} from 'lucide-react-native';

const FONT_FAMILY = 'Signika Negative SC';

// Advanced Light Mode Color Helper
const getAdaptiveColors = (theme: any, isDark: boolean) => ({
  background: isDark ? theme.background : '#F5F5F5',
  cardBackground: isDark ? theme.surface : '#FFFFFF',
  cardBorder: isDark ? theme.border : 'rgba(0, 0, 0, 0.08)',
  primaryText: isDark ? theme.textPrimary : '#000000',
  secondaryText: isDark ? theme.textSecondary : '#666666',
  searchBackground: isDark ? theme.surface : '#F8F8F8',
  searchBorder: isDark ? 'transparent' : 'rgba(0, 0, 0, 0.06)',
  iconColor: isDark ? theme.textSecondary : '#666666',
  cardShadow: isDark 
    ? { shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8 }
    : { shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 12 },
});

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

interface HelpCategory {
  id: string;
  title: string;
  titleAr: string;
  icon: any;
  color: string;
  route?: string;
}

export default function HelpScreen() {
  const insets = useSafeAreaInsets();
  const { theme, isDarkMode } = useTheme();
  const { t, isRTL } = useI18n();
  
  const adaptiveColors = React.useMemo(() => getAdaptiveColors(theme, isDarkMode), [theme, isDarkMode]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);

  const categories: HelpCategory[] = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      titleAr: 'البدء',
      icon: Book,
      color: '#3B82F6',
    },
    {
      id: 'account',
      title: 'Account & Profile',
      titleAr: 'الحساب والملف الشخصي',
      icon: Shield,
      color: '#10B981',
    },
    {
      id: 'jobs',
      title: 'Jobs & Contracts',
      titleAr: 'الوظائف والعقود',
      icon: Briefcase,
      color: '#F59E0B',
    },
    {
      id: 'payments',
      title: 'Payments & Wallet',
      titleAr: 'المدفوعات والمحفظة',
      icon: CreditCard,
      color: '#8B5CF6',
    },
    {
      id: 'guilds',
      title: 'Guilds & Teams',
      titleAr: 'النقابات والفرق',
      icon: Users,
      color: '#EC4899',
    },
    {
      id: 'settings',
      title: 'Settings & Privacy',
      titleAr: 'الإعدادات والخصوصية',
      icon: Settings,
      color: '#6366F1',
    },
  ];

  const faqs: FAQItem[] = [
    {
      id: '1',
      question: isRTL ? 'كيف أبدأ في استخدام GUILD؟' : 'How do I get started with GUILD?',
      answer: isRTL 
        ? 'قم بإنشاء حساب، أكمل ملفك الشخصي، واستكشف الوظائف المتاحة. يمكنك الانضمام إلى نقابة أو البقاء منفردًا.'
        : 'Create an account, complete your profile, and explore available jobs. You can join a guild or stay solo.',
      category: 'getting-started',
    },
    {
      id: '2',
      question: isRTL ? 'ما هي العملات التجريبية؟' : 'What are Guild Coins?',
      answer: isRTL
        ? 'عملات GUILD هي عملة تجريبية للاختبار التجريبي. كل مستخدم يحصل على 300 عملة للبدء. سيتم دمج نظام الدفع الحقيقي قريبًا.'
        : 'Guild Coins are test currency for beta testing. Each user gets 300 coins to start. Real payment system will be integrated soon.',
      category: 'payments',
    },
    {
      id: '3',
      question: isRTL ? 'كيف أنشر وظيفة؟' : 'How do I post a job?',
      answer: isRTL
        ? 'اضغط على زر + في الشاشة الرئيسية، املأ تفاصيل الوظيفة، وقم بالنشر. سيتم خصم 10 عملات من رصيدك.'
        : 'Tap the + button on the home screen, fill in job details, and post. 10 coins will be deducted from your balance.',
      category: 'jobs',
    },
    {
      id: '4',
      question: isRTL ? 'ما هي النقابات؟' : 'What are Guilds?',
      answer: isRTL
        ? 'النقابات هي فرق من المحترفين يعملون معًا. يمكنك إنشاء نقابة أو الانضمام إلى واحدة موجودة.'
        : 'Guilds are teams of professionals working together. You can create a guild or join an existing one.',
      category: 'guilds',
    },
    {
      id: '5',
      question: isRTL ? 'كيف أتواصل مع الدعم؟' : 'How do I contact support?',
      answer: isRTL
        ? 'يمكنك التواصل معنا عبر البريد الإلكتروني أو الهاتف أو الدردشة المباشرة من الخيارات أدناه.'
        : 'You can reach us via email, phone, or live chat from the options below.',
      category: 'account',
    },
    {
      id: '6',
      question: isRTL ? 'هل بياناتي آمنة؟' : 'Is my data safe?',
      answer: isRTL
        ? 'نعم، نحن نستخدم تشفير من الدرجة المصرفية ونتبع أفضل ممارسات الأمان لحماية بياناتك.'
        : 'Yes, we use bank-grade encryption and follow best security practices to protect your data.',
      category: 'settings',
    },
  ];

  const filteredFAQs = searchQuery.trim()
    ? faqs.filter(faq => 
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : faqs;

  const handleBack = () => {
    router.back();
  };

  const toggleFAQ = (id: string) => {
    setExpandedFAQ(expandedFAQ === id ? null : id);
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
    content: {
      flex: 1,
    },
    scrollContent: {
      padding: 16,
    },
    searchContainer: {
      backgroundColor: adaptiveColors.searchBackground,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: adaptiveColors.searchBorder,
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      marginBottom: 20,
      ...adaptiveColors.cardShadow,
      shadowOffset: { width: 0, height: 2 },
      elevation: isDarkMode ? 2 : 4,
    },
    searchIcon: {
      marginRight: isRTL ? 0 : 12,
      marginLeft: isRTL ? 12 : 0,
    },
    searchInput: {
      flex: 1,
      color: adaptiveColors.primaryText,
      fontSize: 16,
      fontFamily: FONT_FAMILY,
      textAlign: isRTL ? 'right' : 'left',
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '900',
      fontFamily: FONT_FAMILY,
      color: adaptiveColors.primaryText,
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
      backgroundColor: adaptiveColors.cardBackground,
      borderRadius: 16,
      padding: 16,
      alignItems: 'center',
      ...adaptiveColors.cardShadow,
      shadowOffset: { width: 0, height: 2 },
      elevation: isDarkMode ? 3 : 5,
      borderWidth: 1,
      borderColor: adaptiveColors.cardBorder,
    },
    categoryIconContainer: {
      width: 56,
      height: 56,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
    },
    categoryTitle: {
      fontSize: 14,
      fontWeight: '700',
      fontFamily: FONT_FAMILY,
      color: adaptiveColors.primaryText,
      textAlign: 'center',
    },
    faqSection: {
      marginBottom: 24,
    },
    faqItem: {
      backgroundColor: adaptiveColors.cardBackground,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: adaptiveColors.cardBorder,
      marginBottom: 12,
      overflow: 'hidden',
      ...adaptiveColors.cardShadow,
      shadowOffset: { width: 0, height: 2 },
      elevation: isDarkMode ? 2 : 4,
    },
    faqQuestion: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
    },
    faqQuestionText: {
      flex: 1,
      fontSize: 15,
      fontWeight: '700',
      fontFamily: FONT_FAMILY,
      color: adaptiveColors.primaryText,
      textAlign: isRTL ? 'right' : 'left',
      marginRight: isRTL ? 0 : 12,
      marginLeft: isRTL ? 12 : 0,
    },
    faqAnswer: {
      padding: 16,
      paddingTop: 0,
      borderTopWidth: 1,
      borderTopColor: adaptiveColors.cardBorder,
    },
    faqAnswerText: {
      fontSize: 14,
      fontFamily: FONT_FAMILY,
      color: adaptiveColors.secondaryText,
      lineHeight: 20,
      textAlign: isRTL ? 'right' : 'left',
    },
    contactSection: {
      backgroundColor: adaptiveColors.cardBackground,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: adaptiveColors.cardBorder,
      padding: 20,
      marginBottom: 24,
      ...adaptiveColors.cardShadow,
      shadowOffset: { width: 0, height: 3 },
      elevation: isDarkMode ? 4 : 6,
    },
    contactTitle: {
      fontSize: 18,
      fontWeight: '900',
      fontFamily: FONT_FAMILY,
      color: adaptiveColors.primaryText,
      marginBottom: 16,
      textAlign: isRTL ? 'right' : 'left',
    },
    contactOption: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: adaptiveColors.cardBorder,
    },
    lastContactOption: {
      borderBottomWidth: 0,
    },
    contactIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: isRTL ? 0 : 12,
      marginLeft: isRTL ? 12 : 0,
    },
    contactText: {
      flex: 1,
    },
    contactLabel: {
      fontSize: 14,
      fontWeight: '700',
      fontFamily: FONT_FAMILY,
      color: adaptiveColors.primaryText,
      textAlign: isRTL ? 'right' : 'left',
    },
    contactValue: {
      fontSize: 13,
      fontFamily: FONT_FAMILY,
      color: adaptiveColors.secondaryText,
      marginTop: 2,
      textAlign: isRTL ? 'right' : 'left',
    },
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 40,
    },
    emptyText: {
      fontSize: 16,
      fontFamily: FONT_FAMILY,
      color: theme.textSecondary,
      marginTop: 12,
    },
    bottomSpacer: {
      height: 40,
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
          {isRTL ? 'المساعدة والدعم' : 'Help & Support'}
        </Text>

        <View style={styles.headerSpacer} />
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Search size={20} color={adaptiveColors.iconColor} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={isRTL ? 'ابحث عن إجابة...' : 'Search for an answer...'}
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
                return (
                  <TouchableOpacity
                    key={category.id}
                    style={styles.categoryCard}
                    activeOpacity={0.7}
                  >
                    <View 
                      style={[
                        styles.categoryIconContainer, 
                        { backgroundColor: category.color + '20' }
                      ]}
                    >
                      <Icon size={28} color={category.color} />
                    </View>
                    <Text style={styles.categoryTitle}>
                      {isRTL ? category.titleAr : category.title}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}

        {/* FAQs */}
        <View style={styles.faqSection}>
          <Text style={styles.sectionTitle}>
            {isRTL ? 'الأسئلة الشائعة' : 'Frequently Asked Questions'}
          </Text>

          {filteredFAQs.length > 0 ? (
            filteredFAQs.map((faq) => (
              <TouchableOpacity
                key={faq.id}
                style={styles.faqItem}
                onPress={() => toggleFAQ(faq.id)}
                activeOpacity={0.7}
              >
                <View style={styles.faqQuestion}>
                  <Text style={styles.faqQuestionText}>{faq.question}</Text>
                  <HelpCircle 
                    size={20} 
                    color={expandedFAQ === faq.id ? theme.primary : theme.textSecondary} 
                  />
                </View>
                {expandedFAQ === faq.id && (
                  <View style={styles.faqAnswer}>
                    <Text style={styles.faqAnswerText}>{faq.answer}</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <HelpCircle size={48} color={adaptiveColors.secondaryText} />
              <Text style={styles.emptyText}>
                {isRTL ? 'لم يتم العثور على نتائج' : 'No results found'}
              </Text>
            </View>
          )}
        </View>

        {/* Contact Support */}
        <View style={styles.contactSection}>
          <Text style={styles.contactTitle}>
            {isRTL ? 'تواصل معنا' : 'Contact Us'}
          </Text>

          <TouchableOpacity 
            style={styles.contactOption}
            activeOpacity={0.7}
          >
            <View style={[styles.contactIconContainer, { backgroundColor: '#3B82F620' }]}>
              <Mail size={20} color="#3B82F6" />
            </View>
            <View style={styles.contactText}>
              <Text style={styles.contactLabel}>
                {isRTL ? 'البريد الإلكتروني' : 'Email'}
              </Text>
              <Text style={styles.contactValue}>support@guild.app</Text>
            </View>
            <ChevronRight size={20} color={adaptiveColors.iconColor} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.contactOption}
            activeOpacity={0.7}
          >
            <View style={[styles.contactIconContainer, { backgroundColor: '#10B98120' }]}>
              <Phone size={20} color="#10B981" />
            </View>
            <View style={styles.contactText}>
              <Text style={styles.contactLabel}>
                {isRTL ? 'الهاتف' : 'Phone'}
              </Text>
              <Text style={styles.contactValue}>+974 1234 5678</Text>
            </View>
            <ChevronRight size={20} color={adaptiveColors.iconColor} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.contactOption, styles.lastContactOption]}
            activeOpacity={0.7}
          >
            <View style={[styles.contactIconContainer, { backgroundColor: '#8B5CF620' }]}>
              <MessageSquare size={20} color="#8B5CF6" />
            </View>
            <View style={styles.contactText}>
              <Text style={styles.contactLabel}>
                {isRTL ? 'الدردشة المباشرة' : 'Live Chat'}
              </Text>
              <Text style={styles.contactValue}>
                {isRTL ? 'متاح 24/7' : 'Available 24/7'}
              </Text>
            </View>
            <ChevronRight size={20} color={adaptiveColors.iconColor} />
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

