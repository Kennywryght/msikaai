// backend/src/services/requestsService.js
import { eq, and, or, desc, asc, sql, inArray, ilike, gte, lte } from 'drizzle-orm';
import { db } from '../db/index.js';
import {
  requests,
  requestResponses,
  profiles,
  conversations,
  messages,
  trustScores,
} from '../db/schema.js';
import { logger } from '../utils/logger.js';
import {
  incrementResponses,
  incrementFulfilledRequests,
} from './trustScoreService.js';
import notificationService from './notificationService.js';

// ============================================
// CONSTANTS
// ============================================
const ALLOWED_EXPIRY_DAYS = [7, 14, 30];
const DEFAULT_EXPIRY_DAYS = 14;
const MAX_TITLE_LENGTH = 120;
const MAX_DESCRIPTION_LENGTH = 2000;
const MAX_MESSAGE_LENGTH = 1000;
const MAX_ACTIVE_REQUESTS_PER_USER = 10;

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

const enrichRequest = async (request, { includeAuthor = true } = {}) => {
  if (!request) return null;

  let author = null;
  if (includeAuthor) {
    const [profileRow] = await db
      .select({
        id: profiles.id,
        fullName: profiles.fullName,
        avatarUrl: profiles.avatarUrl,
        locationText: profiles.locationText,
      })
      .from(profiles)
      .where(eq(profiles.id, request.userId))
      .limit(1);

    const [trustRow] = await db
      .select({
        tier: trustScores.tier,
        trustScore: trustScores.trustScore,
        emailVerified: trustScores.emailVerified,
        phoneVerified: trustScores.phoneVerified,
        idVerified: trustScores.idVerified,
        businessVerified: trustScores.businessVerified,
        averageRating: trustScores.averageRating,
        totalReviews: trustScores.totalReviews,
      })
      .from(trustScores)
      .where(eq(trustScores.userId, request.userId))
      .limit(1);

    author = profileRow
      ? { ...profileRow, trust: trustRow || null }
      : null;
  }

  return { ...request, author };
};

const effectiveStatus = (row) => {
  if (!row) return 'open';
  if (
    (row.status === 'open' || row.status === 'answered') &&
    row.expiresAt &&
    new Date(row.expiresAt).getTime() < Date.now()
  ) {
    return 'expired';
  }
  return row.status;
};

// Small helper: fetch a user's display name
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
export const createRequest = async (userId, data) => {
  const {
    title,
    description,
    category,
    locationArea,
    locationLat,
    locationLng,
    budgetMin,
    budgetMax,
    urgency,
    expiryDays,
  } = data;

  if (!title || typeof title !== 'string' || !title.trim()) {
    throw new Error('Title is required');
  }
  const cleanTitle = title.trim().slice(0, MAX_TITLE_LENGTH);
  const cleanDescription = (description || '').trim().slice(0, MAX_DESCRIPTION_LENGTH);

  const activeRows = await db
    .select({ count: sql`count(*)::int` })
    .from(requests)
    .where(
      and(
        eq(requests.userId, userId),
        inArray(requests.status, ['open', 'answered'])
      )
    );

  const activeCount = activeRows[0]?.count ?? 0;
  if (activeCount >= MAX_ACTIVE_REQUESTS_PER_USER) {
    throw new Error(
      `You already have ${MAX_ACTIVE_REQUESTS_PER_USER} active requests. Fulfil or cancel one first.`
    );
  }

  const chosenDays = ALLOWED_EXPIRY_DAYS.includes(parseInt(expiryDays, 10))
    ? parseInt(expiryDays, 10)
    : DEFAULT_EXPIRY_DAYS;
  const expiresAt = new Date(Date.now() + chosenDays * 24 * 60 * 60 * 1000);

  const budgetMinNum = parseAmount(budgetMin);
  const budgetMaxNum = parseAmount(budgetMax);

  if (budgetMinNum !== null && budgetMaxNum !== null && budgetMinNum > budgetMaxNum) {
    throw new Error('budgetMin cannot be greater than budgetMax');
  }

  const urgencyValue = ['low', 'medium', 'high', 'urgent'].includes(urgency)
    ? urgency
    : 'medium';

  const [created] = await db
    .insert(requests)
    .values({
      userId,
      title: cleanTitle,
      description: cleanDescription || null,
      category: category || 'Other',
      locationArea: locationArea || null,
      locationLat: locationLat != null ? String(locationLat) : null,
      locationLng: locationLng != null ? String(locationLng) : null,
      budgetMin: budgetMinNum != null ? String(budgetMinNum) : null,
      budgetMax: budgetMaxNum != null ? String(budgetMaxNum) : null,
      urgency: urgencyValue,
      status: 'open',
      expiresAt,
    })
    .returning();

  logger.info('Request created', { requestId: created.id, userId });
  return enrichRequest(created, { includeAuthor: true });
};

// ============================================
// LIST / FEED
// ============================================
export const listRequests = async (filters = {}) => {
  const {
    status,
    category,
    urgency,
    search,
    locationArea,
    userId,
    limit = 20,
    offset = 0,
    sort = 'recent',
  } = filters;

  const conditions = [];

  if (status && status !== 'all') {
    conditions.push(eq(requests.status, status));
  } else {
    conditions.push(inArray(requests.status, ['open', 'answered']));
  }

  conditions.push(
    or(
      sql`${requests.expiresAt} IS NULL`,
      sql`${requests.expiresAt} > NOW()`
    )
  );

  if (category && category !== 'All') {
    conditions.push(eq(requests.category, category));
  }

  if (urgency && urgency !== 'all') {
    conditions.push(eq(requests.urgency, urgency));
  }

  if (locationArea) {
    conditions.push(ilike(requests.locationArea, `%${locationArea}%`));
  }

  if (userId) {
    conditions.push(eq(requests.userId, userId));
  }

  if (search && typeof search === 'string' && search.trim()) {
    const term = `%${search.trim()}%`;
    conditions.push(
      or(
        ilike(requests.title, term),
        ilike(requests.description, term)
      )
    );
  }

  const where = and(...conditions);

  const orderBy =
    sort === 'urgent'
      ? [
          sql`CASE ${requests.urgency}
            WHEN 'urgent' THEN 1
            WHEN 'high'   THEN 2
            WHEN 'medium' THEN 3
            WHEN 'low'    THEN 4
            ELSE 5 END`,
          desc(requests.createdAt),
        ]
      : sort === 'budget'
      ? [desc(requests.budgetMax), desc(requests.createdAt)]
      : [desc(requests.createdAt)];

  const rows = await db
    .select()
    .from(requests)
    .where(where)
    .orderBy(...orderBy)
    .limit(clampInt(limit, 1, 100, 20))
    .offset(clampInt(offset, 0, 10000, 0));

  const totalRows = await db
    .select({ count: sql`count(*)::int` })
    .from(requests)
    .where(where);

  const total = totalRows[0]?.count ?? 0;

  const userIds = [...new Set(rows.map((r) => r.userId))];
  let authorMap = {};
  let trustMap = {};

  if (userIds.length > 0) {
    const authorRows = await db
      .select({
        id: profiles.id,
        fullName: profiles.fullName,
        avatarUrl: profiles.avatarUrl,
        locationText: profiles.locationText,
      })
      .from(profiles)
      .where(inArray(profiles.id, userIds));

    const trustRows = await db
      .select({
        userId: trustScores.userId,
        tier: trustScores.tier,
        trustScore: trustScores.trustScore,
        emailVerified: trustScores.emailVerified,
        phoneVerified: trustScores.phoneVerified,
        idVerified: trustScores.idVerified,
        businessVerified: trustScores.businessVerified,
        averageRating: trustScores.averageRating,
        totalReviews: trustScores.totalReviews,
      })
      .from(trustScores)
      .where(inArray(trustScores.userId, userIds));

    authorMap = Object.fromEntries(authorRows.map((a) => [a.id, a]));
    trustMap = Object.fromEntries(trustRows.map((t) => [t.userId, t]));
  }

  const enriched = rows.map((r) => ({
    ...r,
    author: authorMap[r.userId]
      ? { ...authorMap[r.userId], trust: trustMap[r.userId] || null }
      : null,
  }));

  return { requests: enriched, total, limit, offset };
};

export const getMyRequests = async (userId, filters = {}) => {
  return listRequests({ ...filters, userId });
};

// ============================================
// GET ONE
// ============================================
export const getRequestById = async (requestId, { includeResponses = true } = {}) => {
  const [row] = await db
    .select()
    .from(requests)
    .where(eq(requests.id, requestId))
    .limit(1);

  if (!row) return null;

  const enriched = await enrichRequest(row, { includeAuthor: true });

  if (!includeResponses) return enriched;

  const responseRows = await db
    .select()
    .from(requestResponses)
    .where(eq(requestResponses.requestId, requestId))
    .orderBy(desc(requestResponses.createdAt));

  const responderIds = [...new Set(responseRows.map((r) => r.responderId))];
  let responderMap = {};
  let responderTrustMap = {};

  if (responderIds.length > 0) {
    const responderProfiles = await db
      .select({
        id: profiles.id,
        fullName: profiles.fullName,
        avatarUrl: profiles.avatarUrl,
        locationText: profiles.locationText,
      })
      .from(profiles)
      .where(inArray(profiles.id, responderIds));

    const responderTrust = await db
      .select({
        userId: trustScores.userId,
        tier: trustScores.tier,
        trustScore: trustScores.trustScore,
        emailVerified: trustScores.emailVerified,
        phoneVerified: trustScores.phoneVerified,
        idVerified: trustScores.idVerified,
        businessVerified: trustScores.businessVerified,
        averageRating: trustScores.averageRating,
        totalReviews: trustScores.totalReviews,
      })
      .from(trustScores)
      .where(inArray(trustScores.userId, responderIds));

    responderMap = Object.fromEntries(responderProfiles.map((r) => [r.id, r]));
    responderTrustMap = Object.fromEntries(responderTrust.map((t) => [t.userId, t]));
  }

  const responses = responseRows.map((r) => ({
    ...r,
    responder: responderMap[r.responderId]
      ? {
          ...responderMap[r.responderId],
          trust: responderTrustMap[r.responderId] || null,
        }
      : null,
  }));

  return { ...enriched, effectiveStatus: effectiveStatus(enriched), responses };
};

// ============================================
// RESPOND
// ============================================
export const respondToRequest = async (userId, requestId, data) => {
  const { message, offeredPrice } = data || {};

  const [request] = await db
    .select()
    .from(requests)
    .where(eq(requests.id, requestId))
    .limit(1);

  if (!request) throw new Error('Request not found');
  if (request.userId === userId) {
    throw new Error('You cannot respond to your own request');
  }

  const status = effectiveStatus(request);
  if (status !== 'open' && status !== 'answered') {
    throw new Error(`This request is ${status} and no longer accepts responses`);
  }

  const existingRows = await db
    .select()
    .from(requestResponses)
    .where(
      and(
        eq(requestResponses.requestId, requestId),
        eq(requestResponses.responderId, userId)
      )
    )
    .limit(1);

  if (existingRows.length > 0) {
    throw new Error('You have already responded to this request');
  }

  const cleanMessage = (message || '').trim().slice(0, MAX_MESSAGE_LENGTH);
  if (!cleanMessage) {
    throw new Error('Response message is required');
  }

  const offeredPriceNum = parseAmount(offeredPrice);

  const [created] = await db
    .insert(requestResponses)
    .values({
      requestId,
      responderId: userId,
      message: cleanMessage,
      offeredPrice: offeredPriceNum != null ? String(offeredPriceNum) : null,
      status: 'pending',
    })
    .returning();

  await db
    .update(requests)
    .set({
      responsesCount: sql`${requests.responsesCount} + 1`,
      status: request.status === 'open' ? 'answered' : request.status,
      updatedAt: new Date(),
    })
    .where(eq(requests.id, requestId));

  try {
    await incrementResponses(userId);
  } catch (err) {
    logger.warn('incrementResponses failed', { userId, error: err.message });
  }

  // ★ PHASE 5K: notify the request owner
  try {
    const responderName = await getUserDisplayName(userId);
    await notificationService.notifyRequestResponse({
      requestOwnerId: request.userId,
      requestId,
      requestTitle: request.title,
      responderName,
      offeredPrice: offeredPriceNum,
    });
  } catch (err) {
    logger.warn('notifyRequestResponse failed', {
      requestId,
      error: err?.message || err,
    });
  }

  logger.info('Response created', { requestId, responderId: userId, responseId: created.id });
  return created;
};

// ============================================
// WITHDRAW
// ============================================
export const withdrawResponse = async (userId, responseId) => {
  const [row] = await db
    .select()
    .from(requestResponses)
    .where(eq(requestResponses.id, responseId))
    .limit(1);

  if (!row) throw new Error('Response not found');
  if (row.responderId !== userId) throw new Error('Not your response');
  if (row.status !== 'pending') {
    throw new Error(`Cannot withdraw a response that is ${row.status}`);
  }

  const [updated] = await db
    .update(requestResponses)
    .set({
      status: 'withdrawn',
      withdrawnAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(requestResponses.id, responseId))
    .returning();

  await db
    .update(requests)
    .set({
      responsesCount: sql`GREATEST(${requests.responsesCount} - 1, 0)`,
      updatedAt: new Date(),
    })
    .where(eq(requests.id, row.requestId));

  logger.info('Response withdrawn', { responseId, userId });
  return updated;
};

// ============================================
// ACCEPT RESPONSE
// ============================================
export const acceptResponse = async (userId, requestId, responseId) => {
  const [request] = await db
    .select()
    .from(requests)
    .where(eq(requests.id, requestId))
    .limit(1);

  if (!request) throw new Error('Request not found');
  if (request.userId !== userId) throw new Error('Only the request owner can accept');

  const [response] = await db
    .select()
    .from(requestResponses)
    .where(eq(requestResponses.id, responseId))
    .limit(1);

  if (!response) throw new Error('Response not found');
  if (response.requestId !== requestId) throw new Error('Response does not belong to this request');
  if (response.status !== 'pending') {
    throw new Error(`This response is already ${response.status}`);
  }

  const [p1, p2] = [userId, response.responderId].sort();

  let conversationId = null;

  const existingConvo = await db
    .select()
    .from(conversations)
    .where(
      and(
        eq(conversations.participantOneId, p1),
        eq(conversations.participantTwoId, p2)
      )
    )
    .limit(1);

  if (existingConvo.length > 0) {
    conversationId = existingConvo[0].id;
  } else {
    const [created] = await db
      .insert(conversations)
      .values({
        participantOneId: p1,
        participantTwoId: p2,
        lastMessageText: null,
        lastMessageAt: new Date(),
      })
      .returning();
    conversationId = created.id;
  }

  const [updated] = await db
    .update(requestResponses)
    .set({
      status: 'accepted',
      acceptedAt: new Date(),
      conversationId,
      updatedAt: new Date(),
    })
    .where(eq(requestResponses.id, responseId))
    .returning();

  await db
    .update(requestResponses)
    .set({
      status: 'rejected',
      rejectedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(requestResponses.requestId, requestId),
        eq(requestResponses.status, 'pending'),
        sql`${requestResponses.id} <> ${responseId}`
      )
    );

  await db
    .update(requests)
    .set({
      status: 'answered',
      updatedAt: new Date(),
    })
    .where(eq(requests.id, requestId));

  try {
    await db.insert(messages).values({
      conversationId,
      senderId: userId,
      type: 'system',
      text: `Started from a request: "${request.title}"`,
    });
  } catch (err) {
    logger.warn('Failed to seed system message', { error: err.message });
  }

  // ★ PHASE 5K: notify the responder
  try {
    await notificationService.notifyResponseAccepted({
      responderId: response.responderId,
      requestId,
      requestTitle: request.title,
      conversationId,
    });
  } catch (err) {
    logger.warn('notifyResponseAccepted failed', {
      requestId,
      responseId,
      error: err?.message || err,
    });
  }

  logger.info('Response accepted', { requestId, responseId, conversationId });
  return { response: updated, conversationId };
};

// ============================================
// FULFILL
// ============================================
export const markFulfilled = async (userId, requestId) => {
  const [request] = await db
    .select()
    .from(requests)
    .where(eq(requests.id, requestId))
    .limit(1);

  if (!request) throw new Error('Request not found');
  if (request.userId !== userId) throw new Error('Only the owner can mark this fulfilled');

  if (request.status === 'fulfilled') {
    return request;
  }
  if (request.status === 'cancelled') {
    throw new Error('Request is cancelled');
  }

  const [updated] = await db
    .update(requests)
    .set({
      status: 'fulfilled',
      fulfilledAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(requests.id, requestId))
    .returning();

  const acceptedRows = await db
    .select()
    .from(requestResponses)
    .where(
      and(
        eq(requestResponses.requestId, requestId),
        eq(requestResponses.status, 'accepted')
      )
    )
    .limit(1);

  if (acceptedRows.length > 0) {
    const responderId = acceptedRows[0].responderId;

    // Trust score bump
    try {
      await incrementFulfilledRequests(responderId);
    } catch (err) {
      logger.warn('incrementFulfilledRequests failed', {
        responderId,
        error: err.message,
      });
    }

    // ★ PHASE 5K: notify the responder
    try {
      await notificationService.notifyRequestFulfilled({
        responderId,
        requestId,
        requestTitle: request.title,
      });
    } catch (err) {
      logger.warn('notifyRequestFulfilled failed', {
        requestId,
        responderId,
        error: err?.message || err,
      });
    }
  }

  logger.info('Request fulfilled', { requestId, userId });
  return updated;
};

// ============================================
// CANCEL
// ============================================
export const cancelRequest = async (userId, requestId) => {
  const [request] = await db
    .select()
    .from(requests)
    .where(eq(requests.id, requestId))
    .limit(1);

  if (!request) throw new Error('Request not found');
  if (request.userId !== userId) throw new Error('Only the owner can cancel');

  if (request.status === 'fulfilled') {
    throw new Error('Cannot cancel a fulfilled request');
  }
  if (request.status === 'cancelled') {
    return request;
  }

  const [updated] = await db
    .update(requests)
    .set({
      status: 'cancelled',
      cancelledAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(requests.id, requestId))
    .returning();

  logger.info('Request cancelled', { requestId, userId });
  return updated;
};

// ============================================
// EXPIRE STALE
// ============================================
export const expireStaleRequests = async () => {
  const result = await db
    .update(requests)
    .set({ status: 'expired', updatedAt: new Date() })
    .where(
      and(
        inArray(requests.status, ['open', 'answered']),
        sql`${requests.expiresAt} IS NOT NULL`,
        sql`${requests.expiresAt} < NOW()`
      )
    )
    .returning({ id: requests.id });

  logger.info(`Expired ${result.length} stale requests`);
  return result.length;
};

// ============================================
// DELETE
// ============================================
export const deleteRequest = async (userId, requestId) => {
  const [request] = await db
    .select()
    .from(requests)
    .where(eq(requests.id, requestId))
    .limit(1);

  if (!request) throw new Error('Request not found');
  if (request.userId !== userId) throw new Error('Only the owner can delete');

  await db.delete(requests).where(eq(requests.id, requestId));
  logger.info('Request deleted', { requestId, userId });
  return { success: true };
};

export default {
  createRequest,
  listRequests,
  getMyRequests,
  getRequestById,
  respondToRequest,
  withdrawResponse,
  acceptResponse,
  markFulfilled,
  cancelRequest,
  expireStaleRequests,
  deleteRequest,
};