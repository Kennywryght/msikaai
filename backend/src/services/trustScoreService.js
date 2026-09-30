// backend/src/services/trustScoreService.js
import { eq, and, sql } from 'drizzle-orm';
import { db } from '../db/index.js';
import {
  trustScores,
  verificationRequests,
  listings,
  businesses,
  payments,
} from '../db/schema.js';
import { logger } from '../utils/logger.js';
import {
  TRUST_TIERS,
  TRUST_SCORE_WEIGHTS,
  resolveTier,
} from '../utils/constants.js';

/**
 * Ensure a trust_scores row exists for this user.
 */
export const ensureTrustRow = async (userId) => {
  const existing = await db
    .select()
    .from(trustScores)
    .where(eq(trustScores.userId, userId))
    .limit(1);

  if (existing.length > 0) return existing[0];

  const [created] = await db
    .insert(trustScores)
    .values({ userId })
    .returning();

  return created;
};

/**
 * Gather counters the score depends on.
 */
const gatherInputs = async (userId) => {
  const listingRows = await db
    .select({ count: sql`count(*)::int` })
    .from(listings)
    .innerJoin(businesses, eq(listings.businessId, businesses.id))
    .where(eq(businesses.userId, userId));

  const listingsCount = listingRows[0]?.count ?? 0;

  const premiumRows = await db
    .select({ count: sql`count(*)::int` })
    .from(payments)
    .where(and(eq(payments.userId, userId), eq(payments.status, 'success')));

  const premiumPurchases = premiumRows[0]?.count ?? 0;

  return { listingsCount, premiumPurchases };
};

/**
 * Pure score computation from a trust_scores row.
 */
export const computeScore = (row) => {
  const W = TRUST_SCORE_WEIGHTS;

  if (row.suspended) return 0;

  let score = W.BASE;

  const volumeRaw =
    (row.listingsCount || 0) * W.VOLUME_PER_LISTING +
    (row.responsesCount || 0) * W.VOLUME_PER_RESPONSE +
    (row.premiumPurchases || 0) * W.VOLUME_PER_PREMIUM +
    (row.fulfilledRequestsCount || 0) * (W.VOLUME_PER_FULFILLED_REQUEST || 0) +
    (row.deliveriesCompletedCount || 0) * (W.VOLUME_PER_DELIVERY || 0);
  score += Math.min(W.VOLUME_CAP, volumeRaw);

  const avg = parseFloat(row.averageRating || '0');
  if ((row.totalReviews || 0) >= W.RATING_MIN_REVIEWS && avg > 0) {
    score += Math.min(W.RATING_MAX, (avg / 5) * W.RATING_MAX);
  }

  if (row.emailVerified) score += W.VERIFICATION_BONUS.email;
  if (row.phoneVerified) score += W.VERIFICATION_BONUS.phone;
  if (row.idVerified) score += W.VERIFICATION_BONUS.id;
  if (row.businessVerified) score += W.VERIFICATION_BONUS.business;

  score -= (row.reportsUpheld || 0) * W.REPORT_PENALTY_PER_UPHELD;

  return Math.max(0, Math.min(100, Math.round(score)));
};

/**
 * Recompute and persist the trust score.
 */
export const recomputeForUser = async (userId) => {
  try {
    const row = await ensureTrustRow(userId);
    const { listingsCount, premiumPurchases } = await gatherInputs(userId);

    const tier = resolveTier({
      phoneVerified: row.phoneVerified,
      idVerified: row.idVerified,
      businessVerified: row.businessVerified,
    });

    const escrowLimit = TRUST_TIERS[tier]?.escrowLimit ?? TRUST_TIERS[0].escrowLimit;

    const merged = {
      ...row,
      listingsCount,
      premiumPurchases,
    };
    const trustScore = computeScore(merged);

    const [updated] = await db
      .update(trustScores)
      .set({
        listingsCount,
        premiumPurchases,
        tier,
        escrowLimit: String(escrowLimit),
        trustScore,
        lastComputedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(trustScores.userId, userId))
      .returning();

    logger.info('Trust score recomputed', { userId, trustScore, tier });
    return updated;
  } catch (error) {
    logger.error('recomputeForUser failed', { userId, error: error.message });
    throw error;
  }
};

/**
 * Get a trust profile, recomputing if stale (> 5 min).
 */
export const getTrustProfile = async (userId) => {
  const row = await ensureTrustRow(userId);

  const staleMs = 5 * 60 * 1000;
  const last = row.lastComputedAt ? new Date(row.lastComputedAt).getTime() : 0;
  if (Date.now() - last > staleMs) {
    return recomputeForUser(userId);
  }

  return row;
};

/**
 * Flip a verification flag and recompute.
 */
export const applyVerificationApproval = async (userId, type) => {
  const patch = {};
  if (type === 'email') patch.emailVerified = true;
  if (type === 'phone') patch.phoneVerified = true;
  if (type === 'id') patch.idVerified = true;
  if (type === 'business') patch.businessVerified = true;

  await ensureTrustRow(userId);

  await db
    .update(trustScores)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(trustScores.userId, userId));

  return recomputeForUser(userId);
};

/**
 * Bump the responses counter, then recompute.
 */
export const incrementResponses = async (userId) => {
  await ensureTrustRow(userId);
  await db
    .update(trustScores)
    .set({
      responsesCount: sql`${trustScores.responsesCount} + 1`,
      updatedAt: new Date(),
    })
    .where(eq(trustScores.userId, userId));
  return recomputeForUser(userId);
};

/**
 * Bump the fulfilled-requests counter, then recompute.
 */
export const incrementFulfilledRequests = async (userId) => {
  await ensureTrustRow(userId);
  await db
    .update(trustScores)
    .set({
      fulfilledRequestsCount: sql`${trustScores.fulfilledRequestsCount} + 1`,
      updatedAt: new Date(),
    })
    .where(eq(trustScores.userId, userId));
  return recomputeForUser(userId);
};

/**
 * ★ PHASE 6B: Bump the deliveries completed counter, then recompute.
 * Called when a poster confirms receipt of the delivery.
 */
export const incrementDeliveries = async (userId) => {
  await ensureTrustRow(userId);
  await db
    .update(trustScores)
    .set({
      deliveriesCompletedCount: sql`${trustScores.deliveriesCompletedCount} + 1`,
      updatedAt: new Date(),
    })
    .where(eq(trustScores.userId, userId));
  return recomputeForUser(userId);
};

/**
 * Record a report against a user.
 */
export const recordReport = async (userId, upheld = false) => {
  await ensureTrustRow(userId);

  const setObj = {
    reportsAgainst: sql`${trustScores.reportsAgainst} + 1`,
    updatedAt: new Date(),
  };

  if (upheld) {
    setObj.reportsUpheld = sql`${trustScores.reportsUpheld} + 1`;
  }

  await db.update(trustScores).set(setObj).where(eq(trustScores.userId, userId));

  return recomputeForUser(userId);
};

export default {
  ensureTrustRow,
  computeScore,
  recomputeForUser,
  getTrustProfile,
  applyVerificationApproval,
  incrementResponses,
  incrementFulfilledRequests,
  incrementDeliveries,
  recordReport,
};