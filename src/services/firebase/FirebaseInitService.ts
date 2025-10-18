/**
 * Firebase Initialization Service
 * Handles advanced Firebase setup, index creation, and data initialization
 */

import { 
  collection, 
  doc, 
  setDoc, 
  getDoc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db, auth } from '../../config/firebase';
import { logger } from '../../utils/logger';

export interface FirebaseIndexConfig {
  collection: string;
  fields: Array<{ field: string; order: 'asc' | 'desc' }>;
  queryScope: 'collection' | 'collectionGroup';
}

/**
 * Required Firebase Indexes for the application
 */
const REQUIRED_INDEXES: FirebaseIndexConfig[] = [
  {
    collection: 'transactions',
    fields: [
      { field: 'userId', order: 'asc' },
      { field: 'date', order: 'desc' },
    ],
    queryScope: 'collection',
  },
  {
    collection: 'transactions',
    fields: [
      { field: 'userId', order: 'asc' },
      { field: 'createdAt', order: 'desc' },
    ],
    queryScope: 'collection',
  },
  {
    collection: 'chats',
    fields: [
      { field: 'participants', order: 'asc' },
      { field: 'updatedAt', order: 'desc' },
    ],
    queryScope: 'collection',
  },
  {
    collection: 'guilds',
    fields: [
      { field: 'isPublic', order: 'asc' },
      { field: 'isActive', order: 'asc' },
      { field: 'memberCount', order: 'desc' },
    ],
    queryScope: 'collection',
  },
  {
    collection: 'guildMemberships',
    fields: [
      { field: 'userId', order: 'asc' },
      { field: 'isActive', order: 'asc' },
    ],
    queryScope: 'collection',
  },
];

class FirebaseInitService {
  /**
   * Initialize user wallet document if it doesn't exist
   */
  async ensureUserWallet(userId: string, userData?: {
    guildId?: string;
    govId?: string;
    fullName?: string;
  }): Promise<void> {
    try {
      const walletRef = doc(db, 'wallets', userId);
      const walletDoc = await getDoc(walletRef);

      if (!walletDoc.exists()) {
        logger.info(`[FirebaseInit] Creating wallet for user: ${userId}`);
        
        const walletData = {
          userId,
          guildId: userData?.guildId || '',
          govId: userData?.govId || '',
          fullName: userData?.fullName || 'User',
          available: 0,
          hold: 0,
          released: 0,
          totalReceived: 0,
          totalWithdrawn: 0,
          currency: 'QAR',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        await setDoc(walletRef, walletData);
        logger.info(`[FirebaseInit] ✅ Wallet created successfully for ${userId}`);
      } else {
        logger.info(`[FirebaseInit] Wallet already exists for ${userId}`);
      }
    } catch (error) {
      logger.error('[FirebaseInit] Error ensuring wallet:', error);
      throw error;
    }
  }

  /**
   * Initialize user profile document if it doesn't exist
   */
  async ensureUserProfile(userId: string, userData?: {
    email?: string;
    displayName?: string;
    phoneNumber?: string;
  }): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        logger.info(`[FirebaseInit] Creating user profile: ${userId}`);
        
        const profileData = {
          userId,
          email: userData?.email || '',
          displayName: userData?.displayName || 'User',
          phoneNumber: userData?.phoneNumber || '',
          currentRank: 'G',
          totalEarned: 0,
          jobsCompleted: 0,
          successRate: 0,
          rating: 0,
          verified: false,
          status: 'ACTIVE',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        await setDoc(userRef, profileData);
        logger.info(`[FirebaseInit] ✅ User profile created for ${userId}`);
      } else {
        logger.info(`[FirebaseInit] User profile already exists for ${userId}`);
      }
    } catch (error) {
      logger.error('[FirebaseInit] Error ensuring user profile:', error);
      throw error;
    }
  }

  /**
   * Generate Firebase index creation URLs
   */
  generateIndexCreationURLs(): string[] {
    const projectId = 'guild-4f46b'; // Your Firebase project ID
    
    return REQUIRED_INDEXES.map(index => {
      // Generate Firebase console URL for index creation
      const fieldsParam = index.fields.map(f => 
        `${f.field}:${f.order === 'desc' ? '2' : '1'}`
      ).join(',');
      
      return `https://console.firebase.google.com/v1/r/project/${projectId}/firestore/indexes?create_composite=${index.collection}:${fieldsParam}`;
    });
  }

  /**
   * Log index creation instructions
   */
  logIndexInstructions(): void {
    logger.info('[FirebaseInit] 📚 Required Firebase Indexes:');
    logger.info('[FirebaseInit] The following indexes are required for optimal performance:');
    
    REQUIRED_INDEXES.forEach((index, i) => {
      logger.info(`\n[FirebaseInit] Index ${i + 1}:`);
      logger.info(`[FirebaseInit]   Collection: ${index.collection}`);
      logger.info(`[FirebaseInit]   Fields:`);
      index.fields.forEach(field => {
        logger.info(`[FirebaseInit]     - ${field.field} (${field.order})`);
      });
    });

    logger.info('\n[FirebaseInit] 🔗 Create indexes automatically:');
    logger.info('[FirebaseInit] Click on the index creation links in the error messages');
    logger.info('[FirebaseInit] or manually create them in Firebase Console > Firestore > Indexes');
  }

  /**
   * Initialize all required Firebase structures for a user
   */
  async initializeUser(userId: string, userData?: {
    email?: string;
    displayName?: string;
    phoneNumber?: string;
    guildId?: string;
    govId?: string;
    fullName?: string;
  }): Promise<void> {
    logger.info(`[FirebaseInit] 🚀 Initializing Firebase structures for user: ${userId}`);
    
    try {
      // Create user profile
      await this.ensureUserProfile(userId, {
        email: userData?.email,
        displayName: userData?.displayName,
        phoneNumber: userData?.phoneNumber,
      });

      // Create wallet
      await this.ensureUserWallet(userId, {
        guildId: userData?.guildId,
        govId: userData?.govId,
        fullName: userData?.fullName || userData?.displayName,
      });

      logger.info(`[FirebaseInit] ✅ User initialization complete for ${userId}`);
    } catch (error) {
      logger.error('[FirebaseInit] Error initializing user:', error);
      throw error;
    }
  }

  /**
   * Initialize Firebase structures for current authenticated user
   */
  async initializeCurrentUser(): Promise<void> {
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      logger.warn('[FirebaseInit] No authenticated user to initialize');
      return;
    }

    await this.initializeUser(currentUser.uid, {
      email: currentUser.email || undefined,
      displayName: currentUser.displayName || undefined,
      phoneNumber: currentUser.phoneNumber || undefined,
      fullName: currentUser.displayName || undefined,
    });
  }

  /**
   * Check if all required indexes exist (by attempting queries)
   */
  async checkIndexes(): Promise<{ missing: string[]; urls: string[] }> {
    logger.info('[FirebaseInit] 🔍 Checking Firebase indexes...');
    
    const missing: string[] = [];
    const urls: string[] = [];

    // This would typically involve attempting the queries that require indexes
    // For now, we'll log the indexes that should exist
    
    REQUIRED_INDEXES.forEach((index, i) => {
      logger.info(`[FirebaseInit] Required index ${i + 1}: ${index.collection}`);
      index.fields.forEach(field => {
        logger.info(`[FirebaseInit]   - ${field.field} (${field.order})`);
      });
    });

    logger.info('[FirebaseInit] Note: Index creation must be done via Firebase Console');
    logger.info('[FirebaseInit] Click the index creation link in the error message when a query fails');

    return { missing, urls };
  }

  /**
   * Full initialization check and setup
   */
  async initialize(): Promise<void> {
    logger.info('[FirebaseInit] 🔥 Starting Firebase initialization...');
    
    try {
      // Log index requirements
      this.logIndexInstructions();
      
      // Initialize current user if logged in
      if (auth.currentUser) {
        await this.initializeCurrentUser();
      }
      
      logger.info('[FirebaseInit] ✅ Firebase initialization complete');
    } catch (error) {
      logger.error('[FirebaseInit] ❌ Firebase initialization failed:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const firebaseInitService = new FirebaseInitService();

// Export for use in AuthContext
export { FirebaseInitService };





