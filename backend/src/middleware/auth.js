// backend/src/middleware/auth.js
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { logger } from '../utils/logger.js';
import { AppError, AuthError, ForbiddenError } from './errorHandler.js';

// ✅ Load environment variables
dotenv.config();

// ✅ Debug: Log environment variable status
console.log('🔍 auth.js loaded:');
console.log(`   SUPABASE_URL: ${process.env.SUPABASE_URL ? '✅ Loaded' : '❌ Missing'}`);
console.log(`   SUPABASE_KEY: ${process.env.SUPABASE_KEY ? '✅ Loaded' : '❌ Missing'}`);

// ✅ Validate environment variables
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
  console.error('❌ ERROR: SUPABASE_URL or SUPABASE_KEY is missing in auth.js!');
  console.error('   Please check your .env file.');
  process.exit(1);
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export const authenticateToken = async (req, res, next) => {
  try {
    // Check cookie first, then Authorization header
    let token = req.cookies?.access_token;
    
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
      }
    }

    if (!token) {
      logger.warn('🔒 No authorization token provided');
      return res.status(401).json({
        success: false,
        error: 'Authorization required. Please log in.'
      });
    }

    logger.debug('🔍 Verifying token...');

    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      logger.warn(`🔒 Invalid token: ${error?.message || 'User not found'}`);
      // Clear invalid cookie
      res.clearCookie('access_token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
      });
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token. Please log in again.'
      });
    }

    req.user = user;
    req.token = token;

    logger.debug(`✅ Authenticated user: ${user.email} (${user.id})`);

    next();
  } catch (error) {
    logger.error('❌ Auth error:', error);
    return res.status(500).json({
      success: false,
      error: 'Authentication failed'
    });
  }
};

export const requireAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      throw new AuthError('Authentication required');
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', req.user.id)
      .single();

    if (error) {
      logger.error(`Admin check error: ${error.message}`, { userId: req.user.id });
      throw new AppError('Error checking permissions', 500);
    }

    if (!profile || profile.role !== 'admin') {
      logger.warn(`Non-admin access attempt`, { 
        userId: req.user.id, 
        role: profile?.role 
      });
      throw new ForbiddenError('Admin access required');
    }

    req.user.role = profile.role;
    next();
  } catch (error) {
    next(error);
  }
};

export const requireOwnership = (resourceType) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        throw new AuthError('Authentication required');
      }

      const { id } = req.params;
      const userId = req.user.id;

      if (!id) {
        throw new AppError('Resource ID is required', 400);
      }

      let query;

      switch (resourceType) {
        case 'business':
          query = supabase.from('businesses').select('user_id').eq('id', id);
          break;
        case 'listing':
          query = supabase.from('listings').select('business_id').eq('id', id);
          break;
        case 'profile':
          if (id !== userId) {
            throw new ForbiddenError('You can only access your own profile');
          }
          return next();
        case 'order':
          query = supabase.from('orders').select('user_id').eq('id', id);
          break;
        default:
          throw new AppError('Invalid resource type', 400);
      }

      const { data, error } = await query.single();

      if (error || !data) {
        throw new AppError('Resource not found', 404);
      }

      if (resourceType === 'listing') {
        const { data: business, error: businessError } = await supabase
          .from('businesses')
          .select('user_id')
          .eq('id', data.business_id)
          .single();

        if (businessError) {
          throw new AppError('Business not found', 404);
        }

        if (business.user_id !== userId) {
          throw new ForbiddenError('You do not own this listing');
        }
      } else if (data.user_id !== userId) {
        throw new ForbiddenError(`You do not own this ${resourceType}`);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

export const optionalAuth = async (req, res, next) => {
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
      const { data: { user }, error } = await supabase.auth.getUser(token);

      if (!error && user) {
        req.user = user;
        req.token = token;
        logger.debug(`Optional auth success: ${user.id}`);
      }
    }

    next();
  } catch (error) {
    // Don't fail on auth errors for optional auth
    next();
  }
};

export const userRateLimit = (maxRequests, windowMs) => {
  const userRequests = new Map();

  return (req, res, next) => {
    if (!req.user) {
      return next();
    }

    const userId = req.user.id;
    const now = Date.now();
    const windowStart = now - windowMs;

    if (!userRequests.has(userId)) {
      userRequests.set(userId, []);
    }

    const requests = userRequests.get(userId);
    const validRequests = requests.filter(time => time > windowStart);
    validRequests.push(now);
    userRequests.set(userId, validRequests);

    if (validRequests.length > maxRequests) {
      return res.status(429).json({
        success: false,
        error: 'User rate limit exceeded. Please slow down.',
        retryAfter: Math.ceil(windowMs / 1000),
      });
    }

    next();
  };
};

export default {
  authenticateToken,
  requireAdmin,
  requireOwnership,
  optionalAuth,
  userRateLimit,
};