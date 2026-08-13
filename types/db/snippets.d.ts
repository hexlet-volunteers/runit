import { z } from 'zod/v4';
import { type Snippet } from './schema/schema';
export declare const snippetSchema: z.ZodObject<{
    id: z.ZodNumber;
    name: z.ZodString;
    slug: z.ZodNullable<z.ZodString>;
    code: z.ZodString;
    language: z.ZodEnum<{
        javascript: "javascript";
        typescript: "typescript";
        python: "python";
        php: "php";
        ruby: "ruby";
        java: "java";
        go: "go";
        cpp: "cpp";
        sql: "sql";
        bash: "bash";
        html: "html";
        css: "css";
    }>;
    userId: z.ZodNumber;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, z.core.$strip>;
/** Уровни доступа к сниппету. */
export declare const VISIBILITIES: readonly ["private", "link", "public"];
export declare const visibilitySchema: z.ZodEnum<{
    link: "link";
    private: "private";
    public: "public";
}>;
export type Visibility = (typeof VISIBILITIES)[number];
export declare const getSnippetByShortCodeSchema: z.ZodString;
export declare const setVisibilitySchema: z.ZodObject<{
    id: z.ZodNumber;
    visibility: z.ZodEnum<{
        link: "link";
        private: "private";
        public: "public";
    }>;
}, z.core.$strip>;
export declare const createSnippetSchema: z.ZodObject<{
    name: z.ZodString;
    code: z.ZodString;
    slug: z.ZodOptional<z.ZodString>;
    language: z.ZodEnum<{
        javascript: "javascript";
        typescript: "typescript";
        python: "python";
        php: "php";
        ruby: "ruby";
        java: "java";
        go: "go";
        cpp: "cpp";
        sql: "sql";
        bash: "bash";
        html: "html";
        css: "css";
    }>;
    visibility: z.ZodOptional<z.ZodEnum<{
        link: "link";
        private: "private";
        public: "public";
    }>>;
}, z.core.$strip>;
export declare const updateSnippetSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    code: z.ZodOptional<z.ZodString>;
    slug: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    language: z.ZodOptional<z.ZodEnum<{
        javascript: "javascript";
        typescript: "typescript";
        python: "python";
        php: "php";
        ruby: "ruby";
        java: "java";
        go: "go";
        cpp: "cpp";
        sql: "sql";
        bash: "bash";
        html: "html";
        css: "css";
    }>>;
    visibility: z.ZodOptional<z.ZodOptional<z.ZodEnum<{
        link: "link";
        private: "private";
        public: "public";
    }>>>;
    id: z.ZodNumber;
}, z.core.$strip>;
export declare const getSnippetByIdSchema: z.ZodCoercedNumber<unknown>;
export declare const deleteSnippetSchema: z.ZodObject<{
    id: z.ZodCoercedNumber<unknown>;
}, z.core.$strip>;
export declare const getSnippetByUsernameSlugSchema: z.ZodObject<{
    username: z.ZodString;
    slug: z.ZodString;
}, z.core.$strip>;
export declare const getPublicSnippetsByUsernameSchema: z.ZodObject<{
    username: z.ZodString;
}, z.core.$strip>;
export type CreateSnippetInput = z.infer<typeof createSnippetSchema>;
export type UpdateSnippetInput = z.infer<typeof updateSnippetSchema>;
/**
 * userId нет в createSnippetSchema намеренно: владелец берётся из сессии
 * (ctx.user.id), а не из тела запроса. Пока поле принималось от клиента, любой
 * мог создать сниппет от имени чужого аккаунта (#792).
 */
export type CreateSnippetData = CreateSnippetInput & {
    userId: number;
};
/**
 * Сниппет по id — путь редактора, поэтому приватные здесь НЕ отсекаются:
 * владелец обязан открывать свой приватный сниппет.
 *
 * Владельца от постороннего отличает вызывающий: снаружи это
 * snippets.getSnippetById, где приватный сниппет отдаётся только владельцу или
 * админу (#792, #346). Внутри БД-слоя фильтра нет намеренно — иначе владелец
 * не сможет открыть свой черновик.
 */
export declare function getSnippetById(id: number): Promise<Snippet | undefined>;
/**
 * Сниппет по паре username+slug — старый путь просмотра (/s/:username/:slug).
 *
 * Приватные не отдаём. Без этой проверки отмена публичности не работала:
 * сниппет закрывали тумблером, а по ранее разосланной ссылке он продолжал
 * открываться, потому что видимость проверялась только в
 * getSnippetByShortCode.
 */
export declare function getSnippetByUsernameSlug(username: string, slug: string, viewerId?: number): Promise<Snippet | undefined>;
/**
 * Сниппеты пользователя для его публичного профиля: без приватных.
 *
 * Раньше страница профиля брала getAllSnippets и фильтровала по userId на
 * клиенте — то есть каждый посетитель выкачивал таблицу сниппетов всего сайта,
 * включая приватные чужие, и приватные показывались на публичном профиле.
 */
export declare function getPublicSnippetsByUsername(username: string): Promise<Snippet[]>;
/**
 * Все сниппеты в БД, включая приватные.
 *
 * Служебная выборка: снаружи доступна только админам
 * (snippets.getAllSnippets). Дашборд пользователя ходит в
 * getSnippetsByUserId, публичный профиль — в getPublicSnippetsByUsername.
 */
export declare function getAllSnippets(): Promise<Snippet[]>;
/** Свои сниппеты, включая приватные — выборка дашборда. */
export declare function getSnippetsByUserId(userId: number): Promise<Snippet[]>;
/**
 * Владелец сниппета — для проверки прав перед изменением. Отдельный запрос
 * вместо полного getSnippetById: проверке нужен только userId, а тащить код
 * сниппета ради неё незачем.
 */
export declare function getSnippetOwnerId(id: number): Promise<number | null | undefined>;
/** Сниппет по короткой ссылке. Приватные по коду не отдаём. */
export declare function getSnippetByShortCode(shortCode: string): Promise<(Snippet & {
    authorUsername: string | null;
}) | undefined>;
/** Смена уровня доступа. */
export declare function setSnippetVisibility(id: number, visibility: Visibility): Promise<Snippet>;
export declare function createSnippet(snippetData: CreateSnippetData): Promise<Snippet>;
export declare function updateSnippet(id: number, updates: Omit<UpdateSnippetInput, 'id' | 'userId'>): Promise<Snippet>;
/** См. deleteUser в db/users.ts — почему RETURNING, а не `changes`. */
export declare function deleteSnippet(id: number): Promise<boolean>;
export declare function generateName(): string;
