// mobile/src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Initialize auth
  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user ?? null);
        setIsAuthenticated(!!session);

        // If session exists but no token in localStorage, set it
        if (session?.access_token) {
          localStorage.setItem('auth_token', session.access_token);
          if (session.refresh_token) {
            localStorage.setItem('refresh_token', session.refresh_token);
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsAuthenticated(!!session);
        setLoading(false);

        // Update tokens in localStorage
        if (session?.access_token) {
          localStorage.setItem('auth_token', session.access_token);
          if (session.refresh_token) {
            localStorage.setItem('refresh_token', session.refresh_token);
          }
        }

        // Handle events
        switch (event) {
          case 'SIGNED_IN':
            toast.success('Welcome back! 👋');
            break;
          case 'SIGNED_OUT':
            localStorage.removeItem('auth_token');
            localStorage.removeItem('refresh_token');
            toast.success('Signed out successfully');
            break;
          case 'USER_UPDATED':
            toast.success('Profile updated!');
            break;
          default:
            break;
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Login with email
  const login = async (email, password) => {
    try {
      const response = await authAPI.login({ email, password });
      const { user, session } = response.data;

      if (session?.access_token) {
        localStorage.setItem('auth_token', session.access_token);
        if (session.refresh_token) {
          localStorage.setItem('refresh_token', session.refresh_token);
        }
      }

      setUser(user);
      setIsAuthenticated(true);
      toast.success('Login successful! 🎉');
      return { success: true, user };
    } catch (error) {
      toast.error(error.response?.data?.error || 'Login failed');
      return { success: false, error: error.response?.data?.error };
    }
  };

  // Register with email
  const register = async (email, password, metadata = {}) => {
    try {
      const response = await authAPI.signup({ email, password, ...metadata });
      const { user } = response.data;

      toast.success('Account created! Please verify your email.');
      return { success: true, user };
    } catch (error) {
      toast.error(error.response?.data?.error || 'Registration failed');
      return { success: false, error: error.response?.data?.error };
    }
  };

  // Logout
  const logout = async () => {
    try {
      await supabase.auth.signOut();
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
      setUser(null);
      setIsAuthenticated(false);
      toast.success('Logged out successfully');
      return { success: true };
    } catch (error) {
      toast.error('Logout failed');
      return { success: false, error };
    }
  };

  // Reset password
  const resetPassword = async (email) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      toast.success('Password reset email sent! Check your inbox.');
      return { success: true };
    } catch (error) {
      toast.error(error.message || 'Password reset failed');
      return { success: false, error };
    }
  };

  // Update profile
  const updateProfile = async (updates) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user?.id)
        .select()
        .single();

      if (error) throw error;

      toast.success('Profile updated successfully!');
      return { success: true, data };
    } catch (error) {
      toast.error(error.message || 'Profile update failed');
      return { success: false, error };
    }
  };

  const value = {
    user,
    session,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    resetPassword,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;