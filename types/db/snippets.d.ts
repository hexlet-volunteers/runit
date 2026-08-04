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
    language: "python" | "php" | "ruby" | "java" | "typescript" | "go" | "cpp" | "sql" | "bash" | "javascript" | "html" | "css";
    slug: string | null;
    code: string;
}, {
    id: number;
    name: string;
    createdAt: Date;
    updatedAt: Date;
    userId: number;
    language: "python" | "php" | "ruby" | "java" | "typescript" | "go" | "cpp" | "sql" | "bash" | "javascript" | "html" | "css";
    slug: string | null;
    code: string;
}>;
export declare const createSnippetSchema: z.ZodObject<{
    name: z.ZodString;
    code: z.ZodString;
    slug: z.ZodOptional<z.ZodString>;
    language: z.ZodEnum<["javascript", "typescript", "python", "php", "ruby", "java", "go", "cpp", "sql", "bash", "html", "css"]>;
    userId: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    name: string;
    userId: number;
    language: "python" | "php" | "ruby" | "java" | "typescript" | "go" | "cpp" | "sql" | "bash" | "javascript" | "html" | "css";
    code: string;
    slug?: string | undefined;
}, {
    name: string;
    userId: number;
    language: "python" | "php" | "ruby" | "java" | "typescript" | "go" | "cpp" | "sql" | "bash" | "javascript" | "html" | "css";
    code: string;
    slug?: string | undefined;
}>;
export declare const updateSnippetSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    code: z.ZodOptional<z.ZodString>;
    slug: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    language: z.ZodOptional<z.ZodEnum<["javascript", "typescript", "python", "php", "ruby", "java", "go", "cpp", "sql", "bash", "html", "css"]>>;
    userId: z.ZodOptional<z.ZodNumber>;
} & {
    id: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    id: number;
    name?: string | undefined;
    userId?: number | undefined;
    language?: "python" | "php" | "ruby" | "java" | "typescript" | "go" | "cpp" | "sql" | "bash" | "javascript" | "html" | "css" | undefined;
    slug?: string | undefined;
    code?: string | undefined;
}, {
    id: number;
    name?: string | undefined;
    userId?: number | undefined;
    language?: "python" | "php" | "ruby" | "java" | "typescript" | "go" | "cpp" | "sql" | "bash" | "javascript" | "html" | "css" | undefined;
    slug?: string | undefined;
    code?: string | undefined;
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
export declare function createSnippet(snippetData: CreateSnippetInput): Promise<Snippet>;
export declare function updateSnippet(id: number, updates: Omit<UpdateSnippetInput, 'id' | 'userId'>): Promise<Snippet>;
export declare function deleteSnippet(id: number): Promise<boolean>;
export declare function generateName(): string;
export declare function deleteAllSnippets(): Promise<number>;
