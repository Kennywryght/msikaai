// backend/src/api/payment.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const paymentService = require('../services/paymentService');
const supabase = require('../lib/supabase');
const logger = require('../utils/logger');

// ============================================
// Subscription Plans
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
// Get available plans
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
// Initiate payment
// ============================================
router.post('/initiate', auth, async (req, res) => {
  try {
    const { plan, method, amount, currency } = req.body;
    const userId = req.user.id;

    // Validate plan
    if (!PLANS[plan]) {
      return res.status(400).json({
        success: false,
        error: 'Invalid plan selected'
      });
    }

    // Validate payment method
    const validMethods = ['airtel_money', 'mpamba', 'card'];
    if (!validMethods.includes(method)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid payment method'
      });
    }

    // Create payment intent
    const paymentIntent = await paymentService.createPaymentIntent({
      userId,
      plan,
      amount: PLANS[plan].price,
      currency: PLANS[plan].currency,
      method
    });

    res.json({
      success: true,
      paymentId: paymentIntent.id,
      clientSecret: paymentIntent.clientSecret,
      amount: PLANS[plan].price,
      currency: PLANS[plan].currency
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
// Verify payment
// ============================================
router.get('/verify/:paymentId', auth, async (req, res) => {
  try {
    const { paymentId } = req.params;
    
    const result = await paymentService.verifyPayment(paymentId);
    
    if (result.success) {
      // Update user subscription
      await paymentService.updateSubscription({
        userId: req.user.id,
        plan: result.plan,
        paymentId: paymentId
      });
    }
    
    res.json(result);
    
  } catch (error) {
    logger.error('Payment verification error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to verify payment'
    });
  }
});

// ============================================
// Get subscription status
// ============================================
router.get('/subscription/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Ensure user can only view their own subscription
    if (userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized access'
      });
    }
    
    const subscription = await paymentService.getSubscription(userId);
    
    res.json({
      success: true,
      subscription
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
// Upgrade subscription
// ============================================
router.post('/upgrade', auth, async (req, res) => {
  try {
    const { plan, paymentId } = req.body;
    const userId = req.user.id;
    
    // Validate plan
    if (!PLANS[plan]) {
      return res.status(400).json({
        success: false,
        error: 'Invalid plan selected'
      });
    }
    
    // Update subscription
    const result = await paymentService.updateSubscription({
      userId,
      plan,
      paymentId
    });
    
    res.json({
      success: true,
      subscription: result
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
// Check if user can create listing
// ============================================
router.get('/can-create-listing/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized access'
      });
    }
    
    const canCreate = await paymentService.canCreateListing(userId);
    const subscription = await paymentService.getSubscription(userId);
    
    res.json({
      success: true,
      canCreate,
      subscription
    });
    
  } catch (error) {
    logger.error('Check listing permission error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to check listing permission'
    });
  }
});

module.exports = router;