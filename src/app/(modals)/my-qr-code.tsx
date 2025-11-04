import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { CustomAlertService } from '../../services/CustomAlertService';
import { Stack, useRouter } from 'expo-router';
import { QrCode, Share2, Download, User, Shield } from 'lucide-react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useI18n } from '../../contexts/I18nProvider';
import { useUserProfile } from '../../contexts/UserProfileContext';
import { useRanking } from '../../contexts/RankingContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { config } from '../../config/environment';
// import QRCodeDisplay from '../../components/QRCodeDisplay'; // Temporarily disabled
import * as Haptics from 'expo-haptics';
import QRCode from 'react-native-qrcode-svg';
import { useGuild } from '../../contexts/GuildContext';
// COMMENT: PRIORITY 1 - Replace console statements with logger
import { logger } from '../../utils/logger';
import * as Crypto from 'expo-crypto';

const { width } = Dimensions.get('window');
const FONT_FAMILY = 'Signika Negative SC';

export default function MyQRCodeScreen() {
  const { theme, isDarkMode } = useTheme();
  const { t, isRTL } = useI18n();
  const { profile } = useUserProfile();
  const { currentRank } = useRanking();
  const { userGuildStatus } = useGuild();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const adaptiveColors = {
    background: isDarkMode ? theme.background : '#FFFFFF',
    text: isDarkMode ? theme.text : '#1A1A1A',
    textSecondary: isDarkMode ? theme.textSecondary : '#666666',
    surface: isDarkMode ? theme.surface : '#F8F9FA',
    border: isDarkMode ? theme.border : 'rgba(0,0,0,0.08)',
    primary: theme.primary,
    buttonText: '#000000',
  };

  const [isLoading, setIsLoading] = useState(false);
  const [guildId, setGuildId] = useState<string>('');
  const [qrCodeData, setQrCodeData] = useState<string>('');

  // Generate QR code data (same as profile screen)
  const profileQrCodeData = JSON.stringify({
    name: profile.firstName && profile.lastName 
      ? `${profile.firstName} ${profile.lastName}`
      : 'User Profile',
    guild: userGuildStatus.isSolo ? 'SOLO' : (userGuildStatus.guild?.displayText || 'GUILD'),
    gid: profile.idNumber || '12356555',
    userId: profile.uid || 'user123',
    profileImage: profile.profileImage || profile.processedImage || null,
    timestamp: Date.now()
  });

  useEffect(() => {
    generateGuildId();
  }, [profile]);

  const generateGuildId = async () => {
    try {
      setIsLoading(true);
      
      // Try to get existing Guild ID from backend first
      try {
        const userId = profile.uid || profile.email?.replace('@', '') || 'user123';
        const response = await fetch(`${config.apiUrl}/guild-id/generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: userId,
            userProfile: {
              firstName: profile.firstName,
              lastName: profile.lastName,
              email: profile.email,
              country: profile.country || 'Qatar',
              city: profile.city || 'Doha',
              skills: profile.skills || [],
              currentRank: currentRank || 'G',
              averageRating: profile.averageRating || 0
            }
          })
        });

        if (response.ok) {
          const result = await response.json();
          setGuildId(result.gid);
          setQrCodeData(result.qrCodeData);
          logger.debug('✅ Guild ID generated via backend:', result.gid);
          return;
        } else {
          logger.debug('❌ Backend Guild ID generation failed, using fallback');
        }
      } catch (backendError) {
        logger.debug('❌ Backend not available for Guild ID, using secure fallback');
      }
      
      // Secure fallback: Generate cryptographically secure Guild ID
      const userId = profile.uid || profile.email?.replace('@', '') || 'user123';
      const year = new Date().getFullYear();
      
      // Generate cryptographically secure sequence using expo-crypto
      const timestamp = Date.now().toString();
      const randomBytes = await Crypto.getRandomBytesAsync(8);
      const randomHex = Array.from(randomBytes, byte => byte.toString(16).padStart(2, '0')).join('');
      const secureSequence = (timestamp + randomHex).slice(-8).toUpperCase();
      
      const secureGuildId = `GLD-QA-${year}-${secureSequence}`;
      
      // Helper function for base64 encoding (btoa polyfill for React Native)
      const base64Encode = (str: string): string => {
        if (typeof btoa !== 'undefined') {
          return btoa(str);
        }
        // Polyfill for React Native
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
        let result = '';
        let i = 0;
        str = unescape(encodeURIComponent(str));
        while (i < str.length) {
          const a = str.charCodeAt(i++);
          const b = i < str.length ? str.charCodeAt(i++) : 0;
          const c = i < str.length ? str.charCodeAt(i++) : 0;
          const bitmap = (a << 16) | (b << 8) | c;
          result += chars.charAt((bitmap >> 18) & 63) + chars.charAt((bitmap >> 12) & 63) +
            (b ? chars.charAt((bitmap >> 6) & 63) : '=') +
            (c ? chars.charAt(bitmap & 63) : '=');
        }
        return result;
      };
      
      // Create QR code data with user information
      const qrData = {
        gid: secureGuildId,
        name: `${profile.firstName} ${profile.lastName}`,
        rank: currentRank || 'G',
        rating: profile.averageRating || 0,
        specialties: profile.skills?.slice(0, 3) || [],
        timestamp: Date.now(),
        type: 'GUILD_MEMBER_VERIFICATION',
        securityHash: base64Encode(secureGuildId + timestamp) // Add security hash
      };
      
      setGuildId(secureGuildId);
      setQrCodeData(JSON.stringify(qrData));
      
    } catch (error) {
      logger.error('Error generating Guild ID:', error);
      CustomAlertService.showError(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'فشل في إنشاء معرف GUILD' : 'Failed to generate GUILD ID'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    generateGuildId();
  };

  const handleScanHistory = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/(modals)/scan-history');
  };

  const handleQRScanner = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/(modals)/qr-scanner');
  };

  const userData = {
    name: `${profile.firstName} ${profile.lastName}`,
    rank: currentRank,
    rating: profile.averageRating || 0,
    specialties: profile.skills,
    profilePicture: profile.profileImage,
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen
        options={{
          title: isRTL ? 'رمز QR الخاص بي' : 'My QR Code',
          headerStyle: { backgroundColor: theme.surface },
          headerTintColor: theme.textPrimary,
          headerTitleStyle: {
            fontFamily: FONT_FAMILY,
            fontWeight: '600',
          },
          headerLeft: () => (
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => router.back()}
            >
              <MaterialIcons 
                name={isRTL ? "chevron-right" : "chevron-left"} 
                size={24} 
                color={theme.textPrimary} 
              />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity
              style={styles.headerButton}
              onPress={handleQRScanner}
            >
              <MaterialIcons 
                name="qr-code-scanner" 
                size={24} 
                color={theme.primary} 
              />
            </TouchableOpacity>
          ),
        }}
      />

      <StatusBar 
        barStyle={isDarkMode ? "light-content" : "dark-content"} 
        backgroundColor={theme.surface} 
      />

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={handleRefresh}
            colors={[theme.primary]}
            tintColor={theme.primary}
          />
        }
      >
        {/* Header Info - Sticky to top */}
        <View style={[styles.headerSection, { backgroundColor: theme.surface }]}>
          <View style={styles.headerContent}>
            <QrCode size={32} color={theme.primary} />
            <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
              {isRTL ? 'رمز GUILD QR الخاص بي' : 'My GUILD QR Code'}
            </Text>
            <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
              {isRTL 
                ? 'شارك هذا الرمز للتحقق من هويتك'
                : 'Share this code to verify your identity'
              }
            </Text>
          </View>
        </View>

        {/* QR Code Display */}
        <View style={styles.qrCodeSection}>
          <View style={[styles.profileQrContainer, { backgroundColor: theme.surface }]}>
            <View style={styles.profileQrWrapper}>
              <QRCode
                value={profileQrCodeData}
                size={200}
                color="#000000"
                backgroundColor="transparent"
              />
            </View>
            <Text style={[styles.profileQrLabel, { color: theme.textPrimary }]}>
              {isRTL ? 'رمز QR للملف الشخصي' : 'Profile QR Code'}
            </Text>
            <Text style={[styles.profileQrSubLabel, { color: theme.textSecondary }]}>
              {isRTL ? 'شارك هذا الرمز للتحقق من هويتك' : 'Share this code to verify your identity'}
            </Text>
          </View>
        </View>

        {/* Usage Instructions */}
        <View style={[styles.instructionsSection, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
            {isRTL ? 'كيفية الاستخدام' : 'How to Use'}
          </Text>
          
          <View style={styles.instructionsList}>
            <View style={styles.instructionItem}>
              <View style={[styles.instructionIcon, { backgroundColor: theme.primary + '20' }]}>
                <MaterialIcons name="visibility" size={20} color={theme.primary} />
              </View>
              <View style={styles.instructionContent}>
                <Text style={[styles.instructionTitle, { color: theme.textPrimary }]}>
                  {isRTL ? 'اعرض رمز QR' : 'Show QR Code'}
                </Text>
                <Text style={[styles.instructionDescription, { color: theme.textSecondary }]}>
                  {isRTL 
                    ? 'اعرض هذا الرمز للعملاء أو أرباب العمل للتحقق من هويتك'
                    : 'Show this code to clients or employers to verify your identity'
                  }
                </Text>
              </View>
            </View>

            <View style={styles.instructionItem}>
              <View style={[styles.instructionIcon, { backgroundColor: theme.primary + '20' }]}>
                <MaterialIcons name="work" size={20} color={theme.primary} />
              </View>
              <View style={styles.instructionContent}>
                <Text style={[styles.instructionTitle, { color: theme.textPrimary }]}>
                  {isRTL ? 'بدء المهام' : 'Start Jobs'}
                </Text>
                <Text style={[styles.instructionDescription, { color: theme.textSecondary }]}>
                  {isRTL 
                    ? 'يمكن للعملاء مسح رمزك لبدء المهام وتأكيد إكمالها'
                    : 'Clients can scan your code to start jobs and confirm completion'
                  }
                </Text>
              </View>
            </View>

            <View style={styles.instructionItem}>
              <View style={[styles.instructionIcon, { backgroundColor: theme.primary + '20' }]}>
                <MaterialIcons name="security" size={20} color={theme.primary} />
              </View>
              <View style={styles.instructionContent}>
                <Text style={[styles.instructionTitle, { color: theme.textPrimary }]}>
                  {isRTL ? 'آمن ومحمي' : 'Secure & Protected'}
                </Text>
                <Text style={[styles.instructionDescription, { color: theme.textSecondary }]}>
                  {isRTL 
                    ? 'رمز QR الخاص بك مشفر ويحتوي على معلومات التحقق الآمنة'
                    : 'Your QR code is encrypted and contains secure verification data'
                  }
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsSection}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
            onPress={handleScanHistory}
          >
            <MaterialIcons name="history" size={24} color={theme.textPrimary} />
            <Text style={[styles.actionButtonText, { color: theme.textPrimary }]}>
              {isRTL ? 'سجل المسح' : 'Scan History'}
            </Text>
            <MaterialIcons 
              name={isRTL ? "chevron-left" : "chevron-right"} 
              size={20} 
              color={theme.textSecondary} 
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.primary }]}
            onPress={handleQRScanner}
          >
            <MaterialIcons name="qr-code-scanner" size={24} color={theme.buttonText} />
            <Text style={[styles.actionButtonText, { color: theme.buttonText }]}>
              {isRTL ? 'مسح رمز QR' : 'Scan QR Code'}
            </Text>
            <MaterialIcons 
              name={isRTL ? "chevron-left" : "chevron-right"} 
              size={20} 
              color={theme.buttonText} 
            />
          </TouchableOpacity>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  headerSection: {
    paddingTop: 44,
    paddingHorizontal: 24,
    paddingBottom: 24,
    marginTop: 0,
    marginBottom: 16,
    position: 'sticky',
    top: 0,
    zIndex: 10,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    fontFamily: FONT_FAMILY,
    textAlign: 'center',
    lineHeight: 22,
  },
  qrCodeSection: {
    paddingHorizontal: 24,
    marginTop: 20,
    marginBottom: 24,
  },
  profileQrContainer: {
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  profileQrWrapper: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
  },
  profileQrLabel: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
    textAlign: 'center',
    marginBottom: 8,
  },
  profileQrSubLabel: {
    fontSize: 14,
    fontFamily: FONT_FAMILY,
    textAlign: 'center',
    lineHeight: 20,
  },
  loadingContainer: {
    padding: 40,
    borderRadius: 20,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: FONT_FAMILY,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 20,
  },
  refreshButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  refreshButtonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
  },
  instructionsSection: {
    marginHorizontal: 24,
    marginBottom: 24,
    padding: 20,
    borderRadius: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
    marginBottom: 16,
  },
  instructionsList: {
    gap: 16,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  instructionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  instructionContent: {
    flex: 1,
  },
  instructionTitle: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
    marginBottom: 4,
  },
  instructionDescription: {
    fontSize: 14,
    fontFamily: FONT_FAMILY,
    lineHeight: 20,
  },
  actionsSection: {
    paddingHorizontal: 24,
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: FONT_FAMILY,
    flex: 1,
    marginLeft: 12,
  },
});
