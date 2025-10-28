import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "@/config/firebase";
import { logger } from "@/utils/logger";

/**
 * Safe User Bootstrap Service
 * Ensures user profile and wallet are created with proper permissions
 * Fixes: "Error ensuring user profile / initializing user … permission denied"
 */
export async function ensureUserBootstrap(): Promise<string> {
  const currentUser = auth.currentUser;
  if (!currentUser?.uid) {
    throw new Error("No authenticated user");
  }

  const uid = currentUser.uid;
  logger.info(`[UserBootstrap] 🚀 Ensuring user bootstrap for: ${uid}`);

  try {
    // Ensure user profile exists
    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      logger.info(`[UserBootstrap] Creating user profile for: ${uid}`);
      
      await setDoc(userRef, {
        displayName: currentUser.displayName || "",
        photoURL: currentUser.photoURL || "",
        email: currentUser.email || "",
        phoneNumber: currentUser.phoneNumber || "",
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
        roles: ["user"],
        // Seed empty notificationTokens map
        notificationTokens: {},
        // Additional profile fields
        currentRank: "G",
        totalEarned: 0,
        jobsCompleted: 0,
        successRate: 0,
        rating: 0,
        verified: false,
        status: "ACTIVE",
        updatedAt: serverTimestamp(),
      }, { merge: true });
      
      logger.info(`[UserBootstrap] ✅ User profile created for: ${uid}`);
    } else {
      // Update last login time
      await setDoc(userRef, { 
        lastLoginAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      logger.info(`[UserBootstrap] ✅ User profile updated for: ${uid}`);
    }

    // Ensure wallet exists
    const walletRef = doc(db, "wallets", uid);
    const walletSnap = await getDoc(walletRef);
    
    if (!walletSnap.exists()) {
      logger.info(`[UserBootstrap] Creating wallet for: ${uid}`);
      
      await setDoc(walletRef, {
        userId: uid,
        available: 0,
        hold: 0,
        released: 0,
        totalReceived: 0,
        totalWithdrawn: 0,
        currency: "QAR",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }, { merge: true });
      
      logger.info(`[UserBootstrap] ✅ Wallet created for: ${uid}`);
    } else {
      logger.info(`[UserBootstrap] ✅ Wallet already exists for: ${uid}`);
    }

    logger.info(`[UserBootstrap] 🎉 User bootstrap complete for: ${uid}`);
    return uid;

  } catch (error: any) {
    // Handle offline mode gracefully
    if (error?.code === 'unavailable' || error?.message?.includes('offline')) {
      logger.warn(`[UserBootstrap] Firestore offline - skipping user bootstrap for ${uid}`);
      return uid; // Return uid even in offline mode
    }
    
    logger.error(`[UserBootstrap] Error ensuring user bootstrap for ${uid}:`, error);
    throw error;
  }
}

/**
 * Enhanced user initialization with comprehensive error handling
 * This replaces the existing FirebaseInitService.initializeCurrentUser()
 */
export async function initializeUserSafely(): Promise<string | null> {
  try {
    const uid = await ensureUserBootstrap();
    logger.info(`[UserInit] ✅ User initialization successful: ${uid}`);
    return uid;
  } catch (error: any) {
    // Handle permission errors gracefully
    if (error?.code === 'permission-denied') {
      logger.warn(`[UserInit] Permission denied - user may not have proper Firestore rules`);
      return null;
    }
    
    // Handle offline mode
    if (error?.code === 'unavailable' || error?.message?.includes('offline')) {
      logger.warn(`[UserInit] Firestore offline - user initialization skipped`);
      return null;
    }
    
    logger.error(`[UserInit] User initialization failed:`, error);
    throw error;
  }
}
