// backend/src/api/business.js
import { Router } from 'express';
import dotenv from 'dotenv';
import dbService from '../services/dbService.js';

dotenv.config();

const router = Router();

// ============================================
// The canonical category list — MUST match
// the CHECK constraint on public.businesses.category
// ============================================
const ALLOWED_CATEGORIES = [
  'Food & Groceries',
  'Clothing & Fashion',
  'Farm Inputs',
  'Construction',
  'Plumbing',
  'Electrical',
  'Carpentry',
  'Tailoring',
  'Salon & Barber',
  'Mechanic',
  'Electronics',
  'Hardware',
  'Home & Garden',
  'Health & Beauty',
  'Transport',
  'ICT',
  'Services',
  'Retail',
  'Other',
];

// ============================================
// 1. CREATE BUSINESS
// ============================================
router.post('/create', async (req, res) => {
  try {
    const {
      userId,
      businessName,
      category,
      description,
      phone,
      address,
      locationText,
    } = req.body;

    console.log('🏪 Creating business:', {
      businessName,
      category,
      userId,
    });

    // -------- Validation --------
    if (!userId) {
      console.warn('❌ 400: Missing userId');
      return res.status(400).json({
        success: false,
        error: 'User ID is required',
      });
    }

    if (!businessName || !category) {
      console.warn('❌ 400: Missing businessName or category', {
        businessName,
        category,
      });
      return res.status(400).json({
        success: false,
        error: 'Business name and category are required',
      });
    }

    // Trim & normalize the category so " Clothing & Fashion " matches too
    const normalizedCategory = String(category).trim();

    if (!ALLOWED_CATEGORIES.includes(normalizedCategory)) {
      console.warn('❌ 400: Invalid category:', normalizedCategory);
      return res.status(400).json({
        success: false,
        error: `Invalid category "${normalizedCategory}". Allowed: ${ALLOWED_CATEGORIES.join(', ')}`,
        allowedCategories: ALLOWED_CATEGORIES,
      });
    }

    // -------- Duplicate check --------
    const existing = await dbService.getBusinessByUser(userId);

    if (existing) {
      console.warn(
        '❌ 400: User already has a business:',
        existing.businessName
      );
      return res.status(400).json({
        success: false,
        error: `You already have a business: "${existing.businessName}"`,
      });
    }

    // -------- Create --------
    const business = await dbService.createBusiness({
      userId,
      businessName: String(businessName).trim(),
      category: normalizedCategory,
      description: description || '',
      phone: phone || '',
      address: address || locationText || '',
      status: 'active',
      verified: false,
    });

    console.log('✅ Business created:', business.id);

    return res.status(201).json({
      success: true,
      message: 'Business created successfully!',
      business,
    });
  } catch (error) {
    // -------- Full diagnostics --------
    console.error('❌ Business creation error:', {
      message: error.message,
      code: error.code, // Postgres: 23514 = check, 23505 = unique, 42703 = missing column
      detail: error.detail,
      constraint: error.constraint,
      stack: error.stack,
    });

    // Translate Postgres error codes to user-friendly messages
    let userMessage = error.message || 'Internal server error';
    let statusCode = 500;

    switch (error.code) {
      case '23514': // CHECK constraint violation
        userMessage =
          'Invalid category. Please pick one from the allowed list.';
        statusCode = 400;
        break;
      case '23505': // UNIQUE constraint violation
        userMessage = 'You already have a business with this name.';
        statusCode = 400;
        break;
      case '23502': // NOT NULL violation
        userMessage = 'A required field is missing. Please check all fields.';
        statusCode = 400;
        break;
      case '42703': // Missing column
        userMessage =
          'Server configuration error. Please try again later.';
        statusCode = 500;
        break;
      default:
        statusCode = 500;
    }

    return res.status(statusCode).json({
      success: false,
      error: userMessage,
      code: error.code || null,
    });
  }
});

// ============================================
// 2. GET BUSINESS BY USER ID
// ============================================
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    console.log('🔍 Fetching business for user:', userId);

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required',
      });
    }

    const business = await dbService.getBusinessByUser(userId);

    if (!business) {
      console.log('ℹ️ No business found for user');
      return res.status(404).json({
        success: false,
        error: 'Business not found',
      });
    }

    console.log('✅ Business found:', business.id);

    return res.json({
      success: true,
      business,
    });
  } catch (error) {
    console.error('❌ Get business error:', {
      message: error.message,
      code: error.code,
      stack: error.stack,
    });
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch business',
    });
  }
});

// ============================================
// 3. GET BUSINESS BY ID
// ============================================
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    console.log('🔍 Fetching business by ID:', id);

    const business = await dbService.getBusiness(id);

    if (!business) {
      return res.status(404).json({
        success: false,
        error: 'Business not found',
      });
    }

    return res.json({
      success: true,
      business,
    });
  } catch (error) {
    console.error('❌ Get business error:', {
      message: error.message,
      code: error.code,
    });
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch business',
    });
  }
});

// ============================================
// 4. UPDATE BUSINESS
// ============================================
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };

    console.log('🔄 Updating business:', id);

    // Remove immutable fields
    delete updates.id;
    delete updates.userId;
    delete updates.createdAt;
    delete updates.updatedAt;

    // Validate category if present in updates
    if (updates.category !== undefined) {
      const normalized = String(updates.category).trim();
      if (!ALLOWED_CATEGORIES.includes(normalized)) {
        return res.status(400).json({
          success: false,
          error: `Invalid category "${normalized}". Allowed: ${ALLOWED_CATEGORIES.join(', ')}`,
          allowedCategories: ALLOWED_CATEGORIES,
        });
      }
      updates.category = normalized;
    }

    const business = await dbService.updateBusiness(id, updates);

    if (!business) {
      return res.status(404).json({
        success: false,
        error: 'Business not found',
      });
    }

    console.log('✅ Business updated:', id);

    return res.json({
      success: true,
      message: 'Business updated successfully',
      business,
    });
  } catch (error) {
    console.error('❌ Update error:', {
      message: error.message,
      code: error.code,
    });

    let userMessage = error.message || 'Internal server error';
    let statusCode = 500;

    if (error.code === '23514') {
      userMessage = 'Invalid category. Please pick one from the allowed list.';
      statusCode = 400;
    }

    return res.status(statusCode).json({
      success: false,
      error: userMessage,
      code: error.code || null,
    });
  }
});

// ============================================
// 5. GET ALL BUSINESSES
// ============================================
router.get('/', async (req, res) => {
  try {
    const { category, limit = 20, offset = 0 } = req.query;

    console.log('🔍 Fetching businesses:', { category, limit, offset });

    const result = await dbService.getBusinesses({
      category,
      limit: parseInt(limit),
      offset: parseInt(offset),
      status: 'active',
    });

    return res.json({
      success: true,
      businesses: result.businesses || [],
      total: result.total || 0,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
  } catch (error) {
    console.error('❌ Fetch error:', {
      message: error.message,
      code: error.code,
    });
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch businesses',
    });
  }
});

// ============================================
// 6. DELETE BUSINESS (soft delete)
// ============================================
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    console.log('🗑️ Deleting business:', id);

    const business = await dbService.updateBusiness(id, {
      status: 'inactive',
    });

    if (!business) {
      return res.status(404).json({
        success: false,
        error: 'Business not found',
      });
    }

    console.log('✅ Business deleted:', id);

    return res.json({
      success: true,
      message: 'Business deleted successfully',
      business,
    });
  } catch (error) {
    console.error('❌ Delete error:', {
      message: error.message,
      code: error.code,
    });
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete business',
    });
  }
});

export default router;