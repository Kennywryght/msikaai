// mobile/src/lib/supabase.js
import { createClient } from '@supabase/supabase-js';

// Environment validation
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;

if (!supabaseUrl) {
  console.error('❌ VITE_SUPABASE_URL is not defined');
}

if (!supabaseKey) {
  console.error('❌ VITE_SUPABASE_KEY is not defined');
}

// Create Supabase client with proper configuration
export const supabase = createClient(
  supabaseUrl || 'https://your-project.supabase.co',
  supabaseKey || 'your-anon-key',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
      // ✅ IMPORTANT: Don't store session in localStorage if you're having issues
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