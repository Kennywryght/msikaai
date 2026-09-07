// backend/src/scripts/syncSearch.js
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import searchService from '../services/searchService.js';
import { logger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function syncSearch() {
  console.log('🔄 Starting search index sync...');

  try {
    // Check search connection
    if (!searchService.isConnected) {
      console.error('❌ Search service not connected');
      process.exit(1);
    }

    // Fetch all active listings with business data
    console.log('📥 Fetching listings from database...');
    const { data: listings, error } = await supabase
      .from('listings')
      .select(`
        *,
        businesses:businessId (
          businessName
        )
      `)
      .eq('status', 'active');

    if (error) throw error;

    console.log(`📊 Found ${listings?.length || 0} listings to index`);

    if (!listings || listings.length === 0) {
      console.log('ℹ️ No listings to index');
      process.exit(0);
    }

    // Clear existing index
    console.log('🗑️ Clearing existing index...');
    await searchService.clearIndex();

    // Index in batches
    const batchSize = 100;
    let indexed = 0;

    for (let i = 0; i < listings.length; i += batchSize) {
      const batch = listings.slice(i, i + batchSize);
      const count = await searchService.indexListings(batch);
      indexed += count;
      console.log(`📄 Indexed ${indexed}/${listings.length} listings`);
    }

    // Get stats
    const stats = await searchService.getStats();
    console.log('✅ Search index sync complete!');
    console.log('📊 Index stats:', stats);

    process.exit(0);
  } catch (error) {
    console.error('❌ Sync error:', error.message);
    process.exit(1);
  }
}

syncSearch();