export declare const runnerConfig: {
    enabled: boolean;
    dockerBin: string;
    imagePrefix: string;
    imageTag: string;
    tmpDir: string;
    /**
     * Путь к seccomp-профилю (#860). Пусто — работает штатный профиль docker.
     * Задавать имеет смысл только полный выверенный аллоулист: свой файл
     * заменяет дефолтный профиль, а не дополняет его.
     */
    seccompProfile: string | undefined;
    maxConcurrent: number;
    enabledLanguages: ("typescript" | "python" | "php" | "ruby" | "java" | "go" | "cpp" | "sql" | "bash")[];
    /** Базовые лимиты; на язык уточняются в languages.ts. */
    limits: {
        timeoutMs: number;
        memory: string;
        cpus: string;
        pidsLimit: number;
        maxOutputBytes: number;
        maxFileBytes: number;
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
