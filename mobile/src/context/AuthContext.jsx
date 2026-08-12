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
  
  // ✅ Use refs to prevent multiple updates
  const initialized = useRef(false);
  const authStateRef = useRef({ user: null, isAuthenticated: false });
  const updateTimeoutRef = useRef(null);

  useEffect(() => {
    // ✅ Prevent multiple initializations
    if (initialized.current) {
      console.log('⚠️ Auth already initialized, skipping...');
      return;
    }
    initialized.current = true;
    console.log('🔄 Initializing Auth...');

    // ✅ Use a single source of truth for auth state
    const setAuthState = (newUser, newAuthState) => {
      // Only update if state actually changed
      if (
        authStateRef.current.user?.id !== newUser?.id ||
        authStateRef.current.isAuthenticated !== newAuthState
      ) {
        console.log('📊 Updating auth state:', { 
          user: newUser?.email || 'No user', 
          isAuthenticated: newAuthState 
        });
        
        authStateRef.current = { user: newUser, isAuthenticated: newAuthState };
        setUser(newUser);
        setIsAuthenticated(newAuthState);
      }
    };

    const initAuth = async () => {
      try {
        console.log('🔍 Checking session...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Session error:', error);
        }
        
        const sessionUser = session?.user || null;
        const sessionAuth = !!session;
        
        console.log('📊 Session found:', sessionAuth);
        console.log('👤 User:', sessionUser?.email || 'No user');
        
        setAuthState(sessionUser, sessionAuth);

        if (session?.access_token) {
          localStorage.setItem('auth_token', session.access_token);
        } else {
          localStorage.removeItem('auth_token');
        }
      } catch (error) {
        console.error('❌ Auth initialization error:', error);
      } finally {
        console.log('✅ Auth initialization complete');
        setLoading(false);
      }
    };

    initAuth();

    // ✅ Listen for auth changes with debounce
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth event:', event);
        console.log('📊 Session:', !!session);
        console.log('👤 User:', session?.user?.email || 'No user');
        
        // ✅ Clear any pending update
        if (updateTimeoutRef.current) {
          clearTimeout(updateTimeoutRef.current);
        }

        // ✅ Debounce state updates to prevent rapid toggling
        updateTimeoutRef.current = setTimeout(() => {
          const newUser = session?.user || null;
          const newAuthState = !!session;

          setAuthState(newUser, newAuthState);
          setLoading(false);

          if (session?.access_token) {
            localStorage.setItem('auth_token', session.access_token);
          } else {
            localStorage.removeItem('auth_token');
          }

          switch (event) {
            case 'SIGNED_IN':
              toast.success('Welcome back! 👋');
              break;
            case 'SIGNED_OUT':
              toast.success('Signed out successfully');
              break;
            case 'TOKEN_REFRESHED':
              console.log('🔄 Token refreshed');
              break;
            default:
              break;
          }
        }, 100);
      }
    );

    return () => {
      console.log('🧹 Cleaning up auth subscription');
      subscription.unsubscribe();
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);

  // ✅ Login
  const login = async (email, password) => {
    try {
      console.log('🔐 Login attempt:', email);
      const response = await authAPI.login({ email, password });
      const { user, session } = response.data;

      if (session?.access_token) {
        localStorage.setItem('auth_token', session.access_token);
      }

      // ✅ Update state immediately
      authStateRef.current = { user, isAuthenticated: true };
      setUser(user);
      setIsAuthenticated(true);
      
      toast.success('Login successful! 🎉');
      return { success: true, user };
    } catch (error) {
      console.error('❌ Login error:', error);
      toast.error(error.response?.data?.error || 'Login failed');
      return { success: false, error: error.response?.data?.error };
    }
  };

  // ✅ Register
  const register = async (email, password, metadata = {}) => {
    try {
      console.log('📝 Register attempt:', email);
      const response = await authAPI.signup({ email, password, ...metadata });
      const { user } = response.data;

      toast.success('Account created! Please verify your email.');
      return { success: true, user };
    } catch (error) {
      console.error('❌ Register error:', error);
      toast.error(error.response?.data?.error || 'Registration failed');
      return { success: false, error: error.response?.data?.error };
    }
  };

  // ✅ Logout
  const logout = async () => {
    try {
      console.log('🚪 Logging out...');
      await supabase.auth.signOut();
      localStorage.removeItem('auth_token');
      
      // ✅ Update state immediately
      authStateRef.current = { user: null, isAuthenticated: false };
      setUser(null);
      setIsAuthenticated(false);
      
      toast.success('Logged out successfully');
      return { success: true };
    } catch (error) {
      console.error('❌ Logout error:', error);
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