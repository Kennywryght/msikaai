// backend/drizzle.config.js
import { defineConfig } from 'drizzle-kit';
import dotenv from 'dotenv';

dotenv.config();

// ✅ Fixed: URL-encoded password
const DATABASE_URL = process.env.DATABASE_URL || 
  "postgresql://postgres.wywiyswqrowzxvbcygsy:kids04D10.100%25@aws-0-us-east-1.pooler.supabase.com:5432/postgres?pgbouncer=true";

export default defineConfig({
  schema: './src/db/schema.js',
  out: './src/db/migrations',
  dialect: 'postgresql',  // ✅ Use 'postgresql' not 'pg'
  dbCredentials: {
    url: DATABASE_URL,
  },
  verbose: true,
  strict: true,
});