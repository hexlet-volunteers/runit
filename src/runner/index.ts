import { z } from 'zod/v4';
import { checkDaemon } from './availability';
import { runnerConfig } from './config';
import { RUNNER_LANGUAGES } from './types';

export { runCode, sweepOrphans } from './run';
export type { RunnerLanguage, RunOutput, RunStatus } from './types';

// Лимиты здесь — первая линия защиты: до mkdtemp и docker дело не доходит,
// tRPC отвечает 400.
export const runInputSchema = z.object({
  language: z.enum(RUNNER_LANGUAGES),
  code: z.string().min(1).max(runnerConfig.maxCodeBytes),
  stdin: z.string().max(runnerConfig.maxStdinBytes).default(''),
});

export interface RunnerStatus {
  /** Языки, исполняемые на сервере (JavaScript исполняется в браузере). */
  languages: string[];
  available: boolean;
  message: string | null;
}

export async function runnerStatus(): Promise<RunnerStatus> {
  const daemon = await checkDaemon();
  return {
    languages: runnerConfig.enabledLanguages,
    available: daemon.ok,
    message: daemon.ok ? null : daemon.message,
  };
}
