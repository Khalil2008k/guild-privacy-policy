import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import io from 'socket.io-client';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Clock,
  Cpu,
  Database,
  HardDrive,
  MemoryStick,
  Network,
  Server,
  Shield,
  TrendingUp,
  Users,
  Zap,
  DollarSign,
  Eye,
} from 'lucide-react';

interface SystemMetrics {
  cpu: {
    usage: number;
    cores: number;
    loadAverage: number[];
  };
  memory: {
    total: number;
    used: number;
    free: number;
    usagePercent: number;
  };
  disk: {
    total: number;
    used: number;
    free: number;
    usagePercent: number;
  };
  network: {
    bytesReceived: number;
    bytesSent: number;
    activeConnections: number;
  };
  uptime: number;
  timestamp: Date;
}

interface SecurityMetrics {
  authenticationAttempts: {
    total: number;
    successful: number;
    failed: number;
    blocked: number;
  };
  suspiciousActivity: {
    count: number;
    blockedIPs: string[];
    flaggedUsers: string[];
  };
  activeSessions: number;
  apiThrottling: {
    total: number;
    throttled: number;
  };
  threats: Array<{
    severity: string;
    type: string;
    count: number;
  }>;
  timestamp: Date;
}

interface PerformanceMetrics {
  api: {
    totalRequests: number;
    averageResponseTime: number;
    slowestEndpoint: { path: string; time: number };
    fastestEndpoint: { path: string; time: number };
    errorRate: number;
  };
  database: {
    queries: number;
    averageQueryTime: number;
    slowQueries: number;
    connections: number;
  };
  cache: {
    hits: number;
    misses: number;
    hitRate: number;
    size: number;
  };
  timestamp: Date;
}

interface UserActivityMetrics {
  activeUsers: {
    now: number;
    last5min: number;
    last15min: number;
    last1hour: number;
  };
  newRegistrations: {
    today: number;
    thisWeek: number;
    thisMonth: number;
  };
  userActions: {
    jobsPosted: number;
    jobsCompleted: number;
    transactions: number;
    messages: number;
  };
  engagement: {
    averageSessionDuration: number;
    activeSessionsCount: number;
    bounceRate: number;
  };
  timestamp: Date;
}

interface FinancialMetrics {
  revenue: {
    today: number;
    thisWeek: number;
    thisMonth: number;
    thisYear: number;
  };
  transactions: {
    total: number;
    successful: number;
    failed: number;
    pending: number;
    averageValue: number;
  };
  escrow: {
    totalHeld: number;
    pendingReleases: number;
  };
  fees: {
    collected: number;
    pending: number;
  };
  timestamp: Date;
}

interface Anomaly {
  id: string;
  type: string;
  severity: string;
  description: string;
  metric: string;
  expectedValue: number;
  actualValue: number;
  deviation: number;
  timestamp: Date;
  resolved: boolean;
}

const AdvancedMonitoring: React.FC = () => {
  const { user } = useAuth();
  const [socket] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null);
  const [securityMetrics, setSecurityMetrics] = useState<SecurityMetrics | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);
  const [userMetrics, setUserMetrics] = useState<UserActivityMetrics | null>(null);
  const [financialMetrics, setFinancialMetrics] = useState<FinancialMetrics | null>(null);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  
  const [activeTab, setActiveTab] = useState('system');

  useEffect(() => {
    // Check for dev bypass mode
    const devBypass = localStorage.getItem('devBypass') === 'true';
    if (devBypass) {
      console.log('🔓 DEV BYPASS: Skipping WebSocket connection');
      setIsConnected(false);
      return;
    }
    
    // Initialize WebSocket connection
    const newSocket = io(process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000', {
      path: '/admin-ws',
      transports: ['websocket'],
    });

    newSocket.on('connect', () => {
      console.log('🔌 Connected to admin WebSocket');
      setIsConnected(true);
      
      // Authenticate
      newSocket.emit('authenticate', {
        adminId: user?.uid,
        token: 'jwt-token', // In production, get actual JWT token
      });
    });

    newSocket.on('authenticated', (data: { success: boolean }) => {
      if (data.success) {
        console.log('✅ Authenticated');
        // Subscribe to all channels
        newSocket.emit('subscribe', ['system', 'security', 'performance', 'activity', 'financial']);
      }
    });

    newSocket.on('disconnect', () => {
      console.log('🔌 Disconnected from admin WebSocket');
      setIsConnected(false);
    });

    // Listen for metrics
    newSocket.on('metrics:system', (data: SystemMetrics) => {
      setSystemMetrics(data);
    });

    newSocket.on('metrics:security', (data: SecurityMetrics) => {
      setSecurityMetrics(data);
    });

    newSocket.on('metrics:performance', (data: PerformanceMetrics) => {
      setPerformanceMetrics(data);
    });

    newSocket.on('metrics:user_activity', (data: UserActivityMetrics) => {
      setUserMetrics(data);
    });

    newSocket.on('metrics:financial', (data: FinancialMetrics) => {
      setFinancialMetrics(data);
    });

    newSocket.on('alert:anomaly', (data: Anomaly[]) => {
      setAnomalies(data);
    });

    // setSocket(newSocket); // Commented out since setSocket is not used

    return () => {
      newSocket.close();
    };
  }, [user]);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat().format(Math.round(num));
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-QA', {
      style: 'currency',
      currency: 'QAR',
    }).format(amount);
  };

  const formatDuration = (seconds: number): string => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  const getStatusColor = (percentage: number): string => {
    if (percentage < 50) return '#00ff88';
    if (percentage < 75) return '#ffaa00';
    return '#ff4444';
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'info': return '#00ff88';
      case 'warning': return '#ffaa00';
      case 'critical': return '#ff4444';
      default: return '#666';
    }
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>
            <Activity size={32} style={{ marginRight: '12px' }} />
            Advanced Monitoring
          </h1>
          <p style={styles.subtitle}>Real-time platform monitoring and analytics</p>
        </div>
        <div style={styles.connectionStatus}>
          <div
            style={{
              ...styles.connectionDot,
              backgroundColor: isConnected ? '#00ff88' : '#ff4444',
            }}
          />
          {isConnected ? 'Connected' : 'Disconnected'}
        </div>
      </div>

      {/* Anomalies Alert */}
      {anomalies.length > 0 && (
        <div style={styles.anomalyAlert}>
          <AlertTriangle size={24} color="#ffaa00" />
          <div style={{ flex: 1, marginLeft: '12px' }}>
            <h3 style={{ margin: 0, color: '#ffaa00' }}>
              {anomalies.length} Anomal{anomalies.length === 1 ? 'y' : 'ies'} Detected
            </h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#ccc' }}>
              {anomalies.map((a) => a.description).join(', ')}
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={styles.tabs}>
        {[
          { id: 'system', label: 'System', icon: Server },
          { id: 'security', label: 'Security', icon: Shield },
          { id: 'performance', label: 'Performance', icon: Zap },
          { id: 'users', label: 'Users', icon: Users },
          { id: 'financial', label: 'Financial', icon: DollarSign },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              ...styles.tab,
              ...(activeTab === tab.id ? styles.activeTab : {}),
            }}
          >
            <tab.icon size={20} />
            <span style={{ marginLeft: '8px' }}>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={styles.content}>
        {activeTab === 'system' && systemMetrics && (
          <div style={styles.grid}>
            {/* CPU Card */}
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <Cpu size={24} color="#00ff88" />
                <h3 style={styles.cardTitle}>CPU</h3>
              </div>
              <div style={styles.metricValue}>
                {systemMetrics.cpu.usage.toFixed(1)}%
              </div>
              <div style={styles.progressBar}>
                <div
                  style={{
                    ...styles.progressFill,
                    width: `${systemMetrics.cpu.usage}%`,
                    backgroundColor: getStatusColor(systemMetrics.cpu.usage),
                  }}
                />
              </div>
              <div style={styles.metricDetails}>
                <span>Cores: {systemMetrics.cpu.cores}</span>
                <span>
                  Load: {systemMetrics.cpu.loadAverage[0].toFixed(2)}
                </span>
              </div>
            </div>

            {/* Memory Card */}
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <MemoryStick size={24} color="#00ff88" />
                <h3 style={styles.cardTitle}>Memory</h3>
              </div>
              <div style={styles.metricValue}>
                {systemMetrics.memory.usagePercent.toFixed(1)}%
              </div>
              <div style={styles.progressBar}>
                <div
                  style={{
                    ...styles.progressFill,
                    width: `${systemMetrics.memory.usagePercent}%`,
                    backgroundColor: getStatusColor(systemMetrics.memory.usagePercent),
                  }}
                />
              </div>
              <div style={styles.metricDetails}>
                <span>Used: {formatBytes(systemMetrics.memory.used)}</span>
                <span>Total: {formatBytes(systemMetrics.memory.total)}</span>
              </div>
            </div>

            {/* Disk Card */}
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <HardDrive size={24} color="#00ff88" />
                <h3 style={styles.cardTitle}>Disk</h3>
              </div>
              <div style={styles.metricValue}>
                {systemMetrics.disk.usagePercent.toFixed(1)}%
              </div>
              <div style={styles.progressBar}>
                <div
                  style={{
                    ...styles.progressFill,
                    width: `${systemMetrics.disk.usagePercent}%`,
                    backgroundColor: getStatusColor(systemMetrics.disk.usagePercent),
                  }}
                />
              </div>
              <div style={styles.metricDetails}>
                <span>Used: {formatBytes(systemMetrics.disk.used)}</span>
                <span>Total: {formatBytes(systemMetrics.disk.total)}</span>
              </div>
            </div>

            {/* Network Card */}
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <Network size={24} color="#00ff88" />
                <h3 style={styles.cardTitle}>Network</h3>
              </div>
              <div style={styles.metricValue}>
                {systemMetrics.network.activeConnections}
              </div>
              <div style={styles.metricLabel}>Active Connections</div>
              <div style={styles.metricDetails}>
                <span>↓ {formatBytes(systemMetrics.network.bytesReceived)}</span>
                <span>↑ {formatBytes(systemMetrics.network.bytesSent)}</span>
              </div>
            </div>

            {/* Uptime Card */}
            <div style={{...styles.card, gridColumn: 'span 2'}}>
              <div style={styles.cardHeader}>
                <Clock size={24} color="#00ff88" />
                <h3 style={styles.cardTitle}>System Uptime</h3>
              </div>
              <div style={styles.metricValue}>
                {formatDuration(systemMetrics.uptime)}
              </div>
              <div style={styles.metricLabel}>
                System has been running continuously
              </div>
            </div>
          </div>
        )}

        {activeTab === 'security' && securityMetrics && (
          <div style={styles.grid}>
            {/* Authentication Card */}
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <Shield size={24} color="#00ff88" />
                <h3 style={styles.cardTitle}>Authentication</h3>
              </div>
              <div style={styles.metricValue}>
                {formatNumber(securityMetrics.authenticationAttempts.successful)}
              </div>
              <div style={styles.metricLabel}>Successful Logins (24h)</div>
              <div style={styles.metricDetails}>
                <span style={{ color: '#ff4444' }}>
                  ✗ {formatNumber(securityMetrics.authenticationAttempts.failed)} Failed
                </span>
                <span style={{ color: '#ffaa00' }}>
                  ⊘ {formatNumber(securityMetrics.authenticationAttempts.blocked)} Blocked
                </span>
              </div>
            </div>

            {/* Suspicious Activity Card */}
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <Eye size={24} color="#ffaa00" />
                <h3 style={styles.cardTitle}>Suspicious Activity</h3>
              </div>
              <div style={styles.metricValue}>
                {securityMetrics.suspiciousActivity.count}
              </div>
              <div style={styles.metricLabel}>Events Detected</div>
              <div style={styles.metricDetails}>
                <span>
                  {securityMetrics.suspiciousActivity.blockedIPs.length} IPs Blocked
                </span>
                <span>
                  {securityMetrics.suspiciousActivity.flaggedUsers.length} Users Flagged
                </span>
              </div>
            </div>

            {/* Active Sessions Card */}
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <Users size={24} color="#00ff88" />
                <h3 style={styles.cardTitle}>Active Sessions</h3>
              </div>
              <div style={styles.metricValue}>
                {formatNumber(securityMetrics.activeSessions)}
              </div>
              <div style={styles.metricLabel}>Currently Active</div>
            </div>

            {/* API Throttling Card */}
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <Zap size={24} color="#00ff88" />
                <h3 style={styles.cardTitle}>API Throttling</h3>
              </div>
              <div style={styles.metricValue}>
                {formatNumber(securityMetrics.apiThrottling.throttled)}
              </div>
              <div style={styles.metricLabel}>
                Throttled / {formatNumber(securityMetrics.apiThrottling.total)} Total
              </div>
              <div style={styles.metricDetails}>
                <span>
                  Rate: {((securityMetrics.apiThrottling.throttled / securityMetrics.apiThrottling.total) * 100).toFixed(2)}%
                </span>
              </div>
            </div>

            {/* Threats Card */}
            {securityMetrics.threats.length > 0 && (
              <div style={{...styles.card, gridColumn: 'span 2'}}>
                <div style={styles.cardHeader}>
                  <AlertTriangle size={24} color="#ff4444" />
                  <h3 style={styles.cardTitle}>Active Threats</h3>
                </div>
                <div style={styles.threatList}>
                  {securityMetrics.threats.map((threat, index) => (
                    <div key={index} style={styles.threatItem}>
                      <div
                        style={{
                          ...styles.threatBadge,
                          backgroundColor: getSeverityColor(threat.severity),
                        }}
                      >
                        {threat.severity.toUpperCase()}
                      </div>
                      <span>{threat.type}</span>
                      <span style={styles.threatCount}>{threat.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'performance' && performanceMetrics && (
          <div style={styles.grid}>
            {/* API Performance Card */}
            <div style={{...styles.card, gridColumn: 'span 2'}}>
              <div style={styles.cardHeader}>
                <BarChart3 size={24} color="#00ff88" />
                <h3 style={styles.cardTitle}>API Performance</h3>
              </div>
              <div style={styles.performanceGrid}>
                <div>
                  <div style={styles.metricValue}>
                    {formatNumber(performanceMetrics.api.totalRequests)}
                  </div>
                  <div style={styles.metricLabel}>Total Requests</div>
                </div>
                <div>
                  <div style={styles.metricValue}>
                    {performanceMetrics.api.averageResponseTime.toFixed(0)}ms
                  </div>
                  <div style={styles.metricLabel}>Avg Response Time</div>
                </div>
                <div>
                  <div style={styles.metricValue}>
                    {performanceMetrics.api.errorRate.toFixed(2)}%
                  </div>
                  <div style={styles.metricLabel}>Error Rate</div>
                </div>
              </div>
              <div style={styles.metricDetails}>
                <span>
                  Slowest: {performanceMetrics.api.slowestEndpoint.path} ({performanceMetrics.api.slowestEndpoint.time}ms)
                </span>
                <span>
                  Fastest: {performanceMetrics.api.fastestEndpoint.path} ({performanceMetrics.api.fastestEndpoint.time}ms)
                </span>
              </div>
            </div>

            {/* Database Performance Card */}
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <Database size={24} color="#00ff88" />
                <h3 style={styles.cardTitle}>Database</h3>
              </div>
              <div style={styles.metricValue}>
                {formatNumber(performanceMetrics.database.queries)}
              </div>
              <div style={styles.metricLabel}>Total Queries</div>
              <div style={styles.metricDetails}>
                <span>
                  Avg: {performanceMetrics.database.averageQueryTime.toFixed(0)}ms
                </span>
                <span style={{ color: '#ffaa00' }}>
                  Slow: {formatNumber(performanceMetrics.database.slowQueries)}
                </span>
              </div>
            </div>

            {/* Cache Performance Card */}
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <Zap size={24} color="#00ff88" />
                <h3 style={styles.cardTitle}>Cache</h3>
              </div>
              <div style={styles.metricValue}>
                {performanceMetrics.cache.hitRate.toFixed(1)}%
              </div>
              <div style={styles.metricLabel}>Hit Rate</div>
              <div style={styles.metricDetails}>
                <span>
                  Hits: {formatNumber(performanceMetrics.cache.hits)}
                </span>
                <span>
                  Misses: {formatNumber(performanceMetrics.cache.misses)}
                </span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && userMetrics && (
          <div style={styles.grid}>
            {/* Active Users Card */}
            <div style={{...styles.card, gridColumn: 'span 2'}}>
              <div style={styles.cardHeader}>
                <Users size={24} color="#00ff88" />
                <h3 style={styles.cardTitle}>Active Users</h3>
              </div>
              <div style={styles.performanceGrid}>
                <div>
                  <div style={styles.metricValue}>
                    {formatNumber(userMetrics.activeUsers.now)}
                  </div>
                  <div style={styles.metricLabel}>Right Now</div>
                </div>
                <div>
                  <div style={styles.metricValue}>
                    {formatNumber(userMetrics.activeUsers.last5min)}
                  </div>
                  <div style={styles.metricLabel}>Last 5 Minutes</div>
                </div>
                <div>
                  <div style={styles.metricValue}>
                    {formatNumber(userMetrics.activeUsers.last1hour)}
                  </div>
                  <div style={styles.metricLabel}>Last Hour</div>
                </div>
              </div>
            </div>

            {/* New Registrations Card */}
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <TrendingUp size={24} color="#00ff88" />
                <h3 style={styles.cardTitle}>Registrations</h3>
              </div>
              <div style={styles.metricValue}>
                {formatNumber(userMetrics.newRegistrations.today)}
              </div>
              <div style={styles.metricLabel}>Today</div>
              <div style={styles.metricDetails}>
                <span>
                  Week: {formatNumber(userMetrics.newRegistrations.thisWeek)}
                </span>
                <span>
                  Month: {formatNumber(userMetrics.newRegistrations.thisMonth)}
                </span>
              </div>
            </div>

            {/* User Actions Card */}
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <Activity size={24} color="#00ff88" />
                <h3 style={styles.cardTitle}>User Actions</h3>
              </div>
              <div style={styles.metricValue}>
                {formatNumber(Object.values(userMetrics.userActions).reduce((a, b) => a + b, 0))}
              </div>
              <div style={styles.metricLabel}>Total Actions</div>
              <div style={styles.metricDetails}>
                <span>
                  Jobs: {formatNumber(userMetrics.userActions.jobsPosted)}
                </span>
                <span>
                  Transactions: {formatNumber(userMetrics.userActions.transactions)}
                </span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'financial' && financialMetrics && (
          <div style={styles.grid}>
            {/* Revenue Card */}
            <div style={{...styles.card, gridColumn: 'span 2'}}>
              <div style={styles.cardHeader}>
                <DollarSign size={24} color="#00ff88" />
                <h3 style={styles.cardTitle}>Revenue</h3>
              </div>
              <div style={styles.performanceGrid}>
                <div>
                  <div style={styles.metricValue}>
                    {formatCurrency(financialMetrics.revenue.today)}
                  </div>
                  <div style={styles.metricLabel}>Today</div>
                </div>
                <div>
                  <div style={styles.metricValue}>
                    {formatCurrency(financialMetrics.revenue.thisWeek)}
                  </div>
                  <div style={styles.metricLabel}>This Week</div>
                </div>
                <div>
                  <div style={styles.metricValue}>
                    {formatCurrency(financialMetrics.revenue.thisMonth)}
                  </div>
                  <div style={styles.metricLabel}>This Month</div>
                </div>
              </div>
            </div>

            {/* Transactions Card */}
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <BarChart3 size={24} color="#00ff88" />
                <h3 style={styles.cardTitle}>Transactions</h3>
              </div>
              <div style={styles.metricValue}>
                {formatNumber(financialMetrics.transactions.total)}
              </div>
              <div style={styles.metricLabel}>Total</div>
              <div style={styles.metricDetails}>
                <span style={{ color: '#00ff88' }}>
                  ✓ {formatNumber(financialMetrics.transactions.successful)}
                </span>
                <span style={{ color: '#ff4444' }}>
                  ✗ {formatNumber(financialMetrics.transactions.failed)}
                </span>
              </div>
            </div>

            {/* Escrow Card */}
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <Shield size={24} color="#00ff88" />
                <h3 style={styles.cardTitle}>Escrow</h3>
              </div>
              <div style={styles.metricValue}>
                {formatCurrency(financialMetrics.escrow.totalHeld)}
              </div>
              <div style={styles.metricLabel}>Total Held</div>
              <div style={styles.metricDetails}>
                <span>
                  Pending: {formatNumber(financialMetrics.escrow.pendingReleases)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '24px',
    backgroundColor: '#000',
    minHeight: '100vh',
    color: '#fff',
  },
  header: {
    marginBottom: '32px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: '32px',
    fontWeight: 'bold',
    margin: 0,
    display: 'flex',
    alignItems: 'center',
  },
  subtitle: {
    fontSize: '16px',
    color: '#888',
    margin: '8px 0 0 0',
  },
  connectionStatus: {
    display: 'flex',
    alignItems: 'center',
    padding: '8px 16px',
    backgroundColor: '#1a1a1a',
    borderRadius: '8px',
    fontSize: '14px',
  },
  connectionDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    marginRight: '8px',
    animation: 'pulse 2s infinite',
  },
  anomalyAlert: {
    display: 'flex',
    alignItems: 'center',
    padding: '16px',
    backgroundColor: '#2a2200',
    border: '1px solid #ffaa00',
    borderRadius: '12px',
    marginBottom: '24px',
  },
  tabs: {
    display: 'flex',
    gap: '12px',
    marginBottom: '24px',
    borderBottom: '1px solid #333',
    paddingBottom: '12px',
  },
  tab: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 24px',
    backgroundColor: 'transparent',
    border: 'none',
    color: '#888',
    fontSize: '16px',
    cursor: 'pointer',
    borderRadius: '8px',
    transition: 'all 0.3s',
  },
  activeTab: {
    backgroundColor: '#00ff8820',
    color: '#00ff88',
  },
  content: {
    marginTop: '24px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '24px',
  },
  card: {
    backgroundColor: '#1a1a1a',
    padding: '24px',
    borderRadius: '12px',
    border: '1px solid #333',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '16px',
  },
  cardTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    margin: 0,
    marginLeft: '12px',
  },
  metricValue: {
    fontSize: '36px',
    fontWeight: 'bold',
    color: '#00ff88',
    marginBottom: '8px',
  },
  metricLabel: {
    fontSize: '14px',
    color: '#888',
    marginBottom: '12px',
  },
  metricDetails: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '14px',
    color: '#ccc',
    marginTop: '12px',
  },
  progressBar: {
    width: '100%',
    height: '8px',
    backgroundColor: '#333',
    borderRadius: '4px',
    overflow: 'hidden',
    marginBottom: '8px',
  },
  progressFill: {
    height: '100%',
    transition: 'width 0.5s ease',
  },
  performanceGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '16px',
    marginBottom: '16px',
  },
  threatList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  threatItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    backgroundColor: '#222',
    borderRadius: '8px',
  },
  threatBadge: {
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 'bold',
  },
  threatCount: {
    marginLeft: 'auto',
    fontWeight: 'bold',
    color: '#ff4444',
  },
};

export default AdvancedMonitoring;

