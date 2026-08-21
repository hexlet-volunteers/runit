export declare const snippetRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../context").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    /**
     * Сниппет по id — путь редактора (/editor/:id).
     *
     * Постороннему по id доступен только публичный сниппет. Уровень 'link'
     * означает «открыт тому, кому автор дал ссылку», а id — это последовательное
     * число: пока здесь проверялся лишь 'private', сниппеты «по ссылке»
     * вычитывались перебором /editor/1, /editor/2, … то есть ссылка ничего не
     * защищала. Раздача по ссылке идёт через короткий код
     * (getSnippetByShortCode) — он не перебирается, и этот путь остаётся рабочим.
     */
    getSnippetById: import("@trpc/server").TRPCQueryProcedure<{
        input: unknown;
        output: {
            code: string;
            name: string;
            visibility: "private" | "link" | "public";
            id: number;
            createdAt: Date;
            updatedAt: Date;
            userId: number | null;
            language: string | null;
            slug: string | null;
            shortCode: string | null;
        };
        meta: object;
    }>;
    /**
     * Просмотр по паре username+slug. Приватные отсекает БД-слой, но владелец
     * должен открывать свой черновик по этому пути — иначе редактор ломается на
     * собственном приватном сниппете.
     */
    getSnippetByUsernameSlug: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            username: string;
            slug: string;
        };
        output: {
            code: string;
            name: string;
            visibility: "private" | "link" | "public";
            id: number;
            createdAt: Date;
            updatedAt: Date;
            userId: number | null;
            language: string | null;
            slug: string | null;
            shortCode: string | null;
        };
        meta: object;
    }>;
    /** Служебная выборка всех сниппетов, включая чужие приватные — только админам. */
    getAllSnippets: import("@trpc/server").TRPCQueryProcedure<{
        input: void;
        output: {
            code: string;
            name: string;
            visibility: "private" | "link" | "public";
            id: number;
            createdAt: Date;
            updatedAt: Date;
            userId: number | null;
            language: string | null;
            slug: string | null;
            shortCode: string | null;
        }[];
        meta: object;
    }>;
    /** Свои сниппеты для дашборда — включая приватные. */
    getMySnippets: import("@trpc/server").TRPCQueryProcedure<{
        input: void;
        output: {
            code: string;
            name: string;
            visibility: "private" | "link" | "public";
            id: number;
            createdAt: Date;
            updatedAt: Date;
            userId: number | null;
            language: string | null;
            slug: string | null;
            shortCode: string | null;
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
            code: string;
            name: string;
            visibility: "private" | "link" | "public";
            id: number;
            createdAt: Date;
            updatedAt: Date;
            userId: number | null;
            language: string | null;
            slug: string | null;
            shortCode: string | null;
        }[];
        meta: object;
    }>;
    /** Владелец берётся из сессии: создать сниппет от чужого имени нельзя. */
    createSnippet: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            name: string;
            code: string;
            language: "javascript" | "typescript" | "python" | "php" | "ruby" | "java" | "go" | "cpp" | "sql" | "bash" | "html" | "css";
            slug?: string | undefined;
            visibility?: "private" | "link" | "public" | undefined;
        };
        output: {
            code: string;
            name: string;
            visibility: "private" | "link" | "public";
            id: number;
            createdAt: Date;
            updatedAt: Date;
            userId: number | null;
            language: string | null;
            slug: string | null;
            shortCode: string | null;
        };
        meta: object;
    }>;
    updateSnippet: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            id: number;
            name?: string | undefined;
            code?: string | undefined;
            slug?: string | undefined;
            language?: "javascript" | "typescript" | "python" | "php" | "ruby" | "java" | "go" | "cpp" | "sql" | "bash" | "html" | "css" | undefined;
            visibility?: "private" | "link" | "public" | undefined;
        };
        output: {
            code: string;
            name: string;
            visibility: "private" | "link" | "public";
            id: number;
            createdAt: Date;
            updatedAt: Date;
            userId: number | null;
            language: string | null;
            slug: string | null;
            shortCode: string | null;
        };
        meta: object;
    }>;
    deleteSnippet: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            id: unknown;
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
            code: string;
            name: string;
            visibility: "private" | "link" | "public";
            id: number;
            createdAt: Date;
            updatedAt: Date;
            userId: number | null;
            language: string | null;
            slug: string | null;
            shortCode: string | null;
        } & {
            authorUsername: string | null;
        };
        meta: object;
    }>;
    /** Публикация и снятие публикации — только своего сниппета. */
    setVisibility: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            id: number;
            visibility: "private" | "link" | "public";
        };
        output: {
            code: string;
            name: string;
            visibility: "private" | "link" | "public";
            id: number;
            createdAt: Date;
            updatedAt: Date;
            userId: number | null;
            language: string | null;
            slug: string | null;
            shortCode: string | null;
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
