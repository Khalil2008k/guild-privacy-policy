import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { auth } from '../utils/firebase';
import ReportGenerator from '../components/ReportGenerator';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  Scale, 
  FileCheck, 
  Megaphone,
  AlertCircle,
  CheckCircle,
  Clock,
  Settings,
  Shield,
  Users,
  CreditCard,
  Globe,
  Eye,
  EyeOff,
  Copy,
  Download,
  Upload,
  Filter,
  Search,
  Calendar,
  Bell,
  Target,
  Zap,
  Lock,
  Unlock,
  RefreshCw,
  BarChart3,
  TrendingUp,
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
  MoreHorizontal,
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
  Play,
  Pause,
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
  DollarSign,
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
  Timer,
  Clock as ClockIcon,
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
  Volume as VolumeIcon,
  Headphones,
  Speaker,
  Radio,
  Tv,
  Monitor as MonitorIcon,
  MonitorOff,
  Laptop as LaptopIcon,
  Smartphone as SmartphoneIcon,
  Tablet as TabletIcon,
  Watch as WatchIcon,
  Gamepad2,
  Joystick,
  Mouse,
  Keyboard,
  MousePointer,
  Hand,
  Fingerprint,
  Scan,
  QrCode,
  Barcode,
  ScanLine
} from 'lucide-react';
import './ContractTermsPage.css';

// Interfaces
interface PlatformRule {
  id: string;
  text: string;
  textAr: string;
  order: number;
  createdAt: any;
  updatedAt: any;
  createdBy: string;
  updatedBy?: string;
}

interface Guideline {
  id: string;
  text: string;
  textAr: string;
  order: number;
  createdAt: any;
  updatedAt: any;
  createdBy: string;
  updatedBy?: string;
}

interface Announcement {
  id: string;
  title: string;
  message: string;
  targetUsers: string;
  createdAt: any;
  createdBy: string;
  updatedAt?: any;
  updatedBy?: string;
}

interface RuleForm {
  text: string;
  textAr: string;
  order: number;
}

interface GuidelineForm {
  text: string;
  textAr: string;
  order: number;
}

interface AnnouncementForm {
  title: string;
  message: string;
  targetUsers: string;
}

const ContractTermsPage: React.FC = () => {
  const { theme } = useTheme();
  const { user, isAuthorized } = useAuth();
  
  // State management
  const [rules, setRules] = useState<PlatformRule[]>([]);
  const [guidelines, setGuidelines] = useState<Guideline[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'rules' | 'guidelines' | 'announcements'>('rules');
  
  // Form states
  const [showRuleForm, setShowRuleForm] = useState(false);
  const [showGuidelineForm, setShowGuidelineForm] = useState(false);
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);
  const [editingRule, setEditingRule] = useState<PlatformRule | null>(null);
  const [editingGuideline, setEditingGuideline] = useState<Guideline | null>(null);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  
  // Form data
  const [ruleForm, setRuleForm] = useState<RuleForm>({ text: '', textAr: '', order: 0 });
  const [guidelineForm, setGuidelineForm] = useState<GuidelineForm>({ text: '', textAr: '', order: 0 });
  const [announcementForm, setAnnouncementForm] = useState<AnnouncementForm>({ title: '', message: '', targetUsers: 'all' });
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [sortBy, setSortBy] = useState('order');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

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
  const fetchRules = async () => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/admin/contract-terms/rules', { headers });
      const data = await response.json();
      if (data.success) {
        setRules(data.data);
      } else {
        throw new Error(data.message || 'Failed to fetch rules');
      }
    } catch (error) {
      console.error('Error fetching rules:', error);
      setError('Failed to fetch platform rules');
    }
  };

  const fetchGuidelines = async () => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/admin/contract-terms/guidelines', { headers });
      const data = await response.json();
      if (data.success) {
        setGuidelines(data.data);
      } else {
        throw new Error(data.message || 'Failed to fetch guidelines');
      }
    } catch (error) {
      console.error('Error fetching guidelines:', error);
      setError('Failed to fetch guidelines');
    }
  };

  const fetchAnnouncements = async () => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/admin/contract-terms/announcements', { headers });
      const data = await response.json();
      if (data.success) {
        setAnnouncements(data.data);
      } else {
        throw new Error(data.message || 'Failed to fetch announcements');
      }
    } catch (error) {
      console.error('Error fetching announcements:', error);
      setError('Failed to fetch announcements');
    }
  };

  // CRUD handlers
  const handleCreateRule = async () => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/admin/contract-terms/rules', {
        method: 'POST',
        headers,
        body: JSON.stringify(ruleForm)
      });
      const data = await response.json();
      if (data.success) {
        setSuccess('Platform rule added successfully');
        setRuleForm({ text: '', textAr: '', order: 0 });
        setShowRuleForm(false);
        await fetchRules();
      } else {
        throw new Error(data.message || 'Failed to add rule');
      }
    } catch (error) {
      console.error('Error creating rule:', error);
      setError('Failed to add platform rule');
    }
  };

  const handleUpdateRule = async (ruleId: string) => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/admin/contract-terms/rules/${ruleId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(ruleForm)
      });
      const data = await response.json();
      if (data.success) {
        setSuccess('Platform rule updated successfully');
        setRuleForm({ text: '', textAr: '', order: 0 });
        setEditingRule(null);
        await fetchRules();
      } else {
        throw new Error(data.message || 'Failed to update rule');
      }
    } catch (error) {
      console.error('Error updating rule:', error);
      setError('Failed to update platform rule');
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (!confirm('Are you sure you want to delete this rule?')) return;
    
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/admin/contract-terms/rules/${ruleId}`, {
        method: 'DELETE',
        headers
      });
      const data = await response.json();
      if (data.success) {
        setSuccess('Platform rule deleted successfully');
        await fetchRules();
      } else {
        throw new Error(data.message || 'Failed to delete rule');
      }
    } catch (error) {
      console.error('Error deleting rule:', error);
      setError('Failed to delete platform rule');
    }
  };

  const handleCreateGuideline = async () => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/admin/contract-terms/guidelines', {
        method: 'POST',
        headers,
        body: JSON.stringify(guidelineForm)
      });
      const data = await response.json();
      if (data.success) {
        setSuccess('Guideline added successfully');
        setGuidelineForm({ text: '', textAr: '', order: 0 });
        setShowGuidelineForm(false);
        await fetchGuidelines();
      } else {
        throw new Error(data.message || 'Failed to add guideline');
      }
    } catch (error) {
      console.error('Error creating guideline:', error);
      setError('Failed to add guideline');
    }
  };

  const handleCreateAnnouncement = async () => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/admin/contract-terms/announcements', {
        method: 'POST',
        headers,
        body: JSON.stringify(announcementForm)
      });
      const data = await response.json();
      if (data.success) {
        setSuccess('Announcement created successfully');
        setAnnouncementForm({ title: '', message: '', targetUsers: 'all' });
        setShowAnnouncementForm(false);
        await fetchAnnouncements();
      } else {
        throw new Error(data.message || 'Failed to create announcement');
      }
    } catch (error) {
      console.error('Error creating announcement:', error);
      setError('Failed to create announcement');
    }
  };

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([fetchRules(), fetchGuidelines(), fetchAnnouncements()]);
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
    if (activeTab === 'rules') fetchRules();
    else if (activeTab === 'guidelines') fetchGuidelines();
    else if (activeTab === 'announcements') fetchAnnouncements();
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

  // Report columns for export
  const reportColumns = [
    { key: 'id', label: 'ID', type: 'text' as const },
    { key: 'text', label: 'Text (EN)', type: 'text' as const },
    { key: 'textAr', label: 'Text (AR)', type: 'text' as const },
    { key: 'order', label: 'Order', type: 'number' as const },
    { key: 'createdAt', label: 'Created At', type: 'date' as const },
    { key: 'updatedAt', label: 'Updated At', type: 'date' as const }
  ];

  const announcementColumns = [
    { key: 'id', label: 'ID', type: 'text' as const },
    { key: 'title', label: 'Title', type: 'text' as const },
    { key: 'message', label: 'Message', type: 'text' as const },
    { key: 'targetUsers', label: 'Target Users', type: 'text' as const },
    { key: 'createdAt', label: 'Created At', type: 'date' as const }
  ];

  if (loading) {
    return (
      <div className="contract-terms-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="contract-terms-page">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 style={{ color: theme.textPrimary }}>Contract Terms & Rules</h1>
          <p style={{ color: theme.textSecondary }}>
            Manage platform rules, guidelines, and announcements across the entire app.
          </p>
        </div>
        
        <div className="header-actions">
          <button 
            className="btn btn-primary"
            onClick={() => {
              if (activeTab === 'rules') setShowRuleForm(true);
              else if (activeTab === 'guidelines') setShowGuidelineForm(true);
              else if (activeTab === 'announcements') setShowAnnouncementForm(true);
            }}
            style={{ backgroundColor: theme.primary, color: theme.background }}
          >
            <Plus size={16} />
            Add {activeTab === 'rules' ? 'Rule' : activeTab === 'guidelines' ? 'Guideline' : 'Announcement'}
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

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab ${activeTab === 'rules' ? 'active' : ''}`}
          onClick={() => setActiveTab('rules')}
          style={{
            backgroundColor: activeTab === 'rules' ? theme.primary : 'transparent',
            color: activeTab === 'rules' ? theme.background : theme.textPrimary,
            borderColor: theme.border
          }}
        >
          <Scale size={16} />
          Platform Rules ({rules.length})
        </button>
        <button
          className={`tab ${activeTab === 'guidelines' ? 'active' : ''}`}
          onClick={() => setActiveTab('guidelines')}
          style={{
            backgroundColor: activeTab === 'guidelines' ? theme.primary : 'transparent',
            color: activeTab === 'guidelines' ? theme.background : theme.textPrimary,
            borderColor: theme.border
          }}
        >
          <FileCheck size={16} />
          Guidelines ({guidelines.length})
        </button>
        <button
          className={`tab ${activeTab === 'announcements' ? 'active' : ''}`}
          onClick={() => setActiveTab('announcements')}
          style={{
            backgroundColor: activeTab === 'announcements' ? theme.primary : 'transparent',
            color: activeTab === 'announcements' ? theme.background : theme.textPrimary,
            borderColor: theme.border
          }}
        >
          <Megaphone size={16} />
          Announcements ({announcements.length})
        </button>
      </div>

      {/* Search and Filters */}
      <div className="search-filters">
        <div className="search-box">
          <Search size={20} color={theme.textSecondary} />
          <input
            type="text"
            placeholder="Search..."
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
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              backgroundColor: theme.surface,
              color: theme.textPrimary,
              borderColor: theme.border
            }}
          >
            <option value="order">Order</option>
            <option value="createdAt">Created Date</option>
            <option value="updatedAt">Updated Date</option>
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
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
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
        {activeTab === 'rules' && (
          <div className="rules-section">
            {rules.length === 0 ? (
              <div className="empty-state" style={{ backgroundColor: theme.surface, borderColor: theme.border }}>
                <Scale size={48} color={theme.textSecondary} />
                <h3 style={{ color: theme.textPrimary }}>No Platform Rules</h3>
                <p style={{ color: theme.textSecondary }}>Create your first platform rule to get started.</p>
                <button
                  className="btn btn-primary"
                  onClick={() => setShowRuleForm(true)}
                  style={{ backgroundColor: theme.primary, color: theme.background }}
                >
                  <Plus size={16} />
                  Add First Rule
                </button>
              </div>
            ) : (
              <div className="rules-list">
                {rules.map((rule) => (
                  <div key={rule.id} className="rule-card" style={{ backgroundColor: theme.surface, borderColor: theme.border }}>
                    <div className="rule-header">
                      <div className="rule-order" style={{ backgroundColor: theme.primary + '20', color: theme.primary }}>
                        #{rule.order}
                      </div>
                      <div className="rule-actions">
                        <button
                          className="btn btn-sm btn-secondary"
                          onClick={() => {
                            setEditingRule(rule);
                            setRuleForm({ text: rule.text, textAr: rule.textAr, order: rule.order });
                            setShowRuleForm(true);
                          }}
                          style={{ backgroundColor: theme.surface, color: theme.textPrimary, borderColor: theme.border }}
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDeleteRule(rule.id)}
                          style={{ backgroundColor: theme.error + '20', color: theme.error, borderColor: theme.error }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    
                    <div className="rule-content">
                      <div className="rule-text">
                        <h4 style={{ color: theme.textPrimary }}>English</h4>
                        <p style={{ color: theme.textSecondary }}>{rule.text}</p>
                      </div>
                      <div className="rule-text">
                        <h4 style={{ color: theme.textPrimary }}>العربية</h4>
                        <p style={{ color: theme.textSecondary }}>{rule.textAr}</p>
                      </div>
                    </div>
                    
                    <div className="rule-meta" style={{ color: theme.textTertiary }}>
                      <span>Created: {rule.createdAt?.toDate?.()?.toLocaleDateString() || 'Unknown'}</span>
                      {rule.updatedAt && (
                        <span>Updated: {rule.updatedAt?.toDate?.()?.toLocaleDateString() || 'Unknown'}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'guidelines' && (
          <div className="guidelines-section">
            {guidelines.length === 0 ? (
              <div className="empty-state" style={{ backgroundColor: theme.surface, borderColor: theme.border }}>
                <FileCheck size={48} color={theme.textSecondary} />
                <h3 style={{ color: theme.textPrimary }}>No Guidelines</h3>
                <p style={{ color: theme.textSecondary }}>Create your first guideline to get started.</p>
                <button
                  className="btn btn-primary"
                  onClick={() => setShowGuidelineForm(true)}
                  style={{ backgroundColor: theme.primary, color: theme.background }}
                >
                  <Plus size={16} />
                  Add First Guideline
                </button>
              </div>
            ) : (
              <div className="guidelines-list">
                {guidelines.map((guideline) => (
                  <div key={guideline.id} className="guideline-card" style={{ backgroundColor: theme.surface, borderColor: theme.border }}>
                    <div className="guideline-header">
                      <div className="guideline-order" style={{ backgroundColor: theme.info + '20', color: theme.info }}>
                        #{guideline.order}
                      </div>
                      <div className="guideline-actions">
                        <button
                          className="btn btn-sm btn-secondary"
                          onClick={() => {
                            setEditingGuideline(guideline);
                            setGuidelineForm({ text: guideline.text, textAr: guideline.textAr, order: guideline.order });
                            setShowGuidelineForm(true);
                          }}
                          style={{ backgroundColor: theme.surface, color: theme.textPrimary, borderColor: theme.border }}
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => {/* TODO: Add delete guideline */}}
                          style={{ backgroundColor: theme.error + '20', color: theme.error, borderColor: theme.error }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    
                    <div className="guideline-content">
                      <div className="guideline-text">
                        <h4 style={{ color: theme.textPrimary }}>English</h4>
                        <p style={{ color: theme.textSecondary }}>{guideline.text}</p>
                      </div>
                      <div className="guideline-text">
                        <h4 style={{ color: theme.textPrimary }}>العربية</h4>
                        <p style={{ color: theme.textSecondary }}>{guideline.textAr}</p>
                      </div>
                    </div>
                    
                    <div className="guideline-meta" style={{ color: theme.textTertiary }}>
                      <span>Created: {guideline.createdAt?.toDate?.()?.toLocaleDateString() || 'Unknown'}</span>
                      {guideline.updatedAt && (
                        <span>Updated: {guideline.updatedAt?.toDate?.()?.toLocaleDateString() || 'Unknown'}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'announcements' && (
          <div className="announcements-section">
            {announcements.length === 0 ? (
              <div className="empty-state" style={{ backgroundColor: theme.surface, borderColor: theme.border }}>
                <Megaphone size={48} color={theme.textSecondary} />
                <h3 style={{ color: theme.textPrimary }}>No Announcements</h3>
                <p style={{ color: theme.textSecondary }}>Create your first announcement to get started.</p>
                <button
                  className="btn btn-primary"
                  onClick={() => setShowAnnouncementForm(true)}
                  style={{ backgroundColor: theme.primary, color: theme.background }}
                >
                  <Plus size={16} />
                  Add First Announcement
                </button>
              </div>
            ) : (
              <div className="announcements-list">
                {announcements.map((announcement) => (
                  <div key={announcement.id} className="announcement-card" style={{ backgroundColor: theme.surface, borderColor: theme.border }}>
                    <div className="announcement-header">
                      <div className="announcement-title">
                        <h3 style={{ color: theme.textPrimary }}>{announcement.title}</h3>
                        <span className="announcement-target" style={{ backgroundColor: theme.warning + '20', color: theme.warning }}>
                          {announcement.targetUsers}
                        </span>
                      </div>
                      <div className="announcement-actions">
                        <button
                          className="btn btn-sm btn-secondary"
                          onClick={() => {
                            setEditingAnnouncement(announcement);
                            setAnnouncementForm({ title: announcement.title, message: announcement.message, targetUsers: announcement.targetUsers });
                            setShowAnnouncementForm(true);
                          }}
                          style={{ backgroundColor: theme.surface, color: theme.textPrimary, borderColor: theme.border }}
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => {/* TODO: Add delete announcement */}}
                          style={{ backgroundColor: theme.error + '20', color: theme.error, borderColor: theme.error }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    
                    <div className="announcement-content">
                      <p style={{ color: theme.textSecondary }}>{announcement.message}</p>
                    </div>
                    
                    <div className="announcement-meta" style={{ color: theme.textTertiary }}>
                      <span>Created: {announcement.createdAt?.toDate?.()?.toLocaleDateString() || 'Unknown'}</span>
                      {announcement.updatedAt && (
                        <span>Updated: {announcement.updatedAt?.toDate?.()?.toLocaleDateString() || 'Unknown'}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Report Generator */}
      <div className="report-section">
        <ReportGenerator
          data={activeTab === 'rules' ? rules : activeTab === 'guidelines' ? guidelines : announcements}
          columns={activeTab === 'announcements' ? announcementColumns : reportColumns}
          title={`${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Export`}
        />
      </div>

      {/* Rule Form Modal */}
      {showRuleForm && (
        <div className="modal-overlay" style={{ backgroundColor: theme.modalBackground }}>
          <div className="modal" style={{ backgroundColor: theme.surface, borderColor: theme.border }}>
            <div className="modal-header">
              <h2 style={{ color: theme.textPrimary }}>
                {editingRule ? 'Edit Platform Rule' : 'Add Platform Rule'}
              </h2>
              <button
                className="btn btn-sm btn-secondary"
                onClick={() => {
                  setShowRuleForm(false);
                  setEditingRule(null);
                  setRuleForm({ text: '', textAr: '', order: 0 });
                }}
                style={{ backgroundColor: theme.surface, color: theme.textPrimary, borderColor: theme.border }}
              >
                <X size={16} />
              </button>
            </div>
            
            <div className="modal-content">
              <div className="form-group">
                <label style={{ color: theme.textPrimary }}>Order</label>
                <input
                  type="number"
                  value={ruleForm.order}
                  onChange={(e) => setRuleForm({ ...ruleForm, order: parseInt(e.target.value) || 0 })}
                  style={{
                    backgroundColor: theme.inputBackground,
                    color: theme.textPrimary,
                    borderColor: theme.border
                  }}
                />
              </div>
              
              <div className="form-group">
                <label style={{ color: theme.textPrimary }}>Text (English)</label>
                <textarea
                  value={ruleForm.text}
                  onChange={(e) => setRuleForm({ ...ruleForm, text: e.target.value })}
                  rows={4}
                  style={{
                    backgroundColor: theme.inputBackground,
                    color: theme.textPrimary,
                    borderColor: theme.border
                  }}
                />
              </div>
              
              <div className="form-group">
                <label style={{ color: theme.textPrimary }}>Text (العربية)</label>
                <textarea
                  value={ruleForm.textAr}
                  onChange={(e) => setRuleForm({ ...ruleForm, textAr: e.target.value })}
                  rows={4}
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
                  setShowRuleForm(false);
                  setEditingRule(null);
                  setRuleForm({ text: '', textAr: '', order: 0 });
                }}
                style={{ backgroundColor: theme.surface, color: theme.textPrimary, borderColor: theme.border }}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={editingRule ? () => handleUpdateRule(editingRule.id) : handleCreateRule}
                style={{ backgroundColor: theme.primary, color: theme.background }}
              >
                <Save size={16} />
                {editingRule ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Guideline Form Modal */}
      {showGuidelineForm && (
        <div className="modal-overlay" style={{ backgroundColor: theme.modalBackground }}>
          <div className="modal" style={{ backgroundColor: theme.surface, borderColor: theme.border }}>
            <div className="modal-header">
              <h2 style={{ color: theme.textPrimary }}>
                {editingGuideline ? 'Edit Guideline' : 'Add Guideline'}
              </h2>
              <button
                className="btn btn-sm btn-secondary"
                onClick={() => {
                  setShowGuidelineForm(false);
                  setEditingGuideline(null);
                  setGuidelineForm({ text: '', textAr: '', order: 0 });
                }}
                style={{ backgroundColor: theme.surface, color: theme.textPrimary, borderColor: theme.border }}
              >
                <X size={16} />
              </button>
            </div>
            
            <div className="modal-content">
              <div className="form-group">
                <label style={{ color: theme.textPrimary }}>Order</label>
                <input
                  type="number"
                  value={guidelineForm.order}
                  onChange={(e) => setGuidelineForm({ ...guidelineForm, order: parseInt(e.target.value) || 0 })}
                  style={{
                    backgroundColor: theme.inputBackground,
                    color: theme.textPrimary,
                    borderColor: theme.border
                  }}
                />
              </div>
              
              <div className="form-group">
                <label style={{ color: theme.textPrimary }}>Text (English)</label>
                <textarea
                  value={guidelineForm.text}
                  onChange={(e) => setGuidelineForm({ ...guidelineForm, text: e.target.value })}
                  rows={4}
                  style={{
                    backgroundColor: theme.inputBackground,
                    color: theme.textPrimary,
                    borderColor: theme.border
                  }}
                />
              </div>
              
              <div className="form-group">
                <label style={{ color: theme.textPrimary }}>Text (العربية)</label>
                <textarea
                  value={guidelineForm.textAr}
                  onChange={(e) => setGuidelineForm({ ...guidelineForm, textAr: e.target.value })}
                  rows={4}
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
                  setShowGuidelineForm(false);
                  setEditingGuideline(null);
                  setGuidelineForm({ text: '', textAr: '', order: 0 });
                }}
                style={{ backgroundColor: theme.surface, color: theme.textPrimary, borderColor: theme.border }}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleCreateGuideline}
                style={{ backgroundColor: theme.primary, color: theme.background }}
              >
                <Save size={16} />
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Announcement Form Modal */}
      {showAnnouncementForm && (
        <div className="modal-overlay" style={{ backgroundColor: theme.modalBackground }}>
          <div className="modal" style={{ backgroundColor: theme.surface, borderColor: theme.border }}>
            <div className="modal-header">
              <h2 style={{ color: theme.textPrimary }}>
                {editingAnnouncement ? 'Edit Announcement' : 'Add Announcement'}
              </h2>
              <button
                className="btn btn-sm btn-secondary"
                onClick={() => {
                  setShowAnnouncementForm(false);
                  setEditingAnnouncement(null);
                  setAnnouncementForm({ title: '', message: '', targetUsers: 'all' });
                }}
                style={{ backgroundColor: theme.surface, color: theme.textPrimary, borderColor: theme.border }}
              >
                <X size={16} />
              </button>
            </div>
            
            <div className="modal-content">
              <div className="form-group">
                <label style={{ color: theme.textPrimary }}>Title</label>
                <input
                  type="text"
                  value={announcementForm.title}
                  onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
                  style={{
                    backgroundColor: theme.inputBackground,
                    color: theme.textPrimary,
                    borderColor: theme.border
                  }}
                />
              </div>
              
              <div className="form-group">
                <label style={{ color: theme.textPrimary }}>Target Users</label>
                <select
                  value={announcementForm.targetUsers}
                  onChange={(e) => setAnnouncementForm({ ...announcementForm, targetUsers: e.target.value })}
                  style={{
                    backgroundColor: theme.inputBackground,
                    color: theme.textPrimary,
                    borderColor: theme.border
                  }}
                >
                  <option value="all">All Users</option>
                  <option value="clients">Clients Only</option>
                  <option value="freelancers">Freelancers Only</option>
                  <option value="guilds">Guilds Only</option>
                </select>
              </div>
              
              <div className="form-group">
                <label style={{ color: theme.textPrimary }}>Message</label>
                <textarea
                  value={announcementForm.message}
                  onChange={(e) => setAnnouncementForm({ ...announcementForm, message: e.target.value })}
                  rows={6}
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
                  setShowAnnouncementForm(false);
                  setEditingAnnouncement(null);
                  setAnnouncementForm({ title: '', message: '', targetUsers: 'all' });
                }}
                style={{ backgroundColor: theme.surface, color: theme.textPrimary, borderColor: theme.border }}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleCreateAnnouncement}
                style={{ backgroundColor: theme.primary, color: theme.background }}
              >
                <Save size={16} />
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContractTermsPage;