/**
 * useAdminTestHandlers Hook
 * 
 * COMMENT: PRIORITY 1 - File Modularization
 * Extracted from home.tsx (lines 267-421)
 * Purpose: Handles all admin portal test functions for announcements, rules, contracts, terms, and payments
 */

import { useCallback } from 'react';
import { router } from 'expo-router';
import { CustomAlertService } from '../../../services/CustomAlertService';
import { logger } from '../../../utils/logger';

interface UseAdminTestHandlersReturn {
  handleTestNotification: () => Promise<void>;
  handleTestRules: () => Promise<void>;
  handleTestContract: () => Promise<void>;
  handleTestTerms: () => Promise<void>;
  handleTestPayment: () => void;
}

export const useAdminTestHandlers = (): UseAdminTestHandlersReturn => {
  // Admin Portal Test Functions - Testing actual features from admin portal
  const handleTestNotification = useCallback(async () => {
    try {
      // Fetch announcements from admin portal
      const response = await fetch('https://guild-yf7q.onrender.com/api/admin/announcements', {
        method: 'GET'
      });
      
      if (response.ok) {
        const announcements = await response.json();
        if (announcements.length > 0) {
          const latest = announcements[0];
          CustomAlertService.showAlert(
            '📢 Latest Announcement', 
            `${latest.title}\n\n${latest.message}\n\nSent by Admin at ${new Date(latest.createdAt).toLocaleString()}`
          );
          logger.debug('📢 All Announcements:', announcements);
        } else {
          CustomAlertService.showAlert('No Announcements', 'No announcements have been sent by admin yet. Create one in the admin portal!');
        }
      } else {
        CustomAlertService.showAlert('Error', `Failed to fetch announcements (Status: ${response.status})`);
      }
    } catch (error) {
      logger.error('Notification Test Error:', error);
      CustomAlertService.showAlert('Error', 'Cannot connect to admin announcements API.');
    }
  }, []);

  const handleTestRules = useCallback(async () => {
    try {
      // Fetch platform rules from admin portal
      const response = await fetch('https://guild-yf7q.onrender.com/api/admin/contract-terms/rules', {
        method: 'GET'
      });
      
      if (response.ok) {
        const rules = await response.json();
        if (rules.length > 0) {
          const rulesList = rules.map((rule: any, index: number) => 
            `${index + 1}. ${rule.text}`
          ).join('\n\n');
          CustomAlertService.showAlert('📜 Platform Rules', rulesList);
          logger.debug('📜 All Platform Rules:', rules);
        } else {
          CustomAlertService.showAlert('No Rules', 'No platform rules have been set. Add rules in the admin portal!');
        }
      } else {
        CustomAlertService.showAlert('Error', `Failed to fetch rules (Status: ${response.status})`);
      }
    } catch (error) {
      logger.error('Rules Test Error:', error);
      CustomAlertService.showAlert('Error', 'Cannot connect to platform rules API.');
    }
  }, []);

  const handleTestContract = useCallback(async () => {
    try {
      // Fetch contract template with all rules and guidelines
      const [rulesResponse, guidelinesResponse] = await Promise.all([
        fetch('https://guild-yf7q.onrender.com/api/admin/contract-terms/rules'),
        fetch('https://guild-yf7q.onrender.com/api/admin/contract-terms/guidelines')
      ]);
      
      if (rulesResponse.ok && guidelinesResponse.ok) {
        const rules = await rulesResponse.json();
        const guidelines = await guidelinesResponse.json();
        
        // Generate a sample contract with current rules
        const contract = {
          jobId: 'TEST-JOB-001',
          jobTitle: 'Sample Mobile App Development',
          clientName: 'Test Client',
          freelancerName: 'Test Freelancer',
          amount: 5000,
          currency: 'QAR',
          platformRules: rules,
          guidelines: guidelines,
          generatedAt: new Date().toISOString()
        };
        
        const contractSummary = `
📄 Contract Generated

Job: ${contract.jobTitle}
Amount: ${contract.amount} ${contract.currency}

Platform Rules: ${rules.length}
Guidelines: ${guidelines.length}

✅ This contract includes all current rules and guidelines from the admin portal.

Check console for full contract details.
        `.trim();
        
        CustomAlertService.showAlert('Contract Preview', contractSummary);
        logger.debug('📄 Full Contract:', contract);
      } else {
        CustomAlertService.showAlert('Error', 'Failed to generate contract. Check if rules and guidelines are set in admin portal.');
      }
    } catch (error) {
      logger.error('Contract Test Error:', error);
      CustomAlertService.showAlert('Error', 'Cannot generate contract from admin portal data.');
    }
  }, []);

  const handleTestTerms = useCallback(async () => {
    try {
      // Fetch all terms, rules, and guidelines
      const [rulesResponse, guidelinesResponse, announcementsResponse] = await Promise.all([
        fetch('https://guild-yf7q.onrender.com/api/admin/contract-terms/rules'),
        fetch('https://guild-yf7q.onrender.com/api/admin/contract-terms/guidelines'),
        fetch('https://guild-yf7q.onrender.com/api/admin/announcements')
      ]);
      
      const rules = rulesResponse.ok ? await rulesResponse.json() : [];
      const guidelines = guidelinesResponse.ok ? await guidelinesResponse.json() : [];
      const announcements = announcementsResponse.ok ? await announcementsResponse.json() : [];
      
      const termsSummary = `
📚 Platform Terms & Rules

📜 Platform Rules: ${rules.length}
📋 Guidelines: ${guidelines.length}
📢 Announcements: ${announcements.length}

All terms are managed through the Admin Portal and update in real-time.

Check console for full details.
      `.trim();
      
      CustomAlertService.showAlert('Terms & Guidelines', termsSummary);
      
      logger.debug('📜 Platform Rules:', rules);
      logger.debug('📋 Guidelines:', guidelines);
      logger.debug('📢 Announcements:', announcements);
    } catch (error) {
      logger.error('Terms Test Error:', error);
      CustomAlertService.showAlert('Error', 'Cannot fetch terms and guidelines from admin portal.');
    }
  }, []);

  // Test payment function
  const handleTestPayment = useCallback(() => {
    // Navigate to payment screen with test data
    router.push({
      pathname: '/(modals)/payment',
      params: {
        amount: '100',
        orderId: `TEST-${Date.now()}`,
        jobId: 'test-job-123',
        description: 'Test Payment - Sadad PSP Integration',
      }
    });
  }, []);

  return {
    handleTestNotification,
    handleTestRules,
    handleTestContract,
    handleTestTerms,
    handleTestPayment,
  };
};







