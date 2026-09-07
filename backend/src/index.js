// backend/src/index.js
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// ✅ Load environment variables FIRST, before any other imports
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

// ✅ Debug: Check environment variables
console.log('🔍 index.js - Checking environment variables:');
console.log(`   SUPABASE_URL: ${process.env.SUPABASE_URL ? '✅ Loaded' : '❌ Missing'}`);
console.log(`   SUPABASE_KEY: ${process.env.SUPABASE_KEY ? '✅ Loaded' : '❌ Missing'}`);
console.log(`   DATABASE_URL: ${process.env.DATABASE_URL ? '✅ Loaded' : '❌ Missing'}`);
console.log(`   REDIS_URL: ${process.env.REDIS_URL ? '✅ Loaded' : '❌ Missing'}`);
console.log(`   RABBITMQ_URL: ${process.env.RABBITMQ_URL ? '✅ Loaded' : '❌ Missing'}`);
console.log(`   MEILISEARCH_HOST: ${process.env.MEILISEARCH_HOST ? '✅ Loaded' : '❌ Missing'}`);
console.log(`   CLOUDINARY_CLOUD_NAME: ${process.env.CLOUDINARY_CLOUD_NAME ? '✅ Loaded' : '❌ Missing'}`);
console.log(`   RESEND_API_KEY: ${process.env.RESEND_API_KEY ? '✅ Loaded' : '❌ Missing'}`);

// ✅ Validate required environment variables
const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_KEY', 'DATABASE_URL'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ ERROR: Missing required environment variables!');
  missingVars.forEach(varName => console.error(`   - ${varName}`));
  console.error('\n📝 Please check your .env file and make sure all variables are set.');
  process.exit(1);
}

// Now import the rest
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { createClient } from '@supabase/supabase-js';
import rateLimit from 'express-rate-limit';
import { v4 as uuidv4 } from 'uuid';
import helmet from 'helmet';
import compression from 'compression';

// Import middleware
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { authenticateToken } from './middleware/auth.js';
import { cacheMiddleware, getCacheStats, clearCache } from './middleware/cache.js';
import { logger, logHttpRequest } from './utils/logger.js';

// Import database
import { testConnection } from './db/index.js';
import dbService from './services/dbService.js';

// Import Redis
import redisService from './services/redisService.js';

// ============================================
// PHASE 4: IMPORT QUEUE SERVICE
// ============================================
import queueService from './services/queueService.js';

// ============================================
// PHASE 5: IMPORT SEARCH SERVICE
// ============================================
import searchService from './services/searchService.js';

// ============================================
// PHASE 6: IMPORT CLOUDINARY SERVICE
// ============================================
import cloudinaryService from './services/cloudinaryService.js';

// ============================================
// PHASE 7: IMPORT EMAIL SERVICE
// ============================================
import emailService from './services/emailService.js';

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
import matchingRoutes from './api/matching.js';
import paymentRoutes from './api/payment.js';
// ============================================
// PHASE 5: IMPORT SEARCH ROUTES
// ============================================
import searchRoutes from './api/search.js';

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
logger.info(`DATABASE_URL: ${process.env.DATABASE_URL ? '✅ Loaded' : '❌ Missing'}`);
logger.info(`REDIS_URL: ${process.env.REDIS_URL ? '✅ Loaded' : '❌ Missing'}`);
logger.info(`RABBITMQ_URL: ${process.env.RABBITMQ_URL ? '✅ Loaded' : '❌ Missing'}`);
logger.info(`MEILISEARCH_HOST: ${process.env.MEILISEARCH_HOST ? '✅ Loaded' : '❌ Missing'}`);
logger.info(`CLOUDINARY_CLOUD_NAME: ${process.env.CLOUDINARY_CLOUD_NAME ? '✅ Loaded' : '❌ Missing'}`);
logger.info(`RESEND_API_KEY: ${process.env.RESEND_API_KEY ? '✅ Loaded' : '❌ Missing'}`);
logger.info(`PORT: ${process.env.PORT || 3000}`);
logger.info(`NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
logger.info(`FRONTEND_URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);

// Validate required environment variables
const requiredEnvVars2 = ['SUPABASE_URL', 'SUPABASE_KEY', 'DATABASE_URL'];
const missingVars2 = requiredEnvVars2.filter(varName => !process.env[varName]);

if (missingVars2.length > 0) {
  logger.error('❌ ERROR: Missing required environment variables!');
  missingVars2.forEach(varName => logger.error(`   - ${varName}`));
  logger.error('\n📝 Please check your .env file and make sure all variables are set.');
  process.exit(1);
}

// ============================================
// DATABASE CONNECTION
// ============================================
let dbConnected = false;
try {
  dbConnected = await testConnection();
  if (dbConnected) {
    logger.info('✅ Database connection tested successfully');
  } else {
    logger.warn('⚠️ Database connection failed, but continuing...');
  }
} catch (error) {
  logger.error('❌ Database connection test failed:', error.message);
  logger.warn('⚠️ Continuing without database connection...');
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
// REDIS CONNECTION
// ============================================
let redisConnected = false;
try {
  redisConnected = await redisService.connect();
  if (redisConnected) {
    logger.info('✅ Redis service connected successfully');
  } else {
    logger.warn('⚠️ Redis not connected, using memory cache fallback');
  }
} catch (error) {
  logger.warn('⚠️ Redis initialization failed:', error.message);
  // Continue without Redis - fallback to memory cache
}

// ============================================
// PHASE 4: QUEUE SERVICE CONNECTION
// ============================================
let queueConnected = false;
try {
  // Wait a bit for connection
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Check if queue service is connected
  if (queueService.isConnected) {
    logger.info('✅ Queue service (RabbitMQ) connected successfully');
    queueConnected = true;
  } else {
    logger.warn('⚠️ Queue service not connected, using direct processing fallback');
  }
} catch (error) {
  logger.warn('⚠️ Queue service initialization warning:', error.message);
  // Continue without queue - fallback to direct processing
}

// ============================================
// PHASE 5: SEARCH SERVICE CONNECTION
// ============================================
let searchConnected = false;
try {
  // Check if search service is connected
  if (searchService.isConnected) {
    logger.info('✅ Search service (Meilisearch) connected successfully');
    searchConnected = true;
  } else {
    logger.warn('⚠️ Search service not connected, using database search fallback');
  }
} catch (error) {
  logger.warn('⚠️ Search service initialization warning:', error.message);
  // Continue without search - fallback to database search
}

// ============================================
// PHASE 6: CLOUDINARY SERVICE
// ============================================
let cloudinaryConnected = false;
try {
  if (cloudinaryService.isConfigured) {
    logger.info('✅ Cloudinary service configured successfully');
    cloudinaryConnected = true;
  } else {
    logger.warn('⚠️ Cloudinary not configured, using Supabase storage fallback');
  }
} catch (error) {
  logger.warn('⚠️ Cloudinary initialization warning:', error.message);
  // Continue without Cloudinary - fallback to Supabase
}

// ============================================
// PHASE 7: EMAIL SERVICE
// ============================================
let emailConnected = false;
try {
  if (emailService.isConfigured) {
    logger.info('✅ Email service (Resend) configured successfully');
    emailConnected = true;
  } else {
    logger.warn('⚠️ Email service not configured, email sending disabled');
  }
} catch (error) {
  logger.warn('⚠️ Email service initialization warning:', error.message);
}

// ============================================
// SECURITY & PERFORMANCE MIDDLEWARE
// ============================================

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:", "https://res.cloudinary.com"],
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

// ============================================
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

const uniqueOrigins = [...new Set(allowedOrigins)];

const vercelPreviewPattern = /^https:\/\/msikaai-[a-z0-9]+-kennedy-bandas-projects\.vercel\.app$/;

logger.info(`🌐 Allowed origins: ${uniqueOrigins.join(', ')} + Vercel preview deployments`);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    const isExplicitlyAllowed = uniqueOrigins.indexOf(origin) !== -1;
    const isVercelPreview = vercelPreviewPattern.test(origin);

    if (isExplicitlyAllowed || isVercelPreview || !isProduction) {
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

// ============================================
// COOKIE PARSER MIDDLEWARE
// ============================================
app.use(cookieParser());

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

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: {
    success: false,
    error: 'Too many login attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
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

const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: {
    success: false,
    error: 'Too many AI requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
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

app.use('/api', generalLimiter);
app.use('/api/auth', authLimiter);
app.use('/api/ai', aiLimiter);

// ============================================
// HEALTH CHECK
// ============================================
app.get('/health', async (req, res) => {
  const startTime = Date.now();

  try {
    // Check database connection via Supabase
    const { error } = await supabase
      .from('profiles')
      .select('count', { head: true })
      .limit(1);

    const responseTime = Date.now() - startTime;

    // Check Redis connection
    const redisStatus = redisService.isConnected ? 'connected' : 'disconnected';

    // Check Queue connection
    const queueStatus = queueService.isConnected ? 'connected' : 'disconnected';

    // Check Search connection
    const searchStatus = searchService.isConnected ? 'connected' : 'disconnected';

    // Check Cloudinary status
    const cloudinaryStatus = cloudinaryService.isConfigured ? 'configured' : 'not configured';

    // Check Email status
    const emailStatus = emailService.isConfigured ? 'configured' : 'not configured';

    // Get queue stats if connected
    let queueStats = null;
    if (queueService.isConnected) {
      try {
        const notificationsStats = await queueService.getQueueStats('notifications');
        const emailStats = await queueService.getQueueStats('email');
        const analyticsStats = await queueService.getQueueStats('analytics');
        queueStats = {
          notifications: notificationsStats,
          email: emailStats,
          analytics: analyticsStats,
        };
      } catch (e) {
        // Ignore stats error
      }
    }

    // Get search stats if connected
    let searchStats = null;
    if (searchService.isConnected) {
      try {
        searchStats = await searchService.getStats();
      } catch (e) {
        // Ignore stats error
      }
    }

    // Get Cloudinary stats if configured
    let cloudinaryStats = null;
    if (cloudinaryService.isConfigured) {
      try {
        cloudinaryStats = await cloudinaryService.getStorageStats();
      } catch (e) {
        // Ignore stats error
      }
    }

    // Get Email stats
    const emailStats = {
      configured: emailService.isConfigured,
      enabled: emailService.isEnabled,
      fromEmail: emailService.fromEmail,
    };

    res.json({
      status: 'healthy',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      responseTime: `${responseTime}ms`,
      database: error ? 'disconnected' : 'connected',
      redis: redisStatus,
      queue: queueStatus,
      search: searchStatus,
      cloudinary: cloudinaryStatus,
      email: emailStatus,
      queueStats: queueStats,
      searchStats: searchStats,
      cloudinaryStats: cloudinaryStats,
      emailStats: emailStats,
      environment: process.env.NODE_ENV,
      requestId: req.requestId,
    });
  } catch (error) {
    logger.error('Health check error:', error);
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      requestId: req.requestId,
    });
  }
});

// ============================================
// PHASE 4: QUEUE STATUS ENDPOINT
// ============================================
app.get('/api/admin/queue/status', authenticateToken, async (req, res) => {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', req.user.id)
      .single();

    if (profile?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    const status = queueService.status;
    const stats = {};
    
    if (queueService.isConnected) {
      for (const [name, queue] of Object.entries(queueService.queues)) {
        stats[name] = await queueService.getQueueStats(queue);
      }
    }

    res.json({
      success: true,
      status: status,
      queueStats: stats,
    });
  } catch (error) {
    logger.error('Queue status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get queue status'
    });
  }
});

app.post('/api/admin/queue/purge/:queue', authenticateToken, async (req, res) => {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', req.user.id)
      .single();

    if (profile?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    const { queue } = req.params;
    const result = await queueService.purgeQueue(queue);
    
    res.json({
      success: result,
      message: result ? `Queue ${queue} purged successfully` : `Failed to purge queue ${queue}`,
    });
  } catch (error) {
    logger.error('Queue purge error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to purge queue'
    });
  }
});

// ============================================
// CACHE MANAGEMENT ROUTES
// ============================================
app.get('/api/admin/cache/stats', authenticateToken, async (req, res) => {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', req.user.id)
      .single();

    if (profile?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    const stats = getCacheStats();
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    logger.error('Cache stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get cache stats'
    });
  }
});

app.post('/api/admin/cache/clear', authenticateToken, async (req, res) => {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', req.user.id)
      .single();

    if (profile?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    const count = await clearCache();
    res.json({
      success: true,
      cleared: count,
      message: `Cleared ${count} cache entries`
    });
  } catch (error) {
    logger.error('Clear cache error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear cache'
    });
  }
});

// ============================================
// EMAIL TEST ENDPOINT (Admin only)
// ============================================
app.post('/api/admin/email/test', authenticateToken, async (req, res) => {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', req.user.id)
      .single();

    if (profile?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    const { email } = req.body;
    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email address is required'
      });
    }

    // Send test email
    const result = await emailService.sendWelcomeEmail(email, {
      name: 'Test User',
      verificationLink: 'https://msikaai.com/verify',
    });

    return res.json({
      success: result.success,
      message: result.success ? 'Test email sent successfully' : 'Failed to send test email',
      result,
    });
  } catch (error) {
    logger.error('Test email error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ============================================
// EMAIL STATUS ENDPOINT
// ============================================
app.get('/api/admin/email/status', authenticateToken, async (req, res) => {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', req.user.id)
      .single();

    if (profile?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    const status = emailService.getStatus();

    res.json({
      success: true,
      status,
    });
  } catch (error) {
    logger.error('Email status error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ============================================
// API ROUTES
// ============================================

app.use('/api/auth', authRoutes);
app.use('/api/location', locationRoutes);
app.use('/api/listings', listingsRoutes);
app.use('/api/business', authenticateToken, businessRoutes);
app.use('/api/profile', authenticateToken, profileRoutes);
app.use('/api/analytics', authenticateToken, analyticsRoutes);
app.use('/api/notifications', authenticateToken, notificationsRoutes);
app.use('/api/export', authenticateToken, exportRoutes);
app.use('/api/matching', authenticateToken, matchingRoutes);
app.use('/api/ai', authenticateToken, aiLimiter, aiRoutes);
app.use('/api/payment', authenticateToken, paymentRoutes);
// ============================================
// PHASE 5: SEARCH ROUTES
// ============================================
app.use('/api/search', searchRoutes);

// ============================================
// 404 & ERROR HANDLING
// ============================================
app.use(notFoundHandler);
app.use(errorHandler);

// ============================================
// START SERVER
// ============================================
const server = app.listen(PORT, '0.0.0.0', () => {
  const startupMessage = `
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║  🚀 MsikaAI Server is running!                              ║
║                                                              ║
║  📡 URL:      http://localhost:${PORT}                        ║
║  🌍 Environment: ${process.env.NODE_ENV || 'development'}                               ║
║  🔗 Health:   http://localhost:${PORT}/health                 ║
║  ⏰ Started:  ${new Date().toISOString()}           ║
║  🔑 Request ID: ${uuidv4()}                   ║
║                                                              ║
║  🗄️  Database:  ${dbConnected ? '✅ Connected' : '❌ Disconnected'}                    ║
║  🚀  Cache:     Redis (${redisConnected ? '✅ Connected' : '❌ Disconnected'})      ║
║  📨  Queue:     RabbitMQ (${queueConnected ? '✅ Connected' : '❌ Disconnected'})    ║
║  🔍  Search:    Meilisearch (${searchConnected ? '✅ Connected' : '❌ Disconnected'})  ║
║  🖼️  Storage:   Cloudinary (${cloudinaryConnected ? '✅ Configured' : '❌ Using Supabase'})  ║
║  ✉️  Email:     Resend (${emailConnected ? '✅ Configured' : '❌ Disabled'})      ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
  `;

  console.log(startupMessage);
  logger.info(`Server started on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV}`);
  logger.info(`Database: ${dbConnected ? 'Connected' : 'Disconnected'}`);
  logger.info(`Redis: ${redisConnected ? 'Connected' : 'Disconnected (using memory cache)'}`);
  logger.info(`Queue: ${queueConnected ? 'Connected' : 'Disconnected (using direct processing)'}`);
  logger.info(`Search: ${searchConnected ? 'Connected' : 'Disconnected (using database search)'}`);
  logger.info(`Cloudinary: ${cloudinaryConnected ? 'Configured' : 'Using Supabase storage'}`);
  logger.info(`Email: ${emailConnected ? 'Configured' : 'Disabled'}`);
});

// ============================================
// GRACEFUL SHUTDOWN
// ============================================
const gracefulShutdown = async (signal) => {
  logger.info(`Received ${signal}, starting graceful shutdown...`);

  // Close Redis connection
  if (redisService) {
    try {
      await redisService.disconnect();
      logger.info('✅ Redis disconnected');
    } catch (error) {
      logger.error('❌ Redis disconnect error:', error.message);
    }
  }

  // Close Queue connection
  if (queueService) {
    try {
      await queueService.close();
      logger.info('✅ Queue disconnected');
    } catch (error) {
      logger.error('❌ Queue disconnect error:', error.message);
    }
  }

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

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

export default app;