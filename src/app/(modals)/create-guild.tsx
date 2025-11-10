import React, { useState, useCallback } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Text,
  TextInput,
  StatusBar
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useI18n } from '@/contexts/I18nProvider';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useRealPayment } from '@/contexts/RealPaymentContext';
import CustomAlert from '@/app/components/CustomAlert';
import { ArrowLeft, Shield, Users, MapPin, FileText, Lock, Globe, Check, Coins, Crown, TrendingUp } from 'lucide-react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import AppBottomNavigation from '@/app/components/AppBottomNavigation';
import { CustomAlertService } from '@/services/CustomAlertService';
// COMMENT: PRIORITY 1 - Replace console statements with logger
import { logger } from '@/utils/logger';
import { guildService } from '@/services/firebase/GuildService';

const FONT_FAMILY = 'Signika Negative SC';

interface GuildFormData {
  name: string;
  description: string;
  category: string;
  location: string;
  requirements: string;
  maxMembers: number;
  isPublic: boolean;
}

interface TopArtisan {
  id: number;
  name: string;
  role: string;
  level: number;
  jobs: number;
  rating: number;
  rank: number;
}

interface GuildBenefit {
  id: number;
  title: string;
  icon: any;
  color: string;
}

export default function CreateGuildScreen() {
  const insets = useSafeAreaInsets();
  const top = insets?.top || 0;
  const bottom = insets?.bottom || 0;
  const { t, isRTL } = useI18n();
  const { theme, isDarkMode } = useTheme();
  const { user } = useAuth();
  const { wallet, processPayment } = useRealPayment(); // ✅ TASK 9: Added missing hook invocation
  
  const adaptiveColors = {
    background: isDarkMode ? theme.background : '#FFFFFF',
    text: isDarkMode ? theme.text : '#1A1A1A',
    textSecondary: isDarkMode ? theme.textSecondary : '#666666',
    surface: isDarkMode ? theme.surface : '#F8F9FA',
    border: isDarkMode ? theme.border : 'rgba(0,0,0,0.08)',
    primary: theme.primary,
    buttonText: '#000000',
  };

  const [formData, setFormData] = useState<GuildFormData>({
    name: '',
    description: '',
    category: '',
    location: '',
    requirements: '',
    maxMembers: 50,
    isPublic: true
  });

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  
  // Custom Alert States
  const [showNameErrorAlert, setShowNameErrorAlert] = useState(false);
  const [showDescriptionErrorAlert, setShowDescriptionErrorAlert] = useState(false);
  const [showCategoryErrorAlert, setShowCategoryErrorAlert] = useState(false);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);

  const categories = [
    'Technology', 'Design', 'Construction', 'Cleaning', 'Delivery', 
    'Tutoring', 'Photography', 'Translation', 'Cooking', 'Gardening'
  ];

  const topArtisans: TopArtisan[] = [
    {
      id: 1,
      name: 'Ahmed Hassan',
      role: 'Guild Master',
      level: 15,
      jobs: 247,
      rating: 4.9,
      rank: 1
    },
    {
      id: 2,
      name: 'Amira Farid',
      role: 'Senior Artisan',
      level: 12,
      jobs: 189,
      rating: 4.8,
      rank: 2
    },
    {
      id: 3,
      name: 'Mohammed Al-Rashid',
      role: 'Master Craftsman',
      level: 10,
      jobs: 156,
      rating: 4.7,
      rank: 3
    }
  ];

  const guildBenefits: GuildBenefit[] = [
    {
      id: 1,
      title: 'Get early access to high-paying guild jobs',
      icon: Shield,
      color: theme.primary
    },
    {
      id: 2,
      title: 'Earn extra QAR based on guild performance',
      icon: Crown,
      color: '#F39C12'
    },
    {
      id: 3,
      title: 'Free training sessions with guild masters',
      icon: Users,
      color: '#E74C3C'
    },
    {
      id: 4,
      title: 'Access to exclusive guild equipment',
      icon: TrendingUp,
      color: '#9B59B6'
    }
  ];

  const handleBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.push('/(modals)/guilds');
    }
  }, []);

  const handleInputChange = useCallback((field: keyof GuildFormData, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleCategoryToggle = useCallback((category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  }, []);

  const handleCreateGuild = useCallback(async () => {
    if (!formData.name.trim()) {
      setShowNameErrorAlert(true);
      return;
    }

    if (!formData.description.trim()) {
      setShowDescriptionErrorAlert(true);
      return;
    }

    if (selectedCategories.length === 0) {
      setShowCategoryErrorAlert(true);
      return;
    }

    // Check if user has sufficient coins (2500 QR worth)
    const GUILD_CREATION_COST = 2500; // 2500 QR worth of coins
    if (!wallet || wallet.balance < GUILD_CREATION_COST) {
      CustomAlertService.showError(
        t('error'),
        isRTL 
          ? `رصيدك غير كافٍ. تحتاج إلى عملات بقيمة ${GUILD_CREATION_COST} ريال قطري لإنشاء نقابة.`
          : `Insufficient balance. You need ${GUILD_CREATION_COST} QR worth of coins to create a guild.`
      );
      return;
    }

    // Process coin payment for guild creation
    try {
      const success = await processPayment(
        GUILD_CREATION_COST,
        'guild_creation',
        `Guild creation: ${formData.name}`,
        'system' // Payment goes to system (platform)
      );

      if (!success) {
        CustomAlertService.showError(
          t('error'),
          isRTL ? 'فشل في معالجة الدفع' : 'Payment processing failed'
        );
        return;
      }

      // Actually create the guild in the backend
      if (!user?.uid) {
        throw new Error('User not authenticated');
      }

      const guildData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        category: selectedCategories.join(', '), // Join multiple categories
        location: formData.location.trim() || 'Global',
        settings: {
          isPublic: formData.isPublic,
          requiresApproval: true, // Default to requiring approval
          minimumRank: 'G', // Default minimum rank
          maxMembers: formData.maxMembers,
          guildRules: formData.requirements.trim() 
            ? formData.requirements.trim().split('\n').filter(r => r.trim())
            : [
                'Respect all members',
                'Complete assigned tasks on time',
                'Maintain professional communication',
                'Contribute to guild success'
              ],
          autoApprovalEnabled: false,
          memberRemovalPolicy: 'MASTER_ONLY' as const,
        },
      };

      logger.info('Creating guild:', { name: guildData.name, userId: user.uid });
      
      const createdGuild = await guildService.createGuild(guildData);
      
      logger.info('Guild created successfully:', { guildId: createdGuild.id, name: createdGuild.name });
      
      setShowSuccessAlert(true);
    } catch (error) {
      // COMMENT: PRIORITY 1 - Replace console.error with logger
      logger.error('Error creating guild:', error);
      CustomAlertService.showError(
        t('error'),
        isRTL ? 'فشل في إنشاء النقابة' : 'Failed to create guild'
      );
    }
  }, [formData, selectedCategories, wallet, processPayment, user, t, isRTL]);
  
  const handleSuccessConfirm = useCallback(() => {
    setShowSuccessAlert(false);
    router.push('/(modals)/guilds');
  }, []);

  const styles = StyleSheet.create({
    screen: { 
      flex: 1, 
      backgroundColor: isDarkMode ? '#000000' : theme.background 
    },
    header: { 
      paddingTop: top + 12, 
      paddingBottom: 16, 
      paddingHorizontal: 18, 
      backgroundColor: theme.primary,
      borderBottomLeftRadius: 26,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between'
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
    },
    headerTitle: { 
      color: isDarkMode ? '#000000' : '#000000', 
      fontSize: 24, 
      fontWeight: '900', 
      fontFamily: FONT_FAMILY,
      flex: 1,
      textAlign: 'center'
    },
    headerActionButton: {
      width: 42,
      height: 42,
      borderRadius: 12,
      backgroundColor: isDarkMode ? '#000000' : '#FFFFFF',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: isDarkMode ? '#2a2a2a' : '#E0E0E0',
    },
    content: { 
      flex: 1, 
      backgroundColor: isDarkMode ? '#111111' : theme.surface
    },
    scrollContent: {
      padding: 16,
    },
    formCard: {
      backgroundColor: isDarkMode ? '#1b1b1b' : theme.surface,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: isDarkMode ? '#262626' : theme.border,
      marginBottom: 16,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.4,
      shadowRadius: 16,
      elevation: 12,
      overflow: 'hidden',
    },
    cardHeader: {
      backgroundColor: theme.primary + '20',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? '#262626' : theme.borderLight,
    },
    cardTitle: {
      color: theme.textPrimary,
      fontSize: 18,
      fontWeight: '900',
      fontFamily: FONT_FAMILY,
    },
    cardContent: {
      padding: 20,
    },
    inputGroup: {
      marginBottom: 20,
    },
    inputLabel: {
      color: theme.textPrimary,
      fontSize: 14,
      fontWeight: '700',
      fontFamily: FONT_FAMILY,
      marginBottom: 8,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDarkMode ? '#000000' : theme.surfaceSecondary,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: isDarkMode ? '#2a2a2a' : theme.borderLight,
      paddingHorizontal: 12,
      paddingVertical: 4,
    },
    inputIcon: {
      marginRight: 12,
    },
    textInput: {
      flex: 1,
      color: theme.textPrimary,
      fontSize: 16,
      fontFamily: FONT_FAMILY,
      paddingVertical: 12,
    },
    textArea: {
      minHeight: 80,
      textAlignVertical: 'top',
    },
    categoriesContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 8,
    },
    categoryChip: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: isDarkMode ? '#2a2a2a' : theme.borderLight,
      backgroundColor: isDarkMode ? '#000000' : theme.surfaceSecondary,
    },
    categoryChipSelected: {
      backgroundColor: theme.primary + '20',
      borderColor: theme.primary,
    },
    categoryText: {
      color: theme.textSecondary,
      fontSize: 12,
      fontFamily: FONT_FAMILY,
      fontWeight: '700',
    },
    categoryTextSelected: {
      color: theme.primary,
    },
    benefitsCard: {
      backgroundColor: isDarkMode ? '#1b1b1b' : theme.surface,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: isDarkMode ? '#262626' : theme.border,
      marginBottom: 16,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.4,
      shadowRadius: 16,
      elevation: 12,
    },
    benefitItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? '#262626' : theme.borderLight,
    },
    benefitIcon: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: isDarkMode ? '#000000' : theme.surfaceSecondary,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
      borderWidth: 1,
      borderColor: isDarkMode ? '#2a2a2a' : theme.borderLight,
    },
    benefitText: {
      flex: 1,
      color: theme.textPrimary,
      fontSize: 14,
      fontFamily: FONT_FAMILY,
      lineHeight: 20,
    },
    topArtisansCard: {
      backgroundColor: isDarkMode ? '#1b1b1b' : theme.surface,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: isDarkMode ? '#262626' : theme.border,
      marginBottom: 16,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.4,
      shadowRadius: 16,
      elevation: 12,
    },
    artisanItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? '#262626' : theme.borderLight,
    },
    rankBadge: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    rankText: {
      color: '#000000',
      fontSize: 16,
      fontWeight: '900',
      fontFamily: FONT_FAMILY,
    },
    artisanInfo: {
      flex: 1,
    },
    artisanName: {
      color: theme.textPrimary,
      fontSize: 16,
      fontWeight: '800',
      fontFamily: FONT_FAMILY,
      marginBottom: 2,
    },
    artisanRole: {
      color: theme.textSecondary,
      fontSize: 12,
      fontFamily: FONT_FAMILY,
    },
    artisanStats: {
      alignItems: 'flex-end',
    },
    artisanRating: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginBottom: 4,
    },
    ratingText: {
      color: theme.primary,
      fontSize: 14,
      fontFamily: FONT_FAMILY,
      fontWeight: '700',
    },
    artisanJobs: {
      color: theme.textSecondary,
      fontSize: 11,
      fontFamily: FONT_FAMILY,
    },
    createButton: {
      backgroundColor: theme.primary,
      borderRadius: 16,
      paddingVertical: 16,
      alignItems: 'center',
      marginHorizontal: 16,
      marginBottom: 16,
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 8,
    },
    createButtonText: {
      color: '#000000',
      fontSize: 18,
      fontWeight: '900',
      fontFamily: FONT_FAMILY,
    },
    bottomSpacer: {
      height: 100,
    },
  });

  return (
    <View style={styles.screen}>
      <StatusBar 
        barStyle={isDarkMode ? "dark-content" : "dark-content"} 
        backgroundColor={theme.primary} 
      />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={20} color={theme.primary} />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>
          {t('createGuild') || 'Create Guild'}
        </Text>
        
        <View style={styles.headerActionButton}>
          <Ionicons name="add" size={18} color={theme.primary} />
        </View>
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Guild Form */}
        <View style={styles.formCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>
              {t('guildInformation') || 'Guild Information'}
            </Text>
          </View>
          
          <View style={styles.cardContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('guildName') || 'Guild Name'}</Text>
              <View style={styles.inputContainer}>
                <MaterialIcons name="security" size={20} color={theme.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  value={formData.name}
                  onChangeText={(text) => handleInputChange('name', text)}
                  placeholder={t('enterGuildName') || 'Enter guild name'}
                  placeholderTextColor={theme.textSecondary}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('description') || 'Description'}</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="pricetag-outline" size={20} color={theme.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  value={formData.description}
                  onChangeText={(text) => handleInputChange('description', text)}
                  placeholder={t('enterGuildDescription') || 'Describe your guild\'s purpose and goals'}
                  placeholderTextColor={theme.textSecondary}
                  multiline
                  numberOfLines={4}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('location') || 'Location'}</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="location-outline" size={20} color={theme.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  value={formData.location}
                  onChangeText={(text) => handleInputChange('location', text)}
                  placeholder={t('enterLocation') || 'Enter guild location'}
                  placeholderTextColor={theme.textSecondary}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('categories') || 'Categories'}</Text>
              <View style={styles.categoriesContainer}>
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.categoryChip,
                      selectedCategories.includes(category) && styles.categoryChipSelected
                    ]}
                    onPress={() => handleCategoryToggle(category)}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.categoryText,
                      selectedCategories.includes(category) && styles.categoryTextSelected
                    ]}>
                      {category}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('requirements') || 'Requirements'}</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="radio-button-on-outline" size={20} color={theme.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  value={formData.requirements}
                  onChangeText={(text) => handleInputChange('requirements', text)}
                  placeholder={t('enterRequirements') || 'Enter requirements for joining this guild'}
                  placeholderTextColor={theme.textSecondary}
                  multiline
                  numberOfLines={3}
                />
              </View>
            </View>
          </View>
        </View>

        {/* Guild Benefits */}
        <View style={styles.benefitsCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>
              {t('guildBenefits') || 'Guild Benefits'}
            </Text>
          </View>
          
          {guildBenefits.map((benefit, index) => {
            const IconComponent = benefit.icon;
            return (
              <View key={benefit.id} style={[
                styles.benefitItem,
                index === guildBenefits.length - 1 && { borderBottomWidth: 0 }
              ]}>
                <View style={styles.benefitIcon}>
                  <IconComponent size={20} color={benefit.color} />
                </View>
                <Text style={styles.benefitText}>{benefit.title}</Text>
                <Ionicons name="checkmark-circle-outline" size={16} color={theme.primary} />
              </View>
            );
          })}
        </View>

        {/* Top Artisans */}
        <View style={styles.topArtisansCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>
              {t('topArtisans') || 'Top Artisans in Qatar'}
            </Text>
          </View>
          
          {topArtisans.map((artisan, index) => (
            <View key={artisan.id} style={[
              styles.artisanItem,
              index === topArtisans.length - 1 && { borderBottomWidth: 0 }
            ]}>
              <View style={styles.rankBadge}>
                <Text style={styles.rankText}>#{artisan.rank}</Text>
              </View>
              
              <View style={styles.artisanInfo}>
                <Text style={styles.artisanName}>{artisan.name}</Text>
                <Text style={styles.artisanRole}>{artisan.role} • Level {artisan.level}</Text>
              </View>
              
              <View style={styles.artisanStats}>
                <View style={styles.artisanRating}>
                  <Ionicons name="star-outline" size={12} color={theme.primary} />
                  <Text style={styles.ratingText}>{artisan.rating}</Text>
                </View>
                <Text style={styles.artisanJobs}>{artisan.jobs} jobs</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Create Button */}
      <TouchableOpacity 
        style={styles.createButton}
        onPress={handleCreateGuild}
        activeOpacity={0.8}
      >
        <MaterialIcons name="security" size={20} color="#000000" />
        <Text style={styles.createButtonText}>
          {t('createGuild') || 'Create Guild'}
        </Text>
      </TouchableOpacity>
      
      <AppBottomNavigation currentRoute="/create-guild" />

      {/* Custom Alerts */}
      <CustomAlert
        visible={showNameErrorAlert}
        title="Error"
        message="Guild name is required"
        buttons={[{ text: 'OK', onPress: () => setShowNameErrorAlert(false) }]}
        onDismiss={() => setShowNameErrorAlert(false)}
      />

      <CustomAlert
        visible={showDescriptionErrorAlert}
        title="Error"
        message="Guild description is required"
        buttons={[{ text: 'OK', onPress: () => setShowDescriptionErrorAlert(false) }]}
        onDismiss={() => setShowDescriptionErrorAlert(false)}
      />

      <CustomAlert
        visible={showCategoryErrorAlert}
        title="Error"
        message="Please select at least one category"
        buttons={[{ text: 'OK', onPress: () => setShowCategoryErrorAlert(false) }]}
        onDismiss={() => setShowCategoryErrorAlert(false)}
      />

      <CustomAlert
        visible={showSuccessAlert}
        title="Guild Created!"
        message={`Your guild "${formData.name}" has been created successfully!`}
        buttons={[{ text: 'OK', onPress: handleSuccessConfirm }]}
        onDismiss={handleSuccessConfirm}
      />
    </View>
  );
}