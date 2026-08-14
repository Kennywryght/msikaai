// backend/src/api/payment.js
import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { logger } from '../utils/logger.js';

const router = express.Router();
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// ============================================
// PLANS CONFIGURATION
// ============================================
const PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    currency: 'MWK',
    listings: 3,
    features: ['Basic listing', 'Standard support']
  },
  basic: {
    id: 'basic',
    name: 'Basic',
    price: 2000,
    currency: 'MWK',
    listings: 10,
    features: ['Premium listing', 'Priority support', 'Featured placement']
  },
  pro: {
    id: 'pro',
    name: 'Professional',
    price: 5000,
    currency: 'MWK',
    listings: 25,
    features: ['Premium listing', 'Priority support', 'Featured placement', 'AI recommendations', 'Analytics dashboard']
  },
  business: {
    id: 'business',
    name: 'Business',
    price: 10000,
    currency: 'MWK',
    listings: 50,
    features: ['All features', 'Multi-user access', 'API access', 'White-label option']
  }
};

// ============================================
// NOTIFICATION NUMBERS (Update with your numbers)
// ============================================
const NOTIFICATIONS = {
  tnmNumber: '0888921110',        // Your TNM number
  whatsappNumber: '0888921110',   // Your WhatsApp number
  adminEmail: 'kennedybanda940@gmail.com'
};

// ============================================
// SEND WHATSAPP NOTIFICATION
// ============================================
const sendWhatsAppNotification = async (message) => {
  try {
    logger.info(`📱 WhatsApp Notification: ${message}`);
    
    // You can integrate with:
    // - Twilio WhatsApp API
    // - WATI.io
    // - 360dialog
    // - Africa's Talking
    
    return true;
  } catch (error) {
    logger.error('WhatsApp notification error:', error);
    return false;
  }
};

// ============================================
// SEND TNM (SMS) NOTIFICATION
// ============================================
const sendTNMNotification = async (message, phoneNumber) => {
  try {
    logger.info(`📱 TNM SMS Notification to ${phoneNumber}: ${message}`);
    
    // You can integrate with:
    // - Africa's Talking SMS API
    // - Twilio SMS API
    // - Local SMS gateway
    
    return true;
  } catch (error) {
    logger.error('TNM SMS notification error:', error);
    return false;
  }
};

// ============================================
// SEND PAYMENT NOTIFICATION
// ============================================
const sendPaymentNotification = async (paymentData) => {
  const { userId, plan, amount, currency, method, paymentId, userEmail, userName } = paymentData;
  
  const message = `
🔔 *NEW PAYMENT RECEIVED!*

👤 *Customer:* ${userName || 'User'} (${userEmail || userId})
📋 *Plan:* ${plan.toUpperCase()}
💰 *Amount:* ${amount} ${currency}
💳 *Method:* ${method}
🆔 *Payment ID:* ${paymentId}
📅 *Date:* ${new Date().toISOString()}

----------------------------------------
MsikaAI Payment Notification
    `.trim();

  await sendWhatsAppNotification(message);
  await sendTNMNotification(message, NOTIFICATIONS.tnmNumber);
  
  logger.info('💳 Payment notification sent:', { userId, plan, amount });
  
  return true;
};

// ============================================
// GET PLANS
// ============================================
router.get('/plans', async (req, res) => {
  try {
    res.json({
      success: true,
      plans: PLANS
    });
  } catch (error) {
    logger.error('Error fetching plans:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch plans'
    });
  }
});

// ============================================
// INITIATE PAYMENT
// ============================================
router.post('/initiate', async (req, res) => {
  try {
    const { userId, plan, method } = req.body;

    if (!PLANS[plan]) {
      return res.status(400).json({
        success: false,
        error: 'Invalid plan selected'
      });
    }

    if (PLANS[plan].price === 0) {
      return res.json({
        success: true,
        paymentId: 'free_' + Date.now(),
        amount: 0,
        currency: PLANS[plan].currency
      });
    }

    const paymentId = `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        user_id: userId,
        plan: plan,
        amount: PLANS[plan].price,
        currency: PLANS[plan].currency,
        method: method,
        payment_id: paymentId,
        status: 'pending'
      })
      .select()
      .single();

    if (paymentError) {
      logger.error('Payment record error:', paymentError);
      throw paymentError;
    }

    await sendPaymentNotification({
      userId,
      plan,
      amount: PLANS[plan].price,
      currency: PLANS[plan].currency,
      method,
      paymentId
    });

    res.json({
      success: true,
      paymentId: paymentId,
      amount: PLANS[plan].price,
      currency: PLANS[plan].currency,
      status: 'pending'
    });

  } catch (error) {
    logger.error('Payment initiation error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to initiate payment'
    });
  }
});

// ============================================
// VERIFY PAYMENT
// ============================================
router.post('/verify', async (req, res) => {
  try {
    const { paymentId, userId } = req.body;

    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('*')
      .eq('payment_id', paymentId)
      .single();

    if (paymentError || !payment) {
      return res.status(404).json({
        success: false,
        error: 'Payment not found'
      });
    }

    const { error: updateError } = await supabase
      .from('payments')
      .update({ status: 'completed' })
      .eq('payment_id', paymentId);

    if (updateError) {
      throw updateError;
    }

    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setDate(expiresAt.getDate() + 30);

    const { error: subError } = await supabase
      .from('subscriptions')
      .upsert({
        user_id: userId,
        plan: payment.plan,
        listings_allowed: PLANS[payment.plan].listings,
        status: 'active',
        expires_at: expiresAt.toISOString(),
        updated_at: now.toISOString()
      }, {
        onConflict: 'user_id'
      });

    if (subError) {
      throw subError;
    }

    await sendWhatsAppNotification(
      `✅ Payment Confirmed!\n\nYour ${payment.plan} plan is now active. You have ${PLANS[payment.plan].listings} listings available.\n\nThank you for choosing MsikaAI! 🎉`
    );

    res.json({
      success: true,
      message: 'Payment verified and subscription updated',
      plan: payment.plan
    });

  } catch (error) {
    logger.error('Payment verification error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to verify payment'
    });
  }
});

// ============================================
// GET USER SUBSCRIPTION
// ============================================
router.get('/subscription/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    if (!data) {
      const now = new Date();
      const expiresAt = new Date(now);
      expiresAt.setFullYear(expiresAt.getFullYear() + 100);

      const { data: newSub, error: createError } = await supabase
        .from('subscriptions')
        .insert({
          user_id: userId,
          plan: 'free',
          listings_allowed: PLANS.free.listings,
          listings_used: 0,
          status: 'active',
          expires_at: expiresAt.toISOString()
        })
        .select()
        .single();

      if (createError) throw createError;

      return res.json({
        success: true,
        subscription: {
          ...newSub,
          remaining_listings: PLANS.free.listings
        }
      });
    }

    const remaining = (data.listings_allowed || 0) - (data.listings_used || 0);

    res.json({
      success: true,
      subscription: {
        ...data,
        remaining_listings: remaining > 0 ? remaining : 0
      }
    });

  } catch (error) {
    logger.error('Subscription fetch error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch subscription'
    });
  }
});

// ============================================
// UPGRADE SUBSCRIPTION
// ============================================
router.post('/upgrade', async (req, res) => {
  try {
    const { plan, paymentId, userId } = req.body;

    if (!PLANS[plan]) {
      return res.status(400).json({
        success: false,
        error: 'Invalid plan selected'
      });
    }

    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setDate(expiresAt.getDate() + 30);

    const { data, error } = await supabase
      .from('subscriptions')
      .upsert({
        user_id: userId,
        plan: plan,
        listings_allowed: PLANS[plan].listings,
        status: 'active',
        expires_at: expiresAt.toISOString(),
        updated_at: now.toISOString()
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single();

    if (error) throw error;

    const remaining = (data.listings_allowed || 0) - (data.listings_used || 0);

    res.json({
      success: true,
      subscription: {
        ...data,
        remaining_listings: remaining > 0 ? remaining : 0
      }
    });

  } catch (error) {
    logger.error('Subscription upgrade error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to upgrade subscription'
    });
  }
});

// ============================================
// CAN CREATE LISTING
// ============================================
router.get('/can-create-listing/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    if (!data) {
      return res.json({
        success: true,
        canCreate: true,
        subscription: {
          plan: 'free',
          listings_allowed: PLANS.free.listings,
          listings_used: 0,
          remaining_listings: PLANS.free.listings
        }
      });
    }

    const remaining = (data.listings_allowed || 0) - (data.listings_used || 0);

    res.json({
      success: true,
      canCreate: remaining > 0,
      subscription: {
        ...data,
        remaining_listings: remaining > 0 ? remaining : 0
      }
    });

  } catch (error) {
    logger.error('Check listing permission error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to check listing permission'
    });
  }
});

export default router;