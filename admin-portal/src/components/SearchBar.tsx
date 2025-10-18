/**
 * Reusable Search Bar Component
 * Used across multiple pages for searching
 */

import React from 'react';
import { Search } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSearch?: () => void;
  placeholder?: string;
  disabled?: boolean;
  autoFocus?: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  onSearch,
  placeholder = 'Search...',
  disabled = false,
  autoFocus = false
}) => {
  const { theme } = useTheme();

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && onSearch) {
      onSearch();
    }
  };

  return (
    <div style={{ flex: '1 1 300px', position: 'relative' }}>
      <Search
        size={20}
        style={{
          position: 'absolute',
          left: '12px',
          top: '50%',
          transform: 'translateY(-50%)',
          color: theme.textSecondary
        }}
        aria-hidden="true"
      />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyPress={handleKeyPress}
        disabled={disabled}
        autoFocus={autoFocus}
        aria-label={placeholder}
        style={{
          width: '100%',
          padding: '10px 12px 10px 40px',
          backgroundColor: theme.background,
          border: `1px solid ${theme.border}`,
          borderRadius: '8px',
          color: theme.textPrimary,
          fontSize: '14px',
          outline: 'none',
          transition: 'border-color 0.2s'
        }}
        onFocus={(e) => {
          e.target.style.borderColor = theme.primary;
        }}
        onBlur={(e) => {
          e.target.style.borderColor = theme.border;
        }}
      />
    </div>
  );
};

export default SearchBar;




