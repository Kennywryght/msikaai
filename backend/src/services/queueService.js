// backend/src/services/queueService.js
import amqp from 'amqplib';
import { logger } from '../utils/logger.js';

class QueueService {
  constructor() {
    this.connection = null;
    this.channel = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 5000;
    
    // Queue names from environment or defaults
    this.queues = {
      notifications: process.env.NOTIFICATION_QUEUE || 'notifications_queue',
      email: process.env.EMAIL_QUEUE || 'email_queue',
      analytics: process.env.ANALYTICS_QUEUE || 'analytics_queue',
      imageProcessing: process.env.IMAGE_QUEUE || 'image_processing_queue',
    };
    
    // Initialize if URL is configured
    if (process.env.RABBITMQ_URL) {
      this.connect();
    } else {
      logger.info('ℹ️ RabbitMQ not configured, using direct processing fallback');
    }
  }

  async connect() {
    const rabbitmqUrl = process.env.RABBITMQ_URL;
    
    if (!rabbitmqUrl) {
      logger.warn('⚠️ RABBITMQ_URL not configured');
      return false;
    }

    try {
      logger.info('🔄 Connecting to RabbitMQ...');
      
      this.connection = await amqp.connect(rabbitmqUrl, {
        timeout: 30000,
        heartbeat: 60,
      });

      this.channel = await this.connection.createChannel();
      
      // Set prefetch to 1 for fair distribution
      await this.channel.prefetch(1);

      // Create queues with durability
      for (const [name, queue] of Object.entries(this.queues)) {
        await this.channel.assertQueue(queue, {
          durable: true,
          arguments: {
            'x-queue-type': 'quorum', // Better durability
          },
        });
        logger.debug(`✅ Queue created: ${queue}`);
      }

      this.isConnected = true;
      this.reconnectAttempts = 0;
      logger.info('✅ RabbitMQ connected and queues ready');

      // Handle connection events
      this.connection.on('error', (error) => {
        logger.error('RabbitMQ connection error:', error.message);
        this.isConnected = false;
        this.reconnect();
      });

      this.connection.on('close', () => {
        logger.warn('RabbitMQ connection closed');
        this.isConnected = false;
        this.reconnect();
      });

      return true;
    } catch (error) {
      this.isConnected = false;
      logger.error('❌ RabbitMQ connection failed:', error.message);
      this.reconnect();
      return false;
    }
  }

  async reconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      logger.error('❌ RabbitMQ max reconnection attempts reached');
      return false;
    }

    this.reconnectAttempts++;
    logger.info(`🔄 Reconnecting to RabbitMQ (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
    
    setTimeout(async () => {
      await this.connect();
    }, this.reconnectDelay);
  }

  async publish(queue, message, options = {}) {
    if (!this.isConnected || !this.channel) {
      logger.warn('⚠️ RabbitMQ not connected, processing directly');
      return false;
    }

    try {
      const queueName = this.queues[queue] || queue;
      const buffer = Buffer.from(JSON.stringify(message));
      
      this.channel.sendToQueue(queueName, buffer, {
        persistent: true,
        ...options,
      });
      
      logger.debug(`📤 Message published to ${queueName}`);
      return true;
    } catch (error) {
      logger.error('Queue publish error:', error.message);
      return false;
    }
  }

  async consume(queue, handler, options = {}) {
    if (!this.isConnected || !this.channel) {
      logger.warn('⚠️ RabbitMQ not connected, cannot consume messages');
      return false;
    }

    try {
      const queueName = this.queues[queue] || queue;
      
      await this.channel.consume(queueName, async (msg) => {
        if (msg) {
          try {
            const content = JSON.parse(msg.content.toString());
            const startTime = Date.now();
            
            logger.debug(`📥 Processing message from ${queueName}`);
            
            await handler(content);
            
            const duration = Date.now() - startTime;
            logger.debug(`✅ Message processed in ${duration}ms`);
            
            this.channel.ack(msg);
          } catch (error) {
            logger.error(`❌ Queue handler error for ${queueName}:`, error.message);
            
            // Check if we should reject or retry
            const retryCount = msg.properties.headers?.['x-retry-count'] || 0;
            if (retryCount < 3) {
              // Requeue with retry count
              this.channel.nack(msg, false, true);
            } else {
              // Dead letter - send to DLQ or reject
              logger.error(`❌ Message failed after ${retryCount} retries, sending to DLQ`);
              this.channel.nack(msg, false, false);
            }
          }
        }
      }, {
        noAck: false,
        ...options,
      });
      
      logger.info(`✅ Consumer started for ${queueName}`);
      return true;
    } catch (error) {
      logger.error(`Queue consume error for ${queue}:`, error.message);
      return false;
    }
  }

  // ============================================
  // Convenience Methods
  // ============================================

  async sendNotification(notification) {
    return this.publish('notifications', {
      type: 'notification',
      ...notification,
      timestamp: new Date().toISOString(),
    });
  }

  async sendEmail(email) {
    return this.publish('email', {
      type: 'email',
      ...email,
      timestamp: new Date().toISOString(),
    });
  }

  async trackAnalytics(event) {
    return this.publish('analytics', {
      type: 'analytics',
      ...event,
      timestamp: new Date().toISOString(),
    });
  }

  async processImage(imageData) {
    return this.publish('imageProcessing', {
      type: 'image',
      ...imageData,
      timestamp: new Date().toISOString(),
    });
  }

  // ============================================
  // Utility Methods
  // ============================================

  async getQueueStats(queue) {
    if (!this.isConnected || !this.channel) {
      return null;
    }

    try {
      const queueName = this.queues[queue] || queue;
      const result = await this.channel.assertQueue(queueName, { durable: true });
      return {
        name: queueName,
        messageCount: result.messageCount || 0,
        consumerCount: result.consumerCount || 0,
      };
    } catch (error) {
      logger.error('Queue stats error:', error.message);
      return null;
    }
  }

  async purgeQueue(queue) {
    if (!this.isConnected || !this.channel) {
      return false;
    }

    try {
      const queueName = this.queues[queue] || queue;
      await this.channel.purgeQueue(queueName);
      logger.info(`🧹 Queue purged: ${queueName}`);
      return true;
    } catch (error) {
      logger.error('Queue purge error:', error.message);
      return false;
    }
  }

  async close() {
    try {
      if (this.channel) {
        await this.channel.close();
      }
      if (this.connection) {
        await this.connection.close();
      }
      this.isConnected = false;
      logger.info('✅ RabbitMQ connection closed');
    } catch (error) {
      logger.error('Error closing RabbitMQ connection:', error.message);
    }
  }

  get status() {
    return {
      connected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      queues: this.queues,
    };
  }
}

// Create singleton instance
const queueService = new QueueService();

export default queueService;