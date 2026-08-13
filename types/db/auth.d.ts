import { type User } from './schema/schema';
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
