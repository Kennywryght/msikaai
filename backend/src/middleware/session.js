// backend/src/middleware/session.js
import { logger } from '../utils/logger.js';
import authService from '../lib/auth.js';

/**
 * Session middleware - validates session token from cookie or header
 */
export const sessionMiddleware = async (req, res, next) => {
  try {
    // Check cookie first, then Authorization header
    let token = req.cookies?.access_token;
    
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
      }
    }

    if (token) {
      const { user, error } = await authService.getUser(token);
      
      if (!error && user) {
        req.user = user;
        req.token = token;
        req.isAuthenticated = true;
        logger.debug(`Session authenticated: ${user.email} (${user.id})`);
      } else {
        // Clear invalid cookie
        res.clearCookie('access_token', {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
        });
        req.isAuthenticated = false;
      }
    } else {
      req.isAuthenticated = false;
    }

    next();
  } catch (error) {
    logger.error('Session middleware error:', error);
    req.isAuthenticated = false;
    next();
  }
};

/**
 * Require authentication middleware
 */
export const requireAuth = async (req, res, next) => {
  try {
    if (!req.isAuthenticated || !req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required. Please log in.',
        code: 'AUTH_REQUIRED',
      });
    }

    // Check if session is still valid
    const { valid, error } = await authService.validateSession(req.token);
    
    if (!valid) {
      res.clearCookie('access_token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
      });
      return res.status(401).json({
        success: false,
        error: error || 'Session expired. Please log in again.',
        code: 'SESSION_EXPIRED',
      });
    }

    next();
  } catch (error) {
    logger.error('Require auth error:', error);
    return res.status(500).json({
      success: false,
      error: 'Authentication failed',
    });
  }
};

/**
 * Optional authentication middleware
 */
export const optionalAuth = async (req, res, next) => {
  try {
    let token = req.cookies?.access_token;
    
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
      }
    }

    if (token) {
      const { user, error } = await authService.getUser(token);
      if (!error && user) {
        req.user = user;
        req.token = token;
        req.isAuthenticated = true;
      }
    }

    next();
  } catch (error) {
    // Don't fail on optional auth
    next();
  }
};

/**
 * Require admin middleware
 */
export const requireAdmin = async (req, res, next) => {
  try {
    if (!req.isAuthenticated || !req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }

    const { isAdmin, error } = await authService.isAdmin(req.user.id);
    
    if (error || !isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Admin access required',
      });
    }

    next();
  } catch (error) {
    logger.error('Require admin error:', error);
    return res.status(500).json({
      success: false,
      error: 'Permission check failed',
    });
  }
};

/**
 * Get session info
 */
export const getSessionInfo = async (req, res) => {
  try {
    let token = req.cookies?.access_token;
    
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
      }
    }

    if (!token) {
      return {
        authenticated: false,
        session: null,
        error: null,
      };
    }

    const { user, error } = await authService.getUser(token);
    
    if (error || !user) {
      return {
        authenticated: false,
        session: null,
        error: error || 'Invalid session',
      };
    }

    return {
      authenticated: true,
      session: {
        user: {
          id: user.id,
          email: user.email,
          full_name: user.profile?.full_name || user.user_metadata?.full_name,
          role: user.profile?.role || 'customer',
        },
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      error: null,
    };
  } catch (error) {
    return {
      authenticated: false,
      session: null,
      error: error.message,
    };
  }
};

export default {
  sessionMiddleware,
  requireAuth,
  optionalAuth,
  requireAdmin,
  getSessionInfo,
};