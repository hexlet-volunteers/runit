import { createHash } from 'node:crypto';
import { and, desc, eq, gt, isNull, sql } from 'drizzle-orm';
import { db } from './connection';
import {
  type LoginAttempt,
  loginAttempts,
  type NewPasswordHistoryEntry,
  type NewRefreshToken,
  passwordHistory,
  refreshTokens,
  type User,
  users,
} from './schema/schema';

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/**
 * Возвращает полную запись пользователя, включая password-хеш — только для
 * внутренних auth-проверок (verifyPassword и т.п.). Никогда не отдавать
 * результат напрямую в tRPC-ответе.
 */
export async function getUserByEmailWithCredentials(
  email: string,
): Promise<User | undefined> {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  return user;
}

/**
 * См. getUserByEmailWithCredentials — та же оговорка про password-хеш.
 */
export async function getUserByIdWithCredentials(
  id: number,
): Promise<User | undefined> {
  const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);

  return user;
}

export async function storeRefreshToken(
  userId: number,
  token: string,
  expiresAt: Date,
): Promise<void> {
  const newRefreshToken: NewRefreshToken = {
    userId,
    tokenHash: hashToken(token),
    expiresAt,
  };

  await db.insert(refreshTokens).values(newRefreshToken);
}

export async function findActiveRefreshToken(token: string) {
  const tokenHash = hashToken(token);

  const [record] = await db
    .select()
    .from(refreshTokens)
    .where(
      and(
        eq(refreshTokens.tokenHash, tokenHash),
        isNull(refreshTokens.revokedAt),
        gt(refreshTokens.expiresAt, new Date()),
      ),
    )
    .limit(1);

  return record;
}

export async function revokeRefreshToken(token: string): Promise<void> {
  await db
    .update(refreshTokens)
    .set({ revokedAt: new Date() })
    .where(eq(refreshTokens.tokenHash, hashToken(token)));
}

/**
 * Гасит все живые refresh-токены пользователя — то есть выкидывает его со всех
 * устройств. Нужно при смене пароля: смысл смены в том, что тот, кто знал
 * старый пароль, доступ теряет, а без этого его сессия живёт ещё 30 дней.
 */
export async function revokeAllRefreshTokensForUser(
  userId: number,
): Promise<void> {
  await db
    .update(refreshTokens)
    .set({ revokedAt: new Date() })
    .where(
      and(eq(refreshTokens.userId, userId), isNull(refreshTokens.revokedAt)),
    );
}

export async function getRecentPasswordHashes(
  userId: number,
  limit: number,
): Promise<string[]> {
  const rows = await db
    .select({ passwordHash: passwordHistory.passwordHash })
    .from(passwordHistory)
    .where(eq(passwordHistory.userId, userId))
    .orderBy(desc(passwordHistory.createdAt))
    .limit(limit);

  return rows.map((row) => row.passwordHash);
}

export async function addPasswordHistoryEntry(
  userId: number,
  passwordHashValue: string,
): Promise<void> {
  const entry: NewPasswordHistoryEntry = {
    userId,
    passwordHash: passwordHashValue,
  };

  await db.insert(passwordHistory).values(entry);
}

/**
 * Счётчик неудачных попыток входа (#858) — ключ по email, а не userId: попытки
 * на несуществующий email тоже нужно считать, иначе перебор email остаётся без
 * лимита. Порог и длительность блокировки решает вызывающий код — здесь только
 * чтение и запись счётчика.
 *
 * Email приходит уже нормализованным через emailSchema (trim + toLowerCase,
 * см. src/auth/email.ts) — повторной нормализации здесь нет намеренно, чтобы
 * не дублировать её в двух местах и не разойтись с схемой ввода.
 *
 * TODO: сейчас этот инвариант держится только на этом комментарии — тип
 * параметра email всюду ниже просто string, и ничто не мешает передать сюда
 * сырую строку в обход emailSchema. Ужесточить до branded type:
 *   export type NormalizedEmail = string & { readonly __brand: 'NormalizedEmail' };
 * в src/auth/email.ts, привести normalizeEmail к сигнатуре
 * (email: string) => NormalizedEmail и поменять email: string на
 * email: NormalizedEmail в сигнатурах recordFailedLoginAttempt,
 * resetLoginAttempts и getLoginAttempt ниже — тогда emailSchema возвращает
 * NormalizedEmail, и передать сюда непрошедшую нормализацию строку не даст
 * уже компилятор, а не только память того, кто вызывает эти функции.
 */
export async function recordFailedLoginAttempt(email: string): Promise<void> {
  await db
    .insert(loginAttempts)
    .values({ email, failedCount: 1, lastFailedAt: new Date() })
    .onConflictDoUpdate({
      target: loginAttempts.email,
      set: {
        failedCount: sql`${loginAttempts.failedCount} + 1`,
        lastFailedAt: new Date(),
      },
    });
}

export async function resetLoginAttempts(email: string): Promise<void> {
  await db.delete(loginAttempts).where(eq(loginAttempts.email, email));
}

export async function getLoginAttempt(
  email: string,
): Promise<LoginAttempt | undefined> {
  const [record] = await db
    .select()
    .from(loginAttempts)
    .where(eq(loginAttempts.email, email))
    .limit(1);

  return record;
}
