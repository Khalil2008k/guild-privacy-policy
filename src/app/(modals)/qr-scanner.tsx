import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { CustomAlertService } from '../../services/CustomAlertService';
import { Stack, useRouter, useFocusEffect } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import { useI18n } from '../../contexts/I18nProvider';
import QRCodeScanner from '../../components/QRCodeScanner';
import * as Haptics from 'expo-haptics';
import { logger } from '../../utils/logger'; // ✅ Added for proper logging

const FONT_FAMILY = 'Signika Negative SC';

export default function QRScannerScreen() {
  const { theme, isDarkMode } = useTheme();
  const { t, isRTL } = useI18n();
  const router = useRouter();
  
  const adaptiveColors = {
    background: isDarkMode ? theme.background : '#FFFFFF',
    text: isDarkMode ? theme.text : '#1A1A1A',
    textSecondary: isDarkMode ? theme.textSecondary : '#666666',
    surface: isDarkMode ? theme.surface : '#F8F9FA',
    border: isDarkMode ? theme.border : 'rgba(0,0,0,0.08)',
    primary: theme.primary,
    buttonText: '#000000',
  };

  const [isScanning, setIsScanning] = useState(true);

  logger.debug('QRScannerScreen rendered, isScanning:', isScanning);

  // ✅ FIX: Reset scanner when screen comes back into focus
  // This prevents black screen when user goes back from scanned-user-profile
  useFocusEffect(
    React.useCallback(() => {
      // Reset scanning state when screen is focused
      setIsScanning(true);
      logger.debug('QRScannerScreen focused, resetting scanner');
      
      return () => {
        // Optional cleanup when screen loses focus
        logger.debug('QRScannerScreen unfocused');
      };
    }, [])
  );

  const handleScan = async (data: string) => {
    try {
      logger.info('QR Scanner received data:', data);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      
      // Parse QR code data
      const parsedData = JSON.parse(data);
      logger.info('Parsed data in scanner:', parsedData);
      
      if (parsedData.gid || parsedData.name) {
        // Navigate to scanned user profile screen
        router.push({
          pathname: '/(modals)/scanned-user-profile',
          params: {
            userData: data
          }
        });
        
        setIsScanning(false);
      } else {
        throw new Error('Invalid QR code format');
      }
    } catch (error) {
      logger.error('Error processing QR scan:', error);
      CustomAlertService.showError(
        isRTL ? 'خطأ في المسح' : 'Scan Error',
        isRTL ? 'رمز QR غير صالح أو تالف' : 'Invalid or corrupted QR code',
        [
          {
            text: isRTL ? 'حاول مرة أخرى' : 'Try Again',
            style: 'default',
            onPress: () => setIsScanning(true)
          }
        ]
      );
    }
  };

  const handleClose = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      <StatusBar barStyle="light-content" backgroundColor="#000000" />

      <QRCodeScanner
        onScan={handleScan}
        onClose={handleClose}
        isVisible={isScanning}
        scanType="PROFILE_VIEW"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
});
