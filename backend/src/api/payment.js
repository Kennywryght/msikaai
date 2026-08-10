// backend/src/api/payments.js
import express from 'express';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { logger } from '../utils/logger.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// ============================================
// 1. CREATE PAYMENT INTENT
// ============================================
router.post('/create-payment-intent', authenticateToken, async (req, res) => {
  try {
    const { 
      amount, 
      currency = 'usd', 
      metadata = {},
      paymentMethodTypes = ['card'],
      description = 'MsikaAI Payment'
    } = req.body;

    // Validate amount
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Valid amount is required'
      });
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      metadata: {
        userId: req.user.id,
        userEmail: req.user.email,
        ...metadata
      },
      payment_method_types: paymentMethodTypes,
      description,
      receipt_email: req.user.email,
      statement_descriptor: 'MsikaAI Payment',
      statement_descriptor_suffix: 'Marketplace',
    });

    logger.info(`Payment intent created: ${paymentIntent.id} for user ${req.user.id}`);

    // Save payment intent to database
    await supabase
      .from('payment_intents')
      .insert({
        id: paymentIntent.id,
        user_id: req.user.id,
        amount: amount,
        currency: currency,
        status: 'pending',
        metadata: metadata,
        created_at: new Date().toISOString()
      });

    res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: amount,
      currency: currency
    });
  } catch (error) {
    logger.error('Payment intent error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create payment intent'
    });
  }
});

// ============================================
// 2. CONFIRM PAYMENT
// ============================================
router.post('/confirm-payment', authenticateToken, async (req, res) => {
  try {
    const { paymentIntentId } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({
        success: false,
        error: 'Payment intent ID is required'
      });
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status === 'succeeded') {
      // Update database
      await supabase
        .from('payment_intents')
        .update({
          status: 'succeeded',
          updated_at: new Date().toISOString()
        })
        .eq('id', paymentIntentId);

      // Create order if needed
      if (paymentIntent.metadata?.listingId) {
        await supabase
          .from('orders')
          .insert({
            user_id: req.user.id,
            listing_id: paymentIntent.metadata.listingId,
            payment_intent_id: paymentIntentId,
            amount: paymentIntent.amount / 100,
            currency: paymentIntent.currency,
            status: 'completed',
            metadata: paymentIntent.metadata
          });
      }

      logger.info(`Payment confirmed: ${paymentIntentId} for user ${req.user.id}`);

      return res.json({
        success: true,
        status: 'succeeded',
        paymentIntent: paymentIntent
      });
    }

    res.json({
      success: false,
      status: paymentIntent.status,
      message: `Payment is ${paymentIntent.status}`
    });
  } catch (error) {
    logger.error('Confirm payment error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to confirm payment'
    });
  }
});

// ============================================
// 3. GET PAYMENT STATUS
// ============================================
router.get('/status/:paymentIntentId', authenticateToken, async (req, res) => {
  try {
    const { paymentIntentId } = req.params;

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    res.json({
      success: true,
      status: paymentIntent.status,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency,
      created: paymentIntent.created,
      metadata: paymentIntent.metadata
    });
  } catch (error) {
    logger.error('Get payment status error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get payment status'
    });
  }
});

// ============================================
// 4. GET PAYMENT HISTORY
// ============================================
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const { limit = 10, offset = 0 } = req.query;

    const { data: payments, error, count } = await supabase
      .from('payment_intents')
      .select('*', { count: 'exact' })
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (error) throw error;

    res.json({
      success: true,
      payments: payments || [],
      total: count || 0,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    logger.error('Get payment history error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get payment history'
    });
  }
});

// ============================================
// 5. STRIPE WEBHOOK
// ============================================
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    logger.error(`Webhook signature verification failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    logger.info(`Webhook event received: ${event.type}`);

    switch (event.type) {
      case 'payment_intent.succeeded':
        await handleSuccessfulPayment(event.data.object);
        break;
      
      case 'payment_intent.payment_failed':
        await handleFailedPayment(event.data.object);
        break;

      case 'payment_intent.processing':
        await handleProcessingPayment(event.data.object);
        break;

      case 'charge.refunded':
        await handleRefundedPayment(event.data.object);
        break;

      default:
        logger.info(`Unhandled webhook event: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    logger.error('Webhook handler error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// 6. WEBHOOK HANDLERS
// ============================================
async function handleSuccessfulPayment(paymentIntent) {
  const { metadata, id, amount, currency } = paymentIntent;
  
  logger.info(`Payment succeeded: ${id} for user ${metadata.userId}`);

  // Update payment intent status
  await supabase
    .from('payment_intents')
    .update({
      status: 'succeeded',
      updated_at: new Date().toISOString(),
      payment_data: paymentIntent
    })
    .eq('id', id);

  // Create order
  if (metadata.listingId) {
    const { data: order, error } = await supabase
      .from('orders')
      .insert({
        user_id: metadata.userId,
        listing_id: metadata.listingId,
        payment_intent_id: id,
        amount: amount / 100,
        currency: currency,
        status: 'completed',
        metadata: metadata
      })
      .select()
      .single();

    if (error) {
      logger.error('Error saving order:', error);
    } else {
      logger.info(`Order created: ${order.id}`);
      
      // Update listing status
      await supabase
        .from('listings')
        .update({ status: 'sold' })
        .eq('id', metadata.listingId);
    }
  }

  // Send notification (if email service is configured)
  try {
    // await sendOrderConfirmationEmail(userId, order);
  } catch (emailError) {
    logger.error('Email notification error:', emailError);
  }
}

async function handleFailedPayment(paymentIntent) {
  const { metadata, id, last_payment_error } = paymentIntent;
  
  logger.warn(`Payment failed: ${id} - ${last_payment_error?.message || 'Unknown error'}`);

  await supabase
    .from('payment_intents')
    .update({
      status: 'failed',
      updated_at: new Date().toISOString(),
      error_message: last_payment_error?.message || 'Payment failed'
    })
    .eq('id', id);

  // Notify user if needed
  // await sendPaymentFailedNotification(userId, id);
}

async function handleProcessingPayment(paymentIntent) {
  const { id } = paymentIntent;
  
  logger.info(`Payment processing: ${id}`);

  await supabase
    .from('payment_intents')
    .update({
      status: 'processing',
      updated_at: new Date().toISOString()
    })
    .eq('id', id);
}

async function handleRefundedPayment(charge) {
  const { payment_intent: paymentIntentId, amount_refunded } = charge;
  
  logger.info(`Payment refunded: ${paymentIntentId}`);

  await supabase
    .from('payment_intents')
    .update({
      status: 'refunded',
      updated_at: new Date().toISOString(),
      refund_amount: amount_refunded / 100
    })
    .eq('id', paymentIntentId);
}

// ============================================
// 7. GET PAYMENT METHODS
// ============================================
router.get('/methods', authenticateToken, async (req, res) => {
  try {
    const paymentMethods = await stripe.paymentMethods.list({
      type: 'card',
    });

    res.json({
      success: true,
      paymentMethods: paymentMethods.data
    });
  } catch (error) {
    logger.error('Get payment methods error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get payment methods'
    });
  }
});

// ============================================
// 8. REFUND PAYMENT
// ============================================
router.post('/refund', authenticateToken, async (req, res) => {
  try {
    const { paymentIntentId, amount, reason = 'requested_by_customer' } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({
        success: false,
        error: 'Payment intent ID is required'
      });
    }

    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: amount ? Math.round(amount * 100) : undefined,
      reason: reason,
      metadata: {
        userId: req.user.id,
        userEmail: req.user.email
      }
    });

    logger.info(`Refund created: ${refund.id} for payment ${paymentIntentId}`);

    res.json({
      success: true,
      refund: refund
    });
  } catch (error) {
    logger.error('Refund error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to process refund'
    });
  }
});

export default router;