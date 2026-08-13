import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { env } from '../config/env';
import * as schema from './schema/schema';

/**
 * Подключение к PostgreSQL (#895).
 *
 * Драйвер postgres-js, а не node-postgres: чистый JS без нативной сборки.
 * Прежний better-sqlite3 требовал в образе python3, make и g++ — тулчейн
 * тянулся ради одного модуля и заметно удлинял сборку.
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Пул соединений. Лимит задаётся переменной: у managed-PostgreSQL есть свой
 * предел числа соединений, и несколько инстансов приложения обязаны делить его,
 * а не выбирать по 10 каждый.
 */
const client = postgres(env.DATABASE_URL, {
  max: env.DATABASE_POOL_MAX,
  // Приложение само сообщает об ошибках (см. monitoring.ts), драйверу
  // логировать нечего.
  onnotice: () => {},
});

export const db = drizzle(client, { schema });

export const runMigrations = async () => {
  try {
    const migrationsPath = path.join(__dirname, '../../drizzle');
    await migrate(db, { migrationsFolder: migrationsPath });
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
};

/**
 * Закрытие пула при остановке процесса.
 *
 * Раньше на SIGTERM процесс просто выходил: файловая БД от этого не страдала.
 * У PostgreSQL брошенное соединение висит на сервере до таймаута, и при
 * частых перезапусках (деплой, автоскейлинг) инстансы съедают лимит
 * соединений. `{ timeout: 5 }` даёт незавершённым запросам договорить.
 */
let closing = false;

const closeAndExit = async (code: number) => {
  if (closing) return;
  closing = true;
  try {
    await client.end({ timeout: 5 });
  } catch (error) {
    console.error('Ошибка при закрытии соединений с БД:', error);
  }
  process.exit(code);
};

process.on('SIGHUP', () => void closeAndExit(128 + 1));
process.on('SIGINT', () => void closeAndExit(128 + 2));
process.on('SIGTERM', () => void closeAndExit(128 + 15));

/** Явное закрытие — нужно тестам, чтобы процесс не держал соединения. */
export const closeDbConnection = () => client.end({ timeout: 5 });
