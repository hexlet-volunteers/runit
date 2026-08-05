export declare const appRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: object;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    users: import("@trpc/server").TRPCBuiltRouter<{
        ctx: object;
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
    }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
        getUserById: import("@trpc/server").TRPCQueryProcedure<{
            input: number;
            output: {
                id: number;
                username: string;
                email: string;
                password: string;
                isAdmin: boolean;
                recoverHash: string | null;
                createdAt: Date;
                updatedAt: Date;
            };
            meta: object;
        }>;
        getUserByEmail: import("@trpc/server").TRPCQueryProcedure<{
            input: string;
            output: {
                id: number;
                username: string;
                email: string;
                password: string;
                isAdmin: boolean;
                recoverHash: string | null;
                createdAt: Date;
                updatedAt: Date;
            };
            meta: object;
        }>;
        getUserByUsername: import("@trpc/server").TRPCQueryProcedure<{
            input: string;
            output: {
                id: number;
                username: string;
                email: string;
                password: string;
                isAdmin: boolean;
                recoverHash: string | null;
                createdAt: Date;
                updatedAt: Date;
            };
            meta: object;
        }>;
        getAllUsers: import("@trpc/server").TRPCQueryProcedure<{
            input: void;
            output: {
                id: number;
                username: string;
                email: string;
                password: string;
                isAdmin: boolean;
                recoverHash: string | null;
                createdAt: Date;
                updatedAt: Date;
            }[];
            meta: object;
        }>;
        createUser: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                username: string;
                email: string;
                password: string;
                isAdmin?: boolean | undefined;
                recoverHash?: string | undefined;
            };
            output: {
                id: number;
                username: string;
                email: string;
                password: string;
                isAdmin: boolean;
                recoverHash: string | null;
                createdAt: Date;
                updatedAt: Date;
            };
            meta: object;
        }>;
        updateUser: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                id: number;
                username?: string | undefined;
                email?: string | undefined;
                password?: string | undefined;
                recoverHash?: string | undefined;
            };
            output: {
                id: number;
                username: string;
                email: string;
                password: string;
                isAdmin: boolean;
                recoverHash: string | null;
                createdAt: Date;
                updatedAt: Date;
            } | null;
            meta: object;
        }>;
        deleteUser: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                id: unknown;
            };
            output: {
                success: boolean;
                id: {
                    id: number;
                };
            };
            meta: object;
        }>;
        getUserSettings: import("@trpc/server").TRPCQueryProcedure<{
            input: number;
            output: {
                createdAt: Date;
                updatedAt: Date;
                settingsId: number;
                userId: number;
                theme: string;
                language: string;
                avatarBase64: string | null;
            };
            meta: object;
        }>;
        updateUserSettings: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                userId: number;
                theme?: "system" | "light" | "dark" | undefined;
                language?: "ru" | "en" | "es" | "fr" | "de" | undefined;
                avatarBase64?: string | null | undefined;
            };
            output: {
                createdAt: Date;
                updatedAt: Date;
                settingsId: number;
                userId: number;
                theme: string;
                language: string;
                avatarBase64: string | null;
            };
            meta: object;
        }>;
        getData: import("@trpc/server").TRPCQueryProcedure<{
            input: number;
            output: {
                currentUser: import("../db/schema/schema").User & {
                    language: string;
                    theme: string;
                    avatarBase64: string | null;
                };
                snippets: ({
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
                    user: import("../db/schema/schema").User;
                })[];
            };
            meta: object;
        }>;
    }>>;
    snippets: import("@trpc/server").TRPCBuiltRouter<{
        ctx: object;
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
    }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
        getSnippetById: import("@trpc/server").TRPCQueryProcedure<{
            input: unknown;
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
                code: string;
                language: "javascript" | "typescript" | "python" | "php" | "ruby" | "java" | "go" | "cpp" | "sql" | "bash" | "html" | "css";
                userId: number;
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
                code?: string | undefined;
                slug?: string | undefined;
                language?: "javascript" | "typescript" | "python" | "php" | "ruby" | "java" | "go" | "cpp" | "sql" | "bash" | "html" | "css" | undefined;
                userId?: number | undefined;
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
                id: unknown;
            };
            output: {
                success: boolean;
                id: number;
            };
            meta: object;
        }>;
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
    homePage: import("@trpc/server").TRPCBuiltRouter<{
        ctx: object;
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
    }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
        getHomePageData: import("@trpc/server").TRPCQueryProcedure<{
            input: void;
            output: {
                components: {
                    id: number;
                    title: string;
                    description: string;
                    content: string;
                    componentType: string;
                    createdAt?: Date | undefined;
                    updatedAt?: Date | undefined;
                }[];
            };
            meta: object;
        }>;
        getComponentById: import("@trpc/server").TRPCQueryProcedure<{
            input: number;
            output: {
                id: number;
                title: string;
                description: string;
                content: string;
                componentType: string;
                createdAt?: Date | undefined;
                updatedAt?: Date | undefined;
            };
            meta: object;
        }>;
        adminCreateComponent: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                title: string;
                description: string;
                content: string;
                componentType: string;
            };
            output: {
                id: number;
                title: string;
                description: string;
                content: string;
                componentType: string;
                createdAt?: Date | undefined;
                updatedAt?: Date | undefined;
            };
            meta: object;
        }>;
        adminUpdateComponent: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                id: number;
                title?: string | undefined;
                description?: string | undefined;
                content?: string | undefined;
                componentType?: string | undefined;
            };
            output: {
                id: number;
                title: string;
                description: string;
                content: string;
                componentType: string;
                createdAt?: Date | undefined;
                updatedAt?: Date | undefined;
            };
            meta: object;
        }>;
    }>>;
    runner: import("@trpc/server").TRPCBuiltRouter<{
        ctx: object;
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
    }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
        run: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                language: "typescript" | "python" | "php" | "ruby" | "java" | "go" | "cpp" | "sql" | "bash";
                code: string;
                stdin?: string | undefined;
            };
            output: import("../runner").RunOutput;
            meta: object;
        }>;
        status: import("@trpc/server").TRPCQueryProcedure<{
            input: void;
            output: import("../runner").RunnerStatus;
            meta: object;
        }>;
    }>>;
}>>;
export type AppRouter = typeof appRouter;
