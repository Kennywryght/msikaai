// backend/src/utils/authz.js
// Ownership / role checks. Identity always comes from req.user (the verified
// token) — never from a userId in the body, query or params.
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { profiles, businesses, listings } from '../db/schema.js';

export const isAdmin = async (userId) => {
  if (!userId) return false;
  const [row] = await db
    .select({ role: profiles.role })
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1);
  return row?.role === 'admin';
};

/** @returns {Promise<{ ok: boolean, status?: number, error?: string, business?: object, admin?: boolean }>} */
export const checkBusinessAccess = async (userId, businessId) => {
  if (!businessId) return { ok: false, status: 400, error: 'businessId is required' };
  const [business] = await db
    .select({ id: businesses.id, userId: businesses.userId, status: businesses.status })
    .from(businesses)
    .where(eq(businesses.id, businessId))
    .limit(1);
  if (!business) return { ok: false, status: 404, error: 'Business not found' };
  if (business.userId === userId) return { ok: true, business, admin: false };
  if (await isAdmin(userId)) return { ok: true, business, admin: true };
  return { ok: false, status: 403, error: 'You do not own this business' };
};

export const checkListingAccess = async (userId, listingId) => {
  const [row] = await db
    .select({
      id: listings.id,
      status: listings.status,
      businessId: listings.businessId,
      ownerId: businesses.userId,
    })
    .from(listings)
    .leftJoin(businesses, eq(listings.businessId, businesses.id))
    .where(eq(listings.id, listingId))
    .limit(1);
  if (!row) return { ok: false, status: 404, error: 'Listing not found' };
  if (row.ownerId === userId) return { ok: true, listing: row, admin: false };
  if (await isAdmin(userId)) return { ok: true, listing: row, admin: true };
  return { ok: false, status: 403, error: 'You do not own this listing' };
};

/** Copy only allowed keys (accepting camelCase or snake_case input). */
export const pick = (src, allowed) => {
  const out = {};
  for (const [camel, snake] of allowed) {
    if (src[camel] !== undefined) out[camel] = src[camel];
    else if (snake && src[snake] !== undefined) out[camel] = src[snake];
  }
  return out;
};

/** 403 if a client-supplied user id disagrees with the token. */
export const rejectForeignUserId = (req, res, supplied) => {
  if (supplied && supplied !== req.user?.id) {
    res.status(403).json({ success: false, error: 'You can only act on your own account' });
    return true;
  }
  return false;
};
