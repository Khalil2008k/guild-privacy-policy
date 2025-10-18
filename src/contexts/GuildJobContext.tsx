import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  GuildJobSystem, 
  GuildJob, 
  GuildContract, 
  GuildVault, 
  GuildWorkshop, 
  GuildVaultTransaction,
  GuildMemberSkillProgress,
  ContractStatus,
  GuildJobStatus 
} from '../utils/guildJobSystem';

interface GuildJobContextType {
  // Guild Jobs
  guildJobs: GuildJob[];
  activeContracts: GuildContract[];
  guildVault: GuildVault | null;
  workshops: GuildWorkshop[];
  memberSkillProgress: { [userId: string]: GuildMemberSkillProgress };
  vaultTransactions: GuildVaultTransaction[];
  
  // Loading states
  loading: boolean;
  
  // Guild Job Actions
  createGuildJob: (jobData: Partial<GuildJob>) => Promise<GuildJob>;
  assignMembersToJob: (jobId: string, memberIds: string[]) => Promise<void>;
  updateJobStatus: (jobId: string, status: GuildJobStatus) => Promise<void>;
  
  // Contract Actions
  createContract: (jobId: string, terms: string[], responsibilities: { [userId: string]: string[] }) => Promise<GuildContract>;
  voteOnContract: (contractId: string, userId: string, vote: 'accept' | 'reject') => Promise<void>;
  completeContract: (contractId: string, actualEarnings: number) => Promise<void>;
  
  // Guild Vault Actions
  depositToVault: (amount: number, description: string) => Promise<void>;
  withdrawFromVault: (amount: number, description: string, category?: string) => Promise<void>;
  
  // Workshop Actions
  createWorkshop: (workshopData: Partial<GuildWorkshop>) => Promise<GuildWorkshop>;
  registerForWorkshop: (workshopId: string, userId: string) => Promise<void>;
  completeWorkshop: (workshopId: string, userId: string, rating: number, feedback: string) => Promise<void>;
  fundWorkshop: (workshopId: string) => Promise<void>;
  
  // Skill Progress
  updateSkillProgress: (userId: string, workshopId: string) => Promise<void>;
  getMemberSkillProgress: (userId: string) => GuildMemberSkillProgress | null;
  
  // Data Management
  refreshGuildJobData: () => Promise<void>;
  getJobsByStatus: (status: GuildJobStatus) => GuildJob[];
  getContractsByStatus: (status: ContractStatus) => GuildContract[];
}

const GuildJobContext = createContext<GuildJobContextType | undefined>(undefined);

const STORAGE_KEYS = {
  GUILD_JOBS: 'guildJobs',
  GUILD_CONTRACTS: 'guildContracts',
  GUILD_VAULT: 'guildVault',
  GUILD_WORKSHOPS: 'guildWorkshops',
  MEMBER_SKILL_PROGRESS: 'memberSkillProgress',
  VAULT_TRANSACTIONS: 'vaultTransactions',
};

interface GuildJobProviderProps {
  children: ReactNode;
  currentGuildId?: string;
  currentUserId?: string;
}

export function GuildJobProvider({ children, currentGuildId = 'test_guild', currentUserId = 'current_user' }: GuildJobProviderProps) {
  const [guildJobs, setGuildJobs] = useState<GuildJob[]>([]);
  const [activeContracts, setActiveContracts] = useState<GuildContract[]>([]);
  const [guildVault, setGuildVault] = useState<GuildVault | null>(null);
  const [workshops, setWorkshops] = useState<GuildWorkshop[]>([]);
  const [memberSkillProgress, setMemberSkillProgress] = useState<{ [userId: string]: GuildMemberSkillProgress }>({});
  const [vaultTransactions, setVaultTransactions] = useState<GuildVaultTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Load data on mount
  useEffect(() => {
    loadGuildJobData();
  }, [currentGuildId]);

  const loadGuildJobData = async () => {
    try {
      setLoading(true);
      
      const [
        jobsData,
        contractsData,
        vaultData,
        workshopsData,
        skillProgressData,
        transactionsData
      ] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.GUILD_JOBS),
        AsyncStorage.getItem(STORAGE_KEYS.GUILD_CONTRACTS),
        AsyncStorage.getItem(STORAGE_KEYS.GUILD_VAULT),
        AsyncStorage.getItem(STORAGE_KEYS.GUILD_WORKSHOPS),
        AsyncStorage.getItem(STORAGE_KEYS.MEMBER_SKILL_PROGRESS),
        AsyncStorage.getItem(STORAGE_KEYS.VAULT_TRANSACTIONS),
      ]);

      // Parse and set guild jobs
      if (jobsData) {
        const jobs = JSON.parse(jobsData) as GuildJob[];
        jobs.forEach(job => {
          job.createdAt = new Date(job.createdAt);
          job.deadline = new Date(job.deadline);
          if (job.startDate) job.startDate = new Date(job.startDate);
          if (job.completedAt) job.completedAt = new Date(job.completedAt);
        });
        setGuildJobs(jobs.filter(job => job.guildId === currentGuildId));
      } else {
        // No guild jobs available
        setGuildJobs([]);
      }

      // Parse and set contracts
      if (contractsData) {
        const contracts = JSON.parse(contractsData) as GuildContract[];
        contracts.forEach(contract => {
          contract.createdAt = new Date(contract.createdAt);
          contract.votingDeadline = new Date(contract.votingDeadline);
          if (contract.startDate) contract.startDate = new Date(contract.startDate);
          if (contract.completedAt) contract.completedAt = new Date(contract.completedAt);
        });
        setActiveContracts(contracts.filter(contract => contract.guildId === currentGuildId));
      }

      // Parse and set guild vault
      if (vaultData) {
        const vault = JSON.parse(vaultData) as GuildVault;
        vault.lastUpdated = new Date(vault.lastUpdated);
        if (vault.guildId === currentGuildId) {
          setGuildVault(vault);
        }
      } else {
        // Initialize guild vault
        const initialVault: GuildVault = {
          guildId: currentGuildId,
          balance: 25000, // Starting balance for testing
          workshopFund: 5000,
          courseFund: 3000,
          eventFund: 2000,
          emergencyFund: 5000,
          totalDeposited: 25000,
          totalWithdrawn: 0,
          totalEarned: 0,
          totalSpentOnDevelopment: 0,
          minBalanceRequired: 5000,
          autoFundingEnabled: true,
          autoFundingPercentage: 15, // 15% of job earnings auto-deposited
          lastUpdated: new Date(),
        };
        setGuildVault(initialVault);
        await AsyncStorage.setItem(STORAGE_KEYS.GUILD_VAULT, JSON.stringify(initialVault));
      }

      // Parse and set workshops
      if (workshopsData) {
        const workshopList = JSON.parse(workshopsData) as GuildWorkshop[];
        workshopList.forEach(workshop => {
          workshop.createdAt = new Date(workshop.createdAt);
          if (workshop.scheduledDate) workshop.scheduledDate = new Date(workshop.scheduledDate);
        });
        setWorkshops(workshopList.filter(workshop => workshop.guildId === currentGuildId));
      }

      // Parse and set skill progress
      if (skillProgressData) {
        const skillData = JSON.parse(skillProgressData) as { [userId: string]: GuildMemberSkillProgress };
        Object.values(skillData).forEach(progress => {
          progress.lastUpdated = new Date(progress.lastUpdated);
          Object.values(progress.skills).forEach(skill => {
            skill.lastImproved = new Date(skill.lastImproved);
          });
        });
        setMemberSkillProgress(skillData);
      }

      // Parse and set transactions
      if (transactionsData) {
        const transactions = JSON.parse(transactionsData) as GuildVaultTransaction[];
        transactions.forEach(transaction => {
          transaction.timestamp = new Date(transaction.timestamp);
        });
        setVaultTransactions(transactions.filter(transaction => transaction.guildId === currentGuildId));
      }

    } catch (error) {
      console.error('Failed to load guild job data:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveGuildJobData = async () => {
    try {
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.GUILD_JOBS, JSON.stringify(guildJobs)),
        AsyncStorage.setItem(STORAGE_KEYS.GUILD_CONTRACTS, JSON.stringify(activeContracts)),
        AsyncStorage.setItem(STORAGE_KEYS.GUILD_VAULT, JSON.stringify(guildVault)),
        AsyncStorage.setItem(STORAGE_KEYS.GUILD_WORKSHOPS, JSON.stringify(workshops)),
        AsyncStorage.setItem(STORAGE_KEYS.MEMBER_SKILL_PROGRESS, JSON.stringify(memberSkillProgress)),
        AsyncStorage.setItem(STORAGE_KEYS.VAULT_TRANSACTIONS, JSON.stringify(vaultTransactions)),
      ]);
    } catch (error) {
      console.error('Failed to save guild job data:', error);
    }
  };

  const createGuildJob = async (jobData: Partial<GuildJob>): Promise<GuildJob> => {
    const newJob = GuildJobSystem.createGuildJob(currentGuildId, currentUserId, jobData);
    const updatedJobs = [...guildJobs, newJob];
    setGuildJobs(updatedJobs);
    await saveGuildJobData();
    return newJob;
  };

  const assignMembersToJob = async (jobId: string, memberIds: string[]): Promise<void> => {
    const updatedJobs = guildJobs.map(job => 
      job.id === jobId 
        ? { ...job, assignedMembers: memberIds, status: 'active' as GuildJobStatus }
        : job
    );
    setGuildJobs(updatedJobs);
    await saveGuildJobData();
  };

  const updateJobStatus = async (jobId: string, status: GuildJobStatus): Promise<void> => {
    const updatedJobs = guildJobs.map(job => 
      job.id === jobId ? { ...job, status } : job
    );
    setGuildJobs(updatedJobs);
    await saveGuildJobData();
  };

  const createContract = async (
    jobId: string, 
    terms: string[], 
    responsibilities: { [userId: string]: string[] }
  ): Promise<GuildContract> => {
    const job = guildJobs.find(j => j.id === jobId);
    if (!job) throw new Error('Job not found');

    const contract = GuildJobSystem.createGuildContract(job, currentUserId, terms, responsibilities);
    const updatedContracts = [...activeContracts, contract];
    setActiveContracts(updatedContracts);

    // Update job with contract ID
    const updatedJobs = guildJobs.map(j => 
      j.id === jobId ? { ...j, contractId: contract.id, status: 'pending_approval' as GuildJobStatus } : j
    );
    setGuildJobs(updatedJobs);

    await saveGuildJobData();
    return contract;
  };

  const voteOnContract = async (contractId: string, userId: string, vote: 'accept' | 'reject'): Promise<void> => {
    const updatedContracts = activeContracts.map(contract => {
      if (contract.id === contractId) {
        const updatedVotes = { ...contract.memberVotes, [userId]: vote };
        const currentApprovals = Object.values(updatedVotes).filter(v => v === 'accept').length;
        
        let newStatus = contract.status;
        if (currentApprovals >= contract.requiredApprovals) {
          newStatus = 'approved';
        } else if (Object.values(updatedVotes).every(v => v !== 'pending')) {
          // All votes are in, check if we have enough approvals
          newStatus = currentApprovals >= contract.requiredApprovals ? 'approved' : 'rejected';
        }

        return {
          ...contract,
          memberVotes: updatedVotes,
          currentApprovals,
          status: newStatus,
        };
      }
      return contract;
    });

    setActiveContracts(updatedContracts);
    await saveGuildJobData();
  };

  const completeContract = async (contractId: string, actualEarnings: number): Promise<void> => {
    const contract = activeContracts.find(c => c.id === contractId);
    if (!contract || !guildVault) return;

    const result = GuildJobSystem.processContractCompletion(contract, actualEarnings, guildVault);

    // Update contract
    const updatedContracts = activeContracts.map(c => 
      c.id === contractId 
        ? { 
            ...c, 
            status: 'completed' as ContractStatus, 
            completedAt: new Date(),
            actualEarnings,
            distributedAmounts: result.distributedAmounts
          }
        : c
    );
    setActiveContracts(updatedContracts);

    // Update vault
    setGuildVault(result.updatedVault);

    // Update job status
    const updatedJobs = guildJobs.map(job => 
      job.contractId === contractId 
        ? { ...job, status: 'completed' as GuildJobStatus, completedAt: new Date() }
        : job
    );
    setGuildJobs(updatedJobs);

    // Add transaction record
    const transaction: GuildVaultTransaction = {
      id: `transaction_${Date.now()}`,
      guildId: currentGuildId,
      type: 'job_payment',
      amount: result.guildVaultAmount,
      description: `Payment from completed job: ${contract.title}`,
      initiatedBy: currentUserId,
      relatedJobId: contract.jobId,
      relatedContractId: contractId,
      timestamp: new Date(),
      status: 'completed',
    };

    setVaultTransactions([...vaultTransactions, transaction]);
    await saveGuildJobData();
  };

  const depositToVault = async (amount: number, description: string): Promise<void> => {
    if (!guildVault) return;

    const updatedVault = {
      ...guildVault,
      balance: guildVault.balance + amount,
      totalDeposited: guildVault.totalDeposited + amount,
      lastUpdated: new Date(),
    };

    const transaction: GuildVaultTransaction = {
      id: `transaction_${Date.now()}`,
      guildId: currentGuildId,
      type: 'deposit',
      amount,
      description,
      initiatedBy: currentUserId,
      timestamp: new Date(),
      status: 'completed',
    };

    setGuildVault(updatedVault);
    setVaultTransactions([...vaultTransactions, transaction]);
    await saveGuildJobData();
  };

  const withdrawFromVault = async (amount: number, description: string, category?: string): Promise<void> => {
    if (!guildVault || guildVault.balance < amount) {
      throw new Error('Insufficient funds in guild vault');
    }

    const updatedVault = {
      ...guildVault,
      balance: guildVault.balance - amount,
      totalWithdrawn: guildVault.totalWithdrawn + amount,
      lastUpdated: new Date(),
    };

    // Update specific fund category
    if (category === 'workshop') {
      updatedVault.workshopFund += amount;
      updatedVault.totalSpentOnDevelopment += amount;
    } else if (category === 'course') {
      updatedVault.courseFund += amount;
      updatedVault.totalSpentOnDevelopment += amount;
    } else if (category === 'event') {
      updatedVault.eventFund += amount;
    }

    const transaction: GuildVaultTransaction = {
      id: `transaction_${Date.now()}`,
      guildId: currentGuildId,
      type: 'withdrawal',
      amount,
      description,
      initiatedBy: currentUserId,
      category,
      timestamp: new Date(),
      status: 'completed',
    };

    setGuildVault(updatedVault);
    setVaultTransactions([...vaultTransactions, transaction]);
    await saveGuildJobData();
  };

  const createWorkshop = async (workshopData: Partial<GuildWorkshop>): Promise<GuildWorkshop> => {
    const workshop = GuildJobSystem.createGuildWorkshop(currentGuildId, currentUserId, workshopData);
    setWorkshops([...workshops, workshop]);
    await saveGuildJobData();
    return workshop;
  };

  const registerForWorkshop = async (workshopId: string, userId: string): Promise<void> => {
    const updatedWorkshops = workshops.map(workshop => 
      workshop.id === workshopId && !workshop.registeredMembers.includes(userId)
        ? { ...workshop, registeredMembers: [...workshop.registeredMembers, userId] }
        : workshop
    );
    setWorkshops(updatedWorkshops);
    await saveGuildJobData();
  };

  const completeWorkshop = async (workshopId: string, userId: string, rating: number, feedback: string): Promise<void> => {
    const updatedWorkshops = workshops.map(workshop => {
      if (workshop.id === workshopId) {
        const completedMembers = workshop.completedMembers.includes(userId) 
          ? workshop.completedMembers 
          : [...workshop.completedMembers, userId];
        
        const updatedFeedback = { ...workshop.feedback, [userId]: feedback };
        
        // Calculate average rating
        const ratings = Object.keys(updatedFeedback).length;
        const currentAverage = workshop.averageRating || 0;
        const newAverage = ratings === 1 ? rating : ((currentAverage * (ratings - 1)) + rating) / ratings;

        return {
          ...workshop,
          completedMembers,
          feedback: updatedFeedback,
          averageRating: newAverage,
        };
      }
      return workshop;
    });

    setWorkshops(updatedWorkshops);
    
    // Update skill progress
    await updateSkillProgress(userId, workshopId);
  };

  const fundWorkshop = async (workshopId: string): Promise<void> => {
    const workshop = workshops.find(w => w.id === workshopId);
    if (!workshop || !guildVault) return;

    const result = GuildJobSystem.fundWorkshop(workshop, guildVault);
    if (!result.success) {
      throw new Error(result.error);
    }

    // Update workshop funding status
    const updatedWorkshops = workshops.map(w => 
      w.id === workshopId ? { ...w, fundingStatus: 'funded' as any } : w
    );
    setWorkshops(updatedWorkshops);

    // Update vault
    setGuildVault(result.updatedVault!);

    // Add transaction
    const transaction: GuildVaultTransaction = {
      id: `transaction_${Date.now()}`,
      guildId: currentGuildId,
      type: 'workshop_funding',
      amount: workshop.cost,
      description: `Funding for workshop: ${workshop.title}`,
      initiatedBy: currentUserId,
      category: 'workshop',
      timestamp: new Date(),
      status: 'completed',
    };

    setVaultTransactions([...vaultTransactions, transaction]);
    await saveGuildJobData();
  };

  const updateSkillProgress = async (userId: string, workshopId: string): Promise<void> => {
    const workshop = workshops.find(w => w.id === workshopId);
    if (!workshop) return;

    const currentProgress = memberSkillProgress[userId];
    const updatedProgress = GuildJobSystem.updateMemberSkillProgress(
      userId, 
      currentGuildId, 
      workshop, 
      currentProgress
    );

    setMemberSkillProgress({
      ...memberSkillProgress,
      [userId]: updatedProgress,
    });

    await saveGuildJobData();
  };

  const getMemberSkillProgress = (userId: string): GuildMemberSkillProgress | null => {
    return memberSkillProgress[userId] || null;
  };

  const refreshGuildJobData = async (): Promise<void> => {
    await loadGuildJobData();
  };

  const getJobsByStatus = (status: GuildJobStatus): GuildJob[] => {
    return guildJobs.filter(job => job.status === status);
  };

  const getContractsByStatus = (status: ContractStatus): GuildContract[] => {
    return activeContracts.filter(contract => contract.status === status);
  };

  const value: GuildJobContextType = {
    guildJobs,
    activeContracts,
    guildVault,
    workshops,
    memberSkillProgress,
    vaultTransactions,
    loading,
    createGuildJob,
    assignMembersToJob,
    updateJobStatus,
    createContract,
    voteOnContract,
    completeContract,
    depositToVault,
    withdrawFromVault,
    createWorkshop,
    registerForWorkshop,
    completeWorkshop,
    fundWorkshop,
    updateSkillProgress,
    getMemberSkillProgress,
    refreshGuildJobData,
    getJobsByStatus,
    getContractsByStatus,
  };

  return (
    <GuildJobContext.Provider value={value}>
      {children}
    </GuildJobContext.Provider>
  );
}

export function useGuildJobs(): GuildJobContextType {
  const context = useContext(GuildJobContext);
  if (context === undefined) {
    throw new Error('useGuildJobs must be used within a GuildJobProvider');
  }
  return context;
}

export default GuildJobContext;



