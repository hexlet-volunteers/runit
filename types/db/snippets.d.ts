import { z } from 'zod/v3';
import { type Snippet } from './schema/schema';
export declare const snippetSchema: z.ZodObject<{
    id: z.ZodNumber;
    name: z.ZodString;
    slug: z.ZodNullable<z.ZodString>;
    code: z.ZodString;
    language: z.ZodEnum<["javascript", "typescript", "python", "php", "ruby", "java", "go", "cpp", "sql", "bash", "html", "css"]>;
    userId: z.ZodNumber;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    id: number;
    name: string;
    createdAt: Date;
    updatedAt: Date;
    userId: number;
    language: "javascript" | "typescript" | "python" | "php" | "ruby" | "java" | "go" | "cpp" | "sql" | "bash" | "html" | "css";
    slug: string | null;
    code: string;
}, {
    id: number;
    name: string;
    createdAt: Date;
    updatedAt: Date;
    userId: number;
    language: "javascript" | "typescript" | "python" | "php" | "ruby" | "java" | "go" | "cpp" | "sql" | "bash" | "html" | "css";
    slug: string | null;
    code: string;
}>;
/** Уровни доступа к сниппету. */
export declare const VISIBILITIES: readonly ["private", "link", "public"];
export declare const visibilitySchema: z.ZodEnum<["private", "link", "public"]>;
export type Visibility = (typeof VISIBILITIES)[number];
export declare const getSnippetByShortCodeSchema: z.ZodString;
export declare const setVisibilitySchema: z.ZodObject<{
    id: z.ZodNumber;
    visibility: z.ZodEnum<["private", "link", "public"]>;
}, "strip", z.ZodTypeAny, {
    id: number;
    visibility: "link" | "private" | "public";
}, {
    id: number;
    visibility: "link" | "private" | "public";
}>;
export declare const createSnippetSchema: z.ZodObject<{
    name: z.ZodString;
    code: z.ZodString;
    slug: z.ZodOptional<z.ZodString>;
    language: z.ZodEnum<["javascript", "typescript", "python", "php", "ruby", "java", "go", "cpp", "sql", "bash", "html", "css"]>;
    userId: z.ZodNumber;
    visibility: z.ZodOptional<z.ZodEnum<["private", "link", "public"]>>;
}, "strip", z.ZodTypeAny, {
    name: string;
    userId: number;
    language: "javascript" | "typescript" | "python" | "php" | "ruby" | "java" | "go" | "cpp" | "sql" | "bash" | "html" | "css";
    code: string;
    slug?: string | undefined;
    visibility?: "link" | "private" | "public" | undefined;
}, {
    name: string;
    userId: number;
    language: "javascript" | "typescript" | "python" | "php" | "ruby" | "java" | "go" | "cpp" | "sql" | "bash" | "html" | "css";
    code: string;
    slug?: string | undefined;
    visibility?: "link" | "private" | "public" | undefined;
}>;
export declare const updateSnippetSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    code: z.ZodOptional<z.ZodString>;
    slug: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    language: z.ZodOptional<z.ZodEnum<["javascript", "typescript", "python", "php", "ruby", "java", "go", "cpp", "sql", "bash", "html", "css"]>>;
    userId: z.ZodOptional<z.ZodNumber>;
    visibility: z.ZodOptional<z.ZodOptional<z.ZodEnum<["private", "link", "public"]>>>;
} & {
    id: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    id: number;
    name?: string | undefined;
    userId?: number | undefined;
    language?: "javascript" | "typescript" | "python" | "php" | "ruby" | "java" | "go" | "cpp" | "sql" | "bash" | "html" | "css" | undefined;
    slug?: string | undefined;
    code?: string | undefined;
    visibility?: "link" | "private" | "public" | undefined;
}, {
    id: number;
    name?: string | undefined;
    userId?: number | undefined;
    language?: "javascript" | "typescript" | "python" | "php" | "ruby" | "java" | "go" | "cpp" | "sql" | "bash" | "html" | "css" | undefined;
    slug?: string | undefined;
    code?: string | undefined;
    visibility?: "link" | "private" | "public" | undefined;
}>;
export declare const getSnippetByIdSchema: z.ZodNumber;
export declare const deleteSnippetSchema: z.ZodObject<{
    id: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    id: number;
}, {
    id: number;
}>;
export declare const getSnippetByUsernameSlugSchema: z.ZodObject<{
    username: z.ZodString;
    slug: z.ZodString;
}, "strip", z.ZodTypeAny, {
    username: string;
    slug: string;
}, {
    username: string;
    slug: string;
}>;
export type CreateSnippetInput = z.infer<typeof createSnippetSchema>;
export type UpdateSnippetInput = z.infer<typeof updateSnippetSchema>;
export declare function getSnippetById(id: number): Promise<Snippet | undefined>;
export declare function getSnippetByUsernameSlug(username: string, slug: string): Promise<Snippet | undefined>;
export declare function getAllSnippets(): Promise<Snippet[]>;
/** Сниппет по короткой ссылке. Приватные по коду не отдаём. */
export declare function getSnippetByShortCode(shortCode: string): Promise<(Snippet & {
    authorUsername: string | null;
}) | undefined>;
/** Смена уровня доступа. */
export declare function setSnippetVisibility(id: number, visibility: Visibility): Promise<Snippet>;
export declare function createSnippet(snippetData: CreateSnippetInput): Promise<Snippet>;
export declare function updateSnippet(id: number, updates: Omit<UpdateSnippetInput, 'id' | 'userId'>): Promise<Snippet>;
export declare function deleteSnippet(id: number): Promise<boolean>;
export declare function generateName(): string;
export declare function deleteAllSnippets(): Promise<number>;
