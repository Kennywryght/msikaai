// mobile/src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useToast } from '../components/ToastContainer';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const TOKEN_REFRESH_BUFFER = 5 * 60 * 1000; // 5 minutes before expiry
const AUTH_TIMEOUT_MS = 5000;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState('guest');
  const [authInitialized, setAuthInitialized] = useState(false);
  
  const refreshTimer = useRef(null);
  const initialized = useRef(false);
  
  // ✅ Safely get toast - handles case where ToastProvider is not available
  let toast;
  try {
    toast = useToast();
  } catch (e) {
    // Toast not available - use console fallback
    console.warn('⚠️ ToastProvider not available, using console fallback');
    toast = {
      showToast: (msg, type = 'info') => {
        const emoji = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
        console.log(`${emoji} ${msg}`);
      },
      success: (msg) => console.log(`✅ ${msg}`),
      error: (msg) => console.log(`❌ ${msg}`),
    };
  }

  const { showToast, success, error } = toast;

  // ============================================================
  // INITIALIZE AUTH
  // ============================================================
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const initAuth = async () => {
      if (!isSupabaseConfigured) {
        console.warn('⚠️ Supabase is not configured — skipping session check.');
        setUser(null);
        setIsAuthenticated(false);
        setUserRole('guest');
        setLoading(false);
        setAuthInitialized(true);
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
          console.warn(`⚠️ Supabase getSession() timed out after ${AUTH_TIMEOUT_MS}ms`);
        }

        const sessionUser = result.data?.session?.user ?? null;
        const sessionData = result.data?.session ?? null;
        
        if (sessionData?.access_token) {
          localStorage.setItem('access_token', sessionData.access_token);
          localStorage.setItem('refresh_token', sessionData.refresh_token);
        }
        
        if (sessionUser) {
          await fetchUserProfile(sessionUser);
          setSession(sessionData);
          setIsAuthenticated(true);
          scheduleTokenRefresh(sessionData);
        } else {
          setUser(null);
          setSession(null);
          setIsAuthenticated(false);
          setUserRole('guest');
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        setUser(null);
        setIsAuthenticated(false);
        setUserRole('guest');
      } finally {
        setLoading(false);
        setAuthInitialized(true);
      }
    };

    initAuth();

    if (!isSupabaseConfigured) return;

    // Auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state changed:', event);
        
        if (event === 'TOKEN_REFRESHED') {
          setSession(session);
          if (session?.access_token) {
            localStorage.setItem('access_token', session.access_token);
            localStorage.setItem('refresh_token', session.refresh_token);
          }
          return;
        }
        
        if (event === 'SIGNED_IN') {
          setSession(session);
          setIsAuthenticated(true);
          if (session?.user) {
            await fetchUserProfile(session.user);
            scheduleTokenRefresh(session);
          }
          success('Welcome back! 👋');
        }
        
        if (event === 'SIGNED_OUT') {
          clearAuth();
          success('Signed out successfully');
        }
        
        if (event === 'USER_UPDATED') {
          if (session?.user) {
            await fetchUserProfile(session.user);
          }
        }
      }
    );

    return () => {
      subscription.unsubscribe();
      if (refreshTimer.current) {
        clearTimeout(refreshTimer.current);
      }
    };
  }, []);

  // ============================================================
  // USER PROFILE FETCH
  // ============================================================
  const fetchUserProfile = async (authUser) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Profile fetch error:', error);
      }

      const userData = {
        ...authUser,
        ...(profile || {}),
        role: profile?.role || 'buyer',
        profile: profile || null,
      };

      setUser(userData);
      setUserRole(profile?.role || 'buyer');
      
      return userData;
    } catch (error) {
      console.error('Profile fetch error:', error);
      setUser(authUser);
      setUserRole('buyer');
      return authUser;
    }
  };

  // ============================================================
  // TOKEN REFRESH SCHEDULER
  // ============================================================
  const scheduleTokenRefresh = (session) => {
    if (refreshTimer.current) {
      clearTimeout(refreshTimer.current);
    }
    
    if (!session?.expires_at) return;
    
    const expiresAt = new Date(session.expires_at).getTime();
    const now = Date.now();
    const timeUntilExpiry = expiresAt - now - TOKEN_REFRESH_BUFFER;
    
    if (timeUntilExpiry > 0) {
      refreshTimer.current = setTimeout(async () => {
        await refreshToken();
      }, timeUntilExpiry);
    }
  };

  const refreshToken = async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) throw error;
      if (data.session) {
        setSession(data.session);
        if (data.session.access_token) {
          localStorage.setItem('access_token', data.session.access_token);
          localStorage.setItem('refresh_token', data.session.refresh_token);
        }
        scheduleTokenRefresh(data.session);
        return { success: true };
      }
    } catch (error) {
      console.error('❌ Token refresh failed:', error);
      return { success: false };
    }
  };

  // ============================================================
  // CLEAR AUTH STATE
  // ============================================================
  const clearAuth = () => {
    setUser(null);
    setSession(null);
    setIsAuthenticated(false);
    setUserRole('guest');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    if (refreshTimer.current) {
      clearTimeout(refreshTimer.current);
    }
  };

  // ============================================================
  // LOGIN - Smooth & Fast
  // ============================================================
  const login = async (email, password, rememberMe = false) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) throw error;

      if (data.session?.access_token) {
        localStorage.setItem('access_token', data.session.access_token);
        localStorage.setItem('refresh_token', data.session.refresh_token);
      }

      if (rememberMe) {
        localStorage.setItem('rememberMe', 'true');
        localStorage.setItem('remembered_email', email);
      } else {
        localStorage.removeItem('rememberMe');
        localStorage.removeItem('remembered_email');
      }

      await fetchUserProfile(data.user);
      setSession(data.session);
      setIsAuthenticated(true);
      scheduleTokenRefresh(data.session);

      return { success: true, user: data.user };
    } catch (error) {
      console.error('❌ Login error:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // REGISTER / SIGNUP
  // ============================================================
  const register = async (userData) => {
    const { email, password, fullName, phone, role = 'buyer' } = userData;
    
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            full_name: fullName,
            phone: phone,
            role: role,
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([{
            id: data.user.id,
            full_name: fullName,
            email: email.trim().toLowerCase(),
            phone: phone || null,
            role: role,
            status: 'active',
            onboarding_completed: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }]);

        if (profileError) {
          console.error('Profile creation error:', profileError);
        }

        if (data.session?.access_token) {
          localStorage.setItem('access_token', data.session.access_token);
          localStorage.setItem('refresh_token', data.session.refresh_token);
        }

        await fetchUserProfile(data.user);
        setSession(data.session);
        setIsAuthenticated(true);
        scheduleTokenRefresh(data.session);
      }

      return { success: true, user: data.user };
    } catch (error) {
      console.error('❌ Registration error:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // LOGOUT - Clean
  // ============================================================
  const logout = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      clearAuth();
      sessionStorage.clear();
      
      return { success: true };
    } catch (error) {
      console.error('❌ Logout error:', error);
      clearAuth();
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // UPDATE PROFILE
  // ============================================================
  const updateProfile = async (updates) => {
    try {
      if (!user) throw new Error('No user logged in');

      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;

      setUser(prev => ({
        ...prev,
        ...data,
        profile: data,
      }));

      if (updates.role) {
        setUserRole(updates.role);
      }

      return { success: true, data };
    } catch (error) {
      console.error('❌ Profile update error:', error);
      return { success: false, error: error.message };
    }
  };

  // ============================================================
  // ROLE HELPERS
  // ============================================================
  const hasRole = useCallback((requiredRole) => {
    if (!isAuthenticated) return false;
    if (requiredRole === 'any') return true;
    if (requiredRole === 'guest') return !isAuthenticated;
    
    const roleHierarchy = {
      admin: ['admin'],
      business: ['admin', 'business'],
      seller: ['admin', 'business', 'seller'],
      buyer: ['admin', 'business', 'seller', 'buyer'],
    };
    
    return roleHierarchy[requiredRole]?.includes(userRole) || false;
  }, [isAuthenticated, userRole]);

  const isSeller = useCallback(() => hasRole('seller'), [hasRole]);
  const isBuyer = useCallback(() => hasRole('buyer'), [hasRole]);
  const isAdmin = useCallback(() => hasRole('admin'), [hasRole]);

  // ============================================================
  // CONTEXT VALUE
  // ============================================================
  const value = {
    user,
    session,
    loading,
    userRole,
    isAuthenticated,
    authInitialized,
    login,
    register,
    logout,
    refreshToken,
    updateProfile,
    fetchUserProfile,
    hasRole,
    isSeller,
    isBuyer,
    isAdmin,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;