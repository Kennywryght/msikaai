// backend/src/api/messages.js
import { Router } from 'express';
import multer from 'multer';
import { eq, and } from 'drizzle-orm';
import dbService from '../services/dbService.js';
import requestsService from '../services/requestsService.js';
import notificationService from '../services/notificationService.js';
import pushService from '../services/pushService.js';
import cloudinaryService from '../services/cloudinaryService.js';
import { db } from '../db/index.js';
import { requestResponses, requests, profiles } from '../db/schema.js';
import { logger } from '../utils/logger.js';

const router = Router();

// ============================================
// Multer setup — memory storage for Cloudinary upload
// ============================================

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, WEBP, and GIF images are allowed'));
    }
  },
});

const audioUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const isAudio =
      file.mimetype?.startsWith('audio/') ||
      file.mimetype === 'application/octet-stream' ||
      file.mimetype === 'video/webm';

    if (isAudio) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported audio type: ${file.mimetype}`));
    }
  },
});

// ============================================
// Helpers
// ============================================
async function assertParticipant(conversationId, userId) {
  const conversation = await dbService.db
    .select()
    .from(dbService.schema.conversations)
    .where(eq(dbService.schema.conversations.id, conversationId))
    .limit(1);

  if (!conversation[0]) return { ok: false, reason: 'not_found' };

  const c = conversation[0];
  const isParticipant =
    c.participantOneId === userId || c.participantTwoId === userId;

  return { ok: isParticipant, conversation: c };
}

const getUserDisplayName = async (userId) => {
  try {
    const [row] = await db
      .select({ fullName: profiles.fullName })
      .from(profiles)
      .where(eq(profiles.id, userId))
      .limit(1);
    return row?.fullName || 'Someone';
  } catch {
    return 'Someone';
  }
};

// ============================================
// GET /api/messages/conversations
// ============================================
router.get('/conversations', async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 50, offset = 0 } = req.query;

    const result = await dbService.getUserConversations(userId, {
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
    });

    const conversations = await Promise.all(
      result.conversations.map(async (c) => {
        let listing = null;
        if (c.listingId) {
          try {
            listing = await dbService.getListing(c.listingId);
          } catch (_) {}
        }
        return { ...c, listing };
      })
    );

    res.json({ success: true, conversations });
  } catch (error) {
    logger.error('List conversations error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// POST /api/messages/conversations
// ============================================
router.post('/conversations', async (req, res) => {
  try {
    const userId = req.user.id;
    const { otherUserId, listingId = null } = req.body;

    if (!otherUserId) {
      return res
        .status(400)
        .json({ success: false, error: 'otherUserId is required' });
    }
    if (otherUserId === userId) {
      return res.status(400).json({
        success: false,
        error: 'You cannot start a conversation with yourself',
      });
    }

    const conversation = await dbService.findOrCreateConversation(
      userId,
      otherUserId,
      listingId
    );

    res.json({ success: true, conversation });
  } catch (error) {
    logger.error('Create conversation error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// GET /api/messages/conversations/:id
// ============================================
router.get('/conversations/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { limit = 100, offset = 0 } = req.query;

    const check = await assertParticipant(id, userId);
    if (!check.ok) {
      return res.status(404).json({
        success: false,
        error:
          check.reason === 'not_found'
            ? 'Conversation not found'
            : 'You are not part of this conversation',
      });
    }

    const { messages } = await dbService.getConversationMessages(id, {
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
    });

    const c = check.conversation;
    const otherUserId =
      c.participantOneId === userId ? c.participantTwoId : c.participantOneId;

    const otherProfile = await dbService.getProfile(otherUserId);
    let listing = null;
    if (c.listingId) {
      try {
        listing = await dbService.getListing(c.listingId);
      } catch (_) {}
    }

    res.json({
      success: true,
      conversation: {
        id: c.id,
        listingId: c.listingId,
        lastMessageText: c.lastMessageText,
        lastMessageAt: c.lastMessageAt,
        unreadCount:
          c.participantOneId === userId
            ? c.unreadCountForOne
            : c.unreadCountForTwo,
        otherParticipant: otherProfile,
        listing,
      },
      messages,
    });
  } catch (error) {
    logger.error('Get conversation error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// POST /api/messages/conversations/:id
// Send a message (text, imageUrl, audioUrl, or any combination)
// ★ PHASE 2: also accepts proposedPrice for negotiation proposals
// ============================================
router.post('/conversations/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const {
      text,
      imageUrl,
      audioUrl,
      durationMs,
      type = 'text',
      // ★ PHASE 2 — if present, treat as a proposal
      proposedPrice = null,
    } = req.body;

    if (!text && !imageUrl && !audioUrl) {
      return res.status(400).json({
        success: false,
        error: 'Message must have text, an image, or a voice recording',
      });
    }

    const check = await assertParticipant(id, userId);
    if (!check.ok) {
      return res.status(404).json({
        success: false,
        error:
          check.reason === 'not_found'
            ? 'Conversation not found'
            : 'You are not part of this conversation',
      });
    }

    const resolvedType = audioUrl ? 'audio' : imageUrl ? 'image' : type;

    // ★ PHASE 2 — if a price is supplied, this is a negotiation proposal
    let proposalFields = {};
    if (proposedPrice != null) {
      const priceNum = parseFloat(proposedPrice);
      if (Number.isNaN(priceNum) || priceNum <= 0) {
        return res.status(400).json({
          success: false,
          error: 'proposedPrice must be a positive number',
        });
      }

      // Supersede any older pending proposals in this conversation
      await dbService.supersedeProposals(id);

      proposalFields = {
        proposedPrice: priceNum,
        proposalKind: 'counter',
        proposalStatus: 'pending',
      };
    }

    const message = await dbService.sendMessage(id, userId, {
      text: text || null,
      imageUrl: imageUrl || null,
      audioUrl: audioUrl || null,
      durationMs: durationMs || null,
      type: resolvedType,
      ...proposalFields,
    });

    const c = check.conversation;
    const otherUserId =
      c.participantOneId === userId ? c.participantTwoId : c.participantOneId;

    let notifBody;
    if (proposedPrice != null) {
      notifBody = `💰 New offer: MK ${Number(proposedPrice).toLocaleString()}`;
    } else if (audioUrl) {
      notifBody = '🎤 Sent you a voice message';
    } else if (imageUrl) {
      notifBody = '📷 Sent you a photo';
    } else {
      notifBody = (text || '').slice(0, 80);
    }

    notificationService
      .createNotification({
        userId: otherUserId,
        type: 'info',
        title: proposedPrice != null ? 'New offer' : 'New message',
        message: notifBody,
        data: { conversationId: id, messageId: message.id },
      })
      .catch((err) =>
        logger.warn('Notification for message failed:', err.message)
      );

    pushService
      .sendToUser(otherUserId, {
        title: proposedPrice != null ? 'New offer on Kumsika' : 'New message on Kumsika',
        body: notifBody,
        url: `/chat/${id}`,
        icon: '/logo192.png',
        badge: '/logo192.png',
        tag: `chat-${id}`,
        data: { conversationId: id, messageId: message.id },
      })
      .catch((err) => logger.warn('Web push failed:', err.message));

    res.status(201).json({ success: true, message });
  } catch (error) {
    logger.error('Send message error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// ★ PHASE 2: POST /api/messages/proposals/:messageId/accept
// Accept a pending proposal. Only the OTHER party can accept it.
// ============================================
router.post('/proposals/:messageId/accept', async (req, res) => {
  try {
    const userId = req.user.id;
    const { messageId } = req.params;

    const message = await dbService.getMessageById(messageId);
    if (!message) {
      return res.status(404).json({ success: false, error: 'Proposal not found' });
    }
    if (!message.proposedPrice) {
      return res.status(400).json({ success: false, error: 'This message is not a proposal' });
    }
    if (message.proposalStatus !== 'pending') {
      return res.status(409).json({
        success: false,
        error: `This proposal is already ${message.proposalStatus}`,
      });
    }

    // Cannot accept your own proposal
    if (message.senderId === userId) {
      return res.status(403).json({
        success: false,
        error: 'You cannot accept your own proposal',
      });
    }

    const check = await assertParticipant(message.conversationId, userId);
    if (!check.ok) {
      return res.status(404).json({ success: false, error: 'Conversation not found' });
    }

    // Find the associated request response (for updating status)
    const [responseRow] = await db
      .select()
      .from(requestResponses)
      .where(eq(requestResponses.conversationId, message.conversationId))
      .limit(1);

    const [requestRow] = responseRow
      ? await db
          .select()
          .from(requests)
          .where(eq(requests.id, responseRow.requestId))
          .limit(1)
      : [null];

    // Supersede all other pending proposals in this conversation
    await dbService.supersedeProposals(message.conversationId, messageId);
    await dbService.updateProposalStatus(messageId, 'accepted');

    // Flip the response + request to accepted
    if (responseRow && requestRow) {
      // The responderId is whoever submitted the original response.
      // The accept endpoint (requestsService.acceptResponse) expects the
      // request owner as userId — so call it with the request owner.
      try {
        await requestsService.acceptResponse(
          requestRow.userId,
          responseRow.requestId,
          responseRow.id
        );
      } catch (err) {
        logger.warn('acceptResponse via proposal failed', {
          error: err?.message || err,
        });
      }

      // Notify the other party
      try {
        const accepterName = await getUserDisplayName(userId);
        const otherPartyId = message.senderId;
        await notificationService.notifyProposalAccepted({
          recipientId: otherPartyId,
          requestTitle: requestRow.title,
          requestId: requestRow.id,
          conversationId: message.conversationId,
          acceptedPrice: message.proposedPrice,
          accepterName,
        });
      } catch (err) {
        logger.warn('notifyProposalAccepted failed', {
          error: err?.message || err,
        });
      }
    }

    const updated = await dbService.getMessageById(messageId);

    logger.info('Proposal accepted', {
      messageId,
      conversationId: message.conversationId,
      acceptedBy: userId,
    });

    return res.json({ success: true, message: updated });
  } catch (error) {
    logger.error('Accept proposal error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// ★ PHASE 2: POST /api/messages/proposals/:messageId/decline
// ============================================
router.post('/proposals/:messageId/decline', async (req, res) => {
  try {
    const userId = req.user.id;
    const { messageId } = req.params;

    const message = await dbService.getMessageById(messageId);
    if (!message) {
      return res.status(404).json({ success: false, error: 'Proposal not found' });
    }
    if (!message.proposedPrice) {
      return res.status(400).json({ success: false, error: 'This message is not a proposal' });
    }
    if (message.proposalStatus !== 'pending') {
      return res.status(409).json({
        success: false,
        error: `This proposal is already ${message.proposalStatus}`,
      });
    }

    // Cannot decline your own proposal
    if (message.senderId === userId) {
      return res.status(403).json({
        success: false,
        error: 'You cannot decline your own proposal',
      });
    }

    const check = await assertParticipant(message.conversationId, userId);
    if (!check.ok) {
      return res.status(404).json({ success: false, error: 'Conversation not found' });
    }

    await dbService.updateProposalStatus(messageId, 'declined');

    const [responseRow] = await db
      .select()
      .from(requestResponses)
      .where(eq(requestResponses.conversationId, message.conversationId))
      .limit(1);

    const [requestRow] = responseRow
      ? await db
          .select()
          .from(requests)
          .where(eq(requests.id, responseRow.requestId))
          .limit(1)
      : [null];

    if (responseRow && requestRow) {
      try {
        const declinerName = await getUserDisplayName(userId);
        await notificationService.notifyProposalDeclined({
          recipientId: message.senderId,
          requestTitle: requestRow.title,
          requestId: requestRow.id,
          conversationId: message.conversationId,
          declinedPrice: message.proposedPrice,
          declinerName,
        });
      } catch (err) {
        logger.warn('notifyProposalDeclined failed', {
          error: err?.message || err,
        });
      }
    }

    const updated = await dbService.getMessageById(messageId);

    logger.info('Proposal declined', {
      messageId,
      conversationId: message.conversationId,
      declinedBy: userId,
    });

    return res.json({ success: true, message: updated });
  } catch (error) {
    logger.error('Decline proposal error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// POST /api/messages/upload-image
// ============================================
router.post('/upload-image', upload.single('image'), async (req, res) => {
  try {
    const userId = req.user.id;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No image file provided (expected field name "image")',
      });
    }

    if (!cloudinaryService.isConfigured) {
      return res.status(503).json({
        success: false,
        error: 'Image upload is temporarily unavailable',
      });
    }

    const result = await cloudinaryService.uploadImage(req.file, {
      folder: `chat/${userId}`,
      width: 1200,
      height: 1200,
      quality: 80,
      fit: 'inside',
    });

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error || 'Upload failed',
      });
    }

    logger.info(`📷 Chat image uploaded by ${userId}: ${result.publicId}`);

    res.json({
      success: true,
      url: result.url,
      publicId: result.publicId,
      width: result.width,
      height: result.height,
      bytes: result.bytes,
    });
  } catch (error) {
    logger.error('Chat image upload error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// POST /api/messages/upload-audio
// ============================================
router.post('/upload-audio', audioUpload.single('audio'), async (req, res) => {
  try {
    const userId = req.user.id;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No audio file provided (expected field name "audio")',
      });
    }

    if (!cloudinaryService.isConfigured) {
      return res.status(503).json({
        success: false,
        error: 'Voice upload is temporarily unavailable',
      });
    }

    const result = await cloudinaryService.uploadAudio(req.file, {
      folder: `chat/${userId}/audio`,
    });

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error || 'Audio upload failed',
      });
    }

    logger.info(
      `🎤 Chat audio uploaded by ${userId}: ${result.publicId} (${result.duration}s, ${result.bytes} bytes)`
    );

    res.json({
      success: true,
      url: result.url,
      publicId: result.publicId,
      durationSec: Math.round(result.duration || 0),
      bytes: result.bytes,
      format: result.format,
    });
  } catch (error) {
    logger.error('Chat audio upload error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// PUT /api/messages/conversations/:id/read
// ============================================
router.put('/conversations/:id/read', async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const check = await assertParticipant(id, userId);
    if (!check.ok) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found or not accessible',
      });
    }

    await dbService.markConversationRead(id, userId);
    res.json({ success: true });
  } catch (error) {
    logger.error('Mark read error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;