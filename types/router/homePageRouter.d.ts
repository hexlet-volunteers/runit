/**
 * Секции главной страницы.
 *
 * Мутации назывались admin*, но были объявлены publicProcedure с TODO «добавить
 * проверку прав» — то есть содержимое лендинга мог менять любой посетитель.
 * Это остаток #792: тогда закрыли процедуры пользователей и сниппетов, а этот
 * роутер пропустили, потому что фронтенд его не вызывает.
 *
 * Чтение остаётся публичным: лендинг открыт всем.
 *
 * Замечание на будущее: интерфейс эти данные не использует — главная страница
 * собрана в React статически. Либо появится редактор секций, либо роутер вместе
 * с таблицей sections стоит удалить; решать это отдельно от закрытия дыры.
 */
export declare const homePageRouter: import("@trpc/server").TRPCBuiltRouter<{
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
