import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const router = Router();

// Check if environment variables are loaded
console.log('🔍 Checking environment variables:');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? '✅ Loaded' : '❌ Missing');
console.log('SUPABASE_KEY:', process.env.SUPABASE_KEY ? '✅ Loaded' : '❌ Missing');

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

    console.log('📝 Signup attempt:', { email, fullName });

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
      console.error('❌ Signup error:', error);
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
        console.error('❌ Profile creation error:', profileError);
      }
    }

    console.log('✅ Signup successful:', data.user?.id);

    return res.json({
      success: true,
      message: 'Signup successful. Please verify your email.',
      user: data.user
    });
  } catch (error) {
    console.error('❌ Signup error:', error);
    return res.status(400).json({
      success: false,
      error: error.message || 'Signup failed'
    });
  }
});

// Login with email - UPDATED with auto-profile creation
router.post('/login-email', async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('🔐 Login attempt:', { email });

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
      console.error('❌ Login error:', error);
      return res.status(401).json({
        success: false,
        error: error.message || 'Invalid credentials'
      });
    }

    // Check if user has a profile - if not, create one
    console.log('🔍 Checking for profile for user:', data.user?.id);
    
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user?.id)
      .single();

    // If profile doesn't exist (PGRST116), create it
    if (profileError && profileError.code === 'PGRST116') {
      console.log('📝 Profile not found, creating one for user:', data.user?.id);
      
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
        console.error('❌ Profile creation error:', createError);
        // Still return the user even if profile creation fails
        return res.json({
          success: true,
          message: 'Login successful but profile creation failed',
          user: data.user,
          session: data.session,
          profile: null
        });
      }

      console.log('✅ Profile created successfully:', newProfile.id);
      
      return res.json({
        success: true,
        message: 'Login successful',
        user: data.user,
        session: data.session,
        profile: newProfile
      });
    }

    if (profileError) {
      console.error('❌ Profile fetch error:', profileError);
      // Still return the user even if profile fetch fails
      return res.json({
        success: true,
        message: 'Login successful but profile fetch failed',
        user: data.user,
        session: data.session,
        profile: null
      });
    }

    console.log('✅ Login successful:', data.user?.id);

    return res.json({
      success: true,
      message: 'Login successful',
      user: data.user,
      session: data.session,
      profile: profile || null
    });
  } catch (error) {
    console.error('❌ Login error:', error);
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

    console.log('📱 Send OTP attempt:', { phone });

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
      console.error('❌ Send OTP error:', error);
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    console.log('✅ OTP sent:', { phone });

    return res.json({
      success: true,
      message: 'OTP sent successfully',
      data
    });
  } catch (error) {
    console.error('❌ Send OTP error:', error);
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

    console.log('✅ Verify OTP attempt:', { phone });

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
      console.error('❌ Verify OTP error:', error);
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    // Check if user has a profile - if not, create one
    console.log('🔍 Checking for profile for user:', data.user?.id);
    
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user?.id)
      .single();

    // If profile doesn't exist (PGRST116), create it
    if (profileError && profileError.code === 'PGRST116') {
      console.log('📝 Profile not found, creating one for user:', data.user?.id);
      
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
        console.error('❌ Profile creation error:', createError);
        // Still return the user even if profile creation fails
        return res.json({
          success: true,
          message: 'OTP verified but profile creation failed',
          user: data.user,
          session: data.session,
          profile: null
        });
      }

      console.log('✅ Profile created successfully:', newProfile.id);
      
      return res.json({
        success: true,
        message: 'Verified successfully',
        user: data.user,
        session: data.session,
        profile: newProfile
      });
    }

    if (profileError) {
      console.error('❌ Profile fetch error:', profileError);
      // Still return the user even if profile fetch fails
      return res.json({
        success: true,
        message: 'OTP verified but profile fetch failed',
        user: data.user,
        session: data.session,
        profile: null
      });
    }

    console.log('✅ OTP verified:', data.user?.id);

    return res.json({
      success: true,
      message: 'Verified successfully',
      user: data.user,
      session: data.session,
      profile: profile || null
    });
  } catch (error) {
    console.error('❌ Verify OTP error:', error);
    return res.status(400).json({
      success: false,
      error: error.message || 'Failed to verify OTP'
    });
  }
});

// ============================================
// 3. SESSION MANAGEMENT
// ============================================

// Get current user - UPDATED with auto-profile creation
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    console.log('🔍 Authorization header:', authHeader ? 'Present' : 'Missing');
    
    const token = authHeader?.split(' ')[1];

    if (!token) {
      console.log('❌ No token provided in Authorization header');
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }

    console.log('🔍 Verifying token...');
    const { data, error } = await supabase.auth.getUser(token);

    if (error) {
      console.error('❌ Token verification failed:', error.message);
      return res.status(401).json({
        success: false,
        error: error.message
      });
    }

    console.log('✅ Token verified for user:', data.user?.id);

    // Get profile - if not found, create one
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user?.id)
      .single();

    // If profile doesn't exist (PGRST116), create it
    if (profileError && profileError.code === 'PGRST116') {
      console.log('📝 Profile not found, creating one for user:', data.user?.id);
      
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
        console.error('❌ Profile creation error:', createError);
        // Return user without profile
        return res.json({
          success: true,
          user: data.user,
          profile: null
        });
      }

      console.log('✅ Profile created successfully:', newProfile.id);
      
      return res.json({
        success: true,
        user: data.user,
        profile: newProfile
      });
    }

    if (profileError) {
      console.error('❌ Profile fetch error:', profileError);
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
    console.error('❌ Get user error:', error);
    return res.status(401).json({
      success: false,
      error: error.message || 'Authentication failed'
    });
  }
});

// Sign out
router.post('/signout', async (req, res) => {
  try {
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

export default router;