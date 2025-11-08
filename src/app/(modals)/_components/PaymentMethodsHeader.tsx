/**
 * PaymentMethodsHeader Component
 * 
 * COMMENT: PRIORITY 1 - File Modularization
 * Extracted from payment-methods.tsx
 * Purpose: Renders the header with back button, title, add button, and profile picture section
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  ArrowLeft,
  ArrowRight,
  CreditCard,
  Plus,
  Camera,
  User,
} from 'lucide-react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { useI18n } from '../../../contexts/I18nProvider';
import { useResponsive } from '../../../utils/responsive';
import OptimizedImage from '../../../components/OptimizedImage';

interface PaymentMethodsHeaderProps {
  onAddPress: () => void;
  onProfilePicturePress: () => void;
  profilePicture: string | null;
  isU2NetLoaded: boolean;
}

export const PaymentMethodsHeader: React.FC<PaymentMethodsHeaderProps> = ({
  onAddPress,
  onProfilePicturePress,
  profilePicture,
  isU2NetLoaded,
}) => {
  const { theme } = useTheme();
  const { t, isRTL } = useI18n();
  const insets = useSafeAreaInsets();
  const { isTablet } = useResponsive();

  return (
    <View
      style={[
        styles.header,
        {
          backgroundColor: theme.background,
          paddingTop: insets.top + 10,
          borderBottomColor: theme.border,
          paddingHorizontal: isTablet ? 24 : 16,
        },
      ]}
    >
      <View style={[styles.headerRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.back();
          }}
        >
          {isRTL ? <ArrowRight size={24} color={theme.primary} /> : <ArrowLeft size={24} color={theme.primary} />}
        </TouchableOpacity>

        <View style={[styles.headerCenter, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <CreditCard size={24} color={theme.primary} />
          <Text style={[styles.headerTitle, { color: theme.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>
            {t('paymentMethods')}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.headerActionButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onAddPress();
          }}
        >
          <Plus size={24} color={theme.primary} />
        </TouchableOpacity>
      </View>

      {/* Profile Picture Section */}
      <View
        style={[
          styles.profileSection,
          {
            flexDirection: isRTL ? 'row-reverse' : 'row',
            paddingHorizontal: isTablet ? 24 : 16,
          },
        ]}
      >
        <TouchableOpacity
          style={[styles.profilePictureContainer, { borderColor: theme.border }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onProfilePicturePress();
          }}
        >
          {profilePicture ? (
            <OptimizedImage
              source={{ uri: profilePicture }}
              style={styles.profilePicture}
              compression={{ maxWidth: 200, maxHeight: 200, quality: 0.8 }}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.profilePlaceholder, { backgroundColor: theme.primary + '20' }]}>
              <User size={32} color={theme.primary} />
            </View>
          )}
          <View style={[styles.cameraIcon, { backgroundColor: theme.primary }]}>
            <Camera size={16} color={theme.buttonText} />
          </View>
        </TouchableOpacity>

        <View style={styles.profileInfo}>
          <Text style={[styles.profileTitle, { color: theme.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>
            {t('profilePicture')}
          </Text>
          <Text style={[styles.profileSubtitle, { color: theme.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>
            {isU2NetLoaded ? t('aiBackgroundRemoval') : t('loadingAI')}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
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
    fontFamily: 'Signika Negative SC',
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
  },
  headerActionButton: {
    padding: 8,
    borderRadius: 20,
    width: 40,
  },
  profileSection: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    alignItems: 'center',
    gap: 16,
  },
  profilePictureContainer: {
    position: 'relative',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profilePicture: {
    width: 74,
    height: 74,
    borderRadius: 37,
  },
  profilePlaceholder: {
    width: 74,
    height: 74,
    borderRadius: 37,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraIcon: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  profileInfo: {
    alignItems: 'flex-start',
  },
  profileTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Signika Negative SC',
    marginBottom: 4,
  },
  profileSubtitle: {
    fontSize: 14,
    fontFamily: 'Signika Negative SC',
  },
});








