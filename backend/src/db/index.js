// backend/src/db/index.js
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema.js';
import { logger } from '../utils/logger.js';

// Get DATABASE_URL from environment
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  logger.error('❌ DATABASE_URL is not defined');
  throw new Error('DATABASE_URL is required');
}

logger.info(`🔗 Connecting to database...`);

// Create client with proper SSL settings for Supabase
const client = postgres(DATABASE_URL, {
  ssl: {
    rejectUnauthorized: false, // Required for Supabase
  },
  max: 10,
  idle_timeout: 30,
  connect_timeout: 60,
  onnotice: () => {}, // Suppress notices
});

// Create drizzle client
export const db = drizzle(client, { 
  schema,
  logger: process.env.NODE_ENV === 'development',
});

export { client };

// Test database connection
export const testConnection = async () => {
  try {
    const result = await client`SELECT 1 as connected`;
    if (result && result.length > 0) {
      logger.info('✅ Database connection successful');
      return true;
    }
    return false;
  } catch (error) {
    logger.error('❌ Database connection failed:', error.message);
    logger.error('📝 Please check your DATABASE_URL in .env file');
    throw error;
  }
};

// Close database connection
export const closeConnection = async () => {
  try {
    await client.end();
    logger.info('✅ Database connection closed');
  } catch (error) {
    logger.error('❌ Error closing database connection:', error.message);
  }
};

export default db;