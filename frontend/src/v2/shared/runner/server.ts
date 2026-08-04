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
  } catch {
    // Сеть недоступна / сервер не отвечает — не роняем UI и не крутим спиннер вечно.
    return {
      lines: [
        {
          type: 'system',
          text: 'Сервер исполнения недоступен, попробуйте позже.',
        },
      ],
      exitCode: 1,
      durationMs: Math.round(performance.now() - started),
    };
  }
}
