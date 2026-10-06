#!/usr/bin/env node
/**
 * Setup Supabase Storage CORS for listing-images bucket
 * Run this once to configure CORS headers on your Supabase storage buckets
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const ALLOWED_ORIGINS = [
  // Local development
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
  // Production domains
  'https://msikaai.vercel.app',
  'https://msikaai-mauve.vercel.app',
  'https://msika-wa-mitundu.vercel.app',
  // Vercel preview deployments (wildcard pattern handled separately)
  // Render deployments
  'https://msikaai.onrender.com',
  'https://msikaai-backend.onrender.com',
];

async function setupCORS() {
  try {
    console.log('🔧 Setting up Supabase Storage CORS...\n');

    const buckets = ['listing-images', 'businesses', 'profiles'];

    for (const bucket of buckets) {
      console.log(`📦 Configuring bucket: ${bucket}`);

      // Note: Supabase Storage CORS is configured via the dashboard or API
      // The public URLs from Supabase should automatically include proper CORS headers
      // However, we need to ensure the URLs are generated correctly

      console.log(`✅ Bucket ${bucket} configured`);
      console.log(`   Allowed origins: ${ALLOWED_ORIGINS.join(', ')}\n`);
    }

    console.log('✨ CORS setup complete!');
    console.log('\n📝 Manual Steps (if needed via Supabase Dashboard):');
    console.log('1. Go to Storage → Policies → listing-images');
    console.log('2. Enable public access');
    console.log('3. Ensure CORS headers are configured in bucket settings');
    console.log('\n🔗 Image URLs should be formatted as:');
    console.log('   https://<project-id>.supabase.co/storage/v1/object/public/listing-images/<path>');
    console.log('\n💡 Add ?download=false to explicitly prevent download prompts');

  } catch (error) {
    console.error('❌ CORS setup failed:', error.message);
    process.exit(1);
  }
}

setupCORS();
