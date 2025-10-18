/**
 * Demo Mode Indicator Component
 * Visual indicator when admin portal is in demo mode
 */

import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { demoDataService } from '../services/demoDataService';
import { FlaskConical, X } from 'lucide-react';
import './DemoModeIndicator.css';

interface DemoModeIndicatorProps {
  onDisable?: () => void;
}

const DemoModeIndicator: React.FC<DemoModeIndicatorProps> = ({ onDisable }) => {
  const { theme } = useTheme();
  const [isDemoMode, setIsDemoMode] = React.useState(demoDataService.isDemoModeActive());

  if (!isDemoMode) {
    return null;
  }

  const handleDisable = () => {
    demoDataService.disableDemoMode();
    setIsDemoMode(false);
    if (onDisable) {
      onDisable();
    }
    window.location.reload(); // Reload to show real data
  };

  return (
    <div 
      className="demo-mode-indicator"
      style={{
        backgroundColor: theme.warning + '20',
        borderColor: theme.warning,
        color: theme.warning
      }}
    >
      <div className="demo-indicator-content">
        <FlaskConical size={18} />
        <span className="demo-indicator-text">
          DEMO MODE ACTIVE - Using sample data for demonstration
        </span>
      </div>
      <button
        className="demo-indicator-close"
        onClick={handleDisable}
        style={{ color: theme.warning }}
        title="Disable demo mode"
      >
        <X size={16} />
      </button>
    </div>
  );
};

export default DemoModeIndicator;

