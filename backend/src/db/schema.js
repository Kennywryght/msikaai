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

export const messageTypeEnum = pgEnum('message_type', ['text', 'image', 'audio', 'system']);

export const verificationTypeEnum = pgEnum('verification_type', [
  'email',
  'phone',
  'id',
  'business',
]);

export const verificationStatusEnum = pgEnum('verification_status', [
  'pending',
  'approved',
  'rejected',
  'expired',
]);

export const requestStatusEnum = pgEnum('request_status', [
  'open',
  'answered',
  'fulfilled',
  'expired',
  'cancelled',
]);

// ★ PHASE 2: added 'negotiating'
export const requestResponseStatusEnum = pgEnum('request_response_status', [
  'pending',
  'negotiating',
  'accepted',
  'rejected',
  'withdrawn',
]);

// ★ PHASE 3: added 'pending_approval'
export const deliveryStatusEnum = pgEnum('delivery_status', [
  'open',
  'pending_approval',
  'accepted',
  'picked_up',
  'delivered',
  'confirmed',
  'cancelled',
  'expired',
]);

export const packageSizeEnum = pgEnum('package_size', [
  'small',
  'medium',
  'large',
  'bulky',
]);

// ★ PHASE 3: per-side approval state
export const deliveryApprovalStatusEnum = pgEnum('delivery_approval_status', [
  'pending',
  'approved',
  'rejected',
]);

// ★ PHASE 3: courier request state
export const courierRequestStatusEnum = pgEnum('courier_request_status', [
  'pending',
  'approved',
  'rejected',
  'withdrawn',
  'auto_rejected',
]);

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
// ★ PHASE 1 (extension): location name + hidden coords
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

  // ★ PHASE 1: human-readable place name + hidden coords
  locationName: text('location_name'),
  locationArea: text('location_area'),
  locationLat: decimal('location_lat', { precision: 10, scale: 8 }),
  locationLng: decimal('location_lng', { precision: 11, scale: 8 }),

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
// PUSH SUBSCRIPTIONS
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
// REQUESTS
// ★ PHASE 1: location name + hidden coords
// ============================================
export const requests = pgTable('requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),

  title: text('title').notNull(),
  description: text('description'),
  category: text('category').default('Other'),

  locationName: text('location_name'),
  locationArea: text('location_area'),
  locationLat: decimal('location_lat', { precision: 10, scale: 8 }),
  locationLng: decimal('location_lng', { precision: 11, scale: 8 }),

  budgetMin: decimal('budget_min', { precision: 10, scale: 2 }),
  budgetMax: decimal('budget_max', { precision: 10, scale: 2 }),

  urgency: urgencyEnum('urgency').default('medium'),
  status: requestStatusEnum('status').default('open').notNull(),

  responsesCount: integer('responses_count').default(0).notNull(),
  viewCount: integer('view_count').default(0).notNull(),

  expiresAt: timestamp('expires_at'),
  fulfilledAt: timestamp('fulfilled_at'),
  cancelledAt: timestamp('cancelled_at'),

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  statusIdx: index('requests_status_idx').on(table.status),
  categoryIdx: index('requests_category_idx').on(table.category),
  userIdx: index('requests_user_idx').on(table.userId, table.createdAt),
  createdIdx: index('requests_created_idx').on(table.createdAt),
  expiresIdx: index('requests_expires_idx').on(table.expiresAt),
}));

// ============================================
// REQUEST RESPONSES
// ============================================
export const requestResponses = pgTable('request_responses', {
  id: uuid('id').primaryKey().defaultRandom(),
  requestId: uuid('request_id')
    .notNull()
    .references(() => requests.id, { onDelete: 'cascade' }),
  responderId: uuid('responder_id')
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),

  message: text('message'),
  offeredPrice: decimal('offered_price', { precision: 10, scale: 2 }),

  status: requestResponseStatusEnum('status').default('pending').notNull(),

  conversationId: uuid('conversation_id').references(() => conversations.id, {
    onDelete: 'set null',
  }),

  acceptedAt: timestamp('accepted_at'),
  rejectedAt: timestamp('rejected_at'),
  withdrawnAt: timestamp('withdrawn_at'),

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  requestIdx: index('request_responses_request_idx')
    .on(table.requestId, table.createdAt),
  responderIdx: index('request_responses_responder_idx')
    .on(table.responderId, table.createdAt),
  uniqueResponseIdx: uniqueIndex('request_responses_unique_idx')
    .on(table.requestId, table.responderId),
  statusIdx: index('request_responses_status_idx').on(table.status),
}));

// ============================================
// DELIVERY JOBS
// ★ PHASE 3: pending_approval + approval tracking
// ============================================
export const deliveryJobs = pgTable('delivery_jobs', {
  id: uuid('id').primaryKey().defaultRandom(),

  posterId: uuid('poster_id')
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),

  courierId: uuid('courier_id').references(() => profiles.id, {
    onDelete: 'set null',
  }),

  requestId: uuid('request_id').references(() => requests.id, {
    onDelete: 'set null',
  }),
  conversationId: uuid('conversation_id').references(() => conversations.id, {
    onDelete: 'set null',
  }),

  title: text('title').notNull(),
  description: text('description'),
  packageSize: packageSizeEnum('package_size').default('medium').notNull(),

  pickupLocation: text('pickup_location').notNull(),
  pickupLat: decimal('pickup_lat', { precision: 10, scale: 8 }),
  pickupLng: decimal('pickup_lng', { precision: 11, scale: 8 }),
  pickupContactName: text('pickup_contact_name'),
  pickupContactPhone: text('pickup_contact_phone'),

  dropoffLocation: text('dropoff_location').notNull(),
  dropoffLat: decimal('dropoff_lat', { precision: 10, scale: 8 }),
  dropoffLng: decimal('dropoff_lng', { precision: 11, scale: 8 }),
  dropoffContactName: text('dropoff_contact_name'),
  dropoffContactPhone: text('dropoff_contact_phone'),

  courierFee: decimal('courier_fee', { precision: 10, scale: 2 }),

  status: deliveryStatusEnum('status').default('open').notNull(),

  // ★ PHASE 3: approvals for the currently-pending courier
  pendingCourierId: uuid('pending_courier_id').references(() => profiles.id, {
    onDelete: 'set null',
  }),
  sellerApprovalStatus: deliveryApprovalStatusEnum('seller_approval_status'),
  buyerApprovalStatus: deliveryApprovalStatusEnum('buyer_approval_status'),
  sellerApprovedAt: timestamp('seller_approved_at'),
  buyerApprovedAt: timestamp('buyer_approved_at'),
  courierRequestedAt: timestamp('courier_requested_at'),

  expiresAt: timestamp('expires_at'),
  acceptedAt: timestamp('accepted_at'),
  pickedUpAt: timestamp('picked_up_at'),
  deliveredAt: timestamp('delivered_at'),
  confirmedAt: timestamp('confirmed_at'),
  cancelledAt: timestamp('cancelled_at'),

  cancelReason: text('cancel_reason'),

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  statusIdx: index('delivery_jobs_status_idx').on(table.status),
  posterIdx: index('delivery_jobs_poster_idx').on(table.posterId, table.createdAt),
  courierIdx: index('delivery_jobs_courier_idx').on(table.courierId, table.createdAt),
  createdIdx: index('delivery_jobs_created_idx').on(table.createdAt),
  expiresIdx: index('delivery_jobs_expires_idx').on(table.expiresAt),
  packageSizeIdx: index('delivery_jobs_package_size_idx').on(table.packageSize),
  pendingCourierIdx: index('delivery_jobs_pending_courier_idx').on(table.pendingCourierId),
}));

// ============================================
// ★ PHASE 3: DELIVERY COURIER REQUESTS
// ============================================
export const deliveryCourierRequests = pgTable('delivery_courier_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  deliveryId: uuid('delivery_id')
    .notNull()
    .references(() => deliveryJobs.id, { onDelete: 'cascade' }),
  courierId: uuid('courier_id')
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),

  status: courierRequestStatusEnum('status').default('pending').notNull(),

  note: text('note'),
  rejectionReason: text('rejection_reason'),

  reviewedBySellerId: uuid('reviewed_by_seller_id').references(() => profiles.id, {
    onDelete: 'set null',
  }),
  reviewedByBuyerId: uuid('reviewed_by_buyer_id').references(() => profiles.id, {
    onDelete: 'set null',
  }),
  sellerReviewedAt: timestamp('seller_reviewed_at'),
  buyerReviewedAt: timestamp('buyer_reviewed_at'),

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  uniqueCourierRequestIdx: uniqueIndex('delivery_courier_requests_unique_idx')
    .on(table.deliveryId, table.courierId),
  deliveryStatusIdx: index('delivery_courier_requests_delivery_idx')
    .on(table.deliveryId, table.status),
  courierIdx: index('delivery_courier_requests_courier_idx')
    .on(table.courierId, table.createdAt),
}));

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
// ★ PHASE 2: negotiation proposal columns
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

  audioUrl: text('audio_url'),
  durationMs: integer('duration_ms'),

  proposedPrice: decimal('proposed_price', { precision: 10, scale: 2 }),
  proposalKind: text('proposal_kind'),
  proposalStatus: text('proposal_status'),

  readAt: timestamp('read_at'),
  deliveredAt: timestamp('delivered_at').defaultNow(),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  conversationIdx: index('messages_conversation_idx')
    .on(table.conversationId, table.createdAt),
  proposalStatusIdx: index('messages_proposal_status_idx').on(table.proposalStatus),
}));

// ============================================
// LISTING LIKES
// ============================================
export const listingLikes = pgTable('listing_likes', {
  id: uuid('id').primaryKey().defaultRandom(),
  listingId: uuid('listing_id')
    .notNull()
    .references(() => listings.id, { onDelete: 'cascade' }),
  userId: uuid('user_id')
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  uniqueLike: uniqueIndex('listing_likes_listing_user_idx')
    .on(table.listingId, table.userId),
  listingIdx: index('listing_likes_listing_idx').on(table.listingId),
  userIdx: index('listing_likes_user_idx').on(table.userId),
}));

// ============================================
// LISTING COMMENTS
// ============================================
export const listingComments = pgTable('listing_comments', {
  id: uuid('id').primaryKey().defaultRandom(),
  listingId: uuid('listing_id')
    .notNull()
    .references(() => listings.id, { onDelete: 'cascade' }),
  userId: uuid('user_id')
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),
  text: text('text').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  listingIdx: index('listing_comments_listing_idx')
    .on(table.listingId, table.createdAt),
  userIdx: index('listing_comments_user_idx').on(table.userId),
}));

// ============================================
// TRUST SCORES
// ============================================
export const trustScores = pgTable('trust_scores', {
  userId: uuid('user_id')
    .primaryKey()
    .references(() => profiles.id, { onDelete: 'cascade' }),

  tier: integer('tier').default(0).notNull(),
  escrowLimit: decimal('escrow_limit', { precision: 12, scale: 2 })
    .default('20000')
    .notNull(),

  emailVerified: boolean('email_verified').default(false).notNull(),
  phoneVerified: boolean('phone_verified').default(false).notNull(),
  idVerified: boolean('id_verified').default(false).notNull(),
  businessVerified: boolean('business_verified').default(false).notNull(),

  listingsCount: integer('listings_count').default(0).notNull(),
  responsesCount: integer('responses_count').default(0).notNull(),
  premiumPurchases: integer('premium_purchases').default(0).notNull(),
  fulfilledRequestsCount: integer('fulfilled_requests_count').default(0).notNull(),

  deliveriesCompletedCount: integer('deliveries_completed_count').default(0).notNull(),

  averageRating: decimal('average_rating', { precision: 3, scale: 2 })
    .default('0')
    .notNull(),
  totalReviews: integer('total_reviews').default(0).notNull(),

  reportsAgainst: integer('reports_against').default(0).notNull(),
  reportsUpheld: integer('reports_upheld').default(0).notNull(),
  suspended: boolean('suspended').default(false).notNull(),

  trustScore: integer('trust_score').default(0).notNull(),

  lastComputedAt: timestamp('last_computed_at').defaultNow(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  scoreIdx: index('trust_scores_score_idx').on(table.trustScore),
  tierIdx: index('trust_scores_tier_idx').on(table.tier),
}));

// ============================================
// VERIFICATION REQUESTS
// ============================================
export const verificationRequests = pgTable('verification_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),
  type: verificationTypeEnum('type').notNull(),
  status: verificationStatusEnum('status').default('pending').notNull(),

  submittedValue: text('submitted_value'),
  documentUrl: text('document_url'),
  metadata: jsonb('metadata'),

  reviewedBy: uuid('reviewed_by').references(() => profiles.id, {
    onDelete: 'set null',
  }),
  reviewedAt: timestamp('reviewed_at'),
  rejectionReason: text('rejection_reason'),

  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  userTypeIdx: index('verification_requests_user_type_idx')
    .on(table.userId, table.type),
  statusIdx: index('verification_requests_status_idx').on(table.status),
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
  pushSubscriptions: many(pushSubscriptions),
  needs: many(needs),
  orders: many(orders),
  analyticsEvents: many(analyticsEvents),
  payments: many(payments),
  sessions: many(sessions),
  conversationsAsOne: many(conversations, { relationName: 'conversationParticipantOne' }),
  conversationsAsTwo: many(conversations, { relationName: 'conversationParticipantTwo' }),
  sentMessages: many(messages),
  listingLikes: many(listingLikes),
  listingComments: many(listingComments),

  trustScore: one(trustScores, {
    fields: [profiles.id],
    references: [trustScores.userId],
  }),
  verificationRequests: many(verificationRequests),

  requests: many(requests),
  requestResponses: many(requestResponses),

  deliveryJobsPosted: many(deliveryJobs, { relationName: 'deliveryPoster' }),
  deliveryJobsTaken: many(deliveryJobs, { relationName: 'deliveryCourier' }),
  deliveryCourierRequests: many(deliveryCourierRequests),
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
  likes: many(listingLikes),
  comments: many(listingComments),
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

export const listingLikesRelations = relations(listingLikes, ({ one }) => ({
  listing: one(listings, {
    fields: [listingLikes.listingId],
    references: [listings.id],
  }),
  user: one(profiles, {
    fields: [listingLikes.userId],
    references: [profiles.id],
  }),
}));

export const listingCommentsRelations = relations(listingComments, ({ one }) => ({
  listing: one(listings, {
    fields: [listingComments.listingId],
    references: [listings.id],
  }),
  user: one(profiles, {
    fields: [listingComments.userId],
    references: [profiles.id],
  }),
}));

export const trustScoresRelations = relations(trustScores, ({ one }) => ({
  user: one(profiles, {
    fields: [trustScores.userId],
    references: [profiles.id],
  }),
}));

export const verificationRequestsRelations = relations(verificationRequests, ({ one }) => ({
  user: one(profiles, {
    fields: [verificationRequests.userId],
    references: [profiles.id],
  }),
  reviewer: one(profiles, {
    fields: [verificationRequests.reviewedBy],
    references: [profiles.id],
  }),
}));

export const requestsRelations = relations(requests, ({ one, many }) => ({
  user: one(profiles, {
    fields: [requests.userId],
    references: [profiles.id],
  }),
  responses: many(requestResponses),
}));

export const requestResponsesRelations = relations(requestResponses, ({ one }) => ({
  request: one(requests, {
    fields: [requestResponses.requestId],
    references: [requests.id],
  }),
  responder: one(profiles, {
    fields: [requestResponses.responderId],
    references: [profiles.id],
  }),
  conversation: one(conversations, {
    fields: [requestResponses.conversationId],
    references: [conversations.id],
  }),
}));

export const deliveryJobsRelations = relations(deliveryJobs, ({ one, many }) => ({
  poster: one(profiles, {
    fields: [deliveryJobs.posterId],
    references: [profiles.id],
    relationName: 'deliveryPoster',
  }),
  courier: one(profiles, {
    fields: [deliveryJobs.courierId],
    references: [profiles.id],
    relationName: 'deliveryCourier',
  }),
  pendingCourier: one(profiles, {
    fields: [deliveryJobs.pendingCourierId],
    references: [profiles.id],
    relationName: 'deliveryPendingCourier',
  }),
  request: one(requests, {
    fields: [deliveryJobs.requestId],
    references: [requests.id],
  }),
  conversation: one(conversations, {
    fields: [deliveryJobs.conversationId],
    references: [conversations.id],
  }),
  courierRequests: many(deliveryCourierRequests),
}));

export const deliveryCourierRequestsRelations = relations(
  deliveryCourierRequests,
  ({ one }) => ({
    delivery: one(deliveryJobs, {
      fields: [deliveryCourierRequests.deliveryId],
      references: [deliveryJobs.id],
    }),
    courier: one(profiles, {
      fields: [deliveryCourierRequests.courierId],
      references: [profiles.id],
    }),
    reviewedBySeller: one(profiles, {
      fields: [deliveryCourierRequests.reviewedBySellerId],
      references: [profiles.id],
      relationName: 'courierRequestSellerReviewer',
    }),
    reviewedByBuyer: one(profiles, {
      fields: [deliveryCourierRequests.reviewedByBuyerId],
      references: [profiles.id],
      relationName: 'courierRequestBuyerReviewer',
    }),
  })
);

// ============================================
// EXPORTS
// ============================================
export default {
  profiles,
  businesses,
  listings,
  subscriptions,
  notifications,
  pushSubscriptions,
  needs,
  orders,
  analyticsEvents,
  payments,
  sessions,
  conversations,
  messages,
  listingLikes,
  listingComments,
  trustScores,
  verificationRequests,
  requests,
  requestResponses,
  deliveryJobs,
  deliveryCourierRequests,
};