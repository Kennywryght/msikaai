import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('auth_token');
    console.log('🔍 Checking auth, token exists:', !!token);
    console.log('🔍 Token value:', token ? token.substring(0, 20) + '...' : 'null');
    
    if (!token) {
      console.log('❌ No token found, setting loading to false');
      setLoading(false);
      return;
    }

    try {
      console.log('📤 Fetching user profile with token...');
      const response = await authAPI.getMe();
      console.log('✅ User profile fetched:', response.data);
      setUser(response.data.user);
    } catch (err) {
      console.error('❌ Auth check failed:', err.response?.status, err.response?.data);
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    setError(null);
    console.log('🔐 Login attempt with email:', email);
    
    try {
      const response = await authAPI.login({ email, password });
      console.log('✅ Login response received:', response.status);
      console.log('✅ Response data:', response.data);
      
      const { user, session } = response.data;
      
      if (session?.access_token) {
        console.log('💾 Storing access token in localStorage');
        localStorage.setItem('auth_token', session.access_token);
        if (session.refresh_token) {
          localStorage.setItem('refresh_token', session.refresh_token);
        }
        const stored = localStorage.getItem('auth_token');
        console.log('💾 Token stored successfully:', !!stored);
      } else {
        console.warn('⚠️ No access token in response!');
      }
      
      setUser(user);
      console.log('✅ Login successful for user:', user?.email || user?.id);
      return { success: true, user };
    } catch (err) {
      console.error('❌ Login error:', err.response?.status, err.response?.data);
      setError(err.response?.data?.error || 'Login failed');
      return { success: false, error: err.response?.data?.error };
    }
  };

  const signup = async (email, password, fullName, phone) => {
    setError(null);
    console.log('📝 Signup attempt:', { email, fullName });
    
    try {
      const response = await authAPI.signup({ email, password, fullName, phone });
      console.log('✅ Signup response:', response.data);
      
      const { user } = response.data;
      setUser(user);
      return { success: true, user };
    } catch (err) {
      console.error('❌ Signup error:', err.response?.data);
      setError(err.response?.data?.error || 'Signup failed');
      return { success: false, error: err.response?.data?.error };
    }
  };

  const logout = async () => {
    console.log('🚪 Logging out...');
    try {
      await authAPI.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
      setUser(null);
      console.log('✅ Logged out');
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    signup,
    logout,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};