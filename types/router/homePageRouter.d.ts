export declare const homePageRouter: import("@trpc/server").TRPCBuiltRouter<{
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
