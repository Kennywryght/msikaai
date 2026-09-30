// backend/src/services/deliveriesService.js
import { eq, and, or, desc, asc, sql, inArray, ilike } from 'drizzle-orm';
import { db } from '../db/index.js';
import {
  deliveryJobs,
  profiles,
  trustScores,
} from '../db/schema.js';
import { logger } from '../utils/logger.js';
import { incrementDeliveries } from './trustScoreService.js';
import notificationService from './notificationService.js';
import {
  DELIVERY_STATUSES,
  DELIVERY_ACTIVE_STATUSES,
  DELIVERY_EXPIRY_HOURS,
  MAX_DELIVERY_TITLE_LENGTH,
  MAX_DELIVERY_DESC_LENGTH,
  MAX_ACTIVE_DELIVERIES_PER_COURIER,
} from '../utils/constants.js';

// ============================================
// HELPERS
// ============================================
const clampInt = (value, min, max, fallback) => {
  const n = parseInt(value, 10);
  if (Number.isNaN(n)) return fallback;
  return Math.max(min, Math.min(max, n));
};

const parseAmount = (value) => {
  if (value === undefined || value === null || value === '') return null;
  const n = parseFloat(value);
  if (Number.isNaN(n) || n < 0) return null;
  return n;
};

const cleanString = (value, maxLen) => {
  if (!value || typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, maxLen);
};

/**
 * Enrich a delivery job with poster + courier profiles and trust data.
 */
const enrichJobs = async (rows) => {
  if (!rows || rows.length === 0) return [];

  const userIds = new Set();
  for (const r of rows) {
    if (r.posterId) userIds.add(r.posterId);
    if (r.courierId) userIds.add(r.courierId);
  }

  const idArray = [...userIds];
  if (idArray.length === 0) return rows;

  const profileRows = await db
    .select({
      id: profiles.id,
      fullName: profiles.fullName,
      avatarUrl: profiles.avatarUrl,
      locationText: profiles.locationText,
      phone: profiles.phone,
    })
    .from(profiles)
    .where(inArray(profiles.id, idArray));

  const trustRows = await db
    .select({
      userId: trustScores.userId,
      tier: trustScores.tier,
      trustScore: trustScores.trustScore,
      deliveriesCompletedCount: trustScores.deliveriesCompletedCount,
      averageRating: trustScores.averageRating,
      totalReviews: trustScores.totalReviews,
    })
    .from(trustScores)
    .where(inArray(trustScores.userId, idArray));

  const profileMap = Object.fromEntries(profileRows.map((p) => [p.id, p]));
  const trustMap = Object.fromEntries(trustRows.map((t) => [t.userId, t]));

  return rows.map((r) => ({
    ...r,
    poster: profileMap[r.posterId]
      ? { ...profileMap[r.posterId], trust: trustMap[r.posterId] || null }
      : null,
    courier: r.courierId && profileMap[r.courierId]
      ? { ...profileMap[r.courierId], trust: trustMap[r.courierId] || null }
      : null,
  }));
};

/**
 * Compute effective status: if expiresAt has passed and status is still 'open',
 * return 'expired' without touching the DB.
 */
const effectiveStatus = (row) => {
  if (!row) return 'open';
  if (
    row.status === 'open' &&
    row.expiresAt &&
    new Date(row.expiresAt).getTime() < Date.now()
  ) {
    return 'expired';
  }
  return row.status;
};

/**
 * Fetch just the display name for a user (used for notification text).
 */
const getUserDisplayName = async (userId) => {
  try {
    const [row] = await db
      .select({ fullName: profiles.fullName })
      .from(profiles)
      .where(eq(profiles.id, userId))
      .limit(1);
    return row?.fullName || 'Someone';
  } catch {
    return 'Someone';
  }
};

// ============================================
// CREATE
// ============================================
export const createDeliveryJob = async (userId, data) => {
  const {
    title,
    description,
    packageSize,
    pickupLocation,
    pickupLat,
    pickupLng,
    pickupContactName,
    pickupContactPhone,
    dropoffLocation,
    dropoffLat,
    dropoffLng,
    dropoffContactName,
    dropoffContactPhone,
    courierFee,
    requestId,
    conversationId,
  } = data || {};

  const cleanTitle = cleanString(title, MAX_DELIVERY_TITLE_LENGTH);
  if (!cleanTitle) throw new Error('Title is required');

  const cleanPickup = cleanString(pickupLocation, 200);
  if (!cleanPickup) throw new Error('Pickup location is required');

  const cleanDropoff = cleanString(dropoffLocation, 200);
  if (!cleanDropoff) throw new Error('Dropoff location is required');

  const validSizes = ['small', 'medium', 'large', 'bulky'];
  const size = validSizes.includes(packageSize) ? packageSize : 'medium';

  const cleanDescription = cleanString(description, MAX_DELIVERY_DESC_LENGTH);

  const feeNum = parseAmount(courierFee);

  const activeRows = await db
    .select({ count: sql`count(*)::int` })
    .from(deliveryJobs)
    .where(
      and(
        eq(deliveryJobs.posterId, userId),
        inArray(deliveryJobs.status, ['open', 'accepted', 'picked_up', 'delivered'])
      )
    );

  const activeCount = activeRows[0]?.count ?? 0;
  if (activeCount >= 10) {
    throw new Error('You already have 10 active delivery jobs. Complete or cancel one first.');
  }

  const expiresAt = new Date(Date.now() + DELIVERY_EXPIRY_HOURS * 60 * 60 * 1000);

  const [created] = await db
    .insert(deliveryJobs)
    .values({
      posterId: userId,
      requestId: requestId || null,
      conversationId: conversationId || null,
      title: cleanTitle,
      description: cleanDescription,
      packageSize: size,
      pickupLocation: cleanPickup,
      pickupLat: pickupLat != null ? String(pickupLat) : null,
      pickupLng: pickupLng != null ? String(pickupLng) : null,
      pickupContactName: cleanString(pickupContactName, 120),
      pickupContactPhone: cleanString(pickupContactPhone, 40),
      dropoffLocation: cleanDropoff,
      dropoffLat: dropoffLat != null ? String(dropoffLat) : null,
      dropoffLng: dropoffLng != null ? String(dropoffLng) : null,
      dropoffContactName: cleanString(dropoffContactName, 120),
      dropoffContactPhone: cleanString(dropoffContactPhone, 40),
      courierFee: feeNum != null ? String(feeNum) : null,
      status: 'open',
      expiresAt,
    })
    .returning();

  logger.info('Delivery job created', { jobId: created.id, posterId: userId });

  const [enriched] = await enrichJobs([created]);
  return enriched;
};

// ============================================
// LIST / FEED
// ============================================
export const listDeliveryJobs = async (filters = {}) => {
  const {
    status,
    packageSize,
    search,
    pickupArea,
    dropoffArea,
    userId,
    limit = 20,
    offset = 0,
    sort = 'recent',
  } = filters;

  const conditions = [];

  if (status && status !== 'all') {
    conditions.push(eq(deliveryJobs.status, status));
  } else {
    conditions.push(eq(deliveryJobs.status, 'open'));
  }

  conditions.push(
    or(
      sql`${deliveryJobs.expiresAt} IS NULL`,
      sql`${deliveryJobs.expiresAt} > NOW()`
    )
  );

  if (packageSize && packageSize !== 'all') {
    conditions.push(eq(deliveryJobs.packageSize, packageSize));
  }

  if (pickupArea) {
    conditions.push(ilike(deliveryJobs.pickupLocation, `%${pickupArea}%`));
  }

  if (dropoffArea) {
    conditions.push(ilike(deliveryJobs.dropoffLocation, `%${dropoffArea}%`));
  }

  if (userId) {
    conditions.push(eq(deliveryJobs.posterId, userId));
  }

  if (search && typeof search === 'string' && search.trim()) {
    const term = `%${search.trim()}%`;
    conditions.push(
      or(
        ilike(deliveryJobs.title, term),
        ilike(deliveryJobs.description, term),
        ilike(deliveryJobs.pickupLocation, term),
        ilike(deliveryJobs.dropoffLocation, term)
      )
    );
  }

  const where = and(...conditions);

  const orderBy =
    sort === 'fee_high'
      ? [desc(deliveryJobs.courierFee), desc(deliveryJobs.createdAt)]
      : sort === 'fee_low'
      ? [asc(deliveryJobs.courierFee), desc(deliveryJobs.createdAt)]
      : [desc(deliveryJobs.createdAt)];

  const rows = await db
    .select()
    .from(deliveryJobs)
    .where(where)
    .orderBy(...orderBy)
    .limit(clampInt(limit, 1, 100, 20))
    .offset(clampInt(offset, 0, 10000, 0));

  const totalRows = await db
    .select({ count: sql`count(*)::int` })
    .from(deliveryJobs)
    .where(where);

  const total = totalRows[0]?.count ?? 0;

  const enriched = await enrichJobs(rows);
  return { deliveries: enriched, total, limit, offset };
};

// ============================================
// MY JOBS (as poster)
// ============================================
export const getMyDeliveryJobs = async (userId, filters = {}) => {
  const {
    status,
    limit = 20,
    offset = 0,
  } = filters;

  const conditions = [eq(deliveryJobs.posterId, userId)];

  if (status && status !== 'all') {
    conditions.push(eq(deliveryJobs.status, status));
  }

  const where = and(...conditions);

  const rows = await db
    .select()
    .from(deliveryJobs)
    .where(where)
    .orderBy(desc(deliveryJobs.createdAt))
    .limit(clampInt(limit, 1, 100, 20))
    .offset(clampInt(offset, 0, 10000, 0));

  const totalRows = await db
    .select({ count: sql`count(*)::int` })
    .from(deliveryJobs)
    .where(where);

  const total = totalRows[0]?.count ?? 0;

  const enriched = await enrichJobs(rows);
  return { deliveries: enriched, total, limit, offset };
};

// ============================================
// ACTIVE (as courier)
// ============================================
export const getActiveDeliveries = async (userId, filters = {}) => {
  const { limit = 20, offset = 0 } = filters || {};

  const rows = await db
    .select()
    .from(deliveryJobs)
    .where(
      and(
        eq(deliveryJobs.courierId, userId),
        inArray(deliveryJobs.status, ['accepted', 'picked_up', 'delivered'])
      )
    )
    .orderBy(desc(deliveryJobs.acceptedAt))
    .limit(clampInt(limit, 1, 100, 20))
    .offset(clampInt(offset, 0, 10000, 0));

  const totalRows = await db
    .select({ count: sql`count(*)::int` })
    .from(deliveryJobs)
    .where(
      and(
        eq(deliveryJobs.courierId, userId),
        inArray(deliveryJobs.status, ['accepted', 'picked_up', 'delivered'])
      )
    );

  const total = totalRows[0]?.count ?? 0;

  const enriched = await enrichJobs(rows);
  return { deliveries: enriched, total, limit, offset };
};

// ============================================
// GET ONE
// ============================================
export const getDeliveryById = async (jobId) => {
  const [row] = await db
    .select()
    .from(deliveryJobs)
    .where(eq(deliveryJobs.id, jobId))
    .limit(1);

  if (!row) return null;

  const [enriched] = await enrichJobs([row]);
  return { ...enriched, effectiveStatus: effectiveStatus(enriched) };
};

// ============================================
// ACCEPT
// ============================================
export const acceptDelivery = async (courierId, jobId) => {
  const [job] = await db
    .select()
    .from(deliveryJobs)
    .where(eq(deliveryJobs.id, jobId))
    .limit(1);

  if (!job) throw new Error('Delivery job not found');
  if (job.posterId === courierId) throw new Error('You cannot accept your own delivery job');

  const status = effectiveStatus(job);
  if (status !== 'open') {
    throw new Error(`This delivery is ${status} and cannot be accepted`);
  }

  const activeRows = await db
    .select({ count: sql`count(*)::int` })
    .from(deliveryJobs)
    .where(
      and(
        eq(deliveryJobs.courierId, courierId),
        inArray(deliveryJobs.status, ['accepted', 'picked_up', 'delivered'])
      )
    );

  const activeCount = activeRows[0]?.count ?? 0;
  if (activeCount >= MAX_ACTIVE_DELIVERIES_PER_COURIER) {
    throw new Error(
      `You already have ${MAX_ACTIVE_DELIVERIES_PER_COURIER} active deliveries. Complete one first.`
    );
  }

  const [updated] = await db
    .update(deliveryJobs)
    .set({
      courierId,
      status: 'accepted',
      acceptedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(deliveryJobs.id, jobId))
    .returning();

  logger.info('Delivery accepted', { jobId, courierId });

  // ★ PHASE 6J: notify the poster
  try {
    const courierName = await getUserDisplayName(courierId);
    await notificationService.notifyDeliveryAccepted({
      posterId: job.posterId,
      deliveryId: jobId,
      deliveryTitle: job.title,
      courierName,
    });
  } catch (err) {
    logger.warn('notifyDeliveryAccepted failed', {
      jobId,
      error: err?.message || err,
    });
  }

  const [enriched] = await enrichJobs([updated]);
  return enriched;
};

// ============================================
// MARK PICKED UP
// ============================================
export const markPickedUp = async (courierId, jobId) => {
  const [job] = await db
    .select()
    .from(deliveryJobs)
    .where(eq(deliveryJobs.id, jobId))
    .limit(1);

  if (!job) throw new Error('Delivery job not found');
  if (job.courierId !== courierId) throw new Error('Only the assigned courier can update this');
  if (job.status !== 'accepted') {
    throw new Error(`Cannot mark picked up from status "${job.status}"`);
  }

  const [updated] = await db
    .update(deliveryJobs)
    .set({
      status: 'picked_up',
      pickedUpAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(deliveryJobs.id, jobId))
    .returning();

  logger.info('Delivery picked up', { jobId, courierId });

  // ★ PHASE 6J: notify the poster
  try {
    const courierName = await getUserDisplayName(courierId);
    await notificationService.notifyDeliveryPickedUp({
      posterId: job.posterId,
      deliveryId: jobId,
      deliveryTitle: job.title,
      courierName,
    });
  } catch (err) {
    logger.warn('notifyDeliveryPickedUp failed', {
      jobId,
      error: err?.message || err,
    });
  }

  const [enriched] = await enrichJobs([updated]);
  return enriched;
};

// ============================================
// MARK DELIVERED
// ============================================
export const markDelivered = async (courierId, jobId) => {
  const [job] = await db
    .select()
    .from(deliveryJobs)
    .where(eq(deliveryJobs.id, jobId))
    .limit(1);

  if (!job) throw new Error('Delivery job not found');
  if (job.courierId !== courierId) throw new Error('Only the assigned courier can update this');
  if (job.status !== 'picked_up') {
    throw new Error(`Cannot mark delivered from status "${job.status}"`);
  }

  const [updated] = await db
    .update(deliveryJobs)
    .set({
      status: 'delivered',
      deliveredAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(deliveryJobs.id, jobId))
    .returning();

  logger.info('Delivery delivered', { jobId, courierId });

  const [enriched] = await enrichJobs([updated]);
  return enriched;
};

// ============================================
// CONFIRM (poster only)
// ============================================
export const confirmDelivery = async (posterId, jobId) => {
  const [job] = await db
    .select()
    .from(deliveryJobs)
    .where(eq(deliveryJobs.id, jobId))
    .limit(1);

  if (!job) throw new Error('Delivery job not found');
  if (job.posterId !== posterId) throw new Error('Only the poster can confirm delivery');
  if (job.status === 'confirmed') return job;
  if (job.status !== 'delivered') {
    throw new Error(`Cannot confirm from status "${job.status}"`);
  }

  const [updated] = await db
    .update(deliveryJobs)
    .set({
      status: 'confirmed',
      confirmedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(deliveryJobs.id, jobId))
    .returning();

  // Bump courier trust score
  if (job.courierId) {
    try {
      await incrementDeliveries(job.courierId);
    } catch (err) {
      logger.warn('incrementDeliveries failed', {
        courierId: job.courierId,
        error: err.message,
      });
    }

    // ★ PHASE 6J: notify the courier
    try {
      const posterName = await getUserDisplayName(posterId);
      await notificationService.notifyDeliveryConfirmed({
        courierId: job.courierId,
        deliveryId: jobId,
        deliveryTitle: job.title,
        posterName,
      });
    } catch (err) {
      logger.warn('notifyDeliveryConfirmed failed', {
        jobId,
        error: err?.message || err,
      });
    }
  }

  logger.info('Delivery confirmed', { jobId, posterId, courierId: job.courierId });

  const [enriched] = await enrichJobs([updated]);
  return enriched;
};

// ============================================
// CANCEL (poster, only before pickup)
// ============================================
export const cancelDelivery = async (userId, jobId, reason = null) => {
  const [job] = await db
    .select()
    .from(deliveryJobs)
    .where(eq(deliveryJobs.id, jobId))
    .limit(1);

  if (!job) throw new Error('Delivery job not found');
  if (job.posterId !== userId) throw new Error('Only the poster can cancel');

  if (job.status === 'cancelled') return job;
  if (job.status === 'confirmed') {
    throw new Error('Cannot cancel a confirmed delivery');
  }
  if (job.status === 'picked_up' || job.status === 'delivered') {
    throw new Error('Cannot cancel after pickup. Contact your courier.');
  }

  const [updated] = await db
    .update(deliveryJobs)
    .set({
      status: 'cancelled',
      cancelledAt: new Date(),
      cancelReason: cleanString(reason, 500),
      updatedAt: new Date(),
    })
    .where(eq(deliveryJobs.id, jobId))
    .returning();

  logger.info('Delivery cancelled', { jobId, userId });

  const [enriched] = await enrichJobs([updated]);
  return enriched;
};

// ============================================
// EARNINGS (courier summary)
// ============================================
export const getCourierEarnings = async (courierId) => {
  const [totals] = await db
    .select({
      completedCount: sql`count(*)::int`,
      totalEarned: sql`COALESCE(SUM(${deliveryJobs.courierFee}), 0)`,
    })
    .from(deliveryJobs)
    .where(
      and(
        eq(deliveryJobs.courierId, courierId),
        eq(deliveryJobs.status, 'confirmed')
      )
    );

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [monthTotals] = await db
    .select({
      completedCount: sql`count(*)::int`,
      totalEarned: sql`COALESCE(SUM(${deliveryJobs.courierFee}), 0)`,
    })
    .from(deliveryJobs)
    .where(
      and(
        eq(deliveryJobs.courierId, courierId),
        eq(deliveryJobs.status, 'confirmed'),
        sql`${deliveryJobs.confirmedAt} >= ${monthStart.toISOString()}`
      )
    );

  const [activeTotals] = await db
    .select({ count: sql`count(*)::int` })
    .from(deliveryJobs)
    .where(
      and(
        eq(deliveryJobs.courierId, courierId),
        inArray(deliveryJobs.status, ['accepted', 'picked_up', 'delivered'])
      )
    );

  const recentJobs = await db
    .select()
    .from(deliveryJobs)
    .where(
      and(
        eq(deliveryJobs.courierId, courierId),
        eq(deliveryJobs.status, 'confirmed')
      )
    )
    .orderBy(desc(deliveryJobs.confirmedAt))
    .limit(10);

  const enrichedRecent = await enrichJobs(recentJobs);

  return {
    lifetime: {
      completedCount: totals?.completedCount ?? 0,
      totalEarned: Number(totals?.totalEarned ?? 0),
    },
    thisMonth: {
      completedCount: monthTotals?.completedCount ?? 0,
      totalEarned: Number(monthTotals?.totalEarned ?? 0),
    },
    activeCount: activeTotals?.count ?? 0,
    recent: enrichedRecent,
  };
};

// ============================================
// EXPIRE STALE (worker / cron)
// ============================================
export const expireStaleJobs = async () => {
  const result = await db
    .update(deliveryJobs)
    .set({ status: 'expired', updatedAt: new Date() })
    .where(
      and(
        eq(deliveryJobs.status, 'open'),
        sql`${deliveryJobs.expiresAt} IS NOT NULL`,
        sql`${deliveryJobs.expiresAt} < NOW()`
      )
    )
    .returning({ id: deliveryJobs.id });

  logger.info(`Expired ${result.length} stale delivery jobs`);
  return result.length;
};

// ============================================
// DELETE (poster only — hard delete for cleanup)
// ============================================
export const deleteDelivery = async (userId, jobId) => {
  const [job] = await db
    .select()
    .from(deliveryJobs)
    .where(eq(deliveryJobs.id, jobId))
    .limit(1);

  if (!job) throw new Error('Delivery job not found');
  if (job.posterId !== userId) throw new Error('Only the poster can delete');
  if (job.status === 'picked_up' || job.status === 'delivered' || job.status === 'confirmed') {
    throw new Error('Cannot delete a delivery that is in progress or complete');
  }

  await db.delete(deliveryJobs).where(eq(deliveryJobs.id, jobId));
  logger.info('Delivery deleted', { jobId, userId });
  return { success: true };
};

export default {
  createDeliveryJob,
  listDeliveryJobs,
  getMyDeliveryJobs,
  getActiveDeliveries,
  getDeliveryById,
  acceptDelivery,
  markPickedUp,
  markDelivered,
  confirmDelivery,
  cancelDelivery,
  getCourierEarnings,
  expireStaleJobs,
  deleteDelivery,
};