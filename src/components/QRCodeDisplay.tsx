import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  Share,
} from 'react-native';
import { CustomAlertService } from '../services/CustomAlertService';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useI18n } from '../contexts/I18nProvider';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import QRCode from 'react-native-qrcode-svg';

const { width } = Dimensions.get('window');
const FONT_FAMILY = 'Signika Negative SC';

interface QRCodeDisplayProps {
  guildId: string;
  userData: {
    name: string;
    rank: string;
    rating: number;
    specialties: string[];
    profilePicture?: string;
  };
  qrCodeData: string;
  onRefresh?: () => void;
}

export default function QRCodeDisplay({ 
  guildId, 
  userData, 
  qrCodeData,
  onRefresh 
}: QRCodeDisplayProps) {
  const { theme, isDarkMode } = useTheme();
  const { t, isRTL } = useI18n();
  
  // Animation values
  const glowAnimation = useRef(new Animated.Value(0)).current;
  const scaleAnimation = useRef(new Animated.Value(1)).current;
  const rotateAnimation = useRef(new Animated.Value(0)).current;
  
  const [qrRef, setQrRef] = useState<any>(null);

  useEffect(() => {
    startAnimations();
  }, []);

  const startAnimations = () => {
    // Glow animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnimation, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: false,
        }),
        Animated.timing(glowAnimation, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: false,
        }),
      ])
    ).start();

    // Subtle rotation animation
    Animated.loop(
      Animated.timing(rotateAnimation, {
        toValue: 1,
        duration: 20000,
        useNativeDriver: true,
      })
    ).start();
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    Animated.sequence([
      Animated.timing(scaleAnimation, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnimation, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleShare = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      if (qrRef) {
        qrRef.toDataURL((dataURL: string) => {
          const shareOptions = {
            title: isRTL ? 'رمز GUILD QR الخاص بي' : 'My GUILD QR Code',
            message: isRTL 
              ? `هذا هو رمز GUILD QR الخاص بي: ${guildId}\n${userData.name} - رتبة ${userData.rank}`
              : `This is my GUILD QR Code: ${guildId}\n${userData.name} - Rank ${userData.rank}`,
            url: `data:image/png;base64,${dataURL}`,
          };
          
          Share.share(shareOptions);
        });
      }
    } catch (error) {
      console.error('Error sharing QR code:', error);
      CustomAlertService.showError(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'فشل في مشاركة رمز QR' : 'Failed to share QR code'
      );
    }
  };

  const handleRefresh = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Rotation animation for refresh
    Animated.timing(rotateAnimation, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start(() => {
      rotateAnimation.setValue(0);
      if (onRefresh) {
        onRefresh();
      }
    });
  };

  const getRankColor = (rank: string) => {
    const rankColors: { [key: string]: string } = {
      'G': '#8B4513',
      'F': '#CD7F32',
      'E': '#C0C0C0',
      'D': '#FFD700',
      'C': '#FF6B35',
      'B': '#FF1493',
      'A': '#9932CC',
      'S': '#00CED1',
      'SS': '#FF4500',
      'SSS': '#FF0000',
    };
    return rankColors[rank] || theme.primary;
  };

  return (
    <Animated.View 
      style={[
        styles.container,
        {
          transform: [{ scale: scaleAnimation }],
          shadowOpacity: glowAnimation.interpolate({
            inputRange: [0, 1],
            outputRange: [0.2, 0.6],
          }),
          shadowRadius: glowAnimation.interpolate({
            inputRange: [0, 1],
            outputRange: [10, 25],
          }),
        }
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={handlePress}
        style={styles.touchableContainer}
      >
        <LinearGradient
          colors={[theme.primary, theme.primary]}
          style={styles.card}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.guildLogo}>
              <MaterialIcons name="shield" size={24} color="#000000" />
              <Text style={styles.guildText}>GUILD</Text>
            </View>
            
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleRefresh}
              >
                <Animated.View
                  style={{
                    transform: [{
                      rotate: rotateAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', '360deg'],
                      })
                    }]
                  }}
                >
                  <MaterialIcons name="refresh" size={20} color="#000000" />
                </Animated.View>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleShare}
              >
                <MaterialIcons name="share" size={20} color="#000000" />
              </TouchableOpacity>
            </View>
          </View>

          {/* QR Code Section */}
          <View style={styles.qrSection}>
            <View style={styles.qrContainer}>
              <View style={styles.qrBackground}>
                <QRCode
                  value={qrCodeData}
                  size={180}
                  color="#000000"
                  backgroundColor="#FFFFFF"
                  logoSize={30}
                  logoBackgroundColor="transparent"
                  getRef={(c) => setQrRef(c)}
                />
              </View>
              
              {/* Corner decorations */}
              <View style={[styles.qrCorner, styles.topLeft]} />
              <View style={[styles.qrCorner, styles.topRight]} />
              <View style={[styles.qrCorner, styles.bottomLeft]} />
              <View style={[styles.qrCorner, styles.bottomRight]} />
            </View>
          </View>

          {/* User Info */}
          <View style={styles.userInfo}>
            <Text style={styles.userName}>
              {userData.name}
            </Text>
            
            <View style={styles.userDetails}>
              <View style={styles.guildIdContainer}>
                <Text style={styles.guildIdLabel}>
                  {isRTL ? 'معرف GUILD' : 'GUILD ID'}
                </Text>
                <Text style={styles.guildIdText}>
                  {guildId}
                </Text>
              </View>
              
              <View style={styles.rankContainer}>
                <View style={[styles.rankBadge, { backgroundColor: getRankColor(userData.rank) }]}>
                  <Text style={styles.rankText}>
                    {userData.rank}
                  </Text>
                </View>
                <View style={styles.ratingContainer}>
                  <MaterialIcons name="star" size={16} color="#FFD700" />
                  <Text style={styles.ratingText}>
                    {userData.rating.toFixed(1)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Specialties */}
            {userData.specialties.length > 0 && (
              <View style={styles.specialtiesContainer}>
                <Text style={styles.specialtiesTitle}>
                  {isRTL ? 'التخصصات' : 'Specialties'}
                </Text>
                <View style={styles.specialtiesList}>
                  {userData.specialties.slice(0, 3).map((specialty, index) => (
                    <View key={index} style={styles.specialtyChip}>
                      <Text style={styles.specialtyText}>
                        {specialty}
                      </Text>
                    </View>
                  ))}
                  {userData.specialties.length > 3 && (
                    <View style={styles.specialtyChip}>
                      <Text style={styles.specialtyText}>
                        +{userData.specialties.length - 3}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            )}
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <View style={styles.scanInstruction}>
              <MaterialIcons name="qr-code-scanner" size={20} color="#000000" />
              <Text style={styles.scanInstructionText}>
                {isRTL ? 'امسح للتحقق من الهوية' : 'Scan to verify identity'}
              </Text>
            </View>
            
            <View style={styles.securityIndicator}>
              <MaterialIcons name="security" size={16} color="#000000" />
              <Text style={styles.securityText}>
                {isRTL ? 'آمن' : 'Secure'}
              </Text>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    shadowColor: '#BCFF31',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  touchableContainer: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  card: {
    padding: 24,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  guildLogo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  guildText: {
    fontSize: 20,
    fontWeight: '900',
    fontFamily: FONT_FAMILY,
    color: '#000000',
    marginLeft: 8,
    letterSpacing: 1,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  qrContainer: {
    position: 'relative',
  },
  qrBackground: {
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  qrCorner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderWidth: 3,
    borderColor: '#000000',
  },
  topLeft: {
    top: -2,
    left: -2,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 6,
  },
  topRight: {
    top: -2,
    right: -2,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 6,
  },
  bottomLeft: {
    bottom: -2,
    left: -2,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 6,
  },
  bottomRight: {
    bottom: -2,
    right: -2,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 6,
  },
  userInfo: {
    alignItems: 'center',
    marginBottom: 16,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
    color: '#000000',
    textAlign: 'center',
    marginBottom: 12,
  },
  userDetails: {
    width: '100%',
    marginBottom: 16,
  },
  guildIdContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  guildIdLabel: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
    color: '#000000',
    opacity: 0.7,
    marginBottom: 4,
  },
  guildIdText: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
    color: '#000000',
    letterSpacing: 1,
  },
  rankContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  rankBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    fontSize: 18,
    fontWeight: '900',
    fontFamily: FONT_FAMILY,
    color: '#FFFFFF',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
    color: '#000000',
  },
  specialtiesContainer: {
    width: '100%',
    alignItems: 'center',
  },
  specialtiesTitle: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
    color: '#000000',
    marginBottom: 8,
    opacity: 0.8,
  },
  specialtiesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
  },
  specialtyChip: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 12,
  },
  specialtyText: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: FONT_FAMILY,
    color: '#000000',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  scanInstruction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  scanInstructionText: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: FONT_FAMILY,
    color: '#000000',
    opacity: 0.8,
  },
  securityIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  securityText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
    color: '#000000',
    opacity: 0.8,
  },
});
