import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import path from 'path';
import { fileURLToPath } from 'url';
import * as schema from './schema/schema';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = process.env.DB_PATH || 'database.sqlite';
const sqlite = new Database(dbPath);

// Включение WAL режима для лучшей производительности
// sqlite.pragma('journal_mode = WAL');

export const db = drizzle(sqlite, { schema });

export const runMigrations = async () => {
  try {
    const migrationsPath = path.join(__dirname, '../../drizzle');
    await migrate(db, { migrationsFolder: migrationsPath });
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
};

process.on('exit', () => sqlite.close());
process.on('SIGHUP', () => process.exit(128 + 1));
process.on('SIGINT', () => process.exit(128 + 2));
process.on('SIGTERM', () => process.exit(128 + 15));


