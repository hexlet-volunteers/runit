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
  /**
   * Настройка /tmp — единственного writable места при read-only rootfs.
   * По умолчанию 16 МБ без права исполнения. Компилируемым языкам нужно и
   * место под кэш сборки, и право запустить собранный бинарник: у них цель
   * запуска — именно исполнение свежескомпилированного файла.
   */
  tmpfs?: { size: string; allowExec?: boolean };
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
  typescript: {
    id: 'typescript',
    imageDir: 'typescript',
    fileName: () => 'main.ts',
    // Node 24 исполняет .ts напрямую (type stripping) — компилятор и сеть не нужны.
    // Типы при этом НЕ проверяются: это runtime-запуск, а не tsc.
    command: (p) => ['node', p],
  },
  go: {
    id: 'go',
    imageDir: 'go',
    fileName: () => 'main.go',
    command: (p) => ['go', 'run', p],
    // Компиляция требует кэш и заметно больше ресурсов, чем скриптовые языки.
    // GOCACHE/GOPATH ведут в /tmp — единственное writable место при read-only rootfs.
    env: {
      GOCACHE: '/tmp/gocache',
      GOPATH: '/tmp/go',
      GOFLAGS: '-buildvcs=false',
    },
    // Go компилирует и стандартную библиотеку: 16 МБ /tmp кончались на первом
    // же пакете («no space left on device»), а 8 МБ на файл — на архивах.
    limits: {
      memory: '768m',
      timeoutMs: 20_000,
      pidsLimit: 256,
      maxFileBytes: 64 * 1024 * 1024,
    },
    // go run складывает бинарник в кэш и запускает его оттуда.
    tmpfs: { size: '320m', allowExec: true },
  },
  cpp: {
    id: 'cpp',
    imageDir: 'cpp',
    fileName: () => 'main.cpp',
    // Компиляция и запуск одной командой: бинарник кладём в /tmp (rootfs read-only).
    // sh -c исполняется ВНУТРИ изолированного контейнера; пользовательский код лежит
    // в файле и в командную строку не подставляется, поэтому инъекции нет.
    command: (p) => [
      'sh',
      '-c',
      `g++ -O0 -std=c++20 -o /tmp/app ${p} && exec /tmp/app`,
    ],
    limits: {
      memory: '512m',
      timeoutMs: 20_000,
      pidsLimit: 256,
      maxFileBytes: 32 * 1024 * 1024,
    },
    // Без права исполнения на /tmp собранный /tmp/app не запускался: exec давал
    // «Permission denied» уже после успешной компиляции.
    tmpfs: { size: '64m', allowExec: true },
  },
  sql: {
    id: 'sql',
    imageDir: 'sql',
    fileName: () => 'main.sql',
    // Скрипт выполняется в базе в памяти: состояние между запусками не сохраняется.
    command: (p) => [
      'sh',
      '-c',
      `sqlite3 -batch -header -column :memory: < ${p}`,
    ],
  },
  bash: {
    id: 'bash',
    imageDir: 'bash',
    fileName: () => 'main.sh',
    command: (p) => ['bash', p],
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
