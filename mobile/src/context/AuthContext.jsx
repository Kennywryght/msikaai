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

// How long we're willing to wait for Supabase before giving up and
// treating the user as logged out. This guarantees `loading` always
// resolves quickly, even if Supabase is down, misconfigured, or slow.
const AUTH_TIMEOUT_MS = 5000;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const initAuth = async () => {
      // If env vars are missing/invalid, don't even attempt the call —
      // fail immediately instead of waiting on a doomed request.
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
            `⚠️ Supabase getSession() timed out after ${AUTH_TIMEOUT_MS}ms — check env vars / network.`
          );
        }

        setUser(result.data?.session?.user ?? null);
        setIsAuthenticated(!!result.data?.session);
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
      return; // don't subscribe to auth changes on an invalid client
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
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

  const login = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      toast.success('Login successful! 🎉');
      return { success: true, user: data.user };
    } catch (error) {
      toast.error(error.message || 'Login failed');
      return { success: false, error };
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success('Logged out');
      return { success: true };
    } catch (error) {
      toast.error('Logout failed');
      return { success: false, error };
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;