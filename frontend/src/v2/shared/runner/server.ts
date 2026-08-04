import type { ConsoleLine, RunResult } from './types';

// Серверное исполнение (Python/PHP/Ruby/Java) через tRPC-процедуру runner.run.
// Бэкенд запускает код в изолированном docker-контейнере и возвращает stdout/stderr
// раздельно, поэтому ошибки можно покрасить.

/** Минимальный контракт ответа бэкенда (src/runner/types.ts). */
export interface ServerRunOutput {
  status:
    | 'ok'
    | 'timeout'
    | 'output_limit'
    | 'unavailable'
    | 'busy'
    | 'internal_error';
  stdout: string;
  stderr: string;
  exitCode: number | null;
  durationMs: number;
  truncated: boolean;
  message: string | null;
}

/** Клиент передаётся аргументом, чтобы shared/ не зависел от React-хуков. */
export interface RunnerClient {
  runner: {
    run: {
      mutate: (
        input: { language: string; code: string; stdin?: string },
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

  // Инфраструктурные статусы: подсказку показываем первой строкой.
  if (
    out.status === 'unavailable' ||
    out.status === 'busy' ||
    out.status === 'internal_error'
  ) {
    lines.push({
      type: 'system',
      text: out.message ?? 'Серверное исполнение недоступно.',
    });
  }

  lines.push(...toLines(out.stdout, 'log'));
  lines.push(...toLines(out.stderr, 'error'));

  if (out.status === 'timeout') {
    lines.push({
      type: 'error',
      text: out.message ?? 'Превышен лимит времени',
    });
  }
  if (out.status === 'output_limit' || (out.status === 'ok' && out.truncated)) {
    lines.push({
      type: 'system',
      text: out.message ?? 'Вывод обрезан',
    });
  }

  return {
    lines,
    exitCode: out.exitCode ?? (out.status === 'timeout' ? 124 : 1),
    durationMs: out.durationMs,
  };
}

export async function runOnServer(
  client: RunnerClient,
  params: { language: string; code: string; stdin?: string },
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
