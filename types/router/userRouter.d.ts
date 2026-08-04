export declare const userRouter: import("@trpc/server").TRPCBuiltRouter<{
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
