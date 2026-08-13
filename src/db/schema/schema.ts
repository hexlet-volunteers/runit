/**
 * Схема на PostgreSQL (#895).
 *
 * Переезд с SQLite: боевой стенд — managed PostgreSQL, и держать два диалекта
 * в drizzle нельзя иначе как двумя копиями схемы, которые обязательно разойдутся.
 * Локально и в тестах поднимается тот же PostgreSQL (docker compose или
 * системный), поэтому расхождений «работало локально, упало в проде» не будет.
 *
 * Что изменилось по сравнению со sqlite-версией, помимо конструкторов таблиц:
 *  * времена — `timestamp with time zone` вместо целого числа секунд. В SQLite
 *    даты хранились как unixepoch, то есть с точностью до секунды и без зоны;
 *  * `varchar(n)` там, где раньше был `text` с декоративной длиной: в SQLite
 *    `text('x', { length: 20 })` не ограничивает ничего, это подсказка для
 *    читателя. В PostgreSQL ограничение настоящее, поэтому длины подобраны с
 *    запасом и совпадают с zod-схемами ввода;
 *  * `visibility` — enum на уровне БД: значений три, они перечислены в коде, и
 *    опечатка в миграции или ручной правке данных должна отвергаться базой.
 */

import { relations } from 'drizzle-orm';
import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';

/** Метки времени создания и изменения — одинаковые во всех таблицах. */
const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
};

/**
 * Кто может открыть сниппет:
 *  private — только владелец;
 *  link    — любой, у кого есть ссылка (в поиске и профиле не показывается);
 *  public  — виден всем, попадает в публичный профиль.
 */
export const visibilityEnum = pgEnum('visibility', [
  'private',
  'link',
  'public',
]);

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: varchar('username', { length: 20 }).notNull().unique(),
  email: varchar('email', { length: 254 }).notNull().unique(),
  // bcrypt-хеш всегда 60 символов; открытых паролей здесь не бывает.
  password: varchar('password', { length: 60 }).notNull(),
  isAdmin: boolean('is_admin').notNull().default(false),
  recoverHash: varchar('recover_hash', { length: 64 }),
  ...timestamps,
});

export const userSettings = pgTable('user_settings', {
  settingsId: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  theme: varchar('theme', { length: 20 }).notNull().default('system'),
  language: varchar('language', { length: 10 }).notNull().default('ru'),
  avatarBase64: text('avatar_base64'),
  ...timestamps,
});

export const snippets = pgTable('snippets', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 30 }).notNull(),
  slug: varchar('slug', { length: 30 }),
  code: text('code').notNull(),
  language: varchar('language', { length: 50 }),
  /**
   * Короткий код для публичной ссылки вида /s/aB3xK9 — им делятся и по нему
   * встраивают сниппет. Уникален глобально (в отличие от slug, который
   * уникален только внутри пользователя).
   */
  shortCode: varchar('short_code', { length: 16 }).unique(),
  visibility: visibilityEnum('visibility').notNull().default('private'),
  userId: integer('user_id').references(() => users.id, {
    onDelete: 'cascade',
  }),
  ...timestamps,
});

export const refreshTokens = pgTable('refresh_tokens', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  // sha256 в hex — 64 символа.
  tokenHash: varchar('token_hash', { length: 64 }).notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const passwordHistory = pgTable('password_history', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  passwordHash: varchar('password_hash', { length: 60 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const sections = pgTable('sections', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  content: text('content').notNull(),
  componentType: text('component_type').notNull(),
  ...timestamps,
});

export const usersRelations = relations(users, ({ many, one }) => ({
  snippets: many(snippets),
  settings: one(userSettings, {
    fields: [users.id],
    references: [userSettings.userId],
  }),
  refreshTokens: many(refreshTokens),
  passwordHistory: many(passwordHistory),
}));

export const snippetsRelations = relations(snippets, ({ one }) => ({
  user: one(users, {
    fields: [snippets.userId],
    references: [users.id],
  }),
}));

export const userSettingsRelations = relations(userSettings, ({ one }) => ({
  user: one(users, {
    fields: [userSettings.userId],
    references: [users.id],
  }),
}));

export const refreshTokensRelations = relations(refreshTokens, ({ one }) => ({
  user: one(users, {
    fields: [refreshTokens.userId],
    references: [users.id],
  }),
}));

export const passwordHistoryRelations = relations(
  passwordHistory,
  ({ one }) => ({
    user: one(users, {
      fields: [passwordHistory.userId],
      references: [users.id],
    }),
  }),
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type RefreshToken = typeof refreshTokens.$inferSelect;
export type NewRefreshToken = typeof refreshTokens.$inferInsert;
export type PasswordHistoryEntry = typeof passwordHistory.$inferSelect;
export type NewPasswordHistoryEntry = typeof passwordHistory.$inferInsert;
export type Snippet = typeof snippets.$inferSelect;
export type NewSnippet = typeof snippets.$inferInsert;
export type UserSettings = typeof userSettings.$inferSelect;
export type NewUserSettings = typeof userSettings.$inferInsert;
export type Section = typeof sections.$inferSelect;
export type NewSection = typeof sections.$inferInsert;
