/**
 * GUILD Ranking System
 * 
 * Users progress from G → SSS based on:
 * - Skill Level Assessment
 * - Amount of Fulfilled Tasks
 * - Income Level Achieved
 * 
 * Higher ranks unlock more tasks and higher earning potential
 */

export type RankLevel = 'G' | 'F' | 'E' | 'D' | 'C' | 'B' | 'A' | 'S' | 'SS' | 'SSS';

export interface UserStats {
  // Task Statistics
  tasksCompleted: number;
  tasksInProgress: number;
  taskSuccessRate: number; // 0-100%
  averageRating: number; // 0-5 stars
  
  // Financial Statistics
  totalEarnings: number; // QAR
  monthlyEarnings: number; // QAR
  averageJobValue: number; // QAR
  
  // Skill Statistics
  skillLevel: number; // 0-100
  skillsVerified: number;
  endorsements: number;
  
  // Activity Statistics
  accountAge: number; // days
  activeStreak: number; // days
  responseTime: number; // hours average
  
  // Quality Metrics
  clientRetentionRate: number; // 0-100%
  disputeRate: number; // 0-100%
  onTimeDeliveryRate: number; // 0-100%
}

export interface RankRequirements {
  minTasksCompleted: number;
  minSuccessRate: number;
  minTotalEarnings: number;
  minSkillLevel: number;
  minAverageRating: number;
  minAccountAge: number;
  maxDisputeRate: number;
  minOnTimeDelivery: number;
}

// Rank progression requirements
export const RANK_REQUIREMENTS: Record<RankLevel, RankRequirements> = {
  G: {
    minTasksCompleted: 0,
    minSuccessRate: 0,
    minTotalEarnings: 0,
    minSkillLevel: 0,
    minAverageRating: 0,
    minAccountAge: 0,
    maxDisputeRate: 100,
    minOnTimeDelivery: 0,
  },
  F: {
    minTasksCompleted: 1,
    minSuccessRate: 70,
    minTotalEarnings: 500,
    minSkillLevel: 10,
    minAverageRating: 3.0,
    minAccountAge: 7,
    maxDisputeRate: 20,
    minOnTimeDelivery: 70,
  },
  E: {
    minTasksCompleted: 5,
    minSuccessRate: 75,
    minTotalEarnings: 2000,
    minSkillLevel: 20,
    minAverageRating: 3.5,
    minAccountAge: 14,
    maxDisputeRate: 15,
    minOnTimeDelivery: 75,
  },
  D: {
    minTasksCompleted: 15,
    minSuccessRate: 80,
    minTotalEarnings: 5000,
    minSkillLevel: 30,
    minAverageRating: 4.0,
    minAccountAge: 30,
    maxDisputeRate: 10,
    minOnTimeDelivery: 80,
  },
  C: {
    minTasksCompleted: 30,
    minSuccessRate: 85,
    minTotalEarnings: 12000,
    minSkillLevel: 45,
    minAverageRating: 4.2,
    minAccountAge: 60,
    maxDisputeRate: 8,
    minOnTimeDelivery: 85,
  },
  B: {
    minTasksCompleted: 50,
    minSuccessRate: 88,
    minTotalEarnings: 25000,
    minSkillLevel: 60,
    minAverageRating: 4.4,
    minAccountAge: 90,
    maxDisputeRate: 5,
    minOnTimeDelivery: 88,
  },
  A: {
    minTasksCompleted: 80,
    minSuccessRate: 90,
    minTotalEarnings: 50000,
    minSkillLevel: 75,
    minAverageRating: 4.6,
    minAccountAge: 120,
    maxDisputeRate: 3,
    minOnTimeDelivery: 90,
  },
  S: {
    minTasksCompleted: 120,
    minSuccessRate: 92,
    minTotalEarnings: 100000,
    minSkillLevel: 85,
    minAverageRating: 4.7,
    minAccountAge: 180,
    maxDisputeRate: 2,
    minOnTimeDelivery: 92,
  },
  SS: {
    minTasksCompleted: 200,
    minSuccessRate: 94,
    minTotalEarnings: 200000,
    minSkillLevel: 90,
    minAverageRating: 4.8,
    minAccountAge: 270,
    maxDisputeRate: 1,
    minOnTimeDelivery: 94,
  },
  SSS: {
    minTasksCompleted: 300,
    minSuccessRate: 96,
    minTotalEarnings: 500000,
    minSkillLevel: 95,
    minAverageRating: 4.9,
    minAccountAge: 365,
    maxDisputeRate: 0.5,
    minOnTimeDelivery: 96,
  },
};

// Rank benefits and unlocks
export interface RankBenefits {
  maxJobsPerDay: number;
  maxJobValue: number; // QAR
  prioritySupport: boolean;
  customProfile: boolean;
  guildCreation: boolean;
  mentorshipProgram: boolean;
  exclusiveJobs: boolean;
  reducedFees: number; // percentage reduction
  badgeColor: string;
  titlePrefix?: string;
}

export const RANK_BENEFITS: Record<RankLevel, RankBenefits> = {
  G: {
    maxJobsPerDay: 2,
    maxJobValue: 1000,
    prioritySupport: false,
    customProfile: false,
    guildCreation: false,
    mentorshipProgram: false,
    exclusiveJobs: false,
    reducedFees: 0,
    badgeColor: '#8B4513',
  },
  F: {
    maxJobsPerDay: 3,
    maxJobValue: 2500,
    prioritySupport: false,
    customProfile: false,
    guildCreation: false,
    mentorshipProgram: false,
    exclusiveJobs: false,
    reducedFees: 2,
    badgeColor: '#CD853F',
  },
  E: {
    maxJobsPerDay: 4,
    maxJobValue: 5000,
    prioritySupport: false,
    customProfile: false,
    guildCreation: false,
    mentorshipProgram: false,
    exclusiveJobs: false,
    reducedFees: 5,
    badgeColor: '#D2691E',
  },
  D: {
    maxJobsPerDay: 5,
    maxJobValue: 10000,
    prioritySupport: false,
    customProfile: true,
    guildCreation: false,
    mentorshipProgram: false,
    exclusiveJobs: false,
    reducedFees: 8,
    badgeColor: '#FF6347',
  },
  C: {
    maxJobsPerDay: 7,
    maxJobValue: 20000,
    prioritySupport: true,
    customProfile: true,
    guildCreation: false,
    mentorshipProgram: false,
    exclusiveJobs: true,
    reducedFees: 12,
    badgeColor: '#FF4500',
  },
  B: {
    maxJobsPerDay: 10,
    maxJobValue: 40000,
    prioritySupport: true,
    customProfile: true,
    guildCreation: true,
    mentorshipProgram: false,
    exclusiveJobs: true,
    reducedFees: 15,
    badgeColor: '#1E90FF',
  },
  A: {
    maxJobsPerDay: 15,
    maxJobValue: 75000,
    prioritySupport: true,
    customProfile: true,
    guildCreation: true,
    mentorshipProgram: true,
    exclusiveJobs: true,
    reducedFees: 20,
    badgeColor: '#4169E1',
    titlePrefix: 'Expert',
  },
  S: {
    maxJobsPerDay: 20,
    maxJobValue: 150000,
    prioritySupport: true,
    customProfile: true,
    guildCreation: true,
    mentorshipProgram: true,
    exclusiveJobs: true,
    reducedFees: 25,
    badgeColor: '#9400D3',
    titlePrefix: 'Master',
  },
  SS: {
    maxJobsPerDay: 30,
    maxJobValue: 300000,
    prioritySupport: true,
    customProfile: true,
    guildCreation: true,
    mentorshipProgram: true,
    exclusiveJobs: true,
    reducedFees: 30,
    badgeColor: '#FFD700',
    titlePrefix: 'Grandmaster',
  },
  SSS: {
    maxJobsPerDay: 50,
    maxJobValue: 1000000,
    prioritySupport: true,
    customProfile: true,
    guildCreation: true,
    mentorshipProgram: true,
    exclusiveJobs: true,
    reducedFees: 40,
    badgeColor: '#BCFF31',
    titlePrefix: 'Legend',
  },
};

export class RankingSystem {
  /**
   * Calculate user's current rank based on their statistics
   */
  static calculateRank(stats: UserStats): RankLevel {
    const ranks: RankLevel[] = ['SSS', 'SS', 'S', 'A', 'B', 'C', 'D', 'E', 'F', 'G'];
    
    for (const rank of ranks) {
      if (this.meetsRankRequirements(stats, rank)) {
        return rank;
      }
    }
    
    return 'G'; // Default rank
  }

  /**
   * Check if user meets requirements for a specific rank
   */
  static meetsRankRequirements(stats: UserStats, rank: RankLevel): boolean {
    const requirements = RANK_REQUIREMENTS[rank];
    
    return (
      stats.tasksCompleted >= requirements.minTasksCompleted &&
      stats.taskSuccessRate >= requirements.minSuccessRate &&
      stats.totalEarnings >= requirements.minTotalEarnings &&
      stats.skillLevel >= requirements.minSkillLevel &&
      stats.averageRating >= requirements.minAverageRating &&
      stats.accountAge >= requirements.minAccountAge &&
      stats.disputeRate <= requirements.maxDisputeRate &&
      stats.onTimeDeliveryRate >= requirements.minOnTimeDelivery
    );
  }

  /**
   * Get next rank and progress towards it
   */
  static getNextRankProgress(stats: UserStats): {
    currentRank: RankLevel;
    nextRank: RankLevel | null;
    progress: number; // 0-100%
    missingRequirements: string[];
  } {
    const currentRank = this.calculateRank(stats);
    const ranks: RankLevel[] = ['G', 'F', 'E', 'D', 'C', 'B', 'A', 'S', 'SS', 'SSS'];
    const currentIndex = ranks.indexOf(currentRank);
    const nextRank = currentIndex < ranks.length - 1 ? ranks[currentIndex + 1] : null;
    
    if (!nextRank) {
      return {
        currentRank,
        nextRank: null,
        progress: 100,
        missingRequirements: [],
      };
    }
    
    const nextRequirements = RANK_REQUIREMENTS[nextRank];
    const missingRequirements: string[] = [];
    let totalRequirements = 0;
    let metRequirements = 0;
    
    // Check each requirement
    const checks = [
      {
        met: stats.tasksCompleted >= nextRequirements.minTasksCompleted,
        name: `Complete ${nextRequirements.minTasksCompleted} tasks`,
        current: stats.tasksCompleted,
        required: nextRequirements.minTasksCompleted,
      },
      {
        met: stats.taskSuccessRate >= nextRequirements.minSuccessRate,
        name: `${nextRequirements.minSuccessRate}% success rate`,
        current: stats.taskSuccessRate,
        required: nextRequirements.minSuccessRate,
      },
      {
        met: stats.totalEarnings >= nextRequirements.minTotalEarnings,
        name: `Earn ${nextRequirements.minTotalEarnings} QAR`,
        current: stats.totalEarnings,
        required: nextRequirements.minTotalEarnings,
      },
      {
        met: stats.skillLevel >= nextRequirements.minSkillLevel,
        name: `Skill level ${nextRequirements.minSkillLevel}`,
        current: stats.skillLevel,
        required: nextRequirements.minSkillLevel,
      },
      {
        met: stats.averageRating >= nextRequirements.minAverageRating,
        name: `${nextRequirements.minAverageRating} star rating`,
        current: stats.averageRating,
        required: nextRequirements.minAverageRating,
      },
      {
        met: stats.accountAge >= nextRequirements.minAccountAge,
        name: `${nextRequirements.minAccountAge} days active`,
        current: stats.accountAge,
        required: nextRequirements.minAccountAge,
      },
      {
        met: stats.disputeRate <= nextRequirements.maxDisputeRate,
        name: `Max ${nextRequirements.maxDisputeRate}% dispute rate`,
        current: stats.disputeRate,
        required: nextRequirements.maxDisputeRate,
      },
      {
        met: stats.onTimeDeliveryRate >= nextRequirements.minOnTimeDelivery,
        name: `${nextRequirements.minOnTimeDelivery}% on-time delivery`,
        current: stats.onTimeDeliveryRate,
        required: nextRequirements.minOnTimeDelivery,
      },
    ];
    
    checks.forEach(check => {
      totalRequirements++;
      if (check.met) {
        metRequirements++;
      } else {
        missingRequirements.push(check.name);
      }
    });
    
    const progress = Math.round((metRequirements / totalRequirements) * 100);
    
    return {
      currentRank,
      nextRank,
      progress,
      missingRequirements,
    };
  }

  /**
   * Get rank benefits for a specific rank
   */
  static getRankBenefits(rank: RankLevel): RankBenefits {
    return RANK_BENEFITS[rank];
  }

  /**
   * Get rank display information
   */
  static getRankDisplay(rank: RankLevel): {
    rank: RankLevel;
    color: string;
    title: string;
    benefits: RankBenefits;
  } {
    const benefits = this.getRankBenefits(rank);
    const title = benefits.titlePrefix ? `${benefits.titlePrefix} ${rank}` : rank;
    
    return {
      rank,
      color: benefits.badgeColor,
      title,
      benefits,
    };
  }

  /**
   * Calculate estimated time to next rank based on current activity
   */
  static estimateTimeToNextRank(
    stats: UserStats,
    weeklyTasksAverage: number = 2,
    weeklyEarningsAverage: number = 1000
  ): {
    nextRank: RankLevel | null;
    estimatedDays: number | null;
    bottleneck: string | null;
  } {
    const progress = this.getNextRankProgress(stats);
    
    if (!progress.nextRank) {
      return { nextRank: null, estimatedDays: null, bottleneck: null };
    }
    
    const nextRequirements = RANK_REQUIREMENTS[progress.nextRank];
    const estimates: { days: number; requirement: string }[] = [];
    
    // Tasks completion estimate
    if (stats.tasksCompleted < nextRequirements.minTasksCompleted) {
      const tasksNeeded = nextRequirements.minTasksCompleted - stats.tasksCompleted;
      const daysNeeded = (tasksNeeded / weeklyTasksAverage) * 7;
      estimates.push({ days: daysNeeded, requirement: 'tasks completion' });
    }
    
    // Earnings estimate
    if (stats.totalEarnings < nextRequirements.minTotalEarnings) {
      const earningsNeeded = nextRequirements.minTotalEarnings - stats.totalEarnings;
      const daysNeeded = (earningsNeeded / weeklyEarningsAverage) * 7;
      estimates.push({ days: daysNeeded, requirement: 'earnings target' });
    }
    
    // Account age requirement
    if (stats.accountAge < nextRequirements.minAccountAge) {
      const daysNeeded = nextRequirements.minAccountAge - stats.accountAge;
      estimates.push({ days: daysNeeded, requirement: 'account age' });
    }
    
    if (estimates.length === 0) {
      return { nextRank: progress.nextRank, estimatedDays: 0, bottleneck: null };
    }
    
    // Find the longest estimate (bottleneck)
    const bottleneck = estimates.reduce((max, current) => 
      current.days > max.days ? current : max
    );
    
    return {
      nextRank: progress.nextRank,
      estimatedDays: Math.ceil(bottleneck.days),
      bottleneck: bottleneck.requirement,
    };
  }

  /**
   * Generate mock user stats for testing
   */
  static generateMockStats(rank: RankLevel = 'G'): UserStats {
    const requirements = RANK_REQUIREMENTS[rank];
    
    return {
      tasksCompleted: requirements.minTasksCompleted + Math.floor(Math.random() * 10),
      tasksInProgress: Math.floor(Math.random() * 3),
      taskSuccessRate: requirements.minSuccessRate + Math.floor(Math.random() * 10),
      averageRating: requirements.minAverageRating + (Math.random() * 0.5),
      totalEarnings: requirements.minTotalEarnings + Math.floor(Math.random() * 5000),
      monthlyEarnings: Math.floor(Math.random() * 10000),
      averageJobValue: Math.floor(Math.random() * 2000) + 500,
      skillLevel: requirements.minSkillLevel + Math.floor(Math.random() * 15),
      skillsVerified: Math.floor(Math.random() * 8) + 2,
      endorsements: Math.floor(Math.random() * 20) + 5,
      accountAge: requirements.minAccountAge + Math.floor(Math.random() * 30),
      activeStreak: Math.floor(Math.random() * 30) + 1,
      responseTime: Math.random() * 24 + 1,
      clientRetentionRate: 70 + Math.floor(Math.random() * 25),
      disputeRate: Math.random() * requirements.maxDisputeRate,
      onTimeDeliveryRate: requirements.minOnTimeDelivery + Math.floor(Math.random() * 10),
    };
  }
}

export default RankingSystem;


