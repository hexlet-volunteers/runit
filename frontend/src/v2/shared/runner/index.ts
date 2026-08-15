import { runJavaScript } from './javascript';
import { type RunnerClient, type ServerLanguage, runOnServer } from './server';
import type { RunResult } from './types';

export type { ConsoleLine, RunResult } from './types';
export type { RunnerClient, ServerLanguage, ServerRunOutput } from './server';
export { runJavaScript } from './javascript';
export { toRunResult } from './server';
export {
  RUNNER_STATUS_QUERY_KEY,
  unavailableReason,
  useRunnerStatus,
} from './useRunnerStatus';
export type { RunnerStatus, RunnerStatusClient } from './useRunnerStatus';

/**
 * Языки, которые исполняет сервер (в docker) — список должен совпадать с
 * RUNNER_LANGUAGES на бэкенде (src/runner/types.ts).
 * JavaScript исполняется в браузере (Web Worker), HTML/CSS — рендерятся как превью.
 */
export const SERVER_LANGUAGES = new Set([
  'python',
  'php',
  'ruby',
  'java',
  'typescript',
  'go',
  'cpp',
  'sql',
  'bash',
]);

export interface RunCodeParams {
  language: string;
  code: string;
  stdin?: string;
  /** tRPC-клиент; нужен только для серверных языков. */
  client?: RunnerClient;
}

/**
 * Единая точка запуска кода.
 * JavaScript — в браузере (быстро, офлайн), остальные языки — на сервере (#821).
 */
export async function runCode(params: RunCodeParams): Promise<RunResult> {
  const { language, code, stdin = '', client } = params;

  if (language === 'javascript') {
    return runJavaScript(code, stdin);
  }

  if (SERVER_LANGUAGES.has(language)) {
    if (!client) {
      return {
        lines: [
          {
            type: 'system',
            text: 'Серверное исполнение недоступно в этом виджете.',
          },
        ],
        exitCode: 1,
        durationMs: 0,
      };
    }
    // Принадлежность к SERVER_LANGUAGES проверена строкой выше.
    return runOnServer(client, { language: language as ServerLanguage, code, stdin });
  }

  return unsupportedLanguage(language);
}

/** Языки без среды исполнения (html — превью, #852; typescript — #616). */
export function unsupportedLanguage(language: string): RunResult {
  return {
    lines: [
      {
        type: 'system',
        text: `Среда исполнения для «${language}» появится позже.`,
      },
    ],
    exitCode: 0,
    durationMs: 0,
  };
}
