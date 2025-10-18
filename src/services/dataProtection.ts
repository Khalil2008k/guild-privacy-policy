/**
 * Data Protection & Privacy Compliance Service
 * GDPR, CCPA, and enterprise privacy compliance
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '../utils/logger';
import { auth, db } from '../config/firebase';
import { doc, setDoc, getDoc, deleteDoc, updateDoc, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore';

// Privacy consent types
export enum ConsentType {
  ESSENTIAL = 'essential',
  ANALYTICS = 'analytics',
  MARKETING = 'marketing',
  PERSONALIZATION = 'personalization',
  THIRD_PARTY = 'third_party'
}

// Data processing purposes
export enum ProcessingPurpose {
  AUTHENTICATION = 'authentication',
  SERVICE_PROVISION = 'service_provision',
  COMMUNICATION = 'communication',
  ANALYTICS = 'analytics',
  MARKETING = 'marketing',
  LEGAL_COMPLIANCE = 'legal_compliance',
  SECURITY = 'security'
}

// Data retention periods (in days)
export const DataRetentionPeriods = {
  USER_PROFILE: 2555, // 7 years
  TRANSACTION_DATA: 2555, // 7 years (legal requirement)
  ANALYTICS_DATA: 1095, // 3 years
  MARKETING_DATA: 730, // 2 years
  SESSION_DATA: 30, // 30 days
  AUDIT_LOGS: 2555, // 7 years
  CHAT_MESSAGES: 1095, // 3 years
  JOB_DATA: 1825, // 5 years
  SUPPORT_TICKETS: 1095 // 3 years
};

// User consent record
export interface ConsentRecord {
  userId: string;
  consentType: ConsentType;
  granted: boolean;
  timestamp: Date;
  version: string;
  ipAddress?: string;
  userAgent?: string;
  method: 'explicit' | 'implicit' | 'opt_out';
}

// Data processing record
export interface DataProcessingRecord {
  userId: string;
  dataType: string;
  purpose: ProcessingPurpose;
  legalBasis: 'consent' | 'contract' | 'legal_obligation' | 'vital_interests' | 'public_task' | 'legitimate_interests';
  timestamp: Date;
  retentionPeriod: number;
  thirdParties?: string[];
}

// Privacy settings
export interface PrivacySettings {
  profileVisibility: 'public' | 'guild_members' | 'private';
  showEmail: boolean;
  showLocation: boolean;
  showOnlineStatus: boolean;
  allowDirectMessages: boolean;
  allowNotifications: boolean;
  allowAnalytics: boolean;
  allowMarketing: boolean;
  allowThirdPartySharing: boolean;
  dataRetentionPreference: 'minimum' | 'standard' | 'extended';
}

// Data export format
export interface DataExportPackage {
  exportId: string;
  userId: string;
  requestDate: Date;
  completionDate?: Date;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  downloadUrl?: string;
  expiryDate?: Date;
  data: {
    profile?: any;
    jobs?: any[];
    guilds?: any[];
    messages?: any[];
    transactions?: any[];
    analytics?: any;
  };
}

class DataProtectionService {
  private consentVersion = '1.0';

  /**
   * Record user consent
   */
  async recordConsent(
    userId: string,
    consentType: ConsentType,
    granted: boolean,
    method: 'explicit' | 'implicit' | 'opt_out' = 'explicit'
  ): Promise<void> {
    try {
      const consentRecord: ConsentRecord = {
        userId,
        consentType,
        granted,
        timestamp: new Date(),
        version: this.consentVersion,
        method
      };

      // Store in Firestore
      await setDoc(
        doc(db, 'privacy_consents', `${userId}_${consentType}_${Date.now()}`),
        {
          ...consentRecord,
          timestamp: serverTimestamp()
        }
      );

      // Update user's current consent status
      await updateDoc(doc(db, 'users', userId), {
        [`consents.${consentType}`]: {
          granted,
          timestamp: serverTimestamp(),
          version: this.consentVersion
        }
      });

      logger.info('Consent recorded', { userId, consentType, granted, method });
    } catch (error: any) {
      logger.error('Failed to record consent', { userId, consentType, error: error.message });
      throw error;
    }
  }

  /**
   * Check if user has given consent
   */
  async hasConsent(userId: string, consentType: ConsentType): Promise<boolean> {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      
      if (!userDoc.exists()) {
        return false;
      }

      const userData = userDoc.data();
      const consent = userData.consents?.[consentType];
      
      return consent?.granted === true;
    } catch (error: any) {
      logger.error('Failed to check consent', { userId, consentType, error: error.message });
      return false;
    }
  }

  /**
   * Record data processing activity
   */
  async recordDataProcessing(record: DataProcessingRecord): Promise<void> {
    try {
      await setDoc(
        doc(db, 'data_processing_records', `${record.userId}_${Date.now()}`),
        {
          ...record,
          timestamp: serverTimestamp()
        }
      );

      logger.info('Data processing recorded', { 
        userId: record.userId, 
        dataType: record.dataType, 
        purpose: record.purpose 
      });
    } catch (error: any) {
      logger.error('Failed to record data processing', { 
        userId: record.userId, 
        error: error.message 
      });
    }
  }

  /**
   * Update user privacy settings
   */
  async updatePrivacySettings(userId: string, settings: Partial<PrivacySettings>): Promise<void> {
    try {
      await updateDoc(doc(db, 'users', userId), {
        privacySettings: settings,
        updatedAt: serverTimestamp()
      });

      // Record the privacy settings change
      await this.recordDataProcessing({
        userId,
        dataType: 'privacy_settings',
        purpose: ProcessingPurpose.SERVICE_PROVISION,
        legalBasis: 'consent',
        timestamp: new Date(),
        retentionPeriod: DataRetentionPeriods.USER_PROFILE
      });

      logger.info('Privacy settings updated', { userId, settings });
    } catch (error: any) {
      logger.error('Failed to update privacy settings', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Get user privacy settings
   */
  async getPrivacySettings(userId: string): Promise<PrivacySettings | null> {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      
      if (!userDoc.exists()) {
        return null;
      }

      const userData = userDoc.data();
      return userData.privacySettings || this.getDefaultPrivacySettings();
    } catch (error: any) {
      logger.error('Failed to get privacy settings', { userId, error: error.message });
      return null;
    }
  }

  /**
   * Request data export (GDPR Article 20)
   */
  async requestDataExport(userId: string): Promise<string> {
    try {
      const exportId = `export_${userId}_${Date.now()}`;
      
      const exportRequest: Partial<DataExportPackage> = {
        exportId,
        userId,
        requestDate: new Date(),
        status: 'pending'
      };

      await setDoc(doc(db, 'data_export_requests', exportId), {
        ...exportRequest,
        requestDate: serverTimestamp()
      });

      // Start async data collection
      this.processDataExport(exportId, userId);

      logger.info('Data export requested', { userId, exportId });
      return exportId;
    } catch (error: any) {
      logger.error('Failed to request data export', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Process data export request
   */
  private async processDataExport(exportId: string, userId: string): Promise<void> {
    try {
      // Update status to processing
      await updateDoc(doc(db, 'data_export_requests', exportId), {
        status: 'processing'
      });

      // Collect user data
      const exportData: DataExportPackage['data'] = {};

      // Get user profile
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        exportData.profile = userDoc.data();
      }

      // Get user jobs
      const jobsQuery = query(collection(db, 'jobs'), where('createdBy', '==', userId));
      const jobsSnapshot = await getDocs(jobsQuery);
      exportData.jobs = jobsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Get user guild memberships
      const guildsQuery = query(collection(db, 'guild_members'), where('userId', '==', userId));
      const guildsSnapshot = await getDocs(guildsQuery);
      exportData.guilds = guildsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Get user messages (limited for privacy)
      const messagesQuery = query(collection(db, 'messages'), where('senderId', '==', userId));
      const messagesSnapshot = await getDocs(messagesQuery);
      exportData.messages = messagesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Complete the export
      const completionDate = new Date();
      const expiryDate = new Date(completionDate.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

      await updateDoc(doc(db, 'data_export_requests', exportId), {
        status: 'completed',
        completionDate: serverTimestamp(),
        expiryDate: serverTimestamp(),
        data: exportData
      });

      logger.info('Data export completed', { userId, exportId });
    } catch (error: any) {
      logger.error('Data export failed', { userId, exportId, error: error.message });
      
      await updateDoc(doc(db, 'data_export_requests', exportId), {
        status: 'failed'
      });
    }
  }

  /**
   * Request data deletion (GDPR Article 17 - Right to be forgotten)
   */
  async requestDataDeletion(userId: string, reason?: string): Promise<void> {
    try {
      // Record deletion request
      await setDoc(doc(db, 'data_deletion_requests', `${userId}_${Date.now()}`), {
        userId,
        requestDate: serverTimestamp(),
        reason: reason || 'User requested account deletion',
        status: 'pending'
      });

      // Start deletion process
      await this.processDataDeletion(userId);

      logger.info('Data deletion requested', { userId, reason });
    } catch (error: any) {
      logger.error('Failed to request data deletion', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Process data deletion request
   */
  private async processDataDeletion(userId: string): Promise<void> {
    try {
      // Anonymize user data instead of hard delete (for legal compliance)
      const anonymizedData = {
        email: `deleted_user_${Date.now()}@example.com`,
        displayName: 'Deleted User',
        firstName: 'Deleted',
        lastName: 'User',
        bio: '',
        location: '',
        photoURL: null,
        isActive: false,
        deletedAt: serverTimestamp(),
        anonymized: true
      };

      await updateDoc(doc(db, 'users', userId), anonymizedData);

      // Anonymize related data
      await this.anonymizeUserData(userId);

      logger.info('User data anonymized', { userId });
    } catch (error: any) {
      logger.error('Failed to process data deletion', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Anonymize user data across collections
   */
  private async anonymizeUserData(userId: string): Promise<void> {
    try {
      // Anonymize job posts
      const jobsQuery = query(collection(db, 'jobs'), where('createdBy', '==', userId));
      const jobsSnapshot = await getDocs(jobsQuery);
      
      for (const jobDoc of jobsSnapshot.docs) {
        await updateDoc(jobDoc.ref, {
          createdBy: 'deleted_user',
          createdByName: 'Deleted User'
        });
      }

      // Anonymize messages
      const messagesQuery = query(collection(db, 'messages'), where('senderId', '==', userId));
      const messagesSnapshot = await getDocs(messagesQuery);
      
      for (const messageDoc of messagesSnapshot.docs) {
        await updateDoc(messageDoc.ref, {
          senderId: 'deleted_user',
          senderName: 'Deleted User',
          content: '[Message from deleted user]'
        });
      }

      logger.info('User data anonymized across collections', { userId });
    } catch (error: any) {
      logger.error('Failed to anonymize user data', { userId, error: error.message });
    }
  }

  /**
   * Clean up expired data
   */
  async cleanupExpiredData(): Promise<void> {
    try {
      const now = new Date();
      
      // Clean up expired export requests
      const expiredExportsQuery = query(
        collection(db, 'data_export_requests'),
        where('expiryDate', '<', now)
      );
      
      const expiredExportsSnapshot = await getDocs(expiredExportsQuery);
      
      for (const exportDoc of expiredExportsSnapshot.docs) {
        await deleteDoc(exportDoc.ref);
      }

      logger.info('Expired data cleaned up', { 
        expiredExports: expiredExportsSnapshot.size 
      });
    } catch (error: any) {
      logger.error('Failed to cleanup expired data', { error: error.message });
    }
  }

  /**
   * Get default privacy settings
   */
  private getDefaultPrivacySettings(): PrivacySettings {
    return {
      profileVisibility: 'public',
      showEmail: false,
      showLocation: true,
      showOnlineStatus: true,
      allowDirectMessages: true,
      allowNotifications: true,
      allowAnalytics: false,
      allowMarketing: false,
      allowThirdPartySharing: false,
      dataRetentionPreference: 'standard'
    };
  }

  /**
   * Check if data processing is compliant
   */
  async isProcessingCompliant(
    userId: string,
    dataType: string,
    purpose: ProcessingPurpose
  ): Promise<boolean> {
    try {
      // Check if user has given appropriate consent
      const requiredConsent = this.getRequiredConsent(purpose);
      
      if (requiredConsent) {
        const hasConsent = await this.hasConsent(userId, requiredConsent);
        if (!hasConsent) {
          return false;
        }
      }

      // Check data retention limits
      const retentionPeriod = this.getRetentionPeriod(dataType);
      // Additional checks can be added here

      return true;
    } catch (error: any) {
      logger.error('Failed to check processing compliance', { 
        userId, 
        dataType, 
        purpose, 
        error: error.message 
      });
      return false;
    }
  }

  /**
   * Get required consent type for processing purpose
   */
  private getRequiredConsent(purpose: ProcessingPurpose): ConsentType | null {
    const consentMapping = {
      [ProcessingPurpose.ANALYTICS]: ConsentType.ANALYTICS,
      [ProcessingPurpose.MARKETING]: ConsentType.MARKETING,
      [ProcessingPurpose.AUTHENTICATION]: null, // Essential, no consent required
      [ProcessingPurpose.SERVICE_PROVISION]: null, // Essential, no consent required
      [ProcessingPurpose.COMMUNICATION]: ConsentType.ESSENTIAL,
      [ProcessingPurpose.LEGAL_COMPLIANCE]: null, // Legal basis, no consent required
      [ProcessingPurpose.SECURITY]: null // Essential, no consent required
    };

    return consentMapping[purpose] || null;
  }

  /**
   * Get retention period for data type
   */
  private getRetentionPeriod(dataType: string): number {
    return DataRetentionPeriods[dataType as keyof typeof DataRetentionPeriods] || 
           DataRetentionPeriods.USER_PROFILE;
  }
}

// Export singleton instance
export const dataProtection = new DataProtectionService();
export default dataProtection;

