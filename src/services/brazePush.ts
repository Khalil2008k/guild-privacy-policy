
// Advanced Braze Push Campaigns for User Engagement
import { logger } from '../utils/logger';

export interface BrazePushCampaign {
  id: string;
  name: string;
  type: 'push' | 'email' | 'in_app' | 'sms';
  status: 'draft' | 'active' | 'paused' | 'completed';
  target: CampaignTarget;
  content: PushContent;
  schedule: PushSchedule;
  analytics: PushAnalytics;
  aBTest?: ABTestConfig;
}

export interface CampaignTarget {
  segments: string[];
  filters: PushFilter[];
  exclusions: PushFilter[];
  size: number;
  platforms: ('ios' | 'android' | 'web')[];
}

export interface PushFilter {
  field: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'in' | 'not_in';
  value: any;
}

export interface PushContent {
  title: string;
  body: string;
  imageUrl?: string;
  actionUrl?: string;
  buttons?: PushButton[];
  personalization?: {
    firstName?: boolean;
    lastActivity?: boolean;
    preferences?: boolean;
  };
}

export interface PushButton {
  text: string;
  action: string;
  url?: string;
}

export interface PushSchedule {
  trigger: 'immediate' | 'scheduled' | 'event_based';
  sendAt?: Date;
  timezone: string;
  frequency?: 'once' | 'recurring';
  events?: PushTrigger[];
}

export interface PushTrigger {
  event: string;
  delay?: number; // minutes
  conditions?: Record<string, any>;
}

export interface PushAnalytics {
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  converted: number;
  unsubscribed: number;
  bounced: number;
  conversionRate: number;
  revenue: number;
}

export interface ABTestConfig {
  variants: ABVariant[];
  allocation: number[]; // Percentage allocation per variant
  winner?: string;
  confidence: number;
}

export interface ABVariant {
  id: string;
  name: string;
  content: PushContent;
  weight: number;
}

export class BrazePushService {
  private apiKey: string;
  private apiUrl: string;
  private campaigns: Map<string, BrazePushCampaign> = new Map();

  constructor(apiKey: string, apiUrl: string = 'https://rest.iad-03.braze.com') {
    this.apiKey = apiKey;
    this.apiUrl = apiUrl;
    this.initializeDefaultCampaigns();
  }

  private initializeDefaultCampaigns() {
    const defaultCampaigns: BrazePushCampaign[] = [
      {
        id: 'job_completion_push',
        name: 'Job Completion Celebration',
        type: 'push',
        status: 'active',
        target: {
          segments: ['active_users'],
          filters: [],
          exclusions: [
            {
              field: 'push_opted_out',
              operator: 'equals',
              value: true
            }
          ],
          size: 0,
          platforms: ['ios', 'android']
        },
        content: {
          title: '🎉 Job Completed!',
          body: 'Congratulations! Your job "{{jobTitle}}" has been completed successfully.',
          actionUrl: '/jobs/{{jobId}}',
          personalization: {
            firstName: false,
            lastActivity: true,
            preferences: false
          }
        },
        schedule: {
          trigger: 'event_based',
          timezone: 'UTC',
          events: [
            {
              event: 'job_completed',
              delay: 0
            }
          ]
        },
        analytics: {
          sent: 0,
          delivered: 0,
          opened: 0,
          clicked: 0,
          converted: 0,
          unsubscribed: 0,
          bounced: 0,
          conversionRate: 0,
          revenue: 0
        }
      }
    ];

    defaultCampaigns.forEach(campaign => {
      this.campaigns.set(campaign.id, campaign);
    });
  }

  // Send push notification
  async sendPushNotification(campaignId: string, userId: string, customContent?: Partial<PushContent>): Promise<void> {
    try {
      const campaign = this.campaigns.get(campaignId);
      if (!campaign) {
        throw new Error('Campaign not found');
      }

      const content = { ...campaign.content, ...customContent };

      await this.sendToBrazeAPI('messages/push/send', {
        messages: {
          android_push: {
            alert: content.title,
            body: content.body,
            extra: {
              campaign_id: campaignId,
              user_id: userId,
              action_url: content.actionUrl
            }
          },
          apple_push: {
            alert: {
              title: content.title,
              body: content.body
            },
            extra: {
              campaign_id: campaignId,
              user_id: userId,
              action_url: content.actionUrl
            }
          }
        },
        recipients: [{ external_user_id: userId }]
      });

      campaign.analytics.sent++;
      logger.info('Push notification sent', { campaignId, userId });

    } catch (error: any) {
      logger.error('Failed to send push notification', { error: error.message });
      throw error;
    }
  }

  private async sendToBrazeAPI(endpoint: string, data: any): Promise<void> {
    try {
      const response = await fetch(`${this.apiUrl}/${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`Braze API error: ${response.status}`);
      }

    } catch (error: any) {
      logger.error('Braze API call failed', { endpoint, error: error.message });
      throw error;
    }
  }

  // Track push events
  async trackPushEvent(campaignId: string, event: string, userId: string, metadata?: Record<string, any>) {
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

    if (campaign.analytics.delivered > 0) {
      campaign.analytics.conversionRate = (campaign.analytics.converted / campaign.analytics.delivered) * 100;
    }

    await this.sendToBrazeAPI('events/track', {
      events: [{
        external_id: userId,
        name: event,
        properties: { campaign_id: campaignId, ...metadata }
      }]
    });

    logger.info('Push event tracked', { campaignId, event, userId });
  }

  // Get campaign analytics
  getCampaignAnalytics(campaignId?: string): PushAnalytics | Record<string, PushAnalytics> {
    if (campaignId) {
      const campaign = this.campaigns.get(campaignId);
      return campaign ? campaign.analytics : {};
    }

    const allAnalytics: Record<string, PushAnalytics> = {};
    this.campaigns.forEach((campaign, id) => {
      allAnalytics[id] = campaign.analytics;
    });

    return allAnalytics;
  }

  // Calculate campaign ROI
  calculateCampaignROI(campaignId: string): {
    campaignId: string;
    totalCost: number;
    totalRevenue: number;
    roi: number;
    conversionValue: number;
  } {
    const campaign = this.campaigns.get(campaignId);
    if (!campaign) {
      throw new Error('Campaign not found');
    }

    const totalCost = campaign.analytics.sent * 0.01;
    const totalRevenue = campaign.analytics.converted * 25;
    const roi = totalCost > 0 ? ((totalRevenue - totalCost) / totalCost) * 100 : 0;

    return {
      campaignId,
      totalCost,
      totalRevenue,
      roi,
      conversionValue: campaign.analytics.converted * 25
    };
  }
}

export const brazePushService = new BrazePushService(
  process.env.BRAZE_API_KEY || 'your-braze-api-key'
);
