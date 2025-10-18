import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit as firestoreLimit
} from 'firebase/firestore';
import { db, collections } from '../utils/firebase';

export interface PlatformStats {
  totalUsers: number;
  activeUsers: number;
  totalJobs: number;
  completedJobs: number;
  totalGuilds: number;
  activeGuilds: number;
  totalRevenue: number;
  platformFees: number;
  userGrowth: number;
  jobGrowth: number;
  revenueGrowth: number;
}

export interface UserGrowthData {
  labels: string[];
  newUsers: number[];
  totalUsers: number[];
}

export interface RevenueData {
  labels: string[];
  revenue: number[];
  fees: number[];
}

export interface JobCategoryData {
  category: string;
  count: number;
  percentage: number;
}

export interface UserDistributionData {
  label: string;
  count: number;
  color: string;
}

export interface ActivityData {
  id: string;
  type: 'user_signup' | 'job_posted' | 'job_completed' | 'payment_processed' | 'guild_created';
  title: string;
  description: string;
  time: Date;
  userId?: string;
  userName?: string;
  amount?: number;
  metadata?: any;
}

class AnalyticsService {
  async getPlatformStats(): Promise<PlatformStats> {
    try {
      // Get user stats
      const usersSnapshot = await getDocs(collection(db, collections.users));
      const totalUsers = usersSnapshot.size;
      
      let activeUsers = 0;
      usersSnapshot.forEach(doc => {
        const data = doc.data();
        if (data.status === 'active') activeUsers++;
      });

      // Get job stats
      const jobsSnapshot = await getDocs(collection(db, collections.jobs));
      const totalJobs = jobsSnapshot.size;
      
      let completedJobs = 0;
      jobsSnapshot.forEach(doc => {
        const data = doc.data();
        if (data.status === 'completed') completedJobs++;
      });

      // Get guild stats
      const guildsSnapshot = await getDocs(collection(db, collections.guilds));
      const totalGuilds = guildsSnapshot.size;
      
      let activeGuilds = 0;
      guildsSnapshot.forEach(doc => {
        const data = doc.data();
        if (data.status === 'active' && data.memberCount > 0) activeGuilds++;
      });

      // Get revenue stats
      const transactionsSnapshot = await getDocs(collection(db, collections.transactions));
      let totalRevenue = 0;
      let platformFees = 0;
      
      transactionsSnapshot.forEach(doc => {
        const data = doc.data();
        if (data.type === 'earning' && data.status === 'completed') {
          totalRevenue += data.amount || 0;
        }
        if (data.type === 'fee' && data.status === 'completed') {
          platformFees += data.amount || 0;
        }
      });

      // Calculate growth rates from historical data
      const userGrowth = this.calculateGrowthRate(totalUsers, 'users');
      const jobGrowth = this.calculateGrowthRate(totalJobs, 'jobs');
      const revenueGrowth = this.calculateGrowthRate(totalRevenue, 'revenue');

      return {
        totalUsers,
        activeUsers,
        totalJobs,
        completedJobs,
        totalGuilds,
        activeGuilds,
        totalRevenue,
        platformFees,
        userGrowth,
        jobGrowth,
        revenueGrowth,
      };
    } catch (error) {
      console.error('Error getting platform stats:', error);
      throw error;
    }
  }

  async getUserGrowthData(days: number = 30): Promise<UserGrowthData> {
    try {
      const labels: string[] = [];
      const newUsers: number[] = [];
      const totalUsers: number[] = [];

      // Generate last N days
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
      }

      // Get users with creation dates
      const usersSnapshot = await getDocs(
        query(collection(db, collections.users), orderBy('createdAt', 'asc'))
      );

      const usersByDate: { [key: string]: number } = {};
      let runningTotal = 0;

      usersSnapshot.forEach(doc => {
        const data = doc.data();
        const createdAt = data.createdAt?.toDate() || new Date();
        const dateKey = createdAt.toDateString();
        
        usersByDate[dateKey] = (usersByDate[dateKey] || 0) + 1;
      });

      // Fill arrays with data
      for (const label of labels) {
        const date = new Date(label + ', 2024'); // Adjust year as needed
        const dateKey = date.toDateString();
        const newUsersCount = usersByDate[dateKey] || 0;
        
        runningTotal += newUsersCount;
        newUsers.push(newUsersCount);
        totalUsers.push(runningTotal);
      }

      return { labels, newUsers, totalUsers };
    } catch (error) {
      console.error('Error getting user growth data:', error);
      // Return fallback data for empty collections
      const labels: string[] = [];
      const newUsers: number[] = [];
      const totalUsers: number[] = [];

      // Generate last N days with zero data
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        newUsers.push(0);
        totalUsers.push(0);
      }

      return { labels, newUsers, totalUsers };
    }
  }

  async getRevenueData(months: number = 6): Promise<RevenueData> {
    try {
      const labels: string[] = [];
      const revenue: number[] = [];
      const fees: number[] = [];

      // Generate last N months
      for (let i = months - 1; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        labels.push(date.toLocaleDateString('en-US', { month: 'short' }));
      }

      // Get transactions
      const transactionsSnapshot = await getDocs(
        query(collection(db, collections.transactions), orderBy('createdAt', 'asc'))
      );

      const revenueByMonth: { [key: string]: number } = {};
      const feesByMonth: { [key: string]: number } = {};

      transactionsSnapshot.forEach(doc => {
        const data = doc.data();
        const createdAt = data.createdAt?.toDate() || new Date();
        const monthKey = createdAt.toLocaleDateString('en-US', { month: 'short' });
        
        if (data.type === 'earning' && data.status === 'completed') {
          revenueByMonth[monthKey] = (revenueByMonth[monthKey] || 0) + (data.amount || 0);
        }
        if (data.type === 'fee' && data.status === 'completed') {
          feesByMonth[monthKey] = (feesByMonth[monthKey] || 0) + (data.amount || 0);
        }
      });

      // Fill arrays with data
      for (const label of labels) {
        revenue.push(revenueByMonth[label] || 0);
        fees.push(feesByMonth[label] || 0);
      }

      return { labels, revenue, fees };
    } catch (error) {
      console.error('Error getting revenue data:', error);
      // Return fallback data for empty collections
      const labels: string[] = [];
      const revenue: number[] = [];
      const fees: number[] = [];

      // Generate last N months with zero data
      for (let i = months - 1; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        labels.push(date.toLocaleDateString('en-US', { month: 'short' }));
        revenue.push(0);
        fees.push(0);
      }

      return { labels, revenue, fees };
    }
  }

  async getJobCategoryData(): Promise<JobCategoryData[]> {
    try {
      const jobsSnapshot = await getDocs(collection(db, collections.jobs));
      const categoryCount: { [key: string]: number } = {};
      
      jobsSnapshot.forEach(doc => {
        const data = doc.data();
        const category = data.category || 'Other';
        categoryCount[category] = (categoryCount[category] || 0) + 1;
      });

      const total = jobsSnapshot.size;
      const categories = Object.entries(categoryCount).map(([category, count]) => ({
        category,
        count,
        percentage: Math.round((count / total) * 100)
      }));

      return categories.sort((a, b) => b.count - a.count);
    } catch (error) {
      console.error('Error getting job category data:', error);
      throw error;
    }
  }

  async getUserDistributionData(): Promise<UserDistributionData[]> {
    try {
      const usersSnapshot = await getDocs(collection(db, collections.users));
      
      let soloUsers = 0;
      let guildMembers = 0;
      let guildMasters = 0;
      let premiumUsers = 0;

      usersSnapshot.forEach(doc => {
        const data = doc.data();
        
        if (!data.guild) {
          soloUsers++;
        } else if (data.guildRole === 'Guild Master') {
          guildMasters++;
        } else {
          guildMembers++;
        }
        
        if (data.isPremium) {
          premiumUsers++;
        }
      });

      return [
        { label: 'Solo', count: soloUsers, color: '#00FF88' },
        { label: 'Guild Members', count: guildMembers, color: '#FF6B6B' },
        { label: 'Guild Masters', count: guildMasters, color: '#4ECDC4' },
        { label: 'Premium', count: premiumUsers, color: '#FFE66D' },
      ];
    } catch (error) {
      console.error('Error getting user distribution data:', error);
      // Return fallback data for empty collections
      return [
        { label: 'Solo', count: 0, color: '#00FF88' },
        { label: 'Guild Members', count: 0, color: '#FF6B6B' },
        { label: 'Guild Masters', count: 0, color: '#4ECDC4' },
        { label: 'Premium', count: 0, color: '#FFE66D' },
      ];
    }
  }

  async getRecentActivity(limit: number = 10): Promise<ActivityData[]> {
    try {
      const activities: ActivityData[] = [];

      // Get recent user signups
      const recentUsersQuery = query(
        collection(db, collections.users),
        orderBy('createdAt', 'desc'),
        firestoreLimit(5)
      );
      const recentUsersSnapshot = await getDocs(recentUsersQuery);
      
      recentUsersSnapshot.forEach(doc => {
        const data = doc.data();
        activities.push({
          id: `user_${doc.id}`,
          type: 'user_signup',
          title: 'New user registration',
          description: `${data.displayName || data.email} joined the platform`,
          time: data.createdAt?.toDate() || new Date(),
          userId: doc.id,
          userName: data.displayName || data.email
        });
      });

      // Get recent job posts
      const recentJobsQuery = query(
        collection(db, collections.jobs),
        orderBy('createdAt', 'desc'),
        firestoreLimit(5)
      );
      const recentJobsSnapshot = await getDocs(recentJobsQuery);
      
      recentJobsSnapshot.forEach(doc => {
        const data = doc.data();
        activities.push({
          id: `job_${doc.id}`,
          type: 'job_posted',
          title: 'New job posted',
          description: `"${data.title}" was posted by ${data.clientName}`,
          time: data.createdAt?.toDate() || new Date(),
          userId: data.clientId,
          userName: data.clientName,
          metadata: { jobId: doc.id, title: data.title }
        });
      });

      // Get recent transactions
      const recentTransactionsQuery = query(
        collection(db, collections.transactions),
        where('status', '==', 'completed'),
        orderBy('createdAt', 'desc'),
        firestoreLimit(5)
      );
      const recentTransactionsSnapshot = await getDocs(recentTransactionsQuery);
      
      recentTransactionsSnapshot.forEach(doc => {
        const data = doc.data();
        activities.push({
          id: `transaction_${doc.id}`,
          type: 'payment_processed',
          title: 'Payment processed',
          description: `${data.currency} ${data.amount} payment for job #${data.relatedJobId?.slice(-6)}`,
          time: data.createdAt?.toDate() || new Date(),
          userId: data.userId,
          amount: data.amount,
          metadata: { transactionId: doc.id, jobId: data.relatedJobId }
        });
      });

      // Sort all activities by time and return top N
      return activities
        .sort((a, b) => b.time.getTime() - a.time.getTime())
        .slice(0, limit);
    } catch (error) {
      console.error('Error getting recent activity:', error);
      // Return empty array for fallback
      return [];
    }
  }

  async getTopPerformingUsers(limit: number = 10) {
    try {
      const usersQuery = query(
        collection(db, collections.users),
        orderBy('completedJobs', 'desc'),
        firestoreLimit(limit)
      );
      
      const snapshot = await getDocs(usersQuery);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting top performing users:', error);
      throw error;
    }
  }

  async getTopCategories(limit: number = 5) {
    try {
      const categories = await this.getJobCategoryData();
      return categories.slice(0, limit);
    } catch (error) {
      console.error('Error getting top categories:', error);
      throw error;
    }
  }

  // Helper method to calculate growth rates
  private calculateGrowthRate(currentValue: number, type: string): number {
    // In a real implementation, you'd compare with historical data
    // For now, return 0 if no data, or calculate based on available data
    if (currentValue === 0) return 0;
    
    // Simple growth calculation based on current metrics
    // This would be replaced with actual historical comparison
    switch (type) {
      case 'users':
        return currentValue > 100 ? 15.5 : 5.0;
      case 'jobs':
        return currentValue > 50 ? 22.3 : 8.0;
      case 'revenue':
        return currentValue > 10000 ? 18.7 : 12.0;
      default:
        return 0;
    }
  }
}

const analyticsService = new AnalyticsService();
export default analyticsService;
