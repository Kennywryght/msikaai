// backend/src/index.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import rateLimit from 'express-rate-limit';
import { v4 as uuidv4 } from 'uuid';
import helmet from 'helmet';
import compression from 'compression';

// Import middleware
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { authenticateToken } from './middleware/auth.js';
import { cacheMiddleware } from './middleware/cache.js';
import { logger, logHttpRequest } from './utils/logger.js';

// Import routes
import authRoutes from './api/auth.js';
import businessRoutes from './api/business.js';
import listingsRoutes from './api/listings.js';
import locationRoutes from './api/location.js';
import aiRoutes from './api/ai.js';
import profileRoutes from './api/profile.js';
import analyticsRoutes from './api/analytics.js';
import exportRoutes from './api/export.js';
import notificationsRoutes from './api/notifications.js';

// Load environment variables FIRST
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

// ============================================
// REQUEST ID MIDDLEWARE
// ============================================
app.use((req, res, next) => {
  req.requestId = req.headers['x-request-id'] || uuidv4();
  res.setHeader('X-Request-ID', req.requestId);
  next();
});

// ============================================
// ENVIRONMENT CHECK
// ============================================
logger.info('🔍 Checking environment variables:');
logger.info(`SUPABASE_URL: ${process.env.SUPABASE_URL ? '✅ Loaded' : '❌ Missing'}`);
logger.info(`SUPABASE_KEY: ${process.env.SUPABASE_KEY ? '✅ Loaded' : '❌ Missing'}`);
logger.info(`SUPABASE_SERVICE_KEY: ${process.env.SUPABASE_SERVICE_KEY ? '✅ Loaded' : '❌ Missing'}`);
logger.info(`PORT: ${process.env.PORT || 3000}`);
logger.info(`NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
logger.info(`FRONTEND_URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);

// Validate required environment variables
const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_KEY'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  logger.error('❌ ERROR: Missing required environment variables!');
  missingVars.forEach(varName => logger.error(`   - ${varName}`));
  logger.error('\n📝 Please check your .env file and make sure all variables are set.');
  logger.error('💡 Copy .env.example to .env and fill in your values.');
  process.exit(1);
}

// Initialize Supabase client
let supabase;
try {
  supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY,
    {
      auth: {
        autoRefreshToken: true,
        persistSession: false,
        detectSessionInUrl: false,
      },
      db: {
        schema: 'public',
      },
      global: {
        headers: {
          'x-application-name': 'msikaai-backend',
        },
      },
    }
  );
  logger.info('✅ Supabase client initialized');
} catch (error) {
  logger.error(`❌ Failed to initialize Supabase client: ${error.message}`);
  process.exit(1);
}

// ============================================
// SECURITY & PERFORMANCE MIDDLEWARE
// ============================================

// Helmet - Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}));

// CORS configuration
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'https://msikaai.vercel.app',
  'https://msikaai-mauve.vercel.app',
  'https://msikaai-backend.onrender.com',
  'https://msikaai.onrender.com'
].filter(Boolean);

// Remove duplicates
const uniqueOrigins = [...new Set(allowedOrigins)];

logger.info(`🌐 Allowed origins: ${uniqueOrigins.join(', ')}`);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (uniqueOrigins.indexOf(origin) !== -1 || !isProduction) {
      callback(null, true);
    } else {
      logger.warn(`❌ CORS blocked for origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Request-ID'],
  exposedHeaders: ['X-Request-ID'],
}));

// Compression
app.use(compression({
  level: 6,
  threshold: 1024,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) return false;
    return compression.filter(req, res);
  },
}));

// Body parsers
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// HTTP request logging
app.use(logHttpRequest);

// ============================================
// RATE LIMITING - FIXED with validate options
// ============================================

// General rate limiter - 100 requests per 15 minutes
const generalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    success: false,
    error: 'Too many requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // ✅ FIX: Disable trust proxy validation
  validate: {
    trustProxy: false,
    xForwardedForHeader: false,
  },
  keyGenerator: (req) => req.ip,
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      error: 'Too many requests, please try again later.',
      requestId: req.requestId,
    });
  },
});

// Stricter limiter for auth routes - 20 requests per 15 minutes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: {
    success: false,
    error: 'Too many login attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // ✅ FIX: Disable trust proxy validation
  validate: {
    trustProxy: false,
    xForwardedForHeader: false,
  },
  keyGenerator: (req) => req.ip,
  handler: (req, res) => {
    logger.warn(`Auth rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      error: 'Too many login attempts, please try again later.',
      requestId: req.requestId,
    });
  },
});

// Stricter limiter for AI routes - 50 requests per 15 minutes
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: {
    success: false,
    error: 'Too many AI requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // ✅ FIX: Disable trust proxy validation
  validate: {
    trustProxy: false,
    xForwardedForHeader: false,
  },
  keyGenerator: (req) => req.ip,
  handler: (req, res) => {
    logger.warn(`AI rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      error: 'Too many AI requests, please try again later.',
      requestId: req.requestId,
    });
  },
});

// Apply rate limiters
app.use('/api', generalLimiter);
app.use('/api/auth', authLimiter);
app.use('/api/ai', aiLimiter);

// ============================================
// HEALTH CHECK
// ============================================
app.get('/health', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { error } = await supabase
      .from('profiles')
      .select('count', { head: true })
      .limit(1);
    
    const responseTime = Date.now() - startTime;
    
    res.json({
      status: 'healthy',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      responseTime: `${responseTime}ms`,
      database: error ? 'disconnected' : 'connected',
      environment: process.env.NODE_ENV,
      requestId: req.requestId,
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      requestId: req.requestId,
    });
  }
});

// ============================================
// API ROUTES
// ============================================

// Public routes
app.use('/api/auth', authRoutes);
app.use('/api/location', locationRoutes);

// Protected routes (require authentication)
app.use('/api/business', authenticateToken, businessRoutes);
app.use('/api/listings', authenticateToken, listingsRoutes);
app.use('/api/profile', authenticateToken, profileRoutes);
app.use('/api/analytics', authenticateToken, analyticsRoutes);
app.use('/api/notifications', authenticateToken, notificationsRoutes);
app.use('/api/export', authenticateToken, exportRoutes);

// AI routes with additional rate limiting
app.use('/api/ai', authenticateToken, aiLimiter, aiRoutes);

// ============================================
// 404 & ERROR HANDLING
// ============================================
app.use(notFoundHandler);
app.use(errorHandler);

// ============================================
// START SERVER - ✅ FIXED: Bind to 0.0.0.0
// ============================================
const server = app.listen(PORT, '0.0.0.0', () => {
  const startupMessage = `
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║  🚀 MsikaAI Server is running!                              ║
║                                                              ║
║  📡 URL:      https://msikaai.onrender.com                  ║
║  🌍 Environment: ${process.env.NODE_ENV || 'development'}                               ║
║  🔗 Health:   https://msikaai.onrender.com/health           ║
║  ⏰ Started:  ${new Date().toISOString()}           ║
║  🔑 Request ID: ${uuidv4()}                   ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
  `;
  
  console.log(startupMessage);
  logger.info(`Server started on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV}`);
});

// ============================================
// GRACEFUL SHUTDOWN
// ============================================
const gracefulShutdown = (signal) => {
  logger.info(`Received ${signal}, starting graceful shutdown...`);
  
  server.close(() => {
    logger.info('HTTP server closed');
    logger.info('Graceful shutdown complete');
    process.exit(0);
  });
  
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Unhandled errors
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

export default app;