// backend/src/services/paychanguService.js
import crypto from 'crypto';
import { logger } from '../utils/logger.js';

// ============================================================
// PAYCHANGU SERVICE
//
// Wraps the PayChangu Standard Checkout API for Kumsika premium
// features (Spotlight Boost, subscription plans).
//
// Docs: https://developer.paychangu.com
//
// This service is the ONLY place in the codebase that should
// know PayChangu's URL structure, request field names, and
// webhook signature algorithm. Everything else calls these
// methods and gets clean results back.
// ============================================================

const PAYCHANGU_BASE_URL =
  process.env.PAYCHANGU_BASE_URL || 'https://api.paychangu.com';

const DEFAULT_CURRENCY = 'MWK';

class PayChanguService {
  constructor() {
    this.secretKey = process.env.PAYCHANGU_SECRET_KEY || '';
    this.webhookSecret = process.env.PAYCHANGU_WEBHOOK_SECRET || '';
    this.publicKey = process.env.PAYCHANGU_PUBLIC_KEY || '';

    this.available = Boolean(this.secretKey);

    if (!this.available) {
      logger.warn(
        '⚠️ PayChangu not configured (PAYCHANGU_SECRET_KEY missing). ' +
        'Payment routes will run in dry-run mode.'
      );
    }

    if (!this.webhookSecret) {
      logger.warn(
        '⚠️ PAYCHANGU_WEBHOOK_SECRET missing. ' +
        'Webhook signature verification is DISABLED — do not ship to production like this.'
      );
    }
  }

  // ============================================================
  // 1. INITIATE PAYMENT
  // ============================================================
  async initiatePayment({
    txRef,
    amount,
    currency = DEFAULT_CURRENCY,
    email,
    firstName,
    lastName,
    callbackUrl,
    returnUrl,
    title,
    description,
  }) {
    if (!this.available) {
      return this._dryRunInitiate({ txRef, amount, currency });
    }

    try {
      const payload = {
        amount: String(Math.round(amount)),
        currency,
        email,
        first_name: firstName || 'Kumsika',
        last_name: lastName || 'User',
        callback_url: callbackUrl || returnUrl,
        return_url: returnUrl || callbackUrl,
        tx_ref: txRef,
        customization: {
          title: title || 'Kumsika',
          description: description || 'Premium feature payment',
        },
      };

      const url = `${PAYCHANGU_BASE_URL}/payment`;
      logger.info(`💳 PayChangu initiate: ${url} txRef=${txRef} amount=${amount}`);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.secretKey}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        logger.error(
          `❌ PayChangu initiate failed: ${response.status} ${JSON.stringify(data)}`
        );
        return {
          success: false,
          error: data?.message || data?.error || `PayChangu HTTP ${response.status}`,
          raw: data,
        };
      }

      const checkoutUrl =
        data?.data?.checkout_url ||
        data?.data?.checkoutUrl ||
        data?.checkout_url ||
        data?.checkoutUrl ||
        data?.data?.url ||
        null;

      if (!checkoutUrl) {
        logger.error('❌ PayChangu response missing checkout URL:', data);
        return {
          success: false,
          error: 'PayChangu did not return a checkout URL',
          raw: data,
        };
      }

      return {
        success: true,
        checkoutUrl,
        txRef,
        raw: data,
      };
    } catch (err) {
      logger.error('❌ PayChangu initiate exception:', err);
      return { success: false, error: err.message };
    }
  }

  // ============================================================
  // 2. VERIFY PAYMENT
  // ============================================================
  async verifyPayment(txRef) {
    if (!this.available) {
      return this._dryRunVerify(txRef);
    }

    try {
      const url = `${PAYCHANGU_BASE_URL}/verify-payment/${encodeURIComponent(txRef)}`;
      logger.info(`🔎 PayChangu verify: ${url}`);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.secretKey}`,
        },
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        logger.error(
          `❌ PayChangu verify failed: ${response.status} ${JSON.stringify(data)}`
        );
        return {
          success: false,
          error: data?.message || data?.error || `PayChangu HTTP ${response.status}`,
          raw: data,
        };
      }

      const inner = data?.data || data;
      const rawStatus = (
        inner?.status ||
        inner?.payment_status ||
        inner?.transaction_status ||
        ''
      ).toString().toLowerCase();

      let status = 'pending';
      if (['success', 'successful', 'paid', 'completed'].includes(rawStatus)) {
        status = 'success';
      } else if (['failed', 'cancelled', 'canceled', 'error'].includes(rawStatus)) {
        status = 'failed';
      }

      const amount =
        Number(inner?.amount || inner?.charged_amount || 0) || null;
      const currency = inner?.currency || DEFAULT_CURRENCY;

      return {
        success: true,
        status,
        amount,
        currency,
        raw: data,
      };
    } catch (err) {
      logger.error('❌ PayChangu verify exception:', err);
      return { success: false, error: err.message };
    }
  }

  // ============================================================
  // 3. VERIFY WEBHOOK SIGNATURE
  // ============================================================
  verifyWebhookSignature(rawBodyString, signatureHeader) {
    if (!this.webhookSecret) {
      if (process.env.NODE_ENV === 'production') {
        logger.error(
          '❌ Webhook signature missing AND no secret configured. Refusing.'
        );
        return false;
      }
      logger.warn(
        '⚠️ Webhook secret not configured. Accepting signature in dev mode.'
      );
      return true;
    }

    if (!signatureHeader) {
      logger.warn('⚠️ Webhook request has no signature header');
      return false;
    }

    try {
      const computed = crypto
        .createHmac('sha256', this.webhookSecret)
        .update(rawBodyString, 'utf8')
        .digest('hex');

      if (
        computed.length === signatureHeader.length &&
        crypto.timingSafeEqual(
          Buffer.from(computed, 'utf8'),
          Buffer.from(signatureHeader, 'utf8')
        )
      ) {
        return true;
      }

      if (signatureHeader === this.webhookSecret) {
        return true;
      }

      logger.warn('⚠️ Webhook signature mismatch');
      return false;
    } catch (err) {
      logger.error('❌ Webhook signature verification error:', err);
      return false;
    }
  }

  // ============================================================
  // 4. DRY-RUN MODE
  //
  // Fakes checkout URLs and always returns success on verify.
  // When PAYCHANGU_SECRET_KEY is missing, this is what runs.
  // ============================================================
  _dryRunInitiate({ txRef, amount, currency }) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    // Point at the callback page with the tx_ref so the app's normal
    // verification flow kicks in — same as a real PayChangu redirect.
    const fakeUrl = `${frontendUrl}/payment/callback?tx_ref=${encodeURIComponent(
      txRef
    )}&dry_run=1`;

    logger.info(
      `🧪 [DRY-RUN] PayChangu initiate: txRef=${txRef} amount=${amount} ${currency}`
    );

    return {
      success: true,
      checkoutUrl: fakeUrl,
      txRef,
      dryRun: true,
    };
  }

  _dryRunVerify(txRef) {
    logger.info(`🧪 [DRY-RUN] PayChangu verify: txRef=${txRef}`);
    const success = typeof txRef === 'string' && /^(PAY|BST)-/.test(txRef);
    return {
      success: true,
      status: success ? 'success' : 'failed',
      amount: null,
      currency: DEFAULT_CURRENCY,
      dryRun: true,
    };
  }
}

export default new PayChanguService();