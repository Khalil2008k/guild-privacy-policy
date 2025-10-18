/**
 * Reusable Stat Card Component
 * Used across dashboard and other pages
 */

import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { MoreVertical } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number | string;
  growth?: number;
  icon: React.ComponentType<any>;
  color: string;
  onClick?: () => void;
  showMenu?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  growth, 
  icon: Icon, 
  color,
  onClick,
  showMenu = true
}) => {
  const { theme } = useTheme();

  return (
    <div 
      className="stat-card" 
      style={{ 
        backgroundColor: theme.surface,
        cursor: onClick ? 'pointer' : 'default'
      }}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={`${title}: ${value}`}
    >
      <div className="stat-header">
        <h3 style={{ color: theme.textSecondary }}>{title}</h3>
        {showMenu && (
          <button 
            className="stat-menu" 
            style={{ color: theme.textSecondary }}
            aria-label="More options"
          >
            <MoreVertical size={16} />
          </button>
        )}
      </div>
      
      <div className="stat-content">
        <div className="stat-value" style={{ color: theme.textPrimary }}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </div>
        {growth !== undefined && (
          <div 
            className="stat-growth" 
            style={{ 
              color: growth >= 0 ? theme.success : theme.error 
            }}
          >
            {growth >= 0 ? '↑' : '↓'} {Math.abs(growth)}%
          </div>
        )}
      </div>
      
      <div 
        className="stat-icon" 
        style={{ backgroundColor: color + '20' }}
        aria-hidden="true"
      >
        <Icon size={24} color={color} />
      </div>
    </div>
  );
};

export default StatCard;




