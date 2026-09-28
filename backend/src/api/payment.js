// backend/src/api/payment.js
import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { logger } from '../utils/logger.js';
import paychanguService from '../services/paychanguService.js';

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
    features: ['Basic listing', 'Standard support'],
  },
  basic: {
    id: 'basic',
    name: 'Basic',
    price: 2000,
    currency: 'MWK',
    listings: 10,
    features: ['Premium listing', 'Priority support', 'Featured placement'],
  },
  pro: {
    id: 'pro',
    name: 'Professional',
    price: 5000,
    currency: 'MWK',
    listings: 25,
    features: [
      'Premium listing',
      'Priority support',
      'Featured placement',
      'AI recommendations',
      'Analytics dashboard',
    ],
  },
  business: {
    id: 'business',
    name: 'Business',
    price: 10000,
    currency: 'MWK',
    listings: 50,
    features: [
      'All features',
      'Multi-user access',
      'API access',
      'White-label option',
    ],
  },
};

// ============================================
// SPOTLIGHT BOOST PRICING
// ============================================
const BOOST_PRICING = {
  7:  { days: 7,  amount: 2000, currency: 'MWK', label: '7 days'  },
  14: { days: 14, amount: 3500, currency: 'MWK', label: '14 days' },
  30: { days: 30, amount: 6000, currency: 'MWK', label: '30 days' },
};

// ============================================
// NOTIFICATIONS
// ============================================
const NOTIFICATIONS = {
  tnmNumber: process.env.ADMIN_TNM_NUMBER || '0888921110',
  whatsappNumber: process.env.ADMIN_WHATSAPP_NUMBER || '0888921110',
  adminEmail: process.env.ADMIN_EMAIL || 'kennedybanda940@gmail.com',
};

const sendWhatsAppNotification = async (message) => {
  try {
    logger.info(`📱 WhatsApp Notification: ${message}`);
    // TODO: wire Twilio / Africa's Talking / WATI when budget allows
    return true;
  } catch (error) {
    logger.error('WhatsApp notification error:', error);
    return false;
  }
};

const sendTNMNotification = async (message, phoneNumber) => {
  try {
    logger.info(`📱 TNM SMS Notification to ${phoneNumber}: ${message}`);
    // TODO: wire Africa's Talking SMS when budget allows
    return true;
  } catch (error) {
    logger.error('TNM SMS notification error:', error);
    return false;
  }
};

const sendPaymentNotification = async (paymentData) => {
  const {
    userId, plan, amount, currency, method,
    paymentId, userEmail, userName, kind = 'subscription',
  } = paymentData;

  const message = `
🔔 *NEW PAYMENT RECEIVED!*

👤 *Customer:* ${userName || 'User'} (${userEmail || userId})
📋 *Type:* ${kind} — ${plan.toUpperCase()}
💰 *Amount:* ${amount} ${currency}
💳 *Method:* ${method}
🆔 *Ref:* ${paymentId}
📅 *Date:* ${new Date().toISOString()}

----------------------------------------
Kumsika Payment Notification
  `.trim();

  await sendWhatsAppNotification(message);
  await sendTNMNotification(message, NOTIFICATIONS.tnmNumber);

  logger.info('💳 Payment notification sent:', { userId, plan, amount, kind });
  return true;
};

// ============================================
// HELPERS
// ============================================
const generateTxRef = (prefix = 'PAY') =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

// ============================================
// SHARED ENTITLEMENT GRANT LOGIC
//
// This is the ONE place that turns a paid payment row into an
// actual premium feature. Both /verify and /webhook call it.
// Idempotent: if called twice for the same payment, no harm done.
// ============================================
async function grantEntitlement({ payment, now }) {
  try {
    const kind = payment.kind || 'subscription';

    if (kind === 'subscription') {
      const planConfig = PLANS[payment.plan];
      if (!planConfig) {
        return { success: false, error: `Unknown plan: ${payment.plan}` };
      }

      const expiresAt = new Date(now);
      expiresAt.setDate(expiresAt.getDate() + 30);

      const { error } = await supabase
        .from('subscriptions')
        .upsert(
          {
            user_id: payment.user_id,
            plan: payment.plan,
            listings_allowed: planConfig.listings,
            status: 'active',
            expires_at: expiresAt.toISOString(),
            updated_at: now.toISOString(),
          },
          { onConflict: 'user_id' }
        );

      if (error) {
        logger.error('Subscription grant error:', error);
        return { success: false, error: error.message };
      }
      return { success: true };
    }

    if (kind === 'boost') {
      const days = parseInt(String(payment.plan).replace('boost_', ''), 10) || 7;
      const premiumUntil = new Date(now);
      premiumUntil.setDate(premiumUntil.getDate() + days);

      const { error } = await supabase
        .from('listings')
        .update({
          is_premium: true,
          premium_until: premiumUntil.toISOString(),
          updated_at: now.toISOString(),
        })
        .eq('id', payment.listing_id);

      if (error) {
        logger.error('Boost grant error:', error);
        return { success: false, error: error.message };
      }
      return { success: true };
    }

    return { success: false, error: `Unknown payment kind: ${kind}` };
  } catch (err) {
    logger.error('grantEntitlement exception:', err);
    return { success: false, error: err.message };
  }
}

// ============================================
// GET PLANS
// ============================================
router.get('/plans', async (req, res) => {
  try {
    res.json({ success: true, plans: PLANS });
  } catch (error) {
    logger.error('Error fetching plans:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch plans' });
  }
});

// ============================================
// GET BOOST PRICING
// ============================================
router.get('/boost-pricing', (req, res) => {
  res.json({
    success: true,
    plans: Object.values(BOOST_PRICING),
  });
});

// ============================================
// INITIATE PAYMENT
//
// Body:
//   { kind: 'subscription' | 'boost', plan, listingId?, durationDays? }
//
// userId comes from req.user.id (set by authenticateToken).
// ============================================
router.post('/initiate', async (req, res) => {
  try {
    const { kind = 'subscription', plan, durationDays, listingId } = req.body;

    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    let amount = 0;
    let currency = 'MWK';
    let description = '';

    if (kind === 'subscription') {
      if (!PLANS[plan]) {
        return res.status(400).json({ success: false, error: 'Invalid plan' });
      }
      amount = PLANS[plan].price;
      currency = PLANS[plan].currency;
      description = `Kumsika ${PLANS[plan].name} subscription`;

      if (amount === 0) {
        return res.json({
          success: true,
          paymentId: `free_${Date.now()}`,
          amount: 0,
          currency,
          free: true,
        });
      }
    } else if (kind === 'boost') {
      if (!listingId) {
        return res.status(400).json({ success: false, error: 'listingId required for boost' });
      }
      const duration = Number(durationDays) || 7;
      const tier = BOOST_PRICING[duration];
      if (!tier) {
        return res.status(400).json({
          success: false,
          error: `Unsupported boost duration. Use 7, 14, or 30.`,
        });
      }

      // Ownership check: caller must own the listing's business.
      const { data: listingCheck, error: checkError } = await supabase
        .from('listings')
        .select('id, business_id, businesses!inner(user_id)')
        .eq('id', listingId)
        .single();

      if (checkError || !listingCheck) {
        logger.warn('Boost ownership lookup failed:', checkError?.message);
        return res.status(404).json({ success: false, error: 'Listing not found' });
      }

      const ownerUserId = listingCheck.businesses?.user_id;
      if (ownerUserId !== userId) {
        return res.status(403).json({
          success: false,
          error: 'You do not own this listing',
        });
      }

      amount = tier.amount;
      currency = tier.currency;
      description = `Kumsika Spotlight Boost — ${tier.label}`;
    } else {
      return res.status(400).json({
        success: false,
        error: `Unknown payment kind: ${kind}`,
      });
    }

    const paymentId = generateTxRef(kind === 'boost' ? 'BST' : 'PAY');

    // Look up user for email + name (needed by PayChangu)
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', userId)
      .single();

    const email = profile?.email || req.user?.email || 'noreply@kumsika.app';
    const [firstName, ...restName] = (profile?.full_name || 'Kumsika User').split(' ');
    const lastName = restName.join(' ') || 'User';

    // Best-effort insert of the intent row before calling PayChangu.
    const { error: insertError } = await supabase
      .from('payments')
      .insert({
        user_id: userId,
        plan: kind === 'subscription' ? plan : `boost_${durationDays || 7}`,
        amount,
        currency,
        method: 'paychangu',
        payment_id: paymentId,
        status: 'pending',
        kind,
        listing_id: listingId || null,
      });

    if (insertError) {
      logger.warn('Payment record insert warning:', insertError.message);
    }

    const callbackUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment/callback`;

    const result = await paychanguService.initiatePayment({
      txRef: paymentId,
      amount,
      currency,
      email,
      firstName,
      lastName,
      callbackUrl,
      returnUrl: callbackUrl,
      title: 'Kumsika',
      description,
    });

    if (!result.success) {
      return res.status(502).json({
        success: false,
        error: result.error || 'PayChangu initiation failed',
      });
    }

    return res.json({
      success: true,
      paymentId,
      checkoutUrl: result.checkoutUrl,
      amount,
      currency,
      kind,
      dryRun: !!result.dryRun,
    });
  } catch (error) {
    logger.error('Payment initiation error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to initiate payment',
    });
  }
});

// ============================================
// VERIFY PAYMENT
//
// Called by:
//   a) frontend after user returns from PayChangu
//   b) internally by the webhook handler
// ============================================
router.post('/verify', async (req, res) => {
  try {
    const { paymentId } = req.body;
    const userId = req.user?.id;

    if (!paymentId || !userId) {
      return res.status(400).json({
        success: false,
        error: 'paymentId is required and you must be authenticated',
      });
    }

    const { data: payment, error: fetchError } = await supabase
      .from('payments')
      .select('*')
      .eq('payment_id', paymentId)
      .single();

    if (fetchError || !payment) {
      return res.status(404).json({ success: false, error: 'Payment not found' });
    }

    if (payment.user_id !== userId) {
      logger.warn(
        `⚠️ User ${userId} tried to verify payment ${paymentId} owned by ${payment.user_id}`
      );
      return res.status(403).json({ success: false, error: 'Not your payment' });
    }

    if (payment.status === 'completed') {
      return res.json({
        success: true,
        status: 'success',
        message: 'Payment already verified',
        plan: payment.plan,
        kind: payment.kind || 'subscription',
        alreadyProcessed: true,
      });
    }

    // Server-side truth check with PayChangu
    const verification = await paychanguService.verifyPayment(paymentId);

    if (!verification.success) {
      return res.status(502).json({
        success: false,
        error: verification.error || 'Verification failed',
      });
    }

    if (verification.status !== 'success') {
      return res.json({
        success: false,
        status: verification.status,
        message: 'Payment not yet completed',
      });
    }

    // Mark payment complete
    const now = new Date();
    const { error: updateError } = await supabase
      .from('payments')
      .update({ status: 'completed', updated_at: now.toISOString() })
      .eq('payment_id', paymentId);

    if (updateError) {
      logger.error('Payment status update error:', updateError);
    }

    // Grant the entitlement
    const granted = await grantEntitlement({ payment, now });

    if (!granted.success) {
      return res.status(500).json({
        success: false,
        error: granted.error,
      });
    }

    // Fire-and-forget notification
    sendPaymentNotification({
      userId: payment.user_id,
      plan: payment.plan,
      amount: payment.amount,
      currency: payment.currency,
      method: payment.method,
      paymentId,
      kind: payment.kind || 'subscription',
    }).catch((err) => logger.warn('Notification failed:', err.message));

    return res.json({
      success: true,
      status: 'success',
      message: 'Payment verified',
      plan: payment.plan,
      kind: payment.kind || 'subscription',
    });
  } catch (error) {
    logger.error('Payment verification error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to verify payment',
    });
  }
});

// ============================================
// WEBHOOK (public — no auth)
//
// req.body is a Buffer because index.js uses express.raw() for
// this path.
// ============================================
router.post('/webhook', async (req, res) => {
  try {
    const rawBody =
      Buffer.isBuffer(req.body) ? req.body.toString('utf8') : '';
    const signature =
      req.headers['x-paychangu-signature'] ||
      req.headers['x-signature'] ||
      req.headers['signature'];

    const valid = paychanguService.verifyWebhookSignature(rawBody, signature);

    if (!valid) {
      logger.warn('🚫 Webhook signature invalid — rejecting');
      return res.status(200).json({ received: true, verified: false });
    }

    let payload;
    try {
      payload = JSON.parse(rawBody);
    } catch (err) {
      logger.error('Webhook JSON parse error:', err);
      return res.status(200).json({ received: true, parseError: true });
    }

    const txRef =
      payload?.tx_ref ||
      payload?.data?.tx_ref ||
      payload?.data?.reference ||
      null;

    if (!txRef) {
      logger.warn('Webhook missing tx_ref:', payload);
      return res.status(200).json({ received: true, noTxRef: true });
    }

    logger.info(`📥 Webhook received: tx_ref=${txRef}`);

    const { data: payment } = await supabase
      .from('payments')
      .select('*')
      .eq('payment_id', txRef)
      .single();

    if (!payment) {
      logger.warn(`Webhook for unknown tx_ref: ${txRef}`);
      return res.status(200).json({ received: true, unknownTxRef: true });
    }

    if (payment.status === 'completed') {
      logger.info(`Webhook for already-completed payment: ${txRef}`);
      return res.status(200).json({ received: true, alreadyProcessed: true });
    }

    const now = new Date();
    await supabase
      .from('payments')
      .update({ status: 'completed', updated_at: now.toISOString() })
      .eq('payment_id', txRef);

    const granted = await grantEntitlement({ payment, now });

    if (!granted.success) {
      logger.error('Webhook grant failed:', granted.error);
      return res.status(200).json({ received: true, granted: false });
    }

    sendPaymentNotification({
      userId: payment.user_id,
      plan: payment.plan,
      amount: payment.amount,
      currency: payment.currency,
      method: payment.method,
      paymentId: txRef,
      kind: payment.kind || 'subscription',
    }).catch((err) => logger.warn('Notification failed:', err.message));

    return res.status(200).json({ received: true, granted: true });
  } catch (error) {
    logger.error('Webhook handler error:', error);
    return res.status(200).json({ received: true, internalError: true });
  }
});

// ============================================
// GET USER SUBSCRIPTION
//
// ★ PHASE 2C: expire-on-read. If the subscription's expires_at is
//   in the past, this returns free-tier values instead of the
//   stale paid plan. No background job needed.
// ============================================
router.get('/subscription/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    // ---------- No subscription row → create free ----------
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
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single();

      if (createError) throw createError;

      return res.json({
        success: true,
        subscription: {
          ...newSub,
          remaining_listings: PLANS.free.listings,
        },
      });
    }

    // ---------- Expire-on-read ----------
    const now = new Date();
    const isExpired = data.expires_at && new Date(data.expires_at) < now;

    if (isExpired && data.plan !== 'free') {
      logger.info(
        `⏰ Subscription for ${userId} expired at ${data.expires_at} — treating as free`
      );

      const effective = {
        ...data,
        plan: 'free',
        listings_allowed: PLANS.free.listings,
        status: 'expired',
      };

      const remaining = Math.max(
        0,
        effective.listings_allowed - (data.listings_used || 0)
      );

      return res.json({
        success: true,
        subscription: {
          ...effective,
          remaining_listings: remaining,
        },
      });
    }

    // ---------- Active subscription ----------
    const remaining = (data.listings_allowed || 0) - (data.listings_used || 0);

    res.json({
      success: true,
      subscription: {
        ...data,
        remaining_listings: remaining > 0 ? remaining : 0,
      },
    });
  } catch (error) {
    logger.error('Subscription fetch error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch subscription',
    });
  }
});

// ============================================
// UPGRADE SUBSCRIPTION (deprecated — admin/manual only)
//
// This route grants premium without payment. Kept for backward
// compatibility and for admins to grant plans manually. Should
// not be called by the frontend.
// ============================================
router.post('/upgrade', async (req, res) => {
  logger.warn(
    '⚠️ /api/payment/upgrade called directly — this bypasses payment. ' +
    'Should only be used by admins for manual grants.'
  );

  try {
    const { plan, userId } = req.body;

    if (!PLANS[plan]) {
      return res.status(400).json({
        success: false,
        error: 'Invalid plan selected',
      });
    }

    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setDate(expiresAt.getDate() + 30);

    const { data, error } = await supabase
      .from('subscriptions')
      .upsert(
        {
          user_id: userId,
          plan,
          listings_allowed: PLANS[plan].listings,
          status: 'active',
          expires_at: expiresAt.toISOString(),
          updated_at: now.toISOString(),
        },
        { onConflict: 'user_id' }
      )
      .select()
      .single();

    if (error) throw error;

    const remaining = (data.listings_allowed || 0) - (data.listings_used || 0);

    res.json({
      success: true,
      subscription: {
        ...data,
        remaining_listings: remaining > 0 ? remaining : 0,
      },
    });
  } catch (error) {
    logger.error('Subscription upgrade error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to upgrade subscription',
    });
  }
});

// ============================================
// CAN CREATE LISTING
//
// ★ PHASE 2C: expire-on-read. An expired paid plan falls back to
//   the free-tier limit for this request.
// ============================================
router.get('/can-create-listing/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    // ---------- No subscription row → free tier ----------
    if (!data) {
      return res.json({
        success: true,
        canCreate: true,
        subscription: {
          plan: 'free',
          listings_allowed: PLANS.free.listings,
          listings_used: 0,
          remaining_listings: PLANS.free.listings,
        },
      });
    }

    // ---------- Expire-on-read ----------
    const now = new Date();
    const isExpired = data.expires_at && new Date(data.expires_at) < now;
    const effectivePlan = isExpired && data.plan !== 'free' ? 'free' : data.plan;
    const effectiveAllowed =
      effectivePlan === 'free' && isExpired
        ? PLANS.free.listings
        : data.listings_allowed || PLANS.free.listings;

    const remaining = effectiveAllowed - (data.listings_used || 0);

    res.json({
      success: true,
      canCreate: remaining > 0,
      subscription: {
        ...data,
        plan: effectivePlan,
        listings_allowed: effectiveAllowed,
        status: isExpired && data.plan !== 'free' ? 'expired' : data.status,
        remaining_listings: remaining > 0 ? remaining : 0,
      },
    });
  } catch (error) {
    logger.error('Check listing permission error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to check listing permission',
    });
  }
});

export default router;