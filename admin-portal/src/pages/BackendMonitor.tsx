import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Users, 
  Cpu,
  HardDrive,
  Network,
  RefreshCw,
  TrendingUp,
  AlertCircle,
  X,
  Clock
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
  Filler
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import './BackendMonitor.css';

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
  Filler
);

// TypeScript interfaces for type safety
interface SystemMetrics {
  cpu: number;
  memory: number;
  disk: number;
  network: number;
  timestamp: number;
}

interface SentryError {
  id: string;
  message: string;
  file: string;
  line: number;
  level: 'error' | 'warning' | 'info';
  timestamp: number;
  count: number;
  user?: string;
  tags?: Record<string, string>;
}

interface LiveUser {
  id: string;
  name: string;
  email: string;
  lastSeen: number;
  location: string;
  device: string;
  status: 'online' | 'idle' | 'offline';
}

interface BackendStats {
  totalRequests: number;
  errorRate: number;
  avgResponseTime: number;
  activeConnections?: number;
  activeUsers?: number;
  uptime: number;
  memoryUsage?: number;
  cpuUsage?: number;
}

const BackendMonitorPage: React.FC = () => {
  const { theme } = useTheme();
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics[]>([]);
  const [sentryErrors, setSentryErrors] = useState<SentryError[]>([]);
  const [liveUsers, setLiveUsers] = useState<LiveUser[]>([]);
  const [backendStats, setBackendStats] = useState<BackendStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>('1h');
  const [autoRefresh] = useState<boolean>(true);
  const [refreshInterval] = useState<number>(30000); // 30 seconds
  
  const wsRef = useRef<WebSocket | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // WebSocket connection for real-time data
  const connectWebSocket = useCallback(() => {
    try {
      // Check for dev bypass mode
      const devBypass = localStorage.getItem('devBypass') === 'true';
      if (devBypass) {
        console.log('🔓 DEV BYPASS: Skipping WebSocket connection');
        setIsConnected(false);
        setError('WebSocket disabled in dev bypass mode');
        return;
      }
      
      const wsUrl = process.env.REACT_APP_WEBSOCKET_URL || 'ws://localhost:3001/backend-monitor';
      wsRef.current = new WebSocket(wsUrl);
      
      wsRef.current.onopen = () => {
        console.log('WebSocket connected to backend monitor');
        setIsConnected(true);
        setError(null);
      };
      
      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleWebSocketMessage(data);
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };
      
      wsRef.current.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        // Attempt to reconnect after 3 seconds
        setTimeout(connectWebSocket, 3000);
      };
      
      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setError('Failed to connect to backend monitor');
        setIsConnected(false);
      };
    } catch (err) {
      console.error('Error creating WebSocket connection:', err);
      setError('WebSocket connection failed');
    }
  }, []);

  // Handle incoming WebSocket messages
  const handleWebSocketMessage = useCallback((data: any) => {
    switch (data.type) {
      case 'system_metrics':
        setSystemMetrics(prev => {
          const newMetrics = [...prev, data.metrics];
          return newMetrics.slice(-60); // Keep last 60 data points
        });
        break;
      case 'sentry_errors':
        setSentryErrors(data.errors);
        break;
      case 'live_users':
        setLiveUsers(data.users);
        break;
      case 'backend_stats':
        setBackendStats(data.stats);
        break;
      default:
        console.log('Unknown message type:', data.type);
    }
  }, []);

  // Fetch initial data
  const fetchInitialData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Check for dev bypass mode
      const devBypass = localStorage.getItem('devBypass') === 'true';
      if (devBypass) {
        console.log('🔓 DEV BYPASS: Using mock monitoring data');
        // Set mock data for development
        setSentryErrors([
          {
            id: 'mock-1',
            message: 'Mock Firebase connection timeout',
            file: 'src/services/firebase.ts',
            line: 45,
            level: 'error',
            timestamp: Date.now() - 300000,
            count: 3,
            user: 'admin@example.com',
            tags: { component: 'firebase', severity: 'high' }
          }
        ]);
        setBackendStats({
          uptime: 99.9,
          avgResponseTime: 120,
          errorRate: 0.1,
          activeUsers: 1250,
          totalRequests: 45600,
          cpuUsage: 45,
          memoryUsage: 67
        });
        setSystemMetrics([
          { cpu: 45, memory: 67, disk: 23, network: 12, timestamp: Date.now() },
          { cpu: 42, memory: 65, disk: 23, network: 15, timestamp: Date.now() - 5000 },
          { cpu: 48, memory: 68, disk: 23, network: 10, timestamp: Date.now() - 10000 }
        ]);
        setLoading(false);
        return;
      }

      // Fetch Sentry errors
      const sentryResponse = await fetch('/api/v1/monitoring/sentry-errors');
      if (sentryResponse.ok) {
        const sentryData = await sentryResponse.json();
        setSentryErrors(sentryData.errors || []);
      }

      // Fetch live users
      const usersResponse = await fetch('/api/v1/analytics/users/live');
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        setLiveUsers(usersData.users || []);
      }

      // Fetch backend stats
      const statsResponse = await fetch('/api/v1/monitoring/backend-stats');
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setBackendStats(statsData);
      }

      // Fetch system metrics
      const metricsResponse = await fetch('/api/v1/monitoring/system-metrics');
      if (metricsResponse.ok) {
        const metricsData = await metricsResponse.json();
        setSystemMetrics(metricsData.metrics || []);
      }

    } catch (err) {
      console.error('Error fetching initial data:', err);
      setError('Failed to load monitoring data');
      
      // Set fallback data for development
      setSentryErrors([
        {
          id: '1',
          message: 'Firebase connection timeout',
          file: 'src/services/firebase.ts',
          line: 45,
          level: 'error',
          timestamp: Date.now() - 300000,
          count: 3,
          user: 'admin@example.com',
          tags: { component: 'firebase', severity: 'high' }
        },
        {
          id: '2',
          message: 'Database query timeout',
          file: 'src/services/database.ts',
          line: 123,
          level: 'warning',
          timestamp: Date.now() - 600000,
          count: 1,
          tags: { component: 'database', severity: 'medium' }
        }
      ]);

      setLiveUsers([
        {
          id: '1',
          name: 'Ahmed Al-Rashid',
          email: 'ahmed@example.com',
          lastSeen: Date.now() - 30000,
          location: 'Doha, Qatar',
          device: 'iPhone 14',
          status: 'online'
        },
        {
          id: '2',
          name: 'Sarah Johnson',
          email: 'sarah@example.com',
          lastSeen: Date.now() - 120000,
          location: 'Dubai, UAE',
          device: 'Samsung Galaxy S23',
          status: 'idle'
        }
      ]);

      setBackendStats({
        totalRequests: 1247,
        errorRate: 2.3,
        avgResponseTime: 245,
        activeConnections: 23,
        uptime: 86400,
        memoryUsage: 68.5,
        cpuUsage: 45.2
      });

      // Generate mock system metrics
      const mockMetrics: SystemMetrics[] = [];
      for (let i = 59; i >= 0; i--) {
        const timestamp = Date.now() - (i * 60000);
        mockMetrics.push({
          cpu: Math.random() * 100,
          memory: Math.random() * 100,
          disk: Math.random() * 100,
          network: Math.random() * 100,
          timestamp
        });
      }
      setSystemMetrics(mockMetrics);
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-refresh functionality
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      intervalRef.current = setInterval(() => {
        fetchInitialData();
      }, refreshInterval);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [autoRefresh, refreshInterval, fetchInitialData]);

  // Initialize component
  useEffect(() => {
    fetchInitialData();
    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchInitialData, connectWebSocket]);

  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        labels: {
          color: theme.textSecondary,
          font: { size: 12 }
        }
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

  // System metrics chart data
  const systemMetricsChartData = systemMetrics.length > 0 ? {
    labels: systemMetrics.map(metric => 
      new Date(metric.timestamp).toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    ),
    datasets: [
      {
        label: 'CPU %',
        data: systemMetrics.map(metric => metric.cpu),
        borderColor: theme.primary,
        backgroundColor: theme.primary + '20',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Memory %',
        data: systemMetrics.map(metric => metric.memory),
        borderColor: theme.secondary,
        backgroundColor: theme.secondary + '20',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Disk %',
        data: systemMetrics.map(metric => metric.disk),
        borderColor: theme.info,
        backgroundColor: theme.info + '20',
        fill: true,
        tension: 0.4,
      },
    ],
  } : null;

  // Error rate chart data
  const errorRateChartData = systemMetrics.length > 0 ? {
    labels: systemMetrics.map(metric => 
      new Date(metric.timestamp).toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    ),
    datasets: [
      {
        label: 'Error Rate %',
        data: systemMetrics.map(_metric => Math.random() * 5), // Mock error rate
        backgroundColor: theme.warning + '40',
        borderColor: theme.warning,
        borderWidth: 2,
      },
    ],
  } : null;

  // Get status color based on metrics
  const getStatusColor = (value: number, thresholds: { warning: number; critical: number }) => {
    if (value >= thresholds.critical) return theme.error;
    if (value >= thresholds.warning) return theme.warning;
    return theme.success;
  };

  // Get status icon
  const getStatusIcon = (value: number, thresholds: { warning: number; critical: number }) => {
    if (value >= thresholds.critical) return AlertTriangle;
    if (value >= thresholds.warning) return AlertCircle;
    return CheckCircle;
  };

  // Format uptime
  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  // Format relative time
  const formatRelativeTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  if (loading) {
    return (
      <div className="backend-monitor" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="backend-monitor">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 style={{ color: theme.textPrimary }}>Backend Monitor</h1>
          <p style={{ color: theme.textSecondary }}>
            Real-time system monitoring and error tracking
          </p>
        </div>
        
        <div className="header-actions">
          <div className="connection-status" style={{ 
            backgroundColor: isConnected ? theme.success + '20' : theme.error + '20',
            color: isConnected ? theme.success : theme.error,
            padding: '8px 16px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <div style={{ 
              width: '8px', 
              height: '8px', 
              borderRadius: '50%', 
              backgroundColor: isConnected ? theme.success : theme.error 
            }}></div>
            {isConnected ? 'Connected' : 'Disconnected'}
          </div>
          
          <select 
            className="time-select"
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value)}
            style={{ 
              backgroundColor: theme.surface,
              color: theme.textPrimary,
              borderColor: theme.border 
            }}
          >
            <option value="1h">Last Hour</option>
            <option value="6h">Last 6 Hours</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
          </select>
          
          <button 
            className="btn btn-secondary"
            onClick={() => fetchInitialData()}
            style={{ 
              backgroundColor: theme.surface,
              color: theme.textPrimary,
              borderColor: theme.border 
            }}
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </div>

      {/* System Status Cards */}
      <div className="status-grid">
        {/* CPU Usage */}
        <div className="status-card" style={{ backgroundColor: theme.surface }}>
          <div className="status-header">
            <Cpu size={24} color={theme.textPrimary} />
            <h3 style={{ color: theme.textPrimary }}>CPU Usage</h3>
          </div>
          <div className="status-content">
            <div className="status-value" style={{ 
              color: getStatusColor(backendStats?.cpuUsage || 0, { warning: 70, critical: 90 })
            }}>
              {backendStats?.cpuUsage?.toFixed(1) || 0}%
            </div>
            <div className="status-icon">
              {React.createElement(getStatusIcon(backendStats?.cpuUsage || 0, { warning: 70, critical: 90 }), {
                size: 20,
                color: getStatusColor(backendStats?.cpuUsage || 0, { warning: 70, critical: 90 })
              })}
            </div>
          </div>
        </div>

        {/* Memory Usage */}
        <div className="status-card" style={{ backgroundColor: theme.surface }}>
          <div className="status-header">
            <HardDrive size={24} color={theme.textPrimary} />
            <h3 style={{ color: theme.textPrimary }}>Memory Usage</h3>
          </div>
          <div className="status-content">
            <div className="status-value" style={{ 
              color: getStatusColor(backendStats?.memoryUsage || 0, { warning: 80, critical: 95 })
            }}>
              {backendStats?.memoryUsage?.toFixed(1) || 0}%
            </div>
            <div className="status-icon">
              {React.createElement(getStatusIcon(backendStats?.memoryUsage || 0, { warning: 80, critical: 95 }), {
                size: 20,
                color: getStatusColor(backendStats?.memoryUsage || 0, { warning: 80, critical: 95 })
              })}
            </div>
          </div>
        </div>

        {/* Error Rate */}
        <div className="status-card" style={{ backgroundColor: theme.surface }}>
          <div className="status-header">
            <AlertTriangle size={24} color={theme.textPrimary} />
            <h3 style={{ color: theme.textPrimary }}>Error Rate</h3>
          </div>
          <div className="status-content">
            <div className="status-value" style={{ 
              color: getStatusColor(backendStats?.errorRate || 0, { warning: 5, critical: 10 })
            }}>
              {backendStats?.errorRate?.toFixed(1) || 0}%
            </div>
            <div className="status-icon">
              {React.createElement(getStatusIcon(backendStats?.errorRate || 0, { warning: 5, critical: 10 }), {
                size: 20,
                color: getStatusColor(backendStats?.errorRate || 0, { warning: 5, critical: 10 })
              })}
            </div>
          </div>
        </div>

        {/* Response Time */}
        <div className="status-card" style={{ backgroundColor: theme.surface }}>
          <div className="status-header">
            <Clock size={24} color={theme.textPrimary} />
            <h3 style={{ color: theme.textPrimary }}>Avg Response</h3>
          </div>
          <div className="status-content">
            <div className="status-value" style={{ 
              color: getStatusColor(backendStats?.avgResponseTime || 0, { warning: 1000, critical: 2000 })
            }}>
              {backendStats?.avgResponseTime || 0}ms
            </div>
            <div className="status-icon">
              {React.createElement(getStatusIcon(backendStats?.avgResponseTime || 0, { warning: 1000, critical: 2000 }), {
                size: 20,
                color: getStatusColor(backendStats?.avgResponseTime || 0, { warning: 1000, critical: 2000 })
              })}
            </div>
          </div>
        </div>

        {/* Active Connections */}
        <div className="status-card" style={{ backgroundColor: theme.surface }}>
          <div className="status-header">
            <Network size={24} color={theme.textPrimary} />
            <h3 style={{ color: theme.textPrimary }}>Connections</h3>
          </div>
          <div className="status-content">
            <div className="status-value" style={{ color: theme.textPrimary }}>
              {backendStats?.activeConnections || 0}
            </div>
            <div className="status-icon">
              <CheckCircle size={20} color={theme.success} />
            </div>
          </div>
        </div>

        {/* Uptime */}
        <div className="status-card" style={{ backgroundColor: theme.surface }}>
          <div className="status-header">
            <Activity size={24} color={theme.textPrimary} />
            <h3 style={{ color: theme.textPrimary }}>Uptime</h3>
          </div>
          <div className="status-content">
            <div className="status-value" style={{ color: theme.textPrimary }}>
              {formatUptime(backendStats?.uptime || 0)}
            </div>
            <div className="status-icon">
              <CheckCircle size={20} color={theme.success} />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-grid">
        {/* System Metrics Chart */}
        <div className="chart-card" style={{ backgroundColor: theme.surface }}>
          <div className="chart-header">
            <h3 style={{ color: theme.textPrimary }}>System Metrics</h3>
            <div className="chart-legend">
              <span className="legend-item">
                <span 
                  className="legend-dot" 
                  style={{ backgroundColor: theme.primary }}
                ></span>
                CPU
              </span>
              <span className="legend-item">
                <span 
                  className="legend-dot" 
                  style={{ backgroundColor: theme.secondary }}
                ></span>
                Memory
              </span>
              <span className="legend-item">
                <span 
                  className="legend-dot" 
                  style={{ backgroundColor: theme.info }}
                ></span>
                Disk
              </span>
            </div>
          </div>
          <div className="chart-container">
            {systemMetricsChartData ? (
              <Line data={systemMetricsChartData} options={chartOptions} />
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <div className="spinner"></div>
              </div>
            )}
          </div>
        </div>

        {/* Error Rate Chart */}
        <div className="chart-card" style={{ backgroundColor: theme.surface }}>
          <div className="chart-header">
            <h3 style={{ color: theme.textPrimary }}>Error Rate</h3>
            <div className="chart-value" style={{ color: theme.warning }}>
              <TrendingUp size={20} />
              <span>+{backendStats?.errorRate?.toFixed(1) || 0}%</span>
            </div>
          </div>
          <div className="chart-container">
            {errorRateChartData ? (
              <Bar data={errorRateChartData} options={chartOptions} />
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <div className="spinner"></div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sentry Errors Section */}
      <div className="errors-section">
        <div className="section-header">
          <h2 style={{ color: theme.textPrimary }}>Recent Errors</h2>
          <div className="error-stats" style={{ color: theme.textSecondary }}>
            {sentryErrors.filter(e => e.level === 'error').length} errors, {sentryErrors.filter(e => e.level === 'warning').length} warnings
          </div>
        </div>
        
        <div className="errors-list" style={{ backgroundColor: theme.surface }}>
          {sentryErrors.length > 0 ? (
            sentryErrors.slice(0, 10).map((error) => (
              <div key={error.id} className="error-item" style={{ borderColor: theme.border }}>
                <div className="error-icon" style={{ 
                  backgroundColor: error.level === 'error' ? theme.error + '20' : theme.warning + '20'
                }}>
                  {error.level === 'error' ? (
                    <AlertTriangle size={20} color={theme.error} />
                  ) : (
                    <AlertCircle size={20} color={theme.warning} />
                  )}
                </div>
                <div className="error-content">
                  <h4 style={{ color: theme.textPrimary }}>{error.message}</h4>
                  <p style={{ color: theme.textSecondary }}>
                    {error.file}:{error.line} • {error.count} occurrences
                  </p>
                  <div className="error-meta" style={{ color: theme.textTertiary }}>
                    <span>{formatRelativeTime(error.timestamp)}</span>
                    {error.user && <span>• {error.user}</span>}
                  </div>
                </div>
                <div className="error-actions">
                  <button 
                    className="btn btn-sm btn-secondary"
                    style={{ 
                      backgroundColor: theme.surface,
                      color: theme.textPrimary,
                      borderColor: theme.border 
                    }}
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: theme.textSecondary }}>
              <CheckCircle size={48} color={theme.success} />
              <p style={{ marginTop: '16px' }}>No errors detected</p>
            </div>
          )}
        </div>
      </div>

      {/* Live Users Section */}
      <div className="users-section">
        <div className="section-header">
          <h2 style={{ color: theme.textPrimary }}>Live Users</h2>
          <div className="user-stats" style={{ color: theme.textSecondary }}>
            {liveUsers.filter(u => u.status === 'online').length} online, {liveUsers.filter(u => u.status === 'idle').length} idle
          </div>
        </div>
        
        <div className="users-list" style={{ backgroundColor: theme.surface }}>
          {liveUsers.length > 0 ? (
            liveUsers.map((user) => (
              <div key={user.id} className="user-item" style={{ borderColor: theme.border }}>
                <div className="user-avatar" style={{ 
                  backgroundColor: user.status === 'online' ? theme.success : 
                                 user.status === 'idle' ? theme.warning : theme.textSecondary
                }}>
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="user-content">
                  <h4 style={{ color: theme.textPrimary }}>{user.name}</h4>
                  <p style={{ color: theme.textSecondary }}>{user.email}</p>
                  <div className="user-meta" style={{ color: theme.textTertiary }}>
                    <span>{user.location}</span>
                    <span>• {user.device}</span>
                    <span>• {formatRelativeTime(user.lastSeen)}</span>
                  </div>
                </div>
                <div className="user-status" style={{ 
                  color: user.status === 'online' ? theme.success : 
                         user.status === 'idle' ? theme.warning : theme.textSecondary
                }}>
                  <div style={{ 
                    width: '8px', 
                    height: '8px', 
                    borderRadius: '50%', 
                    backgroundColor: user.status === 'online' ? theme.success : 
                                   user.status === 'idle' ? theme.warning : theme.textSecondary,
                    marginRight: '8px'
                  }}></div>
                  {user.status}
                </div>
              </div>
            ))
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: theme.textSecondary }}>
              <Users size={48} color={theme.textSecondary} />
              <p style={{ marginTop: '16px' }}>No live users</p>
            </div>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="error-banner" style={{ 
          backgroundColor: theme.error + '20',
          borderColor: theme.error,
          color: theme.error,
          padding: '16px',
          borderRadius: '8px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={20} />
            {error}
          </div>
          <button 
            onClick={() => setError(null)}
            style={{ 
              background: 'none',
              border: 'none',
              color: theme.error,
              cursor: 'pointer'
            }}
          >
            <X size={20} />
          </button>
        </div>
      )}
    </div>
  );
};

export default BackendMonitorPage;


