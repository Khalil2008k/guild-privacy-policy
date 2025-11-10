/**
 * useLocation Hook
 * 
 * COMMENT: PRIORITY 1 - File Modularization
 * Extracted from add-job.tsx (lines 218-291)
 * Purpose: Manages location-related operations (get current location, open map selector)
 */

import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import * as Location from 'expo-location';
import { CustomAlertService } from '../../../services/CustomAlertService';
import { logger } from '../../../utils/logger';
import { useI18n } from '../../../contexts/I18nProvider';

interface UseLocationReturn {
  locationLoading: boolean;
  getCurrentLocation: () => Promise<void>;
  openMapSelector: () => void;
}

export const useLocation = (
  onLocationSet: (location: string, locationAr: string, coordinates?: { latitude: number; longitude: number }) => void
): UseLocationReturn => {
  const { isRTL } = useI18n();
  const [locationLoading, setLocationLoading] = useState(false);

  // Location functions
  const getCurrentLocation = useCallback(async () => {
    try {
      setLocationLoading(true);
      
      // Request permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          isRTL ? 'إذن الموقع مطلوب' : 'Location Permission Required',
          isRTL ? 'نحتاج إذن الموقع لتحديد موقعك الحالي' : 'We need location permission to get your current location'
        );
        return;
      }

      // Get current location
      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      // Reverse geocode to get address
      const addressResponse = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (addressResponse.length > 0) {
        const address = addressResponse[0];
        const fullAddress = `${address.city || ''}, ${address.region || ''}, ${address.country || ''}`.replace(/^,\s*|,\s*$/g, '');
        
        onLocationSet(fullAddress, fullAddress, { latitude, longitude });
        
        CustomAlertService.showSuccess(
          isRTL ? 'تم تحديد الموقع' : 'Location Set',
          isRTL ? `تم تحديد موقعك: ${fullAddress}` : `Your location has been set: ${fullAddress}`
        );
      }
    } catch (error) {
      // COMMENT: PRIORITY 1 - Replace console.error with logger
      logger.error('Error getting location:', error);
      CustomAlertService.showError(
        isRTL ? 'خطأ في الموقع' : 'Location Error',
        isRTL ? 'فشل في تحديد موقعك الحالي' : 'Failed to get your current location'
      );
    } finally {
      setLocationLoading(false);
    }
  }, [isRTL, onLocationSet]);

  const openMapSelector = useCallback(() => {
    // For now, show an alert. In a real app, you'd open a map modal
    Alert.alert(
      isRTL ? 'اختيار الموقع' : 'Select Location',
      isRTL ? 'سيتم فتح خريطة لاختيار الموقع' : 'Map will open to select location',
      [
        {
          text: isRTL ? 'إلغاء' : 'Cancel',
          style: 'cancel',
        },
        {
          text: isRTL ? 'فتح الخريطة' : 'Open Map',
          onPress: () => {
            // In a real app, navigate to map screen
            CustomAlertService.showInfo(
              isRTL ? 'قريباً' : 'Coming Soon',
              isRTL ? 'ميزة الخريطة ستكون متاحة قريباً' : 'Map feature will be available soon'
            );
          },
        },
      ]
    );
  }, [isRTL]);

  return {
    locationLoading,
    getCurrentLocation,
    openMapSelector,
  };
};









