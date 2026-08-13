import { z } from 'zod/v4';
/**
 * Дев-значения совпадают с .env.example намеренно: это не «почти секрет», а
 * заведомо публичная строка, и проверка ниже не даёт увезти её в прод.
 */
export declare const DEV_ACCESS_SECRET = "dev-only-access-secret-not-for-production";
export declare const DEV_REFRESH_SECRET = "dev-only-refresh-secret-not-for-production";
declare const envSchema: z.ZodPipe<z.ZodObject<{
    NODE_ENV: z.ZodDefault<z.ZodEnum<{
        development: "development";
        test: "test";
        production: "production";
    }>>;
    HOST: z.ZodDefault<z.ZodString>;
    PORT: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    DB_PATH: z.ZodDefault<z.ZodString>;
    JWT_ACCESS_SECRET: z.ZodOptional<z.ZodString>;
    JWT_REFRESH_SECRET: z.ZodOptional<z.ZodString>;
    CORS_ORIGIN: z.ZodDefault<z.ZodString>;
    LOG_LEVEL: z.ZodOptional<z.ZodEnum<{
        error: "error";
        fatal: "fatal";
        warn: "warn";
        info: "info";
        debug: "debug";
        trace: "trace";
        silent: "silent";
    }>>;
}, z.core.$strip>, z.ZodTransform<{
    JWT_ACCESS_SECRET: string;
    JWT_REFRESH_SECRET: string;
    LOG_LEVEL: "error" | "fatal" | "warn" | "info" | "debug" | "trace" | "silent";
    NODE_ENV: "development" | "test" | "production";
    HOST: string;
    PORT: number;
    DB_PATH: string;
    CORS_ORIGIN: string;
}, {
    NODE_ENV: "development" | "test" | "production";
    HOST: string;
    PORT: number;
    DB_PATH: string;
    CORS_ORIGIN: string;
    JWT_ACCESS_SECRET?: string | undefined;
    JWT_REFRESH_SECRET?: string | undefined;
    LOG_LEVEL?: "error" | "fatal" | "warn" | "info" | "debug" | "trace" | "silent" | undefined;
}>>;
export type Env = z.infer<typeof envSchema>;
export declare const env: Env;
export {};
