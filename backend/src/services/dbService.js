// backend/src/services/dbService.js
import { db } from '../db/index.js';
import * as schema from '../db/schema.js';
import {
  eq,
  and,
  or,
  ilike,
  desc,
  asc,
  sql,
  count,
  like,
  inArray,
  ne,
} from 'drizzle-orm';
import { logger } from '../utils/logger.js';
import { parseQuery, describeInterpretation } from './bilingualSearch.js';

class DBService {
  constructor() {
    this.db = db;
    this.schema = schema;
  }

  // ============================================
  // ★ PHASE 1: LISTING SANITIZER
  // ============================================
  /**
   * Strip locationLat / locationLng from a listing row before returning
   * to clients. Coords stay in the DB; the API only exposes the name.
   */
  _sanitizeListing(row) {
    if (!row) return row;
    const { locationLat, locationLng, ...rest } = row;
    // A boost is only "premium" until it expires.
    const until = rest.premiumUntil ? new Date(rest.premiumUntil) : null;
    const boostActive = !!rest.isPremium && !!until && until > new Date();
    return { ...rest, isPremium: boostActive };
  }

  // Active boosts first, then newest.
  _listingOrder() {
    const l = this.schema.listings;
    return [
      desc(sql`(coalesce(${l.isPremium}, false) and ${l.premiumUntil} > now())`),
      desc(l.createdAt),
    ];
  }

  // ============================================
  // PROFILES
  // ============================================
  async getProfile(userId) {
    try {
      const result = await this.db
        .select()
        .from(this.schema.profiles)
        .where(eq(this.schema.profiles.id, userId));
      return result[0] || null;
    } catch (error) {
      logger.error('Get profile error:', error);
      throw error;
    }
  }

  async createProfile(data) {
    try {
      const result = await this.db
        .insert(this.schema.profiles)
        .values(data)
        .returning();
      return result[0];
    } catch (error) {
      logger.error('Create profile error:', error);
      throw error;
    }
  }

  async updateProfile(userId, data) {
    try {
      const result = await this.db
        .update(this.schema.profiles)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(this.schema.profiles.id, userId))
        .returning();
      return result[0];
    } catch (error) {
      logger.error('Update profile error:', error);
      throw error;
    }
  }

  // ============================================
  // BUSINESSES
  // ============================================
  async getBusiness(id) {
    try {
      const result = await this.db
        .select()
        .from(this.schema.businesses)
        .where(eq(this.schema.businesses.id, id));
      return result[0] || null;
    } catch (error) {
      logger.error('Get business error:', error);
      throw error;
    }
  }

  async getBusinessByUser(userId) {
    try {
      const result = await this.db
        .select()
        .from(this.schema.businesses)
        .where(eq(this.schema.businesses.userId, userId));
      return result[0] || null;
    } catch (error) {
      logger.error('Get business by user error:', error);
      throw error;
    }
  }

  async getBusinesses(params = {}) {
    try {
      const { category, status = 'active', limit = 20, offset = 0 } = params;

      let query = this.db
        .select()
        .from(this.schema.businesses)
        .where(eq(this.schema.businesses.status, status));

      if (category) {
        query = query.where(eq(this.schema.businesses.category, category));
      }

      const result = await query
        .limit(limit)
        .offset(offset)
        .orderBy(desc(this.schema.businesses.createdAt));

      const countResult = await this.db
        .select({ count: sql`count(*)` })
        .from(this.schema.businesses)
        .where(eq(this.schema.businesses.status, status));

      return {
        businesses: result,
        total: Number(countResult[0]?.count || 0),
      };
    } catch (error) {
      logger.error('Get businesses error:', error);
      throw error;
    }
  }

  async createBusiness(data) {
    try {
      const result = await this.db
        .insert(this.schema.businesses)
        .values(data)
        .returning();
      return result[0];
    } catch (error) {
      logger.error('Create business error:', error);
      throw error;
    }
  }

  async updateBusiness(id, data) {
    try {
      const result = await this.db
        .update(this.schema.businesses)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(this.schema.businesses.id, id))
        .returning();
      return result[0];
    } catch (error) {
      logger.error('Update business error:', error);
      throw error;
    }
  }

  // ============================================
  // LISTINGS
  // ============================================
  async getListing(id) {
    try {
      const result = await this.db
        .select()
        .from(this.schema.listings)
        .where(eq(this.schema.listings.id, id));
      return this._sanitizeListing(result[0]) || null;
    } catch (error) {
      logger.error('Get listing error:', error);
      throw error;
    }
  }

  async getListingWithBusiness(id) {
    try {
      const rows = await this.db
        .select({
          listing: this.schema.listings,
          business: this.schema.businesses,
        })
        .from(this.schema.listings)
        .leftJoin(
          this.schema.businesses,
          eq(this.schema.listings.businessId, this.schema.businesses.id)
        )
        .where(eq(this.schema.listings.id, id))
        .limit(1);

      if (!rows[0]) return null;

      return {
        ...this._sanitizeListing(rows[0].listing),
        businesses: rows[0].business || null,
      };
    } catch (error) {
      logger.error('Get listing with business error:', error);
      throw error;
    }
  }

  async getListingsByBusiness(businessId, params = {}) {
    try {
      const { status = 'active', limit = 20, offset = 0 } = params;

      const result = await this.db
        .select()
        .from(this.schema.listings)
        .where(
          and(
            eq(this.schema.listings.businessId, businessId),
            eq(this.schema.listings.status, status)
          )
        )
        .limit(limit)
        .offset(offset)
        .orderBy(...this._listingOrder());

      const countResult = await this.db
        .select({ count: sql`count(*)` })
        .from(this.schema.listings)
        .where(
          and(
            eq(this.schema.listings.businessId, businessId),
            eq(this.schema.listings.status, status)
          )
        );

      return {
        listings: result.map((row) => this._sanitizeListing(row)),
        total: Number(countResult[0]?.count || 0),
      };
    } catch (error) {
      logger.error('Get listings by business error:', error);
      throw error;
    }
  }

  async getListings(params = {}) {
    try {
      const {
        category,
        location,
        minPrice,
        maxPrice,
        status = 'active',
        limit = 20,
        offset = 0,
      } = params;

      const conditions = [eq(this.schema.listings.status, status)];

      if (category) {
        conditions.push(eq(this.schema.listings.category, category));
      }
      if (location) {
        conditions.push(ilike(this.schema.listings.locationArea, `%${location}%`));
      }
      if (minPrice !== undefined) {
        conditions.push(sql`${this.schema.listings.price} >= ${minPrice}`);
      }
      if (maxPrice !== undefined) {
        conditions.push(sql`${this.schema.listings.price} <= ${maxPrice}`);
      }

      const result = await this.db
        .select({
          listing: this.schema.listings,
          business: this.schema.businesses,
        })
        .from(this.schema.listings)
        .leftJoin(
          this.schema.businesses,
          eq(this.schema.listings.businessId, this.schema.businesses.id)
        )
        .where(and(...conditions))
        .limit(limit)
        .offset(offset)
        .orderBy(...this._listingOrder());

      const countResult = await this.db
        .select({ count: sql`count(*)` })
        .from(this.schema.listings)
        .where(and(...conditions));

      return {
        listings: result.map((row) => ({
          ...this._sanitizeListing(row.listing),
          businesses: row.business || null,
        })),
        total: Number(countResult[0]?.count || 0),
      };
    } catch (error) {
      logger.error('Get listings error:', error);
      throw error;
    }
  }

  /**
   * Bilingual ranked search.
   * @param {string|null} query  free text (parsed here if params.parsed is absent)
   * @param {object} params      { parsed, category, location, minPrice, maxPrice,
   *                               deliveryOnly, limit, offset }
   * Explicit params override what the sentence implied.
   */
  async searchListings(query, params = {}) {
    try {
      const { category, location, limit = 20, offset = 0 } = params;
      const parsed = params.parsed || (query ? parseQuery(query) : null);
      const l = this.schema.listings;
      const b = this.schema.businesses;

      const escLike = (t) => t.replace(/[\\%_]/g, '\\$&');
      const escRe = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      // Short words match whole words only ("ana" must not hit "banana").
      const termMatch = (col, t) =>
        t.length <= 4 && !/\s/.test(t)
          ? sql`${col} ~* ${`\\m${escRe(t)}(s|es)?\\M`}`
          : sql`${col} ilike ${`%${escLike(t)}%`}`;
      const anyTerm = (col, terms) => or(...terms.map((t) => termMatch(col, t)));

      const doc = sql`concat_ws(' ', ${l.title}, ${l.description}, ${l.category}, ${l.subCategory}, ${b.businessName}, ${b.category})`;
      const concepts = (parsed?.concepts || []).filter((c) => c.terms?.length);

      const conditions = [eq(l.status, 'active')];
      if (concepts.length) conditions.push(anyTerm(doc, concepts.flatMap((c) => c.terms)));

      const minPrice = params.minPrice ?? parsed?.minPrice ?? null;
      const maxPrice = params.maxPrice ?? parsed?.maxPrice ?? null;
      if (minPrice != null) conditions.push(sql`${l.price} >= ${minPrice}`);
      if (maxPrice != null) conditions.push(sql`${l.price} <= ${maxPrice}`);
      if (params.deliveryOnly ?? parsed?.deliveryOnly) conditions.push(eq(l.deliveryAvailable, true));
      if (category) conditions.push(eq(l.category, category));
      if (location) conditions.push(ilike(l.locationArea, `%${escLike(location)}%`));

      // A location from the sentence is a soft boost, unless it's all we have.
      const softLoc = !location && parsed?.location ? escLike(parsed.location) : null;
      if (softLoc && !concepts.length) {
        conditions.push(or(ilike(l.locationArea, `%${softLoc}%`), ilike(l.locationName, `%${softLoc}%`)));
      }

      // relevance: per concept, 3 if in the title, else 1 if anywhere else
      const parts = concepts.map(
        (c) => sql`(case when ${anyTerm(l.title, c.terms)} then 3 when ${anyTerm(doc, c.terms)} then 1 else 0 end)`
      );
      if (softLoc) {
        parts.push(sql`(case when ${l.locationArea} ilike ${`%${softLoc}%`} or ${l.locationName} ilike ${`%${softLoc}%`} then 2 else 0 end)`);
      }
      const score = parts.length ? sql.join(parts, sql` + `) : sql`0`;

      const order = [desc(sql`relevance`)];
      if (parsed?.sort === 'price_asc') order.push(sql`${l.price} asc nulls last`);
      order.push(...this._listingOrder());

      const where = and(...conditions);
      const result = await this.db
        .select({
          listing: l,
          business: b,
          relevance: sql`(${score})`.mapWith(Number).as('relevance'),
        })
        .from(l)
        .leftJoin(b, eq(l.businessId, b.id))
        .where(where)
        .orderBy(...order)
        .limit(limit)
        .offset(offset);

      const countResult = await this.db
        .select({ count: sql`count(*)` })
        .from(l)
        .leftJoin(b, eq(l.businessId, b.id))
        .where(where);

      return {
        listings: result.map((row) => ({
          ...this._sanitizeListing(row.listing),
          businesses: row.business || null,
          relevance: row.relevance,
        })),
        total: Number(countResult[0]?.count || 0),
        interpretation: parsed ? describeInterpretation(parsed) : null,
      };
    } catch (error) {
      logger.error('Search listings error:', error);
      throw error;
    }
  }

  async createListing(data) {
    try {
      const result = await this.db
        .insert(this.schema.listings)
        .values(data)
        .returning();
      return this._sanitizeListing(result[0]);
    } catch (error) {
      logger.error('Create listing error:', error);
      throw error;
    }
  }

  async updateListing(id, data) {
    try {
      const result = await this.db
        .update(this.schema.listings)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(this.schema.listings.id, id))
        .returning();
      return this._sanitizeListing(result[0]);
    } catch (error) {
      logger.error('Update listing error:', error);
      throw error;
    }
  }

  async incrementViewCount(id) {
    try {
      const result = await this.db
        .update(this.schema.listings)
        .set({
          viewCount: sql`${this.schema.listings.viewCount} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(this.schema.listings.id, id))
        .returning();
      return this._sanitizeListing(result[0]);
    } catch (error) {
      logger.error('Increment view count error:', error);
      throw error;
    }
  }

  // ============================================
  // SUBSCRIPTIONS
  // ============================================
  async getSubscription(userId) {
    try {
      const result = await this.db
        .select()
        .from(this.schema.subscriptions)
        .where(eq(this.schema.subscriptions.userId, userId));
      return result[0] || null;
    } catch (error) {
      logger.error('Get subscription error:', error);
      throw error;
    }
  }

  async upsertSubscription(data) {
    try {
      const result = await this.db
        .insert(this.schema.subscriptions)
        .values(data)
        .onConflictDoUpdate({
          target: this.schema.subscriptions.userId,
          set: {
            plan: data.plan,
            listingsAllowed: data.listingsAllowed,
            listingsUsed: data.listingsUsed || 0,
            status: data.status || 'active',
            expiresAt: data.expiresAt,
            updatedAt: new Date(),
          },
        })
        .returning();
      return result[0];
    } catch (error) {
      logger.error('Upsert subscription error:', error);
      throw error;
    }
  }

  async incrementListingUsage(userId) {
    try {
      const result = await this.db
        .update(this.schema.subscriptions)
        .set({
          listingsUsed: sql`${this.schema.subscriptions.listingsUsed} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(this.schema.subscriptions.userId, userId))
        .returning();
      return result[0];
    } catch (error) {
      logger.error('Increment listing usage error:', error);
      throw error;
    }
  }

  // ============================================
  // NOTIFICATIONS
  // ============================================
  async getNotifications(userId, params = {}) {
    try {
      const { unreadOnly = false, limit = 20, offset = 0 } = params;

      const conditions = [eq(this.schema.notifications.userId, userId)];
      if (unreadOnly) {
        conditions.push(eq(this.schema.notifications.read, false));
      }

      const result = await this.db
        .select()
        .from(this.schema.notifications)
        .where(and(...conditions))
        .limit(limit)
        .offset(offset)
        .orderBy(desc(this.schema.notifications.createdAt));

      const countResult = await this.db
        .select({ count: sql`count(*)` })
        .from(this.schema.notifications)
        .where(and(...conditions));

      return {
        notifications: result,
        total: Number(countResult[0]?.count || 0),
      };
    } catch (error) {
      logger.error('Get notifications error:', error);
      throw error;
    }
  }

  async createNotification(data) {
    try {
      const result = await this.db
        .insert(this.schema.notifications)
        .values(data)
        .returning();
      return result[0];
    } catch (error) {
      logger.error('Create notification error:', error);
      throw error;
    }
  }

  async markNotificationRead(id) {
    try {
      const result = await this.db
        .update(this.schema.notifications)
        .set({ read: true })
        .where(eq(this.schema.notifications.id, id))
        .returning();
      return result[0];
    } catch (error) {
      logger.error('Mark notification read error:', error);
      throw error;
    }
  }

  async markAllNotificationsRead(userId) {
    try {
      const result = await this.db
        .update(this.schema.notifications)
        .set({ read: true })
        .where(eq(this.schema.notifications.userId, userId))
        .returning();
      return result.length;
    } catch (error) {
      logger.error('Mark all notifications read error:', error);
      throw error;
    }
  }

  // ============================================
  // NEEDS (Smart Matching)
  // ============================================
  async getNeeds(params = {}) {
    try {
      const { userId, category, status = 'active', limit = 20, offset = 0 } = params;

      const conditions = [eq(this.schema.needs.status, status)];
      if (userId) {
        conditions.push(eq(this.schema.needs.userId, userId));
      }
      if (category) {
        conditions.push(eq(this.schema.needs.category, category));
      }

      const result = await this.db
        .select()
        .from(this.schema.needs)
        .where(and(...conditions))
        .limit(limit)
        .offset(offset)
        .orderBy(desc(this.schema.needs.createdAt));

      const countResult = await this.db
        .select({ count: sql`count(*)` })
        .from(this.schema.needs)
        .where(and(...conditions));

      return {
        needs: result,
        total: Number(countResult[0]?.count || 0),
      };
    } catch (error) {
      logger.error('Get needs error:', error);
      throw error;
    }
  }

  async createNeed(data) {
    try {
      const result = await this.db
        .insert(this.schema.needs)
        .values(data)
        .returning();
      return result[0];
    } catch (error) {
      logger.error('Create need error:', error);
      throw error;
    }
  }

  async closeNeed(id) {
    try {
      const result = await this.db
        .update(this.schema.needs)
        .set({
          status: 'inactive',
          fulfilledAt: new Date(),
        })
        .where(eq(this.schema.needs.id, id))
        .returning();
      return result[0];
    } catch (error) {
      logger.error('Close need error:', error);
      throw error;
    }
  }

  // ============================================
  // ANALYTICS
  // ============================================
  async trackEvent(data) {
    try {
      const result = await this.db
        .insert(this.schema.analyticsEvents)
        .values(data)
        .returning();
      return result[0];
    } catch (error) {
      logger.error('Track event error:', error);
      throw error;
    }
  }

  async getBusinessAnalytics(businessId, days = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const events = await this.db
        .select()
        .from(this.schema.analyticsEvents)
        .where(
          and(
            eq(this.schema.analyticsEvents.businessId, businessId),
            sql`${this.schema.analyticsEvents.createdAt} >= ${startDate}`
          )
        )
        .orderBy(desc(this.schema.analyticsEvents.createdAt));

      const grouped = events.reduce((acc, event) => {
        const key = event.eventType;
        if (!acc[key]) {
          acc[key] = [];
        }
        acc[key].push(event);
        return acc;
      }, {});

      return {
        events,
        grouped,
        total: events.length,
        days,
      };
    } catch (error) {
      logger.error('Get business analytics error:', error);
      throw error;
    }
  }

  // ============================================
  // MESSAGING (conversations + messages)
  // ============================================
  async findOrCreateConversation(userAId, userBId, listingId = null) {
    try {
      const [p1, p2] = [userAId, userBId].sort();

      const existing = await this.db
        .select()
        .from(this.schema.conversations)
        .where(
          and(
            eq(this.schema.conversations.participantOneId, p1),
            eq(this.schema.conversations.participantTwoId, p2),
            listingId
              ? eq(this.schema.conversations.listingId, listingId)
              : sql`${this.schema.conversations.listingId} IS NULL`
          )
        )
        .limit(1);

      if (existing[0]) return existing[0];

      const created = await this.db
        .insert(this.schema.conversations)
        .values({
          participantOneId: p1,
          participantTwoId: p2,
          listingId: listingId || null,
          unreadCountForOne: 0,
          unreadCountForTwo: 0,
        })
        .returning();

      return created[0];
    } catch (error) {
      logger.error('Find or create conversation error:', error);
      throw error;
    }
  }

  async getUserConversations(userId, params = {}) {
    try {
      const { limit = 50, offset = 0 } = params;

      const rows = await this.db
        .select()
        .from(this.schema.conversations)
        .where(
          or(
            eq(this.schema.conversations.participantOneId, userId),
            eq(this.schema.conversations.participantTwoId, userId)
          )
        )
        .orderBy(desc(this.schema.conversations.lastMessageAt))
        .limit(limit)
        .offset(offset);

      const conversations = await Promise.all(
        rows.map(async (c) => {
          const isP1 = c.participantOneId === userId;
          const otherId = isP1 ? c.participantTwoId : c.participantOneId;
          const otherProfile = await this.getProfile(otherId);

          return {
            id: c.id,
            listingId: c.listingId,
            lastMessageText: c.lastMessageText,
            lastMessageAt: c.lastMessageAt,
            unreadCount: isP1 ? c.unreadCountForOne : c.unreadCountForTwo,
            otherParticipant: otherProfile,
            createdAt: c.createdAt,
          };
        })
      );

      return { conversations };
    } catch (error) {
      logger.error('Get user conversations error:', error);
      throw error;
    }
  }

  async getConversationMessages(conversationId, params = {}) {
    try {
      const { limit = 100, offset = 0 } = params;

      const rows = await this.db
        .select()
        .from(this.schema.messages)
        .where(eq(this.schema.messages.conversationId, conversationId))
        .orderBy(asc(this.schema.messages.createdAt))
        .limit(limit)
        .offset(offset);

      return { messages: rows };
    } catch (error) {
      logger.error('Get conversation messages error:', error);
      throw error;
    }
  }

  /**
   * ★ PHASE 2: extended to accept proposal fields.
   * Normal messages leave proposal fields null.
   */
  async sendMessage(conversationId, senderId, content) {
    try {
      const {
        text,
        imageUrl,
        audioUrl,
        durationMs,
        type = 'text',
        proposedPrice = null,
        proposalKind = null,
        proposalStatus = null,
      } = content;

      const inserted = await this.db
        .insert(this.schema.messages)
        .values({
          conversationId,
          senderId,
          text: text || null,
          imageUrl: imageUrl || null,
          audioUrl: audioUrl || null,
          durationMs: durationMs || null,
          type,
          proposedPrice: proposedPrice != null ? String(proposedPrice) : null,
          proposalKind: proposalKind || null,
          proposalStatus: proposalStatus || null,
        })
        .returning();

      const message = inserted[0];

      const conversation = await this.db
        .select()
        .from(this.schema.conversations)
        .where(eq(this.schema.conversations.id, conversationId))
        .limit(1);

      if (!conversation[0]) throw new Error('Conversation not found');

      const c = conversation[0];
      const isSenderP1 = c.participantOneId === senderId;

      let previewText;
      if (proposedPrice != null) {
        previewText =
          proposalKind === 'counter'
            ? `💰 Counter offer: MK ${Number(proposedPrice).toLocaleString()}`
            : `💰 Offer: MK ${Number(proposedPrice).toLocaleString()}`;
      } else if (text) {
        previewText = text;
      } else if (imageUrl) {
        previewText = '[image]';
      } else if (audioUrl) {
        previewText = '[voice message]';
      } else {
        previewText = '';
      }

      await this.db
        .update(this.schema.conversations)
        .set({
          lastMessageText: previewText,
          lastMessageAt: new Date(),
          unreadCountForOne: isSenderP1
            ? c.unreadCountForOne
            : c.unreadCountForOne + 1,
          unreadCountForTwo: isSenderP1
            ? c.unreadCountForTwo + 1
            : c.unreadCountForTwo,
          updatedAt: new Date(),
        })
        .where(eq(this.schema.conversations.id, conversationId));

      return message;
    } catch (error) {
      logger.error('Send message error:', error);
      throw error;
    }
  }

  async markConversationRead(conversationId, userId) {
    try {
      const conversation = await this.db
        .select()
        .from(this.schema.conversations)
        .where(eq(this.schema.conversations.id, conversationId))
        .limit(1);

      if (!conversation[0]) return null;

      const c = conversation[0];
      const isP1 = c.participantOneId === userId;

      await this.db
        .update(this.schema.conversations)
        .set({
          unreadCountForOne: isP1 ? 0 : c.unreadCountForOne,
          unreadCountForTwo: isP1 ? c.unreadCountForTwo : 0,
          updatedAt: new Date(),
        })
        .where(eq(this.schema.conversations.id, conversationId));

      const otherUserId = isP1 ? c.participantTwoId : c.participantOneId;

      await this.db
        .update(this.schema.messages)
        .set({ readAt: new Date() })
        .where(
          and(
            eq(this.schema.messages.conversationId, conversationId),
            eq(this.schema.messages.senderId, otherUserId),
            sql`${this.schema.messages.readAt} IS NULL`
          )
        );

      return { success: true };
    } catch (error) {
      logger.error('Mark conversation read error:', error);
      throw error;
    }
  }

  // ============================================
  // ★ PHASE 2: NEGOTIATION PROPOSALS
  // ============================================
  async getMessageById(messageId) {
    try {
      const rows = await this.db
        .select()
        .from(this.schema.messages)
        .where(eq(this.schema.messages.id, messageId))
        .limit(1);
      return rows[0] || null;
    } catch (error) {
      logger.error('Get message by id error:', error);
      throw error;
    }
  }

  async supersedeProposals(conversationId, excludeMessageId = null) {
    try {
      const conditions = [
        eq(this.schema.messages.conversationId, conversationId),
        eq(this.schema.messages.proposalStatus, 'pending'),
      ];
      if (excludeMessageId) {
        conditions.push(ne(this.schema.messages.id, excludeMessageId));
      }

      const result = await this.db
        .update(this.schema.messages)
        .set({ proposalStatus: 'superseded' })
        .where(and(...conditions))
        .returning({ id: this.schema.messages.id });

      return result.length;
    } catch (error) {
      logger.error('Supersede proposals error:', error);
      throw error;
    }
  }

  async getLatestPendingProposal(conversationId) {
    try {
      const rows = await this.db
        .select()
        .from(this.schema.messages)
        .where(
          and(
            eq(this.schema.messages.conversationId, conversationId),
            eq(this.schema.messages.proposalStatus, 'pending')
          )
        )
        .orderBy(desc(this.schema.messages.createdAt))
        .limit(1);
      return rows[0] || null;
    } catch (error) {
      logger.error('Get latest pending proposal error:', error);
      throw error;
    }
  }

  async updateProposalStatus(messageId, status) {
    try {
      const result = await this.db
        .update(this.schema.messages)
        .set({ proposalStatus: status })
        .where(eq(this.schema.messages.id, messageId))
        .returning();
      return result[0] || null;
    } catch (error) {
      logger.error('Update proposal status error:', error);
      throw error;
    }
  }

  // ============================================
  // LISTING LIKES
  // ============================================
  async toggleListingLike(listingId, userId) {
    try {
      const existing = await this.db
        .select()
        .from(this.schema.listingLikes)
        .where(
          and(
            eq(this.schema.listingLikes.listingId, listingId),
            eq(this.schema.listingLikes.userId, userId)
          )
        )
        .limit(1);

      let liked;
      if (existing[0]) {
        await this.db
          .delete(this.schema.listingLikes)
          .where(eq(this.schema.listingLikes.id, existing[0].id));
        liked = false;
      } else {
        await this.db
          .insert(this.schema.listingLikes)
          .values({ listingId, userId });
        liked = true;
      }

      const countResult = await this.db
        .select({ count: sql`count(*)` })
        .from(this.schema.listingLikes)
        .where(eq(this.schema.listingLikes.listingId, listingId));

      return {
        liked,
        count: Number(countResult[0]?.count || 0),
      };
    } catch (error) {
      logger.error('Toggle listing like error:', error);
      throw error;
    }
  }

  async getLikeStatesForListings(listingIds, userId = null) {
    try {
      if (!listingIds || listingIds.length === 0) {
        return { counts: {}, userLikes: {} };
      }

      const countsRows = await this.db
        .select({
          listingId: this.schema.listingLikes.listingId,
          count: sql`count(*)`.as('count'),
        })
        .from(this.schema.listingLikes)
        .where(inArray(this.schema.listingLikes.listingId, listingIds))
        .groupBy(this.schema.listingLikes.listingId);

      const counts = {};
      for (const row of countsRows) {
        counts[row.listingId] = Number(row.count || 0);
      }

      let userLikes = {};
      if (userId) {
        const userRows = await this.db
          .select({ listingId: this.schema.listingLikes.listingId })
          .from(this.schema.listingLikes)
          .where(
            and(
              eq(this.schema.listingLikes.userId, userId),
              inArray(this.schema.listingLikes.listingId, listingIds)
            )
          );
        for (const row of userRows) {
          userLikes[row.listingId] = true;
        }
      }

      return { counts, userLikes };
    } catch (error) {
      logger.error('Get like states error:', error);
      throw error;
    }
  }

  // ============================================
  // LISTING COMMENTS
  // ============================================
  async createListingComment(listingId, userId, text, parentId = null) {
    try {
      const trimmed = String(text || '').trim();
      if (!trimmed) throw new Error('Comment text is required');
      if (trimmed.length > 1000) throw new Error('Comment is too long (max 1000 characters)');

      let resolvedParentId = null;
      if (parentId) {
        const parent = await this.db
          .select({
            id: this.schema.listingComments.id,
            listingId: this.schema.listingComments.listingId,
            parentId: this.schema.listingComments.parentId,
          })
          .from(this.schema.listingComments)
          .where(eq(this.schema.listingComments.id, parentId))
          .limit(1);
        if (!parent[0] || parent[0].listingId !== listingId) {
          throw new Error('Parent comment not found');
        }
        // Replies stay one level deep: replying to a reply attaches to its root.
        resolvedParentId = parent[0].parentId || parent[0].id;
      }

      const inserted = await this.db
        .insert(this.schema.listingComments)
        .values({
          listingId,
          userId,
          parentId: resolvedParentId,
          text: trimmed,
        })
        .returning();

      return inserted[0];
    } catch (error) {
      logger.error('Create listing comment error:', error);
      throw error;
    }
  }

  async getListingComments(listingId, params = {}) {
    try {
      const { limit = 50, offset = 0, userId = null } = params;

      const rows = await this.db
        .select({
          comment: this.schema.listingComments,
          user: {
            id: this.schema.profiles.id,
            fullName: this.schema.profiles.fullName,
            email: this.schema.profiles.email,
            avatarUrl: this.schema.profiles.avatarUrl,
          },
        })
        .from(this.schema.listingComments)
        .leftJoin(
          this.schema.profiles,
          eq(this.schema.listingComments.userId, this.schema.profiles.id)
        )
        .where(eq(this.schema.listingComments.listingId, listingId))
        .orderBy(desc(this.schema.listingComments.createdAt))
        .limit(limit)
        .offset(offset);

      const ids = rows.map((row) => row.comment.id);
      const { counts: likeCounts, liked } = await this.getCommentLikeStates(ids, userId);

      const comments = rows.map((row) => ({
        ...row.comment,
        user: row.user,
        likes: likeCounts[row.comment.id] || 0,
        likedByMe: !!liked[row.comment.id],
      }));

      const countResult = await this.db
        .select({ count: sql`count(*)` })
        .from(this.schema.listingComments)
        .where(eq(this.schema.listingComments.listingId, listingId));

      return {
        comments,
        total: Number(countResult[0]?.count || 0),
      };
    } catch (error) {
      logger.error('Get listing comments error:', error);
      throw error;
    }
  }

  async getCommentCountsForListings(listingIds) {
    try {
      if (!listingIds || listingIds.length === 0) return {};

      const rows = await this.db
        .select({
          listingId: this.schema.listingComments.listingId,
          count: sql`count(*)`.as('count'),
        })
        .from(this.schema.listingComments)
        .where(inArray(this.schema.listingComments.listingId, listingIds))
        .groupBy(this.schema.listingComments.listingId);

      const counts = {};
      for (const row of rows) {
        counts[row.listingId] = Number(row.count || 0);
      }
      return counts;
    } catch (error) {
      logger.error('Get comment counts error:', error);
      throw error;
    }
  }

  async deleteListingComment(commentId, userId) {
    try {
      const rows = await this.db
        .select()
        .from(this.schema.listingComments)
        .where(eq(this.schema.listingComments.id, commentId))
        .limit(1);

      if (!rows[0]) throw new Error('Comment not found');
      if (rows[0].userId !== userId) throw new Error('Not authorized to delete this comment');

      await this.db
        .delete(this.schema.listingComments)
        .where(eq(this.schema.listingComments.id, commentId));

      return { success: true };
    } catch (error) {
      logger.error('Delete listing comment error:', error);
      throw error;
    }
  }

  // ============================================
  // PRICE BOARD
  // Aggregates active, priced listings from the last `days` days into
  // category → item rows with a min/max price range, vendor count and a
  // trend (avg of the last 7 days vs the 7 days before).
  // ============================================
  async getPriceBoard({ days = 14, location = null, maxItemsPerCategory = 12 } = {}) {
    const l = this.schema.listings;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const conds = [
      eq(l.status, 'active'),
      sql`${l.price} is not null`,
      sql`coalesce(${l.updatedAt}, ${l.createdAt}) >= ${since}`,
    ];
    if (location) conds.push(ilike(l.locationArea, `%${location}%`));

    const rows = await this.db
      .select({
        title: l.title,
        unit: l.unit,
        category: l.category,
        price: l.price,
        businessId: l.businessId,
        createdAt: l.createdAt,
        updatedAt: l.updatedAt,
      })
      .from(l)
      .where(and(...conds))
      .orderBy(desc(l.updatedAt))
      .limit(5000);

    const normalize = (s) =>
      String(s || '').toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

    const categories = new Map();
    let latest = 0;

    for (const r of rows) {
      const price = Number(r.price);
      if (!Number.isFinite(price) || price <= 0) continue;
      const catName = (r.category || 'Other').trim() || 'Other';
      const unit = (r.unit || '').trim();
      const key = `${normalize(r.title)}|${normalize(unit)}`;
      const ts = new Date(r.updatedAt || r.createdAt || 0).getTime();
      latest = Math.max(latest, ts);

      if (!categories.has(catName)) categories.set(catName, { vendors: new Set(), items: new Map() });
      const cat = categories.get(catName);
      cat.vendors.add(r.businessId);

      if (!cat.items.has(key)) {
        cat.items.set(key, {
          name: unit ? `${r.title.trim()}, ${unit}` : r.title.trim(),
          min: price, max: price, vendors: new Set(), recent: [], prior: [],
        });
      }
      const item = cat.items.get(key);
      item.min = Math.min(item.min, price);
      item.max = Math.max(item.max, price);
      item.vendors.add(r.businessId);
      (ts >= weekAgo ? item.recent : item.prior).push(price);
    }

    const avg = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : null);

    const result = [...categories.entries()].map(([name, cat]) => {
      const items = [...cat.items.values()]
        .map((it) => {
          const a = avg(it.recent);
          const b = avg(it.prior);
          let trend = 'stable';
          let change = 0;
          if (a != null && b != null && b > 0) {
            change = Math.round(a - b);
            if (Math.abs(a - b) / b >= 0.02) trend = a > b ? 'up' : 'down';
          }
          return {
            name: it.name,
            minPrice: it.min,
            maxPrice: it.max,
            vendorCount: it.vendors.size,
            trend,
            change,
          };
        })
        .sort((x, y) => y.vendorCount - x.vendorCount || x.name.localeCompare(y.name))
        .slice(0, maxItemsPerCategory);
      return { name, vendorCount: cat.vendors.size, items };
    }).sort((x, y) => y.vendorCount - x.vendorCount || x.name.localeCompare(y.name));

    return {
      categories: result,
      lastUpdated: latest ? new Date(latest).toISOString() : null,
      windowDays: days,
    };
  }

  // ============================================
  // COMMENT LIKES
  // ============================================

  async getCommentLikeStates(commentIds, userId = null) {
    const ids = (commentIds || []).filter(Boolean);
    if (!ids.length) return { counts: {}, liked: {} };
    const t = this.schema.commentLikes;

    const countRows = await this.db
      .select({ commentId: t.commentId, count: sql`count(*)::int` })
      .from(t)
      .where(inArray(t.commentId, ids))
      .groupBy(t.commentId);

    const counts = {};
    for (const r of countRows) counts[r.commentId] = Number(r.count) || 0;

    const liked = {};
    if (userId) {
      const mine = await this.db
        .select({ commentId: t.commentId })
        .from(t)
        .where(and(inArray(t.commentId, ids), eq(t.userId, userId)));
      for (const r of mine) liked[r.commentId] = true;
    }
    return { counts, liked };
  }

  /** Idempotent: like=true inserts (no-op if present), like=false deletes. */
  async setCommentLike(commentId, userId, like) {
    const t = this.schema.commentLikes;

    const exists = await this.db
      .select({ id: this.schema.listingComments.id })
      .from(this.schema.listingComments)
      .where(eq(this.schema.listingComments.id, commentId))
      .limit(1);
    if (!exists[0]) throw new Error('Comment not found');

    if (like) {
      await this.db.insert(t).values({ commentId, userId }).onConflictDoNothing();
    } else {
      await this.db.delete(t).where(and(eq(t.commentId, commentId), eq(t.userId, userId)));
    }

    const { counts } = await this.getCommentLikeStates([commentId]);
    return { liked: !!like, count: counts[commentId] || 0 };
  }

  // ============================================
  // REVIEWS
  // ============================================

  async getReviews({ listingId = null, businessId = null, limit = 50, offset = 0 } = {}) {
    const r = this.schema.reviews;
    const p = this.schema.profiles;
    const where = listingId ? eq(r.listingId, listingId) : eq(r.businessId, businessId);

    const rows = await this.db
      .select({
        review: r,
        reviewer: { id: p.id, fullName: p.fullName, avatarUrl: p.avatarUrl },
      })
      .from(r)
      .leftJoin(p, eq(r.reviewerId, p.id))
      .where(where)
      .orderBy(desc(r.createdAt))
      .limit(limit)
      .offset(offset);

    const agg = await this.db
      .select({ count: sql`count(*)::int`, avg: sql`coalesce(avg(${r.rating}), 0)::float` })
      .from(r)
      .where(where);

    return {
      reviews: rows.map((row) => ({ ...row.review, reviewer: row.reviewer })),
      total: Number(agg[0]?.count || 0),
      averageRating: Math.round((Number(agg[0]?.avg) || 0) * 10) / 10,
    };
  }

  async getReview(id) {
    const rows = await this.db
      .select()
      .from(this.schema.reviews)
      .where(eq(this.schema.reviews.id, id))
      .limit(1);
    return rows[0] || null;
  }

  /** Create, or update the reviewer's existing review of the same listing. */
  async upsertListingReview({ listingId, businessId, reviewerId, rating, comment }) {
    const r = this.schema.reviews;
    const existing = await this.db
      .select({ id: r.id })
      .from(r)
      .where(and(eq(r.listingId, listingId), eq(r.reviewerId, reviewerId)))
      .limit(1);

    if (existing[0]) {
      const [updated] = await this.db
        .update(r)
        .set({ rating, comment, updatedAt: new Date() })
        .where(eq(r.id, existing[0].id))
        .returning();
      return { review: updated, created: false };
    }

    const [created] = await this.db
      .insert(r)
      .values({ listingId, businessId, reviewerId, rating, comment })
      .returning();
    return { review: created, created: true };
  }

  async updateReview(id, patch) {
    const [updated] = await this.db
      .update(this.schema.reviews)
      .set({ ...patch, updatedAt: new Date() })
      .where(eq(this.schema.reviews.id, id))
      .returning();
    return updated;
  }

  async deleteReview(id) {
    await this.db.delete(this.schema.reviews).where(eq(this.schema.reviews.id, id));
  }

  /**
   * Refresh businesses.rating / review_count for one business and the
   * owner's trust_scores.average_rating / total_reviews (across all of the
   * owner's businesses). Returns the owner's user id.
   */
  async refreshReviewAggregates(businessId) {
    const r = this.schema.reviews;
    const b = this.schema.businesses;

    const [bizAgg] = await this.db
      .select({ count: sql`count(*)::int`, avg: sql`coalesce(avg(${r.rating}), 0)::float` })
      .from(r)
      .where(eq(r.businessId, businessId));

    const [biz] = await this.db
      .update(b)
      .set({
        rating: String((Number(bizAgg?.avg) || 0).toFixed(2)),
        reviewCount: Number(bizAgg?.count || 0),
        updatedAt: new Date(),
      })
      .where(eq(b.id, businessId))
      .returning({ userId: b.userId });

    const ownerId = biz?.userId;
    if (!ownerId) return null;

    const [ownerAgg] = await this.db
      .select({ count: sql`count(*)::int`, avg: sql`coalesce(avg(${r.rating}), 0)::float` })
      .from(r)
      .innerJoin(b, eq(r.businessId, b.id))
      .where(eq(b.userId, ownerId));

    await this.db
      .insert(this.schema.trustScores)
      .values({
        userId: ownerId,
        averageRating: String((Number(ownerAgg?.avg) || 0).toFixed(2)),
        totalReviews: Number(ownerAgg?.count || 0),
      })
      .onConflictDoUpdate({
        target: this.schema.trustScores.userId,
        set: {
          averageRating: String((Number(ownerAgg?.avg) || 0).toFixed(2)),
          totalReviews: Number(ownerAgg?.count || 0),
          updatedAt: new Date(),
        },
      });

    return ownerId;
  }
}

export default new DBService();