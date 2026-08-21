import { type LoginAttempt, type User } from './schema/schema';
export declare function hashToken(token: string): string;
/**
 * Возвращает полную запись пользователя, включая password-хеш — только для
 * внутренних auth-проверок (verifyPassword и т.п.). Никогда не отдавать
 * результат напрямую в tRPC-ответе.
 */
export declare function getUserByEmailWithCredentials(email: string): Promise<User | undefined>;
/**
 * См. getUserByEmailWithCredentials — та же оговорка про password-хеш.
 */
export declare function getUserByIdWithCredentials(id: number): Promise<User | undefined>;
export declare function storeRefreshToken(userId: number, token: string, expiresAt: Date): Promise<void>;
export declare function findActiveRefreshToken(token: string): Promise<{
    id: number;
    userId: number;
    tokenHash: string;
    expiresAt: Date;
    revokedAt: Date | null;
    createdAt: Date;
}>;
export declare function revokeRefreshToken(token: string): Promise<void>;
/**
 * Гасит все живые refresh-токены пользователя — то есть выкидывает его со всех
 * устройств. Нужно при смене пароля: смысл смены в том, что тот, кто знал
 * старый пароль, доступ теряет, а без этого его сессия живёт ещё 30 дней.
 */
export declare function revokeAllRefreshTokensForUser(userId: number): Promise<void>;
export declare function getRecentPasswordHashes(userId: number, limit: number): Promise<string[]>;
export declare function addPasswordHistoryEntry(userId: number, passwordHashValue: string): Promise<void>;
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
export declare function recordFailedLoginAttempt(email: string): Promise<void>;
export declare function resetLoginAttempts(email: string): Promise<void>;
export declare function getLoginAttempt(email: string): Promise<LoginAttempt | undefined>;
