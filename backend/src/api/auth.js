// backend/src/api/auth.js
import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { logger } from '../utils/logger.js';
// ============================================
// PHASE 7: IMPORT EMAIL SERVICE
// ============================================
import emailService from '../services/emailService.js';
import queueService from '../services/queueService.js';

// Load environment variables
dotenv.config();

const router = Router();

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

console.log('✅ Supabase client initialized');

// ============================================
// 1. EMAIL AUTH
// ============================================

// Sign up with email
router.post('/signup-email', async (req, res) => {
  try {
    const { email, password, fullName, phone } = req.body;

    logger.info('📝 Signup attempt:', { email, fullName });

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName || '',
          phone: phone || '',
          role: 'customer'
        }
      }
    });

    if (error) {
      logger.error('❌ Signup error:', error);
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    // Create profile
    if (data.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          full_name: fullName || '',
          phone: phone || '',
          email: email,
          role: 'customer'
        });

      if (profileError) {
        logger.error('❌ Profile creation error:', profileError);
      }

      // ============================================
      // PHASE 7: SEND WELCOME EMAIL
      // ============================================
      try {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const verificationLink = `${frontendUrl}/verify-email?token=${data.session?.access_token || ''}`;
        const dashboardLink = `${frontendUrl}/dashboard`;

        // Send welcome email via queue or directly
        if (queueService.isConnected && process.env.EMAIL_QUEUE_ENABLED !== 'false') {
          // Queue the email for async sending
          await queueService.sendEmail({
            to: email,
            template: 'welcome',
            templateData: {
              name: fullName || 'there',
              email: email,
              verificationLink: verificationLink,
              dashboardLink: dashboardLink,
            },
          });
          logger.info(`📧 Welcome email queued for ${email}`);
        } else {
          // Send directly
          await emailService.sendWelcomeEmail(email, {
            name: fullName || 'there',
            email: email,
            verificationLink: verificationLink,
            dashboardLink: dashboardLink,
          });
          logger.info(`📧 Welcome email sent to ${email}`);
        }
      } catch (emailError) {
        logger.error('❌ Welcome email error:', emailError.message);
        // Don't fail signup if email fails
      }
    }

    // Set cookie with access token
    if (data.session?.access_token) {
      res.cookie('access_token', data.session.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        sameSite: 'lax',
        path: '/',
      });
    }

    logger.info('✅ Signup successful:', data.user?.id);

    return res.json({
      success: true,
      message: 'Signup successful. Please verify your email.',
      user: data.user,
      session: data.session,
    });
  } catch (error) {
    logger.error('❌ Signup error:', error);
    return res.status(400).json({
      success: false,
      error: error.message || 'Signup failed'
    });
  }
});

// Login with email
router.post('/login-email', async (req, res) => {
  try {
    const { email, password } = req.body;

    logger.info('🔐 Login attempt:', { email });

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      logger.error('❌ Login error:', error);
      return res.status(401).json({
        success: false,
        error: error.message || 'Invalid credentials'
      });
    }

    // Check if user has a profile - if not, create one
    logger.info('🔍 Checking for profile for user:', data.user?.id);
    
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user?.id)
      .single();

    // If profile doesn't exist (PGRST116), create it
    if (profileError && profileError.code === 'PGRST116') {
      logger.info('📝 Profile not found, creating one for user:', data.user?.id);
      
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          id: data.user?.id,
          email: email,
          full_name: data.user?.user_metadata?.full_name || '',
          phone: data.user?.user_metadata?.phone || '',
          role: 'customer'
        })
        .select()
        .single();

      if (createError) {
        logger.error('❌ Profile creation error:', createError);
        // Still return the user even if profile creation fails
        return res.json({
          success: true,
          message: 'Login successful but profile creation failed',
          user: data.user,
          session: data.session,
          profile: null
        });
      }

      logger.info('✅ Profile created successfully:', newProfile.id);
      
      // Set cookie with access token
      if (data.session?.access_token) {
        res.cookie('access_token', data.session.access_token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          maxAge: 30 * 24 * 60 * 60 * 1000,
          sameSite: 'lax',
          path: '/',
        });
      }

      return res.json({
        success: true,
        message: 'Login successful',
        user: data.user,
        session: data.session,
        profile: newProfile
      });
    }

    if (profileError) {
      logger.error('❌ Profile fetch error:', profileError);
      // Still return the user even if profile fetch fails
      return res.json({
        success: true,
        message: 'Login successful but profile fetch failed',
        user: data.user,
        session: data.session,
        profile: null
      });
    }

    // Set cookie with access token
    if (data.session?.access_token) {
      res.cookie('access_token', data.session.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 30 * 24 * 60 * 60 * 1000,
        sameSite: 'lax',
        path: '/',
      });
    }

    logger.info('✅ Login successful:', data.user?.id);

    return res.json({
      success: true,
      message: 'Login successful',
      user: data.user,
      session: data.session,
      profile: profile || null
    });
  } catch (error) {
    logger.error('❌ Login error:', error);
    return res.status(401).json({
      success: false,
      error: error.message || 'Invalid credentials'
    });
  }
});

// ============================================
// 2. PHONE AUTH (OTP)
// ============================================

// Send OTP
router.post('/send-otp', async (req, res) => {
  try {
    const { phone } = req.body;

    logger.info('📱 Send OTP attempt:', { phone });

    if (!phone || phone.length < 10) {
      return res.status(400).json({
        success: false,
        error: 'Valid phone number is required'
      });
    }

    const { data, error } = await supabase.auth.signInWithOtp({
      phone: phone,
    });

    if (error) {
      logger.error('❌ Send OTP error:', error);
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    logger.info('✅ OTP sent:', { phone });

    return res.json({
      success: true,
      message: 'OTP sent successfully',
      data
    });
  } catch (error) {
    logger.error('❌ Send OTP error:', error);
    return res.status(400).json({
      success: false,
      error: error.message || 'Failed to send OTP'
    });
  }
});

// Verify OTP
router.post('/verify-otp', async (req, res) => {
  try {
    const { phone, token, fullName } = req.body;

    logger.info('✅ Verify OTP attempt:', { phone });

    if (!phone || !token) {
      return res.status(400).json({
        success: false,
        error: 'Phone and token are required'
      });
    }

    const { data, error } = await supabase.auth.verifyOtp({
      phone,
      token,
      type: 'sms'
    });

    if (error) {
      logger.error('❌ Verify OTP error:', error);
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    // Check if user has a profile - if not, create one
    logger.info('🔍 Checking for profile for user:', data.user?.id);
    
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user?.id)
      .single();

    // If profile doesn't exist (PGRST116), create it
    if (profileError && profileError.code === 'PGRST116') {
      logger.info('📝 Profile not found, creating one for user:', data.user?.id);
      
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          id: data.user?.id,
          phone: phone,
          full_name: fullName || 'User',
          role: 'customer'
        })
        .select()
        .single();

      if (createError) {
        logger.error('❌ Profile creation error:', createError);
        // Still return the user even if profile creation fails
        return res.json({
          success: true,
          message: 'OTP verified but profile creation failed',
          user: data.user,
          session: data.session,
          profile: null
        });
      }

      logger.info('✅ Profile created successfully:', newProfile.id);
      
      // Set cookie with access token
      if (data.session?.access_token) {
        res.cookie('access_token', data.session.access_token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          maxAge: 30 * 24 * 60 * 60 * 1000,
          sameSite: 'lax',
          path: '/',
        });
      }

      return res.json({
        success: true,
        message: 'Verified successfully',
        user: data.user,
        session: data.session,
        profile: newProfile
      });
    }

    if (profileError) {
      logger.error('❌ Profile fetch error:', profileError);
      // Still return the user even if profile fetch fails
      return res.json({
        success: true,
        message: 'OTP verified but profile fetch failed',
        user: data.user,
        session: data.session,
        profile: null
      });
    }

    // Set cookie with access token
    if (data.session?.access_token) {
      res.cookie('access_token', data.session.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 30 * 24 * 60 * 60 * 1000,
        sameSite: 'lax',
        path: '/',
      });
    }

    logger.info('✅ OTP verified:', data.user?.id);

    return res.json({
      success: true,
      message: 'Verified successfully',
      user: data.user,
      session: data.session,
      profile: profile || null
    });
  } catch (error) {
    logger.error('❌ Verify OTP error:', error);
    return res.status(400).json({
      success: false,
      error: error.message || 'Failed to verify OTP'
    });
  }
});

// ============================================
// 3. SESSION MANAGEMENT
// ============================================

// Get current user
router.get('/me', async (req, res) => {
  try {
    // Check cookie first, then Authorization header
    let token = req.cookies?.access_token;
    
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
      }
    }

    if (!token) {
      logger.warn('❌ No token provided');
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }

    logger.info('🔍 Verifying token...');
    const { data, error } = await supabase.auth.getUser(token);

    if (error) {
      logger.error('❌ Token verification failed:', error.message);
      return res.status(401).json({
        success: false,
        error: error.message
      });
    }

    logger.info('✅ Token verified for user:', data.user?.id);

    // Get profile - if not found, create one
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user?.id)
      .single();

    // If profile doesn't exist (PGRST116), create it
    if (profileError && profileError.code === 'PGRST116') {
      logger.info('📝 Profile not found, creating one for user:', data.user?.id);
      
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          id: data.user?.id,
          email: data.user?.email || '',
          full_name: data.user?.user_metadata?.full_name || '',
          phone: data.user?.user_metadata?.phone || '',
          role: 'customer'
        })
        .select()
        .single();

      if (createError) {
        logger.error('❌ Profile creation error:', createError);
        // Return user without profile
        return res.json({
          success: true,
          user: data.user,
          profile: null
        });
      }

      logger.info('✅ Profile created successfully:', newProfile.id);
      
      return res.json({
        success: true,
        user: data.user,
        profile: newProfile
      });
    }

    if (profileError) {
      logger.error('❌ Profile fetch error:', profileError);
      return res.status(404).json({
        success: false,
        error: 'Profile not found'
      });
    }

    return res.json({
      success: true,
      user: data.user,
      profile
    });
  } catch (error) {
    logger.error('❌ Get user error:', error);
    return res.status(401).json({
      success: false,
      error: error.message || 'Authentication failed'
    });
  }
});

// Sign out
router.post('/signout', async (req, res) => {
  try {
    // Clear cookie
    res.clearCookie('access_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    const { error } = await supabase.auth.signOut();

    if (error) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    return res.json({
      success: true,
      message: 'Signed out successfully'
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Refresh token
router.post('/refresh', async (req, res) => {
  try {
    const refreshToken = req.cookies?.refresh_token;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        error: 'No refresh token provided'
      });
    }

    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error) {
      logger.error('❌ Refresh token error:', error);
      return res.status(401).json({
        success: false,
        error: 'Invalid refresh token'
      });
    }

    // Set new cookies
    if (data.session?.access_token) {
      res.cookie('access_token', data.session.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 30 * 24 * 60 * 60 * 1000,
        sameSite: 'lax',
        path: '/',
      });
    }

    if (data.session?.refresh_token) {
      res.cookie('refresh_token', data.session.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 30 * 24 * 60 * 60 * 1000,
        sameSite: 'lax',
        path: '/',
      });
    }

    return res.json({
      success: true,
      session: data.session,
    });
  } catch (error) {
    logger.error('❌ Refresh error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to refresh token'
    });
  }
});

// ============================================
// 4. FORGOT PASSWORD
// ============================================

router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    logger.info('🔐 Password reset requested for:', { email });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetLink = `${frontendUrl}/reset-password?email=${encodeURIComponent(email)}`;

    // Send password reset email
    await emailService.sendPasswordResetEmail(email, {
      name: 'User',
      resetLink: resetLink,
      expiresIn: '1 hour',
    });

    logger.info('✅ Password reset email sent to:', email);

    return res.json({
      success: true,
      message: 'Password reset instructions sent to your email'
    });
  } catch (error) {
    logger.error('❌ Forgot password error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to send reset email'
    });
  }
});

// ============================================
// 5. RESEND VERIFICATION EMAIL
// ============================================

router.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    logger.info('📧 Resend verification requested for:', { email });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const verificationLink = `${frontendUrl}/verify-email`;

    await emailService.sendVerificationEmail(email, {
      name: 'User',
      verificationLink: verificationLink,
    });

    logger.info('✅ Verification email resent to:', email);

    return res.json({
      success: true,
      message: 'Verification email sent successfully'
    });
  } catch (error) {
    logger.error('❌ Resend verification error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to send verification email'
    });
  }
});

export default router;