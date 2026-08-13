// mobile/src/lib/supabase.js
import { createClient } from '@supabase/supabase-js';

// Environment validation
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;

const isConfigured = Boolean(supabaseUrl && supabaseKey);

if (!supabaseUrl) {
  console.error('❌ VITE_SUPABASE_URL is not defined');
}

if (!supabaseKey) {
  console.error('❌ VITE_SUPABASE_KEY is not defined');
}

// ✅ FIX: Use an invalid, fast-failing host instead of a plausible-looking
// placeholder domain. A fake "your-project.supabase.co" style URL causes
// the browser to hang on DNS/connection timeout (up to ~60s). An invalid
// TLD like ".local" fails almost immediately, so misconfiguration surfaces
// as a fast, visible error instead of a silent minute-long stall.
export const supabase = createClient(
  isConfigured ? supabaseUrl : 'https://invalid.local',
  isConfigured ? supabaseKey : 'invalid-key',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    },
    db: {
      schema: 'public',
    },
    global: {
      headers: {
        'x-application-name': 'kumsika-mobile',
      },
    },
  }
);

// Export this so other parts of the app (e.g. AuthContext) can check
// configuration status and short-circuit instead of waiting on a call
// that's doomed to fail.
export const isSupabaseConfigured = isConfigured;

// Helper: Get current session
export const getSession = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      console.error('Error getting session:', error);
      return null;
    }
    return session;
  } catch (error) {
    console.error('Session error:', error);
    return null;
  }
};

// Helper: Get current user
export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      console.error('Error getting user:', error);
      return null;
    }
    return user;
  } catch (error) {
    console.error('User error:', error);
    return null;
  }
};

export default supabase;