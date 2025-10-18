/**
 * GUILD JOB SYSTEM
 * 
 * Advanced guild functionality for:
 * - Guild-exclusive jobs assigned by Guild Master
 * - Contract creation and profit distribution
 * - Guild vault for funding workshops and courses
 * - Member skill development programs
 */

export type GuildJobStatus = 'draft' | 'pending_approval' | 'active' | 'in_progress' | 'completed' | 'cancelled';
export type ContractStatus = 'draft' | 'pending_votes' | 'approved' | 'rejected' | 'active' | 'completed';
export type GuildVaultTransactionType = 'deposit' | 'withdrawal' | 'job_payment' | 'workshop_funding' | 'course_funding' | 'guild_event';

export interface GuildJob {
  id: string;
  guildId: string;
  title: string;
  description: string;
  category: string;
  
  // Job Details
  totalBudget: number;
  estimatedDuration: string; // "2 weeks", "1 month", etc.
  requiredSkills: string[];
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  
  // Guild Master Settings
  createdBy: string; // Guild Master user ID
  maxParticipants: number;
  minRankRequired: string; // Minimum rank to participate
  
  // Contract & Distribution
  contractId?: string;
  profitDistribution: GuildProfitDistribution;
  
  // Status & Timeline
  status: GuildJobStatus;
  createdAt: Date;
  deadline: Date;
  startDate?: Date;
  completedAt?: Date;
  
  // Participants
  assignedMembers: string[]; // User IDs
  applicants: string[]; // Members who applied
  
  // Client Information
  clientName: string;
  clientContact: string;
  isExternalClient: boolean; // true for external clients, false for internal guild projects
}

export interface GuildProfitDistribution {
  guildMasterShare: number; // Percentage (0-100)
  participantShares: { [userId: string]: number }; // Percentage per participant
  guildVaultShare: number; // Percentage going to guild vault
  totalPercentage: number; // Should always equal 100
  
  // Distribution rules
  equalSplit: boolean; // If true, participants get equal shares
  performanceBasedBonus: boolean; // If true, bonus based on individual performance
  skillLevelMultiplier: boolean; // If true, higher skill levels get more
}

export interface GuildContract {
  id: string;
  guildId: string;
  jobId: string;
  
  // Contract Details
  title: string;
  description: string;
  totalAmount: number;
  profitDistribution: GuildProfitDistribution;
  
  // Terms & Conditions
  terms: string[];
  responsibilities: { [userId: string]: string[] }; // Responsibilities per member
  milestones: GuildContractMilestone[];
  
  // Approval Process
  status: ContractStatus;
  createdBy: string; // Guild Master
  createdAt: Date;
  votingDeadline: Date;
  
  // Member Responses
  memberVotes: { [userId: string]: 'accept' | 'reject' | 'pending' };
  requiredApprovals: number; // Minimum approvals needed
  currentApprovals: number;
  
  // Execution
  startDate?: Date;
  completedAt?: Date;
  actualEarnings?: number;
  distributedAmounts?: { [userId: string]: number };
}

export interface GuildContractMilestone {
  id: string;
  title: string;
  description: string;
  dueDate: Date;
  paymentPercentage: number; // Percentage of total contract paid at this milestone
  isCompleted: boolean;
  completedAt?: Date;
  completedBy?: string; // User ID who marked as complete
}

export interface GuildVault {
  guildId: string;
  balance: number;
  
  // Funding Categories
  workshopFund: number;
  courseFund: number;
  eventFund: number;
  emergencyFund: number;
  
  // Statistics
  totalDeposited: number;
  totalWithdrawn: number;
  totalEarned: number; // From guild jobs
  totalSpentOnDevelopment: number;
  
  // Settings
  minBalanceRequired: number;
  autoFundingEnabled: boolean;
  autoFundingPercentage: number; // Percentage of job earnings auto-deposited
  
  lastUpdated: Date;
}

export interface GuildVaultTransaction {
  id: string;
  guildId: string;
  type: GuildVaultTransactionType;
  amount: number;
  description: string;
  
  // Transaction Details
  initiatedBy: string; // User ID
  approvedBy?: string; // For withdrawals
  relatedJobId?: string;
  relatedContractId?: string;
  
  // Metadata
  category?: string; // For workshops/courses
  recipient?: string; // For funding transactions
  
  timestamp: Date;
  status: 'pending' | 'approved' | 'completed' | 'rejected';
}

export interface GuildWorkshop {
  id: string;
  guildId: string;
  title: string;
  description: string;
  
  // Workshop Details
  skillCategory: string;
  targetLevel: 'beginner' | 'intermediate' | 'advanced';
  duration: string; // "2 hours", "1 day", "1 week"
  maxParticipants: number;
  
  // Funding
  cost: number;
  fundedBy: 'guild_vault' | 'external' | 'member_contributions';
  fundingStatus: 'pending' | 'approved' | 'funded' | 'completed';
  
  // Instructor
  instructorName: string;
  instructorType: 'external' | 'guild_member' | 'online_course';
  instructorId?: string; // If guild member
  
  // Scheduling
  scheduledDate?: Date;
  location: string; // "Online", "Guild Hall", specific address
  
  // Participants
  registeredMembers: string[];
  completedMembers: string[];
  certificatesIssued: boolean;
  
  // Results
  skillsImproved: string[];
  averageRating?: number;
  feedback: { [userId: string]: string };
  
  createdAt: Date;
  createdBy: string; // Guild Master or authorized member
}

export interface GuildMemberSkillProgress {
  userId: string;
  guildId: string;
  
  // Current Skills
  skills: { [skillName: string]: GuildSkillLevel };
  
  // Development History
  workshopsAttended: string[]; // Workshop IDs
  coursesCompleted: string[]; // Course IDs
  jobsParticipated: string[]; // Guild job IDs
  
  // Progress Tracking
  skillPointsEarned: number;
  totalLearningHours: number;
  certificationsEarned: string[];
  
  // Performance Metrics
  jobSuccessRate: number; // Percentage of successful job completions
  averageClientRating: number;
  teamworkScore: number; // Based on peer reviews
  
  lastUpdated: Date;
}

export interface GuildSkillLevel {
  level: 'novice' | 'beginner' | 'intermediate' | 'advanced' | 'expert';
  points: number; // 0-1000 points per skill
  lastImproved: Date;
  certificationLevel?: string;
  
  // Learning Path
  recommendedWorkshops: string[];
  recommendedCourses: string[];
  nextMilestone: string;
}

export class GuildJobSystem {
  /**
   * Create a new guild job
   */
  static createGuildJob(
    guildId: string,
    guildMasterId: string,
    jobData: Partial<GuildJob>
  ): GuildJob {
    const job: GuildJob = {
      id: `guild_job_${Date.now()}`,
      guildId,
      title: jobData.title || '',
      description: jobData.description || '',
      category: jobData.category || 'general',
      totalBudget: jobData.totalBudget || 0,
      estimatedDuration: jobData.estimatedDuration || '1 week',
      requiredSkills: jobData.requiredSkills || [],
      difficultyLevel: jobData.difficultyLevel || 'intermediate',
      createdBy: guildMasterId,
      maxParticipants: jobData.maxParticipants || 5,
      minRankRequired: jobData.minRankRequired || 'G',
      profitDistribution: jobData.profitDistribution || this.createDefaultProfitDistribution(),
      status: 'draft',
      createdAt: new Date(),
      deadline: jobData.deadline || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days default
      assignedMembers: [],
      applicants: [],
      clientName: jobData.clientName || '',
      clientContact: jobData.clientContact || '',
      isExternalClient: jobData.isExternalClient ?? true,
    };

    return job;
  }

  /**
   * Create default profit distribution
   */
  static createDefaultProfitDistribution(): GuildProfitDistribution {
    return {
      guildMasterShare: 20, // 20% for Guild Master
      participantShares: {}, // Will be calculated based on participants
      guildVaultShare: 10, // 10% to guild vault
      totalPercentage: 100,
      equalSplit: true,
      performanceBasedBonus: false,
      skillLevelMultiplier: false,
    };
  }

  /**
   * Create a guild contract for a job
   */
  static createGuildContract(
    job: GuildJob,
    guildMasterId: string,
    terms: string[],
    responsibilities: { [userId: string]: string[] }
  ): GuildContract {
    const contract: GuildContract = {
      id: `guild_contract_${Date.now()}`,
      guildId: job.guildId,
      jobId: job.id,
      title: `Contract: ${job.title}`,
      description: `Guild contract for ${job.title} - Total Budget: ${job.totalBudget} QAR`,
      totalAmount: job.totalBudget,
      profitDistribution: job.profitDistribution,
      terms,
      responsibilities,
      milestones: this.createDefaultMilestones(job),
      status: 'draft',
      createdBy: guildMasterId,
      createdAt: new Date(),
      votingDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days to vote
      memberVotes: {},
      requiredApprovals: Math.ceil(job.assignedMembers.length * 0.6), // 60% approval needed
      currentApprovals: 0,
    };

    // Initialize member votes
    job.assignedMembers.forEach(memberId => {
      contract.memberVotes[memberId] = 'pending';
    });

    return contract;
  }

  /**
   * Create default milestones for a contract
   */
  static createDefaultMilestones(job: GuildJob): GuildContractMilestone[] {
    const milestones: GuildContractMilestone[] = [
      {
        id: `milestone_1_${Date.now()}`,
        title: 'Project Kickoff',
        description: 'Initial planning and setup completed',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week
        paymentPercentage: 25,
        isCompleted: false,
      },
      {
        id: `milestone_2_${Date.now() + 1}`,
        title: 'Mid-Project Review',
        description: '50% of work completed and reviewed',
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2 weeks
        paymentPercentage: 35,
        isCompleted: false,
      },
      {
        id: `milestone_3_${Date.now() + 2}`,
        title: 'Final Delivery',
        description: 'Project completed and delivered to client',
        dueDate: job.deadline,
        paymentPercentage: 40,
        isCompleted: false,
      },
    ];

    return milestones;
  }

  /**
   * Calculate profit distribution for participants
   */
  static calculateProfitDistribution(
    contract: GuildContract,
    participants: string[],
    skillLevels?: { [userId: string]: number }
  ): { [userId: string]: number } {
    const distribution = contract.profitDistribution;
    const availableForParticipants = 100 - distribution.guildMasterShare - distribution.guildVaultShare;
    const amounts: { [userId: string]: number } = {};

    if (distribution.equalSplit) {
      // Equal distribution among participants
      const sharePerParticipant = availableForParticipants / participants.length;
      participants.forEach(userId => {
        amounts[userId] = (sharePerParticipant / 100) * contract.totalAmount;
      });
    } else if (distribution.skillLevelMultiplier && skillLevels) {
      // Distribution based on skill levels
      const totalSkillPoints = Object.values(skillLevels).reduce((sum, level) => sum + level, 0);
      participants.forEach(userId => {
        const skillRatio = (skillLevels[userId] || 1) / totalSkillPoints;
        const sharePercentage = availableForParticipants * skillRatio;
        amounts[userId] = (sharePercentage / 100) * contract.totalAmount;
      });
    } else {
      // Use predefined shares
      participants.forEach(userId => {
        const sharePercentage = distribution.participantShares[userId] || 0;
        amounts[userId] = (sharePercentage / 100) * contract.totalAmount;
      });
    }

    return amounts;
  }

  /**
   * Process contract completion and distribute payments
   */
  static processContractCompletion(
    contract: GuildContract,
    actualEarnings: number,
    guildVault: GuildVault
  ): {
    distributedAmounts: { [userId: string]: number };
    guildMasterAmount: number;
    guildVaultAmount: number;
    updatedVault: GuildVault;
  } {
    const distribution = contract.profitDistribution;
    
    // Calculate amounts
    const guildMasterAmount = (distribution.guildMasterShare / 100) * actualEarnings;
    const guildVaultAmount = (distribution.guildVaultShare / 100) * actualEarnings;
    
    // Get participant IDs from member votes
    const participants = Object.keys(contract.memberVotes).filter(
      userId => contract.memberVotes[userId] === 'accept'
    );
    
    const distributedAmounts = this.calculateProfitDistribution(
      { ...contract, totalAmount: actualEarnings },
      participants
    );

    // Update guild vault
    const updatedVault: GuildVault = {
      ...guildVault,
      balance: guildVault.balance + guildVaultAmount,
      totalEarned: guildVault.totalEarned + actualEarnings,
      totalDeposited: guildVault.totalDeposited + guildVaultAmount,
      lastUpdated: new Date(),
    };

    return {
      distributedAmounts,
      guildMasterAmount,
      guildVaultAmount,
      updatedVault,
    };
  }

  /**
   * Create a guild workshop
   */
  static createGuildWorkshop(
    guildId: string,
    creatorId: string,
    workshopData: Partial<GuildWorkshop>
  ): GuildWorkshop {
    return {
      id: `workshop_${Date.now()}`,
      guildId,
      title: workshopData.title || '',
      description: workshopData.description || '',
      skillCategory: workshopData.skillCategory || 'general',
      targetLevel: workshopData.targetLevel || 'beginner',
      duration: workshopData.duration || '2 hours',
      maxParticipants: workshopData.maxParticipants || 10,
      cost: workshopData.cost || 0,
      fundedBy: workshopData.fundedBy || 'guild_vault',
      fundingStatus: 'pending',
      instructorName: workshopData.instructorName || '',
      instructorType: workshopData.instructorType || 'external',
      instructorId: workshopData.instructorId,
      location: workshopData.location || 'Online',
      registeredMembers: [],
      completedMembers: [],
      certificatesIssued: false,
      skillsImproved: workshopData.skillsImproved || [],
      feedback: {},
      createdAt: new Date(),
      createdBy: creatorId,
    };
  }

  /**
   * Fund a workshop from guild vault
   */
  static fundWorkshop(
    workshop: GuildWorkshop,
    guildVault: GuildVault
  ): { success: boolean; updatedVault?: GuildVault; error?: string } {
    if (guildVault.balance < workshop.cost) {
      return {
        success: false,
        error: 'Insufficient funds in guild vault',
      };
    }

    const updatedVault: GuildVault = {
      ...guildVault,
      balance: guildVault.balance - workshop.cost,
      workshopFund: guildVault.workshopFund + workshop.cost,
      totalWithdrawn: guildVault.totalWithdrawn + workshop.cost,
      totalSpentOnDevelopment: guildVault.totalSpentOnDevelopment + workshop.cost,
      lastUpdated: new Date(),
    };

    return {
      success: true,
      updatedVault,
    };
  }

  /**
   * Update member skill progress after workshop completion
   */
  static updateMemberSkillProgress(
    userId: string,
    guildId: string,
    workshop: GuildWorkshop,
    currentProgress?: GuildMemberSkillProgress
  ): GuildMemberSkillProgress {
    const progress = currentProgress || {
      userId,
      guildId,
      skills: {},
      workshopsAttended: [],
      coursesCompleted: [],
      jobsParticipated: [],
      skillPointsEarned: 0,
      totalLearningHours: 0,
      certificationsEarned: [],
      jobSuccessRate: 0,
      averageClientRating: 0,
      teamworkScore: 0,
      lastUpdated: new Date(),
    };

    // Add workshop to attended list
    if (!progress.workshopsAttended.includes(workshop.id)) {
      progress.workshopsAttended.push(workshop.id);
    }

    // Update skills based on workshop
    workshop.skillsImproved.forEach(skillName => {
      if (!progress.skills[skillName]) {
        progress.skills[skillName] = {
          level: 'novice',
          points: 0,
          lastImproved: new Date(),
          recommendedWorkshops: [],
          recommendedCourses: [],
          nextMilestone: 'Reach 100 points to advance to Beginner',
        };
      }

      // Add skill points based on workshop difficulty and duration
      const pointsToAdd = this.calculateSkillPoints(workshop);
      progress.skills[skillName].points += pointsToAdd;
      progress.skills[skillName].lastImproved = new Date();
      progress.skillPointsEarned += pointsToAdd;

      // Update skill level based on points
      progress.skills[skillName].level = this.getSkillLevelFromPoints(
        progress.skills[skillName].points
      );
    });

    // Add learning hours (estimate based on workshop duration)
    const learningHours = this.parseDurationToHours(workshop.duration);
    progress.totalLearningHours += learningHours;

    progress.lastUpdated = new Date();

    return progress;
  }

  /**
   * Calculate skill points earned from a workshop
   */
  static calculateSkillPoints(workshop: GuildWorkshop): number {
    const basePoints = 50;
    const levelMultiplier = {
      'beginner': 1,
      'intermediate': 1.5,
      'advanced': 2,
    };
    const durationMultiplier = this.parseDurationToHours(workshop.duration) / 2; // 2 hours = 1x multiplier

    return Math.round(basePoints * levelMultiplier[workshop.targetLevel] * durationMultiplier);
  }

  /**
   * Get skill level from points
   */
  static getSkillLevelFromPoints(points: number): GuildSkillLevel['level'] {
    if (points >= 800) return 'expert';
    if (points >= 600) return 'advanced';
    if (points >= 400) return 'intermediate';
    if (points >= 200) return 'beginner';
    return 'novice';
  }

  /**
   * Parse duration string to hours
   */
  static parseDurationToHours(duration: string): number {
    const lowerDuration = duration.toLowerCase();
    
    if (lowerDuration.includes('hour')) {
      const hours = parseInt(lowerDuration.match(/\d+/)?.[0] || '1');
      return hours;
    } else if (lowerDuration.includes('day')) {
      const days = parseInt(lowerDuration.match(/\d+/)?.[0] || '1');
      return days * 8; // 8 hours per day
    } else if (lowerDuration.includes('week')) {
      const weeks = parseInt(lowerDuration.match(/\d+/)?.[0] || '1');
      return weeks * 40; // 40 hours per week
    }
    
    return 2; // Default 2 hours
  }

  /**
   * Generate mock guild job for testing
   */
  static generateMockGuildJob(guildId: string, guildMasterId: string): GuildJob {
    const jobTitles = [
      'E-commerce Website Development',
      'Mobile App UI/UX Design',
      'Digital Marketing Campaign',
      'Brand Identity Package',
      'Database Optimization Project',
      'Social Media Management',
      'Content Writing for Tech Blog',
      'Video Production for Product Launch',
    ];

    const categories = ['development', 'design', 'marketing', 'writing', 'consulting'];
    const skills = ['React', 'Node.js', 'UI/UX', 'Photoshop', 'SEO', 'Content Writing', 'Video Editing'];

    const randomTitle = jobTitles[Math.floor(Math.random() * jobTitles.length)];
    const randomCategory = categories[Math.floor(Math.random() * categories.length)];
    const randomSkills = skills.slice(0, Math.floor(Math.random() * 3) + 2);

    return this.createGuildJob(guildId, guildMasterId, {
      title: randomTitle,
      description: `Professional ${randomTitle.toLowerCase()} project for external client. Requires collaboration and high-quality delivery.`,
      category: randomCategory,
      totalBudget: Math.floor(Math.random() * 50000) + 10000, // 10k-60k QAR
      estimatedDuration: ['1 week', '2 weeks', '1 month', '2 months'][Math.floor(Math.random() * 4)],
      requiredSkills: randomSkills,
      difficultyLevel: ['intermediate', 'advanced', 'expert'][Math.floor(Math.random() * 3)] as any,
      maxParticipants: Math.floor(Math.random() * 5) + 2, // 2-6 participants
      clientName: ['Tech Solutions Inc', 'Digital Innovations LLC', 'Creative Agency Co', 'StartupXYZ'][Math.floor(Math.random() * 4)],
      clientContact: 'client@example.com',
      isExternalClient: true,
    });
  }
}

export default GuildJobSystem;



