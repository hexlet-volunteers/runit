import { defineConfig } from 'drizzle-kit';

/**
 * Конфиг drizzle-kit. Строка подключения берётся из окружения — та же, что у
 * приложения (см. src/config/env.ts). Значение по умолчанию совпадает с
 * локальным PostgreSQL из docker-compose, чтобы `npm run db:generate` работал
 * без настройки.
 *
 * Дублировать здесь разбор окружения из config/env.ts нельзя: drizzle-kit
 * запускается отдельным процессом и падал бы на fail-fast проверках,
 * относящихся к приложению (например, на обязательности JWT-секретов в проде).
 */
export default defineConfig({
  schema: './src/db/schema/*',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url:
      process.env.DATABASE_URL ??
      'postgres://runit:runit@localhost:5432/runit',
  },
  verbose: true,
  strict: true,
  breakpoints: true,
});
