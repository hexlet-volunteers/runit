import type { RunLimits, RunnerLanguage } from './types';
export interface LanguageSpec {
    id: RunnerLanguage;
    /** Каталог с Dockerfile: runner-images/<imageDir>. */
    imageDir: string;
    /** Имя файла внутри контейнера (зависит от кода — например, имя Java-класса). */
    fileName: (code: string) => string;
    /** Подготовка кода перед записью (например, добавление <?php). */
    prepare?: (code: string) => string;
    /** argv команды; containerPath — путь к файлу внутри контейнера. */
    command: (containerPath: string) => string[];
    /** Переопределение базовых лимитов. */
    limits?: Partial<RunLimits>;
    /** Переменные окружения внутри контейнера. */
    env?: Record<string, string>;
}
export declare const LANGUAGE_SPECS: Record<RunnerLanguage, LanguageSpec>;
export declare const specFor: (language: RunnerLanguage) => LanguageSpec;
