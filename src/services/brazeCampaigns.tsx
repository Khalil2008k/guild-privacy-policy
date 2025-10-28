
// Advanced Braze Retention Campaigns for User Engagement
import { logger } from '../utils/logger';

export interface BrazeCampaign {
  id: string;
  name: string;
  type: 'email' | 'push' | 'in_app' | 'sms' | 'webhook';
  status: 'draft' | 'active' | 'paused' | 'completed';
  target: CampaignTarget;
  content: CampaignContent;
  schedule: CampaignSchedule;
  analytics: CampaignAnalytics;
}

export interface CampaignTarget {
  segments: string[];
  filters: CampaignFilter[];
  exclusions: CampaignFilter[];
  size: number;
}

export interface CampaignFilter {
  field: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'in' | 'not_in';
  value: any;
}

export interface CampaignContent {
  subject?: string;
  body: string;
  template?: string;
  variables?: Record<string, any>;
  personalization?: {
    firstName?: boolean;
    lastActivity?: boolean;
    preferences?: boolean;
  };
}

export interface CampaignSchedule {
  startDate: Date;
  endDate?: Date;
  timezone: string;
  frequency: 'once' | 'recurring' | 'triggered';
  triggers?: CampaignTrigger[];
}

export interface CampaignTrigger {
  event: string;
  delay?: number; // minutes
  conditions?: Record<string, any>;
}

export interface CampaignAnalytics {
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

export class BrazeCampaignService {
  private campaigns: Map<string, BrazeCampaign> = new Map();
  private apiKey: string;
  private apiUrl: string;

  constructor(apiKey: string, apiUrl: string = 'https://rest.iad-03.braze.com') {
    this.apiKey = apiKey;
    this.apiUrl = apiUrl;
    this.initializeDefaultCampaigns();
  }

  private initializeDefaultCampaigns() {
    const defaultCampaigns: BrazeCampaign[] = [
      {
        id: 'welcome_series',
        name: 'Welcome Series',
        type: 'email',
        status: 'active',
        target: {
          segments: ['new_users'],
          filters: [
            {
              field: 'signup_date',
              operator: 'greater_than',
              value: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
            }
          ],
          exclusions: [],
          size: 0 // Will be calculated
        },
        content: {
          subject: 'Welcome to Guild! 🚀',
          body: "Welcome {{firstName}}! Here's how to get started...",
          personalization: {
            firstName: true,
            lastActivity: false,
            preferences: false
          }
        },
        schedule: {
          startDate: new Date(),
          timezone: 'UTC',
          frequency: 'recurring',
          triggers: [
            {
              event: 'user_signup',
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
      },
      {
        id: 'inactive_user_reengagement',
        name: 'Inactive User Reengagement',
        type: 'email',
        status: 'active',
        target: {
          segments: ['inactive_users'],
          filters: [
            {
              field: 'last_login',
              operator: 'less_than',
              value: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
            },
            {
              field: 'jobs_completed',
              operator: 'greater_than',
              value: 0
            }
          ],
          exclusions: [
            {
              field: 'unsubscribed',
              operator: 'equals',
              value: true
            }
          ],
          size: 0
        },
        content: {
          subject: 'We miss you on Guild! 💭',
          body: "Hi {{firstName}}, it's been a while since your last project...",
          personalization: {
            firstName: true,
            lastActivity: true,
            preferences: true
          }
        },
        schedule: {
          startDate: new Date(),
          timezone: 'UTC',
          frequency: 'recurring',
          triggers: [
            {
              event: 'user_inactive',
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
      },
      {
        id: 'job_completion_celebration',
        name: 'Job Completion Celebration',
        type: 'push',
        status: 'active',
        target: {
          segments: ['active_users'],
          filters: [],
          exclusions: [],
          size: 0
        },
        content: {
          body: '🎉 Congratulations! Your job "{{jobTitle}}" has been completed successfully!'
        },
        schedule: {
          startDate: new Date(),
          timezone: 'UTC',
          frequency: 'triggered',
          triggers: [
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

  // Create new campaign
  async createCampaign(campaign: Omit<BrazeCampaign, 'id' | 'analytics'>): Promise<string> {
    try {
      const campaignId = `campaign_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const newCampaign: BrazeCampaign = {
        ...campaign,
        id: campaignId,
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
      };

      this.campaigns.set(campaignId, newCampaign);

      // Send to Braze API
      await this.sendToBrazeAPI('campaigns/create', newCampaign);

      logger.info('Braze campaign created', { campaignId, name: campaign.name });

      return campaignId;

    } catch (error: any) {
      logger.error('Failed to create Braze campaign', { error: error.message });
      throw error;
    }
  }

  // Send campaign to Braze API
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
        throw new Error(`Braze API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      logger.info('Braze API call successful', { endpoint, result });

    } catch (error: any) {
      logger.error('Braze API call failed', { endpoint, error: error.message });
      throw error;
    }
  }

  // Track campaign events
  async trackCampaignEvent(campaignId: string, event: string, userId: string, metadata?: Record<string, any>) {
    try {
      const campaign = this.campaigns.get(campaignId);
      if (!campaign) {
        throw new Error('Campaign not found');
      }

      // Update analytics
      switch (event) {
        case 'sent':
          campaign.analytics.sent++;
          break;
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
        case 'unsubscribed':
          campaign.analytics.unsubscribed++;
          break;
        case 'bounced':
          campaign.analytics.bounced++;
          break;
      }

      // Recalculate conversion rate
      if (campaign.analytics.delivered > 0) {
        campaign.analytics.conversionRate = (campaign.analytics.converted / campaign.analytics.delivered) * 100;
      }

      // Send event to Braze
      await this.sendToBrazeAPI('events/track', {
        events: [{
          external_id: userId,
          name: event,
          properties: {
            campaign_id: campaignId,
            ...metadata
          }
        }]
      });

      logger.info('Campaign event tracked', { campaignId, event, userId });

    } catch (error: any) {
      logger.error('Failed to track campaign event', { error: error.message });
      throw error;
    }
  }

  // Get campaign analytics
  getCampaignAnalytics(campaignId?: string): CampaignAnalytics | Record<string, CampaignAnalytics> {
    if (campaignId) {
      const campaign = this.campaigns.get(campaignId);
      return campaign ? campaign.analytics : {};
    }

    // Return all campaigns analytics
    const allAnalytics: Record<string, CampaignAnalytics> = {};
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

    // Calculate costs (simplified)
    const totalCost = campaign.analytics.sent * 0.02; // $0.02 per email

    // Calculate revenue from conversions
    const totalRevenue = campaign.analytics.converted * 50; // $50 average per conversion

    const roi = totalCost > 0 ? ((totalRevenue - totalCost) / totalCost) * 100 : 0;

    return {
      campaignId,
      totalCost,
      totalRevenue,
      roi,
      conversionValue: campaign.analytics.converted * 50
    };
  }

  // Get A/B test results
  getABTestResults(campaignId: string): {
    variants: Array<{
      variantId: string;
      sent: number;
      opened: number;
      clicked: number;
      converted: number;
      openRate: number;
      clickRate: number;
      conversionRate: number;
    }>;
    winner?: string;
    confidence: number;
  } {
    // In a real implementation, this would analyze A/B test variants
    return {
      variants: [
        {
          variantId: 'A',
          sent: 5000,
          opened: 2500,
          clicked: 500,
          converted: 50,
          openRate: 50,
          clickRate: 10,
          conversionRate: 1
        },
        {
          variantId: 'B',
          sent: 5000,
          opened: 2750,
          clicked: 750,
          converted: 75,
          openRate: 55,
          clickRate: 15,
          conversionRate: 1.5
        }
      ],
      winner: 'B',
      confidence: 95
    };
  }

  // Get retention metrics
  getRetentionMetrics(): {
    dailyActiveUsers: number;
    weeklyActiveUsers: number;
    monthlyActiveUsers: number;
    churnRate: number;
    retentionRate: number;
    cohortAnalysis: Record<string, number[]>;
  } {
    // In a real implementation, this would query user activity data
    return {
      dailyActiveUsers: 15420,
      weeklyActiveUsers: 45670,
      monthlyActiveUsers: 123450,
      churnRate: 2.3, // percentage
      retentionRate: 97.7, // percentage
      cohortAnalysis: {
        '2024-01': [100, 85, 72, 65, 58, 52],
        '2024-02': [100, 88, 76, 69, 62, 56],
        '2024-03': [100, 90, 79, 71, 64, 58]
      }
    };
  }
}

export const brazeCampaignService = new BrazeCampaignService(
  process.env.BRAZE_API_KEY || 'your-braze-api-key'
);
