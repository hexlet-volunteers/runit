import type { LanguageSpec } from './languages';
import type { RunLimits } from './types';
export interface DockerArgsParams {
    spec: LanguageSpec;
    limits: RunLimits;
    /** Имя контейнера — по нему гарантированно убираем его при таймауте. */
    containerName: string;
    /** Каталог на хосте с файлом кода (монтируется только для чтения). */
    hostCodeDir: string;
    imageTag: string;
    /** Имя файла внутри /app. */
    fileName: string;
    /** Путь к seccomp-профилю на хосте. Не задан — работает профиль docker. */
    seccompProfile?: string;
}
/**
 * Сборка argv для `docker run`. Единственное место, где живёт модель изоляции
 * песочницы (#860) — поэтому функция чистая и покрыта юнит-тестами: любое
 * ослабление флагов ломает тест.
 *
 * Никогда не добавлять: --privileged, -v /var/run/docker.sock, --cap-add,
 * --security-opt seccomp=unconfined, --pid=host, --net=host.
 */
export declare function buildDockerArgs(params: DockerArgsParams): string[];
