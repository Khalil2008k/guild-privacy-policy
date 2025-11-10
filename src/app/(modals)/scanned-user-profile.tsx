import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Image,
} from 'react-native';
import { CustomAlertService } from '../../services/CustomAlertService';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { User, Shield, QrCode, Share2, MessageSquare, UserPlus, ArrowLeft } from 'lucide-react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useI18n } from '../../contexts/I18nProvider';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import * as Sharing from 'expo-sharing';
import { logger } from '../../utils/logger'; // ✅ Added for proper logging

const { width } = Dimensions.get('window');
const FONT_FAMILY = 'Signika Negative SC';

interface ScannedUserData {
  name: string;
  guild: string;
  gid: string;
  userId: string;
  profileImage?: string;
  timestamp: number;
}

export default function ScannedUserProfileScreen() {
  const { theme, isDarkMode } = useTheme();
  const { t, isRTL } = useI18n();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  
  const adaptiveColors = {
    background: isDarkMode ? theme.background : '#FFFFFF',
    text: isDarkMode ? theme.text : '#1A1A1A',
    textSecondary: isDarkMode ? theme.textSecondary : '#666666',
    surface: isDarkMode ? theme.surface : '#F8F9FA',
    border: isDarkMode ? theme.border : 'rgba(0,0,0,0.08)',
    primary: theme.primary,
    buttonText: '#000000',
  };

  const [scannedUser, setScannedUser] = useState<ScannedUserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Parse the scanned user data from params
    if (params.userData) {
      try {
        const userData = JSON.parse(params.userData as string);
        setScannedUser(userData);
        setIsLoading(false);
      } catch (error) {
        logger.error('Error parsing scanned user data:', error);
        CustomAlertService.showError(
          isRTL ? 'خطأ في البيانات' : 'Data Error',
          isRTL ? 'تعذر تحليل بيانات المستخدم' : 'Could not parse user data',
          [{ text: isRTL ? 'إغلاق' : 'Close', onPress: () => router.back() }]
        );
      }
    } else {
      setIsLoading(false);
    }
  }, [params.userData]);

  const handleContact = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (scannedUser) {
      // Navigate to chat screen with the scanned user
      router.push({
        pathname: '/(modals)/chat/[jobId]',
        params: {
          jobId: `user-${scannedUser.userId}`,
          userId: scannedUser.userId,
          userName: scannedUser.name,
          userGuild: scannedUser.guild
        }
      });
    }
  };

  const handleAddToContacts = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (scannedUser) {
      // Navigate to contacts screen or add directly
      router.push({
        pathname: '/(modals)/contacts',
        params: {
          action: 'add',
          userId: scannedUser.userId,
          userName: scannedUser.name,
          userGuild: scannedUser.guild,
          userGid: scannedUser.gid,
          profileImage: scannedUser.profileImage || ''
        }
      });
    }
  };

  const handleViewProfile = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (scannedUser) {
      // Navigate to full profile view
      router.push({
        pathname: '/(modals)/user-profile',
        params: {
          userId: scannedUser.userId,
          userName: scannedUser.name,
          userGuild: scannedUser.guild,
          userGid: scannedUser.gid,
          isScannedUser: 'true'
        }
      });
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const handleShareProfile = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (scannedUser) {
      try {
        const shareData = {
          message: `${isRTL ? 'ملف المستخدم' : 'User Profile'}: ${scannedUser.name}\n${isRTL ? 'النقابة' : 'Guild'}: ${scannedUser.guild}\n${isRTL ? 'معرف GUILD' : 'GUILD ID'}: ${scannedUser.gid}`,
          title: `${isRTL ? 'مشاركة الملف الشخصي' : 'Share User Profile'}`
        };
        
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(shareData.message, {
            mimeType: 'text/plain',
            dialogTitle: shareData.title
          });
        } else {
          CustomAlertService.showSuccess(
            isRTL ? 'مشاركة' : 'Share',
            shareData.message
          );
        }
      } catch (error) {
        logger.error('Error sharing profile:', error);
        CustomAlertService.showError(
          isRTL ? 'خطأ' : 'Error',
          isRTL ? 'تعذر مشاركة الملف الشخصي' : 'Could not share profile'
        );
      }
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: theme.textPrimary }]}>
            {isRTL ? 'جاري تحميل البيانات...' : 'Loading user data...'}
          </Text>
        </View>
      </View>
    );
  }

  if (!scannedUser) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={64} color={theme.textSecondary} />
          <Text style={[styles.errorTitle, { color: theme.textPrimary }]}>
            {isRTL ? 'خطأ في البيانات' : 'Data Error'}
          </Text>
          <Text style={[styles.errorDescription, { color: theme.textSecondary }]}>
            {isRTL ? 'لم يتم العثور على بيانات المستخدم' : 'No user data found'}
          </Text>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: theme.primary }]}
            onPress={() => router.back()}
          >
            <Text style={[styles.backButtonText, { color: theme.buttonText }]}>
              {isRTL ? 'العودة' : 'Go Back'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 20, backgroundColor: theme.background }]}>
        <TouchableOpacity
          style={styles.backButtonHeader}
          onPress={() => router.back()}
        >
          <MaterialIcons name="arrow-back" size={24} color={theme.textPrimary} />
        </TouchableOpacity>
        
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
          {isRTL ? 'ملف المستخدم' : 'User Profile'}
        </Text>
        
        <TouchableOpacity
          style={styles.shareButtonHeader}
          onPress={handleShareProfile}
        >
          <MaterialIcons name="share" size={24} color={theme.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* User Info Card */}
        <LinearGradient
          colors={['#BCFF31', '#A8E62E']}
          style={styles.userCard}
        >
          <View style={styles.userAvatarContainer}>
            {scannedUser.profileImage && 
             scannedUser.profileImage !== 'No image' && 
             scannedUser.profileImage.trim() !== '' && 
             (scannedUser.profileImage.startsWith('http://') || 
              scannedUser.profileImage.startsWith('https://') || 
              scannedUser.profileImage.startsWith('file://')) ? (
              <Image 
                source={{ uri: scannedUser.profileImage }} 
                style={styles.userAvatarImage}
                onError={(error) => {
                  logger.warn('Image load error:', error);
                }}
              />
            ) : (
              <View style={styles.userAvatar}>
                <MaterialIcons name="person" size={40} color="#000000" />
              </View>
            )}
            <View style={styles.verificationBadge}>
              <MaterialIcons name="verified" size={16} color="#000000" />
            </View>
          </View>
          
          <Text style={styles.userName}>
            {scannedUser.name}
          </Text>
          
          <View style={styles.guildContainer}>
            <MaterialIcons name="group" size={16} color="#000000" />
            <Text style={styles.userGuild}>
              {scannedUser.guild}
            </Text>
          </View>
          
          <View style={styles.gidContainer}>
            <Text style={styles.gidLabel}>
              {isRTL ? 'معرف GUILD' : 'GUILD ID'}
            </Text>
            <Text style={styles.gidValue}>
              {scannedUser.gid}
            </Text>
          </View>
          
          <View style={styles.statusContainer}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>
              {isRTL ? 'متصل الآن' : 'Online Now'}
            </Text>
          </View>
        </LinearGradient>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <LinearGradient
            colors={['#BCFF31', '#A8E62E']}
            style={styles.actionButton}
          >
            <TouchableOpacity
              style={styles.actionButtonContent}
              onPress={handleContact}
            >
              <MaterialIcons name="message" size={24} color="#000000" />
              <Text style={styles.actionButtonText}>
                {isRTL ? 'إرسال رسالة' : 'Send Message'}
              </Text>
            </TouchableOpacity>
          </LinearGradient>
          
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.surface, borderColor: '#BCFF31', borderWidth: 2 }]}
            onPress={handleAddToContacts}
          >
            <MaterialIcons name="person-add" size={24} color="#BCFF31" />
            <Text style={[styles.actionButtonText, { color: '#BCFF31' }]}>
              {isRTL ? 'إضافة إلى جهات الاتصال' : 'Add to Contacts'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.surface, borderColor: '#BCFF31', borderWidth: 2 }]}
            onPress={handleViewProfile}
          >
            <MaterialIcons name="visibility" size={24} color="#BCFF31" />
            <Text style={[styles.actionButtonText, { color: '#BCFF31' }]}>
              {isRTL ? 'عرض الملف الشخصي' : 'View Profile'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Scan Info */}
        <LinearGradient
          colors={['#BCFF31', '#A8E62E']}
          style={styles.scanInfoCard}
        >
          <Text style={styles.scanInfoTitle}>
            {isRTL ? 'معلومات المسح' : 'Scan Information'}
          </Text>
          
          <View style={styles.scanInfoRow}>
            <View style={styles.scanInfoIconContainer}>
              <MaterialIcons name="qr-code-scanner" size={20} color="#000000" />
            </View>
            <Text style={styles.scanInfoLabel}>
              {isRTL ? 'وقت المسح' : 'Scan Time'}
            </Text>
            <Text style={styles.scanInfoValue}>
              {formatTimestamp(scannedUser.timestamp)}
            </Text>
          </View>
          
          <View style={styles.scanInfoRow}>
            <View style={styles.scanInfoIconContainer}>
              <MaterialIcons name="security" size={20} color="#000000" />
            </View>
            <Text style={styles.scanInfoLabel}>
              {isRTL ? 'حالة التحقق' : 'Verification Status'}
            </Text>
            <View style={styles.verifiedBadge}>
              <MaterialIcons name="verified" size={16} color="#000000" />
              <Text style={styles.verifiedText}>
                {isRTL ? 'متحقق' : 'Verified'}
              </Text>
            </View>
          </View>
        </LinearGradient>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: FONT_FAMILY,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 12,
  },
  errorDescription: {
    fontSize: 16,
    fontFamily: FONT_FAMILY,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  backButton: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButtonHeader: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
    textAlign: 'center',
    marginHorizontal: 20,
  },
  shareButtonHeader: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  userCard: {
    marginTop: 20,
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  userAvatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  userAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0,0,0,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  verificationBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#000000',
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
    color: '#000000',
    textAlign: 'center',
    marginBottom: 8,
  },
  guildContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 8,
  },
  userGuild: {
    fontSize: 16,
    fontFamily: FONT_FAMILY,
    color: '#000000',
    opacity: 0.8,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#000000',
  },
  statusText: {
    fontSize: 12,
    fontFamily: FONT_FAMILY,
    color: '#000000',
    opacity: 0.7,
  },
  gidContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.1)',
    alignItems: 'center',
  },
  gidLabel: {
    fontSize: 12,
    fontFamily: FONT_FAMILY,
    color: '#000000',
    marginBottom: 4,
    opacity: 0.7,
  },
  gidValue: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
    color: '#000000',
  },
  actionsContainer: {
    marginTop: 24,
    gap: 12,
  },
  actionButton: {
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 12,
  },
  actionButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
    color: '#000000',
  },
  scanInfoCard: {
    marginTop: 24,
    marginBottom: 40,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  scanInfoTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
    color: '#000000',
    marginBottom: 16,
  },
  scanInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  scanInfoIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanInfoLabel: {
    flex: 1,
    fontSize: 14,
    fontFamily: FONT_FAMILY,
    color: '#000000',
    opacity: 0.8,
  },
  scanInfoValue: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: FONT_FAMILY,
    color: '#000000',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  verifiedText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
    color: '#000000',
  },
});
