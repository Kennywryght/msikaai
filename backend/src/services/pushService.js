// backend/src/services/pushService.js
import webpush from 'web-push';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import * as schema from '../db/schema.js';
import { logger } from '../utils/logger.js';

class PushService {
  constructor() {
    this.isConfigured = false;
    this.publicKey = process.env.VAPID_PUBLIC_KEY;
    this.privateKey = process.env.VAPID_PRIVATE_KEY;
    this.subject = process.env.VAPID_SUBJECT || 'mailto:no-reply@msikaai.com';

    if (this.publicKey && this.privateKey) {
      webpush.setVapidDetails(this.subject, this.publicKey, this.privateKey);
      this.isConfigured = true;
      logger.info('✅ Web Push (VAPID) configured');
    } else {
      logger.warn(
        '⚠️ Web Push not configured (missing VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY)'
      );
    }
  }

  /**
   * Save or refresh a subscription for a user.
   * A user can have many (one per device/browser).
   */
  async saveSubscription(userId, subscription, userAgent = null) {
    if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
      throw new Error('Invalid subscription object');
    }

    try {
      const existing = await db
        .select()
        .from(schema.pushSubscriptions)
        .where(
          eq(schema.pushSubscriptions.endpoint, subscription.endpoint)
        )
        .limit(1);

      if (existing[0]) {
        await db
          .update(schema.pushSubscriptions)
          .set({
            userId,
            p256dh: subscription.keys.p256dh,
            auth: subscription.keys.auth,
            userAgent: userAgent || existing[0].userAgent,
            lastUsedAt: new Date(),
          })
          .where(eq(schema.pushSubscriptions.id, existing[0].id));

        return { success: true, id: existing[0].id, updated: true };
      }

      const inserted = await db
        .insert(schema.pushSubscriptions)
        .values({
          userId,
          endpoint: subscription.endpoint,
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
          userAgent,
        })
        .returning();

      return { success: true, id: inserted[0].id, updated: false };
    } catch (err) {
      logger.error('Save push subscription error:', err.message);
      throw err;
    }
  }

  async deleteSubscription(userId, endpoint) {
    try {
      await db
        .delete(schema.pushSubscriptions)
        .where(
          eq(schema.pushSubscriptions.userId, userId)
          // If endpoint not provided, delete all for this user
        );
      return { success: true };
    } catch (err) {
      logger.error('Delete push subscription error:', err.message);
      throw err;
    }
  }

  async getUserSubscriptions(userId) {
    try {
      const rows = await db
        .select()
        .from(schema.pushSubscriptions)
        .where(eq(schema.pushSubscriptions.userId, userId));
      return rows;
    } catch (err) {
      logger.error('Get push subscriptions error:', err.message);
      return [];
    }
  }

  /**
   * Send a push notification to all of a user's subscriptions.
   * Prunes dead subscriptions automatically (410 Gone, 404 Not Found).
   */
  async sendToUser(userId, payload) {
    if (!this.isConfigured) {
      logger.warn('Push not configured; skipping send');
      return { success: false, reason: 'not_configured' };
    }

    const subs = await this.getUserSubscriptions(userId);
    if (subs.length === 0) return { success: true, delivered: 0 };

    const results = await Promise.all(
      subs.map(async (sub) => {
        const subscription = {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        };

        try {
          await webpush.sendNotification(
            subscription,
            JSON.stringify(payload)
          );
          // Mark as used
          await db
            .update(schema.pushSubscriptions)
            .set({ lastUsedAt: new Date() })
            .where(eq(schema.pushSubscriptions.id, sub.id));
          return { id: sub.id, ok: true };
        } catch (err) {
          const code = err?.statusCode;
          if (code === 404 || code === 410) {
            // Subscription is dead — remove it
            await db
              .delete(schema.pushSubscriptions)
              .where(eq(schema.pushSubscriptions.id, sub.id));
            logger.info(`🗑️ Removed dead push subscription ${sub.id}`);
            return { id: sub.id, ok: false, dead: true };
          }
          logger.warn(`Push send failed (${code}):`, err.message);
          return { id: sub.id, ok: false, error: err.message };
        }
      })
    );

    const delivered = results.filter((r) => r.ok).length;
    return { success: true, delivered, total: subs.length, results };
  }
}

export default new PushService();