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
            } | null;
            meta: object;
        }>;
        deleteUser: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                id: number;
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
            output: any;
            meta: object;
        }>;
        getData: import("@trpc/server").TRPCQueryProcedure<{
            input: number;
            output: any;
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
                language: "ruby" | "java" | "php" | "python" | "javascript" | "html";
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
                language?: "ruby" | "java" | "php" | "python" | "javascript" | "html" | undefined;
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
}>>;
export type AppRouter = typeof appRouter;
