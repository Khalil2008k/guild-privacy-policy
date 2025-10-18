import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GuildSystem, Guild, GuildMember, UserGuildStatus, GuildRole, MemberLevel, GuildInvitation, GuildJoinRequest } from '../utils/guildSystem';

interface GuildContextType {
  // Current user's guild status
  userGuildStatus: UserGuildStatus;
  currentGuild: Guild | null;
  currentMembership: GuildMember | null;
  
  // Guild management
  availableGuilds: Guild[];
  guildInvitations: GuildInvitation[];
  guildJoinRequests: GuildJoinRequest[];
  
  // Loading states
  loading: boolean;
  
  // Actions
  joinGuild: (guildId: string, role?: GuildRole, level?: MemberLevel) => Promise<void>;
  leaveGuild: () => Promise<void>;
  createGuild: (guildData: Partial<Guild>) => Promise<void>;
  updateGuildMembership: (role: GuildRole, level?: MemberLevel) => Promise<void>;
  refreshGuildData: () => Promise<void>;
  
  // Guild discovery
  searchGuilds: (query: string) => Guild[];
  getRecommendedGuilds: () => Guild[];
  
  // Invitations & Join Requests
  sendGuildInvitation: (guildId: string, userId: string, role?: GuildRole, level?: MemberLevel, message?: string) => Promise<void>;
  respondToInvitation: (invitationId: string, response: 'accept' | 'decline') => Promise<void>;
  requestToJoinGuild: (guildId: string, message?: string) => Promise<void>;
  respondToJoinRequest: (requestId: string, response: 'approve' | 'reject') => Promise<void>;
  
  // Guild Settings
  updateGuildSettings: (guildId: string, settings: Partial<Guild>) => Promise<void>;
}

const GuildContext = createContext<GuildContextType | undefined>(undefined);

const STORAGE_KEYS = {
  CURRENT_GUILD: 'currentGuild',
  CURRENT_MEMBERSHIP: 'currentMembership',
  AVAILABLE_GUILDS: 'availableGuilds',
  GUILD_INVITATIONS: 'guildInvitations',
  GUILD_JOIN_REQUESTS: 'guildJoinRequests',
};

interface GuildProviderProps {
  children: ReactNode;
}

export function GuildProvider({ children }: GuildProviderProps) {
  const [userGuildStatus, setUserGuildStatus] = useState<UserGuildStatus>({ isSolo: true });
  const [currentGuild, setCurrentGuild] = useState<Guild | null>(null);
  const [currentMembership, setCurrentMembership] = useState<GuildMember | null>(null);
  const [availableGuilds, setAvailableGuilds] = useState<Guild[]>([]);
  const [guildInvitations, setGuildInvitations] = useState<GuildInvitation[]>([]);
  const [guildJoinRequests, setGuildJoinRequests] = useState<GuildJoinRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Load guild data on mount
  useEffect(() => {
    loadGuildData();
  }, []);

  // Update guild status when guild or membership changes
  useEffect(() => {
    const status = GuildSystem.getUserGuildStatus(currentMembership, currentGuild);
    setUserGuildStatus(status);
  }, [currentGuild, currentMembership]);

  const loadGuildData = async () => {
    try {
      setLoading(true);
      
      // Load current guild and membership
      const [guildData, membershipData, guildsData, invitationsData, joinRequestsData] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.CURRENT_GUILD),
        AsyncStorage.getItem(STORAGE_KEYS.CURRENT_MEMBERSHIP),
        AsyncStorage.getItem(STORAGE_KEYS.AVAILABLE_GUILDS),
        AsyncStorage.getItem(STORAGE_KEYS.GUILD_INVITATIONS),
        AsyncStorage.getItem(STORAGE_KEYS.GUILD_JOIN_REQUESTS),
      ]);

      if (guildData) {
        const guild = JSON.parse(guildData) as Guild;
        guild.createdAt = new Date(guild.createdAt);
        setCurrentGuild(guild);
      }

      if (membershipData) {
        const membership = JSON.parse(membershipData) as GuildMember;
        membership.joinedAt = new Date(membership.joinedAt);
        membership.lastActiveAt = new Date(membership.lastActiveAt);
        setCurrentMembership(membership);
      }

      if (guildsData) {
        const guilds = JSON.parse(guildsData) as Guild[];
        guilds.forEach(guild => {
          guild.createdAt = new Date(guild.createdAt);
        });
        setAvailableGuilds(guilds);
      } else {
        // Initialize with mock guilds for testing (mix of open and closed)
        const mockGuilds = [
          GuildSystem.generateMockGuild('Elite Builders', true), // Open guild
          GuildSystem.generateMockGuild('Tech Masters', false), // Closed guild
          GuildSystem.generateMockGuild('Creative Force', true), // Open guild
          GuildSystem.generateMockGuild('Business Pros', false), // Closed guild
          GuildSystem.generateMockGuild('Digital Nomads', true), // Open guild
        ];
        setAvailableGuilds(mockGuilds);
        await AsyncStorage.setItem(STORAGE_KEYS.AVAILABLE_GUILDS, JSON.stringify(mockGuilds));
      }

      // Load invitations
      if (invitationsData) {
        const invitations = JSON.parse(invitationsData) as GuildInvitation[];
        invitations.forEach(invitation => {
          invitation.createdAt = new Date(invitation.createdAt);
          invitation.expiresAt = new Date(invitation.expiresAt);
        });
        setGuildInvitations(invitations.filter(inv => inv.invitedUserId === 'current_user_id'));
      }

      // Load join requests
      if (joinRequestsData) {
        const requests = JSON.parse(joinRequestsData) as GuildJoinRequest[];
        requests.forEach(request => {
          request.createdAt = new Date(request.createdAt);
        });
        setGuildJoinRequests(requests);
      }
    } catch (error) {
      console.error('Failed to load guild data:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveGuildData = async (guild: Guild | null, membership: GuildMember | null) => {
    try {
      if (guild) {
        await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_GUILD, JSON.stringify(guild));
      } else {
        await AsyncStorage.removeItem(STORAGE_KEYS.CURRENT_GUILD);
      }

      if (membership) {
        await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_MEMBERSHIP, JSON.stringify(membership));
      } else {
        await AsyncStorage.removeItem(STORAGE_KEYS.CURRENT_MEMBERSHIP);
      }
    } catch (error) {
      console.error('Failed to save guild data:', error);
    }
  };

  const joinGuild = async (guildId: string, role: GuildRole = 'Member', level: MemberLevel = 2) => {
    try {
      const guild = availableGuilds.find(g => g.id === guildId);
      if (!guild) {
        throw new Error('Guild not found');
      }

      // Create membership
      const membership = GuildSystem.generateMockGuildMember(
        'current_user_id', // In real app, get from auth context
        guildId,
        role,
        role === 'Member' ? level : undefined
      );

      setCurrentGuild(guild);
      setCurrentMembership(membership);
      await saveGuildData(guild, membership);

      console.log(`✅ Joined guild: ${guild.name} as ${GuildSystem.getRoleDisplayText(role, level)}`);
    } catch (error) {
      console.error('Failed to join guild:', error);
      throw error;
    }
  };

  const leaveGuild = async () => {
    try {
      setCurrentGuild(null);
      setCurrentMembership(null);
      await saveGuildData(null, null);

      console.log('✅ Left guild successfully');
    } catch (error) {
      console.error('Failed to leave guild:', error);
      throw error;
    }
  };

  const createGuild = async (guildData: Partial<Guild>) => {
    try {
      const validation = GuildSystem.validateGuildName(guildData.name || '');
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

        // Create new guild
        const newGuild: Guild = {
          id: `guild_${Date.now()}`,
          name: guildData.name!,
          description: guildData.description || `${guildData.name} - A professional guild`,
          createdAt: new Date(),
          createdBy: 'current_user_id', // In real app, get from auth context
          memberCount: 1,
          totalEarnings: 0,
          completedTasks: 0,
          averageRating: 0,
          isPublic: guildData.isPublic ?? true,
          isOpen: guildData.isOpen ?? true, // New field for guild privacy
          requiresApproval: guildData.requiresApproval ?? false,
          maxMembers: guildData.maxMembers ?? 20,
          minRankRequired: guildData.minRankRequired ?? 'G',
          primaryColor: guildData.primaryColor ?? '#BCFF31',
          bonusMultiplier: 1.05, // 5% bonus for new guilds
          exclusiveJobs: false,
          priorityMatching: false,
          ...guildData,
        };

      // Create Guild Master membership
      const membership = GuildSystem.generateMockGuildMember(
        'current_user_id',
        newGuild.id,
        'Guild Master'
      );

      // Add to available guilds
      const updatedGuilds = [...availableGuilds, newGuild];
      setAvailableGuilds(updatedGuilds);
      await AsyncStorage.setItem(STORAGE_KEYS.AVAILABLE_GUILDS, JSON.stringify(updatedGuilds));

      // Set as current guild
      setCurrentGuild(newGuild);
      setCurrentMembership(membership);
      await saveGuildData(newGuild, membership);

      console.log(`✅ Created guild: ${newGuild.name}`);
    } catch (error) {
      console.error('Failed to create guild:', error);
      throw error;
    }
  };

  const updateGuildMembership = async (role: GuildRole, level?: MemberLevel) => {
    try {
      if (!currentMembership) {
        throw new Error('No current guild membership');
      }

      const updatedMembership: GuildMember = {
        ...currentMembership,
        role,
        level: role === 'Member' ? level : undefined,
      };

      setCurrentMembership(updatedMembership);
      await saveGuildData(currentGuild, updatedMembership);

      console.log(`✅ Updated guild role to: ${GuildSystem.getRoleDisplayText(role, level)}`);
    } catch (error) {
      console.error('Failed to update guild membership:', error);
      throw error;
    }
  };

  const refreshGuildData = async () => {
    await loadGuildData();
  };

  const searchGuilds = (query: string): Guild[] => {
    if (!query.trim()) return availableGuilds;
    
    const lowercaseQuery = query.toLowerCase();
    return availableGuilds.filter(guild =>
      guild.name.toLowerCase().includes(lowercaseQuery) ||
      guild.description.toLowerCase().includes(lowercaseQuery)
    );
  };

  const getRecommendedGuilds = (): Guild[] => {
    // In real app, this would use user's rank, skills, location, etc.
    // For now, return top guilds by member count and rating
    return availableGuilds
      .filter(guild => guild.id !== currentGuild?.id) // Exclude current guild
      .sort((a, b) => {
        const scoreA = a.memberCount * 0.3 + a.averageRating * 0.7;
        const scoreB = b.memberCount * 0.3 + b.averageRating * 0.7;
        return scoreB - scoreA;
      })
      .slice(0, 5);
  };

  const sendGuildInvitation = async (
    guildId: string, 
    userId: string, 
    role: GuildRole = 'Member', 
    level: MemberLevel = 2, 
    message?: string
  ): Promise<void> => {
    try {
      const guild = availableGuilds.find(g => g.id === guildId);
      if (!guild) {
        throw new Error('Guild not found');
      }

      const invitation = GuildSystem.createGuildInvitation(
        guildId,
        guild.name,
        userId,
        'current_user_id', // In real app, get from auth context
        'Current User', // In real app, get from user profile
        role,
        level,
        message
      );

      const updatedInvitations = [...guildInvitations, invitation];
      setGuildInvitations(updatedInvitations);
      await AsyncStorage.setItem(STORAGE_KEYS.GUILD_INVITATIONS, JSON.stringify(updatedInvitations));

      console.log(`✅ Invitation sent to user ${userId} for guild ${guild.name}`);
    } catch (error) {
      console.error('Failed to send guild invitation:', error);
      throw error;
    }
  };

  const respondToInvitation = async (invitationId: string, response: 'accept' | 'decline'): Promise<void> => {
    try {
      const invitation = guildInvitations.find(inv => inv.id === invitationId);
      if (!invitation) {
        throw new Error('Invitation not found');
      }

      const updatedInvitations = guildInvitations.map(inv => 
        inv.id === invitationId 
          ? { ...inv, status: response === 'accept' ? 'accepted' : 'declined' as any }
          : inv
      );
      setGuildInvitations(updatedInvitations);
      await AsyncStorage.setItem(STORAGE_KEYS.GUILD_INVITATIONS, JSON.stringify(updatedInvitations));

      if (response === 'accept') {
        // Join the guild
        await joinGuild(invitation.guildId, invitation.role, invitation.level);
      }

      console.log(`✅ Invitation ${response}ed for guild ${invitation.guildName}`);
    } catch (error) {
      console.error('Failed to respond to invitation:', error);
      throw error;
    }
  };

  const requestToJoinGuild = async (guildId: string, message?: string): Promise<void> => {
    try {
      const guild = availableGuilds.find(g => g.id === guildId);
      if (!guild) {
        throw new Error('Guild not found');
      }

      const canJoin = GuildSystem.canUserJoinGuild(guild, 'B'); // Mock user rank
      if (!canJoin.canJoin) {
        throw new Error(canJoin.reason);
      }

      if (!guild.requiresApproval && guild.isOpen) {
        // Auto-join for open guilds without approval requirement
        await joinGuild(guildId, 'Member', 2);
        return;
      }

      const joinRequest = GuildSystem.createGuildJoinRequest(
        guildId,
        'current_user_id',
        'Current User', // In real app, get from user profile
        'B', // Mock user rank
        message
      );

      const updatedRequests = [...guildJoinRequests, joinRequest];
      setGuildJoinRequests(updatedRequests);
      await AsyncStorage.setItem(STORAGE_KEYS.GUILD_JOIN_REQUESTS, JSON.stringify(updatedRequests));

      console.log(`✅ Join request sent to guild ${guild.name}`);
    } catch (error) {
      console.error('Failed to request guild join:', error);
      throw error;
    }
  };

  const respondToJoinRequest = async (requestId: string, response: 'approve' | 'reject'): Promise<void> => {
    try {
      const request = guildJoinRequests.find(req => req.id === requestId);
      if (!request) {
        throw new Error('Join request not found');
      }

      const updatedRequests = guildJoinRequests.map(req => 
        req.id === requestId 
          ? { ...req, status: response === 'approve' ? 'approved' : 'rejected' as any }
          : req
      );
      setGuildJoinRequests(updatedRequests);
      await AsyncStorage.setItem(STORAGE_KEYS.GUILD_JOIN_REQUESTS, JSON.stringify(updatedRequests));

      if (response === 'approve') {
        // In real app, this would notify the user and add them to the guild
        console.log(`✅ User ${request.userName} approved to join guild`);
      }

      console.log(`✅ Join request ${response}d for user ${request.userName}`);
    } catch (error) {
      console.error('Failed to respond to join request:', error);
      throw error;
    }
  };

  const updateGuildSettings = async (guildId: string, settings: Partial<Guild>): Promise<void> => {
    try {
      const updatedGuilds = availableGuilds.map(guild => 
        guild.id === guildId ? { ...guild, ...settings } : guild
      );
      setAvailableGuilds(updatedGuilds);

      if (currentGuild?.id === guildId) {
        const updatedCurrentGuild = { ...currentGuild, ...settings };
        setCurrentGuild(updatedCurrentGuild);
        await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_GUILD, JSON.stringify(updatedCurrentGuild));
      }

      await AsyncStorage.setItem(STORAGE_KEYS.AVAILABLE_GUILDS, JSON.stringify(updatedGuilds));

      console.log(`✅ Guild settings updated for ${guildId}`);
    } catch (error) {
      console.error('Failed to update guild settings:', error);
      throw error;
    }
  };

  const value: GuildContextType = {
    userGuildStatus,
    currentGuild,
    currentMembership,
    availableGuilds,
    guildInvitations,
    guildJoinRequests,
    loading,
    joinGuild,
    leaveGuild,
    createGuild,
    updateGuildMembership,
    refreshGuildData,
    searchGuilds,
    getRecommendedGuilds,
    sendGuildInvitation,
    respondToInvitation,
    requestToJoinGuild,
    respondToJoinRequest,
    updateGuildSettings,
  };

  return (
    <GuildContext.Provider value={value}>
      {children}
    </GuildContext.Provider>
  );
}

export function useGuild(): GuildContextType {
  const context = useContext(GuildContext);
  if (context === undefined) {
    throw new Error('useGuild must be used within a GuildProvider');
  }
  return context;
}

export default GuildContext;
