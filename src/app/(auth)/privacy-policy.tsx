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
import { useAuth } from '../../contexts/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Shield, Lock, Eye, FileText, Check } from 'lucide-react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { Animated, Easing } from 'react-native';
import * as Haptics from 'expo-haptics';
import { dataProtection } from '../../services/dataProtection';

const FONT_FAMILY = 'Signika Negative SC';

interface PrivacySection {
  id: string;
  title: string;
  content: string[];
}

export default function PrivacyPolicyScreen() {
  const { theme, isDarkMode } = useTheme();
  const { t, isRTL } = useI18n();
  const { user } = useAuth();
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

  // Privacy sections data
  const privacySections: PrivacySection[] = [
    {
      id: 'overview',
      title: t('privacy.overview.title'),
      content: [
        t('privacy.overview.content1'),
        t('privacy.overview.content2'),
        t('privacy.overview.content3'),
      ]
    },
    {
      id: 'collection',
      title: t('privacy.collection.title'),
      content: [
        t('privacy.collection.content1'),
        t('privacy.collection.content2'),
        t('privacy.collection.content3'),
        t('privacy.collection.content4'),
      ]
    },
    {
      id: 'usage',
      title: t('privacy.usage.title'),
      content: [
        t('privacy.usage.content1'),
        t('privacy.usage.content2'),
        t('privacy.usage.content3'),
        t('privacy.usage.content4'),
      ]
    },
    {
      id: 'sharing',
      title: t('privacy.sharing.title'),
      content: [
        t('privacy.sharing.content1'),
        t('privacy.sharing.content2'),
        t('privacy.sharing.content3'),
      ]
    },
    {
      id: 'storage',
      title: t('privacy.storage.title'),
      content: [
        t('privacy.storage.content1'),
        t('privacy.storage.content2'),
        t('privacy.storage.content3'),
      ]
    },
    {
      id: 'cookies',
      title: t('privacy.cookies.title'),
      content: [
        t('privacy.cookies.content1'),
        t('privacy.cookies.content2'),
        t('privacy.cookies.content3'),
      ]
    },
    {
      id: 'rights',
      title: t('privacy.rights.title'),
      content: [
        t('privacy.rights.content1'),
        t('privacy.rights.content2'),
        t('privacy.rights.content3'),
        t('privacy.rights.content4'),
      ]
    },
    {
      id: 'security',
      title: t('privacy.security.title'),
      content: [
        t('privacy.security.content1'),
        t('privacy.security.content2'),
        t('privacy.security.content3'),
      ]
    },
    {
      id: 'children',
      title: t('privacy.children.title'),
      content: [
        t('privacy.children.content1'),
        t('privacy.children.content2'),
      ]
    },
    {
      id: 'international',
      title: t('privacy.international.title'),
      content: [
        t('privacy.international.content1'),
        t('privacy.international.content2'),
      ]
    },
    {
      id: 'changes',
      title: t('privacy.changes.title'),
      content: [
        t('privacy.changes.content1'),
        t('privacy.changes.content2'),
      ]
    },
    {
      id: 'contact',
      title: t('privacy.contact.title'),
      content: [
        t('privacy.contact.content1'),
        t('privacy.contact.content2'),
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

  const handleAcceptPrivacy = async () => {
    if (!isAccepted) {
      CustomAlertService.showError(t('error'), t('privacy.mustAccept'));
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      return;
    }

    if (!user) {
      CustomAlertService.showError(t('error'), 'Please sign in to accept the privacy policy');
      return;
    }

    setIsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      // ✅ TASK 11: Actually save privacy policy acceptance to Firestore
      await dataProtection.recordConsent(
        user.uid,
        'privacy_policy',
        true,
        'explicit'
      );
      
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      CustomAlertService.showSuccess(
        t('success'),
        t('privacy.acceptanceSuccess'),
        [
          {
            text: t('continue'),
            style: 'default',
            onPress: () => router.back()
          }
        ]
      );
      
    } catch (error) {
      console.error('Privacy acceptance error:', error);
      CustomAlertService.showError(t('error'), t('privacy.acceptanceError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeclinePrivacy = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    CustomAlertService.showConfirmation(
      t('privacy.decline'),
      t('privacy.declineWarning'),
      () => router.back(),
      undefined,
      isRTL
    );
  };

  const handleContactPrivacy = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    CustomAlertService.showConfirmation(
      t('privacy.contactUs'),
      t('privacy.contactDescription'),
      () => {
        // In a real app, this would open the email client
        CustomAlertService.showInfo(t('info'), 'privacy@guild.qa');
      },
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
            <MaterialIcons name="privacy-tip" size={24} color={theme.primary} />
            <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
              {t('privacy.title')}
            </Text>
          </View>
          
          <TouchableOpacity
            style={styles.headerActionButton}
            onPress={handleContactPrivacy}
          >
            <Ionicons name="mail" size={20} color={theme.primary} />
          </TouchableOpacity>
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
            <MaterialIcons name="shield" size={32} color={theme.primary} />
          </View>
          
          <Text style={[styles.introTitle, { color: theme.textPrimary }]}>
            {t('privacy.introTitle')}
          </Text>
          
          <Text style={[styles.introDescription, { color: theme.textSecondary }]}>
            {t('privacy.introDescription')}
          </Text>
          
          <View style={[styles.lastUpdated, { backgroundColor: theme.info + '10', borderColor: theme.info + '30' }]}>
            <Ionicons name="calendar" size={16} color={theme.info} />
            <Text style={[styles.lastUpdatedText, { color: theme.info }]}>
              {t('privacy.lastUpdated', { date: 'January 15, 2024' })}
            </Text>
          </View>
        </View>

        {/* Privacy Content */}
        <ScrollView 
          style={styles.privacyContent}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
        >
          {privacySections.map((section, index) => {
            const isExpanded = expandedSections.includes(section.id);
            
            return (
              <View 
                key={section.id} 
                style={[
                  styles.privacySection, 
                  { 
                    backgroundColor: theme.surface, 
                    borderColor: theme.border,
                    marginBottom: index === privacySections.length - 1 ? 0 : 12
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

        {/* Quick Actions */}
        <View style={[styles.quickActions, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.quickActionsTitle, { color: theme.textPrimary }]}>
            {t('privacy.quickActions')}
          </Text>
          
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.info + '20', borderColor: theme.info }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                CustomAlertService.showInfo(t('info'), t('privacy.downloadInfo'));
              }}
            >
              <Ionicons name="download" size={16} color={theme.info} />
              <Text style={[styles.actionButtonText, { color: theme.info }]}>
                {t('privacy.downloadData')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.warning + '20', borderColor: theme.warning }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                CustomAlertService.showInfo(t('info'), t('privacy.deleteInfo'));
              }}
            >
              <Ionicons name="trash" size={16} color={theme.warning} />
              <Text style={[styles.actionButtonText, { color: theme.warning }]}>
                {t('privacy.deleteData')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

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
              {t('privacy.acceptanceText')}
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
              onPress={handleDeclinePrivacy}
              disabled={isLoading}
            >
              <Ionicons name="close" size={20} color={theme.error} />
              <Text style={[styles.declineButtonText, { color: theme.error }]}>
                {t('privacy.decline')}
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
              onPress={handleAcceptPrivacy}
              disabled={isLoading || !isAccepted}
            >
              {isLoading ? (
                <ActivityIndicator color={theme.buttonText} />
              ) : (
                <>
                  <Ionicons name="checkmark" size={20} color={theme.buttonText} />
                  <Text style={[styles.acceptButtonText, { color: theme.buttonText }]}>
                    {t('privacy.accept')}
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
    padding: 8,
    borderRadius: 20,
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
  privacyContent: {
    flex: 1,
    marginBottom: 16,
  },
  privacySection: {
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
  quickActions: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  quickActionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
    marginBottom: 16,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: FONT_FAMILY,
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



