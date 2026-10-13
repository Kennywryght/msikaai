import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { checkBusinessAccess } from '../utils/authz.js';

dotenv.config();

const router = Router();

// Exports contain a business's full data — owner (or admin) only.
router.use('/:kind/:businessId', async (req, res, next) => {
  try {
    const access = await checkBusinessAccess(req.user?.id, req.params.businessId);
    if (!access.ok) return res.status(access.status).json({ success: false, error: access.error });
    next();
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to check permissions' });
  }
});
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// ============================================
// EXPORT LISTINGS TO CSV
// ============================================
router.get('/listings/:businessId/csv', async (req, res) => {
  try {
    const { businessId } = req.params;
    const { status, category } = req.query;

    let query = supabase
      .from('listings')
      .select('*')
      .eq('business_id', businessId);

    if (status) {
      query = query.eq('status', status);
    }

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Build CSV
    const headers = [
      'ID', 'Title', 'Description', 'Category', 'Price', 
      'Quantity', 'Unit', 'Status', 'Views', 'Contacts', 'Created At'
    ];

    const rows = data.map(item => [
      item.id,
      item.title || '',
      item.description || '',
      item.category || '',
      item.price || '',
      item.quantity || '',
      item.unit || '',
      item.status || '',
      item.view_count || 0,
      item.contact_count || 0,
      new Date(item.created_at).toLocaleDateString()
    ]);

    let csv = headers.join(',') + '\n';
    rows.forEach(row => {
      csv += row.join(',') + '\n';
    });

    // Set response headers for download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=listings-${new Date().toISOString().split('T')[0]}.csv`);
    res.send(csv);

  } catch (error) {
    console.error('Export CSV error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================
// EXPORT BUSINESS DATA TO JSON
// ============================================
router.get('/business/:businessId/json', async (req, res) => {
  try {
    const { businessId } = req.params;

    // Get business info
    const { data: business, error: bizError } = await supabase
      .from('businesses')
      .select('*')
      .eq('id', businessId)
      .single();

    if (bizError) throw bizError;

    // Get listings
    const { data: listings, error: listError } = await supabase
      .from('listings')
      .select('*')
      .eq('business_id', businessId);

    if (listError) throw listError;

    // Get reviews
    const { data: reviews, error: revError } = await supabase
      .from('reviews')
      .select('*')
      .eq('business_id', businessId);

    if (revError) throw revError;

    const exportData = {
      business,
      listings,
      reviews,
      exported_at: new Date().toISOString(),
      version: '1.0.0'
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=business-${businessId}-${new Date().toISOString().split('T')[0]}.json`);
    res.json(exportData);

  } catch (error) {
    console.error('Export JSON error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;