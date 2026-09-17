// backend/src/services/dbService.js
import { db } from '../db/index.js';
import * as schema from '../db/schema.js';
import { eq, and, or, ilike, desc, asc, sql, count, like, inArray } from 'drizzle-orm';
import { logger } from '../utils/logger.js';

class DBService {
  constructor() {
    this.db = db;
    this.schema = schema;
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
      return result[0] || null;
    } catch (error) {
      logger.error('Get listing error:', error);
      throw error;
    }
  }

  /**
   * Fetches a single listing AND its business (with user_id) in one call.
   * Useful for ListingDetails where we need to know the seller.
   */
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
        ...rows[0].listing,
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
        .orderBy(desc(this.schema.listings.createdAt));

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
        listings: result,
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

      // Join businesses so the frontend has `user_id` for the seller
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
        .orderBy(desc(this.schema.listings.createdAt));

      const countResult = await this.db
        .select({ count: sql`count(*)` })
        .from(this.schema.listings)
        .where(and(...conditions));

      return {
        listings: result.map((row) => ({
          ...row.listing,
          businesses: row.business || null,
        })),
        total: Number(countResult[0]?.count || 0),
      };
    } catch (error) {
      logger.error('Get listings error:', error);
      throw error;
    }
  }

  async searchListings(query, params = {}) {
    try {
      const { category, location, limit = 20, offset = 0 } = params;

      const conditions = [eq(this.schema.listings.status, 'active')];

      if (query) {
        conditions.push(
          or(
            ilike(this.schema.listings.title, `%${query}%`),
            ilike(this.schema.listings.description, `%${query}%`),
            ilike(this.schema.listings.category, `%${query}%`)
          )
        );
      }
      if (category) {
        conditions.push(eq(this.schema.listings.category, category));
      }
      if (location) {
        conditions.push(ilike(this.schema.listings.locationArea, `%${location}%`));
      }

      // Join businesses so the frontend gets `user_id`
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
        .orderBy(desc(this.schema.listings.createdAt));

      const countResult = await this.db
        .select({ count: sql`count(*)` })
        .from(this.schema.listings)
        .where(and(...conditions));

      return {
        listings: result.map((row) => ({
          ...row.listing,
          businesses: row.business || null,
        })),
        total: Number(countResult[0]?.count || 0),
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
      return result[0];
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
      return result[0];
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
      return result[0];
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

  /**
   * Find or create a conversation between two users.
   * Normalizes participant order so the unique index is consistent.
   */
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

  /**
   * Get all conversations for a user, with the other participant's profile.
   */
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

  /**
   * Get messages inside a conversation.
   */
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
   * Insert a message, update the conversation's last-message fields,
   * and bump the recipient's unread count.
   */
  async sendMessage(conversationId, senderId, content) {
    try {
      const { text, imageUrl, type = 'text' } = content;

      const inserted = await this.db
        .insert(this.schema.messages)
        .values({
          conversationId,
          senderId,
          text: text || null,
          imageUrl: imageUrl || null,
          type,
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

      await this.db
        .update(this.schema.conversations)
        .set({
          lastMessageText: text || '[image]',
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

  /**
   * Mark a conversation as read for the given user.
   */
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
}

export default new DBService();