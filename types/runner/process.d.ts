export interface ProcessResult {
    stdout: string;
    stderr: string;
    exitCode: number | null;
    signal: NodeJS.Signals | null;
    timedOut: boolean;
    truncated: boolean;
    /** 'ENOENT' — исполняемый файл (docker CLI) не найден. */
    spawnErrorCode?: string;
}
export interface RunProcessOptions {
    bin: string;
    args: string[];
    input: string;
    timeoutMs: number;
    maxOutputBytes: number;
    env: NodeJS.ProcessEnv;
    /** Вызывается перед убийством процесса — здесь удаляем контейнер. */
    onKill?: (reason: 'timeout' | 'output_limit') => void;
}
/**
 * Асинхронный запуск процесса с stdin, wall-clock таймаутом и лимитом вывода.
 *
 * Намеренно НЕ spawnSync/execSync (как было в архивном раннере): синхронный вызов
 * блокирует event loop Fastify на всё время исполнения (до 20 с), то есть один
 * бесконечный цикл в сниппете кладёт весь сервер.
 */
export declare function runProcess(opts: RunProcessOptions): Promise<ProcessResult>;
