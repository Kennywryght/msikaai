// backend/drizzle.config.js
import { defineConfig } from 'drizzle-kit';
import dotenv from 'dotenv';

dotenv.config();

// Credentials come only from the environment (backend/.env locally).
// Never commit a connection string here.
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error('DATABASE_URL is not set — add it to backend/.env');
}

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