import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { auth } from '../utils/firebase';
import ReportGenerator from '../components/ReportGenerator';
import { 
  DollarSign, 
  Clock, 
  CheckCircle, 
  XCircle, 
  X,
  Plus,
  AlertCircle,
  Eye,
  Edit,
  Trash2,
  Play,
  Pause,
  Users,
  TrendingUp,
  Calendar,
  Filter,
  Search,
  MoreHorizontal,
  Settings,
  Shield,
  CreditCard,
  Globe,
  Copy,
  Download,
  Upload,
  Target,
  Zap,
  Lock,
  Unlock,
  RefreshCw,
  BarChart3,
  Activity,
  AlertTriangle,
  Info,
  HelpCircle,
  ExternalLink,
  Link,
  Hash,
  Type,
  AlignLeft,
  AlignRight,
  Bold,
  Italic,
  Underline,
  List,
  CheckSquare,
  Square,
  Minus,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  ChevronLeft,
  MoreVertical,
  Star,
  Heart,
  Flag,
  Tag,
  Bookmark,
  Archive,
  Trash,
  RotateCcw,
  RotateCw,
  Move,
  GripVertical,
  SortAsc,
  SortDesc,
  Grid,
  List as ListIcon,
  Columns,
  Rows,
  Maximize,
  Minimize,
  Fullscreen,
  ZoomIn,
  ZoomOut,
  Focus,
  Monitor,
  Smartphone,
  Tablet,
  Laptop,
  Wifi,
  WifiOff,
  Signal,
  Battery,
  BatteryCharging,
  Plug,
  Power,
  PowerOff,
  SkipBack,
  SkipForward,
  Repeat,
  Shuffle,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Camera,
  CameraOff,
  Image,
  File,
  Folder,
  FolderOpen,
  FolderPlus,
  FolderMinus,
  FolderX,
  FileText,
  FileImage,
  FileVideo,
  FileAudio,
  FileCode,
  FileSpreadsheet,
  FileArchive,
  Database,
  Server,
  Cloud,
  Sun,
  Moon,
  Sunrise,
  Sunset,
  Thermometer,
  Droplets,
  Wind,
  Snowflake,
  Umbrella,
  Compass,
  Map,
  MapPin,
  Navigation,
  Route,
  Car,
  Bus,
  Train,
  Plane,
  Ship,
  Bike,
  Activity as ActivityIcon,
  Heart as HeartIcon,
  Zap as ZapIcon,
  Flame,
  Sparkles,
  Crown,
  Award,
  Medal,
  Trophy,
  Gift,
  Package,
  ShoppingCart,
  ShoppingBag,
  CreditCard as CreditCardIcon,
  Wallet,
  Banknote,
  Coins,
  DollarSign as DollarSignIcon,
  Euro,
  PoundSterling,
  Bitcoin,
  TrendingDown,
  TrendingUp as TrendingUpIcon,
  BarChart,
  PieChart,
  LineChart,
  AreaChart,
  Radar,
  Gauge,
  Timer as TimerIcon,
  Clock as ClockIcon2,
  Calendar as CalendarIcon,
  CalendarDays,
  CalendarCheck,
  CalendarX,
  CalendarPlus,
  CalendarMinus,
  CalendarRange,
  CalendarSearch,
  CalendarClock,
  CalendarHeart,
  Hourglass,
  Watch,
  AlarmClock,
  Bell as BellIcon,
  BellRing,
  BellOff,
  Volume1,
  Volume as VolumeIcon2,
  Headphones,
  Speaker,
  Radio,
  Tv,
  Monitor as MonitorIcon,
  MonitorOff,
  Laptop as LaptopIcon2,
  Smartphone as SmartphoneIcon2,
  Tablet as TabletIcon2,
  Watch as WatchIcon2,
  Gamepad2 as Gamepad2Icon,
  Joystick as JoystickIcon,
  Mouse as MouseIcon,
  Keyboard as KeyboardIcon,
  MousePointer as MousePointerIcon,
  Hand as HandIcon,
  Fingerprint as FingerprintIcon,
  Scan as ScanIcon,
  QrCode as QrCodeIcon,
  Barcode as BarcodeIcon,
  ScanLine as ScanLineIcon
} from 'lucide-react';
import './ManualPaymentsPage.css';

// Interfaces
interface ManualPaymentQueueItem {
  id: string;
  jobId: string;
  userId: string;
  clientId: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'ASSIGNED' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'DISPUTED';
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  createdAt: any;
  updatedAt: any;
  assignedTo?: string;
  processedBy?: string;
  processingStartedAt?: any;
  processingCompletedAt?: any;
  estimatedCompletionDate?: any;
  notes?: string;
  pspTransactionId?: string;
}

interface ManualPaymentStats {
  total: number;
  pending: number;
  assigned: number;
  processing: number;
  completed: number;
  failed: number;
  urgent: number;
  high: number;
  overdue: number;
}

interface BalanceReviewData {
  platformBalance: number;
  pspBalance: number;
  discrepancy: number;
  lastUpdated: string;
}

interface PaymentReleaseTimer {
  id: string;
  jobId: string;
  userId: string;
  amount: number;
  releaseDate: string;
  status: 'SCHEDULED' | 'RELEASED' | 'CANCELLED';
  reason: 'JOB_COMPLETION' | 'DISPUTE_RESOLUTION' | 'JOB_CANCELLATION';
}

const ManualPaymentsPage: React.FC = () => {
  const { theme } = useTheme();
  const { user, isAuthorized } = useAuth();
  
  // State management
  const [queue, setQueue] = useState<ManualPaymentQueueItem[]>([]);
  const [stats, setStats] = useState<ManualPaymentStats | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<ManualPaymentQueueItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'queue' | 'history' | 'analytics'>('queue');
  
  // Form states
  const [showPaymentDetails, setShowPaymentDetails] = useState(false);
  const [showCompleteForm, setShowCompleteForm] = useState(false);
  const [showFailForm, setShowFailForm] = useState(false);
  const [completionNotes, setCompletionNotes] = useState('');
  const [failureReason, setFailureReason] = useState('');
  const [failureNotes, setFailureNotes] = useState('');
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterAssignedTo, setFilterAssignedTo] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  
  // Balance review states
  const [balanceReview, setBalanceReview] = useState<BalanceReviewData | null>(null);
  const [balanceTimeRange, setBalanceTimeRange] = useState('24h');
  
  // Payment release timer states
  const [releaseTimers, setReleaseTimers] = useState<PaymentReleaseTimer[]>([]);

  // Get auth headers for API calls
  const getAuthHeaders = useCallback(async () => {
    const idToken = await auth.currentUser?.getIdToken();
    if (!idToken) throw new Error('Authentication token not found.');
    return {
      'Authorization': `Bearer ${idToken}`,
      'Content-Type': 'application/json'
    };
  }, []);

  // Fetch functions
  const fetchQueue = async () => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/admin/manual-payments/queue', { headers });
      const data = await response.json();
      if (data.success) {
        setQueue(data.data);
      } else {
        throw new Error(data.message || 'Failed to fetch payment queue');
      }
    } catch (error) {
      console.error('Error fetching payment queue:', error);
      setError('Failed to fetch payment queue');
    }
  };

  const fetchStats = async () => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/admin/manual-payments/queue/stats', { headers });
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      } else {
        throw new Error(data.message || 'Failed to fetch payment stats');
      }
    } catch (error) {
      console.error('Error fetching payment stats:', error);
      setError('Failed to fetch payment stats');
    }
  };

  const fetchPaymentDetails = async (paymentId: string) => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/admin/manual-payments/${paymentId}`, { headers });
      const data = await response.json();
      if (data.success) {
        setSelectedPayment(data.data);
        setShowPaymentDetails(true);
      } else {
        throw new Error(data.message || 'Failed to fetch payment details');
      }
    } catch (error) {
      console.error('Error fetching payment details:', error);
      setError('Failed to fetch payment details');
    }
  };

  // Action handlers
  const handleAssignPayment = async (paymentId: string) => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/admin/manual-payments/queue/${paymentId}/assign`, {
        method: 'POST',
        headers
      });
      const data = await response.json();
      if (data.success) {
        setSuccess('Payment assigned successfully');
        await fetchQueue();
        await fetchStats();
      } else {
        throw new Error(data.message || 'Failed to assign payment');
      }
    } catch (error) {
      console.error('Error assigning payment:', error);
      setError('Failed to assign payment');
    }
  };

  const handleCompletePayment = async (paymentId: string) => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/admin/manual-payments/${paymentId}/complete`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ notes: completionNotes })
      });
      const data = await response.json();
      if (data.success) {
        setSuccess('Payment completed successfully');
        setCompletionNotes('');
        setShowCompleteForm(false);
        setSelectedPayment(null);
        await fetchQueue();
        await fetchStats();
      } else {
        throw new Error(data.message || 'Failed to complete payment');
      }
    } catch (error) {
      console.error('Error completing payment:', error);
      setError('Failed to complete payment');
    }
  };

  const handleFailPayment = async (paymentId: string) => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/admin/manual-payments/${paymentId}/fail`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ 
          reason: failureReason,
          notes: failureNotes 
        })
      });
      const data = await response.json();
      if (data.success) {
        setSuccess('Payment marked as failed');
        setFailureReason('');
        setFailureNotes('');
        setShowFailForm(false);
        setSelectedPayment(null);
        await fetchQueue();
        await fetchStats();
      } else {
        throw new Error(data.message || 'Failed to fail payment');
      }
    } catch (error) {
      console.error('Error failing payment:', error);
      setError('Failed to mark payment as failed');
    }
  };

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([fetchQueue(), fetchStats()]);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Load data when tab changes
  useEffect(() => {
    if (activeTab === 'queue') {
      fetchQueue();
      fetchStats();
    }
  }, [activeTab]);

  // Clear messages after 5 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return theme.warning;
      case 'ASSIGNED': return theme.info;
      case 'PROCESSING': return theme.primary;
      case 'COMPLETED': return theme.success;
      case 'FAILED': return theme.error;
      case 'DISPUTED': return theme.error;
      default: return theme.textSecondary;
    }
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return theme.error;
      case 'HIGH': return theme.warning;
      case 'NORMAL': return theme.info;
      case 'LOW': return theme.textSecondary;
      default: return theme.textSecondary;
    }
  };

  // Report columns for export
  const reportColumns = [
    { key: 'id', label: 'Payment ID', type: 'text' as const },
    { key: 'jobId', label: 'Job ID', type: 'text' as const },
    { key: 'userId', label: 'User ID', type: 'text' as const },
    { key: 'clientId', label: 'Client ID', type: 'text' as const },
    { key: 'amount', label: 'Amount', type: 'currency' as const },
    { key: 'currency', label: 'Currency', type: 'text' as const },
    { key: 'status', label: 'Status', type: 'status' as const },
    { key: 'priority', label: 'Priority', type: 'status' as const },
    { key: 'createdAt', label: 'Created At', type: 'date' as const },
    { key: 'estimatedCompletionDate', label: 'Est. Completion', type: 'date' as const }
  ];

  if (loading) {
    return (
      <div className="manual-payments-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="manual-payments-page">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 style={{ color: theme.textPrimary }}>Manual Payment Processing</h1>
          <p style={{ color: theme.textSecondary }}>
            Manage manual payment processing queue, balance reviews, and payment release timers.
          </p>
        </div>
        
        <div className="header-actions">
          <button 
            className="btn btn-primary"
            onClick={() => fetchQueue()}
            style={{ backgroundColor: theme.primary, color: theme.background }}
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="alert alert-error" style={{ backgroundColor: theme.error + '20', borderColor: theme.error, color: theme.error }}>
          <AlertCircle size={20} />
          {error}
        </div>
      )}
      
      {success && (
        <div className="alert alert-success" style={{ backgroundColor: theme.success + '20', borderColor: theme.success, color: theme.success }}>
          <CheckCircle size={20} />
          {success}
        </div>
      )}

      {/* Stats Grid */}
      {stats && (
        <div className="stats-grid">
          <div className="stat-card" style={{ backgroundColor: theme.surface, borderColor: theme.border }}>
            <div className="stat-header">
              <h3 style={{ color: theme.textSecondary }}>Total Payments</h3>
              <DollarSign size={20} color={theme.primary} />
            </div>
            <div className="stat-value" style={{ color: theme.textPrimary }}>
              {stats.total}
            </div>
          </div>
          
          <div className="stat-card" style={{ backgroundColor: theme.surface, borderColor: theme.border }}>
            <div className="stat-header">
              <h3 style={{ color: theme.textSecondary }}>Pending</h3>
              <Clock size={20} color={theme.warning} />
            </div>
            <div className="stat-value" style={{ color: theme.textPrimary }}>
              {stats.pending}
            </div>
          </div>
          
          <div className="stat-card" style={{ backgroundColor: theme.surface, borderColor: theme.border }}>
            <div className="stat-header">
              <h3 style={{ color: theme.textSecondary }}>Processing</h3>
              <Activity size={20} color={theme.info} />
            </div>
            <div className="stat-value" style={{ color: theme.textPrimary }}>
              {stats.processing}
            </div>
          </div>
          
          <div className="stat-card" style={{ backgroundColor: theme.surface, borderColor: theme.border }}>
            <div className="stat-header">
              <h3 style={{ color: theme.textSecondary }}>Completed</h3>
              <CheckCircle size={20} color={theme.success} />
            </div>
            <div className="stat-value" style={{ color: theme.textPrimary }}>
              {stats.completed}
            </div>
          </div>
          
          <div className="stat-card" style={{ backgroundColor: theme.surface, borderColor: theme.border }}>
            <div className="stat-header">
              <h3 style={{ color: theme.textSecondary }}>Urgent</h3>
              <AlertTriangle size={20} color={theme.error} />
            </div>
            <div className="stat-value" style={{ color: theme.textPrimary }}>
              {stats.urgent}
            </div>
          </div>
          
          <div className="stat-card" style={{ backgroundColor: theme.surface, borderColor: theme.border }}>
            <div className="stat-header">
              <h3 style={{ color: theme.textSecondary }}>Overdue</h3>
              <AlertCircle size={20} color={theme.error} />
            </div>
            <div className="stat-value" style={{ color: theme.textPrimary }}>
              {stats.overdue}
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab ${activeTab === 'queue' ? 'active' : ''}`}
          onClick={() => setActiveTab('queue')}
          style={{
            backgroundColor: activeTab === 'queue' ? theme.primary : 'transparent',
            color: activeTab === 'queue' ? theme.background : theme.textPrimary,
            borderColor: theme.border
          }}
        >
          <DollarSign size={16} />
          Payment Queue ({queue.length})
        </button>
        <button
          className={`tab ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
          style={{
            backgroundColor: activeTab === 'history' ? theme.primary : 'transparent',
            color: activeTab === 'history' ? theme.background : theme.textPrimary,
            borderColor: theme.border
          }}
        >
          <Clock size={16} />
          History
        </button>
        <button
          className={`tab ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
          style={{
            backgroundColor: activeTab === 'analytics' ? theme.primary : 'transparent',
            color: activeTab === 'analytics' ? theme.background : theme.textPrimary,
            borderColor: theme.border
          }}
        >
          <BarChart3 size={16} />
          Analytics
        </button>
      </div>

      {/* Search and Filters */}
      <div className="search-filters">
        <div className="search-box">
          <Search size={20} color={theme.textSecondary} />
          <input
            type="text"
            placeholder="Search payments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              backgroundColor: theme.surface,
              color: theme.textPrimary,
              borderColor: theme.border
            }}
          />
        </div>
        
        <div className="filters">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{
              backgroundColor: theme.surface,
              color: theme.textPrimary,
              borderColor: theme.border
            }}
          >
            <option value="all">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="PROCESSING">Processing</option>
            <option value="COMPLETED">Completed</option>
            <option value="FAILED">Failed</option>
            <option value="DISPUTED">Disputed</option>
          </select>
          
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            style={{
              backgroundColor: theme.surface,
              color: theme.textPrimary,
              borderColor: theme.border
            }}
          >
            <option value="all">All Priority</option>
            <option value="URGENT">Urgent</option>
            <option value="HIGH">High</option>
            <option value="NORMAL">Normal</option>
            <option value="LOW">Low</option>
          </select>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              backgroundColor: theme.surface,
              color: theme.textPrimary,
              borderColor: theme.border
            }}
          >
            <option value="createdAt">Created Date</option>
            <option value="amount">Amount</option>
            <option value="priority">Priority</option>
            <option value="status">Status</option>
          </select>
          
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
            style={{
              backgroundColor: theme.surface,
              color: theme.textPrimary,
              borderColor: theme.border
            }}
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
          
          <button
            className="btn btn-secondary"
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            style={{
              backgroundColor: theme.surface,
              color: theme.textPrimary,
              borderColor: theme.border
            }}
          >
            {viewMode === 'grid' ? <ListIcon size={16} /> : <Grid size={16} />}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="content">
        {activeTab === 'queue' && (
          <div className="queue-section">
            {queue.length === 0 ? (
              <div className="empty-state" style={{ backgroundColor: theme.surface, borderColor: theme.border }}>
                <DollarSign size={48} color={theme.textSecondary} />
                <h3 style={{ color: theme.textPrimary }}>No Payments in Queue</h3>
                <p style={{ color: theme.textSecondary }}>All payments have been processed.</p>
              </div>
            ) : (
              <div className="payments-list">
                {queue.map((payment) => (
                  <div key={payment.id} className="payment-card" style={{ backgroundColor: theme.surface, borderColor: theme.border }}>
                    <div className="payment-header">
                      <div className="payment-info">
                        <div className="payment-id" style={{ color: theme.textPrimary }}>
                          Payment #{payment.id.slice(-8)}
                        </div>
                        <div className="payment-job" style={{ color: theme.textSecondary }}>
                          Job: {payment.jobId.slice(-8)}
                        </div>
                      </div>
                      
                      <div className="payment-status">
                        <span 
                          className="status-badge"
                          style={{ 
                            backgroundColor: getStatusColor(payment.status) + '20',
                            color: getStatusColor(payment.status)
                          }}
                        >
                          {payment.status}
                        </span>
                        <span 
                          className="priority-badge"
                          style={{ 
                            backgroundColor: getPriorityColor(payment.priority) + '20',
                            color: getPriorityColor(payment.priority)
                          }}
                        >
                          {payment.priority}
                        </span>
                      </div>
                    </div>
                    
                    <div className="payment-details">
                      <div className="payment-amount" style={{ color: theme.textPrimary }}>
                        {payment.amount} {payment.currency}
                      </div>
                      <div className="payment-meta" style={{ color: theme.textSecondary }}>
                        <span>Created: {payment.createdAt?.toDate?.()?.toLocaleDateString() || 'Unknown'}</span>
                        {payment.estimatedCompletionDate && (
                          <span>Est. Completion: {payment.estimatedCompletionDate?.toDate?.()?.toLocaleDateString() || 'Unknown'}</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="payment-actions">
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => fetchPaymentDetails(payment.id)}
                        style={{ backgroundColor: theme.surface, color: theme.textPrimary, borderColor: theme.border }}
                      >
                        <Eye size={14} />
                        View
                      </button>
                      
                      {payment.status === 'PENDING' && (
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => handleAssignPayment(payment.id)}
                          style={{ backgroundColor: theme.primary, color: theme.background }}
                        >
                          <Users size={14} />
                          Assign
                        </button>
                      )}
                      
                      {payment.status === 'ASSIGNED' && (
                        <>
                          <button
                            className="btn btn-sm btn-success"
                            onClick={() => {
                              setSelectedPayment(payment);
                              setShowCompleteForm(true);
                            }}
                            style={{ backgroundColor: theme.success + '20', color: theme.success, borderColor: theme.success }}
                          >
                            <CheckCircle size={14} />
                            Complete
                          </button>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => {
                              setSelectedPayment(payment);
                              setShowFailForm(true);
                            }}
                            style={{ backgroundColor: theme.error + '20', color: theme.error, borderColor: theme.error }}
                          >
                            <XCircle size={14} />
                            Fail
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="history-section">
            <div className="empty-state" style={{ backgroundColor: theme.surface, borderColor: theme.border }}>
              <Clock size={48} color={theme.textSecondary} />
              <h3 style={{ color: theme.textPrimary }}>Payment History</h3>
              <p style={{ color: theme.textSecondary }}>Payment history feature coming soon.</p>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="analytics-section">
            <div className="analytics-grid">
              {/* Balance Reviewer Platform */}
              <div className="analytics-card" style={{ backgroundColor: theme.surface, borderColor: theme.border }}>
                <div className="card-header">
                  <h3 style={{ color: theme.textPrimary }}>Balance Reviewer Platform</h3>
                  <select
                    value={balanceTimeRange}
                    onChange={(e) => setBalanceTimeRange(e.target.value)}
                    style={{
                      backgroundColor: theme.inputBackground,
                      color: theme.textPrimary,
                      borderColor: theme.border
                    }}
                  >
                    <option value="1h">Last Hour</option>
                    <option value="24h">Last 24 Hours</option>
                    <option value="7d">Last 7 Days</option>
                    <option value="30d">Last 30 Days</option>
                    <option value="1y">Last Year</option>
                  </select>
                </div>
                <div className="card-content">
                  <div className="balance-item">
                    <span style={{ color: theme.textSecondary }}>Platform Balance:</span>
                    <span style={{ color: theme.textPrimary }}>QAR 0.00</span>
                  </div>
                  <div className="balance-item">
                    <span style={{ color: theme.textSecondary }}>PSP Balance:</span>
                    <span style={{ color: theme.textPrimary }}>QAR 0.00</span>
                  </div>
                  <div className="balance-item">
                    <span style={{ color: theme.textSecondary }}>Discrepancy:</span>
                    <span style={{ color: theme.success }}>QAR 0.00</span>
                  </div>
                </div>
              </div>

              {/* Payment Release Timer */}
              <div className="analytics-card" style={{ backgroundColor: theme.surface, borderColor: theme.border }}>
                <div className="card-header">
                  <h3 style={{ color: theme.textPrimary }}>Payment Release Timer</h3>
                  <button
                    className="btn btn-sm btn-primary"
                    style={{ backgroundColor: theme.primary, color: theme.background }}
                  >
                    <Plus size={14} />
                    Add Timer
                  </button>
                </div>
                <div className="card-content">
                  <div className="timer-item">
                    <span style={{ color: theme.textSecondary }}>Scheduled Releases:</span>
                    <span style={{ color: theme.textPrimary }}>0</span>
                  </div>
                  <div className="timer-item">
                    <span style={{ color: theme.textSecondary }}>Pending Releases:</span>
                    <span style={{ color: theme.warning }}>0</span>
                  </div>
                  <div className="timer-item">
                    <span style={{ color: theme.textSecondary }}>Completed Releases:</span>
                    <span style={{ color: theme.success }}>0</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Report Generator */}
      <div className="report-section">
        <ReportGenerator
          data={queue}
          columns={reportColumns}
          title="Manual Payments Export"
        />
      </div>

      {/* Payment Details Modal */}
      {showPaymentDetails && selectedPayment && (
        <div className="modal-overlay" style={{ backgroundColor: theme.modalBackground }}>
          <div className="modal" style={{ backgroundColor: theme.surface, borderColor: theme.border }}>
            <div className="modal-header">
              <h2 style={{ color: theme.textPrimary }}>Payment Details</h2>
              <button
                className="btn btn-sm btn-secondary"
                onClick={() => {
                  setShowPaymentDetails(false);
                  setSelectedPayment(null);
                }}
                style={{ backgroundColor: theme.surface, color: theme.textPrimary, borderColor: theme.border }}
              >
                <X size={16} />
              </button>
            </div>
            
            <div className="modal-content">
              <div className="detail-group">
                <label style={{ color: theme.textPrimary }}>Payment ID</label>
                <p style={{ color: theme.textSecondary }}>{selectedPayment.id}</p>
              </div>
              
              <div className="detail-group">
                <label style={{ color: theme.textPrimary }}>Job ID</label>
                <p style={{ color: theme.textSecondary }}>{selectedPayment.jobId}</p>
              </div>
              
              <div className="detail-group">
                <label style={{ color: theme.textPrimary }}>Amount</label>
                <p style={{ color: theme.textSecondary }}>{selectedPayment.amount} {selectedPayment.currency}</p>
              </div>
              
              <div className="detail-group">
                <label style={{ color: theme.textPrimary }}>Status</label>
                <p style={{ color: getStatusColor(selectedPayment.status) }}>{selectedPayment.status}</p>
              </div>
              
              <div className="detail-group">
                <label style={{ color: theme.textPrimary }}>Priority</label>
                <p style={{ color: getPriorityColor(selectedPayment.priority) }}>{selectedPayment.priority}</p>
              </div>
              
              {selectedPayment.notes && (
                <div className="detail-group">
                  <label style={{ color: theme.textPrimary }}>Notes</label>
                  <p style={{ color: theme.textSecondary }}>{selectedPayment.notes}</p>
                </div>
              )}
            </div>
            
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setShowPaymentDetails(false);
                  setSelectedPayment(null);
                }}
                style={{ backgroundColor: theme.surface, color: theme.textPrimary, borderColor: theme.border }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Complete Payment Modal */}
      {showCompleteForm && selectedPayment && (
        <div className="modal-overlay" style={{ backgroundColor: theme.modalBackground }}>
          <div className="modal" style={{ backgroundColor: theme.surface, borderColor: theme.border }}>
            <div className="modal-header">
              <h2 style={{ color: theme.textPrimary }}>Complete Payment</h2>
              <button
                className="btn btn-sm btn-secondary"
                onClick={() => {
                  setShowCompleteForm(false);
                  setSelectedPayment(null);
                  setCompletionNotes('');
                }}
                style={{ backgroundColor: theme.surface, color: theme.textPrimary, borderColor: theme.border }}
              >
                <X size={16} />
              </button>
            </div>
            
            <div className="modal-content">
              <div className="form-group">
                <label style={{ color: theme.textPrimary }}>Payment Amount</label>
                <p style={{ color: theme.textSecondary }}>{selectedPayment.amount} {selectedPayment.currency}</p>
              </div>
              
              <div className="form-group">
                <label style={{ color: theme.textPrimary }}>Completion Notes</label>
                <textarea
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                  rows={4}
                  placeholder="Add any notes about the payment completion..."
                  style={{
                    backgroundColor: theme.inputBackground,
                    color: theme.textPrimary,
                    borderColor: theme.border
                  }}
                />
              </div>
            </div>
            
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setShowCompleteForm(false);
                  setSelectedPayment(null);
                  setCompletionNotes('');
                }}
                style={{ backgroundColor: theme.surface, color: theme.textPrimary, borderColor: theme.border }}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={() => handleCompletePayment(selectedPayment.id)}
                style={{ backgroundColor: theme.primary, color: theme.background }}
              >
                <CheckCircle size={16} />
                Complete Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fail Payment Modal */}
      {showFailForm && selectedPayment && (
        <div className="modal-overlay" style={{ backgroundColor: theme.modalBackground }}>
          <div className="modal" style={{ backgroundColor: theme.surface, borderColor: theme.border }}>
            <div className="modal-header">
              <h2 style={{ color: theme.textPrimary }}>Mark Payment as Failed</h2>
              <button
                className="btn btn-sm btn-secondary"
                onClick={() => {
                  setShowFailForm(false);
                  setSelectedPayment(null);
                  setFailureReason('');
                  setFailureNotes('');
                }}
                style={{ backgroundColor: theme.surface, color: theme.textPrimary, borderColor: theme.border }}
              >
                <X size={16} />
              </button>
            </div>
            
            <div className="modal-content">
              <div className="form-group">
                <label style={{ color: theme.textPrimary }}>Payment Amount</label>
                <p style={{ color: theme.textSecondary }}>{selectedPayment.amount} {selectedPayment.currency}</p>
              </div>
              
              <div className="form-group">
                <label style={{ color: theme.textPrimary }}>Failure Reason *</label>
                <input
                  type="text"
                  value={failureReason}
                  onChange={(e) => setFailureReason(e.target.value)}
                  placeholder="Enter reason for payment failure..."
                  style={{
                    backgroundColor: theme.inputBackground,
                    color: theme.textPrimary,
                    borderColor: theme.border
                  }}
                />
              </div>
              
              <div className="form-group">
                <label style={{ color: theme.textPrimary }}>Additional Notes</label>
                <textarea
                  value={failureNotes}
                  onChange={(e) => setFailureNotes(e.target.value)}
                  rows={4}
                  placeholder="Add any additional notes..."
                  style={{
                    backgroundColor: theme.inputBackground,
                    color: theme.textPrimary,
                    borderColor: theme.border
                  }}
                />
              </div>
            </div>
            
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setShowFailForm(false);
                  setSelectedPayment(null);
                  setFailureReason('');
                  setFailureNotes('');
                }}
                style={{ backgroundColor: theme.surface, color: theme.textPrimary, borderColor: theme.border }}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={() => handleFailPayment(selectedPayment.id)}
                disabled={!failureReason.trim()}
                style={{ backgroundColor: theme.error + '20', color: theme.error, borderColor: theme.error }}
              >
                <XCircle size={16} />
                Mark as Failed
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManualPaymentsPage;