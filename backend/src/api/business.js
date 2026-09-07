// backend/src/api/business.js
import { Router } from 'express';
import dotenv from 'dotenv';
import dbService from '../services/dbService.js';

dotenv.config();

const router = Router();

// ============================================
// 1. CREATE BUSINESS
// ============================================
router.post('/create', async (req, res) => {
  try {
    const { userId, businessName, category, description, phone, address } = req.body;

    console.log('🏪 Creating business:', { businessName, category, userId });

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    if (!businessName || !category) {
      return res.status(400).json({
        success: false,
        error: 'Business name and category are required'
      });
    }

    // Check if user already has a business
    const existing = await dbService.getBusinessByUser(userId);

    if (existing) {
      return res.status(400).json({
        success: false,
        error: `You already have a business: "${existing.businessName}"`
      });
    }

    // Create business
    const business = await dbService.createBusiness({
      userId,
      businessName,
      category,
      description: description || '',
      phone: phone || '',
      address: address || '',
      status: 'active',
      verified: false,
    });

    console.log('✅ Business created:', business.id);

    return res.status(201).json({
      success: true,
      message: 'Business created successfully!',
      business: business
    });
  } catch (error) {
    console.error('❌ Business creation error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
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
        error: 'User ID is required'
      });
    }

    const business = await dbService.getBusinessByUser(userId);

    if (!business) {
      console.log('ℹ️ No business found for user');
      return res.status(404).json({
        success: false,
        error: 'Business not found'
      });
    }

    console.log('✅ Business found:', business.id);

    return res.json({
      success: true,
      business: business
    });
  } catch (error) {
    console.error('❌ Get business error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
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
        error: 'Business not found'
      });
    }

    return res.json({
      success: true,
      business: business
    });
  } catch (error) {
    console.error('❌ Get business error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================
// 4. UPDATE BUSINESS
// ============================================
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    console.log('🔄 Updating business:', id);

    // Remove fields that shouldn't be updated
    delete updates.id;
    delete updates.userId;
    delete updates.createdAt;
    delete updates.updatedAt;

    const business = await dbService.updateBusiness(id, updates);

    if (!business) {
      return res.status(404).json({
        success: false,
        error: 'Business not found'
      });
    }

    console.log('✅ Business updated:', id);

    return res.json({
      success: true,
      message: 'Business updated successfully',
      business: business
    });
  } catch (error) {
    console.error('❌ Update error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
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
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('❌ Fetch error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================
// 6. DELETE BUSINESS
// ============================================
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    console.log('🗑️ Deleting business:', id);

    const business = await dbService.updateBusiness(id, { status: 'inactive' });

    if (!business) {
      return res.status(404).json({
        success: false,
        error: 'Business not found'
      });
    }

    console.log('✅ Business deleted:', id);

    return res.json({
      success: true,
      message: 'Business deleted successfully',
      business: business
    });
  } catch (error) {
    console.error('❌ Delete error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;