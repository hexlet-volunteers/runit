export declare const snippetRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: object;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    getSnippetById: import("@trpc/server").TRPCQueryProcedure<{
        input: number;
        output: {
            id: number;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            userId: number | null;
            language: string | null;
            slug: string | null;
            code: string;
        };
        meta: object;
    }>;
    getSnippetByUsernameSlug: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            username: string;
            slug: string;
        };
        output: {
            id: number;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            userId: number | null;
            language: string | null;
            slug: string | null;
            code: string;
        };
        meta: object;
    }>;
    getAllSnippets: import("@trpc/server").TRPCQueryProcedure<{
        input: void;
        output: {
            id: number;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            userId: number | null;
            language: string | null;
            slug: string | null;
            code: string;
        }[];
        meta: object;
    }>;
    createSnippet: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            name: string;
            userId: number;
            language: "python" | "php" | "ruby" | "java" | "typescript" | "go" | "cpp" | "sql" | "bash" | "javascript" | "html" | "css";
            code: string;
            slug?: string | undefined;
        };
        output: {
            id: number;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            userId: number | null;
            language: string | null;
            slug: string | null;
            code: string;
        };
        meta: object;
    }>;
    updateSnippet: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            id: number;
            name?: string | undefined;
            userId?: number | undefined;
            language?: "python" | "php" | "ruby" | "java" | "typescript" | "go" | "cpp" | "sql" | "bash" | "javascript" | "html" | "css" | undefined;
            slug?: string | undefined;
            code?: string | undefined;
        };
        output: {
            id: number;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            userId: number | null;
            language: string | null;
            slug: string | null;
            code: string;
        };
        meta: object;
    }>;
    deleteSnippet: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            id: number;
        };
        output: {
            success: boolean;
            id: number;
        };
        meta: object;
    }>;
    generateSnippetName: import("@trpc/server").TRPCQueryProcedure<{
        input: void;
        output: {
            name: string;
        };
        meta: object;
    }>;
}>>;
