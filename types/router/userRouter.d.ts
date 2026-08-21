export declare const userRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../context").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    /**
     * Публичная карточка пользователя (подпись автора у сниппета, страница
     * профиля). Отдаёт только id/username/createdAt — см. toPublicProfile.
     * Свои полные данные пользователь получает через auth.me.
     */
    getUserById: import("@trpc/server").TRPCQueryProcedure<{
        input: unknown;
        output: import("../auth/publicUser").PublicProfile;
        meta: object;
    }>;
    /** См. getUserById — та же публичная проекция, поиск по имени. */
    getUserByUsername: import("@trpc/server").TRPCQueryProcedure<{
        input: string;
        output: import("../auth/publicUser").PublicProfile;
        meta: object;
    }>;
    /**
     * Поиск по email — только для админов. Публичный маршрут здесь работал как
     * оракул «есть ли такой email в базе»: по нему проверяют утёкшие адреса и
     * подбирают цели для брутфорса. Вход выдаёт одинаковую ошибку для неверного
     * email и неверного пароля именно чтобы такого оракула не было (auth.login).
     */
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
    /**
     * Изменение своего профиля (имя, email). Пароль сюда не входит — он меняется
     * через auth.changePassword, где проверяется текущий пароль.
     */
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
    /**
     * Удаление аккаунта — своего или, для админа, любого. Каскад по сниппетам,
     * настройкам и токенам обеспечен onDelete: 'cascade' в схеме (#834).
     */
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
        input: unknown;
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
    /**
     * Настройки вместе со сниппетами — включая приватные, поэтому только свои.
     * Публичный список сниппетов профиля живёт в snippets.getPublicSnippetsByUsername.
     */
    getData: import("@trpc/server").TRPCQueryProcedure<{
        input: unknown;
        output: {
            currentUser: import("../db/users").SafeUser & {
                language: string;
                theme: string;
                avatarBase64: string | null;
            };
            snippets: ({
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
                user: import("../db/users").SafeUser;
            })[];
        };
        meta: object;
    }>;
}>>;
