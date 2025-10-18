/**
 * Demo Mode Controller - Simplified
 * Simple switch between Demo Mode and Production Mode
 * Uses Fatora PSP for production payments
 */

import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { 
  Shield, 
  Power,
  Users,
  Briefcase,
  TrendingUp,
  RefreshCw,
  Download,
  Upload,
  Trash2,
  TestTube,
  Eye,
  DollarSign,
  CreditCard,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { demoDataService } from '../services/demoDataService';
import './DemoModeController.css';

const DemoModeController: React.FC = () => {
  const { theme } = useTheme();
  
  // State management
  const [isDemoMode, setIsDemoMode] = useState(demoDataService.isDemoModeActive());
  const [loading, setLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);

  // Demo stats
  const [demoStats, setDemoStats] = useState({
    totalUsers: 156,
    totalJobs: 89,
    totalGuilds: 23,
    totalTransactions: 15
  });

  useEffect(() => {
    loadDemoStats();
  }, []);

  const loadDemoStats = () => {
    const users = demoDataService.getDemoUsers();
    const jobs = demoDataService.getDemoJobs();
    const guilds = demoDataService.getDemoGuilds();
    const transactions = demoDataService.getDemoTransactions();

    setDemoStats({
      totalUsers: users.length,
      totalJobs: jobs.length,
      totalGuilds: guilds.length,
      totalTransactions: transactions.length
    });
  };

  const handleToggleDemoMode = async (enabled: boolean) => {
    try {
      setLoading(true);

      if (enabled) {
        // Enable Demo Mode
        const confirmed = window.confirm(
          '🧪 Enable Demo Mode?\n\n' +
          '✅ Use realistic test data\n' +
          '✅ Safe testing environment\n' +
          '✅ No real transactions\n' +
          '✅ Virtual Guild Coins\n\n' +
          'Continue?'
        );

        if (!confirmed) {
          setLoading(false);
          return;
        }

        demoDataService.enableDemoMode();
        setIsDemoMode(true);
        
        alert('✅ Demo mode enabled!\n\nYou can now test with realistic data without affecting production.');

      } else {
        // Enable Production Mode
        const confirmed = window.confirm(
          '💰 Switch to Production Mode?\n\n' +
          '⚠️ This will enable:\n' +
          '• Real user data\n' +
          '• Real money transactions via Fatora\n' +
          '• Live payment processing\n' +
          '• Actual database operations\n\n' +
          '✅ Fatora PSP will be used for payments\n\n' +
          'Continue?'
        );

        if (!confirmed) {
          setLoading(false);
          return;
        }

        demoDataService.disableDemoMode();
        setIsDemoMode(false);
        
        alert('✅ Production mode activated!\n\nReal transactions enabled via Fatora PSP.');
      }

      // Reload page to reflect changes
      setTimeout(() => {
        window.location.reload();
      }, 1000);

    } catch (error) {
      console.error('Error toggling demo mode:', error);
      alert('❌ Failed to toggle demo mode. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSeedDemoData = async () => {
    const confirmed = window.confirm(
      '📊 Seed Demo Data?\n\n' +
      'This will populate the portal with:\n' +
      '• 156 Qatar-based demo users\n' +
      '• 89 realistic job postings\n' +
      '• 23 professional guilds\n' +
      '• 15 demo transactions\n\n' +
      'All data will be marked as demo.\n\n' +
      'Continue?'
    );

    if (!confirmed) return;

    try {
      setSeeding(true);
      // Demo data is automatically available
      loadDemoStats();
      alert('✅ Demo data is ready!\n\nNavigate to Dashboard, Users, Jobs, or Guilds to see the data.');
    } catch (error) {
      console.error('Error seeding demo data:', error);
      alert('❌ Failed to seed demo data. Please try again.');
    } finally {
      setSeeding(false);
    }
  };

  const handleClearDemoData = async () => {
    const confirmed = window.confirm(
      '🗑️ Clear Demo Mode?\n\n' +
      '⚠️ This will:\n' +
      '• Disable demo mode\n' +
      '• Switch to production data\n' +
      '• Enable Fatora payments\n\n' +
      'Real user data will NOT be affected.\n\n' +
      'Continue?'
    );

    if (!confirmed) return;

    try {
      setSeeding(true);
      demoDataService.disableDemoMode();
      setIsDemoMode(false);
      alert('✅ Demo mode cleared!\n\nSwitching to production mode...');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error('Error clearing demo data:', error);
      alert('❌ Failed to clear demo data. Please try again.');
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <Shield size={32} color={theme.primary} />
          <h1 style={{ color: theme.textPrimary, margin: 0, fontSize: '32px', fontWeight: '700' }}>
            Demo Mode Controller
          </h1>
        </div>
        <p style={{ color: theme.textSecondary, margin: 0, fontSize: '16px' }}>
          Switch between Demo Mode (test data) and Production Mode (Fatora payments)
        </p>
      </div>

      {/* Main Mode Toggle */}
      <div style={{
        backgroundColor: isDemoMode ? theme.warning + '20' : theme.success + '20',
        border: `2px solid ${isDemoMode ? theme.warning : theme.success}`,
        borderRadius: '12px',
        padding: '32px',
        marginBottom: '32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '24px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flex: 1 }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: isDemoMode ? theme.warning + '30' : theme.success + '30',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {isDemoMode ? (
              <TestTube size={32} color={theme.warning} />
            ) : (
              <CreditCard size={32} color={theme.success} />
            )}
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ color: theme.textPrimary, margin: 0, marginBottom: '8px', fontSize: '24px', fontWeight: '700' }}>
              {isDemoMode ? '🧪 Demo Mode Active' : '💰 Production Mode Active'}
            </h2>
            <p style={{ color: theme.textSecondary, margin: 0, fontSize: '16px', lineHeight: '1.5' }}>
              {isDemoMode 
                ? 'Using realistic test data for safe testing. No real transactions or payments.' 
                : 'Live production mode with real data. Fatora PSP processes all payments.'}
            </p>
            <div style={{ 
              marginTop: '12px',
              padding: '8px 16px',
              borderRadius: '6px',
              backgroundColor: theme.background,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px',
              fontWeight: '600',
              color: theme.textPrimary
            }}>
              <DollarSign size={16} />
              {isDemoMode ? 'Virtual Transactions' : 'Real Fatora Payments'}
            </div>
          </div>
        </div>

        <button
          onClick={() => handleToggleDemoMode(!isDemoMode)}
          disabled={loading}
          style={{
            padding: '16px 32px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: isDemoMode ? theme.success : theme.warning,
            color: theme.buttonText,
            fontSize: '16px',
            fontWeight: '700',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            transition: 'all 0.2s',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
          }}
          onMouseEnter={(e) => {
            if (!loading) e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <Power size={20} />
          {loading ? 'Switching...' : (isDemoMode ? 'Switch to Production' : 'Switch to Demo')}
        </button>
      </div>

      {/* Info Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        
        {/* Demo Mode Info */}
        {isDemoMode && (
          <div style={{
            backgroundColor: theme.surface,
            borderRadius: '12px',
            padding: '24px',
            border: `1px solid ${theme.border}`
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <TestTube size={24} color={theme.warning} />
              <h3 style={{ color: theme.textPrimary, margin: 0, fontSize: '18px', fontWeight: '600' }}>
                Demo Mode Features
              </h3>
            </div>
            <ul style={{ color: theme.textSecondary, fontSize: '14px', lineHeight: '1.8', paddingLeft: '20px', margin: 0 }}>
              <li>Realistic Qatar-based test data</li>
              <li>Virtual Guild Coins transactions</li>
              <li>Safe testing environment</li>
              <li>No real payments processed</li>
              <li>Instant data population</li>
              <li>No external API calls</li>
            </ul>
          </div>
        )}

        {/* Production Mode Info */}
        {!isDemoMode && (
          <div style={{
            backgroundColor: theme.surface,
            borderRadius: '12px',
            padding: '24px',
            border: `1px solid ${theme.border}`
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <CreditCard size={24} color={theme.success} />
              <h3 style={{ color: theme.textPrimary, margin: 0, fontSize: '18px', fontWeight: '600' }}>
                Production Mode Features
              </h3>
            </div>
            <ul style={{ color: theme.textSecondary, fontSize: '14px', lineHeight: '1.8', paddingLeft: '20px', margin: 0 }}>
              <li>Real user data from Firebase</li>
              <li>Fatora PSP integration active</li>
              <li>Live payment processing (QAR)</li>
              <li>Real-time transaction tracking</li>
              <li>Actual database operations</li>
              <li>Production security rules</li>
            </ul>
          </div>
        )}

        {/* PSP Info */}
        <div style={{
          backgroundColor: theme.surface,
          borderRadius: '12px',
          padding: '24px',
          border: `1px solid ${theme.border}`
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <Shield size={24} color={theme.primary} />
            <h3 style={{ color: theme.textPrimary, margin: 0, fontSize: '18px', fontWeight: '600' }}>
              Fatora PSP
            </h3>
          </div>
          <div style={{ color: theme.textSecondary, fontSize: '14px', lineHeight: '1.6' }}>
            <div style={{ marginBottom: '12px' }}>
              <strong style={{ color: theme.textPrimary }}>Status:</strong>{' '}
              {isDemoMode ? (
                <span style={{ color: theme.warning }}>Inactive (Demo Mode)</span>
              ) : (
                <span style={{ color: theme.success }}>✅ Active & Ready</span>
              )}
            </div>
            <div style={{ marginBottom: '12px' }}>
              <strong style={{ color: theme.textPrimary }}>Provider:</strong> Fatora.io
            </div>
            <div style={{ marginBottom: '12px' }}>
              <strong style={{ color: theme.textPrimary }}>Currency:</strong> QAR (Qatari Riyal)
            </div>
            <div>
              <strong style={{ color: theme.textPrimary }}>Mode:</strong> {isDemoMode ? 'Virtual' : 'Production'}
            </div>
          </div>
        </div>
      </div>

      {/* Demo Stats */}
      {isDemoMode && (
        <div style={{
          backgroundColor: theme.surface,
          borderRadius: '12px',
          padding: '24px',
          border: `1px solid ${theme.border}`,
          marginBottom: '32px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <TrendingUp size={24} color={theme.primary} />
            <h3 style={{ color: theme.textPrimary, margin: 0, fontSize: '18px', fontWeight: '600' }}>
              Available Demo Data
            </h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            {[
              { label: 'Demo Users', value: demoStats.totalUsers, icon: Users, color: theme.primary },
              { label: 'Demo Jobs', value: demoStats.totalJobs, icon: Briefcase, color: theme.info },
              { label: 'Demo Guilds', value: demoStats.totalGuilds, icon: Shield, color: theme.secondary },
              { label: 'Demo Transactions', value: demoStats.totalTransactions, icon: DollarSign, color: theme.success }
            ].map((stat, idx) => (
              <div
                key={idx}
                style={{
                  backgroundColor: theme.background,
                  borderRadius: '10px',
                  padding: '20px',
                  border: `1px solid ${theme.border}`,
                  textAlign: 'center'
                }}
              >
                <div style={{
                  backgroundColor: stat.color + '20',
                  borderRadius: '50%',
                  width: '56px',
                  height: '56px',
                  margin: '0 auto 12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <stat.icon size={28} color={stat.color} />
                </div>
                <div style={{ color: theme.textPrimary, fontSize: '32px', fontWeight: '700', marginBottom: '4px' }}>
                  {stat.value}
                </div>
                <div style={{ color: theme.textSecondary, fontSize: '14px' }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Demo Data Actions */}
      {isDemoMode && (
        <div style={{
          backgroundColor: theme.surface,
          borderRadius: '12px',
          padding: '24px',
          border: `1px solid ${theme.border}`
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <Upload size={24} color={theme.primary} />
            <h3 style={{ color: theme.textPrimary, margin: 0, fontSize: '18px', fontWeight: '600' }}>
              Demo Data Management
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* View Demo Data */}
            <div style={{
              backgroundColor: theme.background,
              borderRadius: '10px',
              padding: '20px',
              border: `1px solid ${theme.border}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '16px'
            }}>
              <div style={{ flex: 1 }}>
                <h4 style={{ color: theme.textPrimary, fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
                  View Demo Data
                </h4>
                <p style={{ color: theme.textSecondary, fontSize: '14px', lineHeight: '1.6', margin: 0 }}>
                  Demo data is automatically available when demo mode is active. Navigate to Dashboard, Users, Jobs, or Guilds pages to see it.
                </p>
              </div>
              <button
                onClick={loadDemoStats}
                disabled={seeding}
                style={{
                  padding: '12px 24px',
                  borderRadius: '8px',
                  border: `1px solid ${theme.border}`,
                  backgroundColor: theme.background,
                  color: theme.textPrimary,
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: seeding ? 'not-allowed' : 'pointer',
                  opacity: seeding ? 0.7 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                {seeding ? <RefreshCw size={16} className="spin" /> : <Eye size={16} />}
                {seeding ? 'Loading...' : 'Refresh Stats'}
              </button>
            </div>

            {/* Clear Demo Mode */}
            <div style={{
              backgroundColor: theme.error + '08',
              borderRadius: '10px',
              padding: '20px',
              border: `1px solid ${theme.error + '30'}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '16px'
            }}>
              <div style={{ flex: 1 }}>
                <h4 style={{ color: theme.textPrimary, fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
                  Switch to Production
                </h4>
                <p style={{ color: theme.textSecondary, fontSize: '14px', lineHeight: '1.6', margin: 0 }}>
                  Disable demo mode and switch to production mode with Fatora payment processing.
                </p>
              </div>
              <button
                onClick={handleClearDemoData}
                disabled={seeding}
                style={{
                  padding: '12px 24px',
                  borderRadius: '8px',
                  border: `1px solid ${theme.error}`,
                  backgroundColor: theme.error + '20',
                  color: theme.error,
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: seeding ? 'not-allowed' : 'pointer',
                  opacity: seeding ? 0.7 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                {seeding ? <RefreshCw size={16} className="spin" /> : <Power size={16} />}
                {seeding ? 'Switching...' : 'Go Live'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Production Mode Notice */}
      {!isDemoMode && (
        <div style={{
          backgroundColor: theme.success + '10',
          border: `1px solid ${theme.success}`,
          borderRadius: '12px',
          padding: '24px',
          display: 'flex',
          gap: '16px',
          alignItems: 'flex-start'
        }}>
          <CheckCircle size={24} color={theme.success} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <h4 style={{ color: theme.textPrimary, fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
              Production Mode Active
            </h4>
            <p style={{ color: theme.textSecondary, fontSize: '14px', lineHeight: '1.6', margin: 0 }}>
              You're now using live production data. All payment transactions are processed through Fatora PSP in real-time. 
              User data comes directly from Firebase. Switch back to Demo Mode anytime for testing.
            </p>
          </div>
        </div>
      )}

      {/* CSS for spin animation */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default DemoModeController;
