/**
 * Profile QR Code Screen
 * Generate and display QR code for quick profile sharing
 */

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useI18n } from '@/contexts/I18nProvider';
import { Share2, Download } from 'lucide-react-native';
import QRCode from 'react-native-qrcode-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Advanced Light Mode Color Helper
const getAdaptiveColors = (theme: any, isDark: boolean) => ({
  background: isDark ? theme.background : '#F5F5F5',
  qrContainer: '#FFFFFF', // Always white for QR contrast
  primaryText: isDark ? theme.textPrimary : '#000000',
  secondaryText: isDark ? theme.textSecondary : '#666666',
  buttonText: '#000000', // Black for readability on theme primary
  shadow: isDark 
    ? { shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 12 }
    : { shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 16 },
});

export default function ProfileQRScreen() {
  const { user } = useAuth();
  const { theme, isDarkMode } = useTheme();
  const { t, isRTL } = useI18n();
  const insets = useSafeAreaInsets();
  
  const adaptiveColors = React.useMemo(() => getAdaptiveColors(theme, isDarkMode), [theme, isDarkMode]);
  
  const profileUrl = `https://guild.app/profile/${user?.uid}`;
  
  const handleShare = async () => {
    // Share implementation
  };
  
  return (
    <View style={{ 
      flex: 1, 
      backgroundColor: adaptiveColors.background 
    }}>
      {/* Header with proper top padding */}
      <View style={{
        paddingTop: insets.top + 20,
        paddingHorizontal: 20,
        paddingBottom: 20,
        alignItems: 'center'
      }}>
        <Text style={{ 
          color: adaptiveColors.primaryText, 
          fontSize: 24, 
          fontWeight: 'bold', 
          marginBottom: 10, 
          textAlign: 'center' 
        }}>
          {user?.displayName}
        </Text>
        <Text style={{ 
          color: adaptiveColors.secondaryText, 
          fontSize: 14, 
          marginBottom: 40, 
          textAlign: 'center' 
        }}>
          {isRTL ? 'امسح لعرض الملف الشخصي' : 'Scan to view profile'}
        </Text>
      </View>
      
      {/* Centered content */}
      <View style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20
      }}>
        <View style={{
          backgroundColor: adaptiveColors.qrContainer,
          padding: 20,
          borderRadius: 20,
          borderWidth: isDarkMode ? 0 : 1,
          borderColor: 'rgba(0, 0, 0, 0.08)',
          ...adaptiveColors.shadow,
          shadowOffset: { width: 0, height: 4 },
          elevation: isDarkMode ? 5 : 8
        }}>
          <QRCode value={profileUrl} size={250} />
        </View>
        
        <TouchableOpacity onPress={handleShare} style={{
          backgroundColor: theme.primary,
          borderRadius: 12,
          padding: 16,
          marginTop: 40,
          flexDirection: isRTL ? 'row-reverse' : 'row',
          alignItems: 'center'
        }}>
          <Share2 size={20} color={adaptiveColors.buttonText} style={{ marginRight: isRTL ? 0 : 10, marginLeft: isRTL ? 10 : 0 }} />
          <Text style={{ color: adaptiveColors.buttonText, fontSize: 16, fontWeight: '600' }}>
            {isRTL ? 'مشاركة رمز QR' : 'Share QR Code'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}





