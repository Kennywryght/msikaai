-- backend/src/db/sql/2026-10-13_boost_reviews_comment_likes.sql
--
-- Idempotent: safe to run more than once (Supabase SQL editor, or psql).
-- Mirrors the schema.js changes so `drizzle-kit push` becomes a no-op afterwards.

BEGIN;

-- ------------------------------------------------------------
-- Spotlight boost columns on listings
-- ------------------------------------------------------------
ALTER TABLE listings ADD COLUMN IF NOT EXISTS is_premium boolean DEFAULT false;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS premium_until timestamp;

-- ------------------------------------------------------------
-- Payment rows: kind + boost target + duration
-- ------------------------------------------------------------
ALTER TABLE payments ADD COLUMN IF NOT EXISTS kind text DEFAULT 'subscription';
ALTER TABLE payments ADD COLUMN IF NOT EXISTS listing_id uuid
  REFERENCES listings(id) ON DELETE SET NULL;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS duration_days integer;

-- ------------------------------------------------------------
-- Comment replies
-- ------------------------------------------------------------
ALTER TABLE listing_comments ADD COLUMN IF NOT EXISTS parent_id uuid
  REFERENCES listing_comments(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS listing_comments_parent_idx ON listing_comments (parent_id);

-- ------------------------------------------------------------
-- Comment likes
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS comment_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id uuid NOT NULL REFERENCES listing_comments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamp DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS comment_likes_comment_user_idx ON comment_likes (comment_id, user_id);
CREATE INDEX IF NOT EXISTS comment_likes_comment_idx ON comment_likes (comment_id);

-- ------------------------------------------------------------
-- Reviews
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid REFERENCES listings(id) ON DELETE CASCADE,
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  reviewer_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS reviews_listing_reviewer_idx ON reviews (listing_id, reviewer_id);
CREATE INDEX IF NOT EXISTS reviews_business_idx ON reviews (business_id, created_at);
CREATE INDEX IF NOT EXISTS reviews_reviewer_idx ON reviews (reviewer_id);

-- ------------------------------------------------------------
-- Indexes for hot query paths (feeds, search, dashboards, polling)
-- On a large live table, run these individually as
-- CREATE INDEX CONCURRENTLY ... outside the transaction instead.
-- ------------------------------------------------------------
CREATE INDEX IF NOT EXISTS businesses_user_idx ON businesses (user_id);
CREATE INDEX IF NOT EXISTS businesses_status_idx ON businesses (status, created_at);
CREATE INDEX IF NOT EXISTS listings_status_created_idx ON listings (status, created_at);
CREATE INDEX IF NOT EXISTS listings_business_idx ON listings (business_id, status);
CREATE INDEX IF NOT EXISTS listings_category_idx ON listings (category, status);
CREATE INDEX IF NOT EXISTS listings_premium_until_idx ON listings (premium_until);
CREATE INDEX IF NOT EXISTS notifications_user_created_idx ON notifications (user_id, created_at);
CREATE INDEX IF NOT EXISTS needs_status_created_idx ON needs (status, created_at);
CREATE INDEX IF NOT EXISTS analytics_events_listing_idx ON analytics_events (listing_id, created_at);
CREATE INDEX IF NOT EXISTS analytics_events_business_idx ON analytics_events (business_id, created_at);
CREATE INDEX IF NOT EXISTS analytics_events_user_idx ON analytics_events (user_id, created_at);
CREATE INDEX IF NOT EXISTS payments_user_idx ON payments (user_id);
CREATE INDEX IF NOT EXISTS payments_status_created_idx ON payments (status, created_at);

COMMIT;
