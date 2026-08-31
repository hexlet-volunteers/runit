import { cleanupStaleLoginAttempts } from '../db/auth';
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
 *
 * Type predicate, а не просто boolean: после `if (isLockedOut(attempt))`
 * компилятор сам знает, что attempt.lastFailedAt точно есть — вызывающему
 * коду (secondsUntilUnlock) не нужен приведение типа или ручная проверка.
 */
export function isLockedOut(
  attempt: LoginAttempt | undefined,
): attempt is LoginAttempt & { lastFailedAt: Date } {
  if (!attempt?.lastFailedAt) return false;
  if (attempt.failedCount < LOCKOUT_THRESHOLD) return false;

  return Date.now() - attempt.lastFailedAt.getTime() < LOCKOUT_DURATION_MS;
}

/** Сколько секунд осталось до снятия блокировки — для сообщения в ответе 429. */
export function secondsUntilUnlock(
  attempt: LoginAttempt & { lastFailedAt: Date },
): number {
  const elapsed = Date.now() - attempt.lastFailedAt.getTime();
  return Math.max(0, Math.ceil((LOCKOUT_DURATION_MS - elapsed) / 1000));
}

/**
 * Раз в CLEANUP_INTERVAL_MS удаляет записи login_attempts старше
 * LOGIN_ATTEMPT_RETENTION_MS (#858).
 *
 * Отдельный retention, а не LOCKOUT_DURATION_MS: окно блокировки — минуты, а
 * тут нужен запас на случай, если процесс не поднимался сутки (деплой,
 * инцидент) — иначе первая же уборка после простоя стирала бы ещё живые
 * блокировки. По умолчанию сутки — заведомо больше любой блокировки, но
 * ничего не хранит вечно.
 *
 * Простой setInterval внутри процесса, без внешнего планировщика: задача
 * дешёвая (один DELETE по индексу), а переживать перезапуск процесса ей не
 * нужно — если сервер перезапустился, следующий интервал просто наверстает.
 */
const CLEANUP_INTERVAL_MS = parsePositiveNumber(
  process.env.LOGIN_ATTEMPT_CLEANUP_INTERVAL_MS,
  60 * 60 * 1000,
);
const LOGIN_ATTEMPT_RETENTION_MS = parsePositiveNumber(
  process.env.LOGIN_ATTEMPT_RETENTION_MS,
  24 * 60 * 60 * 1000,
);

export function startLoginAttemptCleanup(
  onError: (error: unknown) => void,
): NodeJS.Timeout {
  const interval = setInterval(() => {
    cleanupStaleLoginAttempts(
      new Date(Date.now() - LOGIN_ATTEMPT_RETENTION_MS),
    ).catch(onError);
  }, CLEANUP_INTERVAL_MS);

  interval.unref();
  return interval;
}
