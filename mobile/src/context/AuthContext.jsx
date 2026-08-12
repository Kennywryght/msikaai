// mobile/src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
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
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const initialized = useRef(false);

  useEffect(() => {
    // ✅ Prevent multiple initializations
    if (initialized.current) return;
    initialized.current = true;

    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user ?? null);
        setIsAuthenticated(!!session);

        if (session?.access_token) {
          localStorage.setItem('auth_token', session.access_token);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // ✅ Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        setIsAuthenticated(!!session);
        setLoading(false);

        if (session?.access_token) {
          localStorage.setItem('auth_token', session.access_token);
        }

        switch (event) {
          case 'SIGNED_IN':
            toast.success('Welcome back! 👋');
            break;
          case 'SIGNED_OUT':
            localStorage.removeItem('auth_token');
            toast.success('Signed out successfully');
            break;
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // ✅ Login
  const login = async (email, password) => {
    try {
      const response = await authAPI.login({ email, password });
      const { user, session } = response.data;

      if (session?.access_token) {
        localStorage.setItem('auth_token', session.access_token);
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

  // ✅ Register
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

  // ✅ Logout
  const logout = async () => {
    try {
      await supabase.auth.signOut();
      localStorage.removeItem('auth_token');
      setUser(null);
      setIsAuthenticated(false);
      toast.success('Logged out successfully');
      return { success: true };
    } catch (error) {
      toast.error('Logout failed');
      return { success: false, error };
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;