// backend/src/services/deliveriesService.js
import { eq, and, or, desc, asc, sql, inArray, ilike, ne } from 'drizzle-orm';
import { db } from '../db/index.js';
import {
  deliveryJobs,
  deliveryCourierRequests,
  requests,
  profiles,
  trustScores,
} from '../db/schema.js';
import { logger } from '../utils/logger.js';
import { incrementDeliveries } from './trustScoreService.js';
import notificationService from './notificationService.js';
import { reverseGeocode } from './geocodingService.js';
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
 * ★ PHASE 1: strip pickup/dropoff lat/lng before returning to clients.
 */
const sanitizeJob = (row) => {
  if (!row) return row;
  const { pickupLat, pickupLng, dropoffLat, dropoffLng, ...rest } = row;
  return rest;
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
    if (r.pendingCourierId) userIds.add(r.pendingCourierId);
  }

  const idArray = [...userIds];
  if (idArray.length === 0) return rows.map(sanitizeJob);

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
    ...sanitizeJob(r),
    poster: profileMap[r.posterId]
      ? { ...profileMap[r.posterId], trust: trustMap[r.posterId] || null }
      : null,
    courier:
      r.courierId && profileMap[r.courierId]
        ? { ...profileMap[r.courierId], trust: trustMap[r.courierId] || null }
        : null,
    pendingCourier:
      r.pendingCourierId && profileMap[r.pendingCourierId]
        ? {
            ...profileMap[r.pendingCourierId],
            trust: trustMap[r.pendingCourierId] || null,
          }
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

/**
 * ★ PHASE 3: find the buyer for a delivery job.
 * If the job links to a request, the request owner is the buyer.
 * Otherwise, returns null.
 */
const findBuyerId = async (job) => {
  if (!job?.requestId) return null;
  try {
    const [req] = await db
      .select({ userId: requests.userId })
      .from(requests)
      .where(eq(requests.id, job.requestId))
      .limit(1);
    return req?.userId || null;
  } catch {
    return null;
  }
};

/**
 * ★ PHASE 3: are both required approvals in place?
 * - If no buyer → only seller approval needed
 * - If buyer exists → both required
 */
const approvalsComplete = (job, buyerId) => {
  if (job.sellerApprovalStatus !== 'approved') return false;
  if (buyerId && job.buyerApprovalStatus !== 'approved') return false;
  return true;
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

  let cleanPickup = cleanString(pickupLocation, 200);
  if (!cleanPickup && pickupLat != null && pickupLng != null) {
    try {
      cleanPickup = await reverseGeocode(pickupLat, pickupLng);
    } catch (err) {
      logger.warn('reverseGeocode failed on pickup', { error: err?.message || err });
    }
  }
  if (!cleanPickup) {
    throw new Error('Pickup location is required');
  }

  let cleanDropoff = cleanString(dropoffLocation, 200);
  if (!cleanDropoff && dropoffLat != null && dropoffLng != null) {
    try {
      cleanDropoff = await reverseGeocode(dropoffLat, dropoffLng);
    } catch (err) {
      logger.warn('reverseGeocode failed on dropoff', { error: err?.message || err });
    }
  }
  if (!cleanDropoff) {
    throw new Error('Dropoff location is required');
  }

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
        inArray(deliveryJobs.status, ['open', 'pending_approval', 'accepted', 'picked_up', 'delivered'])
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
  const { status, limit = 20, offset = 0 } = filters;

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
  const buyerId = await findBuyerId(row);
  const base = { ...enriched, effectiveStatus: effectiveStatus(enriched), buyerId };

  // Attach pending courier requests (only when job is pending_approval)
  if (row.status === 'pending_approval') {
    try {
      base.courierRequests = await listCourierRequestsInternal(jobId);
    } catch (err) {
      logger.warn('Failed to attach courier requests', { jobId, error: err?.message });
      base.courierRequests = [];
    }
  } else {
    base.courierRequests = [];
  }

  return base;
};

// ============================================
// INTERNAL: list courier requests for a job
// ============================================
const listCourierRequestsInternal = async (jobId) => {
  const rows = await db
    .select()
    .from(deliveryCourierRequests)
    .where(eq(deliveryCourierRequests.deliveryId, jobId))
    .orderBy(asc(deliveryCourierRequests.createdAt));

  if (rows.length === 0) return [];

  const courierIds = [...new Set(rows.map((r) => r.courierId))];
  const profilesRows = await db
    .select({
      id: profiles.id,
      fullName: profiles.fullName,
      avatarUrl: profiles.avatarUrl,
      phone: profiles.phone,
    })
    .from(profiles)
    .where(inArray(profiles.id, courierIds));

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
    .where(inArray(trustScores.userId, courierIds));

  const profileMap = Object.fromEntries(profilesRows.map((p) => [p.id, p]));
  const trustMap = Object.fromEntries(trustRows.map((t) => [t.userId, t]));

  return rows.map((r) => ({
    ...r,
    courier: profileMap[r.courierId]
      ? { ...profileMap[r.courierId], trust: trustMap[r.courierId] || null }
      : null,
  }));
};

export const listCourierRequests = async (jobId) => {
  return listCourierRequestsInternal(jobId);
};

// ============================================
// ★ PHASE 3: REQUEST TO DELIVER (competitive)
// Replaces old acceptDelivery. Job moves to pending_approval.
// Multiple couriers can request simultaneously.
// ============================================
export const acceptDelivery = async (courierId, jobId, options = {}) => {
  const { note = null } = options;

  const [job] = await db
    .select()
    .from(deliveryJobs)
    .where(eq(deliveryJobs.id, jobId))
    .limit(1);

  if (!job) throw new Error('Delivery job not found');
  if (job.posterId === courierId) {
    throw new Error('You cannot request your own delivery job');
  }

  const status = effectiveStatus(job);
  if (status !== 'open' && status !== 'pending_approval') {
    throw new Error(`This delivery is ${status} and cannot be requested`);
  }

  // Cap: max 5 active deliveries as courier
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

  // Prevent duplicate request
  const existing = await db
    .select()
    .from(deliveryCourierRequests)
    .where(
      and(
        eq(deliveryCourierRequests.deliveryId, jobId),
        eq(deliveryCourierRequests.courierId, courierId)
      )
    )
    .limit(1);

  if (existing.length > 0 && existing[0].status === 'pending') {
    throw new Error('You have already requested this delivery');
  }

  // Create or revive the courier request
  let requestRow;
  if (existing.length > 0) {
    const [updated] = await db
      .update(deliveryCourierRequests)
      .set({
        status: 'pending',
        note: cleanString(note, 500),
        rejectionReason: null,
        reviewedBySellerId: null,
        reviewedByBuyerId: null,
        sellerReviewedAt: null,
        buyerReviewedAt: null,
        updatedAt: new Date(),
      })
      .where(eq(deliveryCourierRequests.id, existing[0].id))
      .returning();
    requestRow = updated;
  } else {
    const [created] = await db
      .insert(deliveryCourierRequests)
      .values({
        deliveryId: jobId,
        courierId,
        status: 'pending',
        note: cleanString(note, 500),
      })
      .returning();
    requestRow = created;
  }

  // Move the job to pending_approval (if not already) + reset approvals
  if (job.status === 'open') {
    await db
      .update(deliveryJobs)
      .set({
        status: 'pending_approval',
        pendingCourierId: courierId,
        sellerApprovalStatus: 'pending',
        buyerApprovalStatus: null,
        sellerApprovedAt: null,
        buyerApprovedAt: null,
        courierRequestedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(deliveryJobs.id, jobId));
  }

  // Notify seller + (if linked) buyer
  const courierName = await getUserDisplayName(courierId);
  const buyerId = await findBuyerId(job);

  try {
    await notificationService.notifyCourierRequestReceived({
      reviewerId: job.posterId,
      deliveryId: jobId,
      deliveryTitle: job.title,
      courierName,
      isBuyer: false,
    });
  } catch (err) {
    logger.warn('notifyCourierRequestReceived (seller) failed', {
      jobId,
      error: err?.message || err,
    });
  }

  if (buyerId && buyerId !== job.posterId) {
    try {
      await notificationService.notifyCourierRequestReceived({
        reviewerId: buyerId,
        deliveryId: jobId,
        deliveryTitle: job.title,
        courierName,
        isBuyer: true,
      });
    } catch (err) {
      logger.warn('notifyCourierRequestReceived (buyer) failed', {
        jobId,
        error: err?.message || err,
      });
    }
  }

  logger.info('Courier requested delivery', { jobId, courierId });

  const [enriched] = await enrichJobs([job]);
  return { delivery: enriched, courierRequest: requestRow };
};

// ============================================
// ★ PHASE 3: APPROVE COURIER
// Called by seller OR buyer for a specific courier request.
// When all required approvals are in → assign courier, auto-reject others.
// ============================================
export const approveCourier = async (reviewerId, jobId, courierRequestId, options = {}) => {
  const { reason = null } = options;

  const [job] = await db
    .select()
    .from(deliveryJobs)
    .where(eq(deliveryJobs.id, jobId))
    .limit(1);

  if (!job) throw new Error('Delivery job not found');
  if (job.status !== 'pending_approval') {
    throw new Error(`Cannot approve — this delivery is ${job.status}`);
  }

  const [requestRow] = await db
    .select()
    .from(deliveryCourierRequests)
    .where(eq(deliveryCourierRequests.id, courierRequestId))
    .limit(1);

  if (!requestRow) throw new Error('Courier request not found');
  if (requestRow.deliveryId !== jobId) {
    throw new Error('Courier request does not belong to this job');
  }
  if (requestRow.status !== 'pending') {
    throw new Error(`This courier request is already ${requestRow.status}`);
  }

  const buyerId = await findBuyerId(job);
  const isSeller = reviewerId === job.posterId;
  const isBuyer = buyerId && reviewerId === buyerId;

  if (!isSeller && !isBuyer) {
    throw new Error('Only the poster or the linked buyer can approve couriers');
  }

  // Record this reviewer's approval on the request row
  const reviewPatch = {
    updatedAt: new Date(),
  };
  if (isSeller) {
    reviewPatch.reviewedBySellerId = reviewerId;
    reviewPatch.sellerReviewedAt = new Date();
  }
  if (isBuyer) {
    reviewPatch.reviewedByBuyerId = reviewerId;
    reviewPatch.buyerReviewedAt = new Date();
  }

  // Decide if this approval completes the required set
  // We need: seller approved AND (if buyer exists) buyer approved.
  const sellerAlreadyApproved =
    isSeller || job.sellerApprovalStatus === 'approved';
  const buyerAlreadyApproved =
    !buyerId || isBuyer || job.buyerApprovalStatus === 'approved';

  const fullyApproved = sellerAlreadyApproved && buyerAlreadyApproved;

  // Update the request row (stamp reviewer)
  await db
    .update(deliveryCourierRequests)
    .set(reviewPatch)
    .where(eq(deliveryCourierRequests.id, courierRequestId));

  // Update job approval state
  const jobPatch = {
    pendingCourierId: requestRow.courierId,
    updatedAt: new Date(),
  };
  if (isSeller) {
    jobPatch.sellerApprovalStatus = 'approved';
    jobPatch.sellerApprovedAt = new Date();
  }
  if (isBuyer) {
    jobPatch.buyerApprovalStatus = 'approved';
    jobPatch.buyerApprovedAt = new Date();
  }

  if (fullyApproved) {
    // Assign the courier
    jobPatch.courierId = requestRow.courierId;
    jobPatch.status = 'accepted';
    jobPatch.acceptedAt = new Date();
  }

  await db
    .update(deliveryJobs)
    .set(jobPatch)
    .where(eq(deliveryJobs.id, jobId));

  if (fullyApproved) {
    // Mark this courier request as approved
    await db
      .update(deliveryCourierRequests)
      .set({ status: 'approved', updatedAt: new Date() })
      .where(eq(deliveryCourierRequests.id, courierRequestId));

    // Auto-reject all OTHER pending courier requests
    const otherPending = await db
      .select()
      .from(deliveryCourierRequests)
      .where(
        and(
          eq(deliveryCourierRequests.deliveryId, jobId),
          eq(deliveryCourierRequests.status, 'pending'),
          ne(deliveryCourierRequests.id, courierRequestId)
        )
      );

    if (otherPending.length > 0) {
      await db
        .update(deliveryCourierRequests)
        .set({
          status: 'auto_rejected',
          rejectionReason: 'Another courier was selected',
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(deliveryCourierRequests.deliveryId, jobId),
            eq(deliveryCourierRequests.status, 'pending'),
            ne(deliveryCourierRequests.id, courierRequestId)
          )
        );

      // Notify auto-rejected couriers
      for (const other of otherPending) {
        try {
          await notificationService.notifyCourierRequestAutoRejected({
            courierId: other.courierId,
            deliveryId: jobId,
            deliveryTitle: job.title,
          });
        } catch (err) {
          logger.warn('notifyCourierRequestAutoRejected failed', {
            jobId,
            courierId: other.courierId,
            error: err?.message || err,
          });
        }
      }
    }

    // Notify the approved courier
    try {
      await notificationService.notifyCourierApproved({
        courierId: requestRow.courierId,
        deliveryId: jobId,
        deliveryTitle: job.title,
        approvedBy: reviewerId,
      });
    } catch (err) {
      logger.warn('notifyCourierApproved failed', {
        jobId,
        error: err?.message || err,
      });
    }

    logger.info('Courier fully approved and assigned', {
      jobId,
      courierId: requestRow.courierId,
      approvedBy: reviewerId,
    });
  } else {
    // Partial approval — leave request pending, notify other reviewer
    logger.info('Courier partially approved', {
      jobId,
      courierRequestId,
      reviewedBy: reviewerId,
      isSeller,
      isBuyer,
    });
  }

  // Return the freshly loaded job
  const [row] = await db
    .select()
    .from(deliveryJobs)
    .where(eq(deliveryJobs.id, jobId))
    .limit(1);
  const [enriched] = await enrichJobs([row]);

  return {
    delivery: enriched,
    fullyApproved,
    courierRequestId,
  };
};

// ============================================
// ★ PHASE 3: REJECT COURIER
// ============================================
export const rejectCourier = async (reviewerId, jobId, courierRequestId, options = {}) => {
  const { reason = null } = options;

  const [job] = await db
    .select()
    .from(deliveryJobs)
    .where(eq(deliveryJobs.id, jobId))
    .limit(1);

  if (!job) throw new Error('Delivery job not found');

  const [requestRow] = await db
    .select()
    .from(deliveryCourierRequests)
    .where(eq(deliveryCourierRequests.id, courierRequestId))
    .limit(1);

  if (!requestRow) throw new Error('Courier request not found');
  if (requestRow.deliveryId !== jobId) {
    throw new Error('Courier request does not belong to this job');
  }
  if (requestRow.status !== 'pending') {
    throw new Error(`This courier request is already ${requestRow.status}`);
  }

  const buyerId = await findBuyerId(job);
  const isSeller = reviewerId === job.posterId;
  const isBuyer = buyerId && reviewerId === buyerId;

  if (!isSeller && !isBuyer) {
    throw new Error('Only the poster or the linked buyer can reject couriers');
  }

  await db
    .update(deliveryCourierRequests)
    .set({
      status: 'rejected',
      rejectionReason: cleanString(reason, 500),
      updatedAt: new Date(),
    })
    .where(eq(deliveryCourierRequests.id, courierRequestId));

  // If this was the only pending request and no other couriers, reset job to open
  const remainingPending = await db
    .select({ count: sql`count(*)::int` })
    .from(deliveryCourierRequests)
    .where(
      and(
        eq(deliveryCourierRequests.deliveryId, jobId),
        eq(deliveryCourierRequests.status, 'pending')
      )
    );

  const remaining = remainingPending[0]?.count ?? 0;

  if (remaining === 0) {
    await db
      .update(deliveryJobs)
      .set({
        status: 'open',
        pendingCourierId: null,
        sellerApprovalStatus: null,
        buyerApprovalStatus: null,
        sellerApprovedAt: null,
        buyerApprovedAt: null,
        courierRequestedAt: null,
        updatedAt: new Date(),
      })
      .where(eq(deliveryJobs.id, jobId));
  } else {
    // Still have other pending requests — if the rejected one was the "current"
    // pendingCourierId, swap to another pending request.
    if (job.pendingCourierId === requestRow.courierId) {
      const [nextPending] = await db
        .select()
        .from(deliveryCourierRequests)
        .where(
          and(
            eq(deliveryCourierRequests.deliveryId, jobId),
            eq(deliveryCourierRequests.status, 'pending')
          )
        )
        .orderBy(asc(deliveryCourierRequests.createdAt))
        .limit(1);

      if (nextPending) {
        await db
          .update(deliveryJobs)
          .set({
            pendingCourierId: nextPending.courierId,
            sellerApprovalStatus: 'pending',
            buyerApprovalStatus: null,
            sellerApprovedAt: null,
            buyerApprovedAt: null,
            updatedAt: new Date(),
          })
          .where(eq(deliveryJobs.id, jobId));
      }
    }
  }

  // Notify the rejected courier
  try {
    await notificationService.notifyCourierRejected({
      courierId: requestRow.courierId,
      deliveryId: jobId,
      deliveryTitle: job.title,
      reason: reason || null,
    });
  } catch (err) {
    logger.warn('notifyCourierRejected failed', {
      jobId,
      error: err?.message || err,
    });
  }

  logger.info('Courier request rejected', {
    jobId,
    courierRequestId,
    courierId: requestRow.courierId,
    rejectedBy: reviewerId,
  });

  const [row] = await db
    .select()
    .from(deliveryJobs)
    .where(eq(deliveryJobs.id, jobId))
    .limit(1);
  const [enriched] = await enrichJobs([row]);

  return { delivery: enriched };
};

// ============================================
// ★ PHASE 3: WITHDRAW COURIER REQUEST
// ============================================
export const withdrawCourierRequest = async (courierId, jobId, courierRequestId) => {
  const [requestRow] = await db
    .select()
    .from(deliveryCourierRequests)
    .where(eq(deliveryCourierRequests.id, courierRequestId))
    .limit(1);

  if (!requestRow) throw new Error('Courier request not found');
  if (requestRow.deliveryId !== jobId) {
    throw new Error('Courier request does not belong to this job');
  }
  if (requestRow.courierId !== courierId) {
    throw new Error('You can only withdraw your own request');
  }
  if (requestRow.status !== 'pending') {
    throw new Error(`Cannot withdraw a request that is ${requestRow.status}`);
  }

  await db
    .update(deliveryCourierRequests)
    .set({
      status: 'withdrawn',
      updatedAt: new Date(),
    })
    .where(eq(deliveryCourierRequests.id, courierRequestId));

  // If the job was tied to this courier and no other pending requests remain → reset to open
  const [job] = await db
    .select()
    .from(deliveryJobs)
    .where(eq(deliveryJobs.id, jobId))
    .limit(1);

  if (job) {
    const remainingPending = await db
      .select({ count: sql`count(*)::int` })
      .from(deliveryCourierRequests)
      .where(
        and(
          eq(deliveryCourierRequests.deliveryId, jobId),
          eq(deliveryCourierRequests.status, 'pending')
        )
      );

    if ((remainingPending[0]?.count ?? 0) === 0) {
      await db
        .update(deliveryJobs)
        .set({
          status: 'open',
          pendingCourierId: null,
          sellerApprovalStatus: null,
          buyerApprovalStatus: null,
          sellerApprovedAt: null,
          buyerApprovedAt: null,
          courierRequestedAt: null,
          updatedAt: new Date(),
        })
        .where(eq(deliveryJobs.id, jobId));
    }
  }

  logger.info('Courier request withdrawn', {
    jobId,
    courierRequestId,
    courierId,
  });

  return { success: true };
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

  if (job.courierId) {
    try {
      await incrementDeliveries(job.courierId);
    } catch (err) {
      logger.warn('incrementDeliveries failed', {
        courierId: job.courierId,
        error: err.message,
      });
    }

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

  // Auto-reject any pending courier requests
  await db
    .update(deliveryCourierRequests)
    .set({
      status: 'auto_rejected',
      rejectionReason: 'Delivery cancelled by poster',
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(deliveryCourierRequests.deliveryId, jobId),
        eq(deliveryCourierRequests.status, 'pending')
      )
    );

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
  listCourierRequests,
  acceptDelivery,
  approveCourier,
  rejectCourier,
  withdrawCourierRequest,
  markPickedUp,
  markDelivered,
  confirmDelivery,
  cancelDelivery,
  getCourierEarnings,
  expireStaleJobs,
  deleteDelivery,
};