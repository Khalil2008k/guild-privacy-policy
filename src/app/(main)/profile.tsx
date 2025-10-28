import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  StatusBar,
  Image,
  TextInput,
  Modal,
  Animated,
} from 'react-native';
import { CustomAlertService } from '../../services/CustomAlertService';
import { BackendAPI } from '../../config/backend';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../contexts/ThemeContext';
import { useUserProfile } from '../../contexts/UserProfileContext';
import { useRanking } from '../../contexts/RankingContext';
import { useGuild } from '../../contexts/GuildContext';
import { useAuth } from '../../contexts/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { walletAPIClient } from '../../services/walletAPIClient';
import { router } from 'expo-router';
import { Shield } from 'lucide-react-native';
import { QrCode, CheckCircle, Grid, User, MessageCircle, Briefcase, Phone, IdCard, MapPin, ChevronLeft, ChevronRight, Check, Edit, Wallet, Users, FileText, File, Settings, Bell, BarChart3, Trophy, HelpCircle, LogOut, XCircle, Eye, EyeOff, X } from 'lucide-react-native';
import { MaterialIcons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { useI18n } from '../../contexts/I18nProvider';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useRealPayment } from '../../contexts/RealPaymentContext';

const { width, height } = Dimensions.get('window');

// Advanced Light Mode Color Helper - Tailored for Profile Screen
const getAdaptiveColors = (theme: any, isDark: boolean) => ({
  // Backgrounds
  contentBackground: isDark ? theme.background : '#F5F5F5',
  cardBackground: isDark ? theme.surface : '#FFFFFF',
  cardBorder: isDark ? theme.border : 'rgba(0, 0, 0, 0.08)',
  
  // Text - NEVER theme color in light mode
  primaryText: isDark ? theme.textPrimary : '#000000',
  secondaryText: isDark ? theme.textSecondary : '#666666',
  
  // Menu items
  menuItemBackground: isDark ? theme.surface : '#FFFFFF',
  menuItemBorder: isDark ? 'transparent' : 'rgba(0, 0, 0, 0.06)',
  menuIconColor: isDark ? theme.primary : '#000000',
  menuTextColor: isDark ? theme.textPrimary : '#000000',
  menuChevronColor: isDark ? theme.textSecondary : '#666666',
  
  // Stats cards
  statCardBackground: isDark ? theme.surface : '#FFFFFF',
  statCardBorder: isDark ? theme.border : 'rgba(0, 0, 0, 0.08)',
  
  // Shadows
  cardShadow: isDark 
    ? { shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8 }
    : { shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 12 },
});

// Function to map Ionicons to Lucide icons
const getLucideIcon = (iconName: string, color: string) => {
  const iconMap: { [key: string]: any } = {
    'qr-code': QrCode,
    'wallet-outline': Wallet,
    'people-outline': Users,
    'briefcase-outline': Briefcase,
    'document-text-outline': FileText,
    'document-outline': File,
    'settings-outline': Settings,
    'notifications-outline': Bell,
    'analytics-outline': BarChart3,
    'trophy-outline': Trophy,
    'help-circle-outline': HelpCircle,
    'log-out-outline': LogOut,
  };
  
  const IconComponent = iconMap[iconName];
  return IconComponent ? <IconComponent size={20} color={color} /> : <User size={20} color={color} />;
};
const FONT_FAMILY = 'Signika Negative SC';

export default function ProfileScreen() {
  const { theme, isDarkMode } = useTheme();
  const { t, isRTL } = useI18n();
  const { profile, updateProfile } = useUserProfile();
  const { currentRank, rankBenefits, nextRankProgress, userStats } = useRanking();
  const { user, signOut } = useAuth();
  const { userGuildStatus } = useGuild();
  const insets = useSafeAreaInsets();

  const handleSignOut = async () => {
    CustomAlertService.showConfirmation(
      isRTL ? 'تسجيل الخروج' : 'Sign Out',
      isRTL ? 'هل أنت متأكد من تسجيل الخروج؟' : 'Are you sure you want to sign out?',
      async () => {
        try {
          await signOut();
        } catch (error) {
          CustomAlertService.showError(
            isRTL ? 'خطأ' : 'Error',
            isRTL ? 'فشل تسجيل الخروج' : 'Failed to sign out'
          );
        }
      },
      undefined,
      isRTL
    );
  };

  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    firstName: profile.firstName,
    lastName: profile.lastName,
    bio: profile.bio,
    phoneNumber: profile.phoneNumber,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const { wallet: fakeWallet, isLoading: fakeWalletLoading } = useRealPayment();
  const [showBalance, setShowBalance] = useState(true);

  // Adaptive colors for light mode
  const adaptiveColors = React.useMemo(() => getAdaptiveColors(theme, isDarkMode), [theme, isDarkMode]);

  // Generate QR code data
  const qrCodeData = JSON.stringify({
    name: profile.firstName && profile.lastName 
      ? `${profile.firstName} ${profile.lastName}`
      : 'User Profile',
    guild: userGuildStatus.isSolo ? 'SOLO' : (userGuildStatus.guild?.displayText || 'GUILD'),
    gid: profile.idNumber || '12356555',
    userId: user?.uid || 'unknown',
    timestamp: new Date().toISOString()
  });
  
  // 🧪 PREMIUM TEST: Animation values
  const glowAnimation = useRef(new Animated.Value(0)).current;
  const scaleAnimation = useRef(new Animated.Value(1)).current;
  
  // 🧪 PREMIUM TEST: Start animations on mount
  useEffect(() => {
    console.log('🎮 Starting premium animations...');
    
    // Animated neon glow effect - MORE VISIBLE
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnimation, {
          toValue: 1,
          duration: 1000, // Faster for testing
          useNativeDriver: false,
        }),
        Animated.timing(glowAnimation, {
          toValue: 0,
          duration: 1000, // Faster for testing
          useNativeDriver: false,
        }),
      ])
    ).start();
    
    // Rank animation removed - keeping it still as requested
    
    // Crown animation removed - keeping it static as requested
    
    console.log('✨ Premium animations started!');
  }, []);

  // Fetch wallet balance - COMMENTED OUT FOR FAKE PAYMENT SYSTEM
  // useEffect(() => {
  //   const fetchWalletBalance = async () => {
  //     try {
  //       const balance = await walletAPIClient.getBalance();
  //       setWalletBalance(balance);
  //     } catch (error) {
  //       console.log('Error fetching wallet balance:', error);
  //       setWalletBalance(0);
  //     }
  //   };

  //   if (user) {
  //     fetchWalletBalance();
  //   }
  // }, [user]);
  
  // 🧪 PREMIUM TEST: Haptic feedback function
  const handlePremiumPress = (callback: () => void) => {
    console.log('🎮 Premium button pressed!');
    
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      console.log('✨ Haptic feedback triggered!');
    } catch (error) {
      console.log('❌ Haptic error:', error);
    }
    
    Animated.sequence([
      Animated.timing(scaleAnimation, {
        toValue: 0.9, // More dramatic for testing
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnimation, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
    
    callback();
  };

  // Update edit data when profile changes
  React.useEffect(() => {
    setEditData({
      firstName: profile.firstName,
      lastName: profile.lastName,
      bio: profile.bio,
      phoneNumber: profile.phoneNumber,
    });
  }, [profile]);

  // Handle profile image change
  const handleImageChange = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        CustomAlertService.showError(t('permissionRequired'), t('cameraPermissionRequired'));
        return;
      }

      CustomAlertService.showConfirmation(
        t('changeProfilePhoto'),
        t('selectPhotoSource'),
        () => takePhoto(),
        undefined,
        isRTL
      );
    } catch (error) {
      console.error('📷 Error requesting camera permission:', error);
    }
  };

  const takePhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setIsLoading(true);
        
        // Process image with AI
        const aiResult = await processImageWithAI(result.assets[0].uri);
        
        if (!aiResult.success) {
          // AI processing failed, ask user if they want to use original
          CustomAlertService.showConfirmation(
            isRTL ? 'معالجة الصورة فشلت' : 'Image Processing Failed',
            isRTL 
              ? `فشل في معالجة الصورة: ${aiResult.error}. هل تريد استخدام الصورة الأصلية؟`
              : `Image processing failed: ${aiResult.error}. Do you want to use the original image?`,
            async () => {
              await updateProfile({ 
                profileImage: result.assets[0].uri,
                faceDetected: false,
                aiProcessed: false
              });
              console.log('📷 Profile image updated (original)');
            },
            () => {
              // User chose not to use original, try again
              takePhoto();
            },
            isRTL
          );
          return;
        }

        // AI processing successful
        await updateProfile({ 
          profileImage: aiResult.processedImageUri || result.assets[0].uri,
          faceDetected: true,
          aiProcessed: true
        });
        
        console.log('🤖 Profile image processed with AI successfully');
        CustomAlertService.showSuccess(
          isRTL ? 'تم معالجة الصورة!' : 'Image Processed!',
          isRTL 
            ? 'تم تحسين صورتك الشخصية وإزالة الخلفية بنجاح'
            : 'Your profile picture has been enhanced and background removed successfully'
        );
      }
    } catch (error) {
      console.error('📷 Error taking photo:', error);
      CustomAlertService.showError(t('error'), t('failedToTakePhoto'));
      setIsLoading(false);
    }
  };

  // Real AI face detection and background removal
  const processImageWithAI = async (imageUri: string): Promise<{ success: boolean; processedImageUri?: string; error?: string }> => {
    try {
      setIsLoading(true);
      
      // Convert URI to File object for React Native
      const response = await fetch(imageUri);
      const blob = await response.blob();
      
      // Create a File-like object for React Native
      const file = {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'profile-image.jpg',
        data: blob
      };
      
      // Create FormData for API call
      const formData = new FormData();
      formData.append('image', blob, 'profile-image.jpg');
      formData.append('qualityThreshold', '0.7');
      formData.append('backgroundRemovalMethod', 'grabcut');
      formData.append('enableFallback', 'true');
      formData.append('enableCaching', 'true');
      
      // Call AI service via BackendAPI
      const aiResponse = await BackendAPI.post('/profile-picture-ai/process', formData);
      
      if (!aiResponse.success) {
        throw new Error(`AI service failed: ${aiResponse.error}`);
      }
      
      const aiResult = aiResponse;
      
      if (aiResult.success && aiResult.result) {
        // AI processing successful
        return {
          success: true,
          processedImageUri: aiResult.result.processedImageUrl,
        };
      } else {
        // AI processing failed, use original image
        return {
          success: false,
          error: aiResult.error || 'AI processing failed',
        };
      }
      
    } catch (error) {
      console.error('🤖 AI processing error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    } finally {
      setIsLoading(false);
    }
  };

  // Handle save changes
  const handleSave = async () => {
    try {
      setIsLoading(true);
      
      if (!editData.firstName.trim() || !editData.lastName.trim()) {
        CustomAlertService.showError(t('error'), t('pleaseEnterFullName'));
        setIsLoading(false);
        return;
      }

      await updateProfile(editData);
      setIsEditing(false);
      
      console.log('👤 Profile updated successfully:', editData);
      CustomAlertService.showSuccess(t('success'), t('profileUpdatedSuccessfully'));
      
    } catch (error) {
      console.error('👤 Error updating profile:', error);
      CustomAlertService.showError(t('error'), t('failedToUpdateProfile'));
    } finally {
      setIsLoading(false);
    }
  };

  // Handle cancel edit
  const handleCancel = () => {
    setEditData({
      firstName: profile.firstName,
      lastName: profile.lastName,
      bio: profile.bio,
      phoneNumber: profile.phoneNumber,
    });
    setIsEditing(false);
  };

  const menuItems = [
    // Re-enabled QR code with modern 2025 fixes
    {
      id: 'my-qr-code',
      title: isRTL ? 'رمز QR الخاص بي' : 'My QR Code',
      icon: 'qr-code',
      action: () => router.push('/(modals)/my-qr-code'),
    },
    {
      id: 'wallet',
      title: t('wallet'),
      icon: 'wallet-outline',
      action: () => router.push('/(modals)/wallet'),
    },
    {
      id: 'guild',
      title: isRTL ? 'نقابتي' : 'My Guild',
      icon: 'people-outline',
      action: () => {
        if (userGuildStatus.isSolo) {
          router.push('/(modals)/guilds');
        } else {
          // Navigate to appropriate guild management screen based on role
          const role = userGuildStatus.guild?.role;
          if (role === 'Guild Master') {
            router.push('/(modals)/guild-master');
          } else if (role === 'Vice Master') {
            router.push('/(modals)/guild-vice-master');
          } else {
            router.push('/(modals)/guild-member');
          }
        }
      },
    },
    {
      id: 'jobs',
      title: t('myJobs'),
      icon: 'briefcase-outline',
      action: () => router.push('/(modals)/my-jobs'),
    },
    {
      id: 'job-templates',
      title: isRTL ? 'قوالب الوظائف' : 'Job Templates',
      icon: 'document-text-outline',
      action: () => router.push('/(modals)/job-templates'),
    },
    {
      id: 'contract-generator',
      title: isRTL ? 'منشئ العقود' : 'Contract Generator',
      icon: 'document-outline',
      action: () => router.push('/(modals)/contract-generator'),
    },
    {
      id: 'settings',
      title: isRTL ? 'الإعدادات' : 'Settings',
      icon: 'settings-outline',
      action: () => router.push('/(modals)/settings'),
    },
    {
      id: 'notifications',
      title: isRTL ? 'الإشعارات' : 'Notifications',
      icon: 'notifications-outline',
      action: () => router.push('/(modals)/notifications'),
    },
    {
      id: 'analytics',
      title: isRTL ? 'التحليلات المتقدمة' : 'Advanced Analytics',
      icon: 'analytics-outline',
      action: () => router.push('/(modals)/performance-dashboard'),
    },
    {
      id: 'leaderboards',
      title: isRTL ? 'لوحة المتصدرين' : 'Leaderboards',
      icon: 'trophy-outline',
      action: () => router.push('/(modals)/leaderboards'),
    },
    {
      id: 'help',
      title: t('help'),
      icon: 'help-circle-outline',
      action: () => router.push('/(modals)/help'),
    },
    {
      id: 'signout',
      title: isRTL ? 'تسجيل الخروج' : 'Sign Out',
      icon: 'log-out-outline',
      action: handleSignOut,
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar 
        barStyle="dark-content" 
        backgroundColor={theme.primary} 
      />
      
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Overlay */}
        <View style={[styles.headerOverlay, { paddingTop: insets.top + 16 }]}>
          <Animated.View style={{ transform: [{ scale: scaleAnimation }] }}>
            <TouchableOpacity 
              style={styles.overlayBackButton}
              onPress={() => handlePremiumPress(() => router.push('/(main)/home'))}
            >
              {isRTL ? (
                <ChevronRight size={28} color="#000000" />
              ) : (
                <ChevronLeft size={28} color="#000000" />
              )}
            </TouchableOpacity>
          </Animated.View>
          
          <Text style={styles.overlayTitle}>
            {t('profile')}
          </Text>
          
          <Animated.View style={{ transform: [{ scale: scaleAnimation }] }}>
            <TouchableOpacity 
              style={styles.overlayEditButton}
              onPress={() => handlePremiumPress(() => isEditing ? handleSave() : setIsEditing(true))}
              disabled={isLoading}
            >
              {isEditing ? (
                <Check size={24} color="#000000" />
              ) : (
                <Edit size={24} color="#000000" />
              )}
            </TouchableOpacity>
          </Animated.View>
        </View>
        {/* Neon Profile Card */}
        <Animated.View style={[
          styles.profileCard,
          {
            shadowOpacity: glowAnimation.interpolate({
              inputRange: [0, 1],
              outputRange: [0.2, 1.0], // More dramatic glow
            }),
            shadowRadius: glowAnimation.interpolate({
              inputRange: [0, 1],
              outputRange: [10, 40], // Much more dramatic radius
            }),
            elevation: glowAnimation.interpolate({
              inputRange: [0, 1],
              outputRange: [12, 25], // Android shadow animation
            }),
          }
        ]}>
          <View style={styles.cardGradient}>
            {/* TOP HALF - WHITE BACKGROUND */}
            <View style={styles.whiteSection}>
              {/* STEP 2: Header - GUILD logo (left) and Balance (right) */}
              <View style={styles.cardTopHeader}>
                {/* GUILD Logo - Left */}
                <View style={styles.guildLogoLeft}>
                  <Shield size={30} color="#000000" />
                  <Text style={styles.guildTextSmall}>GUILD</Text>
                </View>
                
                {/* Balance - Right */}
                <View style={styles.balanceContainer}>
                  <Text style={styles.balanceLabel}>Guild Coins</Text>
                  <View style={styles.balancePillRow}>
                    <View style={styles.balancePill}>
                      <Text style={styles.balanceAmount}>
                        {fakeWalletLoading ? '...' : showBalance ? (fakeWallet?.balance || 0).toLocaleString() : '••••••'}
                      </Text>
                      <Text style={styles.balanceCurrency}>🪙</Text>
                    </View>
                    <TouchableOpacity 
                      onPress={() => setShowBalance(!showBalance)}
                      style={styles.balanceEyeIcon}
                    >
                      {showBalance ? (
                        <Eye size={20} color={theme.buttonText} />
                      ) : (
                        <EyeOff size={20} color={theme.buttonText} />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* STEP 3: User Photo - Center */}
              <View style={styles.photoContainer}>
                {/* User Photo - RECTANGULAR */}
                {profile.profileImage ? (
                  <Image 
                    source={{ uri: profile.profileImage }} 
                    style={styles.userPhotoRect}
                  />
                ) : (
                  <View style={styles.userPhotoPlaceholderRect}>
                    <User size={115} color="#CCCCCC" />
                  </View>
                )}
                
                {/* Shield Icon - Bottom Left Corner */}
                <View style={styles.shieldBadge}>
                  <Shield size={20} color="#000000" />
                </View>
              </View>
            </View>

            {/* Rank Badge - Overlapping between white and green on LEFT */}
            <View style={styles.rankBadgeAbsolute}>
              <Text style={styles.rankLabel}>Rank</Text>
              <View style={styles.rankBadgeCircle}>
                <Text style={styles.rankBadgeText}>{currentRank}</Text>
              </View>
            </View>

            {/* QR Code Section - Under ranking by 50px */}
            <View style={styles.qrCodeSection}>
              <View style={styles.qrCodeContainer}>
                <QRCode
                  value={qrCodeData}
                  size={120}
                  color="#000000"
                  backgroundColor="transparent"
                />
              </View>
            </View>

            {/* BOTTOM HALF - LIME GREEN BACKGROUND */}
            <View style={styles.greenSection}>
              {/* STEP 4, 5, 6: Info Card with Icons */}
              <View style={styles.infoCard}>
              {/* User Details - Full Width */}
              <View style={styles.infoCardContent}>
                <View style={styles.userInfoContainer}>
                  <Text style={styles.infoText}>
                    <Text style={styles.infoLabel}>NAME : </Text>
                    {profile.firstName && profile.lastName 
                      ? `${profile.firstName.toLowerCase()} ${profile.lastName.toLowerCase()}`
                      : 'khalil ahmed ali'
                    }
                  </Text>
                  <Text style={styles.infoText}>
                    <Text style={styles.infoLabel}>ID : </Text>
                    {profile.idNumber || '12356555'}
                  </Text>
                  <Text style={styles.infoText}>
                    <Text style={styles.infoLabel}>GID : </Text>
                    {profile.idNumber || '12356555'}
                  </Text>
                  <Text style={styles.infoText}>
                    <Text style={styles.infoLabel}>GUILD : </Text>
                    {userGuildStatus.isSolo 
                      ? 'GUILD NAME'
                      : userGuildStatus.guild?.displayText
                    }
                  </Text>
                </View>
              </View>
              
              {/* All Icons - Horizontal Row */}
              <View style={styles.allIconsRow}>
                {/* Verification Status - Admin given */}
                <TouchableOpacity style={styles.iconButton}>
                  {true ? ( // Temporarily set to true for testing
                    <View style={styles.shieldContainer}>
                      <Shield size={20} color="#000000" />
                      <Check size={12} color="#000000" style={styles.shieldIcon} />
                    </View>
                  ) : (
                    <View style={styles.shieldContainer}>
                      <Shield size={20} color="#CCCCCC" />
                      <X size={14} color="#CCCCCC" style={styles.shieldIcon} />
                    </View>
                  )}
                </TouchableOpacity>
                {/* Chat - Leads to chat screen */}
                <TouchableOpacity 
                  style={styles.iconButton}
                  onPress={() => router.push('/(main)/chat')}
                >
                  <MessageCircle size={20} color="#000000" />
                </TouchableOpacity>
                {/* My Jobs - Leads to my jobs screen */}
                <TouchableOpacity 
                  style={styles.iconButton}
                  onPress={() => router.push('/(modals)/my-jobs')}
                >
                  <Briefcase size={20} color="#000000" />
                </TouchableOpacity>
              </View>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Ranking Progress Section */}
        {!isEditing && nextRankProgress && (
          <View style={styles.rankingSection}>
            <LinearGradient
              colors={['#BFFF1F', '#A8E61A']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.rankingGradient}
            >
              <View style={styles.rankingContent}>
                <View style={styles.rankingHeader}>
                  <Trophy size={24} color="#000000" />
                  <Text style={styles.rankingTitle}>
                    {isRTL ? 'تقدم الترتيب' : 'Ranking Progress'}
                  </Text>
                </View>
                
                {/* Current Rank Info */}
                <View style={styles.currentRankInfo}>
                  <View style={styles.rankBadgeModern}>
                    <Text style={styles.rankBadgeTextModern}>
                      {currentRank}
                    </Text>
                  </View>
                  <View style={styles.rankDetails}>
                    <Text style={styles.rankTitleModern}>
                      {rankBenefits.titlePrefix ? `${rankBenefits.titlePrefix} Rank` : `Rank ${currentRank}`}
                    </Text>
                    <Text style={styles.rankSubtitleModern}>
                      {userStats?.tasksCompleted || 0} tasks completed • {userStats?.totalEarnings || 0} QAR earned
                    </Text>
                  </View>
                </View>

                {/* Next Rank Progress */}
                {nextRankProgress.nextRank && (
                  <View style={styles.nextRankSection}>
                    <View style={styles.progressHeader}>
                      <Text style={styles.progressTitleModern}>
                        Progress to {nextRankProgress.nextRank}
                      </Text>
                      <View style={styles.progressPercentageContainer}>
                        <Text style={styles.progressPercentageModern}>
                          {nextRankProgress.progress}%
                        </Text>
                      </View>
                    </View>
                    
                    <View style={styles.progressBarModern}>
                      <View 
                        style={[
                          styles.progressFillModern, 
                          { width: `${nextRankProgress.progress}%` }
                        ]} 
                      />
                    </View>

                    {/* Missing Requirements */}
                    {nextRankProgress.missingRequirements.length > 0 && (
                      <View style={styles.requirementsSection}>
                        <Text style={styles.requirementsTitleModern}>
                          Requirements needed:
                        </Text>
                        {nextRankProgress.missingRequirements.slice(0, 3).map((requirement, index) => (
                          <View key={index} style={styles.requirementItemContainer}>
                            <View style={styles.requirementBullet} />
                            <Text style={styles.requirementItemModern}>
                              {requirement}
                            </Text>
                          </View>
                        ))}
                        {nextRankProgress.missingRequirements.length > 3 && (
                          <View style={styles.requirementItemContainer}>
                            <View style={styles.requirementBullet} />
                            <Text style={styles.requirementItemModern}>
                              +{nextRankProgress.missingRequirements.length - 3} more...
                            </Text>
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                )}

              </View>
            </LinearGradient>
          </View>
        )}

        {/* Edit Form */}
        {isEditing && (
          <View style={[styles.editSection, { backgroundColor: theme.surface }]}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
              {t('editProfile')}
            </Text>
            
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.textPrimary }]}>
                {isRTL ? 'الاسم الأول' : 'First Name'}
              </Text>
              <TextInput
                style={[styles.textInput, { 
                  backgroundColor: theme.background,
                  color: theme.textPrimary,
                  borderColor: theme.border,
                  textAlign: isRTL ? 'right' : 'left'
                }]}
                value={editData.firstName}
                onChangeText={(text) => setEditData({ ...editData, firstName: text })}
                placeholder={isRTL ? 'أدخل الاسم الأول' : 'Enter first name'}
                placeholderTextColor={theme.textSecondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.textPrimary }]}>
                {isRTL ? 'اسم العائلة' : 'Last Name'}
              </Text>
              <TextInput
                style={[styles.textInput, { 
                  backgroundColor: theme.background,
                  color: theme.textPrimary,
                  borderColor: theme.border,
                  textAlign: isRTL ? 'right' : 'left'
                }]}
                value={editData.lastName}
                onChangeText={(text) => setEditData({ ...editData, lastName: text })}
                placeholder={isRTL ? 'أدخل اسم العائلة' : 'Enter last name'}
                placeholderTextColor={theme.textSecondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.textPrimary }]}>
                {isRTL ? 'السيرة الذاتية' : 'Bio'}
              </Text>
              <TextInput
                style={[styles.textInput, styles.textArea, { 
                  backgroundColor: theme.background,
                  color: theme.textPrimary,
                  borderColor: theme.border,
                  textAlign: isRTL ? 'right' : 'left'
                }]}
                value={editData.bio}
                onChangeText={(text) => setEditData({ ...editData, bio: text })}
                placeholder={isRTL ? 'أخبرنا عن نفسك' : 'Tell us about yourself'}
                placeholderTextColor={theme.textSecondary}
                multiline
                numberOfLines={4}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.textPrimary }]}>
                {isRTL ? 'رقم الهاتف' : 'Phone Number'}
              </Text>
              <TextInput
                style={[styles.textInput, { 
                  backgroundColor: theme.background,
                  color: theme.textPrimary,
                  borderColor: theme.border,
                  textAlign: isRTL ? 'right' : 'left'
                }]}
                value={editData.phoneNumber}
                onChangeText={(text) => setEditData({ ...editData, phoneNumber: text })}
                placeholder={isRTL ? 'أدخل رقم الهاتف' : 'Enter phone number'}
                placeholderTextColor={theme.textSecondary}
                keyboardType="phone-pad"
              />
            </View>
          </View>
        )}

        {/* Profile Details */}
        {!isEditing && (
          <View style={[styles.detailsSection, { backgroundColor: theme.surface }]}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
              {t('profileDetails')}
            </Text>
            
            <View style={styles.detailItem}>
              <Phone size={20} color={theme.textSecondary} />
              <Text style={[styles.detailText, { color: theme.textSecondary }]}>
                {profile.phoneNumber || t('notProvided')}
              </Text>
            </View>
            
            <View style={styles.detailItem}>
              <IdCard size={20} color={theme.textSecondary} />
              <Text style={[styles.detailText, { color: theme.textSecondary }]}>
                {profile.idNumber || t('notProvided')}
              </Text>
            </View>
            
            {profile.location && (
              <View style={styles.detailItem}>
                <MapPin size={20} color={theme.textSecondary} />
                <Text style={[styles.detailText, { color: theme.textSecondary }]}>
                  {profile.location.address}
                </Text>
              </View>
            )}
            
            {profile.skills.length > 0 && (
              <View style={styles.skillsContainer}>
                <Text style={[styles.skillsTitle, { color: theme.textPrimary }]}>
                  {t('skills')}
                </Text>
                <View style={styles.skillsList}>
                  {(Array.isArray(profile?.skills) ? profile.skills : []).map((skill, index) => (
                    <View 
                      key={`${profile?.id || "profile"}-skill-${index}`}
                      style={[styles.skillChip, { 
                        backgroundColor: theme.primary + '20',
                        borderColor: theme.primary 
                      }]}
                    >
                      <Text style={[styles.skillText, { color: theme.primary }]}>
                        {String(skill)}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}

        {/* Menu Items */}
        <View style={[styles.menuSection, { backgroundColor: theme.surface }]}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.menuItem,
                { borderBottomColor: theme.border },
                index === menuItems.length - 1 && styles.lastMenuItem
              ]}
              onPress={item.action}
            >
              <View style={[styles.menuItemLeft, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <View style={[styles.menuIcon, { backgroundColor: theme.primary + '20' }]}>
                  {getLucideIcon(item.icon, theme.primary)}
                </View>
                <Text style={[styles.menuText, { color: theme.textPrimary }]}>
                  {item.title}
                </Text>
              </View>
              {isRTL ? (
                <ChevronLeft size={20} color={theme.textSecondary} />
              ) : (
                <ChevronRight size={20} color={theme.textSecondary} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Cancel button when editing */}
        {isEditing && (
          <TouchableOpacity
            style={[styles.cancelButton, { borderColor: theme.border }]}
            onPress={handleCancel}
            disabled={isLoading}
          >
            <Text style={[styles.cancelButtonText, { color: theme.textSecondary }]}>
              {t('cancel')}
            </Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
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
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
    flex: 1,
    textAlign: 'center',
  },
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
  },
  content: {
    flex: 1,
  },
  // Header Overlay Styles
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    zIndex: 10,
  },
  overlayBackButton: {
    width: 40,
    height: 40,
    borderRadius: 8, // Box shape instead of circle
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayTitle: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
    color: '#000000',
    letterSpacing: 1,
  },
  overlayEditButton: {
    width: 40,
    height: 40,
    borderRadius: 8, // Box shape instead of circle
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Neon Card Styles
  profileCard: {
    marginHorizontal: 0, // Extend to full width at top
    marginTop: 0, // Extend to top of screen
    marginBottom: 20, // Keep bottom margin for other content
    borderRadius: 0, // No border radius at top
    borderBottomLeftRadius: 24, // Only bottom corners rounded
    borderBottomRightRadius: 24,
    overflow: 'hidden',
    shadowColor: '#BFFF00',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  cardGradient: {
    width: '100%',
    borderRadius: 0,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  // White top section
  whiteSection: {
    backgroundColor: '#FFFFFF',
    paddingTop: 80, // Space for overlay header
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  // Green bottom section  
  greenSection: {
    backgroundColor: '#BFFF00',
    paddingHorizontal: 0,
    paddingVertical: 0,
    marginTop: -44,
    paddingTop: 10, // Reduced from 20 to 10
  },
  cardHeaderSpacing: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    marginBottom: 24,
    marginTop: 60, // Increased space for overlay header (40 + 20)
  },
  guildLogo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  guildLogoCentered: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  guildText: {
    fontSize: 26, // Increased from 22 for more prominence
    fontWeight: '900',
    fontFamily: FONT_FAMILY,
    color: '#000000',
    marginLeft: 8,
    letterSpacing: 1.5, // Increased letter spacing
  },
  cardAvatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  cardAvatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  cardAvatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  cardCameraOverlay: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardUserName: {
    fontSize: 36, // Increased from 32
    fontWeight: '900',
    fontFamily: FONT_FAMILY,
    color: '#000000',
    marginBottom: 20,
    textAlign: 'center',
    letterSpacing: 1,
  },
  cardEditForm: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardNameRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
  },
  cardNameInput: {
    fontSize: 28, // Increased from 24
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
    color: '#000000',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 4,
    minWidth: 100,
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  cardBioInput: {
    fontSize: 18, // Increased from 16
    fontWeight: '500',
    fontFamily: FONT_FAMILY,
    color: '#000000',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 12,
    width: '100%',
    minHeight: 60,
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.1)',
    textAlignVertical: 'top',
  },
  cardDetails: {
    alignItems: 'flex-start',
    width: '100%',
    marginBottom: 24,
  },
  cardDetailText: {
    fontSize: 18, // Increased from 16
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
    color: '#000000',
    marginBottom: 6, // Increased spacing
    letterSpacing: 0.5,
  },
  cardDetailLabel: {
    fontSize: 18,
    fontWeight: '900', // Extra bold for labels
    fontFamily: FONT_FAMILY,
    color: '#000000',
    letterSpacing: 1, // More letter spacing for labels
  },
  cardRankSection: {
    alignItems: 'center',
    marginTop: 'auto',
  },
  cardRankLabel: {
    fontSize: 20, // Increased from 18
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
    color: '#000000',
    marginBottom: 8,
    letterSpacing: 1,
  },
  cardRankContainer: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardRankLetter: {
    fontSize: 42, // Reduced to fit SSS nicely
    fontWeight: '900',
    fontFamily: FONT_FAMILY,
    color: '#BCFF31',
    letterSpacing: 1, // Reduced for better SSS spacing
  },
  // 📊 RANKING SECTION STYLES - MODERN DESIGN
  rankingSection: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },
  rankingGradient: {
    borderRadius: 16,
  },
  rankingContent: {
    padding: 18,
  },
  rankingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  rankingTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#000000',
    fontFamily: FONT_FAMILY,
    marginLeft: 10,
    letterSpacing: 0.3,
  },
  currentRankInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  rankBadgeModern: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  rankBadgeTextModern: {
    fontSize: 24,
    fontWeight: '900',
    color: '#BFFF00',
    fontFamily: FONT_FAMILY,
  },
  rankDetails: {
    flex: 1,
  },
  rankTitleModern: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
    fontFamily: FONT_FAMILY,
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  rankSubtitleModern: {
    fontSize: 13,
    fontWeight: '500',
    color: '#333333',
    fontFamily: FONT_FAMILY,
    opacity: 0.9,
  },
  nextRankSection: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
  },
  progressPercentage: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  // Modern Progress Styles
  progressTitleModern: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    fontFamily: FONT_FAMILY,
    flex: 1,
  },
  progressPercentageContainer: {
    backgroundColor: '#000000',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  progressPercentageModern: {
    fontSize: 14,
    fontWeight: '700',
    color: '#BFFF00',
    fontFamily: FONT_FAMILY,
  },
  progressBarModern: {
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(0,0,0,0.1)',
    marginBottom: 12,
    overflow: 'hidden',
  },
  progressFillModern: {
    height: '100%',
    borderRadius: 5,
    backgroundColor: '#000000',
  },
  requirementsSection: {
    marginTop: 8,
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
    marginBottom: 6,
  },
  requirementItem: {
    fontSize: 13,
    fontFamily: FONT_FAMILY,
    marginBottom: 2,
  },
  // Modern Requirements Styles
  requirementsTitleModern: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    fontFamily: FONT_FAMILY,
    marginBottom: 10,
  },
  requirementItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  requirementBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#000000',
    marginRight: 12,
  },
  requirementItemModern: {
    fontSize: 13,
    fontWeight: '500',
    color: '#333333',
    fontFamily: FONT_FAMILY,
    flex: 1,
  },
  benefitsSection: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    paddingTop: 16,
  },
  benefitsTitle: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
    marginBottom: 12,
  },
  benefitsList: {
    gap: 4,
  },
  benefitItem: {
    fontSize: 14,
    fontFamily: FONT_FAMILY,
    lineHeight: 20,
  },
  // Modern Benefits Styles
  benefitsTitleModern: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
    fontFamily: FONT_FAMILY,
    marginBottom: 16,
    letterSpacing: 0.3,
  },
  benefitItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  benefitBullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#000000',
    marginRight: 12,
  },
  benefitItemModern: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333333',
    fontFamily: FONT_FAMILY,
    flex: 1,
  },
  editSection: {
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    fontFamily: FONT_FAMILY,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  detailsSection: {
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailText: {
    fontSize: 16,
    fontFamily: FONT_FAMILY,
    marginLeft: 12,
  },
  skillsContainer: {
    marginTop: 16,
  },
  skillsTitle: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
    marginBottom: 12,
  },
  skillsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  skillChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    margin: 4,
  },
  skillText: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: FONT_FAMILY,
  },
  menuSection: {
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  lastMenuItem: {
    borderBottomWidth: 0,
  },
  menuItemLeft: {
    alignItems: 'center',
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  menuText: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: FONT_FAMILY,
  },
  cancelButton: {
    marginHorizontal: 20,
    marginBottom: 16,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: FONT_FAMILY,
  },
  // STEP 2 STYLES: Header section
  cardTopHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    width: '100%',
    marginBottom: 30,
  },
  guildLogoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 20,
  },
  guildTextSmall: {
    fontSize: 21,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
    color: '#000000',
    marginLeft: 4,
  },
  balanceContainer: {
    alignItems: 'center',
    paddingTop: 50,
  },
  balanceLabel: {
    fontSize: 12,
    fontWeight: '400',
    color: '#000000',
    marginBottom: 4,
  },
  balancePillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  balancePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000000',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  balanceEyeIcon: {
    padding: 4,
  },
  balanceAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginRight: 4,
  },
  balanceCurrency: {
    fontSize: 14,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  // STEP 3 STYLES: User photo (centered)
  photoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    marginLeft: -80,
    marginTop: -70,
    position: 'relative',
  },
  shieldBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#000000',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  userPhotoRect: {
    width: 173,
    height: 202,
    borderRadius: 8,
  },
  userPhotoPlaceholderRect: {
    width: 173,
    height: 202,
    borderRadius: 8,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Rank Badge - Absolute positioned on RIGHT, half white half green
  rankBadgeAbsolute: {
    position: 'absolute',
    right: 30,
    top: 290, // Moved up another 2px
    alignItems: 'center',
    zIndex: 10,
  },
  rankBadgeCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  rankBadgeText: {
    fontSize: 28,
    fontWeight: '900',
    color: '#BFFF00',
    fontFamily: FONT_FAMILY,
  },
  rankLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000000',
    fontFamily: FONT_FAMILY,
    textTransform: 'capitalize',
  },
  // QR Code Section - Under ranking by 50px
  qrCodeSection: {
    position: 'absolute',
    right: 30,
    top: 390, // Moved up by 60px
    alignItems: 'center',
    zIndex: 10,
  },
  qrCodeContainer: {
    width: 140,
    height: 140,
    backgroundColor: 'transparent',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrCodeLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000000',
    fontFamily: FONT_FAMILY,
    marginTop: 8,
    textAlign: 'center',
  },
  qrCodeSubLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#666666',
    fontFamily: FONT_FAMILY,
    marginTop: 2,
    textAlign: 'center',
  },
  qrCodeGidLabel: {
    fontSize: 9,
    fontWeight: '500',
    color: '#888888',
    fontFamily: FONT_FAMILY,
    marginTop: 2,
    textAlign: 'center',
  },
  // STEP 4, 5, 6 STYLES: Info card with icons (inside green section)
  infoCard: {
    width: '100%',
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 20, // Reduced from 28 to 20
  },
  infoCardRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  // STEP 5: Left icons
  leftIcons: {
    marginRight: 24,
    alignItems: 'center',
  },
  iconButton: {
    padding: 8,
  },
  shieldContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shieldIcon: {
    position: 'absolute',
    top: 4,
    left: 4,
  },
  gridIcon: {
    width: 24,
    height: 24,
  },
  gridRow: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  gridBox: {
    width: 10,
    height: 10,
    backgroundColor: '#000000',
    marginRight: 2,
    borderRadius: 2,
  },
  // Info content
  infoCardContent: {
    alignItems: 'flex-start',
    flex: 1,
  },
  userInfoContainer: {
    width: '100%',
    position: 'relative',
  },
  infoText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    fontFamily: FONT_FAMILY,
    marginBottom: 6,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '900',
    color: '#000000',
    fontFamily: FONT_FAMILY,
  },
  // All Icons - Horizontal Row
  allIconsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    gap: 15,
    paddingTop: 16,
    paddingLeft: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  // STEP 6: Bottom icons (kept for reference)
  bottomIcons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  bottomIconButton: {
    padding: 8,
  },
});