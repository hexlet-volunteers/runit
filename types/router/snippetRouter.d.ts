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
            shortCode: string | null;
            visibility: string;
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
            shortCode: string | null;
            visibility: string;
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
            shortCode: string | null;
            visibility: string;
        }[];
        meta: object;
    }>;
    /**
     * Сниппеты пользователя для публичного профиля — без приватных.
     * Профиль обязан ходить сюда, а не в getAllSnippets: иначе посетитель
     * выкачивает все сниппеты сайта и видит чужие приватные.
     */
    getPublicSnippetsByUsername: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            username: string;
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
            shortCode: string | null;
            visibility: string;
        }[];
        meta: object;
    }>;
    createSnippet: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            name: string;
            userId: number;
            language: "javascript" | "typescript" | "python" | "php" | "ruby" | "java" | "go" | "cpp" | "sql" | "bash" | "html" | "css";
            code: string;
            slug?: string | undefined;
            visibility?: "link" | "private" | "public" | undefined;
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
            shortCode: string | null;
            visibility: string;
        };
        meta: object;
    }>;
    updateSnippet: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            id: number;
            name?: string | undefined;
            userId?: number | undefined;
            language?: "javascript" | "typescript" | "python" | "php" | "ruby" | "java" | "go" | "cpp" | "sql" | "bash" | "html" | "css" | undefined;
            slug?: string | undefined;
            code?: string | undefined;
            visibility?: "link" | "private" | "public" | undefined;
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
            shortCode: string | null;
            visibility: string;
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
    /** Сниппет по короткой ссылке /s/:code. Приватные не отдаются. */
    getSnippetByShortCode: import("@trpc/server").TRPCQueryProcedure<{
        input: string;
        output: {
            id: number;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            userId: number | null;
            language: string | null;
            slug: string | null;
            code: string;
            shortCode: string | null;
            visibility: string;
        } & {
            authorUsername: string | null;
        };
        meta: object;
    }>;
    /**
     * Публикация и снятие публикации.
     * TODO(#792): проверять, что текущий пользователь — владелец, как только
     * появится авторизация.
     */
    setVisibility: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            id: number;
            visibility: "link" | "private" | "public";
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
            shortCode: string | null;
            visibility: string;
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
