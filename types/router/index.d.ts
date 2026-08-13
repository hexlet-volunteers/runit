export declare const appRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../context").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    auth: import("@trpc/server").TRPCBuiltRouter<{
        ctx: import("../context").Context;
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
    }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
        register: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                username: string;
                email: string;
                password: string;
            };
            output: {
                user: import("../auth/publicUser").PublicUser;
                csrfToken: string;
            };
            meta: object;
        }>;
        login: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                email: string;
                password: string;
            };
            output: {
                user: import("../auth/publicUser").PublicUser;
                csrfToken: string;
            };
            meta: object;
        }>;
        logout: import("@trpc/server").TRPCMutationProcedure<{
            input: void;
            output: {
                success: boolean;
            };
            meta: object;
        }>;
        refresh: import("@trpc/server").TRPCMutationProcedure<{
            input: void;
            output: {
                success: boolean;
                csrfToken: string;
            };
            meta: object;
        }>;
        changePassword: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                currentPassword: string;
                newPassword: string;
            };
            output: {
                success: boolean;
                csrfToken: string;
            };
            meta: object;
        }>;
        csrfToken: import("@trpc/server").TRPCQueryProcedure<{
            input: void;
            output: {
                csrfToken: string;
            };
            meta: object;
        }>;
        me: import("@trpc/server").TRPCQueryProcedure<{
            input: void;
            output: {
                user: import("../auth/publicUser").PublicUser;
            };
            meta: object;
        }>;
    }>>;
    users: import("@trpc/server").TRPCBuiltRouter<{
        ctx: import("../context").Context;
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
    }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
        getUserById: import("@trpc/server").TRPCQueryProcedure<{
            input: number;
            output: import("../auth/publicUser").PublicProfile;
            meta: object;
        }>;
        getUserByUsername: import("@trpc/server").TRPCQueryProcedure<{
            input: string;
            output: import("../auth/publicUser").PublicProfile;
            meta: object;
        }>;
        getUserByEmail: import("@trpc/server").TRPCQueryProcedure<{
            input: string;
            output: import("../auth/publicUser").PublicUser;
            meta: object;
        }>;
        getAllUsers: import("@trpc/server").TRPCQueryProcedure<{
            input: void;
            output: import("../db/users").SafeUser[];
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
            output: import("../db/users").SafeUser;
            meta: object;
        }>;
        updateUser: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                id: number;
                username?: string | undefined;
                email?: string | undefined;
            };
            output: import("../db/users").SafeUser;
            meta: object;
        }>;
        setUserRole: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                id: number;
                isAdmin: boolean;
            };
            output: import("../db/users").SafeUser;
            meta: object;
        }>;
        deleteUser: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                id: unknown;
            };
            output: {
                success: boolean;
                id: number;
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
                currentUser: import("../db/users").SafeUser & {
                    language: string;
                    theme: string;
                    avatarBase64: string | null;
                };
                snippets: ({
                    id: number;
                    code: string;
                    name: string;
                    visibility: "link" | "private" | "public";
                    createdAt: Date;
                    updatedAt: Date;
                    userId: number | null;
                    language: string | null;
                    slug: string | null;
                    shortCode: string | null;
                } & {
                    user: import("../db/users").SafeUser;
                })[];
            };
            meta: object;
        }>;
    }>>;
    snippets: import("@trpc/server").TRPCBuiltRouter<{
        ctx: import("../context").Context;
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
    }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
        getSnippetById: import("@trpc/server").TRPCQueryProcedure<{
            input: unknown;
            output: {
                id: number;
                code: string;
                name: string;
                visibility: "link" | "private" | "public";
                createdAt: Date;
                updatedAt: Date;
                userId: number | null;
                language: string | null;
                slug: string | null;
                shortCode: string | null;
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
                code: string;
                name: string;
                visibility: "link" | "private" | "public";
                createdAt: Date;
                updatedAt: Date;
                userId: number | null;
                language: string | null;
                slug: string | null;
                shortCode: string | null;
            };
            meta: object;
        }>;
        getAllSnippets: import("@trpc/server").TRPCQueryProcedure<{
            input: void;
            output: {
                id: number;
                code: string;
                name: string;
                visibility: "link" | "private" | "public";
                createdAt: Date;
                updatedAt: Date;
                userId: number | null;
                language: string | null;
                slug: string | null;
                shortCode: string | null;
            }[];
            meta: object;
        }>;
        getMySnippets: import("@trpc/server").TRPCQueryProcedure<{
            input: void;
            output: {
                id: number;
                code: string;
                name: string;
                visibility: "link" | "private" | "public";
                createdAt: Date;
                updatedAt: Date;
                userId: number | null;
                language: string | null;
                slug: string | null;
                shortCode: string | null;
            }[];
            meta: object;
        }>;
        getPublicSnippetsByUsername: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                username: string;
            };
            output: {
                id: number;
                code: string;
                name: string;
                visibility: "link" | "private" | "public";
                createdAt: Date;
                updatedAt: Date;
                userId: number | null;
                language: string | null;
                slug: string | null;
                shortCode: string | null;
            }[];
            meta: object;
        }>;
        createSnippet: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                name: string;
                code: string;
                language: "javascript" | "typescript" | "python" | "php" | "ruby" | "java" | "go" | "cpp" | "sql" | "bash" | "html" | "css";
                slug?: string | undefined;
                visibility?: "link" | "private" | "public" | undefined;
            };
            output: {
                id: number;
                code: string;
                name: string;
                visibility: "link" | "private" | "public";
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
                visibility?: "link" | "private" | "public" | undefined;
            };
            output: {
                id: number;
                code: string;
                name: string;
                visibility: "link" | "private" | "public";
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
        getSnippetByShortCode: import("@trpc/server").TRPCQueryProcedure<{
            input: string;
            output: {
                id: number;
                code: string;
                name: string;
                visibility: "link" | "private" | "public";
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
        setVisibility: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                id: number;
                visibility: "link" | "private" | "public";
            };
            output: {
                id: number;
                code: string;
                name: string;
                visibility: "link" | "private" | "public";
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
    homePage: import("@trpc/server").TRPCBuiltRouter<{
        ctx: import("../context").Context;
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
        ctx: import("../context").Context;
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
