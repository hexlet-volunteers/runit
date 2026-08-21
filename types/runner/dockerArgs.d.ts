import type { LanguageSpec } from './languages';
import type { RunLimits } from './types';
export interface DockerArgsParams {
    spec: LanguageSpec;
    limits: RunLimits;
    /** Имя контейнера — по нему гарантированно убираем его при таймауте. */
    containerName: string;
    imageTag: string;
    /** Имя файла внутри /app. */
    fileName: string;
    /** Путь к seccomp-профилю на хосте. Не задан — работает профиль docker. */
    seccompProfile?: string;
}
/**
 * Пролог внутри контейнера: раскодировать первую строку stdin в файл и запустить
 * язык.
 *
 * `IFS= read -r` читает ровно одну строку и не трогает обратные слэши, а
 * base64 — одна строка без переводов, поэтому дальше в stdin остаётся ровно то,
 * что пользователь ввёл во вкладке «Ввод». `exec` заменяет оболочку процессом
 * языка: не остаётся лишнего процесса, и сигналы доходят напрямую.
 */
export declare function bootstrap(containerPath: string, spec: LanguageSpec): string;
export declare function buildDockerArgs(params: DockerArgsParams): string[];
