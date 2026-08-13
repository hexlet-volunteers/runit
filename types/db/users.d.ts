import { z } from 'zod/v4';
import { snippets, type UserSettings } from './schema/schema';
export type SafeUser = {
    id: number;
    username: string;
    email: string;
    isAdmin: boolean;
    createdAt: Date;
    updatedAt: Date;
};
export declare const userSchema: z.ZodObject<{
    id: z.ZodNumber;
    username: z.ZodString;
    email: z.ZodPipe<z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>, z.ZodString>;
    password: z.ZodString;
    isAdmin: z.ZodDefault<z.ZodBoolean>;
    recoverHash: z.ZodNullable<z.ZodString>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, z.core.$strip>;
export declare const createUserSchema: z.ZodObject<{
    username: z.ZodString;
    email: z.ZodPipe<z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>, z.ZodString>;
    password: z.ZodString;
    isAdmin: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
    recoverHash: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
/**
 * Обновление профиля. Ни password, ни recoverHash здесь нет намеренно:
 *  - пароль меняется только через auth.changePassword — там проверяется текущий
 *    пароль, политика и повторное использование, и результат хешируется. Пока
 *    поле было в этой схеме, любое обновление профиля могло записать пароль
 *    в открытом виде (#791);
 *  - recoverHash — внутреннее поле восстановления доступа, клиент не должен
 *    иметь возможности задать его сам (иначе выпишет себе токен сброса).
 *
 * isAdmin тоже исключён — роль меняется только через admin-only setUserRole.
 */
export declare const updateUserSchema: z.ZodObject<{
    id: z.ZodNumber;
    username: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodPipe<z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>, z.ZodString>>;
}, z.core.$strip>;
export declare const userSettingsSchema: z.ZodObject<{
    id: z.ZodNumber;
    userId: z.ZodNumber;
    theme: z.ZodDefault<z.ZodEnum<{
        system: "system";
        light: "light";
        dark: "dark";
    }>>;
    language: z.ZodDefault<z.ZodEnum<{
        ru: "ru";
        en: "en";
        es: "es";
        fr: "fr";
        de: "de";
    }>>;
    avatarBase64: z.ZodNullable<z.ZodString>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, z.core.$strip>;
export declare const createUserSettingsSchema: z.ZodObject<{
    userId: z.ZodNumber;
    theme: z.ZodOptional<z.ZodDefault<z.ZodEnum<{
        system: "system";
        light: "light";
        dark: "dark";
    }>>>;
    language: z.ZodOptional<z.ZodDefault<z.ZodEnum<{
        ru: "ru";
        en: "en";
        es: "es";
        fr: "fr";
        de: "de";
    }>>>;
    avatarBase64: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, z.core.$strip>;
export declare const updateUserSettingsSchema: z.ZodObject<{
    userId: z.ZodNumber;
    theme: z.ZodOptional<z.ZodEnum<{
        system: "system";
        light: "light";
        dark: "dark";
    }>>;
    language: z.ZodOptional<z.ZodEnum<{
        ru: "ru";
        en: "en";
        es: "es";
        fr: "fr";
        de: "de";
    }>>;
    avatarBase64: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, z.core.$strip>;
export declare const deleteUserSchema: z.ZodObject<{
    id: z.ZodCoercedNumber<unknown>;
}, z.core.$strip>;
export declare const setUserRoleSchema: z.ZodObject<{
    id: z.ZodNumber;
    isAdmin: z.ZodBoolean;
}, z.core.$strip>;
export declare const getUserByIdSchema: z.ZodNumber;
export declare const getUserByEmailSchema: z.ZodPipe<z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>, z.ZodString>;
export declare const getUserByUsernameSchema: z.ZodString;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UpdateUserSettingsInput = z.infer<typeof updateUserSettingsSchema>;
export declare function getUserById(id: number): Promise<SafeUser | undefined>;
export declare function getUserByEmail(email: string): Promise<SafeUser | undefined>;
export declare function getUserByUsername(username: string): Promise<SafeUser | undefined>;
export declare function getAllUsers(): Promise<SafeUser[]>;
/**
 * Данные для создания пользователя. Версия согласия приходит отдельно от
 * пользовательского ввода: её проверяет и подставляет auth.register (#866),
 * а не клиент.
 */
export type CreateUserData = CreateUserInput & {
    consentVersion?: string;
};
export declare function createUser(userData: CreateUserData): Promise<SafeUser>;
export declare function updateUser(id: number, updates: Omit<UpdateUserInput, 'id'>): Promise<SafeUser | null>;
/**
 * Записывает уже готовый bcrypt-хеш. Отделено от updateUser сознательно:
 * там принимаются данные прямо из ввода клиента, здесь — значение, которое
 * обязано быть посчитано hashPassword(). Единственный вызывающий —
 * auth.changePassword.
 */
export declare function updateUserPasswordHash(id: number, passwordHash: string): Promise<void>;
export declare function setUserRole(id: number, isAdmin: boolean): Promise<SafeUser | null>;
/**
 * Признак «что-то действительно изменилось» получаем через RETURNING, а не из
 * метаданных результата: поле `changes` было особенностью better-sqlite3, в
 * postgres-js его нет. Без RETURNING проверка `changes > 0` читалась бы как
 * `undefined > 0`, то есть всегда false — удаление существующего пользователя
 * отвечало бы «не найден».
 */
export declare function deleteUser(id: number): Promise<boolean>;
export declare function updateRecoverHash(email: string, recoverHash: string | null): Promise<boolean>;
export declare function getUserSettings(userId: number): Promise<UserSettings>;
export declare function updateUserSettings(id: number, updateData: Omit<UpdateUserSettingsInput, 'userId'>): Promise<UserSettings>;
export declare function getData({ id }: {
    id: number;
}): Promise<{
    currentUser: SafeUser & {
        language: string;
        theme: string;
        avatarBase64: string | null;
    };
    snippets: (typeof snippets.$inferSelect & {
        user: SafeUser;
    })[];
}>;
