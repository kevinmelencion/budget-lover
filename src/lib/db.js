import 'dotenv/config';
import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not set in environment variables.');
}

const hasSslInUrl = connectionString.includes('ssl');
const requiresSsl = hasSslInUrl || process.env.NODE_ENV === 'production';

// Singleton instance to prevent creating redundant connections during development reload
const globalForDb = globalThis;

const sql =
  globalForDb.__db_sql ||
  postgres(connectionString, {
    ssl: requiresSsl ? 'require' : undefined,
  });

if (process.env.NODE_ENV !== 'production') {
  globalForDb.__db_sql = sql;
}

export default sql;
