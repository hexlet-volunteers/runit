/**
 * Две проекции пользователя — по тому, кто смотрит (#793).
 *
 * `PublicUser` — «свои данные»: их получает сам пользователь (auth.me,
 * профиль в настройках) и админ. Здесь есть email, но никогда нет password
 * и recoverHash.
 *
 * `PublicProfile` — то, что видит любой посетитель на странице /@username.
 * Email в неё не входит: иначе перебором имён собирается таблица
 * «username → email», то есть база для рассылок и подбора паролей. Именно
 * это раньше отдавали users.getUserByUsername и users.getUserById.
 */
export interface PublicUser {
    id: number;
    username: string;
    email: string;
    isAdmin: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface PublicProfile {
    id: number;
    username: string;
    createdAt: Date;
}
/** Проецирует запись пользователя на безопасные поля — никогда не включает password/recoverHash. */
export declare function toPublicUser(user: PublicUser): PublicUser;
/** Проекция для чужих глаз: ни email, ни признака админа. */
export declare function toPublicProfile(user: PublicProfile): PublicProfile;
