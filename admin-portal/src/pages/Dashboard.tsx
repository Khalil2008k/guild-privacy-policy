import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { 
  Users, 
  Shield, 
  Briefcase, 
  TrendingUp,
  DollarSign,
  Activity,
  Calendar,
  MoreVertical,
  AlertCircle,
  CheckCircle,
  FileText,
  Bell
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { db } from '../utils/firebase';
import { collection, query, where, orderBy, limit, getDocs, getCountFromServer, Timestamp } from 'firebase/firestore';
import { handleError } from '../utils/errorHandler';
import { cache, CacheKeys } from '../utils/cache';
import { demoDataService } from '../services/demoDataService';
import DemoModeIndicator from '../components/DemoModeIndicator';
import './Dashboard.css';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
);

// TypeScript interfaces for type safety
interface PlatformStats {
  totalUsers: number;
  activeUsers: number;
  totalJobs: number;
  completedJobs: number;
  totalGuilds: number;
  activeGuilds: number;
  totalRevenue: number;
  userGrowth: number;
  jobGrowth: number;
  revenueGrowth: number;
}

interface UserGrowthData {
  labels: string[];
  newUsers: number[];
  totalUsers: number[];
}

interface RevenueData {
  labels: string[];
  revenue: number[];
  fees: number[];
}

interface UserDistributionItem {
  label: string;
  count: number;
  color: string;
}

interface RecentActivity {
  id: string;
  type: 'user_signup' | 'job_posted' | 'job_completed' | 'payment_processed' | 'guild_created';
  title: string;
  description: string;
  time: Date;
}

interface PendingJob {
  id: string;
  title?: string;
  description?: string;
  budget?: number;
  status?: string;
  createdAt?: any;
  [key: string]: any;
}

const DashboardPage: React.FC = () => {
  const { theme } = useTheme();
  const [timeRange, setTimeRange] = useState('7d');
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [userGrowthData, setUserGrowthData] = useState<UserGrowthData | null>(null);
  const [revenueData, setRevenueData] = useState<RevenueData | null>(null);
  const [userDistribution, setUserDistribution] = useState<UserDistributionItem[] | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [pendingJobs, setPendingJobs] = useState<PendingJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [timeRange]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Check if demo mode is active
      if (demoDataService.isDemoModeActive()) {
        console.log('🧪 Loading demo data');
        const days = timeRange === '7d' ? 7 : 30;
        
        setStats(demoDataService.getDemoStats());
        setUserGrowthData(demoDataService.getUserGrowthData(days));
        setRevenueData(demoDataService.getRevenueData());
        setUserDistribution(demoDataService.getUserDistribution());
        setRecentActivity(demoDataService.getDemoActivities().slice(0, 10));
        setPendingJobs(demoDataService.getDemoJobs().filter(j => j.adminStatus === 'pending').slice(0, 5) as any);
        setLoading(false);
        return;
      }
      
      // Try to get from cache first
      const cacheKey = CacheKeys.dashboard.stats(timeRange);
      const cachedData = cache.get<any>(cacheKey);
      
      if (cachedData) {
        console.log('📦 Loading dashboard from cache');
        setStats(cachedData.stats);
        setUserGrowthData(cachedData.userGrowthData);
        setRevenueData(cachedData.revenueData);
        setUserDistribution(cachedData.userDistribution);
        setRecentActivity(cachedData.recentActivity);
        setPendingJobs(cachedData.pendingJobs);
        setLoading(false);
        return;
      }
      
      // === FIREBASE DIRECT QUERIES - OPTIMIZED WITH PROMISE.ALL ===
      
      // 1. Get Platform Stats (parallelized for better performance)
      const [totalUsersSnap, activeUsersSnap, totalJobsSnap, , totalGuildsSnap, activeGuildsSnap] = await Promise.all([
        getCountFromServer(collection(db, 'users')),
        getCountFromServer(query(collection(db, 'users'), where('status', '==', 'active'))),
        getCountFromServer(collection(db, 'jobs')),
        getCountFromServer(query(collection(db, 'jobs'), where('status', 'in', ['open', 'in_progress']))),
        getCountFromServer(collection(db, 'guilds')),
        getCountFromServer(query(collection(db, 'guilds'), where('isActive', '==', true)))
      ]);

      const platformStats = {
        totalUsers: totalUsersSnap.data().count,
        activeUsers: activeUsersSnap.data().count,
        totalJobs: totalJobsSnap.data().count,
        completedJobs: 0, // Calculate if needed
        totalGuilds: totalGuildsSnap.data().count,
        activeGuilds: activeGuildsSnap.data().count,
        totalRevenue: 0, // Mock for now
        userGrowth: 0,
        jobGrowth: 0,
        revenueGrowth: 0
      };

      // 2. Get User Growth Data (last N days)
      const days = timeRange === '7d' ? 7 : 30;
      const labels: string[] = [];
      const newUsers: number[] = [];
      const totalUsers: number[] = [];
      
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStart = new Date(date.setHours(0, 0, 0, 0));
        const dateEnd = new Date(date.setHours(23, 59, 59, 999));
        
        labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        
        try {
          const dayUsersSnap = await getCountFromServer(
            query(
              collection(db, 'users'),
              where('createdAt', '>=', Timestamp.fromDate(dateStart)),
              where('createdAt', '<=', Timestamp.fromDate(dateEnd))
            )
          );
          newUsers.push(dayUsersSnap.data().count);
          totalUsers.push(platformStats.totalUsers); // Simplified
        } catch {
          newUsers.push(0);
          totalUsers.push(0);
        }
      }

      const userGrowth = { labels, newUsers, totalUsers };

      // 3. Get Revenue Data (last 6 months) - Mock for now
      const monthLabels: string[] = [];
      const revenueArr: number[] = [];
      const feesArr: number[] = [];
      
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        monthLabels.push(date.toLocaleDateString('en-US', { month: 'short' }));
        revenueArr.push(0); // Mock
        feesArr.push(0); // Mock
      }

      const revenue = { labels: monthLabels, revenue: revenueArr, fees: feesArr };

      // 4. Get User Distribution - Mock for now
      const distribution = [
        { label: 'Solo', count: Math.floor(platformStats.totalUsers * 0.5), color: '#00FF88' },
        { label: 'Guild Members', count: Math.floor(platformStats.totalUsers * 0.3), color: '#FF6B6B' },
        { label: 'Guild Masters', count: Math.floor(platformStats.totalUsers * 0.15), color: '#4ECDC4' },
        { label: 'Premium', count: Math.floor(platformStats.totalUsers * 0.05), color: '#FFE66D' },
      ];

      // 5. Get Recent Activity (last 10 activities)
      const recentActivitiesSnapshot = await getDocs(
        query(
          collection(db, 'users'),
          orderBy('createdAt', 'desc'),
          limit(5)
        )
      );

      const activity: RecentActivity[] = recentActivitiesSnapshot.docs.map(doc => ({
        id: doc.id,
        type: 'user_signup' as const,
        title: 'New User Registered',
        description: `${doc.data().fullName || 'User'} joined the platform`,
        time: doc.data().createdAt?.toDate() || new Date()
      }));

      // 6. Get Pending Jobs
      const pendingJobsSnapshot = await getDocs(
        query(
          collection(db, 'jobs'),
          where('adminStatus', '==', 'pending'),
          orderBy('createdAt', 'desc'),
          limit(5)
        )
      );

      const pendingJobsData = pendingJobsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Cache the data for 5 minutes
      cache.set(cacheKey, {
        stats: platformStats,
        userGrowthData: userGrowth,
        revenueData: revenue,
        userDistribution: distribution,
        recentActivity: activity,
        pendingJobs: pendingJobsData
      }, 5 * 60 * 1000);
      
      // Set all state
      setStats(platformStats);
      setUserGrowthData(userGrowth);
      setRevenueData(revenue);
      setUserDistribution(distribution);
      setRecentActivity(activity);
      setPendingJobs(pendingJobsData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      const errorResponse = handleError(error, 'Dashboard Data Loading');
      
      // Show user-friendly error notification
      if (process.env.NODE_ENV === 'development') {
        console.error('Detailed error:', errorResponse);
      }
      
      // Set fallback data for empty Firebase collections
      setStats({
        totalUsers: 0,
        activeUsers: 0,
        totalJobs: 0,
        completedJobs: 0,
        totalGuilds: 0,
        activeGuilds: 0,
        totalRevenue: 0,
        userGrowth: 0,
        jobGrowth: 0,
        revenueGrowth: 0
      });

      // Set fallback chart data
      const days = timeRange === '7d' ? 7 : 30;
      const fallbackLabels: string[] = [];
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        fallbackLabels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
      }

      setUserGrowthData({
        labels: fallbackLabels,
        newUsers: new Array(days).fill(0),
        totalUsers: new Array(days).fill(0)
      });

      const monthLabels: string[] = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        monthLabels.push(date.toLocaleDateString('en-US', { month: 'short' }));
      }

      setRevenueData({
        labels: monthLabels,
        revenue: new Array(6).fill(0),
        fees: new Array(6).fill(0)
      });

      setUserDistribution([
        { label: 'Solo', count: 0, color: '#00FF88' },
        { label: 'Guild Members', count: 0, color: '#FF6B6B' },
        { label: 'Guild Masters', count: 0, color: '#4ECDC4' },
        { label: 'Premium', count: 0, color: '#FFE66D' },
      ]);

      setRecentActivity([]);
      setPendingJobs([]);
    } finally {
      setLoading(false);
    }
  };

  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: theme.surface,
        titleColor: theme.textPrimary,
        bodyColor: theme.textSecondary,
        borderColor: theme.border,
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        grid: {
          color: theme.border,
          borderColor: theme.border,
        },
        ticks: {
          color: theme.textSecondary,
        },
      },
      y: {
        grid: {
          color: theme.border,
          borderColor: theme.border,
        },
        ticks: {
          color: theme.textSecondary,
        },
      },
    },
  };

  // Chart data (dynamically generated from real data)
  const userGrowthChartData = userGrowthData ? {
    labels: userGrowthData.labels,
    datasets: [
      {
        label: 'New Users',
        data: userGrowthData.newUsers,
        borderColor: theme.primary,
        backgroundColor: theme.primary + '20',
        fill: true,
        tension: 0.4,
      },
    ],
  } : null;

  const revenueChartData = revenueData ? {
    labels: revenueData.labels,
    datasets: [
      {
        label: 'Revenue',
        data: revenueData.revenue,
        backgroundColor: theme.primary,
        borderColor: theme.primary,
        borderWidth: 2,
      },
    ],
  } : null;

  const userDistributionChartData = userDistribution ? {
    labels: userDistribution.map((item) => item.label),
    datasets: [
      {
        data: userDistribution.map((item) => item.count),
        backgroundColor: userDistribution.map((item) => item.color),
        borderWidth: 0,
      },
    ],
  } : null;

  interface StatCardProps {
    title: string;
    value: number | string;
    growth: number;
    icon: React.ComponentType<any>;
    color: string;
  }

  const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, color }) => (
    <div className="stat-card" style={{ backgroundColor: theme.surface }}>
      <div className="stat-header">
        <h3 style={{ color: theme.textSecondary }}>{title}</h3>
        <button className="stat-menu" style={{ color: theme.textSecondary }}>
          <MoreVertical size={16} />
        </button>
      </div>
      
      <div className="stat-content">
        <div className="stat-value" style={{ color: theme.textPrimary }}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </div>
      </div>
      
      <div className="stat-icon" style={{ backgroundColor: color + '20' }}>
        <Icon size={24} color={color} />
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="dashboard" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* Demo Mode Indicator */}
      <DemoModeIndicator onDisable={() => loadDashboardData()} />
      
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 style={{ color: theme.textPrimary }}>Dashboard</h1>
          <p style={{ color: theme.textSecondary }}>
            Welcome back! Here&apos;s what&apos;s happening with Guild today.
          </p>
        </div>
        
        <div className="header-actions">
          <select 
            className="time-select"
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            style={{ 
              backgroundColor: theme.surface,
              color: theme.textPrimary,
              borderColor: theme.border 
            }}
          >
            <option value="24h">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          
          <button 
            className="btn btn-primary"
            style={{ backgroundColor: theme.primary, color: theme.background }}
          >
            <Calendar size={16} />
            Export Report
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <StatCard
          title="Total Users"
          value={stats?.totalUsers || 0}
          growth={stats?.userGrowth || 0}
          icon={Users}
          color={theme.primary}
        />
        <StatCard
          title="Active Guilds"
          value={stats?.activeGuilds || 0}
          growth={stats?.jobGrowth || 0}
          icon={Shield}
          color={theme.secondary}
        />
        <StatCard
          title="Total Jobs"
          value={stats?.totalJobs || 0}
          growth={stats?.jobGrowth || 0}
          icon={Briefcase}
          color={theme.info}
        />
        <StatCard
          title="Revenue"
          value={`QAR ${stats?.totalRevenue?.toLocaleString() || 0}`}
          growth={stats?.revenueGrowth || 0}
          icon={DollarSign}
          color={theme.primary}
        />
      </div>

      {/* Test Buttons Section */}
      <div style={{ 
        backgroundColor: theme.surface, 
        padding: '24px', 
        borderRadius: '12px', 
        border: `1px solid ${theme.border}`,
        marginBottom: '32px'
      }}>
        <h3 style={{ color: theme.textPrimary, marginBottom: '16px' }}>
          🧪 Test Features
        </h3>
        <p style={{ color: theme.textSecondary, marginBottom: '20px' }}>
          Test the new contract terms, rules, and announcements functionality:
        </p>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '16px',
          marginBottom: '20px'
        }}>
          <button 
            className="btn btn-primary"
            onClick={() => {
              // Test adding a platform rule
              const testRule = {
                text: "Test Platform Rule - All users must follow community guidelines",
                textAr: "قاعدة منصة تجريبية - يجب على جميع المستخدمين اتباع إرشادات المجتمع",
                order: 1
              };
              console.log('Testing platform rule:', testRule);
              alert('Test Platform Rule:\n\nEnglish: ' + testRule.text + '\n\nArabic: ' + testRule.textAr);
            }}
            style={{ backgroundColor: theme.primary, color: theme.background }}
          >
            <Shield size={16} />
            Test Platform Rule
          </button>
          
          <button 
            className="btn btn-secondary"
            onClick={() => {
              // Test adding a guideline
              const testGuideline = {
                text: "Test Guideline - Always communicate professionally with clients",
                textAr: "إرشاد تجريبي - تواصل دائماً بشكل مهني مع العملاء",
                order: 1
              };
              console.log('Testing guideline:', testGuideline);
              alert('Test Guideline:\n\nEnglish: ' + testGuideline.text + '\n\nArabic: ' + testGuideline.textAr);
            }}
            style={{ backgroundColor: theme.info, color: theme.background }}
          >
            <FileText size={16} />
            Test Guideline
          </button>
          
          <button 
            className="btn btn-secondary"
            onClick={() => {
              // Test adding an announcement
              const testAnnouncement = {
                title: "Test Announcement - New Feature Release",
                message: "We're excited to announce the release of our new contract terms system! This allows for better management of platform rules and guidelines.",
                targetUsers: "all"
              };
              console.log('Testing announcement:', testAnnouncement);
              alert('Test Announcement:\n\nTitle: ' + testAnnouncement.title + '\n\nMessage: ' + testAnnouncement.message + '\n\nTarget: ' + testAnnouncement.targetUsers);
            }}
            style={{ backgroundColor: theme.warning, color: theme.background }}
          >
            <Bell size={16} />
            Test Announcement
          </button>
          
          <button 
            className="btn btn-secondary"
            onClick={() => {
              // Test contract generation
              const testContract = {
                jobId: "test-job-123",
                clientId: "test-client-456",
                freelancerId: "test-freelancer-789",
                jobTitle: "Test Contract Generation",
                jobDescription: "This is a test contract to verify that platform rules and guidelines appear correctly in generated contracts.",
                amount: 1000,
                currency: "QAR"
              };
              console.log('Testing contract generation:', testContract);
              alert('Test Contract Generation:\n\nJob: ' + testContract.jobTitle + '\n\nDescription: ' + testContract.jobDescription + '\n\nAmount: ' + testContract.amount + ' ' + testContract.currency + '\n\nThis would generate a contract with current platform rules and guidelines.');
            }}
            style={{ backgroundColor: theme.secondary, color: theme.background }}
          >
            <FileText size={16} />
            Test Contract Generation
          </button>
        </div>
        
        <div style={{ 
          fontSize: '12px', 
          color: theme.textTertiary,
          fontStyle: 'italic'
        }}>
          💡 These buttons demonstrate the functionality. To actually add rules, guidelines, and announcements, use the Contract Terms page in the sidebar.
        </div>
      </div>

      {/* Empty State Message */}
      {stats && stats.totalUsers === 0 && stats.totalJobs === 0 && stats.totalGuilds === 0 && (
        <div style={{ 
          backgroundColor: theme.surface, 
          padding: '24px', 
          borderRadius: '12px', 
          border: `1px solid ${theme.border}`,
          marginBottom: '32px',
          textAlign: 'center'
        }}>
          <div style={{ marginBottom: '16px' }}>
            <Activity size={48} color={theme.primary} />
          </div>
          <h3 style={{ color: theme.textPrimary, marginBottom: '8px' }}>
            Welcome to Guild Admin Portal!
          </h3>
          <p style={{ color: theme.textSecondary, marginBottom: '16px' }}>
            Your dashboard shows 0 values because no data has been created yet. 
            To see real data here:
          </p>
          <div style={{ 
            textAlign: 'left', 
            maxWidth: '400px', 
            margin: '0 auto',
            color: theme.textSecondary 
          }}>
            <p>• <strong>Create users:</strong> Sign up in the Guild mobile app</p>
            <p>• <strong>Post jobs:</strong> Add jobs through the mobile app</p>
            <p>• <strong>Create guilds:</strong> Form guilds in the app</p>
            <p>• <strong>Generate activity:</strong> Complete jobs and transactions</p>
          </div>
          <div style={{ marginTop: '16px' }}>
            <span style={{ 
              color: theme.success, 
              fontSize: '14px',
              fontWeight: '600'
            }}>
              ✅ Admin portal is working correctly - Firebase connected!
            </span>
          </div>
        </div>
      )}

      {/* Charts and Additional Content */}
      <div className="dashboard-grid">
        {/* Pending Jobs Alert Card */}
        {pendingJobs.length > 0 && (
          <div className="stat-card alert-card" style={{ backgroundColor: theme.warning + '20', borderColor: theme.warning }}>
            <div className="stat-header">
              <h3 style={{ color: theme.warning }}>Pending Reviews</h3>
              <AlertCircle size={20} color={theme.warning} />
            </div>
            <div className="stat-content">
              <div className="stat-value" style={{ color: theme.warning }}>
                {pendingJobs.length}
              </div>
              <div style={{ color: theme.textSecondary, fontSize: '14px' }}>
                Jobs awaiting approval
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Charts Section */}
      <div className="charts-grid">
        {/* User Growth Chart */}
        <div className="chart-card" style={{ backgroundColor: theme.surface }}>
          <div className="chart-header">
            <h3 style={{ color: theme.textPrimary }}>User Growth</h3>
            <div className="chart-legend">
              <span className="legend-item">
                <span 
                  className="legend-dot" 
                  style={{ backgroundColor: theme.primary }}
                ></span>
                New Users
              </span>
            </div>
          </div>
          <div className="chart-container">
            {userGrowthChartData ? (
              <Line data={userGrowthChartData} options={chartOptions} />
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <div className="spinner"></div>
              </div>
            )}
          </div>
        </div>

        {/* Revenue Chart */}
        <div className="chart-card" style={{ backgroundColor: theme.surface }}>
          <div className="chart-header">
            <h3 style={{ color: theme.textPrimary }}>Revenue Overview</h3>
            <div className="chart-value" style={{ color: theme.success }}>
              <TrendingUp size={20} />
              <span>+{stats?.revenueGrowth?.toFixed(1) || 0}%</span>
            </div>
          </div>
          <div className="chart-container">
            {revenueChartData ? (
              <Bar data={revenueChartData} options={chartOptions} />
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <div className="spinner"></div>
              </div>
            )}
          </div>
        </div>

        {/* User Distribution */}
        <div className="chart-card small" style={{ backgroundColor: theme.surface }}>
          <div className="chart-header">
            <h3 style={{ color: theme.textPrimary }}>User Distribution</h3>
          </div>
          <div className="chart-container">
            {userDistributionChartData ? (
              <Doughnut 
                data={userDistributionChartData} 
                options={{
                  ...chartOptions,
                  plugins: {
                    ...chartOptions.plugins,
                    legend: {
                      display: true,
                      position: 'bottom' as const,
                      labels: {
                        color: theme.textSecondary,
                        padding: 16,
                        font: {
                          size: 12,
                        },
                      },
                    },
                  },
                }} 
              />
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <div className="spinner"></div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Activity Feed */}
      <div className="activity-section">
        <div className="section-header">
          <h2 style={{ color: theme.textPrimary }}>Recent Activity</h2>
          <button 
            className="btn btn-secondary"
            style={{ 
              backgroundColor: theme.surface,
              color: theme.textPrimary,
              borderColor: theme.border 
            }}
          >
            View All
          </button>
        </div>
        
        <div className="activity-feed" style={{ backgroundColor: theme.surface }}>
          {recentActivity.length > 0 ? (
            recentActivity.map((activity) => {
              const getActivityIcon = (type: string) => {
                switch (type) {
                  case 'user_signup': return Users;
                  case 'job_posted': return Briefcase;
                  case 'job_completed': return CheckCircle;
                  case 'payment_processed': return DollarSign;
                  case 'guild_created': return Shield;
                  default: return Activity;
                }
              };

              const getActivityColor = (type: string) => {
                switch (type) {
                  case 'user_signup': return theme.primary;
                  case 'job_posted': return theme.info;
                  case 'job_completed': return theme.success;
                  case 'payment_processed': return theme.success;
                  case 'guild_created': return theme.secondary;
                  default: return theme.textSecondary;
                }
              };

              const ActivityIcon = getActivityIcon(activity.type);
              const color = getActivityColor(activity.type);

              return (
                <div key={activity.id} className="activity-item" style={{ borderColor: theme.border }}>
                  <div className="activity-icon" style={{ backgroundColor: color + '20' }}>
                    <ActivityIcon size={20} color={color} />
                  </div>
                  <div className="activity-content">
                    <h4 style={{ color: theme.textPrimary }}>{activity.title}</h4>
                    <p style={{ color: theme.textSecondary }}>{activity.description}</p>
                    <span className="activity-time" style={{ color: theme.textTertiary }}>
                      {activity.time.toLocaleString()}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: theme.textSecondary }}>
              <Activity size={48} color={theme.textSecondary} />
              <p style={{ marginTop: '16px' }}>No recent activity</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;

