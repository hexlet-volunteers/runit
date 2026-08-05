import os from 'node:os';
import { RUNNER_LANGUAGES, type RunLimits, type RunnerLanguage } from './types';

// Конфигурация раннера читается отдельно от src/config/env.ts, чтобы не конфликтовать
// с параллельной работой над auth-контуром.
// TODO(#864): после мержа PR #907 перенести эти переменные в единый модуль env.

const num = (raw: string | undefined, fallback: number): number => {
  if (!raw) return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const bool = (raw: string | undefined, fallback: boolean): boolean => {
  if (raw === undefined) return fallback;
  return raw !== 'false' && raw !== '0';
};

const languages = (raw: string | undefined): RunnerLanguage[] => {
  if (!raw) return [...RUNNER_LANGUAGES];
  const allowed = raw
    .split(',')
    .map((part) => part.trim())
    .filter((part): part is RunnerLanguage =>
      (RUNNER_LANGUAGES as readonly string[]).includes(part),
    );
  return allowed.length > 0 ? allowed : [...RUNNER_LANGUAGES];
};

export const runnerConfig = {
  enabled: bool(process.env.RUNNER_ENABLED, true),
  dockerBin: process.env.RUNNER_DOCKER_BIN || 'docker',
  imagePrefix: process.env.RUNNER_IMAGE_PREFIX || 'runit-runner',
  imageTag: process.env.RUNNER_IMAGE_TAG || '1',
  tmpDir: process.env.RUNNER_TMP_DIR || os.tmpdir(),
  /**
   * Путь к seccomp-профилю (#860). Пусто — работает штатный профиль docker.
   * Задавать имеет смысл только полный выверенный аллоулист: свой файл
   * заменяет дефолтный профиль, а не дополняет его.
   */
  seccompProfile: process.env.RUNNER_SECCOMP_PROFILE || undefined,
  maxConcurrent: num(process.env.RUNNER_MAX_CONCURRENT, 4),
  enabledLanguages: languages(process.env.RUNNER_LANGUAGES),
  /** Базовые лимиты; на язык уточняются в languages.ts. */
  limits: {
    timeoutMs: num(process.env.RUNNER_TIMEOUT_MS, 10_000),
    memory: process.env.RUNNER_MEMORY || '256m',
    cpus: process.env.RUNNER_CPUS || '1',
    pidsLimit: num(process.env.RUNNER_PIDS_LIMIT, 64),
    maxOutputBytes: num(process.env.RUNNER_MAX_OUTPUT_BYTES, 64 * 1024),
    maxFileBytes: num(process.env.RUNNER_MAX_FILE_BYTES, 8 * 1024 * 1024),
  } satisfies RunLimits,
  /** Максимальные размеры входных данных (первая линия защиты, до docker). */
  maxCodeBytes: num(process.env.RUNNER_MAX_CODE_BYTES, 64 * 1024),
  maxStdinBytes: num(process.env.RUNNER_MAX_STDIN_BYTES, 16 * 1024),
};

export const imageTagFor = (language: string): string =>
  `${runnerConfig.imagePrefix}-${language}:${runnerConfig.imageTag}`;

/**
 * Окружение для процесса docker CLI — строгий allowlist.
 * Секреты приложения (JWT, DB_PATH) не должны попасть ни в CLI, ни в контейнер.
 */
export const dockerEnv = (): NodeJS.ProcessEnv => {
  const allowed = [
    'PATH',
    'HOME',
    'DOCKER_HOST',
    'DOCKER_CONTEXT',
    'DOCKER_CONFIG',
    'DOCKER_TLS_VERIFY',
    'DOCKER_CERT_PATH',
  ];
  const env: NodeJS.ProcessEnv = {};
  for (const key of allowed) {
    const value = process.env[key];
    if (value !== undefined) env[key] = value;
  }
  return env;
};
