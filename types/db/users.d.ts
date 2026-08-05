import { z } from 'zod/v3';
import { snippets, type User, type UserSettings } from './schema/schema';
export declare const userSchema: z.ZodObject<{
    id: z.ZodNumber;
    username: z.ZodString;
    email: z.ZodString;
    password: z.ZodString;
    isAdmin: z.ZodDefault<z.ZodBoolean>;
    recoverHash: z.ZodNullable<z.ZodString>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    id: number;
    username: string;
    email: string;
    password: string;
    isAdmin: boolean;
    recoverHash: string | null;
    createdAt: Date;
    updatedAt: Date;
}, {
    id: number;
    username: string;
    email: string;
    password: string;
    recoverHash: string | null;
    createdAt: Date;
    updatedAt: Date;
    isAdmin?: boolean | undefined;
}>;
export declare const createUserSchema: z.ZodObject<{
    username: z.ZodString;
    email: z.ZodString;
    password: z.ZodString;
    isAdmin: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
    recoverHash: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    username: string;
    email: string;
    password: string;
    isAdmin?: boolean | undefined;
    recoverHash?: string | undefined;
}, {
    username: string;
    email: string;
    password: string;
    isAdmin?: boolean | undefined;
    recoverHash?: string | undefined;
}>;
export declare const updateUserSchema: z.ZodObject<{
    id: z.ZodNumber;
    username: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
    password: z.ZodOptional<z.ZodString>;
    recoverHash: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    id: number;
    username?: string | undefined;
    email?: string | undefined;
    password?: string | undefined;
    recoverHash?: string | undefined;
}, {
    id: number;
    username?: string | undefined;
    email?: string | undefined;
    password?: string | undefined;
    recoverHash?: string | undefined;
}>;
export declare const userSettingsSchema: z.ZodObject<{
    id: z.ZodNumber;
    userId: z.ZodNumber;
    theme: z.ZodDefault<z.ZodEnum<["system", "light", "dark"]>>;
    language: z.ZodDefault<z.ZodEnum<["ru", "en", "es", "fr", "de"]>>;
    avatarBase64: z.ZodNullable<z.ZodString>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    id: number;
    createdAt: Date;
    updatedAt: Date;
    userId: number;
    theme: "system" | "light" | "dark";
    language: "ru" | "en" | "es" | "fr" | "de";
    avatarBase64: string | null;
}, {
    id: number;
    createdAt: Date;
    updatedAt: Date;
    userId: number;
    avatarBase64: string | null;
    theme?: "system" | "light" | "dark" | undefined;
    language?: "ru" | "en" | "es" | "fr" | "de" | undefined;
}>;
export declare const createUserSettingsSchema: z.ZodObject<{
    userId: z.ZodNumber;
    theme: z.ZodOptional<z.ZodDefault<z.ZodEnum<["system", "light", "dark"]>>>;
    language: z.ZodOptional<z.ZodDefault<z.ZodEnum<["ru", "en", "es", "fr", "de"]>>>;
    avatarBase64: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    userId: number;
    theme?: "system" | "light" | "dark" | undefined;
    language?: "ru" | "en" | "es" | "fr" | "de" | undefined;
    avatarBase64?: string | null | undefined;
}, {
    userId: number;
    theme?: "system" | "light" | "dark" | undefined;
    language?: "ru" | "en" | "es" | "fr" | "de" | undefined;
    avatarBase64?: string | null | undefined;
}>;
export declare const updateUserSettingsSchema: z.ZodObject<{
    userId: z.ZodNumber;
    theme: z.ZodOptional<z.ZodEnum<["system", "light", "dark"]>>;
    language: z.ZodOptional<z.ZodEnum<["ru", "en", "es", "fr", "de"]>>;
    avatarBase64: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    userId: number;
    theme?: "system" | "light" | "dark" | undefined;
    language?: "ru" | "en" | "es" | "fr" | "de" | undefined;
    avatarBase64?: string | null | undefined;
}, {
    userId: number;
    theme?: "system" | "light" | "dark" | undefined;
    language?: "ru" | "en" | "es" | "fr" | "de" | undefined;
    avatarBase64?: string | null | undefined;
}>;
export declare const deleteUserSchema: z.ZodObject<{
    id: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    id: number;
}, {
    id: number;
}>;
export declare const getUserByIdSchema: z.ZodNumber;
export declare const getUserByEmailSchema: z.ZodString;
export declare const getUserByUsernameSchema: z.ZodString;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UpdateUserSettingsInput = z.infer<typeof updateUserSettingsSchema>;
export declare function getUserById(id: number): Promise<User | undefined>;
export declare function getUserByEmail(email: string): Promise<User | undefined>;
export declare function getUserByUsername(username: string): Promise<User | undefined>;
export declare function getAllUsers(): Promise<User[]>;
export declare function createUser(userData: CreateUserInput): Promise<User>;
export declare function updateUser(id: number, updates: Omit<UpdateUserInput, 'id'>): Promise<User | null>;
export declare function deleteUser(id: number): Promise<boolean>;
export declare function updateRecoverHash(email: string, recoverHash: string | null): Promise<boolean>;
export declare function getUserSettings(userId: number): Promise<UserSettings>;
export declare function updateUserSettings(id: number, updateData: Omit<UpdateUserSettingsInput, 'userId'>): Promise<UserSettings>;
export declare function getData({ id }: {
    id: number;
}): Promise<{
    currentUser: User & {
        language: string;
        theme: string;
        avatarBase64: string | null;
    };
    snippets: (typeof snippets.$inferSelect & {
        user: User;
    })[];
}>;
