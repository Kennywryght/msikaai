// backend/src/db/schema.js
import {
  pgTable,
  serial,
  text,
  integer,
  decimal,
  boolean,
  timestamp,
  uuid,
  jsonb,
  pgEnum,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ============================================
// ENUMS
// ============================================
export const roleEnum = pgEnum('role', ['user', 'vendor', 'admin']);
export const statusEnum = pgEnum('status', ['active', 'inactive', 'pending', 'suspended']);
export const planEnum = pgEnum('plan', ['free', 'basic', 'pro', 'business']);
export const priceTypeEnum = pgEnum('price_type', ['fixed', 'negotiable', 'free_quote']);
export const urgencyEnum = pgEnum('urgency', ['low', 'medium', 'high', 'urgent']);
export const notificationTypeEnum = pgEnum('notification_type', ['info', 'success', 'warning', 'error']);
export const messageTypeEnum = pgEnum('message_type', ['text', 'image', 'system']);

// ============================================
// PROFILES
// ============================================
export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  fullName: text('full_name'),
  phone: text('phone'),
  role: roleEnum('role').default('user'),
  avatarUrl: text('avatar_url'),
  locationText: text('location_text'),
  onboardingCompleted: boolean('onboarding_completed').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ============================================
// BUSINESSES
// ============================================
export const businesses = pgTable('businesses', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => profiles.id, { onDelete: 'cascade' }),
  businessName: text('business_name').notNull(),
  category: text('category'),
  description: text('description'),
  phone: text('phone'),
  address: text('address'),
  locationText: text('location_text'),
  logoUrl: text('logo_url'),
  verified: boolean('verified').default(false),
  status: statusEnum('status').default('active'),
  rating: decimal('rating', { precision: 3, scale: 2 }).default('0'),
  reviewCount: integer('review_count').default(0),
  deliveryAvailable: boolean('delivery_available').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ============================================
// LISTINGS
// ============================================
export const listings = pgTable('listings', {
  id: uuid('id').primaryKey().defaultRandom(),
  businessId: uuid('business_id').references(() => businesses.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  category: text('category'),
  subCategory: text('sub_category'),
  price: decimal('price', { precision: 10, scale: 2 }),
  priceType: priceTypeEnum('price_type').default('fixed'),
  quantity: integer('quantity'),
  unit: text('unit'),
  images: text('images').array(),
  status: statusEnum('status').default('active'),
  locationArea: text('location_area'),
  deliveryAvailable: boolean('delivery_available').default(false),
  deliveryFee: decimal('delivery_fee', { precision: 10, scale: 2 }),
  contactPhone: text('contact_phone'),
  viewCount: integer('view_count').default(0),
  contactCount: integer('contact_count').default(0),
  featured: boolean('featured').default(false),
  searchVector: text('search_vector'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ============================================
// SUBSCRIPTIONS
// ============================================
export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => profiles.id, { onDelete: 'cascade' }).unique(),
  plan: planEnum('plan').default('free'),
  listingsAllowed: integer('listings_allowed').default(3),
  listingsUsed: integer('listings_used').default(0),
  status: statusEnum('status').default('active'),
  paymentId: text('payment_id'),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ============================================
// NOTIFICATIONS
// ============================================
export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => profiles.id, { onDelete: 'cascade' }),
  type: notificationTypeEnum('type').default('info'),
  title: text('title').notNull(),
  message: text('message'),
  read: boolean('read').default(false),
  data: jsonb('data'),
  createdAt: timestamp('created_at').defaultNow(),
});

// ============================================
// ✅ NEW: PUSH SUBSCRIPTIONS (web push)
// ============================================
export const pushSubscriptions = pgTable('push_subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),
  endpoint: text('endpoint').notNull(),
  p256dh: text('p256dh').notNull(),
  auth: text('auth').notNull(),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow(),
  lastUsedAt: timestamp('last_used_at').defaultNow(),
}, (table) => ({
  userEndpointIdx: uniqueIndex('push_subscriptions_user_endpoint_idx')
    .on(table.userId, table.endpoint),
  userIdx: index('push_subscriptions_user_idx').on(table.userId),
}));

// ============================================
// NEEDS
// ============================================
export const needs = pgTable('needs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => profiles.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  category: text('category').default('Other'),
  location: text('location'),
  budgetMin: decimal('budget_min', { precision: 10, scale: 2 }),
  budgetMax: decimal('budget_max', { precision: 10, scale: 2 }),
  urgency: urgencyEnum('urgency').default('medium'),
  status: statusEnum('status').default('active'),
  fulfilledAt: timestamp('fulfilled_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

// ============================================
// ORDERS
// ============================================
export const orders = pgTable('orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => profiles.id, { onDelete: 'set null' }),
  listingId: uuid('listing_id').references(() => listings.id, { onDelete: 'set null' }),
  paymentIntentId: text('payment_intent_id'),
  amount: decimal('amount', { precision: 10, scale: 2 }),
  currency: text('currency').default('MWK'),
  status: text('status').default('pending'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow(),
});

// ============================================
// ANALYTICS EVENTS
// ============================================
export const analyticsEvents = pgTable('analytics_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => profiles.id, { onDelete: 'set null' }),
  businessId: uuid('business_id').references(() => businesses.id, { onDelete: 'set null' }),
  listingId: uuid('listing_id').references(() => listings.id, { onDelete: 'set null' }),
  eventType: text('event_type').notNull(),
  eventData: jsonb('event_data'),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow(),
});

// ============================================
// PAYMENTS
// ============================================
export const payments = pgTable('payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => profiles.id, { onDelete: 'cascade' }),
  plan: planEnum('plan').default('free'),
  amount: decimal('amount', { precision: 10, scale: 2 }),
  currency: text('currency').default('MWK'),
  method: text('method'),
  paymentId: text('payment_id').unique(),
  status: text('status').default('pending'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ============================================
// SESSIONS
// ============================================
export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => profiles.id, { onDelete: 'cascade' }),
  token: text('token').unique(),
  refreshToken: text('refresh_token'),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

// ============================================
// CONVERSATIONS
// ============================================
export const conversations = pgTable('conversations', {
  id: uuid('id').primaryKey().defaultRandom(),
  participantOneId: uuid('participant_one_id')
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),
  participantTwoId: uuid('participant_two_id')
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),
  listingId: uuid('listing_id').references(() => listings.id, { onDelete: 'set null' }),
  lastMessageText: text('last_message_text'),
  lastMessageAt: timestamp('last_message_at'),
  unreadCountForOne: integer('unread_count_for_one').default(0),
  unreadCountForTwo: integer('unread_count_for_two').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  pairListingIdx: uniqueIndex('conversations_pair_listing_idx')
    .on(table.participantOneId, table.participantTwoId, table.listingId),
  p1Idx: index('conversations_p1_idx').on(table.participantOneId, table.lastMessageAt),
  p2Idx: index('conversations_p2_idx').on(table.participantTwoId, table.lastMessageAt),
}));

// ============================================
// MESSAGES
// ============================================
export const messages = pgTable('messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  conversationId: uuid('conversation_id')
    .notNull()
    .references(() => conversations.id, { onDelete: 'cascade' }),
  senderId: uuid('sender_id')
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),
  type: messageTypeEnum('type').default('text'),
  text: text('text'),
  imageUrl: text('image_url'),
  readAt: timestamp('read_at'),
  deliveredAt: timestamp('delivered_at').defaultNow(),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  conversationIdx: index('messages_conversation_idx')
    .on(table.conversationId, table.createdAt),
}));

// ============================================
// RELATIONS
// ============================================
export const profilesRelations = relations(profiles, ({ many, one }) => ({
  businesses: many(businesses),
  subscription: one(subscriptions, {
    fields: [profiles.id],
    references: [subscriptions.userId],
  }),
  notifications: many(notifications),
  pushSubscriptions: many(pushSubscriptions), // ✅ NEW
  needs: many(needs),
  orders: many(orders),
  analyticsEvents: many(analyticsEvents),
  payments: many(payments),
  sessions: many(sessions),
  conversationsAsOne: many(conversations, { relationName: 'conversationParticipantOne' }),
  conversationsAsTwo: many(conversations, { relationName: 'conversationParticipantTwo' }),
  sentMessages: many(messages),
}));

export const businessesRelations = relations(businesses, ({ one, many }) => ({
  owner: one(profiles, {
    fields: [businesses.userId],
    references: [profiles.id],
  }),
  listings: many(listings),
  analyticsEvents: many(analyticsEvents),
}));

export const listingsRelations = relations(listings, ({ one, many }) => ({
  business: one(businesses, {
    fields: [listings.businessId],
    references: [businesses.id],
  }),
  orders: many(orders),
  analyticsEvents: many(analyticsEvents),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  user: one(profiles, {
    fields: [subscriptions.userId],
    references: [profiles.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(profiles, {
    fields: [notifications.userId],
    references: [profiles.id],
  }),
}));

// ✅ NEW: push subscriptions relation
export const pushSubscriptionsRelations = relations(pushSubscriptions, ({ one }) => ({
  user: one(profiles, {
    fields: [pushSubscriptions.userId],
    references: [profiles.id],
  }),
}));

export const needsRelations = relations(needs, ({ one }) => ({
  user: one(profiles, {
    fields: [needs.userId],
    references: [profiles.id],
  }),
}));

export const ordersRelations = relations(orders, ({ one }) => ({
  user: one(profiles, {
    fields: [orders.userId],
    references: [profiles.id],
  }),
  listing: one(listings, {
    fields: [orders.listingId],
    references: [listings.id],
  }),
}));

export const analyticsEventsRelations = relations(analyticsEvents, ({ one }) => ({
  user: one(profiles, {
    fields: [analyticsEvents.userId],
    references: [profiles.id],
  }),
  business: one(businesses, {
    fields: [analyticsEvents.businessId],
    references: [businesses.id],
  }),
  listing: one(listings, {
    fields: [analyticsEvents.listingId],
    references: [listings.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  user: one(profiles, {
    fields: [payments.userId],
    references: [profiles.id],
  }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(profiles, {
    fields: [sessions.userId],
    references: [profiles.id],
  }),
}));

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  participantOne: one(profiles, {
    fields: [conversations.participantOneId],
    references: [profiles.id],
    relationName: 'conversationParticipantOne',
  }),
  participantTwo: one(profiles, {
    fields: [conversations.participantTwoId],
    references: [profiles.id],
    relationName: 'conversationParticipantTwo',
  }),
  listing: one(listings, {
    fields: [conversations.listingId],
    references: [listings.id],
  }),
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
  sender: one(profiles, {
    fields: [messages.senderId],
    references: [profiles.id],
  }),
}));

// ============================================
// EXPORTS
// ============================================
export default {
  profiles,
  businesses,
  listings,
  subscriptions,
  notifications,
  pushSubscriptions, // ✅ NEW
  needs,
  orders,
  analyticsEvents,
  payments,
  sessions,
  conversations,
  messages,
};