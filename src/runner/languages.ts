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

const JAVA_CLASS_RE = /(?:public\s+)?class\s+([A-Za-z_$][\w$]*)/;

export const LANGUAGE_SPECS: Record<RunnerLanguage, LanguageSpec> = {
  python: {
    id: 'python',
    imageDir: 'python',
    fileName: () => 'main.py',
    // -u отключает буферизацию: при убийстве по таймауту вывод, напечатанный
    // до зацикливания, всё равно доходит до пользователя.
    command: (p) => ['python', '-u', p],
    env: { PYTHONDONTWRITEBYTECODE: '1' },
  },
  php: {
    id: 'php',
    imageDir: 'php',
    fileName: () => 'main.php',
    // `php -f` требует открывающий тег. Сниппеты вида `echo 'Hello';` — обычное дело,
    // поэтому дописываем тег без перевода строки, чтобы не сдвинуть нумерацию строк
    // в сообщениях об ошибках.
    prepare: (code) => (/^\s*<\?(php|=)/.test(code) ? code : `<?php ${code}`),
    command: (p) => ['php', '-f', p],
  },
  ruby: {
    id: 'ruby',
    imageDir: 'ruby',
    fileName: () => 'main.rb',
    command: (p) => ['ruby', p],
  },
  java: {
    id: 'java',
    imageDir: 'java',
    // Имя файла обязано совпадать с именем public-класса, иначе компилятор
    // выдаёт невнятную ошибку вместо результата.
    fileName: (code) => `${code.match(JAVA_CLASS_RE)?.[1] ?? 'Main'}.java`,
    // -XX:-UsePerfData убирает запись hsperfdata (rootfs только для чтения) и ускоряет старт.
    command: (p) => ['java', '-XX:-UsePerfData', p],
    // JVM тяжелее скриптовых языков: больше памяти, потоков и времени на старт.
    limits: { memory: '512m', pidsLimit: 256, timeoutMs: 20_000 },
  },
};

export const specFor = (language: RunnerLanguage): LanguageSpec =>
  LANGUAGE_SPECS[language];
