import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { 
  DollarSign, 
  Shield, 
  Globe, 
  Save,
  RefreshCw
} from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { handleError } from '../utils/errorHandler';
import { validateNumberRange } from '../utils/validation';
import { cache } from '../utils/cache';

interface PlatformSettings {
  platformFees: {
    clientFee: number;
    freelancerFee: number;
    zakat: number;
  };
  paymentSettings: {
    minWithdrawal: number;
    maxTransaction: number;
    currency: string;
  };
  platformSettings: {
    jobApprovalRequired: boolean;
    userVerificationRequired: boolean;
    maintenanceMode: boolean;
  };
}

const SettingsPage: React.FC = () => {
  const { theme, toggleTheme, isDarkMode } = useTheme();
  const [settings, setSettings] = useState<PlatformSettings>({
    platformFees: {
      clientFee: 5,
      freelancerFee: 10,
      zakat: 2.5
    },
    paymentSettings: {
      minWithdrawal: 100,
      maxTransaction: 50000,
      currency: 'QAR'
    },
    platformSettings: {
      jobApprovalRequired: true,
      userVerificationRequired: true,
      maintenanceMode: false
    }
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      
      // Try cache first
      const cachedSettings = cache.get<PlatformSettings>('settings:platform');
      if (cachedSettings) {
        console.log('📦 Loading settings from cache');
        setSettings(cachedSettings);
        setLoading(false);
        return;
      }
      
      const settingsDoc = await getDoc(doc(db, 'systemSettings', 'platform'));
      if (settingsDoc.exists()) {
        const loadedSettings = { ...settings, ...settingsDoc.data() } as PlatformSettings;
        setSettings(loadedSettings);
        // Cache for 10 minutes
        cache.set('settings:platform', loadedSettings, 10 * 60 * 1000);
      }
    } catch (error) {
      const errorResponse = handleError(error, 'Settings Loading');
      console.error('Error loading settings:', errorResponse.message);
      alert(`⚠️ Error loading settings: ${errorResponse.message}`);
    } finally {
      setLoading(false);
    }
  };

  const validateSettings = (): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    // Validate platform fees
    const clientFeeValidation = validateNumberRange(settings.platformFees.clientFee, 0, 100, 'Client fee');
    if (!clientFeeValidation.isValid) errors.push(...clientFeeValidation.errors);

    const freelancerFeeValidation = validateNumberRange(settings.platformFees.freelancerFee, 0, 100, 'Freelancer fee');
    if (!freelancerFeeValidation.isValid) errors.push(...freelancerFeeValidation.errors);

    const zakatValidation = validateNumberRange(settings.platformFees.zakat, 0, 100, 'Zakat');
    if (!zakatValidation.isValid) errors.push(...zakatValidation.errors);

    // Validate payment settings
    if (settings.paymentSettings.minWithdrawal < 0) {
      errors.push('Minimum withdrawal must be positive');
    }

    if (settings.paymentSettings.maxTransaction < settings.paymentSettings.minWithdrawal) {
      errors.push('Maximum transaction must be greater than minimum withdrawal');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  };

  const saveSettings = async () => {
    // Validate before saving
    const validation = validateSettings();
    if (!validation.isValid) {
      alert(`❌ Validation errors:\n${validation.errors.join('\n')}`);
      return;
    }

    try {
      setSaving(true);
      await setDoc(doc(db, 'systemSettings', 'platform'), {
        ...settings,
        updatedAt: new Date(),
        updatedBy: 'admin' // Would be actual admin user
      });
      
      // Invalidate cache
      cache.delete('settings:platform');
      
      alert('✅ Settings saved successfully!');
    } catch (error) {
      const errorResponse = handleError(error, 'Settings Saving');
      console.error('Error saving settings:', errorResponse.message);
      alert(`❌ Error saving settings: ${errorResponse.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh' }} role="status" aria-live="polite">
        <div className="spinner" aria-label="Loading settings"></div>
      </div>
    );
  }

  return (
    <div className="settings-page" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      {/* Page Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start',
        marginBottom: '32px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <h1 style={{ color: theme.textPrimary, fontSize: '32px', fontWeight: '700', marginBottom: '8px' }}>
            System Settings
          </h1>
          <p style={{ color: theme.textSecondary, fontSize: '16px' }}>
            Configure platform settings and preferences
          </p>
        </div>
        
        <button
          onClick={saveSettings}
          disabled={saving}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 24px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: theme.primary,
            color: '#000000',
            fontSize: '14px',
            fontWeight: '600',
            cursor: saving ? 'not-allowed' : 'pointer',
            opacity: saving ? 0.7 : 1,
            minWidth: '140px',
            justifyContent: 'center'
          }}
        >
          {saving ? <RefreshCw size={16} /> : <Save size={16} />}
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      {/* Settings Sections */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        
        {/* Platform Fees */}
        <div style={{ backgroundColor: theme.surface, padding: '24px', borderRadius: '12px', border: `1px solid ${theme.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <DollarSign size={24} color={theme.primary} />
            <h3 style={{ color: theme.textPrimary, margin: 0 }}>Platform Fees</h3>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div>
              <label style={{ color: theme.textSecondary, fontSize: '14px', marginBottom: '8px', display: 'block' }}>
                Client Fee (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={settings.platformFees.clientFee}
                onChange={(e) => setSettings({
                  ...settings,
                  platformFees: { ...settings.platformFees, clientFee: parseFloat(e.target.value) || 0 }
                })}
                aria-label="Client Fee Percentage"
                aria-required="true"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: `2px solid ${theme.border}`,
                  backgroundColor: theme.inputBackground,
                  color: theme.textPrimary,
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'border-color 0.2s ease'
                }}
                onFocus={(e) => e.target.style.borderColor = theme.primary}
                onBlur={(e) => e.target.style.borderColor = theme.border}
              />
            </div>
            
            <div>
              <label style={{ color: theme.textSecondary, fontSize: '14px', marginBottom: '8px', display: 'block' }}>
                Freelancer Fee (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={settings.platformFees.freelancerFee}
                onChange={(e) => setSettings({
                  ...settings,
                  platformFees: { ...settings.platformFees, freelancerFee: parseFloat(e.target.value) || 0 }
                })}
                aria-label="Freelancer Fee Percentage"
                aria-required="true"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: `2px solid ${theme.border}`,
                  backgroundColor: theme.inputBackground,
                  color: theme.textPrimary,
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'border-color 0.2s ease'
                }}
                onFocus={(e) => e.target.style.borderColor = theme.primary}
                onBlur={(e) => e.target.style.borderColor = theme.border}
              />
            </div>
            
            <div>
              <label style={{ color: theme.textSecondary, fontSize: '14px', marginBottom: '8px', display: 'block' }}>
                Zakat (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={settings.platformFees.zakat}
                onChange={(e) => setSettings({
                  ...settings,
                  platformFees: { ...settings.platformFees, zakat: parseFloat(e.target.value) || 0 }
                })}
                aria-label="Zakat Percentage"
                aria-required="true"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: `2px solid ${theme.border}`,
                  backgroundColor: theme.inputBackground,
                  color: theme.textPrimary,
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'border-color 0.2s ease'
                }}
                onFocus={(e) => e.target.style.borderColor = theme.primary}
                onBlur={(e) => e.target.style.borderColor = theme.border}
              />
            </div>
          </div>
        </div>

        {/* Platform Controls */}
        <div style={{ backgroundColor: theme.surface, padding: '24px', borderRadius: '12px', border: `1px solid ${theme.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <Shield size={24} color={theme.primary} />
            <h3 style={{ color: theme.textPrimary, margin: 0 }}>Platform Controls</h3>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={settings.platformSettings.jobApprovalRequired}
                onChange={(e) => setSettings({
                  ...settings,
                  platformSettings: { ...settings.platformSettings, jobApprovalRequired: e.target.checked }
                })}
                style={{ width: '18px', height: '18px' }}
              />
              <span style={{ color: theme.textPrimary }}>Require admin approval for all job postings</span>
            </label>
            
            <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={settings.platformSettings.userVerificationRequired}
                onChange={(e) => setSettings({
                  ...settings,
                  platformSettings: { ...settings.platformSettings, userVerificationRequired: e.target.checked }
                })}
                style={{ width: '18px', height: '18px' }}
              />
              <span style={{ color: theme.textPrimary }}>Require identity verification for all users</span>
            </label>
            
            <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={settings.platformSettings.maintenanceMode}
                onChange={(e) => setSettings({
                  ...settings,
                  platformSettings: { ...settings.platformSettings, maintenanceMode: e.target.checked }
                })}
                style={{ width: '18px', height: '18px' }}
              />
              <span style={{ color: theme.textPrimary }}>Enable maintenance mode</span>
            </label>
          </div>
        </div>

        {/* Theme Settings */}
        <div style={{ backgroundColor: theme.surface, padding: '24px', borderRadius: '12px', border: `1px solid ${theme.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <Globe size={24} color={theme.primary} />
            <h3 style={{ color: theme.textPrimary, margin: 0 }}>Interface Settings</h3>
          </div>
          
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={isDarkMode}
                onChange={toggleTheme}
                style={{ width: '18px', height: '18px' }}
              />
              <span style={{ color: theme.textPrimary }}>Dark Mode</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;

