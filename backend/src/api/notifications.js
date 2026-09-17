// backend/src/api/notifications.js
import { Router } from 'express';
import notificationService from '../services/notificationService.js';
import pushService from '../services/pushService.js';
import { logger } from '../utils/logger.js';

const router = Router();

// ============================================
// ✅ PUSH NOTIFICATIONS — must come BEFORE /:id routes
// ============================================

// GET /api/notifications/push/public-key
router.get('/push/public-key', async (req, res) => {
  try {
    if (!pushService.isConfigured) {
      return res.status(503).json({
        success: false,
        error: 'Push notifications are not configured on the server',
      });
    }
    res.json({
      success: true,
      publicKey: pushService.publicKey,
    });
  } catch (error) {
    logger.error('Get push public key error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/notifications/push/subscribe
router.post('/push/subscribe', async (req, res) => {
  try {
    const userId = req.user.id;
    const { subscription } = req.body;

    if (!subscription) {
      return res.status(400).json({
        success: false,
        error: 'Subscription object is required',
      });
    }

    const result = await pushService.saveSubscription(
      userId,
      subscription,
      req.headers['user-agent'] || null
    );

    res.json({ success: true, ...result });
  } catch (error) {
    logger.error('Push subscribe error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/notifications/push/unsubscribe
router.post('/push/unsubscribe', async (req, res) => {
  try {
    const userId = req.user.id;
    const { endpoint } = req.body;

    await pushService.deleteSubscription(userId, endpoint || null);
    res.json({ success: true });
  } catch (error) {
    logger.error('Push unsubscribe error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/notifications/push/test
router.post('/push/test', async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pushService.sendToUser(userId, {
      title: '🔔 Test notification',
      body: 'If you see this, push notifications are working!',
      url: '/messages',
      icon: '/logo192.png',
      badge: '/logo192.png',
    });

    res.json({ success: true, ...result });
  } catch (error) {
    logger.error('Push test error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// GET USER NOTIFICATIONS
// ============================================
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 20 } = req.query;

    const result = await notificationService.getUserNotifications(
      userId,
      parseInt(limit)
    );

    if (!result.success) {
      return res.status(500).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ============================================
// MARK AS READ
// ============================================
router.put('/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required',
      });
    }

    const result = await notificationService.markAsRead(id, userId);

    if (!result.success) {
      return res.status(500).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ============================================
// MARK ALL AS READ
// ============================================
router.put('/all/read', async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required',
      });
    }

    const result = await notificationService.markAllAsRead(userId);

    if (!result.success) {
      return res.status(500).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ============================================
// DELETE NOTIFICATION
// ============================================
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required',
      });
    }

    const result = await notificationService.deleteNotification(id, userId);

    if (!result.success) {
      return res.status(500).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;