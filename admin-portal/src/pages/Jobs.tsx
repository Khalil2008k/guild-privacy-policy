import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Briefcase } from 'lucide-react';

const JobsPage: React.FC = () => {
  const { theme } = useTheme();

  return (
    <div style={{ textAlign: 'center', padding: '48px' }}>
      <Briefcase size={64} color={theme.primary} style={{ marginBottom: '24px' }} />
      <h1 style={{ color: theme.textPrimary, marginBottom: '16px' }}>Jobs Management</h1>
      <p style={{ color: theme.textSecondary }}>Manage and monitor all platform jobs</p>
    </div>
  );
};

export default JobsPage;

