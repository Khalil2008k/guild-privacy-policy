/**
 * Reusable Empty State Component
 * Displays when no data is available
 */

import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  action
}) => {
  const { theme } = useTheme();

  return (
    <div 
      style={{ 
        padding: '60px 20px', 
        textAlign: 'center', 
        color: theme.textSecondary 
      }}
      role="status"
      aria-live="polite"
    >
      <Icon 
        size={64} 
        style={{ 
          margin: '0 auto 16px', 
          opacity: 0.5,
          color: theme.textSecondary
        }} 
        aria-hidden="true"
      />
      <h3 style={{ 
        color: theme.textPrimary, 
        marginBottom: '8px',
        fontSize: '20px',
        fontWeight: '600'
      }}>
        {title}
      </h3>
      <p style={{ 
        marginBottom: action ? '24px' : '0',
        maxWidth: '400px',
        margin: '0 auto'
      }}>
        {description}
      </p>
      {action && (
        <button
          onClick={action.onClick}
          style={{
            marginTop: '24px',
            padding: '10px 20px',
            backgroundColor: theme.primary,
            color: theme.buttonText,
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'opacity 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '0.9';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '1';
          }}
        >
          {action.label}
        </button>
      )}
    </div>
  );
};

export default EmptyState;




