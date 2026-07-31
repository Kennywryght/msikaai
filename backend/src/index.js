// backend/src/index.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import rateLimit from 'express-rate-limit';

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

// ============================================
// TRUST PROXY (Required for Render)
// ============================================
app.set('trust proxy', true);

// ============================================
// ENVIRONMENT CHECK
// ============================================
console.log('🔍 Checking environment variables:');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? '✅ Loaded' : '❌ Missing');
console.log('SUPABASE_KEY:', process.env.SUPABASE_KEY ? '✅ Loaded' : '❌ Missing');
console.log('SUPABASE_SERVICE_KEY:', process.env.SUPABASE_SERVICE_KEY ? '✅ Loaded' : '❌ Missing');
console.log('PORT:', process.env.PORT || 3000);
console.log('NODE_ENV:', process.env.NODE_ENV || 'development');
console.log('FRONTEND_URL:', process.env.FRONTEND_URL || 'http://localhost:5173');

// Validate required environment variables
const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_KEY'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ ERROR: Missing required environment variables!');
  missingVars.forEach(varName => console.error(`   - ${varName}`));
  console.error('\n📝 Please check your .env file and make sure all variables are set.');
  console.error('💡 Copy .env.example to .env and fill in your values.');
  process.exit(1);
}

// Initialize Supabase client
let supabase;
try {
  supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
  );
  console.log('✅ Supabase client initialized');
} catch (error) {
  console.error('❌ Failed to initialize Supabase client:', error.message);
  process.exit(1);
}

// ============================================
// RATE LIMITING
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
  validate: {
    xForwardedForHeader: false,
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
  validate: {
    xForwardedForHeader: false,
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
  validate: {
    xForwardedForHeader: false,
  },
});

// Apply rate limiters
app.use('/api', generalLimiter);
app.use('/api/auth', authLimiter);
app.use('/api/ai', aiLimiter);

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
      .from('profiles')
      .select('count')
      .limit(1);
    
    const responseTime = Date.now() - startTime;
    
    res.json({
      status: 'healthy',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      responseTime: `${responseTime}ms`,
      database: error ? 'disconnected' : 'connected',
      memoryUsage: {
        rss: `${Math.round(process.memoryUsage().rss / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`,
        heapUsed: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`
      },
      environment: process.env.NODE_ENV || 'development',
      cors: {
        allowedOrigins: uniqueOrigins
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});

// Test database connection
app.get('/api/test-db', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (error) throw error;
    
    res.json({
      success: true,
      message: 'Database connected successfully',
      data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================
// API ROUTES - Mount all route handlers
// ============================================
app.use('/api/auth', authRoutes);
app.use('/api/business', businessRoutes);
app.use('/api/listings', listingsRoutes);  // ✅ This registers /api/listings/*
app.use('/api/location', locationRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/notifications', notificationsRoutes);

// ============================================
// 404 HANDLER
// ============================================
app.use((req, res) => {
  console.warn(`⚠️ 404 Not Found: ${req.method} ${req.path}`);
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.path} not found`
  });
});

// ============================================
// ERROR HANDLER
// ============================================
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err);
  console.error('❌ Stack:', err.stack);
  
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
});

// ============================================
// GRACEFUL SHUTDOWN
// ============================================
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

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
});

export default app;
