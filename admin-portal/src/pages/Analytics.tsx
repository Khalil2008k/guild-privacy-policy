import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { BarChart3 } from 'lucide-react';

const AnalyticsPage: React.FC = () => {
  const { theme } = useTheme();

  return (
    <div style={{ textAlign: 'center', padding: '48px' }}>
      <BarChart3 size={64} color={theme.primary} style={{ marginBottom: '24px' }} />
      <h1 style={{ color: theme.textPrimary, marginBottom: '16px' }}>Analytics & Insights</h1>
      <p style={{ color: theme.textSecondary }}>Deep dive into platform analytics and user behavior</p>
    </div>
  );
};

export default AnalyticsPage;

