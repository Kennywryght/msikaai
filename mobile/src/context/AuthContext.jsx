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

// ============================================================
// Helpers
// ============================================================

// Supabase sets `is_anonymous: true` on the JWT for anonymous sessions.
const isAnonymousUser = (supabaseUser) =>
  supabaseUser?.is_anonymous === true ||
  supabaseUser?.user_metadata?.is_anonymous === true;

// Roles that mean "the user has made a real choice". Everything else
// (null, 'customer', 'guest', 'user') means they haven't picked yet.
const CHOSEN_ROLES = new Set(['buyer', 'seller', 'provider', 'both', 'business', 'admin']);

const hasChosenRole = (role) => CHOSEN_ROLES.has(String(role || '').toLowerCase());

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [userRole, setUserRole] = useState('guest');
  const [authInitialized, setAuthInitialized] = useState(false);

  const refreshTimer = useRef(null);
  const initialized = useRef(false);
  // Prevent the "Welcome back!" toast on the silent anon sign-in
  const suppressNextWelcomeToast = useRef(false);

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
        setIsAnonymous(false);
        setUserRole('guest');
        setLoading(false);
        setAuthInitialized(true);
        return;
      }

      try {
        // ============================================================
        // IMPORTANT: If we arrived on /update-password, Supabase is
        // already consuming the recovery token from the URL. We must
        // NOT call signInAnonymously() in that case, or we'll clobber
        // the recovery session before it settles.
        // ============================================================
        const isRecoveryRoute =
          typeof window !== 'undefined' &&
          window.location.pathname === '/update-password';

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

        let sessionUser = result.data?.session?.user ?? null;
        let sessionData = result.data?.session ?? null;

        // ============================================================
        // STEP 1C: if there's no session at all AND we're not on the
        // recovery route, create an anonymous one.
        // ============================================================
        if (!sessionUser && !isRecoveryRoute) {
          try {
            suppressNextWelcomeToast.current = true;
            const { data: anonData, error: anonError } =
              await supabase.auth.signInAnonymously();

            if (anonError) {
              console.warn('⚠️ Anonymous sign-in unavailable:', anonError.message);
            } else if (anonData?.session) {
              sessionUser = anonData.session.user;
              sessionData = anonData.session;
              console.log('👤 Anonymous session created:', sessionUser.id);
            }
          } catch (anonErr) {
            console.warn('⚠️ Anonymous sign-in failed:', anonErr.message);
          }
        }

        if (sessionData?.access_token) {
          localStorage.setItem('access_token', sessionData.access_token);
          localStorage.setItem('refresh_token', sessionData.refresh_token);
        }

        if (sessionUser) {
          await fetchUserProfile(sessionUser);
          setSession(sessionData);
          setIsAuthenticated(true);
          setIsAnonymous(isAnonymousUser(sessionUser));
          scheduleTokenRefresh(sessionData);
        } else {
          setUser(null);
          setSession(null);
          setIsAuthenticated(false);
          setIsAnonymous(false);
          setUserRole('guest');
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
        setUser(null);
        setIsAuthenticated(false);
        setIsAnonymous(false);
        setUserRole('guest');
      } finally {
        setLoading(false);
        setAuthInitialized(true);
      }
    };

    initAuth();

    if (!isSupabaseConfigured) return;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth state changed:', event);

      if (event === 'TOKEN_REFRESHED') {
        setSession(session);
        if (session?.access_token) {
          localStorage.setItem('access_token', session.access_token);
          localStorage.setItem('refresh_token', session.refresh_token);
        }
        return;
      }

      // ★ PASSWORD_RECOVERY fires when the user lands on /update-password
      //   via the email link. We set the session so UpdatePassword.jsx
      //   sees it, but do NOT show a "welcome back" toast.
      if (event === 'PASSWORD_RECOVERY') {
        setSession(session);
        setIsAuthenticated(!!session);
        if (session?.user) {
          await fetchUserProfile(session.user);
        }
        if (session?.access_token) {
          localStorage.setItem('access_token', session.access_token);
          localStorage.setItem('refresh_token', session.refresh_token);
        }
        return;
      }

      if (event === 'SIGNED_IN') {
        setSession(session);
        setIsAuthenticated(true);
        setIsAnonymous(isAnonymousUser(session?.user));
        if (session?.user) {
          await fetchUserProfile(session.user);
          scheduleTokenRefresh(session);
        }

        // Only show the welcome toast for real sign-ins
        if (!suppressNextWelcomeToast.current && !isAnonymousUser(session?.user)) {
          success('Welcome back! 👋');
        }
        suppressNextWelcomeToast.current = false;
      }

      if (event === 'SIGNED_OUT') {
        clearAuth();
        success('Signed out successfully');
      }

      if (event === 'USER_UPDATED') {
        if (session?.user) {
          setIsAnonymous(isAnonymousUser(session.user));
          await fetchUserProfile(session.user);
        }
      }
    });

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

      // ★ Role resolution:
      //   - If the profile row has a "chosen" role → use it.
      //   - Otherwise leave it as-is (e.g. 'customer') so the landing
      //     page's RoleChoiceBlock knows the user hasn't picked yet.
      const rawRole = profile?.role || null;
      const resolvedRole = rawRole || 'customer';

      const userData = {
        ...authUser,
        ...(profile || {}),
        role: resolvedRole,
        profile: profile || null,
      };

      setUser(userData);
      setUserRole(resolvedRole);

      return userData;
    } catch (err) {
      console.error('Profile fetch error:', err);
      setUser(authUser);
      setUserRole('customer');
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
    setIsAnonymous(false);
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

      // If this device has an anonymous session, upgrade instead of
      // creating a fresh identity — preserves their likes/comments/messages.
      const { data: current } = await supabase.auth.getUser();
      const hasAnonSession = isAnonymousUser(current?.user);

      if (hasAnonSession) {
        // Link identity: attach email + password to the existing anon user.
        // Then sign in with the password to get a fresh verified session.
        const { error: updateError } = await supabase.auth.updateUser({
          email: email.trim().toLowerCase(),
          password,
          data: { is_anonymous: false },
        });

        if (updateError) throw updateError;

        // Some Supabase versions don't flip is_anonymous in the JWT until
        // re-auth. Sign in explicitly to guarantee a fresh verified token.
        const { data, error: signInError } =
          await supabase.auth.signInWithPassword({
            email: email.trim().toLowerCase(),
            password,
          });
        if (signInError) throw signInError;

        if (data.session?.access_token) {
          localStorage.setItem('access_token', data.session.access_token);
          localStorage.setItem('refresh_token', data.session.refresh_token);
        }

        await fetchUserProfile(data.user);
        setSession(data.session);
        setIsAuthenticated(true);
        setIsAnonymous(false);
        scheduleTokenRefresh(data.session);

        return { success: true, user: data.user, upgraded: true };
      }

      // Normal login path (no anon session present)
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
      setIsAnonymous(isAnonymousUser(data.user));
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

      // If an anonymous session exists, upgrade in place instead of signUp.
      // This keeps the same user id, so likes/comments/messages survive.
      const { data: current } = await supabase.auth.getUser();
      const hasAnonSession = isAnonymousUser(current?.user);

      if (hasAnonSession) {
        const { error: updateError } = await supabase.auth.updateUser({
          email: email.trim().toLowerCase(),
          password,
          data: {
            full_name: fullName,
            phone: phone || null,
            role,
            is_anonymous: false,
          },
        });

        if (updateError) throw updateError;

        // Force a fresh verified session
        const { data, error: signInError } =
          await supabase.auth.signInWithPassword({
            email: email.trim().toLowerCase(),
            password,
          });
        if (signInError) throw signInError;

        if (data.session?.access_token) {
          localStorage.setItem('access_token', data.session.access_token);
          localStorage.setItem('refresh_token', data.session.refresh_token);
        }

        // ★ Also write the chosen role into profiles — this is what
        //   makes the RoleChoiceBlock disappear on next landing visit.
        try {
          await supabase
            .from('profiles')
            .update({
              role,
              full_name: fullName || null,
              phone: phone || null,
              updated_at: new Date().toISOString(),
            })
            .eq('id', data.user.id);
        } catch (profileErr) {
          console.warn('Could not write role to profile:', profileErr?.message);
        }

        await fetchUserProfile(data.user);
        setSession(data.session);
        setIsAuthenticated(true);
        setIsAnonymous(false);
        scheduleTokenRefresh(data.session);

        return { success: true, user: data.user, upgraded: true };
      }

      // Normal signup path — the handle_new_user trigger creates profiles row.
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            full_name: fullName,
            phone,
            role,
          },
        },
      });

      if (error) throw error;

      if (data.session?.access_token) {
        localStorage.setItem('access_token', data.session.access_token);
        localStorage.setItem('refresh_token', data.session.refresh_token);

        await fetchUserProfile(data.user);
        setSession(data.session);
        setIsAuthenticated(true);
        setIsAnonymous(false);
        scheduleTokenRefresh(data.session);
      } else {
        console.log(
          '📧 Awaiting email confirmation — session will arrive via SIGNED_IN event'
        );
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

      // Immediately start a new anonymous session so the user can keep browsing
      try {
        suppressNextWelcomeToast.current = true;
        await supabase.auth.signInAnonymously();
      } catch (anonErr) {
        console.warn(
          '⚠️ Could not start anonymous session after logout:',
          anonErr.message
        );
      }

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
  // SEND PASSWORD RESET
  // ============================================================
  const sendPasswordReset = async (email) => {
    try {
      const redirectTo = `${window.location.origin}/update-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        { redirectTo }
      );
      if (error) throw error;
      return { success: true };
    } catch (err) {
      console.error('❌ Password reset request error:', err);
      return { success: false, error: err.message };
    }
  };

  // ============================================================
  // SET ROLE AS BUYER (Model C — landing page block)
  //
  // Called when an anonymous user picks "I'm here to buy".
  // No signup, no auth call — just labels their profile so the
  // landing block disappears and personalization can kick in.
  // ============================================================
  const setRoleAsBuyer = async () => {
    try {
      if (!user?.id) throw new Error('No active session');

      const { data, error } = await supabase
        .from('profiles')
        .update({
          role: 'buyer',
          onboarding_completed: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;

      setUser((prev) => ({
        ...prev,
        ...data,
        role: 'buyer',
        profile: data,
      }));
      setUserRole('buyer');

      return { success: true, data };
    } catch (err) {
      console.error('❌ setRoleAsBuyer error:', err);
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
        buyer: ['admin', 'business', 'seller', 'buyer', 'both', 'customer'],
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
    isAnonymous,
    isVerified: isAuthenticated && !isAnonymous,
    authInitialized,
    login,
    register,
    logout,
    refreshToken,
    updateProfile,
    fetchUserProfile,
    sendPasswordReset,
    setRoleAsBuyer,
    hasChosenRole,           // exported helper for UI checks
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