/**
 * Auto-Logout Notification Helper
 * 
 * COMMENT: Created per Deep Root System Audit - Fix for missing 72-hour logout notification
 * This utility helps show user-friendly notifications when auto-logout occurs
 * 
 * Usage in AuthContext:
 *   import { showAutoLogoutNotification } from '@/utils/autoLogoutNotification';
 *   
 *   if (hoursSinceActivity >= 72) {
 *     await showAutoLogoutNotification();
 *     await firebaseSignOut(auth);
 *   }
 */

import { Alert } from 'react-native';

/**
 * Show auto-logout notification before logging out user
 */
export async function showAutoLogoutNotification(): Promise<void> {
  try {
    // Try to use CustomAlertService if available
    // Note: CustomAlertService must be initialized by CustomAlertProvider
    // Using dynamic import to avoid circular dependencies
    try {
      const { CustomAlertService } = await import('@/services/CustomAlertService');
      if (CustomAlertService && typeof CustomAlertService.showAlert === 'function') {
        CustomAlertService.showAlert(
          'Session Expired',
          'For security, please sign in again after 72 hours of inactivity.',
          [{ text: 'OK', onPress: () => {} }]
        );
        // Give user a moment to read the alert before logout
        await new Promise(resolve => setTimeout(resolve, 2000));
        return;
      }
    } catch (alertError) {
      // Fall through to native Alert if CustomAlert fails
    }
    
    // Fallback to native Alert
    Alert.alert(
      'Session Expired',
      'For security, please sign in again after 72 hours of inactivity.',
      [{ text: 'OK' }]
    );
    
    // Give user a moment to read the alert
    await new Promise(resolve => setTimeout(resolve, 2000));
  } catch (error) {
    // If everything fails, at least show native Alert
    Alert.alert(
      'Session Expired',
      'For security, please sign in again after 72 hours of inactivity.',
      [{ text: 'OK' }]
    );
  }
}

