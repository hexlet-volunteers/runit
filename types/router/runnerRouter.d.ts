export declare const runnerRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: object;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    /**
     * mutation, а не query: у запуска есть побочные эффекты, его нельзя кэшировать
     * и повторять; query в tRPC ушла бы GET-ом с кодом в URL (в src/index.ts
     * стоит maxParamLength: 1000, плюс код попал бы в логи прокси).
     *
     * Процедура не бросает на инфраструктурных сбоях (нет docker, занято) —
     * возвращает status, иначе клиент получил бы 500 и вечный спиннер.
     */
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
