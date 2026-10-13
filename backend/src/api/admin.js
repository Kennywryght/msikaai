// backend/src/api/admin.js
// Admin-only endpoints. Mounted at /api/admin behind authenticateToken.
import express from 'express';
import { eq, and, or, ilike, desc, sql, inArray } from 'drizzle-orm';
import { db } from '../db/index.js';
import {
  profiles,
  businesses,
  listings,
  payments,
  verificationRequests,
} from '../db/schema.js';
import { invalidateCache } from '../middleware/cache.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

const ROLES = ['user', 'vendor', 'admin'];
const LISTING_STATUSES = ['active', 'inactive', 'pending', 'suspended'];
const PAID = ['completed', 'success'];

const page = (q, def = 25) => ({
  limit: Math.min(Math.max(parseInt(q.limit, 10) || def, 1), 100),
  offset: Math.max(parseInt(q.offset, 10) || 0, 0),
});

const requireAdmin = async (req, res, next) => {
  try {
    const [me] = await db
      .select({ role: profiles.role })
      .from(profiles)
      .where(eq(profiles.id, req.user.id))
      .limit(1);
    if (me?.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Admin access required' });
    }
    next();
  } catch (error) {
    logger.error('Admin check error:', error);
    res.status(500).json({ success: false, error: 'Failed to check permissions' });
  }
};

router.use(requireAdmin);

const fail = (res, label, error) => {
  logger.error(`Admin ${label} error:`, error);
  res.status(500).json({ success: false, error: error.message });
};

// ============================================
// GET /api/admin/stats
// ============================================
router.get('/stats', async (req, res) => {
  try {
    const count = sql`count(*)::int`;
    const [
      [users], [activeListings], [biz], [boosts], [revenue], [pendingVerifications],
      recentUsers, recentPayments,
    ] = await Promise.all([
      db.select({ n: count }).from(profiles),
      db.select({ n: count }).from(listings).where(eq(listings.status, 'active')),
      db.select({ n: count }).from(businesses),
      db.select({ n: count }).from(listings)
        .where(and(eq(listings.isPremium, true), sql`${listings.premiumUntil} > now()`)),
      db.select({ n: count, total: sql`coalesce(sum(${payments.amount}), 0)::float` })
        .from(payments).where(inArray(payments.status, PAID)),
      db.select({ n: count }).from(verificationRequests)
        .where(eq(verificationRequests.status, 'pending')),
      db.select({
        id: profiles.id, email: profiles.email, fullName: profiles.fullName,
        role: profiles.role, createdAt: profiles.createdAt,
      }).from(profiles).orderBy(desc(profiles.createdAt)).limit(5),
      db.select({
        id: payments.id, paymentId: payments.paymentId, amount: payments.amount,
        currency: payments.currency, status: payments.status, kind: payments.kind,
        plan: payments.plan, createdAt: payments.createdAt, userEmail: profiles.email,
      }).from(payments).leftJoin(profiles, eq(payments.userId, profiles.id))
        .orderBy(desc(payments.createdAt)).limit(5),
    ]);

    res.json({
      success: true,
      stats: {
        users: users?.n || 0,
        activeListings: activeListings?.n || 0,
        businesses: biz?.n || 0,
        activeBoosts: boosts?.n || 0,
        paidPayments: revenue?.n || 0,
        revenue: revenue?.total || 0,
        pendingVerifications: pendingVerifications?.n || 0,
      },
      recentUsers,
      recentPayments,
    });
  } catch (error) {
    fail(res, 'stats', error);
  }
});

// ============================================
// USERS
// ============================================
router.get('/users', async (req, res) => {
  try {
    const { limit, offset } = page(req.query);
    const q = String(req.query.q || '').trim();
    const role = ROLES.includes(req.query.role) ? req.query.role : null;

    const conds = [];
    if (q) conds.push(or(ilike(profiles.email, `%${q}%`), ilike(profiles.fullName, `%${q}%`)));
    if (role) conds.push(eq(profiles.role, role));
    const where = conds.length ? and(...conds) : undefined;

    const [rows, [{ n }]] = await Promise.all([
      db.select({
        id: profiles.id, email: profiles.email, fullName: profiles.fullName,
        phone: profiles.phone, role: profiles.role, avatarUrl: profiles.avatarUrl,
        createdAt: profiles.createdAt,
      }).from(profiles).where(where).orderBy(desc(profiles.createdAt)).limit(limit).offset(offset),
      db.select({ n: sql`count(*)::int` }).from(profiles).where(where),
    ]);

    res.json({ success: true, users: rows, total: n, limit, offset });
  } catch (error) {
    fail(res, 'users', error);
  }
});

router.put('/users/:userId/role', async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;
    if (!ROLES.includes(role)) {
      return res.status(400).json({ success: false, error: `role must be one of ${ROLES.join(', ')}` });
    }
    if (userId === req.user.id && role !== 'admin') {
      return res.status(400).json({ success: false, error: "You can't remove your own admin role" });
    }

    const [updated] = await db
      .update(profiles)
      .set({ role, updatedAt: new Date() })
      .where(eq(profiles.id, userId))
      .returning({ id: profiles.id, email: profiles.email, role: profiles.role });

    if (!updated) return res.status(404).json({ success: false, error: 'User not found' });
    logger.info('Admin changed user role', { by: req.user.id, userId, role });
    res.json({ success: true, user: updated });
  } catch (error) {
    fail(res, 'role update', error);
  }
});

// ============================================
// LISTINGS (moderation)
// ============================================
router.get('/listings', async (req, res) => {
  try {
    const { limit, offset } = page(req.query);
    const q = String(req.query.q || '').trim();
    const status = LISTING_STATUSES.includes(req.query.status) ? req.query.status : null;

    const conds = [];
    if (q) conds.push(or(ilike(listings.title, `%${q}%`), ilike(businesses.businessName, `%${q}%`)));
    if (status) conds.push(eq(listings.status, status));
    const where = conds.length ? and(...conds) : undefined;

    const [rows, [{ n }]] = await Promise.all([
      db.select({
        id: listings.id, title: listings.title, category: listings.category,
        price: listings.price, status: listings.status, images: listings.images,
        isPremium: listings.isPremium, premiumUntil: listings.premiumUntil,
        createdAt: listings.createdAt, businessId: businesses.id,
        businessName: businesses.businessName,
      }).from(listings).leftJoin(businesses, eq(listings.businessId, businesses.id))
        .where(where).orderBy(desc(listings.createdAt)).limit(limit).offset(offset),
      db.select({ n: sql`count(*)::int` }).from(listings)
        .leftJoin(businesses, eq(listings.businessId, businesses.id)).where(where),
    ]);

    res.json({ success: true, listings: rows, total: n, limit, offset });
  } catch (error) {
    fail(res, 'listings', error);
  }
});

router.put('/listings/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!LISTING_STATUSES.includes(status)) {
      return res.status(400).json({ success: false, error: `status must be one of ${LISTING_STATUSES.join(', ')}` });
    }
    const [updated] = await db
      .update(listings)
      .set({ status, updatedAt: new Date() })
      .where(eq(listings.id, req.params.id))
      .returning({ id: listings.id, status: listings.status });

    if (!updated) return res.status(404).json({ success: false, error: 'Listing not found' });
    await invalidateCache('listings:');
    await invalidateCache('search:');
    await invalidateCache(`listing:${updated.id}`);
    logger.info('Admin changed listing status', { by: req.user.id, listingId: updated.id, status });
    res.json({ success: true, listing: updated });
  } catch (error) {
    fail(res, 'listing status', error);
  }
});

// ============================================
// PAYMENTS / REVENUE REPORT
// ============================================
router.get('/payments', async (req, res) => {
  try {
    const { limit, offset } = page(req.query);
    const status = req.query.status ? String(req.query.status) : null;
    const where = status ? eq(payments.status, status) : undefined;

    const [rows, [{ n }], byKind, byMonth] = await Promise.all([
      db.select({
        id: payments.id, paymentId: payments.paymentId, amount: payments.amount,
        currency: payments.currency, status: payments.status, kind: payments.kind,
        plan: payments.plan, durationDays: payments.durationDays,
        listingId: payments.listingId, createdAt: payments.createdAt,
        userEmail: profiles.email, userName: profiles.fullName,
      }).from(payments).leftJoin(profiles, eq(payments.userId, profiles.id))
        .where(where).orderBy(desc(payments.createdAt)).limit(limit).offset(offset),
      db.select({ n: sql`count(*)::int` }).from(payments).where(where),
      db.select({
        kind: sql`coalesce(${payments.kind}, 'subscription')`,
        n: sql`count(*)::int`,
        total: sql`coalesce(sum(${payments.amount}), 0)::float`,
      }).from(payments).where(inArray(payments.status, PAID))
        .groupBy(sql`coalesce(${payments.kind}, 'subscription')`),
      db.select({
        month: sql`to_char(date_trunc('month', ${payments.createdAt}), 'YYYY-MM')`,
        n: sql`count(*)::int`,
        total: sql`coalesce(sum(${payments.amount}), 0)::float`,
      }).from(payments)
        .where(and(inArray(payments.status, PAID), sql`${payments.createdAt} > now() - interval '12 months'`))
        .groupBy(sql`date_trunc('month', ${payments.createdAt})`)
        .orderBy(sql`date_trunc('month', ${payments.createdAt})`),
    ]);

    res.json({ success: true, payments: rows, total: n, limit, offset, byKind, byMonth });
  } catch (error) {
    fail(res, 'payments', error);
  }
});

export default router;
