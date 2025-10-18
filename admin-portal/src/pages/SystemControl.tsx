import React, { useState } from 'react';
import {
  Trash2,
  Database,
  Archive,
  AlertOctagon,
  Power,
  Shield,
  Settings,
  Download,
  RefreshCw,
  CheckCircle,
  XCircle,
} from 'lucide-react';

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

interface SystemAction {
  id: string;
  action: string;
  performedBy: string;
  timestamp: Date;
  status: 'success' | 'failed' | 'in_progress';
  result?: any;
  error?: string;
  duration?: number;
}

interface MaintenanceStatus {
  enabled: boolean;
  message: string;
  scheduledEnd?: Date;
  allowedIPs?: string[];
  affectedServices: string[];
}

const SystemControl: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [actionResult, setActionResult] = useState<SystemAction | null>(null);
  const [maintenanceStatus, setMaintenanceStatus] = useState<MaintenanceStatus | null>(null);
  const [maintenanceMessage, setMaintenanceMessage] = useState('');
  const [ipToBlock, setIpToBlock] = useState('');
  const [blockReason, setBlockReason] = useState('');
  const [exportUserId, setExportUserId] = useState('');

  const executeAction = async (endpoint: string, body?: any) => {
    setLoading(true);
    setActionResult(null);

    try {
      const response = await fetch(`${API_BASE}/admin-system/control/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      const data = await response.json();

      if (data.success) {
        setActionResult(data.data);
        alert('Action completed successfully!');
      } else {
        alert(`Action failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Error executing action:', error);
      alert('Failed to execute action');
    } finally {
      setLoading(false);
    }
  };

  const getMaintenanceStatus = async () => {
    try {
      const response = await fetch(`${API_BASE}/admin-system/control/maintenance-status`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setMaintenanceStatus(data.data);
      }
    } catch (error) {
      console.error('Error fetching maintenance status:', error);
    }
  };

  React.useEffect(() => {
    getMaintenanceStatus();
  }, []);

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>
          <Settings size={32} style={{ marginRight: '12px' }} />
          System Control
        </h1>
        <p style={styles.subtitle}>Advanced system management and control actions</p>
      </div>

      {/* Maintenance Status */}
      {maintenanceStatus && (
        <div
          style={{
            ...styles.statusBanner,
            backgroundColor: maintenanceStatus.enabled ? '#ff442220' : '#00ff8820',
            border: `1px solid ${maintenanceStatus.enabled ? '#ff4422' : '#00ff88'}`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {maintenanceStatus.enabled ? (
              <AlertOctagon size={24} color="#ff4422" />
            ) : (
              <CheckCircle size={24} color="#00ff88" />
            )}
            <div>
              <h3 style={{ margin: 0 }}>
                {maintenanceStatus.enabled ? 'Maintenance Mode Active' : 'System Operational'}
              </h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#ccc' }}>
                {maintenanceStatus.message}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Action Result */}
      {actionResult && (
        <div style={styles.resultCard}>
          <div style={styles.cardHeader}>
            {actionResult.status === 'success' ? (
              <CheckCircle size={24} color="#00ff88" />
            ) : (
              <XCircle size={24} color="#ff4422" />
            )}
            <h3 style={styles.cardTitle}>Action Result</h3>
          </div>
          <div style={styles.resultContent}>
            <div style={styles.resultRow}>
              <span style={styles.resultLabel}>Action:</span>
              <span>{actionResult.action}</span>
            </div>
            <div style={styles.resultRow}>
              <span style={styles.resultLabel}>Status:</span>
              <span
                style={{
                  color: actionResult.status === 'success' ? '#00ff88' : '#ff4422',
                  fontWeight: 'bold',
                }}
              >
                {actionResult.status.toUpperCase()}
              </span>
            </div>
            {actionResult.duration && (
              <div style={styles.resultRow}>
                <span style={styles.resultLabel}>Duration:</span>
                <span>{actionResult.duration}ms</span>
              </div>
            )}
            {actionResult.result && (
              <div style={styles.resultRow}>
                <span style={styles.resultLabel}>Result:</span>
                <pre style={styles.resultPre}>{JSON.stringify(actionResult.result, null, 2)}</pre>
              </div>
            )}
            {actionResult.error && (
              <div style={styles.resultRow}>
                <span style={styles.resultLabel}>Error:</span>
                <span style={{ color: '#ff4422' }}>{actionResult.error}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Control Grid */}
      <div style={styles.grid}>
        {/* Cache Management */}
        <div style={styles.controlCard}>
          <div style={styles.cardHeader}>
            <Trash2 size={24} color="#00ff88" />
            <h3 style={styles.cardTitle}>Cache Management</h3>
          </div>
          <p style={styles.cardDescription}>Clear Redis cache to free memory and force data refresh</p>
          <div style={styles.buttonGroup}>
            <button
              onClick={() => executeAction('clear-cache', { pattern: '*' })}
              disabled={loading}
              style={styles.primaryButton}
            >
              Clear All Cache
            </button>
            <button
              onClick={() => executeAction('clear-cache', { pattern: 'user:*' })}
              disabled={loading}
              style={styles.secondaryButton}
            >
              Clear User Cache
            </button>
          </div>
        </div>

        {/* Database Optimization */}
        <div style={styles.controlCard}>
          <div style={styles.cardHeader}>
            <Database size={24} color="#00ff88" />
            <h3 style={styles.cardTitle}>Database Optimization</h3>
          </div>
          <p style={styles.cardDescription}>
            Clean expired sessions, old verification codes, and optimize indexes
          </p>
          <button
            onClick={() => executeAction('optimize-database')}
            disabled={loading}
            style={styles.primaryButton}
          >
            Optimize Database
          </button>
        </div>

        {/* System Backup */}
        <div style={styles.controlCard}>
          <div style={styles.cardHeader}>
            <Archive size={24} color="#00ff88" />
            <h3 style={styles.cardTitle}>System Backup</h3>
          </div>
          <p style={styles.cardDescription}>Create a complete backup of all Firestore collections</p>
          <button
            onClick={() => executeAction('create-backup')}
            disabled={loading}
            style={styles.primaryButton}
          >
            Create Backup
          </button>
        </div>

        {/* Maintenance Mode */}
        <div style={styles.controlCard}>
          <div style={styles.cardHeader}>
            <AlertOctagon size={24} color="#ffaa00" />
            <h3 style={styles.cardTitle}>Maintenance Mode</h3>
          </div>
          <p style={styles.cardDescription}>
            Enable maintenance mode to prevent user access during updates
          </p>
          <input
            type="text"
            placeholder="Maintenance message"
            value={maintenanceMessage}
            onChange={(e) => setMaintenanceMessage(e.target.value)}
            style={styles.input}
          />
          <div style={styles.buttonGroup}>
            <button
              onClick={() =>
                executeAction('maintenance-mode', {
                  enabled: true,
                  message: maintenanceMessage || 'System under maintenance',
                })
              }
              disabled={loading}
              style={styles.warningButton}
            >
              Enable
            </button>
            <button
              onClick={() => executeAction('maintenance-mode', { enabled: false })}
              disabled={loading}
              style={styles.successButton}
            >
              Disable
            </button>
          </div>
        </div>

        {/* Service Restart */}
        <div style={styles.controlCard}>
          <div style={styles.cardHeader}>
            <RefreshCw size={24} color="#00ff88" />
            <h3 style={styles.cardTitle}>Restart Services</h3>
          </div>
          <p style={styles.cardDescription}>Restart specific services or all services</p>
          <div style={styles.buttonGroup}>
            <button
              onClick={() => executeAction('restart-services', { services: ['all'] })}
              disabled={loading}
              style={styles.warningButton}
            >
              Restart All
            </button>
            <button
              onClick={() => executeAction('restart-services', { services: ['redis'] })}
              disabled={loading}
              style={styles.secondaryButton}
            >
              Restart Redis
            </button>
          </div>
        </div>

        {/* Emergency Shutdown */}
        <div style={styles.controlCard}>
          <div style={styles.cardHeader}>
            <Power size={24} color="#ff4422" />
            <h3 style={styles.cardTitle}>Emergency Shutdown</h3>
          </div>
          <p style={styles.cardDescription}>
            Immediately shut down all services in case of emergency
          </p>
          <button
            onClick={() => {
              if (
                confirm(
                  'Are you sure? This will shut down all services and enable maintenance mode!'
                )
              ) {
                executeAction('emergency-shutdown', {
                  reason: 'Admin initiated emergency shutdown',
                });
              }
            }}
            disabled={loading}
            style={styles.dangerButton}
          >
            Emergency Shutdown
          </button>
        </div>

        {/* IP Blocking */}
        <div style={styles.controlCard}>
          <div style={styles.cardHeader}>
            <Shield size={24} color="#00ff88" />
            <h3 style={styles.cardTitle}>IP Management</h3>
          </div>
          <p style={styles.cardDescription}>Block or unblock IP addresses</p>
          <input
            type="text"
            placeholder="IP Address (e.g., 192.168.1.1)"
            value={ipToBlock}
            onChange={(e) => setIpToBlock(e.target.value)}
            style={styles.input}
          />
          <input
            type="text"
            placeholder="Reason for blocking"
            value={blockReason}
            onChange={(e) => setBlockReason(e.target.value)}
            style={styles.input}
          />
          <div style={styles.buttonGroup}>
            <button
              onClick={() =>
                executeAction('block-ip', {
                  ip: ipToBlock,
                  reason: blockReason,
                  duration: 3600, // 1 hour
                })
              }
              disabled={loading || !ipToBlock}
              style={styles.warningButton}
            >
              Block IP
            </button>
            <button
              onClick={() => executeAction('unblock-ip', { ip: ipToBlock })}
              disabled={loading || !ipToBlock}
              style={styles.successButton}
            >
              Unblock IP
            </button>
          </div>
        </div>

        {/* User Data Export (GDPR) */}
        <div style={styles.controlCard}>
          <div style={styles.cardHeader}>
            <Download size={24} color="#00ff88" />
            <h3 style={styles.cardTitle}>User Data Export (GDPR)</h3>
          </div>
          <p style={styles.cardDescription}>Export complete user data for GDPR compliance</p>
          <input
            type="text"
            placeholder="User ID"
            value={exportUserId}
            onChange={(e) => setExportUserId(e.target.value)}
            style={styles.input}
          />
          <div style={styles.buttonGroup}>
            <button
              onClick={() => executeAction('export-user-data', { userId: exportUserId, format: 'json' })}
              disabled={loading || !exportUserId}
              style={styles.primaryButton}
            >
              Export JSON
            </button>
            <button
              onClick={() => executeAction('export-user-data', { userId: exportUserId, format: 'csv' })}
              disabled={loading || !exportUserId}
              style={styles.secondaryButton}
            >
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Loading Indicator */}
      {loading && (
        <div style={styles.loadingOverlay}>
          <div style={styles.loadingSpinner}>
            <RefreshCw size={48} color="#00ff88" style={{ animation: 'spin 1s linear infinite' }} />
            <p style={{ marginTop: '16px', color: '#00ff88' }}>Executing action...</p>
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
    marginBottom: '32px',
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
  statusBanner: {
    padding: '16px',
    borderRadius: '12px',
    marginBottom: '24px',
  },
  resultCard: {
    backgroundColor: '#1a1a1a',
    padding: '24px',
    borderRadius: '12px',
    border: '1px solid #333',
    marginBottom: '24px',
  },
  resultContent: {
    marginTop: '16px',
  },
  resultRow: {
    display: 'flex',
    marginBottom: '12px',
    gap: '12px',
  },
  resultLabel: {
    fontWeight: 'bold',
    color: '#888',
    minWidth: '100px',
  },
  resultPre: {
    backgroundColor: '#0a0a0a',
    padding: '12px',
    borderRadius: '8px',
    fontSize: '12px',
    overflow: 'auto',
    flex: 1,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
    gap: '24px',
  },
  controlCard: {
    backgroundColor: '#1a1a1a',
    padding: '24px',
    borderRadius: '12px',
    border: '1px solid #333',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '12px',
  },
  cardTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    margin: 0,
    marginLeft: '12px',
  },
  cardDescription: {
    fontSize: '14px',
    color: '#888',
    marginBottom: '16px',
    lineHeight: '1.5',
  },
  input: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#0a0a0a',
    border: '1px solid #333',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '14px',
    marginBottom: '12px',
  },
  buttonGroup: {
    display: 'flex',
    gap: '8px',
  },
  primaryButton: {
    flex: 1,
    padding: '12px 24px',
    backgroundColor: '#00ff88',
    color: '#000',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.3s',
  },
  secondaryButton: {
    flex: 1,
    padding: '12px 24px',
    backgroundColor: '#2a2a2a',
    color: '#fff',
    border: '1px solid #444',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.3s',
  },
  warningButton: {
    flex: 1,
    padding: '12px 24px',
    backgroundColor: '#ffaa0020',
    color: '#ffaa00',
    border: '1px solid #ffaa00',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.3s',
  },
  successButton: {
    flex: 1,
    padding: '12px 24px',
    backgroundColor: '#00ff8820',
    color: '#00ff88',
    border: '1px solid #00ff88',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.3s',
  },
  dangerButton: {
    width: '100%',
    padding: '12px 24px',
    backgroundColor: '#ff442220',
    color: '#ff4422',
    border: '1px solid #ff4422',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.3s',
  },
  loadingOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  loadingSpinner: {
    textAlign: 'center',
  },
};

export default SystemControl;

