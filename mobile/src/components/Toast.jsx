// mobile/src/components/Toast.jsx
import React, { useEffect, useState } from 'react';

const Toast = ({ 
  message, 
  title,
  type = 'info', 
  duration = 4000, 
  onClose,
  position = 'bottom-right'
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLeaving(true);
      setTimeout(() => {
        setIsVisible(false);
        if (onClose) onClose();
      }, 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const typeConfig = {
    success: { 
      icon: '✅', 
      borderColor: '#10B981',
      bgColor: '#f0fdf4',
      titleColor: '#065f46',
      border: 'border-green-500',
      bg: 'bg-green-50',
      text: 'text-green-700',
    },
    error: { 
      icon: '❌', 
      borderColor: '#EF4444',
      bgColor: '#fef2f2',
      titleColor: '#991b1b',
      border: 'border-red-500',
      bg: 'bg-red-50',
      text: 'text-red-700',
    },
    warning: { 
      icon: '⚠️', 
      borderColor: '#F59E0B',
      bgColor: '#fffbeb',
      titleColor: '#92400e',
      border: 'border-yellow-500',
      bg: 'bg-yellow-50',
      text: 'text-yellow-700',
    },
    info: { 
      icon: 'ℹ️', 
      borderColor: '#C8BEFA',
      bgColor: '#EEECF5',
      titleColor: '#151130',
      border: 'border-lavender-tonic',
      bg: 'bg-lavender-tonic/10',
      text: 'text-champion-blue',
    },
  };

  const config = typeConfig[type] || typeConfig.info;

  const positionStyles = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'top-center': 'top-4 left-1/2 -translate-x-1/2',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
  };

  if (!isVisible) return null;

  const defaultTitle = type.charAt(0).toUpperCase() + type.slice(1);

  return (
    <div className={`fixed z-[9999] ${positionStyles[position]} animate-slide-down`}>
      <div className={`flex items-start gap-3 px-4 py-3 rounded-xl border-2 shadow-lg ${config.bg} ${config.border} max-w-md min-w-[280px]`}>
        <span className="text-xl flex-shrink-0 mt-0.5">{config.icon}</span>
        <div className="flex-1 min-w-0">
          <div className={`font-semibold text-sm ${config.text}`}>
            {title || defaultTitle}
          </div>
          <div className="text-gray-600 text-sm leading-relaxed">
            {message}
          </div>
        </div>
        <button
          onClick={() => {
            setIsLeaving(true);
            setTimeout(() => {
              setIsVisible(false);
              if (onClose) onClose();
            }, 300);
          }}
          className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0 -mt-0.5"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default Toast;