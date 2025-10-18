import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RankingSystem, UserStats, RankLevel, RankBenefits } from '../utils/rankingSystem';

interface RankingContextType {
  // Current user stats and rank
  userStats: UserStats | null;
  currentRank: RankLevel;
  rankBenefits: RankBenefits;
  
  // Progress information
  nextRankProgress: {
    currentRank: RankLevel;
    nextRank: RankLevel | null;
    progress: number;
    missingRequirements: string[];
  } | null;
  
  // Time estimates
  timeToNextRank: {
    nextRank: RankLevel | null;
    estimatedDays: number | null;
    bottleneck: string | null;
  } | null;
  
  // Loading state
  loading: boolean;
  
  // Actions
  updateUserStats: (newStats: Partial<UserStats>) => Promise<void>;
  addCompletedTask: (earnings: number, rating: number) => Promise<void>;
  updateSkillLevel: (newSkillLevel: number) => Promise<void>;
  refreshRanking: () => Promise<void>;
  resetStats: () => Promise<void>;
}

const RankingContext = createContext<RankingContextType | undefined>(undefined);

const STORAGE_KEY = 'userRankingStats';

interface RankingProviderProps {
  children: ReactNode;
}

export function RankingProvider({ children }: RankingProviderProps) {
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [currentRank, setCurrentRank] = useState<RankLevel>('G');
  const [rankBenefits, setRankBenefits] = useState<RankBenefits>(RankingSystem.getRankBenefits('G'));
  const [nextRankProgress, setNextRankProgress] = useState<RankingContextType['nextRankProgress']>(null);
  const [timeToNextRank, setTimeToNextRank] = useState<RankingContextType['timeToNextRank']>(null);
  const [loading, setLoading] = useState(true);

  // Load user stats from storage
  useEffect(() => {
    loadUserStats();
  }, []);

  // Update calculations when stats change
  useEffect(() => {
    if (userStats) {
      calculateRankingInfo();
    }
  }, [userStats]);

  const loadUserStats = async () => {
    try {
      // Force reset to new default stats (temporary fix for cached old data)
      const defaultStats = createDefaultStats();
      setUserStats(defaultStats);
      await saveUserStats(defaultStats);
      
      // TODO: Remove this force reset after users have updated
      // const savedStats = await AsyncStorage.getItem(STORAGE_KEY);
      // if (savedStats) {
      //   const stats = JSON.parse(savedStats) as UserStats;
      //   setUserStats(stats);
      // } else {
      //   const defaultStats = createDefaultStats();
      //   setUserStats(defaultStats);
      //   await saveUserStats(defaultStats);
      // }
    } catch (error) {
      console.error('Failed to load user ranking stats:', error);
      // Fallback to default stats
      const defaultStats = createDefaultStats();
      setUserStats(defaultStats);
    } finally {
      setLoading(false);
    }
  };

  const saveUserStats = async (stats: UserStats) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
    } catch (error) {
      console.error('Failed to save user ranking stats:', error);
    }
  };

  const createDefaultStats = (): UserStats => {
    const accountCreationDate = new Date();
    const accountAge = Math.floor((Date.now() - accountCreationDate.getTime()) / (1000 * 60 * 60 * 24));
    
    return {
      tasksCompleted: 0,
      tasksInProgress: 0,
      taskSuccessRate: 0,
      averageRating: 0,
      totalEarnings: 0,
      monthlyEarnings: 0,
      averageJobValue: 0,
      skillLevel: 0, // Start at 0 - will be set by backend ranking logic
      skillsVerified: 0,
      endorsements: 0,
      accountAge: Math.max(accountAge, 0),
      activeStreak: 0, // Start at 0
      responseTime: 24, // Default 24 hours
      clientRetentionRate: 0,
      disputeRate: 0,
      onTimeDeliveryRate: 0,
    };
  };

  const calculateRankingInfo = () => {
    if (!userStats) return;

    // Calculate current rank
    const newRank = RankingSystem.calculateRank(userStats);
    setCurrentRank(newRank);
    
    // Get rank benefits
    const benefits = RankingSystem.getRankBenefits(newRank);
    setRankBenefits(benefits);
    
    // Calculate progress to next rank
    const progress = RankingSystem.getNextRankProgress(userStats);
    setNextRankProgress(progress);
    
    // Estimate time to next rank
    const timeEstimate = RankingSystem.estimateTimeToNextRank(userStats);
    setTimeToNextRank(timeEstimate);
  };

  const updateUserStats = async (newStats: Partial<UserStats>) => {
    if (!userStats) return;
    
    const updatedStats = { ...userStats, ...newStats };
    setUserStats(updatedStats);
    await saveUserStats(updatedStats);
  };

  const addCompletedTask = async (earnings: number, rating: number) => {
    if (!userStats) return;
    
    const newTasksCompleted = userStats.tasksCompleted + 1;
    const newTotalEarnings = userStats.totalEarnings + earnings;
    
    // Calculate new average rating
    const totalRatingPoints = userStats.averageRating * userStats.tasksCompleted + rating;
    const newAverageRating = totalRatingPoints / newTasksCompleted;
    
    // Calculate new success rate (assuming this task was successful)
    const newSuccessRate = (userStats.taskSuccessRate * userStats.tasksCompleted + 100) / newTasksCompleted;
    
    // Update average job value
    const newAverageJobValue = newTotalEarnings / newTasksCompleted;
    
    // Update monthly earnings (simplified - in real app, track by month)
    const newMonthlyEarnings = userStats.monthlyEarnings + earnings;
    
    await updateUserStats({
      tasksCompleted: newTasksCompleted,
      totalEarnings: newTotalEarnings,
      averageRating: Math.min(5, newAverageRating), // Cap at 5 stars
      taskSuccessRate: Math.min(100, newSuccessRate), // Cap at 100%
      averageJobValue: newAverageJobValue,
      monthlyEarnings: newMonthlyEarnings,
      onTimeDeliveryRate: Math.min(100, userStats.onTimeDeliveryRate + 1), // Assume on-time delivery
    });
    
    console.log(`✅ Task completed! Earned ${earnings} QAR, Rating: ${rating}/5`);
  };

  const updateSkillLevel = async (newSkillLevel: number) => {
    await updateUserStats({
      skillLevel: Math.min(100, Math.max(0, newSkillLevel)), // Clamp between 0-100
    });
  };

  const refreshRanking = async () => {
    if (userStats) {
      calculateRankingInfo();
    }
  };

  const resetStats = async () => {
    const defaultStats = createDefaultStats();
    setUserStats(defaultStats);
    await saveUserStats(defaultStats);
  };

  const value: RankingContextType = {
    userStats,
    currentRank,
    rankBenefits,
    nextRankProgress,
    timeToNextRank,
    loading,
    updateUserStats,
    addCompletedTask,
    updateSkillLevel,
    refreshRanking,
    resetStats,
  };

  return (
    <RankingContext.Provider value={value}>
      {children}
    </RankingContext.Provider>
  );
}

export function useRanking(): RankingContextType {
  const context = useContext(RankingContext);
  if (context === undefined) {
    throw new Error('useRanking must be used within a RankingProvider');
  }
  return context;
}

export default RankingContext;

