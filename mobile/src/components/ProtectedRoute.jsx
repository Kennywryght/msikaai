// mobile/src/components/ProtectedRoute.jsx
import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

const ProtectedRoute = ({ 
  children, 
  requiredRole = 'any',
  redirectTo = '/login',
}) => {
  const { isAuthenticated, hasRole, loading, authInitialized } = useAuth();
  const location = useLocation();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!loading && authInitialized) {
      setChecking(false);
    }
  }, [loading, authInitialized]);

  if (checking || loading) {
    return (
      <div style={styles.loadingContainer}>
        <LoadingSpinner message="Verifying your access..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    sessionStorage.setItem('redirectAfterLogin', location.pathname + location.search);
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  if (requiredRole !== 'any' && !hasRole(requiredRole)) {
    const role = hasRole('admin') ? '/admin' :
                 hasRole('business') ? '/dashboard' :
                 hasRole('seller') ? '/dashboard' : '/';
    return <Navigate to={role} replace />;
  }

  return children;
};

// ============================================================
// PUBLIC ROUTE
// ============================================================
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading, authInitialized } = useAuth();
  const location = useLocation();

  if (loading || !authInitialized) {
    return <LoadingSpinner fullScreen message="Loading..." />;
  }

  if (isAuthenticated) {
    const redirectUrl = sessionStorage.getItem('redirectAfterLogin') || '/dashboard';
    sessionStorage.removeItem('redirectAfterLogin');
    
    if (location.pathname === '/login' || location.pathname === '/register') {
      return <Navigate to={redirectUrl} replace />;
    }
  }

  return children;
};

// ============================================================
// ROUTE HELPERS
// ============================================================
const GuestRoute = ({ children }) => (
  <ProtectedRoute requiredRole="guest" redirectTo="/dashboard">
    {children}
  </ProtectedRoute>
);

const BuyerRoute = ({ children }) => (
  <ProtectedRoute requiredRole="buyer">
    {children}
  </ProtectedRoute>
);

const SellerRoute = ({ children }) => (
  <ProtectedRoute requiredRole="seller">
    {children}
  </ProtectedRoute>
);

const AdminRoute = ({ children }) => (
  <ProtectedRoute requiredRole="admin">
    {children}
  </ProtectedRoute>
);

// ============================================================
// ✅ EXPORT ALL COMPONENTS
// ============================================================
export { 
  ProtectedRoute, 
  PublicRoute, 
  GuestRoute, 
  BuyerRoute, 
  SellerRoute, 
  AdminRoute 
};

// ============================================================
// STYLES
// ============================================================
const styles = {
  loadingContainer: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#F8FAFC',
  },
};