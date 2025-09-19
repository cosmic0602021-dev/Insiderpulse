import React, { useState } from 'react';
import { Search, X } from 'lucide-react';

interface AnimatedSearchInputProps {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  'data-testid'?: string;
}

export const AnimatedSearchInput: React.FC<AnimatedSearchInputProps> = ({
  placeholder = "Search...",
  value,
  onChange,
  className = "",
  'data-testid': testId
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleClear = () => {
    onChange('');
  };

  const containerStyle: React.CSSProperties = {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    transition: 'all 0.3s ease',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    height: '2.5rem',
    border: '1px solid hsl(var(--border))',
    borderRadius: '0.75rem',
    outline: 'none',
    fontSize: '0.875rem',
    fontWeight: '500',
    padding: '0 3rem 0 2.5rem',
    background: 'hsl(var(--background))',
    color: 'hsl(var(--foreground))',
    caretColor: 'hsl(var(--primary))',
    transition: 'all 0.3s ease',
    boxShadow: isFocused
      ? '0 0 0 2px rgba(59, 130, 246, 0.15), 0 4px 12px rgba(59, 130, 246, 0.1)'
      : '0 1px 3px rgba(0, 0, 0, 0.1)',
    transform: isFocused ? 'translateY(-1px)' : 'translateY(0)',
  };

  const iconWrapperStyle: React.CSSProperties = {
    position: 'absolute',
    left: '0.75rem',
    zIndex: 10,
    pointerEvents: 'none',
    transition: 'all 0.3s ease',
  };

  const iconStyle: React.CSSProperties = {
    width: '1rem',
    height: '1rem',
    color: isFocused ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
    transition: 'all 0.3s ease',
    transform: isFocused ? 'scale(1.1)' : 'scale(1)',
  };

  const clearButtonStyle: React.CSSProperties = {
    position: 'absolute',
    right: '0.75rem',
    zIndex: 10,
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '0.25rem',
    borderRadius: '0.25rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
    opacity: value ? 1 : 0,
    transform: value ? 'scale(1)' : 'scale(0.8)',
  };

  const clearIconStyle: React.CSSProperties = {
    width: '0.875rem',
    height: '0.875rem',
    color: 'hsl(var(--muted-foreground))',
    transition: 'color 0.2s ease',
  };

  return (
    <div
      className={className}
      style={containerStyle}
      onMouseEnter={(e) => {
        const input = e.currentTarget.querySelector('input');
        if (input && !isFocused) {
          input.style.borderColor = 'hsl(var(--primary))';
          input.style.boxShadow = '0 2px 8px rgba(59, 130, 246, 0.08)';
        }
      }}
      onMouseLeave={(e) => {
        const input = e.currentTarget.querySelector('input');
        if (input && !isFocused) {
          input.style.borderColor = 'hsl(var(--border))';
          input.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
        }
      }}
    >
      <div style={iconWrapperStyle}>
        <Search style={iconStyle} />
      </div>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        style={inputStyle}
        data-testid={testId}
      />
      {value && (
        <button
          type="button"
          onClick={handleClear}
          style={clearButtonStyle}
          aria-label="Clear search"
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'hsl(var(--accent))';
            const icon = e.currentTarget.querySelector('svg');
            if (icon) (icon as HTMLElement).style.color = 'hsl(var(--foreground))';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'none';
            const icon = e.currentTarget.querySelector('svg');
            if (icon) (icon as HTMLElement).style.color = 'hsl(var(--muted-foreground))';
          }}
        >
          <X style={clearIconStyle} />
        </button>
      )}
    </div>
  );
};