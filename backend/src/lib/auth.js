// backend/src/lib/auth.js
import { createClient } from '@supabase/supabase-js';
import { logger } from '../utils/logger.js';

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY
);

/**
 * Auth.js Configuration
 * This file provides authentication utilities for the application
 */
class AuthService {
  constructor() {
    this.supabase = supabase;
  }

  /**
   * Get current user from token
   */
  async getUser(token) {
    try {
      if (!token) {
        return { user: null, error: 'No token provided' };
      }

      const { data: { user }, error } = await this.supabase.auth.getUser(token);

      if (error) {
        logger.warn(`Token verification failed: ${error.message}`);
        return { user: null, error: error.message };
      }

      // Get user profile
      const { data: profile, error: profileError } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        logger.warn(`Profile fetch error: ${profileError.message}`);
      }

      return {
        user: {
          ...user,
          profile: profile || null,
        },
        error: null,
      };
    } catch (error) {
      logger.error('Get user error:', error);
      return { user: null, error: error.message };
    }
  }

  /**
   * Create a new user session
   */
  async createSession(userId, token, refreshToken) {
    try {
      // Store session in database (optional)
      const { data, error } = await this.supabase
        .from('sessions')
        .upsert({
          user_id: userId,
          token: token,
          refresh_token: refreshToken,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        })
        .select()
        .single();

      if (error) {
        logger.error('Session creation error:', error);
        return { session: null, error: error.message };
      }

      return { session: data, error: null };
    } catch (error) {
      logger.error('Create session error:', error);
      return { session: null, error: error.message };
    }
  }

  /**
   * Validate session token
   */
  async validateSession(token) {
    try {
      const { data: { user }, error } = await this.supabase.auth.getUser(token);

      if (error || !user) {
        return { valid: false, user: null, error: error?.message || 'Invalid token' };
      }

      return { valid: true, user, error: null };
    } catch (error) {
      return { valid: false, user: null, error: error.message };
    }
  }

  /**
   * Logout user
   */
  async logout(token) {
    try {
      const { error } = await this.supabase.auth.signOut();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, error: null };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Check if user is admin
   */
  async isAdmin(userId) {
    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      if (error) {
        return { isAdmin: false, error: error.message };
      }

      return { isAdmin: data?.role === 'admin', error: null };
    } catch (error) {
      return { isAdmin: false, error: error.message };
    }
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email) {
    try {
      // This is a simplified version - Supabase doesn't directly support
      // getting user by email via the admin API, but we can use the profile table
      const { data, error } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
        .single();

      if (error) {
        return { user: null, error: error.message };
      }

      return { user: data, error: null };
    } catch (error) {
      return { user: null, error: error.message };
    }
  }
}

// Create singleton instance
const authService = new AuthService();

export default authService;
export { authService, supabase };