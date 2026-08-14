// mobile/src/components/ToastContainer.jsx
import React, { useState, useCallback } from 'react';
import Toast from './Toast';

export const ToastContext = React.createContext();

export const useToast = () => {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback(({ message, title, type = 'info', duration = 3000, position = 'bottom-right' }) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, title, type, duration, position }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const toastFunctions = {
    success: (message, title, options) => 
      showToast({ message, title, type: 'success', ...options }),
    error: (message, title, options) => 
      showToast({ message, title, type: 'error', ...options }),
    warning: (message, title, options) => 
      showToast({ message, title, type: 'warning', ...options }),
    info: (message, title, options) => 
      showToast({ message, title, type: 'info', ...options }),
  };

  return (
    <ToastContext.Provider value={{ showToast, ...toastFunctions }}>
      {children}
      {toasts.map(({ id, message, title, type, duration, position }) => (
        <Toast
          key={id}
          message={message}
          title={title}
          type={type}
          duration={duration}
          position={position}
          onClose={() => removeToast(id)}
        />
      ))}
    </ToastContext.Provider>
  );
};

// ✅ FIXED: Export ToastProvider as default
export default ToastProvider;