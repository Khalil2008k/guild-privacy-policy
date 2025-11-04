/**
 * Environment Detection Utility
 * Detects if running in Expo Go, EAS development build, or production build
 */

import Constants from 'expo-constants';
import { Platform } from 'react-native';
// COMMENT: PRIORITY 1 - Replace console statements with logger
import { logger } from './logger';

export type BuildEnvironment = 'expo-go' | 'development-build' | 'production-build';

export interface EnvironmentInfo {
  environment: BuildEnvironment;
  isExpoGo: boolean;
  isDevelopmentBuild: boolean;
  isProductionBuild: boolean;
  canUseNativeFirebase: boolean;
  shouldUseExpoFirebaseRecaptcha: boolean;
}

/**
 * Detect the current build environment
 */
export function detectBuildEnvironment(): EnvironmentInfo {
  const appOwnership = Constants.appOwnership;
  const isExpoGo = appOwnership === 'expo';
  const isDevelopmentBuild = appOwnership === 'development';
  const isProductionBuild = appOwnership === 'store';
  
  // Determine environment
  let environment: BuildEnvironment;
  if (isExpoGo) {
    environment = 'expo-go';
  } else if (isDevelopmentBuild) {
    environment = 'development-build';
  } else {
    environment = 'production-build';
  }
  
  // Determine Firebase SDK capabilities
  // Check if @react-native-firebase is available
  let canUseNativeFirebase = false;
  try {
    require('@react-native-firebase/auth');
    canUseNativeFirebase = !isExpoGo && Platform.OS !== 'web';
  } catch (error) {
    canUseNativeFirebase = false;
  }
  
  const shouldUseExpoFirebaseRecaptcha = isExpoGo || Platform.OS === 'web' || !canUseNativeFirebase;
  
  return {
    environment,
    isExpoGo,
    isDevelopmentBuild,
    isProductionBuild,
    canUseNativeFirebase,
    shouldUseExpoFirebaseRecaptcha,
  };
}

/**
 * Get Firebase SMS authentication method based on environment
 */
export function getFirebaseSMSMethod(): 'expo-firebase-recaptcha' | 'react-native-firebase' | 'web-firebase' | 'backend-only' {
  const env = detectBuildEnvironment();
  
  if (env.isExpoGo) {
    // Expo Go: Use Firebase Web SDK with custom reCAPTCHA
    return 'expo-firebase-recaptcha';
  } else if (env.canUseNativeFirebase) {
    return 'react-native-firebase';
  } else if (Platform.OS === 'web') {
    return 'web-firebase';
  } else {
    return 'backend-only';
  }
}

/**
 * Log environment information for debugging
 */
export function logEnvironmentInfo(): void {
  const env = detectBuildEnvironment();
  const smsMethod = getFirebaseSMSMethod();
  
  logger.debug('🔍 Build Environment Detection:');
  logger.debug(`   Environment: ${env.environment}`);
  logger.debug(`   App Ownership: ${Constants.appOwnership}`);
  logger.debug(`   Platform: ${Platform.OS}`);
  logger.debug(`   Can Use Native Firebase: ${env.canUseNativeFirebase}`);
  logger.debug(`   Should Use Expo Firebase reCAPTCHA: ${env.shouldUseExpoFirebaseRecaptcha}`);
  logger.debug(`   SMS Method: ${smsMethod}`);
  logger.debug(`   EAS Project ID: ${(Constants?.expoConfig as any)?.extra?.eas?.projectId || 'Not available'}`);
}
