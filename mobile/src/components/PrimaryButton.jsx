// mobile/src/components/PrimaryButton.jsx
import React from 'react';

const PrimaryButton = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  loading = false,
  disabled = false,
  onClick,
  type = 'button',
  fullWidth = false,
  icon,
  iconPosition = 'left',
  ...props 
}) => {
  const baseStyles = 'font-semibold rounded-xl transition-all duration-200 inline-flex items-center justify-center gap-2';
  
  const variants = {
    primary: 'bg-gradient-accent text-champion-blue hover:shadow-lg hover:scale-105 active:scale-95',
    secondary: 'bg-champion-blue text-white hover:bg-champion-blue-light hover:shadow-lg hover:scale-105 active:scale-95',
    outline: 'border-2 border-lavender-tonic text-champion-blue hover:bg-lavender-tonic hover:text-champion-blue hover:scale-105 active:scale-95',
    ghost: 'text-gray-600 hover:text-champion-blue hover:bg-gray-50 active:scale-95',
    danger: 'bg-red-600 text-white hover:bg-red-700 hover:shadow-lg hover:scale-105 active:scale-95',
    success: 'bg-green-600 text-white hover:bg-green-700 hover:shadow-lg hover:scale-105 active:scale-95',
    warning: 'bg-yellow-500 text-white hover:bg-yellow-600 hover:shadow-lg hover:scale-105 active:scale-95',
  };

  const sizes = {
    xs: 'px-2 py-1 text-xs',
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3.5 text-base',
    xl: 'px-8 py-4 text-lg',
  };

  const disabledStyles = 'opacity-60 cursor-not-allowed hover:scale-100 hover:shadow-none';
  const loadingStyles = 'cursor-wait';
  const fullWidthStyles = fullWidth ? 'w-full' : '';

  const renderIcon = () => {
    if (loading) {
      return (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      );
    }
    return icon;
  };

  const content = (
    <>
      {icon && iconPosition === 'left' && renderIcon()}
      {children}
      {icon && iconPosition === 'right' && renderIcon()}
    </>
  );

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        ${baseStyles}
        ${variants[variant] || variants.primary}
        ${sizes[size] || sizes.md}
        ${(disabled || loading) ? disabledStyles : ''}
        ${loading ? loadingStyles : ''}
        ${fullWidthStyles}
        ${className}
      `}
      {...props}
    >
      {content}
    </button>
  );
};

export default PrimaryButton;