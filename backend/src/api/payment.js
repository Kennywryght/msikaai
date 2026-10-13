// backend/src/api/payment.js
import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { logger } from '../utils/logger.js';
import paychanguService from '../services/paychanguService.js';
import smsService from '../services/smsService.js';
import { isAdmin } from '../utils/authz.js';

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
    // No WhatsApp provider wired yet (needs a Twilio/WATI account); log only.
    logger.info(`📱 WhatsApp Notification (log only): ${message}`);
    return false;
  } catch (error) {
    logger.error('WhatsApp notification error:', error);
    return false;
  }
};

const sendTNMNotification = async (message, phoneNumber) => {
  try {
    if (!smsService.isConfigured) {
      logger.info(`📱 [SMS not configured] Admin notification to ${phoneNumber}: ${message}`);
      return false;
    }
    // SMS has no markdown; strip WhatsApp-style *bold* markers.
    const result = await smsService.send(phoneNumber, message.replace(/\*/g, ''));
    if (!result.success) logger.warn('Admin SMS notification failed:', result.error);
    return result.success;
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
      if (!payment.listing_id) {
        return { success: false, error: 'Boost payment has no listing_id' };
      }
      const days =
        Number(payment.duration_days) ||
        parseInt(String(payment.plan).replace('boost_', ''), 10) || // legacy rows
        7;

      // Renewal while still boosted extends from the current end date.
      const { data: current } = await supabase
        .from('listings')
        .select('premium_until')
        .eq('id', payment.listing_id)
        .single();
      const currentEnd = current?.premium_until ? new Date(current.premium_until) : null;
      const base = currentEnd && currentEnd > now ? currentEnd : new Date(now);
      const premiumUntil = new Date(base);
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
// SETTLE A PAYMENT (shared by /verify and /webhook)
//
//  1. Ask PayChangu (server-to-server) whether it succeeded.
//  2. Check the charged amount covers what we asked for.
//  3. Atomically claim the row (pending → completed). Only the caller
//     that wins the claim grants, so verify + webhook racing can't
//     double-grant (e.g. extend a boost twice).
//  4. If the grant fails, release the claim so a retry can finish it.
// ============================================
async function settlePayment(payment) {
  if (payment.status === 'completed') return { ok: true, alreadyProcessed: true };

  const verification = await paychanguService.verifyPayment(payment.payment_id);
  if (!verification.success) {
    return { ok: false, httpStatus: 502, error: verification.error || 'Verification failed' };
  }
  if (verification.status !== 'success') {
    return { ok: false, pending: verification.status === 'pending', status: verification.status };
  }

  const expected = Number(payment.amount) || 0;
  if (verification.amount != null && Number(verification.amount) + 0.5 < expected) {
    logger.error('💳 Amount mismatch — not granting', {
      paymentId: payment.payment_id, expected, charged: verification.amount,
    });
    await supabase
      .from('payments')
      .update({ status: 'amount_mismatch', updated_at: new Date().toISOString() })
      .eq('payment_id', payment.payment_id);
    return { ok: false, httpStatus: 402, error: 'Paid amount does not match. Please contact support.' };
  }

  const now = new Date();
  const { data: claimed, error: claimError } = await supabase
    .from('payments')
    .update({ status: 'completed', updated_at: now.toISOString() })
    .eq('payment_id', payment.payment_id)
    .neq('status', 'completed')
    .select('id');
  if (claimError) {
    logger.error('Payment claim error:', claimError);
    return { ok: false, httpStatus: 500, error: 'Could not record payment' };
  }
  if (!claimed?.length) return { ok: true, alreadyProcessed: true };

  const granted = await grantEntitlement({ payment, now });
  if (!granted.success) {
    await supabase
      .from('payments')
      .update({ status: 'pending', updated_at: new Date().toISOString() })
      .eq('payment_id', payment.payment_id);
    return { ok: false, httpStatus: 500, error: granted.error };
  }

  sendPaymentNotification({
    userId: payment.user_id,
    plan: payment.plan,
    amount: payment.amount,
    currency: payment.currency,
    method: payment.method,
    paymentId: payment.payment_id,
    kind: payment.kind || 'subscription',
  }).catch((err) => logger.warn('Notification failed:', err.message));

  return { ok: true };
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

    // The intent row MUST exist before the user is sent to checkout —
    // /verify and /webhook look it up to grant the entitlement. If it
    // can't be written, the user would pay and receive nothing.
    // (plan is a free/basic/pro/business enum, so boosts leave it at its
    // default and carry their duration in duration_days.)
    const row = {
      user_id: userId,
      amount,
      currency,
      method: 'paychangu',
      payment_id: paymentId,
      status: 'pending',
      kind,
      listing_id: kind === 'boost' ? listingId : null,
      duration_days: kind === 'boost' ? (Number(durationDays) || 7) : null,
    };
    if (kind === 'subscription') row.plan = plan;

    const { error: insertError } = await supabase.from('payments').insert(row);

    if (insertError) {
      logger.error('Payment record insert failed:', insertError.message);
      return res.status(500).json({
        success: false,
        error: 'Could not start payment. You have not been charged — please try again.',
      });
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

    const result = await settlePayment(payment);
    const kind = payment.kind || 'subscription';

    if (result.alreadyProcessed) {
      return res.json({
        success: true, status: 'success', message: 'Payment already verified',
        plan: payment.plan, kind, alreadyProcessed: true,
      });
    }
    if (result.pending) {
      return res.json({ success: false, status: result.status, message: 'Payment not yet completed' });
    }
    if (!result.ok) {
      return res.status(result.httpStatus || 500).json({ success: false, error: result.error });
    }

    return res.json({
      success: true,
      status: 'success',
      message: 'Payment verified',
      plan: payment.plan,
      kind,
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

    // The webhook is only a trigger: settlePayment re-checks status and
    // amount with PayChangu's API, so a signed "failed" event grants nothing.
    const result = await settlePayment(payment);
    if (result.alreadyProcessed) {
      return res.status(200).json({ received: true, alreadyProcessed: true });
    }
    if (!result.ok) {
      logger.warn(`Webhook not settled for ${txRef}:`, result.error || result.status);
      return res.status(200).json({ received: true, granted: false, status: result.status });
    }
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
    if (userId !== req.user?.id) {
      return res.status(403).json({ success: false, error: 'You can only view your own subscription' });
    }

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
// Manual grant without payment — admins only.
router.post('/upgrade', async (req, res) => {
  try {
    if (!(await isAdmin(req.user?.id))) {
      return res.status(403).json({ success: false, error: 'Admin access required' });
    }

    const { plan, userId } = req.body;
    if (!userId) {
      return res.status(400).json({ success: false, error: 'userId is required' });
    }
    logger.warn('⚠️ Manual subscription grant', { by: req.user.id, userId, plan });

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
    if (userId !== req.user?.id) {
      return res.status(403).json({ success: false, error: 'You can only view your own subscription' });
    }

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