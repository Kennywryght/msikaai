// backend/src/middleware/auth.js
import { createClient } from '@supabase/supabase-js';
import { logger } from '../utils/logger.js';
import { AppError, AuthError, ForbiddenError } from './errorHandler.js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

/**
 * Authenticate JWT token from Authorization header
 */
export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      throw new AuthError('No authorization header provided');
    }
    
    if (!authHeader.startsWith('Bearer ')) {
      throw new AuthError('Invalid authorization format. Use Bearer token');
    }
    
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      throw new AuthError('No token provided');
    }
    
    // Verify token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      logger.warn(`Invalid token attempt: ${error?.message || 'User not found'}`);
      throw new AuthError('Invalid or expired token');
    }
    
    // Attach user to request
    req.user = user;
    req.token = token;
    
    // Log successful auth
    logger.debug(`Authenticated user: ${user.id}`, { userId: user.id });
    
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Require admin role
 */
export const requireAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      throw new AuthError('Authentication required');
    }
    
    // Check user role from profiles table
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

/**
 * Check if user owns the resource
 */
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
      let resourceId;
      
      switch (resourceType) {
        case 'business':
          query = supabase.from('businesses').select('user_id').eq('id', id);
          break;
        case 'listing':
          query = supabase.from('listings').select('business_id').eq('id', id);
          break;
        case 'profile':
          // Profile ownership is simpler - just check the ID
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
      
      // For listing, need to check business ownership
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

/**
 * Optional authentication (doesn't require token, but attaches user if present)
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
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

/**
 * Rate limit by user ID
 */
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
    
    // Clean old requests
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