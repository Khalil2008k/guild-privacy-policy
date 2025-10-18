import React, { useState, useEffect } from 'react';
import {
  FileText,
  Filter,
  Search,
  Download,
  User,
  Shield,
  DollarSign,
  Database,
  Activity,
  AlertCircle,
  Info,
  AlertTriangle,
  XCircle,
} from 'lucide-react';

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

interface AuditLog {
  id: string;
  timestamp: Date;
  actor: {
    id: string;
    email?: string;
    role: string;
    ip?: string;
    userAgent?: string;
  };
  action: string;
  resourceType: string;
  resourceId?: string;
  changes?: {
    before?: any;
    after?: any;
    fields?: string[];
  };
  metadata?: Record<string, any>;
  severity: 'info' | 'warning' | 'critical';
  category: 'system' | 'user' | 'financial' | 'security' | 'data';
  success: boolean;
  error?: string;
  duration?: number;
}

interface AuditStatistics {
  totalLogs: number;
  byCategory: Record<string, number>;
  bySeverity: Record<string, number>;
  byAction: Record<string, number>;
  topActors: { id: string; email: string; count: number }[];
  recentCritical: AuditLog[];
  timeline: { date: string; count: number }[];
}

const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [statistics, setStatistics] = useState<AuditStatistics | null>(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [category, setCategory] = useState('');
  const [severity, setSeverity] = useState('');
  const [actor] = useState('');
  const [page, setPage] = useState(1);
  const limit = 50;

  useEffect(() => {
    fetchLogs();
    fetchStatistics();
  }, [page, category, severity]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: ((page - 1) * limit).toString(),
      });

      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (category) params.append('category', category);
      if (severity) params.append('severity', severity);
      if (actor) params.append('actor', actor);

      const response = await fetch(`${API_BASE}/admin-system/audit/logs?${params}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setLogs(data.data.logs);
        setTotal(data.data.total);
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await fetch(
        `${API_BASE}/admin-system/audit/statistics?${params}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        setStatistics(data.data);
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm) return;

    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE}/admin-system/audit/search?q=${encodeURIComponent(searchTerm)}&limit=${limit}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        setLogs(data.data);
        setTotal(data.data.length);
      }
    } catch (error) {
      console.error('Error searching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: 'json' | 'csv') => {
    try {
      const params = new URLSearchParams({ format });
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (category) params.append('category', category);

      const response = await fetch(`${API_BASE}/admin-system/audit/export?${params}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
        },
      });

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs-${Date.now()}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting logs:', error);
      alert('Failed to export logs');
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'info':
        return <Info size={16} color="#00ff88" />;
      case 'warning':
        return <AlertTriangle size={16} color="#ffaa00" />;
      case 'critical':
        return <XCircle size={16} color="#ff4422" />;
      default:
        return <Info size={16} color="#888" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'system':
        return <Shield size={16} />;
      case 'user':
        return <User size={16} />;
      case 'financial':
        return <DollarSign size={16} />;
      case 'security':
        return <AlertCircle size={16} />;
      case 'data':
        return <Database size={16} />;
      default:
        return <Activity size={16} />;
    }
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'info':
        return '#00ff88';
      case 'warning':
        return '#ffaa00';
      case 'critical':
        return '#ff4422';
      default:
        return '#888';
    }
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>
            <FileText size={32} style={{ marginRight: '12px' }} />
            Audit Logs
          </h1>
          <p style={styles.subtitle}>Complete audit trail and forensic analysis</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={() => handleExport('json')} style={styles.exportButton}>
            <Download size={20} />
            <span style={{ marginLeft: '8px' }}>Export JSON</span>
          </button>
          <button onClick={() => handleExport('csv')} style={styles.exportButton}>
            <Download size={20} />
            <span style={{ marginLeft: '8px' }}>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Statistics */}
      {statistics && (
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={styles.statValue}>{statistics.totalLogs.toLocaleString()}</div>
            <div style={styles.statLabel}>Total Logs</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statValue}>{statistics.recentCritical.length}</div>
            <div style={styles.statLabel}>Critical Events</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statValue}>{statistics.topActors.length}</div>
            <div style={styles.statLabel}>Active Admins</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statValue}>{Object.keys(statistics.byCategory).length}</div>
            <div style={styles.statLabel}>Categories</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={styles.filterPanel}>
        <div style={styles.filterHeader}>
          <Filter size={20} />
          <span style={{ marginLeft: '8px', fontWeight: 'bold' }}>Filters</span>
        </div>

        <div style={styles.filterGrid}>
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Search</label>
            <div style={styles.searchBox}>
              <Search size={20} color="#888" />
              <input
                type="text"
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                style={styles.searchInput}
              />
            </div>
          </div>

          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={styles.filterInput}
            />
          </div>

          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={styles.filterInput}
            />
          </div>

          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={styles.filterInput}
            >
              <option value="">All Categories</option>
              <option value="system">System</option>
              <option value="user">User</option>
              <option value="financial">Financial</option>
              <option value="security">Security</option>
              <option value="data">Data</option>
            </select>
          </div>

          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Severity</label>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
              style={styles.filterInput}
            >
              <option value="">All Severities</option>
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          <div style={styles.filterGroup}>
            <button onClick={fetchLogs} style={styles.applyButton}>
              Apply Filters
            </button>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div style={styles.tableContainer}>
        {loading ? (
          <div style={styles.loading}>Loading logs...</div>
        ) : logs.length === 0 ? (
          <div style={styles.empty}>No logs found</div>
        ) : (
          <>
            <table style={styles.table}>
              <thead>
                <tr style={styles.tableHeader}>
                  <th style={styles.th}>Timestamp</th>
                  <th style={styles.th}>Severity</th>
                  <th style={styles.th}>Category</th>
                  <th style={styles.th}>Actor</th>
                  <th style={styles.th}>Action</th>
                  <th style={styles.th}>Resource</th>
                  <th style={styles.th}>Status</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    style={styles.tableRow}
                  >
                    <td style={styles.td}>
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td style={styles.td}>
                      <div style={styles.severityBadge}>
                        {getSeverityIcon(log.severity)}
                        <span style={{ marginLeft: '6px' }}>{log.severity}</span>
                      </div>
                    </td>
                    <td style={styles.td}>
                      <div style={styles.categoryBadge}>
                        {getCategoryIcon(log.category)}
                        <span style={{ marginLeft: '6px' }}>{log.category}</span>
                      </div>
                    </td>
                    <td style={styles.td}>
                      <div>
                        <div style={{ fontWeight: 'bold' }}>{log.actor.email || log.actor.id}</div>
                        <div style={{ fontSize: '12px', color: '#888' }}>{log.actor.role}</div>
                      </div>
                    </td>
                    <td style={styles.td}>{log.action}</td>
                    <td style={styles.td}>
                      <div>
                        <div>{log.resourceType}</div>
                        {log.resourceId && (
                          <div style={{ fontSize: '12px', color: '#888' }}>{log.resourceId}</div>
                        )}
                      </div>
                    </td>
                    <td style={styles.td}>
                      {log.success ? (
                        <span style={{ color: '#00ff88' }}>✓ Success</span>
                      ) : (
                        <span style={{ color: '#ff4422' }}>✗ Failed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            <div style={styles.pagination}>
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                style={styles.paginationButton}
              >
                Previous
              </button>
              <span style={styles.paginationInfo}>
                Page {page} of {Math.ceil(total / limit)} ({total} total)
              </span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page >= Math.ceil(total / limit)}
                style={styles.paginationButton}
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>

      {/* Log Detail Modal */}
      {selectedLog && (
        <div style={styles.modal} onClick={() => setSelectedLog(null)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={{ margin: 0 }}>Log Details</h2>
              <button onClick={() => setSelectedLog(null)} style={styles.closeButton}>
                ✕
              </button>
            </div>
            <div style={styles.modalBody}>
              <div style={styles.detailRow}>
                <strong>ID:</strong> {selectedLog.id}
              </div>
              <div style={styles.detailRow}>
                <strong>Timestamp:</strong> {new Date(selectedLog.timestamp).toLocaleString()}
              </div>
              <div style={styles.detailRow}>
                <strong>Severity:</strong>
                <span
                  style={{
                    ...styles.badge,
                    backgroundColor: getSeverityColor(selectedLog.severity) + '20',
                    color: getSeverityColor(selectedLog.severity),
                  }}
                >
                  {selectedLog.severity}
                </span>
              </div>
              <div style={styles.detailRow}>
                <strong>Category:</strong> {selectedLog.category}
              </div>
              <div style={styles.detailRow}>
                <strong>Actor:</strong>
                <div>
                  <div>{selectedLog.actor.email || selectedLog.actor.id}</div>
                  <div style={{ fontSize: '12px', color: '#888' }}>
                    Role: {selectedLog.actor.role}
                  </div>
                  {selectedLog.actor.ip && (
                    <div style={{ fontSize: '12px', color: '#888' }}>IP: {selectedLog.actor.ip}</div>
                  )}
                </div>
              </div>
              <div style={styles.detailRow}>
                <strong>Action:</strong> {selectedLog.action}
              </div>
              <div style={styles.detailRow}>
                <strong>Resource:</strong> {selectedLog.resourceType}
                {selectedLog.resourceId && ` (${selectedLog.resourceId})`}
              </div>
              <div style={styles.detailRow}>
                <strong>Status:</strong>
                {selectedLog.success ? (
                  <span style={{ color: '#00ff88' }}>✓ Success</span>
                ) : (
                  <span style={{ color: '#ff4422' }}>✗ Failed</span>
                )}
              </div>
              {selectedLog.duration && (
                <div style={styles.detailRow}>
                  <strong>Duration:</strong> {selectedLog.duration}ms
                </div>
              )}
              {selectedLog.error && (
                <div style={styles.detailRow}>
                  <strong>Error:</strong>
                  <span style={{ color: '#ff4422' }}>{selectedLog.error}</span>
                </div>
              )}
              {selectedLog.changes && (
                <div style={styles.detailRow}>
                  <strong>Changes:</strong>
                  <pre style={styles.jsonPre}>
                    {JSON.stringify(selectedLog.changes, null, 2)}
                  </pre>
                </div>
              )}
              {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                <div style={styles.detailRow}>
                  <strong>Metadata:</strong>
                  <pre style={styles.jsonPre}>
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
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
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
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
  exportButton: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 24px',
    backgroundColor: '#00ff88',
    color: '#000',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '24px',
  },
  statCard: {
    backgroundColor: '#1a1a1a',
    padding: '20px',
    borderRadius: '12px',
    border: '1px solid #333',
    textAlign: 'center',
  },
  statValue: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#00ff88',
    marginBottom: '8px',
  },
  statLabel: {
    fontSize: '14px',
    color: '#888',
  },
  filterPanel: {
    backgroundColor: '#1a1a1a',
    padding: '20px',
    borderRadius: '12px',
    border: '1px solid #333',
    marginBottom: '24px',
  },
  filterHeader: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '16px',
    fontSize: '18px',
  },
  filterGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
  },
  filterGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  filterLabel: {
    fontSize: '14px',
    color: '#888',
  },
  searchBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#0a0a0a',
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #333',
  },
  searchInput: {
    flex: 1,
    backgroundColor: 'transparent',
    border: 'none',
    color: '#fff',
    fontSize: '14px',
    outline: 'none',
  },
  filterInput: {
    padding: '12px',
    backgroundColor: '#0a0a0a',
    border: '1px solid #333',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '14px',
  },
  applyButton: {
    padding: '12px 24px',
    backgroundColor: '#00ff88',
    color: '#000',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  tableContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: '12px',
    border: '1px solid #333',
    overflow: 'hidden',
  },
  loading: {
    padding: '40px',
    textAlign: 'center',
    color: '#888',
  },
  empty: {
    padding: '40px',
    textAlign: 'center',
    color: '#888',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  tableHeader: {
    backgroundColor: '#0a0a0a',
  },
  th: {
    padding: '16px',
    textAlign: 'left',
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#888',
    borderBottom: '1px solid #333',
  },
  tableRow: {
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    borderBottom: '1px solid #222',
  },
  td: {
    padding: '16px',
    fontSize: '14px',
  },
  severityBadge: {
    display: 'flex',
    alignItems: 'center',
  },
  categoryBadge: {
    display: 'flex',
    alignItems: 'center',
  },
  pagination: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px',
    backgroundColor: '#0a0a0a',
  },
  paginationButton: {
    padding: '8px 16px',
    backgroundColor: '#2a2a2a',
    color: '#fff',
    border: '1px solid #444',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  paginationInfo: {
    color: '#888',
    fontSize: '14px',
  },
  modal: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: '12px',
    border: '1px solid #333',
    maxWidth: '800px',
    width: '90%',
    maxHeight: '80vh',
    overflow: 'auto',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px',
    borderBottom: '1px solid #333',
  },
  closeButton: {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#fff',
    fontSize: '24px',
    cursor: 'pointer',
  },
  modalBody: {
    padding: '20px',
  },
  detailRow: {
    marginBottom: '16px',
    display: 'flex',
    gap: '12px',
  },
  badge: {
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 'bold',
  },
  jsonPre: {
    backgroundColor: '#0a0a0a',
    padding: '12px',
    borderRadius: '8px',
    fontSize: '12px',
    overflow: 'auto',
    flex: 1,
    marginTop: '8px',
  },
};

export default AuditLogs;

