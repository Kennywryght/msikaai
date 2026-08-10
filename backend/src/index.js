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
// TRUST PROXY (Required for Render)
// ============================================
app.set('trust proxy', true);

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

logger.info(`🌐 Allowed origins: ${allowedOrigins.join(', ')}`);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || !isProduction) {
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
// RATE LIMITING
// ============================================

const generalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    success: false,
    error: 'Too many requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
<<<<<<< HEAD
  keyGenerator: (req) => req.ip,
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      error: 'Too many requests, please try again later.',
      requestId: req.requestId,
    });
=======
  validate: {
    xForwardedForHeader: false,
>>>>>>> f999e5c291c720ffc4888eccce191599ef35b652
  },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: {
    success: false,
    error: 'Too many login attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
<<<<<<< HEAD
  keyGenerator: (req) => req.ip,
=======
  validate: {
    xForwardedForHeader: false,
  },
>>>>>>> f999e5c291c720ffc4888eccce191599ef35b652
});

const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: {
    success: false,
    error: 'Too many AI requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
<<<<<<< HEAD
  keyGenerator: (req) => req.ip,
=======
  validate: {
    xForwardedForHeader: false,
  },
>>>>>>> f999e5c291c720ffc4888eccce191599ef35b652
});

// Apply rate limiters
app.use('/api', generalLimiter);
app.use('/api/auth', authLimiter);
app.use('/api/ai', aiLimiter);

// ============================================
<<<<<<< HEAD
// HEALTH CHECK
// ============================================
app.get('/health', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { error } = await supabase
=======
// CORS CONFIGURATION
// ============================================

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

console.log('🌐 Allowed origins:', uniqueOrigins);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (uniqueOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      console.warn('❌ CORS blocked for origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Body parsers
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ============================================
// REQUEST LOGGING (Development only)
// ============================================
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`📝 ${req.method} ${req.url}`);
    next();
  });
}

// ============================================
// ROUTES - Register all API routes
// ============================================

// Health check - Detailed
app.get('/api/health', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { data, error } = await supabase
>>>>>>> f999e5c291c720ffc4888eccce191599ef35b652
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
<<<<<<< HEAD
      environment: process.env.NODE_ENV,
      requestId: req.requestId,
=======
      memoryUsage: {
        rss: `${Math.round(process.memoryUsage().rss / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`,
        heapUsed: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`
      },
      environment: process.env.NODE_ENV || 'development',
      cors: {
        allowedOrigins: uniqueOrigins
      }
>>>>>>> f999e5c291c720ffc4888eccce191599ef35b652
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

<<<<<<< HEAD
// Public routes
app.use('/api/auth', authRoutes);
=======
// ============================================
// API ROUTES - Mount all route handlers
// ============================================
app.use('/api/auth', authRoutes);
app.use('/api/business', businessRoutes);
app.use('/api/listings', listingsRoutes);  // ✅ This registers /api/listings/*
>>>>>>> f999e5c291c720ffc4888eccce191599ef35b652
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
<<<<<<< HEAD
app.use(notFoundHandler);
app.use(errorHandler);
=======
app.use((req, res) => {
  console.warn(`⚠️ 404 Not Found: ${req.method} ${req.path}`);
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.path} not found`
  });
});
>>>>>>> f999e5c291c720ffc4888eccce191599ef35b652

// ============================================
// START SERVER
// ============================================
const server = app.listen(PORT, '0.0.0.0', () => {
  const startupMessage = `
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║  🚀 MsikaAI Server is running!                              ║
║                                                              ║
║  📡 URL:      http://localhost:${PORT}                          ║
║  🌍 Environment: ${process.env.NODE_ENV || 'development'}                               ║
║  🔗 Health:   http://localhost:${PORT}/health                  ║
║  ⏰ Started:  ${new Date().toISOString()}           ║
║  🔑 Request ID: ${uuidv4()}                   ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
  `;
  
<<<<<<< HEAD
  console.log(startupMessage);
  logger.info(`Server started on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV}`);
=======
  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      success: false,
      error: 'Request entity too large'
    });
  }
  
  res.status(500).json({
    success: false,
    error: err.message || 'Internal server error'
  });
>>>>>>> f999e5c291c720ffc4888eccce191599ef35b652
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

<<<<<<< HEAD
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
=======
process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully...');
  process.exit(0);
});

// ============================================
// START SERVER
// ============================================
app.listen(PORT, '0.0.0.0', () => {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 MsikaAI Server is running!');
  console.log('='.repeat(60));
  console.log(`📡 Server URL: https://msikaai.onrender.com`);
  console.log(`🔗 Health Check: https://msikaai.onrender.com/api/health`);
  console.log(`🗄️ Database: ${process.env.SUPABASE_URL}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('\n📋 API Endpoints:');
  console.log(`   🔐 Auth: /api/auth`);
  console.log(`   🏪 Business: /api/business`);
  console.log(`   📦 Listings: /api/listings`);
  console.log(`   🔍 Search: /api/listings/search  ⭐`);
  console.log(`   📍 Location: /api/location`);
  console.log(`   🤖 AI: /api/ai`);
  console.log(`   👤 Profile: /api/profile`);
  console.log(`   📊 Analytics: /api/analytics`);
  console.log(`   📤 Export: /api/export`);
  console.log(`   🔔 Notifications: /api/notifications`);
  console.log('='.repeat(60) + '\n');
>>>>>>> f999e5c291c720ffc4888eccce191599ef35b652
});

export default app;
