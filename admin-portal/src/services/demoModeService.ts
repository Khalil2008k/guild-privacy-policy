/**
 * Demo Mode Service
 * Manages demo mode state, Guild Coins, and PSP configuration
 */

import { doc, getDoc, updateDoc, collection, writeBatch, query, getDocs } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { generateDemoUsers, generateDemoJobs, generateDemoGuilds } from '../utils/demoData';

export interface DemoModeConfig {
  isDemoMode: boolean;
  betaCoinsPerUser: number;
  pspApiEnabled: boolean;
  pspApiProvider: string;
  pspApiKey: string;
  pspApiSecret: string;
  pspWebhookSecret: string;
  pspMerchantId?: string;
  supportedCurrencies: string[];
  supportedPaymentMethods: string[];
  conversionRate: number;
  enabledAt?: Date;
  disabledAt?: Date;
  updatedBy?: string;
  updatedAt?: Date;
}

class DemoModeService {
  private configDoc = doc(db, 'systemSettings', 'demoMode');

  /**
   * Get current demo mode configuration
   */
  async getConfig(): Promise<DemoModeConfig> {
    try {
      const docSnap = await getDoc(this.configDoc);
      
      if (docSnap.exists()) {
        return docSnap.data() as DemoModeConfig;
      }

      // Default configuration
      return this.getDefaultConfig();
    } catch (error) {
      console.error('Error loading demo mode config:', error);
      return this.getDefaultConfig();
    }
  }

  /**
   * Get default demo mode configuration
   */
  getDefaultConfig(): DemoModeConfig {
    return {
      isDemoMode: true,
      betaCoinsPerUser: 300,
      pspApiEnabled: false,
      pspApiProvider: '',
      pspApiKey: '',
      pspApiSecret: '',
      pspWebhookSecret: '',
      supportedCurrencies: ['Guild Coins', 'QAR'],
      supportedPaymentMethods: ['manual'],
      conversionRate: 1.0
    };
  }

  /**
   * Enable demo mode
   */
  async enableDemoMode(adminUserId: string): Promise<void> {
    try {
      const config = await this.getConfig();
      
      await updateDoc(this.configDoc, {
        ...config,
        isDemoMode: true,
        enabledAt: new Date(),
        updatedBy: adminUserId,
        updatedAt: new Date()
      });

      console.log('✅ Demo mode enabled successfully');
    } catch (error) {
      console.error('Error enabling demo mode:', error);
      throw new Error('Failed to enable demo mode');
    }
  }

  /**
   * Disable demo mode (requires PSP configuration)
   */
  async disableDemoMode(adminUserId: string): Promise<void> {
    try {
      const config = await this.getConfig();

      // Validate PSP configuration
      if (!config.pspApiEnabled || !config.pspApiProvider || !config.pspApiKey) {
        throw new Error('PSP API must be configured before disabling demo mode');
      }

      await updateDoc(this.configDoc, {
        ...config,
        isDemoMode: false,
        disabledAt: new Date(),
        updatedBy: adminUserId,
        updatedAt: new Date()
      });

      console.log('✅ Demo mode disabled successfully');
    } catch (error) {
      console.error('Error disabling demo mode:', error);
      throw error;
    }
  }

  /**
   * Update PSP API configuration
   */
  async updatePSPConfig(config: Partial<DemoModeConfig>, adminUserId: string): Promise<void> {
    try {
      const currentConfig = await this.getConfig();

      await updateDoc(this.configDoc, {
        ...currentConfig,
        ...config,
        updatedBy: adminUserId,
        updatedAt: new Date()
      });

      console.log('✅ PSP configuration updated successfully');
    } catch (error) {
      console.error('Error updating PSP config:', error);
      throw new Error('Failed to update PSP configuration');
    }
  }

  /**
   * Distribute Guild Coins to all users
   */
  async distributeGuildCoins(amount: number, adminUserId: string): Promise<{ success: number; failed: number }> {
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const batch = writeBatch(db);
      let successCount = 0;
      let failCount = 0;

      usersSnapshot.docs.forEach(userDoc => {
        try {
          const userRef = doc(db, 'users', userDoc.id);
          const currentCoins = userDoc.data().guildCoins || 0;
          
          batch.update(userRef, {
            guildCoins: currentCoins + amount,
            lastCoinDistribution: new Date(),
            lastCoinAmount: amount,
            distributedBy: adminUserId
          });
          
          successCount++;
        } catch {
          failCount++;
        }
      });

      await batch.commit();
      console.log(`✅ Distributed ${amount} Guild Coins to ${successCount} users`);

      return { success: successCount, failed: failCount };
    } catch (error) {
      console.error('Error distributing Guild Coins:', error);
      throw new Error('Failed to distribute Guild Coins');
    }
  }

  /**
   * Seed demo data into Firestore
   */
  async seedDemoData(adminUserId: string): Promise<void> {
    try {
      const batch = writeBatch(db);

      // Seed users
      const demoUsers = generateDemoUsers();
      demoUsers.forEach(user => {
        const userRef = doc(db, 'users', user.id);
        batch.set(userRef, {
          ...user,
          isDemo: true,
          seededAt: new Date(),
          seededBy: adminUserId
        });
      });

      // Seed jobs
      const demoJobs = generateDemoJobs();
      demoJobs.forEach(job => {
        const jobRef = doc(db, 'jobs', job.id);
        batch.set(jobRef, {
          ...job,
          isDemo: true,
          seededAt: new Date(),
          seededBy: adminUserId
        });
      });

      // Seed guilds
      const demoGuilds = generateDemoGuilds();
      demoGuilds.forEach(guild => {
        const guildRef = doc(db, 'guilds', guild.id);
        batch.set(guildRef, {
          ...guild,
          isDemo: true,
          seededAt: new Date(),
          seededBy: adminUserId
        });
      });

      await batch.commit();
      console.log('✅ Demo data seeded successfully');
    } catch (error) {
      console.error('Error seeding demo data:', error);
      throw new Error('Failed to seed demo data');
    }
  }

  /**
   * Clear all demo data
   */
  async clearDemoData(): Promise<void> {
    try {
      // Query and delete all demo-marked documents
      const collections = ['users', 'jobs', 'guilds', 'transactions'];
      
      for (const collectionName of collections) {
        const q = query(collection(db, collectionName));
        const snapshot = await getDocs(q);
        const batch = writeBatch(db);

        snapshot.docs.forEach(docSnap => {
          if (docSnap.data().isDemo === true) {
            batch.delete(docSnap.ref);
          }
        });

        await batch.commit();
      }

      console.log('✅ Demo data cleared successfully');
    } catch (error) {
      console.error('Error clearing demo data:', error);
      throw new Error('Failed to clear demo data');
    }
  }

  /**
   * Validate PSP configuration
   */
  validatePSPConfig(config: Partial<DemoModeConfig>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!config.pspApiProvider || config.pspApiProvider === '') {
      errors.push('PSP provider is required');
    }

    if (!config.pspApiKey || config.pspApiKey.trim() === '') {
      errors.push('PSP API key is required');
    }

    if (!config.pspApiSecret || config.pspApiSecret.trim() === '') {
      errors.push('PSP API secret is required');
    }

    if (!config.pspWebhookSecret || config.pspWebhookSecret.trim() === '') {
      errors.push('PSP webhook secret is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Test PSP connection
   */
  async testPSPConnection(config: DemoModeConfig): Promise<{ success: boolean; message: string }> {
    try {
      // Mock PSP connection test
      // In production, this would call the actual PSP API
      
      if (!config.pspApiKey || !config.pspApiSecret) {
        return {
          success: false,
          message: 'API credentials are missing'
        };
      }

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      return {
        success: true,
        message: 'PSP connection successful'
      };
    } catch (error) {
      return {
        success: false,
        message: `Connection failed: ${error}`
      };
    }
  }

  /**
   * Calculate conversion from Guild Coins to QAR
   */
  convertCoinsToQAR(coins: number, rate: number = 1.0): number {
    return coins * rate;
  }

  /**
   * Calculate conversion from QAR to Guild Coins
   */
  convertQARToCoins(qar: number, rate: number = 1.0): number {
    return qar / rate;
  }
}

export const demoModeService = new DemoModeService();
export default demoModeService;

