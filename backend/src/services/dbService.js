// backend/src/services/dbService.js
import { db } from '../db/index.js';
import * as schema from '../db/schema.js';
import { eq, and, or, ilike, desc, asc, sql, count, like } from 'drizzle-orm';
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
      
      // Get total count
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
        offset = 0 
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
        .select()
        .from(this.schema.listings)
        .where(and(...conditions))
        .limit(limit)
        .offset(offset)
        .orderBy(desc(this.schema.listings.createdAt));
      
      const countResult = await this.db
        .select({ count: sql`count(*)` })
        .from(this.schema.listings)
        .where(and(...conditions));
      
      return {
        listings: result,
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
        // Simple search using ILIKE
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
      
      const result = await this.db
        .select()
        .from(this.schema.listings)
        .where(and(...conditions))
        .limit(limit)
        .offset(offset)
        .orderBy(desc(this.schema.listings.createdAt));
      
      const countResult = await this.db
        .select({ count: sql`count(*)` })
        .from(this.schema.listings)
        .where(and(...conditions));
      
      return {
        listings: result,
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
          updatedAt: new Date()
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
          updatedAt: new Date()
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
          fulfilledAt: new Date()
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
      
      // Group by event type
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
}

export default new DBService();