// Контракт серверного раннера кода.
// JavaScript сюда не входит: он исполняется в браузере (Web Worker) — см. README,
// раздел «Серверное исполнение кода». Архивный вариант на node:vm не переносился
// сознательно: vm не является границей безопасности.

export const RUNNER_LANGUAGES = ['python', 'php', 'ruby', 'java'] as const;

export type RunnerLanguage = (typeof RUNNER_LANGUAGES)[number];

export type RunStatus =
  /** Контейнер запустился и завершился сам. exitCode может быть != 0 (ошибка в коде пользователя). */
  | 'ok'
  /** Убит по wall-clock таймауту. */
  | 'timeout'
  /** Убит из-за превышения лимита вывода. */
  | 'output_limit'
  /** Нет docker CLI / демона / образа, либо раннер выключен. */
  | 'unavailable'
  /** Нет свободного слота исполнения. */
  | 'busy'
  /** Непредвиденная ошибка на нашей стороне. */
  | 'internal_error';

export interface RunOutput {
  status: RunStatus;
  language: string;
  /** Сырой текст, без разбиения на строки — представление на стороне клиента. */
  stdout: string;
  /** Отдельно от stdout, чтобы клиент мог покрасить ошибки. */
  stderr: string;
  /** null, если процесс убит сигналом или не стартовал. */
  exitCode: number | null;
  durationMs: number;
  truncated: boolean;
  /** Готовая человекочитаемая строка для показа как `system`. */
  message: string | null;
}

export interface RunLimits {
  timeoutMs: number;
  memory: string;
  cpus: string;
  pidsLimit: number;
  maxOutputBytes: number;
}
