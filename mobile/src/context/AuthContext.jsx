// mobile/src/context/AuthContext.jsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';
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

  // ✅ Always call useToast() — AuthProvider is nested inside ToastProvider in App.jsx,
  // so the hook will always find its context. Wrapping hook calls in try/catch
  // violates the Rules of Hooks and caused async stack crashes.
  const { showToast, success, error } = useToast();

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
      } catch (err) {
        console.error('Auth initialization error:', err);
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
    } catch (err) {
      console.error('Profile fetch error:', err);
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
    } catch (err) {
      console.error('❌ Token refresh failed:', err);
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
  // LOGIN
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
    } catch (err) {
      console.error('❌ Login error:', err);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // REGISTER
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
          .insert([
            {
              id: data.user.id,
              full_name: fullName,
              email: email.trim().toLowerCase(),
              phone: phone || null,
              role: role,
              status: 'active',
              onboarding_completed: false,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ]);

        if (profileError) {
          console.error('Profile creation error:', profileError);
        }

        // ✅ Only set session state if Supabase actually returned one.
        // If email confirmation is required, data.session will be null
        // and the SIGNED_IN event will fire later after the user confirms.
        if (data.session?.access_token) {
          localStorage.setItem('access_token', data.session.access_token);
          localStorage.setItem('refresh_token', data.session.refresh_token);

          await fetchUserProfile(data.user);
          setSession(data.session);
          setIsAuthenticated(true);
          scheduleTokenRefresh(data.session);
        } else {
          console.log('📧 Awaiting email confirmation — session will arrive via SIGNED_IN event');
        }
      }

      return { success: true, user: data.user };
    } catch (err) {
      console.error('❌ Registration error:', err);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // LOGOUT
  // ============================================================
  const logout = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      clearAuth();
      sessionStorage.clear();

      return { success: true };
    } catch (err) {
      console.error('❌ Logout error:', err);
      clearAuth();
      return { success: false, error: err.message };
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

      setUser((prev) => ({
        ...prev,
        ...data,
        profile: data,
      }));

      if (updates.role) {
        setUserRole(updates.role);
      }

      return { success: true, data };
    } catch (err) {
      console.error('❌ Profile update error:', err);
      return { success: false, error: err.message };
    }
  };

  // ============================================================
  // ROLE HELPERS
  // ============================================================
  const hasRole = useCallback(
    (requiredRole) => {
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
    },
    [isAuthenticated, userRole]
  );

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
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
};

export default AuthProvider;