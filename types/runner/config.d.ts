export declare const runnerConfig: {
    enabled: boolean;
    dockerBin: string;
    imagePrefix: string;
    imageTag: string;
    tmpDir: string;
    maxConcurrent: number;
    enabledLanguages: ("python" | "php" | "ruby" | "java" | "typescript" | "go" | "cpp" | "sql" | "bash")[];
    /** Базовые лимиты; на язык уточняются в languages.ts. */
    limits: {
        timeoutMs: number;
        memory: string;
        cpus: string;
        pidsLimit: number;
        maxOutputBytes: number;
    };
    /** Максимальные размеры входных данных (первая линия защиты, до docker). */
    maxCodeBytes: number;
    maxStdinBytes: number;
};
export declare const imageTagFor: (language: string) => string;
/**
 * Окружение для процесса docker CLI — строгий allowlist.
 * Секреты приложения (JWT, DB_PATH) не должны попасть ни в CLI, ни в контейнер.
 */
export declare const dockerEnv: () => NodeJS.ProcessEnv;
