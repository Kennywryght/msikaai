// mobile/src/components/Button.jsx
import React from 'react';

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled = false,
  onClick,
  type = 'button',
  className = '',
  iconLeft,
  iconRight,
  ...props
}) => {
  const styles = {
    base: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      border: 'none',
      borderRadius: '10px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      position: 'relative',
      overflow: 'hidden',
      textDecoration: 'none',
      fontFamily: 'inherit',
      touchAction: 'manipulation',
      ...(fullWidth && { width: '100%' }),
    },
    variants: {
      primary: {
        background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
        color: '#ffffff',
        boxShadow: '0 4px 14px rgba(37,99,235,0.25)',
      },
      secondary: {
        background: '#ffffff',
        color: '#1e293b',
        border: '1px solid #cbd5e1',
      },
      outline: {
        background: 'transparent',
        color: '#2563eb',
        border: '2px solid #2563eb',
      },
      ghost: {
        background: 'transparent',
        color: '#475569',
      },
      danger: {
        background: 'linear-gradient(135deg, #ef4444, #dc2626)',
        color: '#ffffff',
        boxShadow: '0 4px 14px rgba(239,68,68,0.25)',
      },
      success: {
        background: 'linear-gradient(135deg, #22c55e, #16a34a)',
        color: '#ffffff',
        boxShadow: '0 4px 14px rgba(34,197,94,0.25)',
      },
      warning: {
        background: 'linear-gradient(135deg, #f59e0b, #d97706)',
        color: '#ffffff',
        boxShadow: '0 4px 14px rgba(245,158,11,0.25)',
      },
    },
    sizes: {
      sm: { padding: '8px 16px', fontSize: '13px', borderRadius: '8px' },
      md: { padding: '10px 24px', fontSize: '14px', borderRadius: '10px' },
      lg: { padding: '14px 32px', fontSize: '16px', borderRadius: '12px' },
    },
    disabled: {
      opacity: 0.6,
      cursor: 'not-allowed',
      transform: 'none !important',
      boxShadow: 'none !important',
    },
    loading: {
      cursor: 'wait',
      opacity: 0.8,
    },
    spinner: {
      display: 'inline-block',
      width: '16px',
      height: '16px',
      border: '2px solid rgba(255,255,255,0.3)',
      borderTop: '2px solid #ffffff',
      borderRadius: '50%',
      animation: 'spin 0.6s linear infinite',
    },
    hover: {
      primary: {
        transform: 'translateY(-2px)',
        boxShadow: '0 6px 20px rgba(37,99,235,0.35)',
      },
      secondary: {
        background: '#f8fafc',
        borderColor: '#94a3b8',
      },
      outline: {
        background: '#eff6ff',
      },
      ghost: {
        background: '#f1f5f9',
      },
      danger: {
        transform: 'translateY(-2px)',
        boxShadow: '0 6px 20px rgba(239,68,68,0.35)',
      },
      success: {
        transform: 'translateY(-2px)',
        boxShadow: '0 6px 20px rgba(34,197,94,0.35)',
      },
      warning: {
        transform: 'translateY(-2px)',
        boxShadow: '0 6px 20px rgba(245,158,11,0.35)',
      },
    }
  };

  const variantStyles = styles.variants[variant] || styles.variants.primary;
  const sizeStyles = styles.sizes[size] || styles.sizes.md;
  const hoverStyles = styles.hover[variant] || styles.hover.primary;

  const isDisabled = disabled || loading;

  return (
    <>
      <button
        type={type}
        onClick={onClick}
        disabled={isDisabled}
        style={{
          ...styles.base,
          ...variantStyles,
          ...sizeStyles,
          ...(isDisabled && styles.disabled),
          ...(loading && styles.loading),
        }}
        className={className}
        {...props}
      >
        {loading && <span style={styles.spinner}></span>}
        {!loading && iconLeft && <span style={{ flexShrink: 0 }}>{iconLeft}</span>}
        <span>{children}</span>
        {!loading && iconRight && <span style={{ flexShrink: 0 }}>{iconRight}</span>}
      </button>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
};

export default Button;