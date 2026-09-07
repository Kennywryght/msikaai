// backend/src/workers/analyticsWorker.js
import { createClient } from '@supabase/supabase-js';
import { logger } from '../utils/logger.js';
import queueService from '../services/queueService.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

class AnalyticsWorker {
  async processAnalytics(data) {
    const { eventType, userId, businessId, listingId, metadata, ipAddress, userAgent } = data;

    try {
      logger.info(`📊 Processing analytics event: ${eventType}`);

      // Store analytics event in database
      const { error } = await supabase
        .from('analytics_events')
        .insert({
          user_id: userId,
          business_id: businessId,
          listing_id: listingId,
          event_type: eventType,
          event_data: metadata || {},
          ip_address: ipAddress,
          user_agent: userAgent,
          created_at: new Date().toISOString(),
        });

      if (error) {
        logger.error('Failed to save analytics event:', error.message);
        throw error;
      }

      // Update stats based on event type
      await this.updateStats(eventType, userId, businessId, listingId);

      logger.info(`✅ Analytics event processed: ${eventType}`);
      return { success: true };
    } catch (error) {
      logger.error('Analytics processing error:', error.message);
      throw error;
    }
  }

  async updateStats(eventType, userId, businessId, listingId) {
    try {
      // Update view counts for listings
      if (eventType === 'listing_view' && listingId) {
        await supabase.rpc('increment_listing_views', { listing_id: listingId });
      }

      // Update contact counts
      if (eventType === 'listing_contact' && listingId) {
        await supabase.rpc('increment_contact_count', { listing_id: listingId });
      }

      // Update business stats
      if (eventType === 'business_view' && businessId) {
        await supabase.rpc('increment_business_views', { business_id: businessId });
      }

      // TODO: Update user activity, etc.
    } catch (error) {
      logger.warn('Stats update error:', error.message);
      // Don't throw - stats are non-critical
    }
  }

  async start() {
    logger.info('🚀 Starting Analytics Worker...');

    try {
      await queueService.consume('analytics', async (data) => {
        await this.processAnalytics(data);
      });

      logger.info('✅ Analytics Worker started successfully');
    } catch (error) {
      logger.error('Failed to start Analytics Worker:', error.message);
      process.exit(1);
    }
  }
}

// Run the worker if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const worker = new AnalyticsWorker();
  worker.start().catch((error) => {
    logger.error('Worker error:', error);
    process.exit(1);
  });
}

export default AnalyticsWorker;