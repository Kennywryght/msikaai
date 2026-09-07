// backend/src/workers/notificationWorker.js
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

class NotificationWorker {
  async processNotification(data) {
    const { userId, title, message, type, metadata } = data;

    try {
      logger.info(`📢 Processing notification for user ${userId}: ${title}`);

      // Store notification in database
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          title: title,
          message: message,
          type: type || 'general',
          data: metadata || {},
          read: false,
          created_at: new Date().toISOString(),
        });

      if (error) {
        logger.error('Failed to save notification:', error.message);
        throw error;
      }

      // TODO: Send real-time notification via WebSocket
      // Could integrate with Socket.io or Pusher here

      logger.info(`✅ Notification processed for user ${userId}`);
      return { success: true };
    } catch (error) {
      logger.error('Notification processing error:', error.message);
      throw error;
    }
  }

  async start() {
    logger.info('🚀 Starting Notification Worker...');

    try {
      await queueService.consume('notifications', async (data) => {
        await this.processNotification(data);
      });

      logger.info('✅ Notification Worker started successfully');
    } catch (error) {
      logger.error('Failed to start Notification Worker:', error.message);
      process.exit(1);
    }
  }
}

// Run the worker if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const worker = new NotificationWorker();
  worker.start().catch((error) => {
    logger.error('Worker error:', error);
    process.exit(1);
  });
}

export default NotificationWorker;