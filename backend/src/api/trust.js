// backend/src/api/trust.js
import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import crypto from 'crypto';
import multer from 'multer';
import { eq, and, desc } from 'drizzle-orm';

import { db } from '../db/index.js';
import {
  trustScores,
  verificationRequests,
  profiles,
} from '../db/schema.js';
import { logger } from '../utils/logger.js';
import { authenticateToken } from '../middleware/auth.js';
import trustScoreService from '../services/trustScoreService.js';
import storageService from '../services/storageService.js';
import {
  TRUST_TIERS,
  VERIFICATION_TYPES,
  VERIFICATION_STATUSES,
} from '../utils/constants.js';

dotenv.config();

const router = Router();

// Multer — in-memory storage for verification docs (10 MB cap)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

// Admin client (same pattern used in listings.js)
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// ============================================
// HELPERS
// ============================================
const isAdmin = async (userId) => {
  const { data } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();
  return data?.role === 'admin';
};

const sha256 = (value) =>
  crypto.createHash('sha256').update(String(value)).digest('hex');

const generateOtp = () => String(Math.floor(100000 + Math.random() * 900000));

const isExpired = (row) => {
  if (!row?.expiresAt) return false;
  return new Date(row.expiresAt).getTime() < Date.now();
};

// ============================================
// ★ PHASE 3H: POST /api/trust/verify-documents/upload
// Upload a verification document (ID or business). Returns { url }.
// ============================================
router.post(
  '/verify-documents/upload',
  authenticateToken,
  upload.single('document'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No file provided. Use field name "document".',
        });
      }

      // Reject obviously wrong types
      const allowed = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp',
        'application/pdf',
      ];
      if (!allowed.includes(req.file.mimetype)) {
        return res.status(400).json({
          success: false,
          error: `Unsupported file type: ${req.file.mimetype}. Allowed: JPG, PNG, WEBP, PDF.`,
        });
      }

      const { url, error: uploadError } = await storageService.uploadVerificationDocument(
        req.file,
        req.user.id
      );

      if (!url) {
        logger.error('Verification document upload failed', {
          userId: req.user.id,
          error: uploadError,
        });
        return res.status(500).json({
          success: false,
          error: uploadError || 'Failed to upload document',
        });
      }

      logger.info('Verification document uploaded', {
        userId: req.user.id,
        url,
      });

      return res.json({ success: true, url });
    } catch (error) {
      logger.error('POST /api/trust/verify-documents/upload failed', {
        error: error.message,
      });
      return res.status(500).json({ success: false, error: error.message });
    }
  }
);

// ============================================
// GET /api/trust/me
// Own full trust profile
// ============================================
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const profile = await trustScoreService.getTrustProfile(req.user.id);

    const tier = TRUST_TIERS[profile.tier] || TRUST_TIERS[0];

    return res.json({
      success: true,
      trust: {
        ...profile,
        tierName: tier.name,
        tierDescription: tier.description,
        nextTierRequirements: TRUST_TIERS[profile.tier + 1]?.requirements || [],
      },
    });
  } catch (error) {
    logger.error('GET /api/trust/me failed', { error: error.message });
    return res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// GET /api/trust/verifications/mine
// My verification history
// ============================================
router.get('/verifications/mine', authenticateToken, async (req, res) => {
  try {
    const rows = await db
      .select()
      .from(verificationRequests)
      .where(eq(verificationRequests.userId, req.user.id))
      .orderBy(desc(verificationRequests.createdAt));

    return res.json({ success: true, verifications: rows });
  } catch (error) {
    logger.error('GET /api/trust/verifications/mine failed', { error: error.message });
    return res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// GET /api/trust/verifications/pending  (admin)
// ============================================
router.get('/verifications/pending', authenticateToken, async (req, res) => {
  try {
    const admin = await isAdmin(req.user.id);
    if (!admin) {
      return res.status(403).json({ success: false, error: 'Admin access required' });
    }

    const rows = await db
      .select()
      .from(verificationRequests)
      .where(eq(verificationRequests.status, VERIFICATION_STATUSES.PENDING))
      .orderBy(desc(verificationRequests.createdAt));

    return res.json({ success: true, verifications: rows });
  } catch (error) {
    logger.error('GET /api/trust/verifications/pending failed', { error: error.message });
    return res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// POST /api/trust/recompute
// Manually refresh own score
// ============================================
router.post('/recompute', authenticateToken, async (req, res) => {
  try {
    const row = await trustScoreService.recomputeForUser(req.user.id);
    return res.json({ success: true, trust: row });
  } catch (error) {
    logger.error('POST /api/trust/recompute failed', { error: error.message });
    return res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// POST /api/trust/verify-phone
// Step 1: submit phone, receive OTP (logged to console for now)
// ============================================
router.post('/verify-phone', authenticateToken, async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone || typeof phone !== 'string' || phone.length < 9) {
      return res.status(400).json({ success: false, error: 'Valid phone number required' });
    }

    await db
      .update(verificationRequests)
      .set({ status: VERIFICATION_STATUSES.EXPIRED, updatedAt: new Date() })
      .where(
        and(
          eq(verificationRequests.userId, req.user.id),
          eq(verificationRequests.type, VERIFICATION_TYPES.PHONE),
          eq(verificationRequests.status, VERIFICATION_STATUSES.PENDING)
        )
      );

    const otp = generateOtp();
    const otpHash = sha256(otp);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    const [request] = await db
      .insert(verificationRequests)
      .values({
        userId: req.user.id,
        type: VERIFICATION_TYPES.PHONE,
        status: VERIFICATION_STATUSES.PENDING,
        submittedValue: phone,
        metadata: { otpHash },
        expiresAt,
      })
      .returning();

    logger.info('📱 [STUB SMS] Phone OTP generated', {
      userId: req.user.id,
      phone,
      otp,
    });
    console.log(`\n📱 [STUB SMS] OTP for ${phone}: ${otp}\n`);

    return res.json({
      success: true,
      requestId: request.id,
      message: 'OTP sent (stub: check server console)',
      expiresAt,
    });
  } catch (error) {
    logger.error('POST /api/trust/verify-phone failed', { error: error.message });
    return res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// POST /api/trust/verify-phone/confirm
// Step 2: confirm OTP
// ============================================
router.post('/verify-phone/confirm', authenticateToken, async (req, res) => {
  try {
    const { requestId, otp } = req.body;

    if (!requestId || !otp) {
      return res.status(400).json({ success: false, error: 'requestId and otp required' });
    }

    const [request] = await db
      .select()
      .from(verificationRequests)
      .where(
        and(
          eq(verificationRequests.id, requestId),
          eq(verificationRequests.userId, req.user.id),
          eq(verificationRequests.type, VERIFICATION_TYPES.PHONE)
        )
      )
      .limit(1);

    if (!request) {
      return res.status(404).json({ success: false, error: 'Verification request not found' });
    }

    if (request.status !== VERIFICATION_STATUSES.PENDING) {
      return res.status(400).json({ success: false, error: 'Request is no longer pending' });
    }

    if (isExpired(request)) {
      await db
        .update(verificationRequests)
        .set({ status: VERIFICATION_STATUSES.EXPIRED, updatedAt: new Date() })
        .where(eq(verificationRequests.id, requestId));
      return res.status(400).json({ success: false, error: 'OTP expired' });
    }

    const expectedHash = request.metadata?.otpHash;
    if (!expectedHash || sha256(otp) !== expectedHash) {
      return res.status(400).json({ success: false, error: 'Invalid OTP' });
    }

    await db
      .update(verificationRequests)
      .set({
        status: VERIFICATION_STATUSES.APPROVED,
        reviewedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(verificationRequests.id, requestId));

    const trust = await trustScoreService.applyVerificationApproval(
      req.user.id,
      VERIFICATION_TYPES.PHONE
    );

    await db
      .update(profiles)
      .set({ phone: request.submittedValue, updatedAt: new Date() })
      .where(eq(profiles.id, req.user.id));

    logger.info('Phone verified', { userId: req.user.id });

    return res.json({ success: true, message: 'Phone verified', trust });
  } catch (error) {
    logger.error('POST /api/trust/verify-phone/confirm failed', { error: error.message });
    return res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// POST /api/trust/verify-email
// ============================================
router.post('/verify-email', authenticateToken, async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({ success: false, error: 'Valid email required' });
    }

    const [request] = await db
      .insert(verificationRequests)
      .values({
        userId: req.user.id,
        type: VERIFICATION_TYPES.EMAIL,
        status: VERIFICATION_STATUSES.PENDING,
        submittedValue: email,
      })
      .returning();

    logger.info('Email verification submitted', { userId: req.user.id, email });

    return res.json({
      success: true,
      requestId: request.id,
      message: 'Email verification submitted — pending admin approval',
    });
  } catch (error) {
    logger.error('POST /api/trust/verify-email failed', { error: error.message });
    return res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// POST /api/trust/verify-id
// ============================================
router.post('/verify-id', authenticateToken, async (req, res) => {
  try {
    const { idType, idNumber, documentUrl } = req.body;

    if (!documentUrl) {
      return res.status(400).json({
        success: false,
        error: 'documentUrl is required (upload the document first)',
      });
    }

    const [request] = await db
      .insert(verificationRequests)
      .values({
        userId: req.user.id,
        type: VERIFICATION_TYPES.ID,
        status: VERIFICATION_STATUSES.PENDING,
        submittedValue: idNumber || null,
        documentUrl,
        metadata: { idType: idType || 'national_id' },
      })
      .returning();

    logger.info('ID verification submitted', { userId: req.user.id, requestId: request.id });

    return res.json({
      success: true,
      requestId: request.id,
      message: 'ID verification submitted — pending admin approval',
    });
  } catch (error) {
    logger.error('POST /api/trust/verify-id failed', { error: error.message });
    return res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// POST /api/trust/verify-business
// ============================================
router.post('/verify-business', authenticateToken, async (req, res) => {
  try {
    const { businessName, registrationNumber, documentUrl } = req.body;

    if (!businessName || !documentUrl) {
      return res.status(400).json({
        success: false,
        error: 'businessName and documentUrl are required',
      });
    }

    const [request] = await db
      .insert(verificationRequests)
      .values({
        userId: req.user.id,
        type: VERIFICATION_TYPES.BUSINESS,
        status: VERIFICATION_STATUSES.PENDING,
        submittedValue: registrationNumber || null,
        documentUrl,
        metadata: { businessName },
      })
      .returning();

    logger.info('Business verification submitted', {
      userId: req.user.id,
      requestId: request.id,
    });

    return res.json({
      success: true,
      requestId: request.id,
      message: 'Business verification submitted — pending admin approval',
    });
  } catch (error) {
    logger.error('POST /api/trust/verify-business failed', { error: error.message });
    return res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// POST /api/trust/verifications/:id/approve  (admin)
// ============================================
router.post('/verifications/:id/approve', authenticateToken, async (req, res) => {
  try {
    const admin = await isAdmin(req.user.id);
    if (!admin) {
      return res.status(403).json({ success: false, error: 'Admin access required' });
    }

    const { id } = req.params;

    const [request] = await db
      .select()
      .from(verificationRequests)
      .where(eq(verificationRequests.id, id))
      .limit(1);

    if (!request) {
      return res.status(404).json({ success: false, error: 'Verification request not found' });
    }

    if (request.status !== VERIFICATION_STATUSES.PENDING) {
      return res.status(400).json({ success: false, error: 'Request is not pending' });
    }

    await db
      .update(verificationRequests)
      .set({
        status: VERIFICATION_STATUSES.APPROVED,
        reviewedBy: req.user.id,
        reviewedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(verificationRequests.id, id));

    const trust = await trustScoreService.applyVerificationApproval(
      request.userId,
      request.type
    );

    logger.info('Verification approved', {
      requestId: id,
      type: request.type,
      userId: request.userId,
      adminId: req.user.id,
    });

    return res.json({ success: true, message: 'Verification approved', trust });
  } catch (error) {
    logger.error('POST /api/trust/verifications/:id/approve failed', { error: error.message });
    return res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// POST /api/trust/verifications/:id/reject  (admin)
// ============================================
router.post('/verifications/:id/reject', authenticateToken, async (req, res) => {
  try {
    const admin = await isAdmin(req.user.id);
    if (!admin) {
      return res.status(403).json({ success: false, error: 'Admin access required' });
    }

    const { id } = req.params;
    const { reason } = req.body;

    const [request] = await db
      .select()
      .from(verificationRequests)
      .where(eq(verificationRequests.id, id))
      .limit(1);

    if (!request) {
      return res.status(404).json({ success: false, error: 'Verification request not found' });
    }

    if (request.status !== VERIFICATION_STATUSES.PENDING) {
      return res.status(400).json({ success: false, error: 'Request is not pending' });
    }

    await db
      .update(verificationRequests)
      .set({
        status: VERIFICATION_STATUSES.REJECTED,
        reviewedBy: req.user.id,
        reviewedAt: new Date(),
        rejectionReason: reason || 'Not provided',
        updatedAt: new Date(),
      })
      .where(eq(verificationRequests.id, id));

    logger.info('Verification rejected', {
      requestId: id,
      type: request.type,
      userId: request.userId,
      adminId: req.user.id,
    });

    return res.json({ success: true, message: 'Verification rejected' });
  } catch (error) {
    logger.error('POST /api/trust/verifications/:id/reject failed', { error: error.message });
    return res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// GET /api/trust/:userId  (public)
// ============================================
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const [row] = await db
      .select()
      .from(trustScores)
      .where(eq(trustScores.userId, userId))
      .limit(1);

    if (!row) {
      return res.status(404).json({ success: false, error: 'Trust profile not found' });
    }

    const tier = TRUST_TIERS[row.tier] || TRUST_TIERS[0];

    return res.json({
      success: true,
      trust: {
        userId: row.userId,
        tier: row.tier,
        tierName: tier.name,
        tierDescription: tier.description,
        trustScore: row.trustScore,
        emailVerified: row.emailVerified,
        phoneVerified: row.phoneVerified,
        idVerified: row.idVerified,
        businessVerified: row.businessVerified,
        totalReviews: row.totalReviews,
        averageRating: row.averageRating,
        listingsCount: row.listingsCount,
        suspended: row.suspended,
      },
    });
  } catch (error) {
    logger.error('GET /api/trust/:userId failed', { error: error.message });
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;