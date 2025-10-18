import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { CustomAlertService } from '../../services/CustomAlertService';
import { useTheme } from '../../contexts/ThemeContext';
import { useI18n } from '../../contexts/I18nProvider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, FileText, Check, X, Shield, AlertCircle } from 'lucide-react-native';
import { Animated, Easing } from 'react-native';
import * as Haptics from 'expo-haptics';

const FONT_FAMILY = 'Signika Negative SC';

interface TermsSection {
  id: string;
  title: string;
  content: string[];
}

export default function TermsConditionsScreen() {
  const { theme, isDarkMode } = useTheme();
  const { t, isRTL } = useI18n();
  const insets = useSafeAreaInsets();
  const adaptiveColors = {
    background: isDarkMode ? theme.background : '#FFFFFF',
    text: isDarkMode ? theme.text : '#1A1A1A',
    textSecondary: isDarkMode ? theme.textSecondary : '#666666',
    primary: theme.primary,
    buttonText: '#000000',
  };

  const [isAccepted, setIsAccepted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedSections, setExpandedSections] = useState<string[]>([]);

  // Animation values
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(30))[0];

  // Entrance animation
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Terms sections data
  const termsSections: TermsSection[] = [
    {
      id: 'acceptance',
      title: t('terms.acceptance.title'),
      content: [
        t('terms.acceptance.content1'),
        t('terms.acceptance.content2'),
        t('terms.acceptance.content3'),
      ]
    },
    {
      id: 'services',
      title: t('terms.services.title'),
      content: [
        t('terms.services.content1'),
        t('terms.services.content2'),
        t('terms.services.content3'),
        t('terms.services.content4'),
      ]
    },
    {
      id: 'userAccounts',
      title: t('terms.userAccounts.title'),
      content: [
        t('terms.userAccounts.content1'),
        t('terms.userAccounts.content2'),
        t('terms.userAccounts.content3'),
      ]
    },
    {
      id: 'payments',
      title: t('terms.payments.title'),
      content: [
        t('terms.payments.content1'),
        t('terms.payments.content2'),
        t('terms.payments.content3'),
        t('terms.payments.content4'),
      ]
    },
    {
      id: 'guilds',
      title: t('terms.guilds.title'),
      content: [
        t('terms.guilds.content1'),
        t('terms.guilds.content2'),
        t('terms.guilds.content3'),
      ]
    },
    {
      id: 'conduct',
      title: t('terms.conduct.title'),
      content: [
        t('terms.conduct.content1'),
        t('terms.conduct.content2'),
        t('terms.conduct.content3'),
        t('terms.conduct.content4'),
      ]
    },
    {
      id: 'intellectual',
      title: t('terms.intellectual.title'),
      content: [
        t('terms.intellectual.content1'),
        t('terms.intellectual.content2'),
        t('terms.intellectual.content3'),
      ]
    },
    {
      id: 'privacy',
      title: t('terms.privacy.title'),
      content: [
        t('terms.privacy.content1'),
        t('terms.privacy.content2'),
      ]
    },
    {
      id: 'termination',
      title: t('terms.termination.title'),
      content: [
        t('terms.termination.content1'),
        t('terms.termination.content2'),
        t('terms.termination.content3'),
      ]
    },
    {
      id: 'liability',
      title: t('terms.liability.title'),
      content: [
        t('terms.liability.content1'),
        t('terms.liability.content2'),
      ]
    },
    {
      id: 'changes',
      title: t('terms.changes.title'),
      content: [
        t('terms.changes.content1'),
        t('terms.changes.content2'),
      ]
    },
    {
      id: 'contact',
      title: t('terms.contact.title'),
      content: [
        t('terms.contact.content1'),
        t('terms.contact.content2'),
      ]
    }
  ];

  const toggleSection = (sectionId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpandedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const handleAcceptTerms = async () => {
    if (!isAccepted) {
      CustomAlertService.showError(t('error'), t('terms.mustAccept'));
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      return;
    }

    setIsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      // Simulate API call to save acceptance
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      CustomAlertService.showSuccess(
        t('success'),
        t('terms.acceptanceSuccess'),
        [
          {
            text: t('continue'),
            style: 'default',
            onPress: () => router.back()
          }
        ]
      );
      
    } catch (error) {
      CustomAlertService.showError(t('error'), t('terms.acceptanceError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeclineTerms = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    CustomAlertService.showConfirmation(
      t('terms.decline'),
      t('terms.declineWarning'),
      () => router.back(),
      undefined,
      isRTL
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.background, paddingTop: insets.top + 10 }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.back();
            }}
            disabled={isLoading}
          >
            <Ionicons 
              name={isRTL ? "arrow-forward" : "arrow-back"} 
              size={24} 
              color={theme.primary} 
            />
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <MaterialIcons name="gavel" size={24} color={theme.primary} />
            <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
              {t('terms.title')}
            </Text>
          </View>
          
          <View style={styles.headerActionButton} />
        </View>
      </View>

      <Animated.View 
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        {/* Introduction */}
        <View style={[styles.introSection, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={[styles.introIcon, { backgroundColor: theme.primary + '20' }]}>
            <MaterialIcons name="description" size={32} color={theme.primary} />
          </View>
          
          <Text style={[styles.introTitle, { color: theme.textPrimary }]}>
            {t('terms.introTitle')}
          </Text>
          
          <Text style={[styles.introDescription, { color: theme.textSecondary }]}>
            {t('terms.introDescription')}
          </Text>
          
          <View style={[styles.lastUpdated, { backgroundColor: theme.info + '10', borderColor: theme.info + '30' }]}>
            <Ionicons name="calendar" size={16} color={theme.info} />
            <Text style={[styles.lastUpdatedText, { color: theme.info }]}>
              {t('terms.lastUpdated', { date: 'January 15, 2024' })}
            </Text>
          </View>
        </View>

        {/* Terms Content */}
        <ScrollView 
          style={styles.termsContent}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
        >
          {termsSections.map((section, index) => {
            const isExpanded = expandedSections.includes(section.id);
            
            return (
              <View 
                key={section.id} 
                style={[
                  styles.termsSection, 
                  { 
                    backgroundColor: theme.surface, 
                    borderColor: theme.border,
                    marginBottom: index === termsSections.length - 1 ? 0 : 12
                  }
                ]}
              >
                <TouchableOpacity
                  style={styles.sectionHeader}
                  onPress={() => toggleSection(section.id)}
                >
                  <View style={styles.sectionHeaderLeft}>
                    <View style={[styles.sectionNumber, { backgroundColor: theme.primary }]}>
                      <Text style={[styles.sectionNumberText, { color: theme.buttonText }]}>
                        {index + 1}
                      </Text>
                    </View>
                    <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
                      {section.title}
                    </Text>
                  </View>
                  
                  <Ionicons 
                    name={isExpanded ? "chevron-up" : "chevron-down"} 
                    size={20} 
                    color={theme.textSecondary} 
                  />
                </TouchableOpacity>

                {isExpanded && (
                  <View style={styles.sectionContent}>
                    {section.content.map((paragraph, pIndex) => (
                      <Text 
                        key={pIndex}
                        style={[
                          styles.sectionParagraph, 
                          { 
                            color: theme.textSecondary,
                            textAlign: isRTL ? 'right' : 'left'
                          }
                        ]}
                      >
                        {paragraph}
                      </Text>
                    ))}
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>

        {/* Acceptance Section */}
        <View style={[styles.acceptanceSection, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <TouchableOpacity
            style={[styles.checkboxContainer, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setIsAccepted(!isAccepted);
            }}
            disabled={isLoading}
          >
            <View style={[
              styles.checkbox,
              { 
                borderColor: isAccepted ? theme.primary : theme.border,
                backgroundColor: isAccepted ? theme.primary : 'transparent'
              }
            ]}>
              {isAccepted && (
                <Ionicons name="checkmark" size={16} color={theme.buttonText} />
              )}
            </View>
            
            <Text style={[
              styles.checkboxText, 
              { 
                color: theme.textPrimary,
                textAlign: isRTL ? 'right' : 'left',
                marginLeft: isRTL ? 0 : 12,
                marginRight: isRTL ? 12 : 0,
              }
            ]}>
              {t('terms.acceptanceText')}
            </Text>
          </TouchableOpacity>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[
                styles.declineButton,
                { 
                  backgroundColor: theme.error + '20',
                  borderColor: theme.error
                }
              ]}
              onPress={handleDeclineTerms}
              disabled={isLoading}
            >
              <Ionicons name="close" size={20} color={theme.error} />
              <Text style={[styles.declineButtonText, { color: theme.error }]}>
                {t('terms.decline')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.acceptButton,
                { 
                  backgroundColor: theme.primary,
                  opacity: (isLoading || !isAccepted) ? 0.7 : 1
                }
              ]}
              onPress={handleAcceptTerms}
              disabled={isLoading || !isAccepted}
            >
              {isLoading ? (
                <ActivityIndicator color={theme.buttonText} />
              ) : (
                <>
                  <Ionicons name="checkmark" size={20} color={theme.buttonText} />
                  <Text style={[styles.acceptButtonText, { color: theme.buttonText }]}>
                    {t('terms.accept')}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
  },
  headerActionButton: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  introSection: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 16,
  },
  introIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  introTitle: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
    textAlign: 'center',
    marginBottom: 8,
  },
  introDescription: {
    fontSize: 16,
    fontFamily: FONT_FAMILY,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 16,
  },
  lastUpdated: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    gap: 6,
  },
  lastUpdatedText: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: FONT_FAMILY,
  },
  termsContent: {
    flex: 1,
    marginBottom: 16,
  },
  termsSection: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  sectionNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionNumberText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
    flex: 1,
  },
  sectionContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  sectionParagraph: {
    fontSize: 14,
    fontFamily: FONT_FAMILY,
    lineHeight: 22,
    marginBottom: 12,
  },
  acceptanceSection: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
  },
  checkboxContainer: {
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxText: {
    flex: 1,
    fontSize: 16,
    fontFamily: FONT_FAMILY,
    lineHeight: 24,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  declineButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  declineButtonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
  },
  acceptButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  acceptButtonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
  },
});



