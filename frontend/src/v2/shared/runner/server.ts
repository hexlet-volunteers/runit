import type { ConsoleLine, RunResult } from './types';

// Серверное исполнение (Python/PHP/Ruby/Java) через tRPC-процедуру runner.run.
// Бэкенд запускает код в изолированном docker-контейнере и возвращает stdout/stderr
// раздельно, поэтому ошибки можно покрасить.

/**
 * Контракт ответа бэкенда (src/runner/types.ts).
 *
 * Поля опциональные не случайно: tRPC описывает ответ как JSON-совместимый тип,
 * где nullable-поля становятся необязательными. Читаем их со значениями по
 * умолчанию, чтобы неполный ответ не ломал интерфейс.
 */
export interface ServerRunOutput {
  status?:
    | 'ok'
    | 'timeout'
    | 'output_limit'
    | 'unavailable'
    | 'busy'
    | 'internal_error';
  stdout?: string;
  stderr?: string;
  exitCode?: number | null;
  durationMs?: number;
  truncated?: boolean;
  message?: string | null;
}

/**
 * Языки, которые исполняет сервер. Union обязан совпадать с RUNNER_LANGUAGES
 * на бэкенде: иначе типы tRPC-процедуры и этого клиента разъезжаются.
 */
export type ServerLanguage =
  | 'python'
  | 'php'
  | 'ruby'
  | 'java'
  | 'typescript'
  | 'go'
  | 'cpp'
  | 'sql'
  | 'bash';

/** Клиент передаётся аргументом, чтобы shared/ не зависел от React-хуков. */
export interface RunnerClient {
  runner: {
    run: {
      mutate: (
        input: { language: ServerLanguage; code: string; stdin?: string },
        opts?: { signal?: AbortSignal },
      ) => Promise<ServerRunOutput>;
    };
  };
}

/** Разбивает поток в строки, не создавая фантомной пустой строки в хвосте. */
const toLines = (raw: string, type: ConsoleLine['type']): ConsoleLine[] => {
  if (!raw) return [];
  return raw
    .replace(/\n$/, '')
    .split('\n')
    .map((text) => ({ type, text }));
};

export function toRunResult(out: ServerRunOutput): RunResult {
  const lines: ConsoleLine[] = [];
  const status = out.status ?? 'internal_error';
  const stdout = out.stdout ?? '';
  const stderr = out.stderr ?? '';

  // Инфраструктурные статусы: подсказку показываем первой строкой.
  if (status === 'unavailable' || status === 'busy' || status === 'internal_error') {
    lines.push({
      type: 'system',
      text: out.message ?? 'Серверное исполнение недоступно.',
    });
  }

  lines.push(...toLines(stdout, 'log'));
  lines.push(...toLines(stderr, 'error'));

  if (status === 'timeout') {
    lines.push({
      type: 'error',
      text: out.message ?? 'Превышен лимит времени',
    });
  }
  if (status === 'output_limit' || (status === 'ok' && out.truncated)) {
    lines.push({
      type: 'system',
      text: out.message ?? 'Вывод обрезан',
    });
  }

  return {
    lines,
    exitCode: out.exitCode ?? (status === 'timeout' ? 124 : 1),
    durationMs: out.durationMs ?? 0,
  };
}

/**
 * Отличает истёкшее ожидание от обрыва связи.
 *
 * AbortSignal.timeout бросает DOMException с именем TimeoutError, а клиент tRPC
 * заворачивает её в свою ошибку — поэтому смотрим и на саму ошибку, и на
 * причину.
 */
const isTimeout = (error: unknown): boolean => {
  const names = [error, (error as { cause?: unknown } | null)?.cause]
    .filter(Boolean)
    .map((e) => (e as { name?: string }).name);
  return names.includes('TimeoutError') || names.includes('AbortError');
};

export async function runOnServer(
  client: RunnerClient,
  params: { language: ServerLanguage; code: string; stdin?: string },
  /** Клиентский таймаут с запасом над серверным (java — 20 c). */
  timeoutMs = 30_000,
): Promise<RunResult> {
  const started = performance.now();
  try {
    const out = await client.runner.run.mutate(params, {
      signal: AbortSignal.timeout(timeoutMs),
    });
    return toRunResult(out);
  } catch (error) {
    /**
     * Сюда попадают только сбои связи: если сервер ответил, но исполнение
     * недоступно (нет docker, язык выключен), это нормальный ответ со статусом
     * unavailable и своим сообщением — он идёт через toRunResult выше.
     *
     * Прежний текст «Сервер исполнения недоступен» этих случаев не различал и
     * вводил в заблуждение: при остановленном бэкенде человек читал, что не
     * работает запуск кода, и шёл искать проблему в раннере — хотя не отвечало
     * само приложение.
     */
    return {
      lines: [
        {
          type: 'system',
          text: isTimeout(error)
            ? `Ответ не пришёл за ${Math.round(timeoutMs / 1000)} с. Запуск слишком долгий или сервер перегружен.`
            : 'Не удалось связаться с сервером — проверьте соединение и попробуйте снова.',
        },
      ],
      exitCode: 1,
      durationMs: Math.round(performance.now() - started),
    };
  }
}
