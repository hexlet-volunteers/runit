import type { LoginAttempt } from '../db/schema/schema';
/**
 * Анти-брутфорс на вход (#858) — фиксированная блокировка, без роста задержки:
 * после LOCKOUT_THRESHOLD неудач подряд по одному email вход блокируется на
 * LOCKOUT_DURATION_MS. Значения читаются из окружения по тому же принципу, что
 * и RATE_LIMIT_* в security.ts — порог и длительность может понадобиться
 * поменять без деплоя кода (короче в тестах, длиннее при инциденте).
 */
export declare const LOCKOUT_THRESHOLD: number;
export declare const LOCKOUT_DURATION_MS: number;
/**
 * Блокировка не хранится в БД отдельным полем (locked_until), а вычисляется
 * из failedCount и lastFailedAt на каждый запрос — так порог и длительность
 * можно менять на лету, не трогая уже накопленные записи.
 */
export declare function isLockedOut(attempt: LoginAttempt | undefined): boolean;
/**
 * Сколько секунд осталось до снятия блокировки — для сообщения в ответе 429.
 * Вызывать только когда isLockedOut(attempt) уже вернул true — тогда
 * lastFailedAt точно есть.
 */
export declare function secondsUntilUnlock(attempt: LoginAttempt): number;
