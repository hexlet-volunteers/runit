export declare const authRouter: import("@trpc/server").TRPCBuiltRouter<{
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
            consentVersion: string;
        };
        output: {
            user: import("../auth/publicUser").PublicUser;
            csrfToken: string;
        };
        meta: object;
    }>;
    /**
     * Анти-брутфорс на вход (#858) — счётчик неудач по email (см.
     * src/auth/bruteforce.ts). Лимит по IP из security.ts не останавливает
     * перебор пароля одного аккаунта с разных адресов; этот счётчик — нет.
     *
     * Блокировка проверяется до обращения к паролю: заблокированный email не
     * должен получать никакой информации о том, существует ли пользователь и
     * верен ли пароль — реагирует только на превышение попыток.
     */
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
    /**
     * Смена пароля из настроек (#770).
     *
     * Текущий пароль спрашиваем даже при живой сессии: иначе угнанная вкладка
     * или XSS дают злоумышленнику сменить пароль и отобрать аккаунт целиком.
     * После смены все сессии, кроме текущей, гасим — старый пароль перестаёт
     * давать доступ, в том числе тому, кто уже вошёл с ним раньше.
     */
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
    /**
     * Свежий CSRF-токен для уже существующей сессии.
     *
     * Нужен из-за перезагрузки страницы: сессия живёт в cookie и переживает
     * перезагрузку, а токен — нет. Он намеренно хранится в памяти вкладки (а не в
     * localStorage, иначе его прочитал бы любой скрипт), и после F5 у клиента
     * оказывалась рабочая сессия без токена — первая же мутация получала 403.
     *
     * Вывести токен из cookie на клиенте нельзя: в cookie лежит секрет, а токен
     * — производная от него, и считает её только сервер.
     *
     * Это query (GET), поэтому сама она под проверку CSRF не попадает; выдавать
     * токен безопасно — прочитать ответ с чужого origin мешает CORS, а без
     * cookie сессии токен ничего не открывает.
     */
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
