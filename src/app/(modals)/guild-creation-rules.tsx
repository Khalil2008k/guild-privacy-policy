import React, { useState, useCallback } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Text,
  StatusBar
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useI18n } from '@/contexts/I18nProvider';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useRanking } from '@/contexts/RankingContext';
import { useRealPayment } from '@/contexts/RealPaymentContext';
import { CustomAlertService } from '@/services/CustomAlertService';
import { ArrowLeft, Shield, Coins, Award, CheckCircle, XCircle } from 'lucide-react-native';
import { Ionicons } from '@expo/vector-icons';
import AppBottomNavigation from '@/app/components/AppBottomNavigation';
import { logger } from '@/utils/logger';
import { RankLevel } from '@/utils/rankingSystem';

const FONT_FAMILY = 'Signika Negative SC';

const MINIMUM_RANK: RankLevel = 'C';
const GUILD_CREATION_COST = 2500; // QR

const RANK_ORDER: RankLevel[] = ['G', 'F', 'E', 'D', 'C', 'B', 'A', 'S', 'SS', 'SSS'];

export default function GuildCreationRulesScreen() {
  const insets = useSafeAreaInsets();
  const top = insets?.top || 0;
  const bottom = insets?.bottom || 0;
  const { t, isRTL } = useI18n();
  const { theme, isDarkMode } = useTheme();
  const { user } = useAuth();
  const { currentRank } = useRanking();
  const { wallet } = useRealPayment();
  
  const [agreed, setAgreed] = useState(false);

  const adaptiveColors = {
    background: isDarkMode ? theme.background : '#FFFFFF',
    text: isDarkMode ? theme.text : '#1A1A1A',
    textSecondary: isDarkMode ? theme.textSecondary : '#666666',
    surface: isDarkMode ? theme.surface : '#F8F9FA',
    border: isDarkMode ? theme.border : 'rgba(0,0,0,0.08)',
    primary: theme.primary,
    buttonText: '#000000',
  };

  const currentRankIndex = RANK_ORDER.indexOf(currentRank);
  const minimumRankIndex = RANK_ORDER.indexOf(MINIMUM_RANK);
  const hasMinimumRank = currentRankIndex >= minimumRankIndex;
  const hasSufficientBalance = wallet && wallet.balance >= GUILD_CREATION_COST;

  const rules = [
    {
      icon: Award,
      title: isRTL ? 'الرتبة المطلوبة' : 'Minimum Rank Required',
      description: isRTL 
        ? `يجب أن تكون رتبتك ${MINIMUM_RANK} على الأقل لإنشاء Guild`
        : `You must have a minimum rank of ${MINIMUM_RANK} to create a guild`,
      met: hasMinimumRank,
      currentValue: currentRank,
      requiredValue: MINIMUM_RANK,
    },
    {
      icon: Coins,
      title: isRTL ? 'رسوم الإنشاء' : 'Creation Fee',
      description: isRTL 
        ? `يجب أن يكون لديك ${GUILD_CREATION_COST} ريال قطري على الأقل في محفظتك`
        : `You must have at least ${GUILD_CREATION_COST} QR in your wallet`,
      met: hasSufficientBalance,
      currentValue: wallet?.balance || 0,
      requiredValue: GUILD_CREATION_COST,
    },
    {
      icon: Shield,
      title: isRTL ? 'مسؤوليات Guild' : 'Guild Responsibilities',
      description: isRTL 
        ? 'أنت مسؤول عن إدارة Guild، الأعضاء، والمهام. يجب الحفاظ على معايير عالية من الجودة والاحترافية.'
        : 'You are responsible for managing the guild, members, and tasks. You must maintain high standards of quality and professionalism.',
      met: true, // Always shown as informational
    },
    {
      icon: Shield,
      title: isRTL ? 'قواعد Guild' : 'Guild Rules',
      description: isRTL 
        ? 'يجب أن تلتزم بجميع قواعد المنصة وأن تحافظ على بيئة عمل إيجابية وآمنة لجميع الأعضاء.'
        : 'You must comply with all platform rules and maintain a positive and safe working environment for all members.',
      met: true, // Always shown as informational
    },
  ];

  const handleBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.push('/(modals)/guilds');
    }
  }, []);

  const handleContinue = useCallback(() => {
    if (!agreed) {
      CustomAlertService.showError(
        t('error') || 'Error',
        isRTL ? 'يجب الموافقة على الشروط أولاً' : 'You must agree to the terms first'
      );
      return;
    }

    if (!hasMinimumRank) {
      CustomAlertService.showError(
        t('error') || 'Error',
        isRTL 
          ? `رتبتك الحالية ${currentRank} أقل من المطلوب ${MINIMUM_RANK}. يجب أن تصل إلى رتبة ${MINIMUM_RANK} على الأقل.`
          : `Your current rank ${currentRank} is below the required ${MINIMUM_RANK}. You must reach rank ${MINIMUM_RANK} at minimum.`
      );
      return;
    }

    if (!hasSufficientBalance) {
      CustomAlertService.showError(
        t('error') || 'Error',
        isRTL 
          ? `رصيدك الحالي ${wallet?.balance || 0} ريال قطري أقل من المطلوب ${GUILD_CREATION_COST} ريال قطري.`
          : `Your current balance ${wallet?.balance || 0} QR is below the required ${GUILD_CREATION_COST} QR.`
      );
      return;
    }

    // Navigate to create guild screen
    router.push('/(modals)/create-guild');
  }, [agreed, hasMinimumRank, hasSufficientBalance, currentRank, wallet, t, isRTL]);

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
    },
    content: { 
      flex: 1, 
      backgroundColor: isDarkMode ? '#111111' : theme.surface
    },
    scrollContent: {
      padding: 16,
    },
    titleContainer: {
      marginBottom: 24,
    },
    title: {
      color: theme.textPrimary,
      fontSize: 28,
      fontWeight: '900',
      fontFamily: FONT_FAMILY,
      marginBottom: 8,
      textAlign: isRTL ? 'right' : 'left',
    },
    subtitle: {
      color: theme.textSecondary,
      fontSize: 16,
      fontFamily: FONT_FAMILY,
      lineHeight: 24,
      textAlign: isRTL ? 'right' : 'left',
    },
    rulesContainer: {
      marginBottom: 24,
    },
    ruleCard: {
      backgroundColor: isDarkMode ? '#1b1b1b' : theme.surface,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: isDarkMode ? '#262626' : theme.border,
      marginBottom: 16,
      padding: 20,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 4,
    },
    ruleHeader: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    ruleIcon: {
      width: 48,
      height: 48,
      borderRadius: 12,
      backgroundColor: isDarkMode ? '#000000' : theme.surfaceSecondary,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: isRTL ? 0 : 12,
      marginLeft: isRTL ? 12 : 0,
      borderWidth: 1,
      borderColor: isDarkMode ? '#2a2a2a' : theme.borderLight,
    },
    ruleTitleContainer: {
      flex: 1,
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    ruleTitle: {
      color: theme.textPrimary,
      fontSize: 18,
      fontWeight: '800',
      fontFamily: FONT_FAMILY,
      flex: 1,
      textAlign: isRTL ? 'right' : 'left',
    },
    ruleStatus: {
      marginLeft: isRTL ? 0 : 8,
      marginRight: isRTL ? 8 : 0,
    },
    ruleDescription: {
      color: theme.textSecondary,
      fontSize: 14,
      fontFamily: FONT_FAMILY,
      lineHeight: 20,
      textAlign: isRTL ? 'right' : 'left',
      marginBottom: 8,
    },
    ruleValue: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      marginTop: 8,
    },
    ruleValueLabel: {
      color: theme.textSecondary,
      fontSize: 12,
      fontFamily: FONT_FAMILY,
      marginRight: isRTL ? 0 : 8,
      marginLeft: isRTL ? 8 : 0,
    },
    ruleValueText: {
      color: theme.textPrimary,
      fontSize: 14,
      fontWeight: '700',
      fontFamily: FONT_FAMILY,
    },
    agreementContainer: {
      backgroundColor: isDarkMode ? '#1b1b1b' : theme.surface,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: isDarkMode ? '#262626' : theme.border,
      padding: 20,
      marginBottom: 24,
    },
    agreementRow: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
    },
    agreementCheckbox: {
      width: 24,
      height: 24,
      borderRadius: 6,
      borderWidth: 2,
      borderColor: agreed ? theme.primary : theme.border,
      backgroundColor: agreed ? theme.primary : 'transparent',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: isRTL ? 0 : 12,
      marginLeft: isRTL ? 12 : 0,
    },
    agreementText: {
      flex: 1,
      color: theme.textPrimary,
      fontSize: 14,
      fontFamily: FONT_FAMILY,
      lineHeight: 20,
      textAlign: isRTL ? 'right' : 'left',
    },
    continueButton: {
      backgroundColor: agreed && hasMinimumRank && hasSufficientBalance 
        ? theme.primary 
        : isDarkMode ? '#2a2a2a' : '#E0E0E0',
      borderRadius: 16,
      paddingVertical: 16,
      alignItems: 'center',
      alignSelf: 'center',
      width: '40%', // 40% of original width
      marginBottom: bottom + 110, // Extra space for bottom nav bar
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 8,
      opacity: agreed && hasMinimumRank && hasSufficientBalance ? 1 : 0.6,
    },
    continueButtonText: {
      color: agreed && hasMinimumRank && hasSufficientBalance 
        ? '#000000' 
        : theme.textSecondary,
      fontSize: 18,
      fontWeight: '900',
      fontFamily: FONT_FAMILY,
    },
    bottomSpacer: {
      height: 20,
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
          {isRTL ? 'قواعد إنشاء Guild' : 'Guild Creation Rules'}
        </Text>
        
        <View style={styles.headerActionButton} />
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>
            {isRTL ? 'متطلبات إنشاء Guild' : 'Guild Creation Requirements'}
          </Text>
          <Text style={styles.subtitle}>
            {isRTL 
              ? 'قبل إنشاء Guild جديد، يرجى مراجعة المتطلبات والموافقة على الشروط أدناه.'
              : 'Before creating a new guild, please review the requirements and agree to the terms below.'}
          </Text>
        </View>

        {/* Rules */}
        <View style={styles.rulesContainer}>
          {rules.map((rule, index) => {
            const IconComponent = rule.icon;
            return (
              <View key={index} style={styles.ruleCard}>
                <View style={styles.ruleHeader}>
                  <View style={styles.ruleIcon}>
                    <IconComponent 
                      size={24} 
                      color={rule.met ? theme.primary : theme.textSecondary} 
                    />
                  </View>
                  <View style={styles.ruleTitleContainer}>
                    <Text style={styles.ruleTitle}>{rule.title}</Text>
                    <View style={styles.ruleStatus}>
                      {rule.met ? (
                        <CheckCircle size={20} color={theme.primary} />
                      ) : (
                        <XCircle size={20} color="#E74C3C" />
                      )}
                    </View>
                  </View>
                </View>
                <Text style={styles.ruleDescription}>{rule.description}</Text>
                {rule.currentValue !== undefined && rule.requiredValue !== undefined && (
                  <View style={styles.ruleValue}>
                    <Text style={styles.ruleValueLabel}>
                      {isRTL ? 'الحالي:' : 'Current:'}
                    </Text>
                    <Text style={[
                      styles.ruleValueText,
                      { color: rule.met ? theme.primary : '#E74C3C' }
                    ]}>
                      {typeof rule.currentValue === 'number' 
                        ? `${rule.currentValue} QR`
                        : rule.currentValue}
                    </Text>
                    <Text style={[styles.ruleValueLabel, { marginHorizontal: 8 }]}>•</Text>
                    <Text style={styles.ruleValueLabel}>
                      {isRTL ? 'المطلوب:' : 'Required:'}
                    </Text>
                    <Text style={styles.ruleValueText}>
                      {typeof rule.requiredValue === 'number' 
                        ? `${rule.requiredValue} QR`
                        : rule.requiredValue}
                    </Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Agreement */}
        <View style={styles.agreementContainer}>
          <TouchableOpacity
            style={styles.agreementRow}
            onPress={() => setAgreed(!agreed)}
            activeOpacity={0.7}
          >
            <View style={styles.agreementCheckbox}>
              {agreed && (
                <Ionicons name="checkmark" size={16} color="#000000" />
              )}
            </View>
            <Text style={styles.agreementText}>
              {isRTL 
                ? 'أوافق على جميع الشروط والأحكام المتعلقة بإنشاء Guild وأتحمل المسؤولية الكاملة عن إدارته.'
                : 'I agree to all terms and conditions related to guild creation and take full responsibility for managing it.'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Continue Button */}
      <TouchableOpacity 
        style={styles.continueButton}
        onPress={handleContinue}
        activeOpacity={0.8}
        disabled={!agreed || !hasMinimumRank || !hasSufficientBalance}
      >
        <Text style={styles.continueButtonText}>
          {isRTL ? 'أوافق وأستمر' : 'I Agree and Continue'}
        </Text>
        <Ionicons 
          name="arrow-forward" 
          size={20} 
          color={agreed && hasMinimumRank && hasSufficientBalance ? '#000000' : theme.textSecondary} 
        />
      </TouchableOpacity>
      
      <AppBottomNavigation currentRoute="/guild-creation-rules" />
    </View>
  );
}

