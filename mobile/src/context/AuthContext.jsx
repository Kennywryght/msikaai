// mobile/src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// How long we're willing to wait for Supabase before giving up
const AUTH_TIMEOUT_MS = 5000;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const initialized = useRef(false);

  // ==========================================
  // INIT AUTH
  // ==========================================
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const initAuth = async () => {
      if (!isSupabaseConfigured) {
        console.warn('⚠️ Supabase is not configured — skipping session check.');
        setUser(null);
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }

      try {
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((resolve) =>
          setTimeout(
            () => resolve({ data: { session: null }, timedOut: true }),
            AUTH_TIMEOUT_MS
          )
        );

        const result = await Promise.race([sessionPromise, timeoutPromise]);

        if (result.timedOut) {
          console.warn(
            `⚠️ Supabase getSession() timed out after ${AUTH_TIMEOUT_MS}ms`
          );
        }

        const sessionUser = result.data?.session?.user ?? null;
        
        // Fetch user profile if logged in
        if (sessionUser) {
          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', sessionUser.id)
              .single();
            
            setUser({
              ...sessionUser,
              ...(profile || {})
            });
          } catch (err) {
            console.error('Profile fetch error:', err);
            setUser(sessionUser);
          }
        } else {
          setUser(null);
        }
        
        setIsAuthenticated(!!sessionUser);
      } catch (error) {
        console.error('Auth error:', error);
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    if (!isSupabaseConfigured) {
      return;
    }

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const sessionUser = session?.user ?? null;
        
        if (sessionUser) {
          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', sessionUser.id)
              .single();
            
            setUser({
              ...sessionUser,
              ...(profile || {})
            });
          } catch (err) {
            console.error('Profile fetch error:', err);
            setUser(sessionUser);
          }
        } else {
          setUser(null);
        }
        
        setIsAuthenticated(!!session);
        setLoading(false);

        if (event === 'SIGNED_IN') {
          toast.success('Welcome back! 👋');
        }
        if (event === 'SIGNED_OUT') {
          toast.success('Signed out');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // ==========================================
  // LOGIN
  // ==========================================
  const login = async (email, password) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      // Fetch user profile
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();
        
        setUser({
          ...data.user,
          ...(profile || {})
        });
      } catch (err) {
        console.error('Profile fetch error:', err);
        setUser(data.user);
      }
      
      setIsAuthenticated(true);
      toast.success('Login successful! 🎉');
      return { success: true, user: data.user };
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error.message || 'Login failed');
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // LOGOUT - FIXED: Proper redirect to landing
  // ==========================================
  const logout = async () => {
    try {
      setLoading(true);
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Clear user state
      setUser(null);
      setIsAuthenticated(false);
      
      // Clear any stored data
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      sessionStorage.clear();
      
      toast.success('Logged out successfully');
      console.log('✅ Logout successful');
      
      // ✅ FIX: Force navigation to landing page
      // This ensures a clean reload and avoids routing issues
      window.location.href = '/';
      
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Logout failed');
      // Still clear user on error
      setUser(null);
      setIsAuthenticated(false);
      window.location.href = '/';
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // REGISTER - Available for backward compatibility
  // ==========================================
  const register = async (email, password, userData) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData
        }
      });

      if (error) throw error;

      if (data.user) {
        // Create profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([{
            id: data.user.id,
            email: email,
            full_name: userData.full_name,
            phone: userData.phone || null,
            ...userData
          }]);

        if (profileError) {
          console.error('Profile creation error:', profileError);
        }
      }

      toast.success('Account created successfully! 🎉');
      return { success: true, user: data.user };
    } catch (error) {
      console.error('Registration error:', error);
      toast.error(error.message || 'Registration failed');
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
    register,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;