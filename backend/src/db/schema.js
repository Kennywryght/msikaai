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

// ============================================
// PROFILES TABLE
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
// BUSINESSES TABLE
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
// LISTINGS TABLE
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
}, (table) => ({
  searchIndex: uniqueIndex('listings_search_idx').on(table.searchVector),
}));

// ============================================
// SUBSCRIPTIONS TABLE
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
// NOTIFICATIONS TABLE
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
// NEEDS TABLE (Smart Matching)
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
// ORDERS TABLE
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
// ANALYTICS EVENTS TABLE
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
// PAYMENTS TABLE
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
// SESSIONS TABLE (for Auth.js)
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
// EXPORT ALL TABLES
// ============================================
export default {
  profiles,
  businesses,
  listings,
  subscriptions,
  notifications,
  needs,
  orders,
  analyticsEvents,
  payments,
  sessions,
};