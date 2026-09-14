// backend/src/db/index.js
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema.js';
import { logger } from '../utils/logger.js';

// ============================================================
// GET DATABASE_URL FROM ENVIRONMENT
// ============================================================
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  logger.error('❌ DATABASE_URL is not defined');
  logger.error('💡 Set it in backend/.env (local) or Render Environment (production)');
  throw new Error('DATABASE_URL is required');
}

// ============================================================
// SAFE URL LOGGING
// Never log the password — only protocol, username, host, and db name.
// ============================================================
const safeUrl = (() => {
  try {
    const u = new URL(DATABASE_URL);
    return `${u.protocol}//${u.username}@${u.host}${u.pathname}`;
  } catch {
    return '(invalid URL format)';
  }
})();

logger.info(`🔗 Connecting to database...`);
logger.info(`📍 Target: ${safeUrl}`);

// ============================================================
// POSTGRES CLIENT
// ============================================================
const client = postgres(DATABASE_URL, {
  ssl: {
    rejectUnauthorized: false, // Required for Supabase pooler
  },
  max: 10,
  idle_timeout: 30,
  connect_timeout: 60,
  onnotice: () => {}, // Suppress notices
});

// ============================================================
// DRIZZLE CLIENT
// ============================================================
export const db = drizzle(client, {
  schema,
  logger: process.env.NODE_ENV === 'development',
});

export { client };

// ============================================================
// TEST CONNECTION
// Extracts a clean, readable error message instead of dumping
// the whole error object as a character map.
// ============================================================
export const testConnection = async () => {
  try {
    const result = await client`SELECT 1 as connected`;
    if (result && result.length > 0) {
      logger.info('✅ Database connection successful');
      return true;
    }
    logger.warn('⚠️ Database query returned no rows');
    return false;
  } catch (error) {
    // ✅ Extract a plain-text message from whatever postgres.js threw
    const msg =
      error?.message ??
      error?.code ??
      (typeof error === 'string' ? error : JSON.stringify(error));

    logger.error(`❌ Database connection failed: ${msg}`);
    logger.error(`📍 Target was: ${safeUrl}`);

    // ✅ Actionable hints for the most common failures
    if (msg.includes('ENOTFOUND')) {
      logger.error(
        '💡 DNS lookup failed. The host in DATABASE_URL does not exist.'
      );
      logger.error(
        '   Supabase removed the old "db.<project-ref>.supabase.co" host format.'
      );
      logger.error(
        '   Use the Connection Pooling URI from Supabase → Settings → Database → Connection string.'
      );
      logger.error(
        '   Correct format: postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres'
      );
    } else if (msg.includes('password authentication failed')) {
      logger.error(
        '💡 Wrong password. Reset it in Supabase → Settings → Database → Reset password,'
      );
      logger.error(
        '   then update DATABASE_URL in backend/.env and Render Environment.'
      );
    } else if (msg.includes('ETIMEDOUT') || msg.toLowerCase().includes('timeout')) {
      logger.error(
        '💡 Connection timed out. Check that port 6543 is not blocked by a firewall.'
      );
      logger.error(
        '   If it persists, try the Session Pooler on port 5432 instead.'
      );
    } else if (msg.includes('too many clients')) {
      logger.error(
        '💡 Too many open connections. Reduce "max" in the postgres() config,'
      );
      logger.error(
        '   and make sure you are using the pooler host (port 6543), not the direct connection.'
      );
    } else if (msg.includes('self signed certificate') || msg.includes('SSL')) {
      logger.error(
        '💡 SSL error. Ensure ssl: { rejectUnauthorized: false } is set (it is here).'
      );
    }

    logger.error('📝 Verify DATABASE_URL in backend/.env and in Render Environment.');
    throw error;
  }
};

// ============================================================
// CLOSE CONNECTION
// ============================================================
export const closeConnection = async () => {
  try {
    await client.end();
    logger.info('✅ Database connection closed');
  } catch (error) {
    const msg =
      error?.message ??
      (typeof error === 'string' ? error : JSON.stringify(error));
    logger.error(`❌ Error closing database connection: ${msg}`);
  }
};

export default db;