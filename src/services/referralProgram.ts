
// Advanced ReferralCandy Referral Programs for Growth
import { logger } from '../utils/logger';
import { auditLoggingService } from '../services/auditLogging';

export interface ReferralProgram {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'paused' | 'ended';
  type: 'standard' | 'tiered' | 'viral' | 'partner';
  rewards: ReferralReward[];
  conditions: ReferralCondition[];
  tracking: {
    referralCodeLength: number;
    cookieDuration: number; // days
    attributionWindow: number; // days
  };
  limits?: {
    maxReferralsPerUser?: number;
    maxRewardsPerUser?: number;
    budget?: number;
  };
}

export interface ReferralReward {
  type: 'cash' | 'credit' | 'discount' | 'points' | 'free_months';
  amount: number;
  currency?: string;
  description: string;
  conditions?: string[];
}

export interface ReferralCondition {
  field: string;
  operator: 'equals' | 'greater_than' | 'less_than' | 'contains' | 'not_contains';
  value: any;
  description: string;
}

export interface Referral {
  id: string;
  referrerId: string;
  refereeId?: string;
  referralCode: string;
  status: 'pending' | 'completed' | 'cancelled' | 'expired';
  createdAt: Date;
  completedAt?: Date;
  rewards: {
    referrerReward?: ReferralReward;
    refereeReward?: ReferralReward;
  };
  metadata: {
    source?: string;
    campaign?: string;
    utm?: Record<string, string>;
  };
}

export class ReferralProgramService {
  private programs: Map<string, ReferralProgram> = new Map();
  private referrals: Map<string, Referral> = new Map();

  constructor() {
    this.initializeDefaultPrograms();
  }

  private initializeDefaultPrograms() {
    const defaultPrograms: ReferralProgram[] = [
      {
        id: 'standard_referral',
        name: 'Standard Referral Program',
        description: 'Refer friends and earn rewards',
        status: 'active',
        type: 'standard',
        rewards: [
          {
            type: 'credit',
            amount: 50,
            currency: 'USD',
            description: 'Referrer gets $50 credit when friend completes first job'
          },
          {
            type: 'discount',
            amount: 25,
            description: 'Referee gets 25% off first job'
          }
        ],
        conditions: [
          {
            field: 'referrer_account_age',
            operator: 'greater_than',
            value: 30,
            description: 'Referrer must have account for 30+ days'
          },
          {
            field: 'referee_first_job',
            operator: 'equals',
            value: true,
            description: 'Referee must complete first job'
          }
        ],
        tracking: {
          referralCodeLength: 8,
          cookieDuration: 30,
          attributionWindow: 90
        },
        limits: {
          maxReferralsPerUser: 10,
          maxRewardsPerUser: 5,
          budget: 100000
        }
      },
      {
        id: 'viral_referral',
        name: 'Viral Referral Campaign',
        description: 'Limited-time viral referral campaign',
        status: 'active',
        type: 'viral',
        rewards: [
          {
            type: 'cash',
            amount: 100,
            currency: 'USD',
            description: 'Referrer gets $100 cash for each successful referral'
          },
          {
            type: 'free_months',
            amount: 1,
            description: 'Referee gets 1 month free premium'
          }
        ],
        conditions: [
          {
            field: 'campaign_period',
            operator: 'equals',
            value: 'viral_2024',
            description: 'Must be during viral campaign period'
          }
        ],
        tracking: {
          referralCodeLength: 6,
          cookieDuration: 7,
          attributionWindow: 30
        }
      }
    ];

    defaultPrograms.forEach(program => {
      this.programs.set(program.id, program);
    });
  }

  // Generate referral code
  generateReferralCode(userId: string, programId: string): string {
    const program = this.programs.get(programId);
    if (!program) {
      throw new Error('Referral program not found');
    }

    // Generate unique referral code
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, program.tracking.referralCodeLength - timestamp.length);
    const code = (timestamp + random).toUpperCase();

    // Check for uniqueness
    const existingReferral = Array.from(this.referrals.values())
      .find(r => r.referralCode === code);

    if (existingReferral) {
      // Regenerate if collision
      return this.generateReferralCode(userId, programId);
    }

    return code;
  }

  // Create referral
  async createReferral(referrerId: string, programId: string, metadata?: Record<string, any>): Promise<Referral> {
    try {
      const program = this.programs.get(programId);
      if (!program) {
        throw new Error('Referral program not found');
      }

      // Check program limits
      if (program.limits?.maxReferralsPerUser) {
        const userReferrals = Array.from(this.referrals.values())
          .filter(r => r.referrerId === referrerId && r.status === 'completed');

        if (userReferrals.length >= program.limits.maxReferralsPerUser) {
          throw new Error('Maximum referrals per user exceeded');
        }
      }

      const referralCode = this.generateReferralCode(referrerId, programId);

      const referral: Referral = {
        id: `referral_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        referrerId,
        referralCode,
        status: 'pending',
        createdAt: new Date(),
        metadata: metadata || {}
      };

      this.referrals.set(referral.id, referral);

      // Audit log the referral creation
      await auditLoggingService.logEvent({
        userId: referrerId,
        action: 'REFERRAL_CREATED',
        resource: 'referrals',
        resourceId: referral.id,
        newValue: {
          programId,
          referralCode,
          metadata
        },
        ipAddress: '127.0.0.1',
        userAgent: 'system',
        sessionId: 'system'
      });

      logger.info('Referral created', { referralId: referral.id, referrerId, programId });

      return referral;

    } catch (error: any) {
      logger.error('Failed to create referral', { error: error.message });
      throw error;
    }
  }

  // Process referral completion
  async processReferralCompletion(referralCode: string, refereeId: string): Promise<void> {
    try {
      // Find referral by code
      const referral = Array.from(this.referrals.values())
        .find(r => r.referralCode === referralCode && r.status === 'pending');

      if (!referral) {
        throw new Error('Invalid or already processed referral code');
      }

      // Check attribution window
      const program = this.programs.get('standard_referral'); // Default program
      if (program && program.tracking.attributionWindow) {
        const daysSinceCreation = (Date.now() - referral.createdAt.getTime()) / (24 * 60 * 60 * 1000);
        if (daysSinceCreation > program.tracking.attributionWindow) {
          throw new Error('Referral code expired');
        }
      }

      // Update referral
      referral.refereeId = refereeId;
      referral.status = 'completed';
      referral.completedAt = new Date();

      // Calculate rewards
      referral.rewards = this.calculateRewards(referral, program!);

      // Audit log the completion
      await auditLoggingService.logEvent({
        userId: referral.referrerId,
        action: 'REFERRAL_COMPLETED',
        resource: 'referrals',
        resourceId: referral.id,
        newValue: {
          refereeId,
          status: 'completed',
          rewards: referral.rewards
        },
        ipAddress: '127.0.0.1',
        userAgent: 'system',
        sessionId: 'system'
      });

      logger.info('Referral completed', { referralId: referral.id, referrerId: referral.referrerId, refereeId });

    } catch (error: any) {
      logger.error('Failed to process referral completion', { error: error.message });
      throw error;
    }
  }

  private calculateRewards(referral: Referral, program: ReferralProgram): Referral['rewards'] {
    return {
      referrerReward: program.rewards.find(r => r.type === 'credit'),
      refereeReward: program.rewards.find(r => r.type === 'discount')
    };
  }

  // Track referral analytics
  trackReferralEvent(event: string, referralId: string, metadata?: Record<string, any>) {
    logger.info('Referral event tracked', { event, referralId, metadata });

    // In a real implementation, this would send to analytics service
    // and potentially trigger reward distribution
  }

  // Get referral statistics
  getReferralStatistics(programId?: string): {
    totalReferrals: number;
    completedReferrals: number;
    conversionRate: number;
    totalRewardsDistributed: number;
    topReferrers: Array<{ userId: string; referrals: number; rewards: number }>;
  } {
    let programReferrals = Array.from(this.referrals.values());

    if (programId) {
      // Filter by program (simplified - would need program association)
      programReferrals = programReferrals.filter(r => r.metadata?.programId === programId);
    }

    const totalReferrals = programReferrals.length;
    const completedReferrals = programReferrals.filter(r => r.status === 'completed').length;
    const conversionRate = totalReferrals > 0 ? (completedReferrals / totalReferrals) * 100 : 0;

    // Calculate rewards distributed
    const totalRewardsDistributed = programReferrals
      .filter(r => r.rewards.referrerReward)
      .reduce((sum, r) => sum + (r.rewards.referrerReward?.amount || 0), 0);

    // Find top referrers
    const referrerStats = new Map<string, { referrals: number; rewards: number }>();
    programReferrals.forEach(referral => {
      const existing = referrerStats.get(referral.referrerId) || { referrals: 0, rewards: 0 };
      existing.referrals++;
      if (referral.rewards.referrerReward) {
        existing.rewards += referral.rewards.referrerReward.amount;
      }
      referrerStats.set(referral.referrerId, existing);
    });

    const topReferrers = Array.from(referrerStats.entries())
      .map(([userId, stats]) => ({ userId, ...stats }))
      .sort((a, b) => b.referrals - a.referrals)
      .slice(0, 10);

    return {
      totalReferrals,
      completedReferrals,
      conversionRate,
      totalRewardsDistributed,
      topReferrers
    };
  }

  // Get user's referrals
  getUserReferrals(userId: string): Referral[] {
    return Array.from(this.referrals.values())
      .filter(referral =>
        referral.referrerId === userId ||
        referral.refereeId === userId
      )
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // Validate referral conditions
  validateReferralConditions(programId: string, userId: string, context: Record<string, any>): boolean {
    const program = this.programs.get(programId);
    if (!program) return false;

    return program.conditions.every(condition => {
      const fieldValue = this.getFieldValue(userId, condition.field, context);
      return this.evaluateCondition(fieldValue, condition.operator, condition.value);
    });
  }

  private getFieldValue(userId: string, field: string, context: Record<string, any>): any {
    // In a real implementation, this would query user data
    switch (field) {
      case 'referrer_account_age':
        return context.accountAge || 0;
      case 'referee_first_job':
        return context.firstJob || false;
      default:
        return context[field];
    }
  }

  private evaluateCondition(value: any, operator: string, expected: any): boolean {
    switch (operator) {
      case 'equals':
        return value === expected;
      case 'greater_than':
        return Number(value) > Number(expected);
      case 'less_than':
        return Number(value) < Number(expected);
      case 'contains':
        return String(value).includes(String(expected));
      case 'not_contains':
        return !String(value).includes(String(expected));
      default:
        return false;
    }
  }
}

export const referralProgramService = new ReferralProgramService();
