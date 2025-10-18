/**
 * GUILD System
 * 
 * Guild membership and management system:
 * - Solo users display "Solo"
 * - Guild members display "GUILD: [Guild Name]" + role/level
 * - Roles: Guild Master, Vice Master, Member (levels 1-3)
 * - Level 1 = highest, Level 3 = lowest (set by Guild Master)
 */

export type GuildRole = 'Guild Master' | 'Vice Master' | 'Member';
export type MemberLevel = 1 | 2 | 3; // 1 = highest, 3 = lowest

export interface Guild {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  createdBy: string; // User ID of Guild Master
  
  // Guild Statistics
  memberCount: number;
  totalEarnings: number;
  completedTasks: number;
  averageRating: number;
  
  // Guild Settings
  isPublic: boolean; // true = open guild, false = closed guild
  requiresApproval: boolean; // For open guilds, whether to auto-approve or require approval
  isOpen: boolean; // true = anyone can join, false = invite-only
  maxMembers: number;
  minRankRequired: string; // Minimum rank to join
  
  // Guild Branding
  logo?: string;
  bannerImage?: string;
  primaryColor: string;
  
  // Guild Perks
  bonusMultiplier: number; // 1.0 = no bonus, 1.1 = 10% bonus
  exclusiveJobs: boolean;
  priorityMatching: boolean;
}

export interface GuildMember {
  userId: string;
  guildId: string;
  role: GuildRole;
  level?: MemberLevel; // Only for Members, not for Guild Master/Vice Master
  joinedAt: Date;
  
  // Member Statistics in Guild
  tasksCompletedInGuild: number;
  earningsInGuild: number;
  contributionScore: number; // 0-100
  
  // Member Status
  isActive: boolean;
  lastActiveAt: Date;
  
  // Permissions (set by Guild Master)
  canInviteMembers: boolean;
  canManageJobs: boolean;
  canViewFinances: boolean;
}

export interface GuildInvitation {
  id: string;
  guildId: string;
  invitedUserId: string;
  invitedBy: string; // User ID
  inviterName: string; // Name of person who sent invite
  guildName: string; // Name of guild
  role: GuildRole;
  level?: MemberLevel;
  message?: string;
  createdAt: Date;
  expiresAt: Date;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  inviteType: 'direct_invite' | 'join_request'; // direct = Guild Master invited, request = user requested to join
}

export interface GuildJoinRequest {
  id: string;
  guildId: string;
  userId: string;
  userName: string;
  userRank: string;
  message?: string;
  createdAt: Date;
  status: 'pending' | 'approved' | 'rejected';
}

export interface UserGuildStatus {
  isSolo: boolean;
  guild?: {
    id: string;
    name: string;
    role: GuildRole;
    level?: MemberLevel;
    displayText: string; // "Solo" or "GUILD: [Name]"
    roleDisplayText: string; // "Guild Master", "Vice Master", "Member Lv.1", etc.
  };
}

export class GuildSystem {
  /**
   * Get user's guild display status
   */
  static getUserGuildStatus(
    guildMember: GuildMember | null,
    guild: Guild | null
  ): UserGuildStatus {
    if (!guildMember || !guild) {
      return {
        isSolo: true,
        guild: undefined,
      };
    }

    const roleDisplayText = this.getRoleDisplayText(guildMember.role, guildMember.level);
    const displayText = `GUILD: ${guild.name}`;

    return {
      isSolo: false,
      guild: {
        id: guild.id,
        name: guild.name,
        role: guildMember.role,
        level: guildMember.level,
        displayText,
        roleDisplayText,
      },
    };
  }

  /**
   * Get formatted role display text
   */
  static getRoleDisplayText(role: GuildRole, level?: MemberLevel): string {
    switch (role) {
      case 'Guild Master':
        return 'Guild Master';
      case 'Vice Master':
        return 'Vice Master';
      case 'Member':
        return level ? `Member Lv.${level}` : 'Member';
      default:
        return role;
    }
  }

  /**
   * Check if user can perform guild actions based on role
   */
  static canPerformAction(
    action: 'invite' | 'kick' | 'promote' | 'demote' | 'manage_settings' | 'disband',
    userRole: GuildRole,
    targetRole?: GuildRole
  ): boolean {
    switch (action) {
      case 'disband':
      case 'manage_settings':
        return userRole === 'Guild Master';
      
      case 'promote':
      case 'demote':
        if (userRole === 'Guild Master') return true;
        if (userRole === 'Vice Master' && targetRole === 'Member') return true;
        return false;
      
      case 'kick':
        if (userRole === 'Guild Master') return true;
        if (userRole === 'Vice Master' && targetRole === 'Member') return true;
        return false;
      
      case 'invite':
        return userRole === 'Guild Master' || userRole === 'Vice Master';
      
      default:
        return false;
    }
  }

  /**
   * Calculate guild member hierarchy score for sorting
   */
  static getMemberHierarchyScore(role: GuildRole, level?: MemberLevel): number {
    switch (role) {
      case 'Guild Master':
        return 1000;
      case 'Vice Master':
        return 500;
      case 'Member':
        // Higher level = lower score (Level 1 = highest)
        return level ? 100 - (level * 10) : 50;
      default:
        return 0;
    }
  }

  /**
   * Get available promotion options for a member
   */
  static getPromotionOptions(
    currentRole: GuildRole,
    currentLevel?: MemberLevel,
    promoterRole: GuildRole = 'Guild Master'
  ): Array<{ role: GuildRole; level?: MemberLevel; label: string }> {
    const options: Array<{ role: GuildRole; level?: MemberLevel; label: string }> = [];

    if (currentRole === 'Member') {
      // Members can be promoted to higher member levels or Vice Master
      if (currentLevel && currentLevel > 1) {
        const newLevel = (currentLevel - 1) as MemberLevel;
        options.push({
          role: 'Member',
          level: newLevel,
          label: `Member Level ${newLevel}`,
        });
      }
      
      if (promoterRole === 'Guild Master') {
        options.push({
          role: 'Vice Master',
          label: 'Vice Master',
        });
      }
    } else if (currentRole === 'Vice Master' && promoterRole === 'Guild Master') {
      // Only Guild Master can promote Vice Master to Guild Master (transfer leadership)
      options.push({
        role: 'Guild Master',
        label: 'Guild Master (Transfer Leadership)',
      });
    }

    return options;
  }

  /**
   * Get available demotion options for a member
   */
  static getDemotionOptions(
    currentRole: GuildRole,
    currentLevel?: MemberLevel,
    demoterRole: GuildRole = 'Guild Master'
  ): Array<{ role: GuildRole; level?: MemberLevel; label: string }> {
    const options: Array<{ role: GuildRole; level?: MemberLevel; label: string }> = [];

    if (currentRole === 'Vice Master') {
      // Vice Master can be demoted to Member Level 1
      options.push({
        role: 'Member',
        level: 1,
        label: 'Member Level 1',
      });
    } else if (currentRole === 'Member' && currentLevel) {
      // Members can be demoted to lower levels
      if (currentLevel < 3) {
        const newLevel = (currentLevel + 1) as MemberLevel;
        options.push({
          role: 'Member',
          level: newLevel,
          label: `Member Level ${newLevel}`,
        });
      }
    }

    return options;
  }

  /**
   * Calculate guild bonus earnings based on member role and guild settings
   */
  static calculateGuildBonus(
    baseEarnings: number,
    guild: Guild,
    memberRole: GuildRole,
    memberLevel?: MemberLevel
  ): number {
    let bonusMultiplier = guild.bonusMultiplier;

    // Role-based bonus multipliers
    switch (memberRole) {
      case 'Guild Master':
        bonusMultiplier += 0.05; // +5% for Guild Master
        break;
      case 'Vice Master':
        bonusMultiplier += 0.03; // +3% for Vice Master
        break;
      case 'Member':
        // Level-based bonus for members
        if (memberLevel === 1) bonusMultiplier += 0.02; // +2% for Level 1
        if (memberLevel === 2) bonusMultiplier += 0.01; // +1% for Level 2
        // Level 3 gets no additional bonus
        break;
    }

    return Math.round(baseEarnings * bonusMultiplier);
  }

  /**
   * Generate mock guild data for testing
   */
  static generateMockGuild(name: string = 'Elite Builders', isOpen: boolean = true): Guild {
    return {
      id: `guild_${Date.now()}`,
      name,
      description: `${name} - A premium guild for top-tier professionals`,
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      createdBy: 'user_master',
      memberCount: Math.floor(Math.random() * 20) + 5,
      totalEarnings: Math.floor(Math.random() * 500000) + 100000,
      completedTasks: Math.floor(Math.random() * 200) + 50,
      averageRating: 4.2 + Math.random() * 0.7,
      isPublic: isOpen, // For backward compatibility
      isOpen, // New field for guild privacy
      requiresApproval: isOpen ? Math.random() > 0.5 : true, // Open guilds may or may not require approval
      maxMembers: 25,
      minRankRequired: 'C',
      primaryColor: '#BCFF31',
      bonusMultiplier: 1.1,
      exclusiveJobs: true,
      priorityMatching: true,
    };
  }

  /**
   * Check if user can join guild based on guild settings
   */
  static canUserJoinGuild(guild: Guild, userRank: string): { canJoin: boolean; reason?: string } {
    if (!guild.isOpen) {
      return { canJoin: false, reason: 'This is a closed guild. You need an invitation to join.' };
    }

    if (guild.memberCount >= guild.maxMembers) {
      return { canJoin: false, reason: 'Guild is at maximum capacity.' };
    }

    // Check rank requirement
    const rankOrder = ['G', 'F', 'E', 'D', 'C', 'B', 'A', 'S', 'SS', 'SSS'];
    const userRankIndex = rankOrder.indexOf(userRank);
    const requiredRankIndex = rankOrder.indexOf(guild.minRankRequired);

    if (userRankIndex < requiredRankIndex) {
      return { canJoin: false, reason: `Minimum rank required: ${guild.minRankRequired}` };
    }

    return { canJoin: true };
  }

  /**
   * Create a guild invitation
   */
  static createGuildInvitation(
    guildId: string,
    guildName: string,
    invitedUserId: string,
    invitedBy: string,
    inviterName: string,
    role: GuildRole = 'Member',
    level: MemberLevel = 2,
    message?: string
  ): GuildInvitation {
    return {
      id: `invite_${Date.now()}`,
      guildId,
      invitedUserId,
      invitedBy,
      inviterName,
      guildName,
      role,
      level: role === 'Member' ? level : undefined,
      message,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      status: 'pending',
      inviteType: 'direct_invite',
    };
  }

  /**
   * Create a guild join request
   */
  static createGuildJoinRequest(
    guildId: string,
    userId: string,
    userName: string,
    userRank: string,
    message?: string
  ): GuildJoinRequest {
    return {
      id: `request_${Date.now()}`,
      guildId,
      userId,
      userName,
      userRank,
      message,
      createdAt: new Date(),
      status: 'pending',
    };
  }

  /**
   * Get guild privacy display text
   */
  static getGuildPrivacyText(guild: Guild): string {
    if (guild.isOpen) {
      return guild.requiresApproval ? 'Open (Approval Required)' : 'Open (Anyone Can Join)';
    } else {
      return 'Closed (Invite Only)';
    }
  }

  /**
   * Get guild privacy icon
   */
  static getGuildPrivacyIcon(guild: Guild): string {
    return guild.isOpen ? 'globe-outline' : 'lock-closed-outline';
  }

  /**
   * Generate mock guild member data for testing
   */
  static generateMockGuildMember(
    userId: string,
    guildId: string,
    role: GuildRole = 'Member',
    level?: MemberLevel
  ): GuildMember {
    return {
      userId,
      guildId,
      role,
      level: role === 'Member' ? (level || 2) : undefined,
      joinedAt: new Date(Date.now() - Math.random() * 20 * 24 * 60 * 60 * 1000),
      tasksCompletedInGuild: Math.floor(Math.random() * 30) + 5,
      earningsInGuild: Math.floor(Math.random() * 50000) + 10000,
      contributionScore: Math.floor(Math.random() * 40) + 60,
      isActive: true,
      lastActiveAt: new Date(),
      canInviteMembers: role !== 'Member' || (level && level <= 2),
      canManageJobs: role !== 'Member',
      canViewFinances: role === 'Guild Master' || role === 'Vice Master',
    };
  }

  /**
   * Validate guild name
   */
  static validateGuildName(name: string): { isValid: boolean; error?: string } {
    if (!name || name.trim().length === 0) {
      return { isValid: false, error: 'Guild name is required' };
    }
    
    if (name.length < 3) {
      return { isValid: false, error: 'Guild name must be at least 3 characters' };
    }
    
    if (name.length > 30) {
      return { isValid: false, error: 'Guild name must be less than 30 characters' };
    }
    
    if (!/^[a-zA-Z0-9\s\-_]+$/.test(name)) {
      return { isValid: false, error: 'Guild name can only contain letters, numbers, spaces, hyphens, and underscores' };
    }
    
    return { isValid: true };
  }
}

export default GuildSystem;
