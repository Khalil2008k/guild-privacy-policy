/**
 * Demo Data Service
 * Provides realistic demo data for testing and demonstrations
 */

export interface DemoUser {
  id: string;
  uid: string;
  email: string;
  displayName: string;
  fullName: string;
  phoneNumber: string;
  status: 'active' | 'inactive' | 'suspended';
  role: 'freelancer' | 'client' | 'admin';
  guild: string | null;
  rating: number;
  jobsCompleted: number;
  walletBalance: number;
  createdAt: Date;
  lastActive: Date;
  avatar?: string;
}

export interface DemoJob {
  id: string;
  title: string;
  description: string;
  category: string;
  budget: number;
  currency: string;
  status: 'open' | 'in_progress' | 'completed' | 'cancelled';
  adminStatus: 'pending' | 'approved' | 'rejected';
  clientId: string;
  clientName: string;
  freelancerId?: string;
  freelancerName?: string;
  createdAt: Date;
  deadline?: Date;
  tags: string[];
}

export interface DemoGuild {
  id: string;
  name: string;
  description: string;
  masterName: string;
  membersCount: number;
  isActive: boolean;
  rating: number;
  projectsCompleted: number;
  createdAt: Date;
  category: string;
}

export interface DemoTransaction {
  id: string;
  type: 'payment' | 'refund' | 'withdrawal' | 'deposit';
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed';
  userId: string;
  userName: string;
  orderId?: string;
  paymentMethod: string;
  timestamp: Date;
}

export interface DemoActivity {
  id: string;
  type: 'user_signup' | 'job_posted' | 'job_completed' | 'payment_processed' | 'guild_created';
  title: string;
  description: string;
  userId?: string;
  userName?: string;
  time: Date;
}

class DemoDataService {
  private isDemoMode: boolean = false;

  constructor() {
    // Check if demo mode is enabled
    this.isDemoMode = process.env.REACT_APP_ENABLE_DEMO_MODE === 'true' || 
                     localStorage.getItem('adminDemoMode') === 'true';
  }

  /**
   * Enable demo mode
   */
  enableDemoMode(): void {
    this.isDemoMode = true;
    localStorage.setItem('adminDemoMode', 'true');
    console.log('✅ Demo mode enabled');
  }

  /**
   * Disable demo mode
   */
  disableDemoMode(): void {
    this.isDemoMode = false;
    localStorage.removeItem('adminDemoMode');
    console.log('❌ Demo mode disabled');
  }

  /**
   * Check if demo mode is active
   */
  isDemoModeActive(): boolean {
    return this.isDemoMode;
  }

  /**
   * Generate demo users
   */
  getDemoUsers(): DemoUser[] {
    const qatariNames = [
      { first: 'Ahmed', last: 'Al-Mansoori' },
      { first: 'Fatima', last: 'Al-Khalifa' },
      { first: 'Mohammed', last: 'Al-Thani' },
      { first: 'Sarah', last: 'Al-Attiyah' },
      { first: 'Khalid', last: 'Al-Sulaiti' },
      { first: 'Noora', last: 'Al-Marri' },
      { first: 'Omar', last: 'Al-Kuwari' },
      { first: 'Maryam', last: 'Al-Nasr' },
      { first: 'Abdullah', last: 'Al-Kaabi' },
      { first: 'Hessa', last: 'Al-Dosari' },
    ];

    return qatariNames.map((name, index) => ({
      id: `user-${index + 1}`,
      uid: `uid-${index + 1}`,
      email: `${name.first.toLowerCase()}.${name.last.toLowerCase()}@guild.app`,
      displayName: `${name.first} ${name.last}`,
      fullName: `${name.first} ${name.last}`,
      phoneNumber: `+974${3000 + index}${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
      status: index % 10 === 0 ? 'inactive' : 'active',
      role: index % 3 === 0 ? 'client' : 'freelancer',
      guild: index % 5 === 0 ? `guild-${Math.floor(index / 5)}` : null,
      rating: 4.0 + Math.random() * 1.0,
      jobsCompleted: Math.floor(Math.random() * 50),
      walletBalance: Math.floor(Math.random() * 10000) + 500,
      createdAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000),
      lastActive: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      avatar: `https://ui-avatars.com/api/?name=${name.first}+${name.last}&background=00FF88&color=0A0A0A`
    }));
  }

  /**
   * Generate demo jobs
   */
  getDemoJobs(): DemoJob[] {
    const jobTitles = [
      { title: 'Mobile App Development', category: 'Development', budget: 5000 },
      { title: 'Logo Design for Startup', category: 'Design', budget: 800 },
      { title: 'Content Writing - 10 Articles', category: 'Writing', budget: 1200 },
      { title: 'Website Redesign', category: 'Design', budget: 3500 },
      { title: 'Social Media Management', category: 'Marketing', budget: 2000 },
      { title: 'Video Editing for YouTube', category: 'Video', budget: 1500 },
      { title: 'SEO Optimization', category: 'Marketing', budget: 1800 },
      { title: 'Database Migration', category: 'Development', budget: 4000 },
      { title: 'UI/UX Design for Dashboard', category: 'Design', budget: 2500 },
      { title: 'Backend API Development', category: 'Development', budget: 6000 },
    ];

    const statuses: Array<'open' | 'in_progress' | 'completed' | 'cancelled'> = ['open', 'in_progress', 'completed', 'cancelled'];
    const adminStatuses: Array<'pending' | 'approved' | 'rejected'> = ['pending', 'approved', 'rejected'];

    return jobTitles.map((job, index) => ({
      id: `job-${index + 1}`,
      title: job.title,
      description: `Professional ${job.category.toLowerCase()} project requiring experienced freelancer. Detailed requirements will be provided upon selection.`,
      category: job.category,
      budget: job.budget,
      currency: 'QAR',
      status: statuses[index % 4],
      adminStatus: index < 3 ? 'pending' : adminStatuses[Math.floor(Math.random() * 3)],
      clientId: `user-${Math.floor(Math.random() * 10) + 1}`,
      clientName: `Client ${index + 1}`,
      freelancerId: index % 2 === 0 ? `user-${Math.floor(Math.random() * 10) + 1}` : undefined,
      freelancerName: index % 2 === 0 ? `Freelancer ${index + 1}` : undefined,
      createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      deadline: new Date(Date.now() + Math.random() * 60 * 24 * 60 * 60 * 1000),
      tags: [job.category, 'Qatar', 'Remote']
    }));
  }

  /**
   * Generate demo guilds
   */
  getDemoGuilds(): DemoGuild[] {
    const guildNames = [
      { name: 'Tech Innovators Guild', category: 'Technology' },
      { name: 'Creative Designers Hub', category: 'Design' },
      { name: 'Digital Marketing Pros', category: 'Marketing' },
      { name: 'Content Creators Alliance', category: 'Writing' },
      { name: 'Full-Stack Developers', category: 'Development' },
    ];

    return guildNames.map((guild, index) => ({
      id: `guild-${index + 1}`,
      name: guild.name,
      description: `Professional ${guild.category.toLowerCase()} guild focusing on high-quality deliverables and client satisfaction.`,
      masterName: `Master ${index + 1}`,
      membersCount: Math.floor(Math.random() * 20) + 5,
      isActive: index !== 4,
      rating: 4.2 + Math.random() * 0.8,
      projectsCompleted: Math.floor(Math.random() * 100) + 10,
      createdAt: new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000),
      category: guild.category
    }));
  }

  /**
   * Generate demo transactions
   */
  getDemoTransactions(): DemoTransaction[] {
    const types: Array<'payment' | 'refund' | 'withdrawal' | 'deposit'> = ['payment', 'refund', 'withdrawal', 'deposit'];
    const statuses: Array<'pending' | 'completed' | 'failed'> = ['pending', 'completed', 'failed'];
    const paymentMethods = ['Credit Card', 'Fatora', 'Wallet', 'Bank Transfer'];

    return Array.from({ length: 15 }, (_, index) => ({
      id: `txn-${index + 1}`,
      type: types[index % 4],
      amount: Math.floor(Math.random() * 5000) + 100,
      currency: 'QAR',
      status: statuses[index % 3],
      userId: `user-${Math.floor(Math.random() * 10) + 1}`,
      userName: `User ${index + 1}`,
      orderId: `ORD-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      paymentMethod: paymentMethods[index % 4],
      timestamp: new Date(Date.now() - Math.random() * 14 * 24 * 60 * 60 * 1000)
    }));
  }

  /**
   * Generate demo activities
   */
  getDemoActivities(): DemoActivity[] {
    const activities: Array<{
      type: 'user_signup' | 'job_posted' | 'job_completed' | 'payment_processed' | 'guild_created';
      titleTemplate: string;
      descTemplate: string;
    }> = [
      { type: 'user_signup', titleTemplate: 'New User Registered', descTemplate: '{user} joined the platform' },
      { type: 'job_posted', titleTemplate: 'New Job Posted', descTemplate: '{user} posted a new job' },
      { type: 'job_completed', titleTemplate: 'Job Completed', descTemplate: '{user} completed a job' },
      { type: 'payment_processed', titleTemplate: 'Payment Processed', descTemplate: '{user} made a payment of {amount} QAR' },
      { type: 'guild_created', titleTemplate: 'Guild Created', descTemplate: '{user} created a new guild' },
    ];

    return Array.from({ length: 20 }, (_, index) => {
      const activity = activities[index % 5];
      const userName = `User ${Math.floor(Math.random() * 10) + 1}`;
      const amount = Math.floor(Math.random() * 5000) + 100;

      return {
        id: `activity-${index + 1}`,
        type: activity.type,
        title: activity.titleTemplate,
        description: activity.descTemplate
          .replace('{user}', userName)
          .replace('{amount}', amount.toString()),
        userId: `user-${index + 1}`,
        userName: userName,
        time: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
      };
    });
  }

  /**
   * Get demo statistics
   */
  getDemoStats() {
    return {
      totalUsers: 156,
      activeUsers: 142,
      totalJobs: 89,
      completedJobs: 67,
      totalGuilds: 23,
      activeGuilds: 21,
      totalRevenue: 234567.89,
      userGrowth: 12.5,
      jobGrowth: 8.3,
      revenueGrowth: 15.7,
      pendingApprovals: 3,
      activeSubscriptions: 48,
      averageRating: 4.7
    };
  }

  /**
   * Get user growth chart data
   */
  getUserGrowthData(days: number = 7) {
    const labels: string[] = [];
    const newUsers: number[] = [];
    const totalUsers: number[] = [];
    let cumulativeTotal = 120;

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
      
      const dailyNew = Math.floor(Math.random() * 8) + 2;
      newUsers.push(dailyNew);
      cumulativeTotal += dailyNew;
      totalUsers.push(cumulativeTotal);
    }

    return { labels, newUsers, totalUsers };
  }

  /**
   * Get revenue chart data
   */
  getRevenueData() {
    const labels: string[] = [];
    const revenue: number[] = [];
    const fees: number[] = [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      labels.push(date.toLocaleDateString('en-US', { month: 'short' }));
      
      const monthRevenue = Math.floor(Math.random() * 30000) + 20000;
      revenue.push(monthRevenue);
      fees.push(Math.floor(monthRevenue * 0.15));
    }

    return { labels, revenue, fees };
  }

  /**
   * Get user distribution data
   */
  getUserDistribution() {
    return [
      { label: 'Solo Freelancers', count: 78, color: '#00FF88' },
      { label: 'Guild Members', count: 47, color: '#FF6B6B' },
      { label: 'Guild Masters', count: 23, color: '#4ECDC4' },
      { label: 'Premium Users', count: 8, color: '#FFE66D' },
    ];
  }
}

export const demoDataService = new DemoDataService();
export default demoDataService;

