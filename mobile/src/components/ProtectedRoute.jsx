// mobile/src/components/ProtectedRoute.jsx
import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingSpinner message="Verifying your session..." />;
  }

  if (!isAuthenticated || !user) {
    // Save the attempted URL for redirect after login
    sessionStorage.setItem('redirectAfterLogin', location.pathname + location.search);
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Admin check would go here if needed
  if (adminOnly) {
    // Check if user has admin role
    const isAdmin = user.role === 'admin';
    if (!isAdmin) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
};

// Public route - redirects to dashboard if authenticated
export const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingSpinner message="Loading..." />;
  }

  if (user) {
    // Check if there's a redirect URL saved
    const redirectUrl = sessionStorage.getItem('redirectAfterLogin');
    sessionStorage.removeItem('redirectAfterLogin');
    
    // If on login/register page, redirect to dashboard or saved URL
    if (location.pathname === '/login' || location.pathname === '/register' || location.pathname === '/') {
      return <Navigate to={redirectUrl || '/dashboard'} replace />;
    }
  }

  return children;
};

export default ProtectedRoute;