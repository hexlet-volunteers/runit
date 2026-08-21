import type { LoginAttempt } from '../db/schema/schema';
import { parsePositiveNumber } from '../utils/parse-positive-number';

/**
 * Анти-брутфорс на вход (#858) — фиксированная блокировка, без роста задержки:
 * после LOCKOUT_THRESHOLD неудач подряд по одному email вход блокируется на
 * LOCKOUT_DURATION_MS. Значения читаются из окружения по тому же принципу, что
 * и RATE_LIMIT_* в security.ts — порог и длительность может понадобиться
 * поменять без деплоя кода (короче в тестах, длиннее при инциденте).
 */
export const LOCKOUT_THRESHOLD = parsePositiveNumber(
  process.env.LOGIN_LOCKOUT_THRESHOLD,
  5,
);
export const LOCKOUT_DURATION_MS = parsePositiveNumber(
  process.env.LOGIN_LOCKOUT_DURATION_MS,
  60_000,
);

/**
 * Блокировка не хранится в БД отдельным полем (locked_until), а вычисляется
 * из failedCount и lastFailedAt на каждый запрос — так порог и длительность
 * можно менять на лету, не трогая уже накопленные записи.
 */
export function isLockedOut(attempt: LoginAttempt | undefined): boolean {
  if (!attempt?.lastFailedAt) return false;
  if (attempt.failedCount < LOCKOUT_THRESHOLD) return false;

  return Date.now() - attempt.lastFailedAt.getTime() < LOCKOUT_DURATION_MS;
}

/**
 * Сколько секунд осталось до снятия блокировки — для сообщения в ответе 429.
 * Вызывать только когда isLockedOut(attempt) уже вернул true — тогда
 * lastFailedAt точно есть.
 */
export function secondsUntilUnlock(attempt: LoginAttempt): number {
  const elapsed = Date.now() - (attempt.lastFailedAt?.getTime() ?? Date.now());
  return Math.max(0, Math.ceil((LOCKOUT_DURATION_MS - elapsed) / 1000));
}
