import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { logger } from "@/utils/logger";

/**
 * Push Notification Service
 * Handles Expo SDK 54 push token registration with EAS projectId
 * Fixes: "Invalid projectId" + /notifications/register-token not found
 */

/**
 * Register push token for user with proper EAS projectId
 */
export async function registerPushToken(userId: string): Promise<string> {
  try {
    logger.info(`[PushService] 🚀 Registering push token for user: ${userId}`);

    // Get EAS projectId from app config
    const projectId =
      (Constants?.expoConfig as any)?.extra?.eas?.projectId ||
      (Constants as any)?.easConfig?.projectId;
    
    if (!projectId) {
      throw new Error("Missing EAS projectId in app configuration");
    }

    logger.info(`[PushService] Using EAS projectId: ${projectId}`);

    // Request notification permissions
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== "granted") {
      throw new Error("Push notification permission denied");
    }

    logger.info(`[PushService] ✅ Push permissions granted`);

    // Get Expo push token
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    
    logger.info(`[PushService] ✅ Expo push token generated: ${token.substring(0, 20)}...`);

    // Generate device ID
    const deviceId = `${userId}-${Platform.OS}-${Constants.deviceName || "dev"}`;
    
    // Register token with backend
    const apiUrl = process.env.EXPO_PUBLIC_API_URL || "http://localhost:4000";
    const response = await fetch(`${apiUrl}/notifications/register-token`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${await getAuthToken()}`
      },
      body: JSON.stringify({
        userId,
        token,
        deviceId,
        platform: Platform.OS
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Backend registration failed: ${response.status} ${errorText}`);
    }

    const result = await response.json();
    logger.info(`[PushService] ✅ Token registered with backend:`, result);

    return token;

  } catch (error: any) {
    logger.error(`[PushService] ❌ Push token registration failed:`, error);
    
    // Handle specific error cases
    if (error.message.includes("Missing EAS projectId")) {
      logger.error(`[PushService] EAS projectId not found in app config`);
    } else if (error.message.includes("permission denied")) {
      logger.error(`[PushService] User denied push notification permissions`);
    } else if (error.message.includes("Backend registration failed")) {
      logger.error(`[PushService] Backend API error - check server logs`);
    }
    
    throw error;
  }
}

/**
 * Get current auth token for API requests
 */
async function getAuthToken(): Promise<string> {
  try {
    // Import auth from Firebase config
    const { auth } = await import("@/config/firebase");
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      throw new Error("No authenticated user");
    }
    
    return await currentUser.getIdToken();
  } catch (error) {
    logger.error(`[PushService] Failed to get auth token:`, error);
    throw error;
  }
}

/**
 * Check if push notifications are supported
 */
export function isPushNotificationSupported(): boolean {
  // Check if we're in Expo Go (limited push support)
  if (Constants.appOwnership === "expo") {
    logger.warn(`[PushService] Running in Expo Go - push notifications limited`);
    return false;
  }
  
  // Check if EAS projectId is available
  const projectId =
    (Constants?.expoConfig as any)?.extra?.eas?.projectId ||
    (Constants as any)?.easConfig?.projectId;
  
  if (!projectId) {
    logger.warn(`[PushService] No EAS projectId - push notifications unavailable`);
    return false;
  }
  
  return true;
}

/**
 * Safe push token registration with error handling
 * Returns null if registration fails, doesn't throw
 */
export async function registerPushTokenSafely(userId: string): Promise<string | null> {
  try {
    // Check if push notifications are supported
    if (!isPushNotificationSupported()) {
      logger.info(`[PushService] Push notifications not supported - skipping registration`);
      return null;
    }
    
    const token = await registerPushToken(userId);
    logger.info(`[PushService] ✅ Push token registration successful`);
    return token;
    
  } catch (error: any) {
    logger.warn(`[PushService] ⚠️ Push token registration failed (non-critical):`, error);
    return null;
  }
}

/**
 * Configure notification handlers
 */
export function configureNotificationHandlers() {
  // Set notification handler
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });

  logger.info(`[PushService] ✅ Notification handlers configured`);
}
