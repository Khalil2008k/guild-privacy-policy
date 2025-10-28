
// Advanced CleverTap Retention Automation
import { logger } from '../utils/logger';

export interface CleverTapCampaign {
  id: string;
  name: string;
  type: 'email' | 'push' | 'sms' | 'in_app' | 'webhook';
  status: 'draft' | 'active' | 'paused' | 'completed';
  target: RetentionTarget;
  content: RetentionContent;
  schedule: RetentionSchedule;
  analytics: RetentionAnalytics;
}

export interface RetentionTarget {
  segments: string[];
  filters: RetentionFilter[];
  exclusions: RetentionFilter[];
  behavior: {
    inactivityDays: number;
    lastActivityType: string[];
    frequency: number;
  };
}

export interface RetentionFilter {
  field: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than';
  value: any;
}

export interface RetentionContent {
  subject?: string;
  body: string;
  template?: string;
  personalization: {
    firstName: boolean;
    lastSeen: boolean;
    preferences: boolean;
    recommendations: boolean;
  };
}

export interface RetentionSchedule {
  trigger: 'time_based' | 'behavior_based' | 'event_based';
  delay: number; // days
  frequency: 'once' | 'recurring';
  timezone: string;
}

export interface RetentionAnalytics {
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  converted: number;
  retentionRate: number;
  churnPrevented: number;
}

export class CleverTapRetentionService {
  private apiKey: string;
  private apiUrl: string;
  private campaigns: Map<string, CleverTapCampaign> = new Map();

  constructor(apiKey: string, apiUrl: string = 'https://api.clevertap.com') {
    this.apiKey = apiKey;
    this.apiUrl = apiUrl;
    this.initializeDefaultCampaigns();
  }

  private initializeDefaultCampaigns() {
    const defaultCampaigns: CleverTapCampaign[] = [
      {
        id: 'inactive_user_retention',
        name: 'Inactive User Retention',
        type: 'email',
        status: 'active',
        target: {
          segments: ['inactive_users'],
          filters: [
            {
              field: 'last_activity',
              operator: 'less_than',
              value: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            }
          ],
          exclusions: [
            {
              field: 'unsubscribed',
              operator: 'equals',
              value: true
            }
          ],
          behavior: {
            inactivityDays: 30,
            lastActivityType: ['job_completed', 'profile_updated'],
            frequency: 1
          }
        },
        content: {
          subject: 'We miss you on Guild! 💭',
          body: "Hi {{firstName}}, it's been {{inactivityDays}} days since your last activity. Check out these new opportunities!",
          personalization: {
            firstName: true,
            lastSeen: true,
            preferences: true,
            recommendations: true
          }
        },
        schedule: {
          trigger: 'behavior_based',
          delay: 30,
          frequency: 'once',
          timezone: 'UTC'
        },
        analytics: {
          sent: 0,
          delivered: 0,
          opened: 0,
          clicked: 0,
          converted: 0,
          retentionRate: 0,
          churnPrevented: 0
        }
      }
    ];

    defaultCampaigns.forEach(campaign => {
      this.campaigns.set(campaign.id, campaign);
    });
  }

  // Send retention campaign
  async sendRetentionCampaign(campaignId: string, userIds: string[]): Promise<void> {
    try {
      const campaign = this.campaigns.get(campaignId);
      if (!campaign) {
        throw new Error('Campaign not found');
      }

      await this.sendToCleverTapAPI('campaigns/send', {
        campaignId,
        userIds,
        content: campaign.content,
        schedule: campaign.schedule
      });

      campaign.analytics.sent += userIds.length;
      logger.info('Retention campaign sent', { campaignId, userCount: userIds.length });

    } catch (error: any) {
      logger.error('Failed to send retention campaign', { error: error.message });
      throw error;
    }
  }

  private async sendToCleverTapAPI(endpoint: string, data: any): Promise<void> {
    try {
      const response = await fetch(`${this.apiUrl}/1/${endpoint}`, {
        method: 'POST',
        headers: {
          'X-CleverTap-Account-Id': process.env.CLEVERTAP_ACCOUNT_ID || '',
          'X-CleverTap-Passcode': this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`CleverTap API error: ${response.status}`);
      }

    } catch (error: any) {
      logger.error('CleverTap API call failed', { endpoint, error: error.message });
      throw error;
    }
  }

  // Track retention events
  async trackRetentionEvent(campaignId: string, event: string, userId: string, metadata?: Record<string, any>) {
    const campaign = this.campaigns.get(campaignId);
    if (!campaign) return;

    switch (event) {
      case 'delivered':
        campaign.analytics.delivered++;
        break;
      case 'opened':
        campaign.analytics.opened++;
        break;
      case 'clicked':
        campaign.analytics.clicked++;
        break;
      case 'converted':
        campaign.analytics.converted++;
        break;
    }

    if (event === 'converted') {
      campaign.analytics.churnPrevented++;
      if (campaign.analytics.delivered > 0) {
        campaign.analytics.retentionRate = (campaign.analytics.churnPrevented / campaign.analytics.delivered) * 100;
      }
    }

    await this.sendToCleverTapAPI('events/push', {
      evtName: event,
      evtData: {
        campaign_id: campaignId,
        ...metadata
      },
      identity: [userId]
    });

    logger.info('Retention event tracked', { campaignId, event, userId });
  }

  // Get retention analytics
  getRetentionAnalytics(campaignId?: string): RetentionAnalytics | Record<string, RetentionAnalytics> {
    if (campaignId) {
      const campaign = this.campaigns.get(campaignId);
      return campaign ? campaign.analytics : {};
    }

    const allAnalytics: Record<string, RetentionAnalytics> = {};
    this.campaigns.forEach((campaign, id) => {
      allAnalytics[id] = campaign.analytics;
    });

    return allAnalytics;
  }

  // Calculate retention ROI
  calculateRetentionROI(campaignId: string): {
    campaignId: string;
    usersRetained: number;
    ltvPerUser: number;
    totalValue: number;
    campaignCost: number;
    roi: number;
  } {
    const campaign = this.campaigns.get(campaignId);
    if (!campaign) {
      throw new Error('Campaign not found');
    }

    const usersRetained = campaign.analytics.churnPrevented;
    const ltvPerUser = 500; // Average lifetime value
    const totalValue = usersRetained * ltvPerUser;
    const campaignCost = campaign.analytics.sent * 0.05; // $0.05 per message
    const roi = campaignCost > 0 ? ((totalValue - campaignCost) / campaignCost) * 100 : 0;

    return {
      campaignId,
      usersRetained,
      ltvPerUser,
      totalValue,
      campaignCost,
      roi
    };
  }
}

export const cleverTapRetentionService = new CleverTapRetentionService(
  process.env.CLEVERTAP_PASSCODE || 'your-clevertap-passcode'
);
